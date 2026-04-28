import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../utils/supabase/info';
import { notificarProgramadores } from './NotificacionesHelpers';
import { toast } from 'sonner';
import {
  Calendar, User, LogOut, Plus, Loader2, Bell,
  Clock, CheckCircle2, XCircle, AlertCircle, Sparkles,
  ChevronRight, MapPin, Star, Phone, Mail, Edit2, Save, X
} from 'lucide-react';
import { useModelos } from './ModelosContext';
import { Logo } from './Logo';

interface ClienteDashboardProps {
  userId: string;
  userEmail: string;
  onLogout: () => void;
}

type Tab = 'citas' | 'solicitar' | 'notificaciones' | 'perfil';

const ESTADO_CONFIG: Record<string, { label: string; color: string; bg: string; icon: typeof CheckCircle2 }> = {
  pendiente:        { label: 'Pendiente',   color: 'text-amber-400',  bg: 'bg-amber-400/10 border-amber-400/30',  icon: AlertCircle },
  solicitud_cliente:{ label: 'Pendiente',   color: 'text-amber-400',  bg: 'bg-amber-400/10 border-amber-400/30',  icon: AlertCircle },
  aprobado:         { label: 'Aprobada',    color: 'text-blue-400',   bg: 'bg-blue-400/10 border-blue-400/30',    icon: CheckCircle2 },
  confirmado:       { label: 'Confirmada',  color: 'text-green-400',  bg: 'bg-green-400/10 border-green-400/30',  icon: CheckCircle2 },
  en_curso:         { label: 'En curso',    color: 'text-green-300',  bg: 'bg-green-400/10 border-green-400/30',  icon: Sparkles },
  completado:       { label: 'Completada',  color: 'text-white/40',   bg: 'bg-white/5 border-white/10',           icon: CheckCircle2 },
  cancelado:        { label: 'Cancelada',   color: 'text-red-400',    bg: 'bg-red-400/10 border-red-400/30',      icon: XCircle },
  no_show:          { label: 'No asistió',  color: 'text-gray-500',   bg: 'bg-white/5 border-white/5',            icon: XCircle },
};

function formatearFechaES(fechaStr: string): string {
  const [y, m, d] = fechaStr.split('-').map(Number);
  const fecha = new Date(y, m - 1, d);
  return fecha.toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
}

function formatearHora(hora: string): string {
  if (!hora) return '';
  const [h, min] = hora.split(':').map(Number);
  const suffix = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 || 12;
  return `${h12}:${String(min).padStart(2, '0')} ${suffix}`;
}

function calcularCuentaRegresiva(fecha: string, hora: string): string {
  const ahora = new Date();
  const citaDate = new Date(`${fecha}T${hora || '00:00'}:00`);
  const diff = citaDate.getTime() - ahora.getTime();
  if (diff <= 0) return 'Ahora mismo';
  const horas = Math.floor(diff / (1000 * 60 * 60));
  const minutos = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  if (horas >= 24) {
    const dias = Math.floor(horas / 24);
    return dias === 1 ? 'Mañana' : `En ${dias} días`;
  }
  if (horas > 0) return `Faltan ${horas}h ${minutos}min`;
  return `Faltan ${minutos} minutos`;
}

function EstadoBadge({ estado }: { estado: string }) {
  const cfg = ESTADO_CONFIG[estado] || { label: estado, color: 'text-white/50', bg: 'bg-white/5 border-white/10', icon: AlertCircle };
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border ${cfg.bg} ${cfg.color}`}>
      <Icon className="w-3 h-3" />
      {cfg.label}
    </span>
  );
}

function CitaCard({ cita, esHoy = false }: { cita: any; esHoy?: boolean }) {
  return (
    <div className={`rounded-xl border p-4 transition-all ${
      esHoy
        ? 'bg-amber-500/5 border-amber-500/30 shadow-[0_0_20px_rgba(245,158,11,0.08)]'
        : 'bg-white/[0.03] border-white/10 hover:border-white/20'
    }`}>
      {esHoy && (
        <div className="flex items-center gap-2 mb-3 pb-3 border-b border-amber-500/20">
          <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
          <span className="text-xs font-semibold text-amber-400 uppercase tracking-wider">Cita de hoy</span>
          <span className="ml-auto text-xs text-amber-400/70 font-medium">
            {calcularCuentaRegresiva(cita.fecha, cita.hora)}
          </span>
        </div>
      )}
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-white text-sm truncate">
            {cita.modelo_nombre || 'Modelo por confirmar'}
          </p>
          <div className="mt-1.5 space-y-1">
            <div className="flex items-center gap-1.5 text-xs text-white/50">
              <Calendar className="w-3.5 h-3.5 flex-shrink-0" />
              <span className="capitalize">{formatearFechaES(cita.fecha)}</span>
            </div>
            {cita.hora && (
              <div className="flex items-center gap-1.5 text-xs text-white/50">
                <Clock className="w-3.5 h-3.5 flex-shrink-0" />
                <span>{formatearHora(cita.hora)}</span>
                {cita.duracion_minutos && (
                  <span className="text-white/30">· {cita.duracion_minutos} min</span>
                )}
              </div>
            )}
            {cita.tipo_servicio && (
              <div className="flex items-center gap-1.5 text-xs text-white/50">
                <Star className="w-3.5 h-3.5 flex-shrink-0" />
                <span>{cita.tipo_servicio}</span>
              </div>
            )}
            {cita.sede && (
              <div className="flex items-center gap-1.5 text-xs text-white/50">
                <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                <span>{cita.sede}</span>
              </div>
            )}
          </div>
        </div>
        <div className="flex flex-col items-end gap-2 flex-shrink-0">
          <EstadoBadge estado={cita.estado} />
          {cita.precio > 0 && (
            <span className="text-xs text-white/40">
              ${Number(cita.precio).toLocaleString('es-CO')}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export function ClienteDashboard({ userId, userEmail, onLogout }: ClienteDashboardProps) {
  const [tab, setTab] = useState<Tab>('citas');
  const [citasHoy, setCitasHoy] = useState<any[]>([]);
  const [proximas, setProximas] = useState<any[]>([]);
  const [historial, setHistorial] = useState<any[]>([]);
  const [perfil, setPerfil] = useState<any>(null);
  const [editandoPerfil, setEditandoPerfil] = useState(false);
  const [formPerfil, setFormPerfil] = useState({ nombre: '', telefono: '', ciudad: '' });
  const [cargando, setCargando] = useState(true);
  const [notificaciones, setNotificaciones] = useState<Array<{ id: string; texto: string; leida: boolean; fecha: string }>>([]);

  const { modelos } = useModelos();
  const modelosActivos = modelos.filter((m: any) => m.activa);
  const [enviando, setEnviando] = useState(false);
  const mañana = new Date(Date.now() + 86400000).toISOString().split('T')[0];
  const [formCita, setFormCita] = useState({
    modeloEmail: '',
    fecha: mañana,
    hora: '15:00',
    servicioSeleccionado: null as any,
    duracion: 60,
    tipoServicio: 'Estándar',
    notas: '',
  });

  const noLeidas = notificaciones.filter(n => !n.leida).length;

  const procesarCitas = useCallback((data: any[]) => {
    const hoy = new Date().toISOString().split('T')[0];
    const terminados = ['completado', 'cancelado', 'no_show'];

    setCitasHoy(
      data.filter(a => a.fecha === hoy && !terminados.includes(a.estado))
    );
    setProximas(
      data
        .filter(a => a.fecha > hoy && !terminados.includes(a.estado))
        .sort((a, b) =>
          new Date(`${a.fecha}T${a.hora || '00:00'}`).getTime() -
          new Date(`${b.fecha}T${b.hora || '00:00'}`).getTime()
        )
    );
    setHistorial(
      data
        .filter(a => a.fecha < hoy || terminados.includes(a.estado))
        .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())
    );
  }, []);

  const cargarCitas = useCallback(async () => {
    const { data } = await supabase
      .from('agendamientos')
      .select('id, fecha, hora, modelo_nombre, tipo_servicio, precio, estado, duracion_minutos, notas, created_at')
      .or(`cliente_email.eq.${userEmail},creado_por.eq.${userEmail}`)
      .order('fecha', { ascending: false })
      .limit(50);
    procesarCitas(data || []);
  }, [userEmail, procesarCitas]);

  const cargarPerfil = useCallback(async () => {
    const { data } = await supabase
      .from('usuarios')
      .select('nombre, email, telefono, ciudad')
      .eq('id', userId)
      .maybeSingle();
    if (data) {
      setPerfil(data);
      setFormPerfil({ nombre: data.nombre || '', telefono: data.telefono || '', ciudad: data.ciudad || '' });
    }
  }, [userId]);

  useEffect(() => {
    const init = async () => {
      setCargando(true);
      await Promise.all([cargarCitas(), cargarPerfil()]);
      setCargando(false);
    };
    init();
  }, [cargarCitas, cargarPerfil]);

  // Realtime: actualizar citas cuando el admin cambia el estado
  useEffect(() => {
    const channel = supabase
      .channel(`cliente-citas-${userId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'agendamientos' },
        async (payload: any) => {
          const row = payload.new || payload.old;
          if (
            row?.cliente_email !== userEmail &&
            row?.creado_por !== userEmail
          ) return;

          await cargarCitas();

          if (payload.eventType === 'UPDATE') {
            const { new: n, old: o } = payload;
            if (o?.estado === 'pendiente' && n?.estado === 'aprobado') {
              const fechaStr = n.fecha ? formatearFechaES(n.fecha) : '';
              toast.success(`¡Tu cita fue aprobada para el ${fechaStr}!`);
              agregarNotificacion(`Tu cita del ${fechaStr} fue aprobada ✅`);
            } else if (n?.estado === 'cancelado' && o?.estado !== 'cancelado') {
              toast.error('Tu cita fue cancelada. Contáctanos para más información.');
              agregarNotificacion('Una de tus citas fue cancelada ❌');
            } else if (n?.estado === 'confirmado' && o?.estado !== 'confirmado') {
              const fechaStr = n.fecha ? formatearFechaES(n.fecha) : '';
              toast.success(`¡Tu cita del ${fechaStr} fue confirmada!`);
              agregarNotificacion(`Tu cita del ${fechaStr} fue confirmada ✅`);
            }
          }
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [userId, userEmail, cargarCitas]);

  const agregarNotificacion = (texto: string) => {
    setNotificaciones(prev => [
      { id: Date.now().toString(), texto, leida: false, fecha: new Date().toISOString() },
      ...prev,
    ]);
  };

  const marcarTodasLeidas = () => {
    setNotificaciones(prev => prev.map(n => ({ ...n, leida: true })));
  };

  const guardarPerfil = async () => {
    const { error } = await supabase
      .from('usuarios')
      .update({ nombre: formPerfil.nombre, telefono: formPerfil.telefono, ciudad: formPerfil.ciudad })
      .eq('id', userId);
    if (!error) {
      toast.success('Perfil actualizado');
      setEditandoPerfil(false);
      cargarPerfil();
    } else {
      toast.error('Error al guardar');
    }
  };

  const solicitarCita = async () => {
    if (!formCita.modeloEmail) { toast.error('Selecciona una modelo'); return; }
    if (!formCita.fecha) { toast.error('Selecciona una fecha'); return; }

    setEnviando(true);
    try {
      const modelo = modelosActivos.find((m: any) => m.email === formCita.modeloEmail);
      
      // Parsear precio: quitar puntos y convertir a número
      const precioBruto = formCita.servicioSeleccionado ? 
        Number(String(formCita.servicioSeleccionado.price).replace(/\./g, '')) : 0;
        
      // Extraer minutos del string duration (ej: "1 hora" -> 60, "30 minutos" -> 30)
      let duracionMinutos = 60;
      if (formCita.servicioSeleccionado?.duration) {
        const durStr = formCita.servicioSeleccionado.duration.toLowerCase();
        if (durStr.includes('hora')) {
          const match = durStr.match(/(\d+)/);
          duracionMinutos = match ? parseInt(match[1]) * 60 : 60;
        } else if (durStr.includes('minuto') || durStr.includes('min')) {
          const match = durStr.match(/(\d+)/);
          duracionMinutos = match ? parseInt(match[1]) : 60;
        }
      }

      const { data: nuevoAg, error } = await supabase.from('agendamientos').insert({
        cliente_id: userId,
        cliente_email: userEmail,
        cliente_nombre: perfil?.nombre || '',
        cliente_telefono: perfil?.telefono || '',
        creado_por: userEmail,
        creado_por_rol: 'cliente',
        modelo_email: formCita.modeloEmail,
        modelo_nombre: modelo?.nombreArtistico || modelo?.nombre || '',
        tipo_servicio: formCita.servicioSeleccionado?.name || 'Estándar',
        servicio: formCita.servicioSeleccionado?.name || 'Estándar',
        fecha: formCita.fecha,
        hora: formCita.hora,
        duracion: duracionMinutos,
        duracion_minutos: duracionMinutos,
        precio: precioBruto,
        monto_pago: precioBruto,
        estado: 'pendiente',
        estado_pago: 'pendiente',
        notas: formCita.notas || null,
      }).select().single();

      if (error) throw error;

      // 🔔 Notificar a programadores/admins sobre la nueva reserva
      if (nuevoAg) {
        notificarProgramadores({
          clienteNombre: perfil?.nombre || userEmail,
          modeloNombre: modelo?.nombreArtistico || modelo?.nombre || '',
          fecha: formCita.fecha,
          hora: formCita.hora,
          tipoServicio: formCita.servicioSeleccionado?.name || 'Estándar',
          agendamientoId: nuevoAg.id,
          duracion: duracionMinutos,
        }).catch(() => {});
      }

      toast.success('Solicitud enviada. Te contactaremos para confirmar.');
      setFormCita({ modeloEmail: '', fecha: mañana, hora: '15:00', servicioSeleccionado: null, duracion: 60, tipoServicio: 'Estándar', notas: '' });
      setTab('citas');
      await cargarCitas();
    } catch (e: any) {
      toast.error('Error al enviar: ' + e.message);
    }
    setEnviando(false);
  };

  const totalCitas = citasHoy.length + proximas.length + historial.length;
  const citasCompletadas = historial.filter(c => c.estado === 'completado').length;

  const TABS = [
    { key: 'citas' as Tab,          label: 'Mis Citas',        icon: Calendar },
    { key: 'solicitar' as Tab,      label: 'Solicitar Cita',   icon: Plus },
    { key: 'notificaciones' as Tab, label: 'Avisos',           icon: Bell, badge: noLeidas },
    { key: 'perfil' as Tab,         label: 'Mi Perfil',        icon: User },
  ];

  return (
    <div className="min-h-screen bg-[#0f1014] text-white">
      {/* Header */}
      <div className="border-b border-white/10 px-4 sm:px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Logo size="sm" variant="horizontal" />
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-medium text-amber-400 leading-none">{perfil?.nombre || userEmail}</p>
            <p className="text-xs text-white/30 mt-0.5">{userEmail}</p>
          </div>
          <div className="w-8 h-8 rounded-full bg-amber-500/15 border border-amber-500/20 flex items-center justify-center">
            <User className="w-4 h-4 text-amber-400" />
          </div>
          <button
            onClick={onLogout}
            className="flex items-center gap-1.5 text-xs text-white/40 hover:text-white/70 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Salir</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-white/10 overflow-x-auto scrollbar-none">
        {TABS.map(({ key, label, icon: Icon, badge }) => (
          <button
            key={key}
            onClick={() => { setTab(key); if (key === 'notificaciones') marcarTodasLeidas(); }}
            className={`relative flex items-center gap-2 px-4 sm:px-5 py-3 text-sm font-medium border-b-2 transition-all whitespace-nowrap ${
              tab === key
                ? 'border-amber-400 text-amber-400'
                : 'border-transparent text-white/40 hover:text-white/70'
            }`}
          >
            <Icon className="w-4 h-4" />
            <span>{label}</span>
            {badge ? (
              <span className="absolute top-2 right-2 sm:right-3 min-w-[16px] h-4 px-1 bg-amber-400 text-black text-[10px] font-bold rounded-full flex items-center justify-center">
                {badge}
              </span>
            ) : null}
          </button>
        ))}
      </div>

      {/* Contenido */}
      <div className="p-4 sm:p-6 max-w-2xl mx-auto">
        {cargando ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Loader2 className="w-7 h-7 text-amber-400 animate-spin" />
            <p className="text-sm text-white/40">Cargando tu información...</p>
          </div>
        ) : tab === 'citas' ? (
          <TabCitas
            citasHoy={citasHoy}
            proximas={proximas}
            historial={historial}
            onSolicitar={() => setTab('solicitar')}
          />
        ) : tab === 'solicitar' ? (
          <TabSolicitar
            modelosActivos={modelosActivos}
            formCita={formCita}
            setFormCita={setFormCita}
            mañana={mañana}
            enviando={enviando}
            onEnviar={solicitarCita}
          />
        ) : tab === 'notificaciones' ? (
          <TabNotificaciones notificaciones={notificaciones} />
        ) : (
          <TabPerfil
            perfil={perfil}
            editandoPerfil={editandoPerfil}
            setEditandoPerfil={setEditandoPerfil}
            formPerfil={formPerfil}
            setFormPerfil={setFormPerfil}
            onGuardar={guardarPerfil}
            totalCitas={totalCitas}
            citasCompletadas={citasCompletadas}
          />
        )}
      </div>
    </div>
  );
}

// ─── Tab: Mis Citas ─────────────────────────────────────────────────────────

function TabCitas({
  citasHoy, proximas, historial, onSolicitar
}: {
  citasHoy: any[]; proximas: any[]; historial: any[]; onSolicitar: () => void;
}) {
  const total = citasHoy.length + proximas.length + historial.length;

  if (total === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mb-4">
          <Calendar className="w-8 h-8 text-amber-400/60" />
        </div>
        <p className="text-white/60 font-medium mb-1">Aún no tienes citas agendadas</p>
        <p className="text-sm text-white/30 mb-6">Solicita tu primera cita con nosotros</p>
        <button
          onClick={onSolicitar}
          className="flex items-center gap-2 px-5 py-2.5 bg-amber-500 text-black text-sm font-semibold rounded-xl hover:bg-amber-400 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Solicitar mi primera cita
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {citasHoy.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-3">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            <h2 className="text-sm font-semibold text-amber-400 uppercase tracking-wider">Hoy</h2>
          </div>
          <div className="space-y-3">
            {citasHoy.map(c => <CitaCard key={c.id} cita={c} esHoy />)}
          </div>
        </section>
      )}

      {proximas.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-white/50 uppercase tracking-wider mb-3">
            Próximas citas
          </h2>
          <div className="space-y-3">
            {proximas.map(c => <CitaCard key={c.id} cita={c} />)}
          </div>
        </section>
      )}

      {historial.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-white/30 uppercase tracking-wider mb-3">
            Historial
          </h2>
          <div className="space-y-2">
            {historial.map(c => (
              <div key={c.id} className="bg-white/[0.02] border border-white/5 rounded-xl p-3 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm text-white/60 truncate">{c.modelo_nombre || 'Modelo'}</p>
                  <p className="text-xs text-white/30 capitalize">{formatearFechaES(c.fecha_servicio)} · {c.servicio_tipo}</p>
                </div>
                <EstadoBadge estado={c.estado} />
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

// ─── Tab: Solicitar Cita ─────────────────────────────────────────────────────

function TabSolicitar({
  modelosActivos, formCita, setFormCita, mañana, enviando, onEnviar
}: {
  modelosActivos: any[]; formCita: any; setFormCita: any;
  mañana: string; enviando: boolean; onEnviar: () => void;
}) {
  const inputClass = "w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500/50 transition-colors";

  const modeloSeleccionada = modelosActivos.find(m => m.email === formCita.modeloEmail);
  const servicios = modeloSeleccionada?.serviciosDisponibles || [];

  return (
    <div className="space-y-5 max-w-md">
      <div>
        <h2 className="text-lg font-semibold text-white">Solicitar Cita</h2>
        <p className="text-sm text-white/40 mt-0.5">Selecciona la modelo y el servicio para ver la tarifa.</p>
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-medium text-white/60">Modelo *</label>
        <select
          value={formCita.modeloEmail}
          onChange={e => setFormCita((p: any) => ({ ...p, modeloEmail: e.target.value, servicioSeleccionado: null }))}
          className={inputClass}
        >
          <option value="">Selecciona una modelo</option>
          {modelosActivos.map((m: any) => (
            <option key={m.id} value={m.email}>{m.nombreArtistico || m.nombre}</option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-white/60">Fecha *</label>
          <input
            type="date"
            min={mañana}
            value={formCita.fecha}
            onChange={e => setFormCita((p: any) => ({ ...p, fecha: e.target.value }))}
            className={inputClass}
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-white/60">Hora</label>
          <input
            type="time"
            value={formCita.hora}
            onChange={e => setFormCita((p: any) => ({ ...p, hora: e.target.value }))}
            className={inputClass}
          />
        </div>
      </div>

      {modeloSeleccionada && servicios.length > 0 && (
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-white/60">Servicio y Tarifa *</label>
          <div className="grid grid-cols-1 gap-2 max-h-60 overflow-y-auto pr-1">
            {servicios.map((srv: any, idx: number) => {
              const isSelected = formCita.servicioSeleccionado?.name === srv.name;
              return (
                <div 
                  key={idx}
                  onClick={() => setFormCita((p: any) => ({ ...p, servicioSeleccionado: srv }))}
                  className={`p-3 rounded-xl border cursor-pointer transition-all flex justify-between items-center ${
                    isSelected ? 'bg-amber-500/20 border-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.15)]' : 'bg-white/5 border-white/10 hover:bg-white/10'
                  }`}
                >
                  <div>
                    <p className={`text-sm font-semibold ${isSelected ? 'text-amber-400' : 'text-white'}`}>{srv.name}</p>
                    <p className="text-xs text-white/50 flex items-center gap-1 mt-0.5">
                      <Clock className="w-3 h-3" /> {srv.duration}
                    </p>
                  </div>
                  <p className={`text-lg font-bold ${isSelected ? 'text-amber-400' : 'text-white'}`} style={{ fontFamily: 'Montserrat, sans-serif' }}>
                    ${srv.price}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {modeloSeleccionada && servicios.length === 0 && (
        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
          Esta modelo aún no tiene tarifas configuradas.
        </div>
      )}

      <div className="space-y-1.5">
        <label className="text-xs font-medium text-white/60">Notas adicionales</label>
        <textarea
          value={formCita.notas}
          onChange={e => setFormCita((p: any) => ({ ...p, notas: e.target.value }))}
          rows={3}
          placeholder="Preferencias, solicitudes especiales..."
          className={`${inputClass} resize-none placeholder:text-white/20`}
        />
      </div>

      <button
        onClick={onEnviar}
        disabled={enviando || !formCita.modeloEmail || !formCita.servicioSeleccionado}
        className="w-full py-3 bg-amber-500 text-black text-sm font-semibold rounded-xl hover:bg-amber-400 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
      >
        {enviando ? (
          <><Loader2 className="w-4 h-4 animate-spin" /> Enviando...</>
        ) : (
          <><ChevronRight className="w-4 h-4" /> Enviar Solicitud</>
        )}
      </button>
    </div>
  );
}

// ─── Tab: Notificaciones ──────────────────────────────────────────────────────

function TabNotificaciones({ notificaciones }: { notificaciones: Array<{ id: string; texto: string; leida: boolean; fecha: string }> }) {
  if (notificaciones.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-4">
          <Bell className="w-7 h-7 text-white/20" />
        </div>
        <p className="text-white/40 text-sm">Sin notificaciones por ahora</p>
        <p className="text-xs text-white/20 mt-1">Aquí verás los cambios en el estado de tus citas</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-white">Notificaciones</h2>
      <div className="space-y-2">
        {notificaciones.map(n => (
          <div key={n.id} className={`flex items-start gap-3 p-3.5 rounded-xl border transition-all ${
            n.leida ? 'bg-white/[0.02] border-white/5' : 'bg-amber-500/5 border-amber-500/20'
          }`}>
            <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${n.leida ? 'bg-white/20' : 'bg-amber-400'}`} />
            <div>
              <p className="text-sm text-white/80">{n.texto}</p>
              <p className="text-xs text-white/30 mt-0.5">
                {new Date(n.fecha).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Tab: Mi Perfil ───────────────────────────────────────────────────────────

function TabPerfil({
  perfil, editandoPerfil, setEditandoPerfil, formPerfil, setFormPerfil, onGuardar, totalCitas, citasCompletadas
}: {
  perfil: any; editandoPerfil: boolean; setEditandoPerfil: (v: boolean) => void;
  formPerfil: any; setFormPerfil: any; onGuardar: () => void;
  totalCitas: number; citasCompletadas: number;
}) {
  const inputClass = "w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500/50 transition-colors";

  return (
    <div className="space-y-6 max-w-md">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-white">Mi Perfil</h2>
        {!editandoPerfil && (
          <button
            onClick={() => setEditandoPerfil(true)}
            className="flex items-center gap-1.5 text-xs text-amber-400/80 hover:text-amber-400 transition-colors"
          >
            <Edit2 className="w-3.5 h-3.5" /> Editar
          </button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        {[
          { label: 'Citas totales', value: totalCitas },
          { label: 'Completadas', value: citasCompletadas },
        ].map(({ label, value }) => (
          <div key={label} className="bg-white/[0.03] border border-white/8 rounded-xl p-3 text-center">
            <p className="text-2xl font-bold text-amber-400">{value}</p>
            <p className="text-xs text-white/40 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {editandoPerfil ? (
        <div className="space-y-4">
          {[
            { key: 'nombre', label: 'Nombre completo', type: 'text', icon: User },
            { key: 'telefono', label: 'Teléfono', type: 'tel', icon: Phone },
            { key: 'ciudad', label: 'Ciudad', type: 'text', icon: MapPin },
          ].map(({ key, label, type }) => (
            <div key={key} className="space-y-1.5">
              <label className="text-xs font-medium text-white/60">{label}</label>
              <input
                type={type}
                value={(formPerfil as any)[key]}
                onChange={e => setFormPerfil((p: any) => ({ ...p, [key]: e.target.value }))}
                className={inputClass}
              />
            </div>
          ))}
          <div className="flex gap-2 pt-1">
            <button
              onClick={onGuardar}
              className="flex items-center gap-2 px-4 py-2.5 bg-amber-500 text-black text-sm font-semibold rounded-xl hover:bg-amber-400 transition-colors"
            >
              <Save className="w-4 h-4" /> Guardar
            </button>
            <button
              onClick={() => setEditandoPerfil(false)}
              className="flex items-center gap-2 px-4 py-2.5 bg-white/8 text-sm rounded-xl hover:bg-white/12 transition-colors"
            >
              <X className="w-4 h-4" /> Cancelar
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-0 divide-y divide-white/5">
          {[
            { label: 'Nombre', value: perfil?.nombre, icon: User },
            { label: 'Email', value: perfil?.email, icon: Mail },
            { label: 'Teléfono', value: perfil?.telefono || '—', icon: Phone },
            { label: 'Ciudad', value: perfil?.ciudad || '—', icon: MapPin },
          ].map(({ label, value, icon: Icon }) => (
            <div key={label} className="flex items-center justify-between py-3 gap-3">
              <div className="flex items-center gap-2.5">
                <Icon className="w-4 h-4 text-white/20 flex-shrink-0" />
                <span className="text-sm text-white/40">{label}</span>
              </div>
              <span className="text-sm text-white/80 text-right truncate max-w-[180px]">{value}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
