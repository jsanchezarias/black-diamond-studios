import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../utils/supabase/info';
import { Card, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { X, Calendar, Clock, MapPin, CheckCircle, XCircle, Timer, Loader2, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

interface Cita {
  id: string;
  cliente_nombre: string;
  cliente_id: string;
  modelo_nombre: string;
  tipo_servicio: string;
  servicio: string;
  precio: number;
  fecha: string;
  hora: string;
  ubicacion: string;
  estado: string;
  habitacion: string | null;
  archivado: boolean;
  creado_por: string;
}

interface MisCitasPublicasModalProps {
  isOpen: boolean;
  onClose: () => void;
  clienteId: string;
}

export function MisCitasPublicasModal({ isOpen, onClose, clienteId }: MisCitasPublicasModalProps) {
  const [todasCitas, setTodasCitas] = useState<Cita[]>([]);
  const [loading, setLoading] = useState(true);
  const [seccion, setSeccion] = useState<'proximas' | 'historial'>('proximas');

  const cargarMisCitas = useCallback(async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { setLoading(false); return; }

      const { data, error } = await supabase
        .from('agendamientos')
        .select('id, cliente_nombre, cliente_id, modelo_nombre, tipo_servicio, servicio, precio, fecha, hora, ubicacion, estado, habitacion, archivado, creado_por')
        .or(`cliente_id.eq.${session.user.id},creado_por.eq.${session.user.email}`)
        .eq('archivado', false)
        .order('fecha', { ascending: false })
        .order('hora', { ascending: false });

      if (error) {
        if (process.env.NODE_ENV === 'development') console.error('Error cargando citas:', error.message);
        toast.error('No se pudieron cargar tus citas');
        setLoading(false);
        return;
      }

      setTodasCitas(data || []);
    } catch {
      toast.error('Error al conectar con el servidor');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isOpen || !clienteId) return;

    cargarMisCitas();

    const channel = supabase
      .channel('mis-citas-' + clienteId)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'agendamientos',
        filter: 'cliente_id=eq.' + clienteId
      }, () => { cargarMisCitas(); })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [isOpen, clienteId, cargarMisCitas]);

  if (!isOpen) return null;

  const hoy = new Date().toISOString().split('T')[0];

  const citasHoy = todasCitas.filter(a => {
    const fechaStr = a.fecha?.toString().split('T')[0];
    return fechaStr === hoy && !['completado', 'cancelado'].includes(a.estado);
  });

  const citasProximas = todasCitas.filter(a => {
    const fechaStr = a.fecha?.toString().split('T')[0];
    return fechaStr > hoy && !['completado', 'cancelado'].includes(a.estado);
  }).sort((a, b) => {
    const fa = new Date(a.fecha.split('T')[0] + 'T' + (a.hora || '00:00'));
    const fb = new Date(b.fecha.split('T')[0] + 'T' + (b.hora || '00:00'));
    return fa.getTime() - fb.getTime();
  });

  const citasHistorial = todasCitas.filter(a => {
    const fechaStr = a.fecha?.toString().split('T')[0];
    return fechaStr < hoy || ['completado', 'cancelado'].includes(a.estado);
  }).sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());

  const getStatusBadge = (estado: string) => {
    switch (estado) {
      case 'pendiente':
        return <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 text-[10px]"><Timer className="w-3 h-3 mr-1" /> Pendiente</Badge>;
      case 'aceptado_programador':
      case 'confirmado':
        return <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30 text-[10px]"><CheckCircle className="w-3 h-3 mr-1" /> Aceptada</Badge>;
      case 'aprobado':
        return <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-[10px]"><CheckCircle className="w-3 h-3 mr-1" /> Aprobada</Badge>;
      case 'completado':
        return <Badge className="bg-green-500/40 text-green-300 border-green-500/50 text-[10px]">Finalizada</Badge>;
      case 'cancelado':
        return <Badge className="bg-red-500/20 text-red-400 border-red-500/30 text-[10px]"><XCircle className="w-3 h-3 mr-1" /> Cancelada</Badge>;
      case 'no_show':
        return <Badge className="bg-gray-500/20 text-gray-400 border-gray-500/30 text-[10px]">No asistió</Badge>;
      default:
        return <Badge variant="outline" className="text-[10px]">{estado}</Badge>;
    }
  };

  const formatearFecha = (fecha: string) => {
    if (!fecha) return '';
    const fechaStr = fecha.split('T')[0];
    const [year, month, day] = fechaStr.split('-');
    if (!year || !month || !day) return fecha;
    const d = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    return d.toLocaleDateString('es-CO', { weekday: 'short', day: 'numeric', month: 'short' });
  };

  const formatearPrecio = (precio: number) => {
    if (!precio) return '';
    return '$' + Number(precio).toLocaleString('es-CO');
  };

  const renderCita = (cita: Cita) => (
    <div
      key={cita.id}
      className="bg-white/5 border border-white/10 rounded-xl p-4 hover:border-primary/40 transition-all"
    >
      <div className="flex items-start justify-between mb-2">
        <div>
          <p className="font-bold text-white text-sm">{cita.modelo_nombre || '—'}</p>
          <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
            <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{formatearFecha(cita.fecha)}</span>
            <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{cita.hora || '—'}</span>
          </div>
        </div>
        {getStatusBadge(cita.estado)}
      </div>

      <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-white/5 text-xs">
        <div>
          <p className="text-white/40 uppercase tracking-wider text-[10px] mb-0.5">Servicio</p>
          <p className="text-white/80 font-medium">{cita.tipo_servicio || cita.servicio || '—'}</p>
        </div>
        <div>
          <p className="text-white/40 uppercase tracking-wider text-[10px] mb-0.5">Valor</p>
          <p className="text-primary font-semibold">{formatearPrecio(cita.precio)}</p>
        </div>
        {cita.habitacion && (
          <div>
            <p className="text-white/40 uppercase tracking-wider text-[10px] mb-0.5">Habitación</p>
            <p className="text-white/80">{cita.habitacion}</p>
          </div>
        )}
        {(cita.ubicacion || cita.tipo_servicio?.toLowerCase().includes('domicilio')) && (
          <div>
            <p className="text-white/40 uppercase tracking-wider text-[10px] mb-0.5">Ubicación</p>
            <p className="text-white/80 flex items-center gap-1">
              <MapPin className="w-3 h-3 text-primary/60" />
              {cita.tipo_servicio?.toLowerCase().includes('domicilio') ? 'Domicilio' : (cita.ubicacion || 'Sede Principal')}
            </p>
          </div>
        )}
      </div>

      {cita.estado === 'pendiente' && (
        <div className="mt-3 flex items-center gap-2 p-2 bg-amber-500/10 rounded-lg border border-amber-500/20">
          <Timer className="w-3 h-3 text-amber-500 flex-shrink-0" />
          <p className="text-[10px] text-amber-200/80">Esperando confirmación del equipo...</p>
        </div>
      )}
    </div>
  );

  const citasActivasCount = citasHoy.length + citasProximas.length;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-in fade-in duration-300">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />

      <Card className="relative w-full max-w-2xl max-h-[85vh] overflow-hidden border-primary/30 bg-[#0f1014] text-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
              <Calendar className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-bold">Mis Reservas</h2>
              <p className="text-xs text-muted-foreground">
                {loading ? 'Cargando...' : `${todasCitas.length} reserva${todasCitas.length !== 1 ? 's' : ''} en total`}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={cargarMisCitas} variant="ghost" size="icon" className="hover:bg-white/10 rounded-full w-8 h-8" disabled={loading}>
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
            <Button onClick={onClose} variant="ghost" size="icon" className="hover:bg-white/10 rounded-full w-8 h-8">
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-white/10">
          <button
            onClick={() => setSeccion('proximas')}
            className={`flex-1 py-3 text-xs font-semibold uppercase tracking-wider transition-colors ${
              seccion === 'proximas'
                ? 'text-primary border-b-2 border-primary'
                : 'text-white/40 hover:text-white/70'
            }`}
          >
            Próximas {citasActivasCount > 0 && <span className="ml-1 bg-primary/20 text-primary rounded-full px-1.5 py-0.5">{citasActivasCount}</span>}
          </button>
          <button
            onClick={() => setSeccion('historial')}
            className={`flex-1 py-3 text-xs font-semibold uppercase tracking-wider transition-colors ${
              seccion === 'historial'
                ? 'text-primary border-b-2 border-primary'
                : 'text-white/40 hover:text-white/70'
            }`}
          >
            Historial {citasHistorial.length > 0 && <span className="ml-1 bg-white/10 text-white/50 rounded-full px-1.5 py-0.5">{citasHistorial.length}</span>}
          </button>
        </div>

        {/* Contenido */}
        <CardContent className="p-4 overflow-y-auto max-h-[calc(85vh-180px)]">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-8 h-8 animate-spin text-primary/50" />
            </div>
          ) : seccion === 'proximas' ? (
            <>
              {/* HOY */}
              {citasHoy.length > 0 && (
                <div className="mb-5">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                    <p className="text-xs font-bold uppercase tracking-wider text-green-400">Hoy</p>
                  </div>
                  <div className="space-y-3">{citasHoy.map(renderCita)}</div>
                </div>
              )}

              {/* PRÓXIMAS */}
              {citasProximas.length > 0 && (
                <div className="mb-5">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-2 h-2 rounded-full bg-primary" />
                    <p className="text-xs font-bold uppercase tracking-wider text-primary/70">Próximas</p>
                  </div>
                  <div className="space-y-3">{citasProximas.map(renderCita)}</div>
                </div>
              )}

              {citasActivasCount === 0 && (
                <div className="text-center py-14 space-y-3">
                  <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mx-auto">
                    <Calendar className="w-8 h-8 text-white/20" />
                  </div>
                  <p className="text-white/40 font-medium">No tienes reservas próximas</p>
                  <p className="text-xs text-muted-foreground">¡Agenda tu próxima cita con nuestras modelos!</p>
                </div>
              )}
            </>
          ) : (
            <>
              {citasHistorial.length > 0 ? (
                <div className="space-y-3">{citasHistorial.map(renderCita)}</div>
              ) : (
                <div className="text-center py-14 space-y-3">
                  <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mx-auto">
                    <CheckCircle className="w-8 h-8 text-white/20" />
                  </div>
                  <p className="text-white/40 font-medium">Sin historial todavía</p>
                </div>
              )}
            </>
          )}
        </CardContent>

        <div className="p-3 bg-white/5 border-t border-white/10 text-center">
          <p className="text-[10px] text-muted-foreground uppercase tracking-widest">
            💎 Black Diamond Studios — Experiencia Premium
          </p>
        </div>
      </Card>
    </div>
  );
}
