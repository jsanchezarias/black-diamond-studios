import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Calendar, BarChart3, Plus, DoorOpen, XCircle, UserX, MoreVertical, MessageSquare, Menu, X, Eye, Bell, PieChart, Settings, CheckCircle, Loader2 } from 'lucide-react';
import { supabase } from '../../utils/supabase/info';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
// import { Input } from '../../components/ui/input';
// import { Label } from '../../components/ui/label';
// import { Badge } from '../../components/ui/badge';
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { TerminalChatProgramador } from '../../components/TerminalChatProgramador';
import { HabitacionesPanel } from '../../components/HabitacionesPanel';
import { ConfiguracionChatPanel } from '../../components/ConfiguracionChatPanel';
import { useAgendamientos, Agendamiento } from './AgendamientosContext';
import { useClientes } from './ClientesContext';
import { useModelos } from './ModelosContext';
import { CancelarAgendamientoModal } from '../../components/CancelarAgendamientoModal';
import { CrearAgendamientoModal } from '../../components/CrearAgendamientoModal';
import { DetalleAgendamientoModal } from '../../components/DetalleAgendamientoModal';
import { LogoIsotipo } from './LogoIsotipo';
// import { SelectErrorBoundary } from '../../components/SelectErrorBoundary';
// import { NotificacionesPanel } from './NotificacionesPanel';
import { AnalyticsPanel } from './AnalyticsPanel'; // 📊 Sistema de Analytics
import { ProgramadorAnalyticsPanel } from '../../components/ProgramadorAnalyticsPanel';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../../components/ui/dropdown-menu';

interface ProgramadorDashboardProps {
  accessToken: string;
  userId: string;
  userEmail: string;
  onLogout?: () => void;
}

const isDev = process.env.NODE_ENV === 'development';

export function ProgramadorDashboard({ accessToken: _accessToken, userId, userEmail, onLogout }: ProgramadorDashboardProps) {
  // Estados locales
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('solicitudes');
  const [noLeidas, setNoLeidas] = useState(0);
  const [aceptandoId, _setAceptandoId] = useState<string | null>(null);
  const [agendamientoTab, setAgendamientoTab] = useState<'nuevas' | 'aceptadas' | 'aprobadas'>('nuevas');
  /*
  const [formData, setFormData] = useState({
    modeloEmail: undefined as string | undefined, // ✅ FIX: undefined en lugar de ''
    clienteNombre: '',
    clienteTelefono: '',
    fecha: '',
    hora: '',
    duracionMinutos: 60,
    tipoServicio: '1 hora',
    notas: '',
  });
  */

  const [modalCancelar, setModalCancelar] = useState<{
    isOpen: boolean;
    agendamiento: Agendamiento | null;
    tipo: 'cancelar' | 'no_show';
  }>({
    isOpen: false,
    agendamiento: null,
    tipo: 'cancelar',
  });

  // ✅ NUEVO: Modales para crear y ver detalle
  const [modalCrear, setModalCrear] = useState(false);
  const [modalDetalle, setModalDetalle] = useState<{
    isOpen: boolean;
    agendamiento: Agendamiento | null;
  }>({ isOpen: false, agendamiento: null });

  // Hooks de contexto con valores por defecto
  let agendamientosCtx, clientesCtx, modelosCtx;

  try {
    agendamientosCtx = useAgendamientos();
    clientesCtx = useClientes();
    modelosCtx = useModelos();

    // Valores seguros con fallbacks
    // const agendamientos = agendamientosCtx?.agendamientos || [];
    // const modelos = modelosCtx?.modelos || [];
  } catch (error) {
    if (isDev) console.error('❌ ERROR AL OBTENER CONTEXTOS:', error);
    throw error;
  }

  // ✅ NUEVO: Mostrar indicador de carga si los contextos no están listos
  if (!agendamientosCtx || !clientesCtx || !modelosCtx) {
    return (
      <div className="min-h-screen w-full bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto" />
          <p className="text-muted-foreground">Cargando dashboard...</p>
        </div>
      </div>
    );
  }

  const currentUser = { id: userId, email: userEmail };
  const [notificaciones, setNotificaciones] = useState<any[]>([]);
  // const [loading, setLoading] = useState(false);
  const [solicitudesNuevas, setSolicitudesNuevas] = useState<any[]>([]);
  const [aceptadas, setAceptadas] = useState<any[]>([]);
  const [aprobadas, setAprobadas] = useState<any[]>([]);
  const [modalAceptar, setModalAceptar] = useState<any>(null);
  const [habitacionesDisponibles, setHabitacionesDisponibles] = useState<any[]>([]);
  const [habitacionSeleccionada, setHabitacionSeleccionada] = useState<any>(null);
  const [loadingAceptar, setLoadingAceptar] = useState(false);

  const cargarAgendamientos = async () => {
    // setLoading(true)

    const { data: { session } } = await supabase.auth.getSession()
    console.log('SESIÓN ACTIVA:', session?.user?.email, session?.user?.id)

    const { data, error } = await supabase
      .from('agendamientos')
      .select('*')
      .order('fecha', { ascending: true })
      .order('hora', { ascending: true })

    if (error) {
      console.error('ERROR QUERY AGENDAMIENTOS:', error.message, error.code)
      // setLoading(false)
      return
    }

    console.log('TOTAL AGENDAMIENTOS RECIBIDOS:', data?.length)
    console.log('DATOS:', data)

    const todos = (data || []).map((a: any) => ({
      ...a,
      clienteNombre: a.cliente_nombre,
      clienteTelefono: a.cliente_telefono,
      modeloNombre: a.modelo_nombre,
      modeloEmail: a.modelo_email,
      tipoServicio: a.tipo_servicio,
      duracionMinutos: a.duracion_minutos,
      montoPago: a.precio,
      creadoPor: a.creado_por
    }))

    const nuevas = todos.filter(a =>
      ['pendiente', 'solicitud_cliente'].includes(a.estado) &&
      a.archivado !== true
    )

    const aceptadas = todos.filter(a =>
      ['aceptado_programador', 'confirmado'].includes(a.estado)
    )

    const aprobadas = todos.filter(a =>
      a.estado === 'aprobado'
    )

    console.log('NUEVAS:', nuevas.length)
    console.log('ACEPTADAS:', aceptadas.length)

    setSolicitudesNuevas(nuevas)
    setAceptadas(aceptadas)
    setAprobadas(aprobadas)
    // setLoading(false)
  }

  const cargarNotificaciones = async () => {
    const { data } = await supabase
      .from('notificaciones')
      .select('*')
      .eq('usuario_id', currentUser.id)
      .order('created_at', { ascending: false })
      .limit(50)

    setNotificaciones(data || [])
    setNoLeidas((data || []).filter((n: any) => !n.leida).length)
  }

  const fmtFecha = (f: string) => {
    if (!f) return '--';
    const [y, m, d] = f.split('-');
    return new Date(+y, +m - 1, +d).toLocaleDateString('es-CO', { weekday: 'short', day: 'numeric', month: 'short' });
  };

  /*
  const CardAg = ({ apt }: { apt: any }) => {
    const isNueva = ['pendiente', 'solicitud_cliente'].includes(apt.estado);
    const isAceptada = apt.estado === 'aprobado';
    return (
      <div className={`rounded-xl p-4 mb-3 border transition-all ${
        isNueva    ? 'bg-amber-500/8 border-amber-500/40' :
        isAceptada ? 'bg-blue-500/8 border-blue-500/30' :
                     'bg-white/3 border-white/10'
      }`}>
        <div className="flex items-center justify-between mb-3">
          <span className={`font-bold text-sm ${isNueva ? 'text-amber-300' : isAceptada ? 'text-blue-300' : 'text-muted-foreground'}`}>
            📅 {fmtFecha(apt.fecha)} — {apt.hora || '--:--'}
          </span>
          <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold ${
            isNueva    ? 'bg-amber-500/20 text-amber-400' :
            isAceptada ? 'bg-blue-500/20 text-blue-400' :
            apt.estado === 'completado' ? 'bg-green-500/20 text-green-400' :
            apt.estado === 'cancelado'  ? 'bg-red-500/20 text-red-400' :
                                          'bg-white/10 text-white/50'
          }`}>
            {isNueva ? '⏳ Pendiente' : isAceptada ? '✅ Aceptada' :
             apt.estado === 'completado' ? '🎉 Completada' :
             apt.estado === 'cancelado'  ? '❌ Cancelada' :
             apt.estado === 'no_show'    ? '👻 No Show' : apt.estado}
          </span>
        </div>

        <div className="space-y-1.5 mb-3">
          <div className="text-sm"><span className="text-muted-foreground">👤 Cliente:</span>{' '}
            <span className="text-white font-medium">{apt.clienteNombre || '—'}</span>
            {apt.clienteTelefono && (
              <a href={`tel:${apt.clienteTelefono}`} className="ml-2 text-green-400 text-xs hover:underline">
                📞 {apt.clienteTelefono}
              </a>
            )}
          </div>
          <div className="text-sm"><span className="text-muted-foreground">💃 Modelo:</span>{' '}
            <span className="text-white font-medium">{apt.modeloNombre || '—'}</span>
          </div>
          <div className="text-sm flex flex-wrap gap-x-4 gap-y-1">
            <span><span className="text-muted-foreground">⏱️</span> {apt.tipoServicio}{apt.duracionMinutos ? ` — ${apt.duracionMinutos} min` : ''}</span>
            {apt.montoPago > 0 && (
              <span className="text-amber-400 font-semibold">💰 ${Number(apt.montoPago).toLocaleString('es-CO')}</span>
            )}
          </div>
        </div>

        {apt.notas && (
          <div className="text-xs text-muted-foreground bg-white/5 rounded-lg px-3 py-2 mb-3">
            📝 {apt.notas}
          </div>
        )}

        <div className="flex gap-2">
          <Button size="sm" variant="outline" className="h-8 w-8 p-0 flex-shrink-0"
            onClick={() => setModalDetalle({ isOpen: true, agendamiento: apt })}>
            <Eye className="w-4 h-4" />
          </Button>

          {isNueva && (
            <>
              <Button
                size="sm"
                className="flex-1 h-9 bg-gradient-to-r from-yellow-700 to-primary hover:from-yellow-600 hover:to-primary/90 text-black font-bold text-sm gap-1.5"
                disabled={aceptandoId === apt.id}
                onClick={() => handleAceptarClick(apt)}
              >
                {aceptandoId === apt.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                Aceptar y asignar habitación
              </Button>
              <Button size="sm" variant="ghost"
                className="flex-shrink-0 h-9 px-3 border border-red-500/40 text-red-400 hover:bg-red-950/30 hover:text-red-300 text-sm"
                onClick={() => handleCancelarClick(apt)}>
                <XCircle className="w-4 h-4" />
              </Button>
            </>
          )}

          {isAceptada && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onSelect={() => handleCancelarClick(apt)}>
                  <XCircle className="w-4 h-4 mr-2" /> Cancelar
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => handleNoShowClick(apt)}>
                  <UserX className="w-4 h-4 mr-2" /> No Show
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>
    );
  };
  */

  const agruparPorFecha = (lista: any[]) => {
    const grupos: Record<string, any[]> = {}
    lista.forEach(ag => {
      const fecha = ag.fecha?.split('T')[0] || ag.fecha || 'Sin fecha'
      if (!grupos[fecha]) grupos[fecha] = []
      grupos[fecha].push(ag)
    })
    return Object.entries(grupos)
      .sort(([a], [b]) => a.localeCompare(b))
  }

  const formatearFechaGrupo = (fecha: string) => {
    if (fecha === 'Sin fecha') return '📅 Sin fecha asignada'
    try {
      return '📅 ' + new Date(fecha + 'T12:00:00').toLocaleDateString('es-CO', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      })
    } catch {
      return '📅 ' + fecha
    }
  }

  // 🔔 Toast en tiempo real cuando llega nueva solicitud pendiente
  useEffect(() => {
    if (modalAceptar) cargarHabitaciones();
  }, [modalAceptar]);

  useEffect(() => {
    agendamientosCtx?.recargarAgendamientos();
    clientesCtx?.cargarClientes();
  }, []);

  useEffect(() => {
    cargarAgendamientos()
    cargarNotificaciones()

    const channel = supabase
      .channel('programador-live-' + currentUser.id)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notificaciones',
        filter: 'usuario_id=eq.' + currentUser.id
      }, async (payload) => {
        const notifNueva = payload.new as any;
        setNotificaciones(prev => [notifNueva, ...prev]);
        setNoLeidas(prev => prev + 1);

        if (notifNueva.tipo === 'agendamiento_nuevo' && notifNueva.referencia_id) {
          toast.custom(
            (t: any) => (
              <div>
                <div style={{ fontWeight: 700, marginBottom: 4, fontSize: 13 }}>🔔 {notifNueva.titulo}</div>
                <div style={{ fontSize: 11, marginBottom: 10, opacity: 0.75, lineHeight: 1.4 }}>{notifNueva.mensaje}</div>
                <button
                  onClick={async () => {
                    toast.dismiss(t.id);
                    const { data: ag } = await supabase.from('agendamientos').select('*').eq('id', notifNueva.referencia_id).single();
                    if (ag) setModalAceptar(ag);
                    else toast.error('Agendamiento no encontrado');
                  }}
                  style={{
                    background: 'linear-gradient(135deg, #B8860B, #FFD700)',
                    border: 'none', borderRadius: 8,
                    padding: '8px 14px', color: 'black',
                    fontWeight: 700, cursor: 'pointer',
                    fontSize: 12, width: '100%',
                  }}
                >
                  ✅ Aceptar ahora
                </button>
              </div>
            ),
            {
              duration: 15000,
              style: {
                background: 'rgba(15,12,5,0.97)',
                border: '1px solid rgba(255,215,0,0.5)',
                color: 'white',
                padding: '14px',
                maxWidth: 320,
              },
            }
          );
        } else {
          toast('🔔 ' + notifNueva.titulo, {
            duration: 6000,
            style: {
              background: 'rgba(255,215,0,0.15)',
              border: '1px solid rgba(255,215,0,0.4)',
              color: 'white',
              fontWeight: '600',
            },
          });
        }
      })
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'agendamientos'
      }, () => {
        cargarAgendamientos()
      })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'agendamientos'
      }, () => {
        cargarAgendamientos()
      })
      .subscribe((status) => {
        console.log('Realtime programador status:', status)
      })

    return () => {
      supabase.removeChannel(channel)
    }
  }, [currentUser.id])

  // Abrir modal de aceptación con selección de habitación
  const handleAceptarClick = (apt: Agendamiento) => {
    setModalAceptar(apt);
  };

  const cargarHabitaciones = async () => {
    // Cargar TODAS las habitaciones para mostrar disponibles y ocupadas
    const { data } = await (supabase as any)
      .from('habitaciones')
      .select('id, numero, nombre, estado')
      .order('numero', { ascending: true });
    const lista = data || [];
    setHabitacionesDisponibles(lista); // ahora contiene todas, el modal las filtra por estado
    // Pre-seleccionar solo si hay disponible
    const primera = lista.find((h: any) => ['disponible', 'libre'].includes(h.estado));
    setHabitacionSeleccionada(primera || null);
  };

  const aceptarSinHabitacion = async (agendamiento: any) => {
    setLoadingAceptar(true);
    try {
      const { error } = await supabase
        .from('agendamientos')
        .update({
          estado: 'aceptado_programador',
          aceptado_por: currentUser.email,
          fecha_aceptacion: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        } as any)
        .eq('id', agendamiento.id);

      if (error) {
        console.error('ERROR ACEPTAR:', error.message, error.code);
        toast.error('Error: ' + error.message);
        setLoadingAceptar(false);
        return;
      }

      // 🆕 Notificar SOLO a la MODELO asignada
      const modeloEmail = agendamiento.modelo_email || agendamiento.modeloEmail;
      if (modeloEmail) {
        const { data: modeloUser } = await supabase
          .from('usuarios')
          .select('id, email')
          .eq('email', modeloEmail)
          .single();

        if (modeloUser) {
          await supabase.from('notificaciones').insert({
            usuario_id: modeloUser.id,
            para_usuario_id: modeloUser.id,
            usuario_email: modeloUser.email,
            titulo: '📅 Nuevo servicio asignado — acción requerida',
            mensaje: 'Tienes un servicio confirmado para ' + agendamiento.fecha + ' a las ' + agendamiento.hora + '. Selecciona tu habitación y sube el comprobante de pago para comenzar.',
            tipo: 'agendamiento_asignado',
            referencia_id: agendamiento.id,
            leida: false,
            created_at: new Date().toISOString()
          });
        }
      }

      // Marcar notificación del programador como leída
      await supabase
        .from('notificaciones')
        .update({ leida: true })
        .eq('referencia_id', agendamiento.id)
        .eq('usuario_id', currentUser.id);

      setNotificaciones(prev => {
        const afectadas = prev.filter(n => n.referencia_id === agendamiento.id && !n.leida).length;
        setNoLeidas(c => Math.max(0, c - afectadas));
        return prev.filter(n => n.referencia_id !== agendamiento.id);
      });

      toast.success('✅ Cita aceptada — Notificación enviada a la modelo');
      setModalAceptar(null);
      setHabitacionSeleccionada(null);
      cargarAgendamientos();
    } catch (e: any) {
      toast.error('Error inesperado: ' + e.message);
    }
    setLoadingAceptar(false);
  };

  /*
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();

    try {
      // Validaciones
      if (!formData.modeloEmail) {
        toast.error('Por favor selecciona una modelo');
        return;
      }

      if (!formData.clienteNombre || !formData.clienteTelefono) {
        toast.error('Por favor completa los datos del cliente');
        return;
      }

      if (!formData.fecha || !formData.hora) {
        toast.error('Por favor selecciona fecha y hora');
        return;
      }

      // Verificar que los contextos existan
      if (!clientesCtx?.obtenerOCrearCliente) {
        toast.error('Error: El sistema de clientes no está disponible');
        return;
      }

      if (!agendamientosCtx?.agregarAgendamiento) {
        toast.error('Error: El sistema de agendamientos no está disponible');
        return;
      }

      // Crear o verificar cliente
      const cliente = await clientesCtx.obtenerOCrearCliente(
        formData.clienteNombre,
        formData.clienteTelefono
      );

      if (!cliente) {
        toast.error('Error al crear o encontrar el cliente');
        return;
      }

      // Buscar modelo
      const modelo = modelos.find(m => m?.email === formData.modeloEmail);

      if (!modelo) {
        toast.error('No se encontró la modelo seleccionada');
        return;
      }

      // Crear agendamiento
      await agendamientosCtx.agregarAgendamiento({
        modeloEmail: formData.modeloEmail,
        modeloNombre: modelo.nombre || modelo.nombreArtistico || 'Sin nombre',
        clienteId: cliente.id,
        clienteNombre: formData.clienteNombre,
        clienteTelefono: formData.clienteTelefono,
        fecha: formData.fecha,
        hora: formData.hora,
        duracionMinutos: Number(formData.duracionMinutos) || 60,
        tipoServicio: formData.tipoServicio,
        montoPago: 0,
        estadoPago: 'pendiente',
        estado: 'pendiente',
        notas: formData.notas || '',
        creadoPor: userEmail,
      });

      toast.success('¡Agendamiento creado exitosamente!');

      // Limpiar formulario
      setFormData({
        modeloEmail: undefined as string | undefined,
        clienteNombre: '',
        clienteTelefono: '',
        fecha: '',
        hora: '',
        duracionMinutos: 60,
        tipoServicio: '1 hora',
        notas: '',
      });
    } catch (error) {
      if (isDev) console.error('❌ ERROR EN SUBMIT:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      toast.error(`Error al crear el agendamiento: ${errorMessage}`);
    }
  };
  */

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    setMenuOpen(false);
    if (tab === 'notificaciones') {
      setNoLeidas(0);
      supabase
        .from('notificaciones')
        .update({ leida: true })
        .eq('usuario_id', currentUser.id)
        .eq('leida', false)
        .then(() => {});
    }
  };

  const handleCancelarClick = (agendamiento: Agendamiento) => {
    setModalCancelar({
      isOpen: true, 
      agendamiento, 
      tipo: 'cancelar' 
    });
  };

  const handleNoShowClick = (agendamiento: Agendamiento) => {
    setModalCancelar({
      isOpen: true, 
      agendamiento, 
      tipo: 'no_show' 
    });
  };


  return (
    <div className="min-h-screen w-full bg-background" style={{ fontFamily: 'Montserrat, sans-serif' }}>
      <header className="fixed top-0 left-0 right-0 z-50 bg-card/98 backdrop-blur-premium border-b border-primary/15 shadow-premium">
        <div className="flex items-center justify-between px-3 sm:px-6 py-3 max-w-7xl mx-auto">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <LogoIsotipo size="sm" />
            <div>
              <h1 className="text-base sm:text-lg font-bold text-primary uppercase tracking-wide truncate" style={{ fontFamily: 'Playfair Display, serif' }}>
                Dashboard Programador
              </h1>
              <p className="text-xs text-muted-foreground hidden sm:block">{userEmail}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            {onLogout && (
              <Button
                onClick={onLogout}
                variant="ghost"
                size="sm"
                className="hidden sm:flex border-primary/20 hover:bg-primary/10 text-red-400 hover:text-red-500"
              >
                <DoorOpen className="w-4 h-4 mr-2" />
                Salir
              </Button>
            )}

            {/* 🔔 Bell con badge siempre visible */}
            <Button
              onClick={() => handleTabChange('notificaciones')}
              variant="outline"
              size="sm"
              className="relative border-primary/30 hover:bg-primary/10 h-9 w-9 p-0"
            >
              <Bell className="w-4 h-4 text-primary" />
              {noLeidas > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-0.5 leading-none">
                  {noLeidas > 99 ? '99+' : noLeidas}
                </span>
              )}
            </Button>

            <Button
              onClick={() => setMenuOpen(prev => !prev)}
              variant="outline"
              size="sm"
              className="border-primary/30 hover:bg-primary/10 h-9 w-9 p-0"
            >
              {menuOpen ? <X className="w-4 h-4 text-primary" /> : <Menu className="w-4 h-4 text-primary" />}
            </Button>
          </div>
        </div>

        {menuOpen && (
          <div className="bg-card/95 backdrop-blur-md border-t border-primary/10 shadow-lg">
            <nav className="flex flex-col px-4 py-3 space-y-2 max-w-7xl mx-auto">
              <Button 
                onClick={() => handleTabChange('solicitudes')} 
                variant={activeTab === 'solicitudes' ? 'default' : 'ghost'} 
                className="justify-start h-10 text-sm"
              >
                <Calendar className="w-4 h-4 mr-3" />
                Solicitudes Nuevas
              </Button>
              <Button 
                onClick={() => handleTabChange('agendamiento')} 
                variant={activeTab === 'agendamiento' ? 'default' : 'ghost'} 
                className="justify-start h-10 text-sm"
              >
                <Calendar className="w-4 h-4 mr-3" />
                Agendamiento
              </Button>
              <Button 
                onClick={() => handleTabChange('chat')} 
                variant={activeTab === 'chat' ? 'default' : 'ghost'} 
                className="justify-start h-10 text-sm"
              >
                <MessageSquare className="w-4 h-4 mr-3" />
                Chat
              </Button>
              <Button 
                onClick={() => handleTabChange('habitaciones')} 
                variant={activeTab === 'habitaciones' ? 'default' : 'ghost'} 
                className="justify-start h-10 text-sm"
              >
                <DoorOpen className="w-4 h-4 mr-3" />
                Habitaciones
              </Button>
              <Button 
                onClick={() => handleTabChange('estadisticas')} 
                variant={activeTab === 'estadisticas' ? 'default' : 'ghost'} 
                className="justify-start h-10 text-sm"
              >
                <BarChart3 className="w-4 h-4 mr-3" />
                Estadísticas
              </Button>
              <Button
                onClick={() => handleTabChange('notificaciones')}
                variant={activeTab === 'notificaciones' ? 'default' : 'ghost'}
                className="justify-start h-10 text-sm relative"
              >
                <Bell className="w-4 h-4 mr-3" />
                Notificaciones
                {noLeidas > 0 && (
                  <span className="ml-auto bg-red-500 text-white text-xs font-bold rounded-full min-w-[20px] h-5 flex items-center justify-center px-1">
                    {noLeidas > 99 ? '99+' : noLeidas}
                  </span>
                )}
              </Button>
              <Button 
                onClick={() => handleTabChange('analytics')} 
                variant={activeTab === 'analytics' ? 'default' : 'ghost'} 
                className="justify-start h-10 text-sm"
              >
                <PieChart className="w-4 h-4 mr-3" />
                Analytics
              </Button>
              <Button 
                onClick={() => handleTabChange('configuracion')} 
                variant={activeTab === 'configuracion' ? 'default' : 'ghost'} 
                className="justify-start h-10 text-sm"
              >
                <Settings className="w-4 h-4 mr-3" />
                Configuración
              </Button>
              
              {onLogout && (
                <>
                  <div className="h-px bg-border my-2" />
                  <Button 
                    onClick={onLogout} 
                    variant="ghost" 
                    className="justify-start h-10 text-sm text-red-400 hover:text-red-500 hover:bg-red-950/20"
                  >
                    <DoorOpen className="w-4 h-4 mr-3" />
                    Cerrar Sesión
                  </Button>
                </>
              )}
            </nav>
          </div>
        )}
      </header>

      <main className="pt-24 px-3 sm:px-6 pb-12 max-w-7xl mx-auto">
        <div className="space-y-4 sm:space-y-6">
           {activeTab === 'solicitudes' && (
            <div className="space-y-4">

              {solicitudesNuevas.length === 0 ? (
                <div style={{
                  textAlign: 'center',
                  padding: 40,
                  color: 'var(--color-text-tertiary)'
                }}>
                  <div style={{ fontSize: 40, marginBottom: 12 }}>📋</div>
                  <p>No hay solicitudes nuevas</p>
                  <p style={{ fontSize: 12 }}>
                    Cuando un cliente haga una reserva aparecerá aquí
                  </p>
                </div>
              ) : (
                agruparPorFecha(solicitudesNuevas).map(([fecha, citas]: [string, any[]]) => (
                  <div key={fecha}>
                    <div className="flex items-center gap-2 px-3 py-2 mb-3 mt-4 first:mt-0 rounded-lg bg-primary/8 border border-primary/20">
                      <span className="text-base">📅</span>
                      <span className="text-primary font-semibold text-sm capitalize flex-1">
                        {formatearFechaGrupo(fecha)}
                      </span>
                      <span className="text-xs bg-primary/20 text-primary rounded-full px-2 py-0.5 font-semibold">
                        {citas.length} {citas.length === 1 ? 'solicitud' : 'solicitudes'}
                      </span>
                    </div>
                    <div className="ml-2">
                      {citas.map((apt: any) => {
  const isNueva = ['pendiente', 'solicitud_cliente'].includes(apt.estado);
  const isAceptada = apt.estado === 'aprobado';
  return (
    <div key={apt.id} className={`rounded-xl p-4 mb-3 border transition-all ${
      isNueva    ? 'bg-amber-500/8 border-amber-500/40' :
      isAceptada ? 'bg-blue-500/8 border-blue-500/30' :
                   'bg-white/3 border-white/10'
    }`}>
      <div className="flex items-center justify-between mb-3">
        <span className={`font-bold text-sm ${isNueva ? 'text-amber-300' : isAceptada ? 'text-blue-300' : 'text-muted-foreground'}`}>
          📅 {fmtFecha(apt.fecha)} — {apt.hora || '--:--'}
        </span>
        <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold ${
          isNueva    ? 'bg-amber-500/20 text-amber-400' :
          isAceptada ? 'bg-blue-500/20 text-blue-400' :
          apt.estado === 'completado' ? 'bg-green-500/20 text-green-400' :
          apt.estado === 'cancelado'  ? 'bg-red-500/20 text-red-400' :
                                        'bg-white/10 text-white/50'
        }`}>
          {isNueva ? '⏳ Pendiente' : isAceptada ? '✅ Aceptada' :
           apt.estado === 'completado' ? '🎉 Completada' :
           apt.estado === 'cancelado'  ? '❌ Cancelada' :
           apt.estado === 'no_show'    ? '👻 No Show' : apt.estado}
        </span>
      </div>

      <div className="space-y-1.5 mb-3">
        <div className="text-sm"><span className="text-muted-foreground">👤 Cliente:</span>{' '}
          <span className="text-white font-medium">{apt.clienteNombre || apt.cliente_nombre || '—'}</span>
          {(apt.clienteTelefono || apt.cliente_telefono) && (
            <a href={`tel:${apt.clienteTelefono || apt.cliente_telefono}`} className="ml-2 text-green-400 text-xs hover:underline">
              📞 {apt.clienteTelefono || apt.cliente_telefono}
            </a>
          )}
        </div>
        <div className="text-sm"><span className="text-muted-foreground">💃 Modelo:</span>{' '}
          <span className="text-white font-medium">{apt.modeloNombre || apt.modelo_nombre || '—'}</span>
        </div>
        <div className="text-sm flex flex-wrap gap-x-4 gap-y-1">
          <span><span className="text-muted-foreground">⏱️</span> {apt.tipoServicio || apt.tipo_servicio}{apt.duracionMinutos ? ` — ${apt.duracionMinutos} min` : ''}</span>
          {(apt.montoPago || apt.precio) > 0 && (
            <span className="text-amber-400 font-semibold">💰 ${(Number(apt.montoPago || apt.precio)).toLocaleString('es-CO')}</span>
          )}
        </div>
      </div>

      {apt.notas && (
        <div className="text-xs text-muted-foreground bg-white/5 rounded-lg px-3 py-2 mb-3">
          📝 {apt.notas}
        </div>
      )}

      <div className="flex gap-2">
        <Button size="sm" variant="outline" className="h-8 w-8 p-0 flex-shrink-0"
          onClick={() => setModalDetalle({ isOpen: true, agendamiento: apt })}>
          <Eye className="w-4 h-4" />
        </Button>

        {isNueva && (
          <>
            <Button
              size="sm"
              className="flex-1 h-9 bg-gradient-to-r from-yellow-700 to-primary hover:from-yellow-600 hover:to-primary/90 text-black font-bold text-sm gap-1.5"
              disabled={aceptandoId === apt.id}
              onClick={() => handleAceptarClick(apt)}
            >
              {aceptandoId === apt.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
              Aceptar y asignar habitación
            </Button>
            <Button size="sm" variant="ghost"
              className="flex-shrink-0 h-9 px-3 border border-red-500/40 text-red-400 hover:bg-red-950/30 hover:text-red-300 text-sm"
              onClick={() => handleCancelarClick(apt)}>
              <XCircle className="w-4 h-4" />
            </Button>
          </>
        )}

        {isAceptada && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onSelect={() => handleCancelarClick(apt)}>
                <XCircle className="w-4 h-4 mr-2" /> Cancelar
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => handleNoShowClick(apt)}>
                <UserX className="w-4 h-4 mr-2" /> No Show
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </div>
  );
})}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'agendamiento' && (() => {
            // const hoy = new Date().toISOString().split('T')[0];

            const tabList = [
              { key: 'nuevas',     label: '🔔 Nuevas',      count: solicitudesNuevas.length,     color: 'text-amber-400' },
              { key: 'aceptadas',  label: '📋 Aceptadas',   count: aceptadas.length,              color: 'text-blue-400' },
              { key: 'aprobadas',  label: '✅ Aprobadas',   count: aprobadas.length,              color: 'text-green-400' },
            ] as const;

            const listaActiva = agendamientoTab === 'nuevas' ? solicitudesNuevas : agendamientoTab === 'aceptadas' ? aceptadas : aprobadas;

            const grupos = agruparPorFecha(listaActiva);

            return (
              <div className="space-y-4">
                {/* Botón crear */}
                <Card className="border-primary/20 bg-gradient-to-br from-card to-primary/5">
                  <CardContent className="p-4">
                    <Button onClick={() => setModalCrear(true)}
                      className="w-full bg-primary hover:bg-primary/90 text-primary-foreground h-12 text-base font-semibold">
                      <Plus className="w-5 h-5 mr-2" />
                      Crear Agendamiento Manual
                    </Button>
                  </CardContent>
                </Card>

                {/* Sub-tabs */}
                <Card className="border-primary/20 bg-gradient-to-br from-card to-primary/5">
                  <CardHeader className="p-4 pb-0">
                    <div className="flex gap-1 bg-black/20 rounded-xl p-1">
                      {tabList.map(t => (
                        <button key={t.key}
                          onClick={() => setAgendamientoTab(t.key)}
                          className={`flex-1 flex items-center justify-center gap-1.5 rounded-lg py-2 px-2 text-xs sm:text-sm font-semibold transition-all ${
                            agendamientoTab === t.key
                              ? 'bg-primary text-black shadow'
                              : 'text-muted-foreground hover:text-white'
                          }`}
                        >
                          {t.label}
                          {t.count > 0 && (
                            <span className={`rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1 text-[10px] font-bold leading-none ${
                              agendamientoTab === t.key ? 'bg-black/30 text-white' : 'bg-white/10 text-white/70'
                            }`}>
                              {t.count}
                            </span>
                          )}
                        </button>
                      ))}
                    </div>
                  </CardHeader>
                  <CardContent className="p-4 pt-4">
                    {listaActiva.length === 0 ? (
                      <div className="text-center py-12">
                        <Calendar className="w-12 h-12 mx-auto mb-3 text-muted-foreground/20" />
                        <p className="text-muted-foreground text-sm">
                          {agendamientoTab === 'nuevas' ? 'No hay solicitudes pendientes' :
                           agendamientoTab === 'aceptadas' ? 'No hay citas aceptadas' :
                           'No hay citas completadas'}
                        </p>
                      </div>
                    ) : (
                      grupos.map(([fecha, citas]: [string, any[]]) => (
                        <div key={fecha}>
                          {/* Cabecera de fecha */}
                          <div className="flex items-center gap-2 px-3 py-2 mb-3 mt-4 first:mt-0 rounded-lg bg-primary/8 border border-primary/20">
                            <span className="text-base">📅</span>
                            <span className="text-primary font-semibold text-sm capitalize flex-1">
                              {formatearFechaGrupo(fecha)}
                            </span>
                            <span className="text-xs bg-primary/20 text-primary rounded-full px-2 py-0.5 font-semibold">
                              {citas.length} {citas.length === 1 ? 'solicitud' : 'solicitudes'}
                            </span>
                          </div>
                          {/* Cards del día */}
                          <div className="ml-2">
                            {citas.map((apt: any) => {
  const isNueva = ['pendiente', 'solicitud_cliente'].includes(apt.estado);
  const isAceptada = apt.estado === 'aprobado';
  return (
    <div key={apt.id} className={`rounded-xl p-4 mb-3 border transition-all ${
      isNueva    ? 'bg-amber-500/8 border-amber-500/40' :
      isAceptada ? 'bg-blue-500/8 border-blue-500/30' :
                   'bg-white/3 border-white/10'
    }`}>
      <div className="flex items-center justify-between mb-3">
        <span className={`font-bold text-sm ${isNueva ? 'text-amber-300' : isAceptada ? 'text-blue-300' : 'text-muted-foreground'}`}>
          📅 {fmtFecha(apt.fecha)} — {apt.hora || '--:--'}
        </span>
        <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold ${
          isNueva    ? 'bg-amber-500/20 text-amber-400' :
          isAceptada ? 'bg-blue-500/20 text-blue-400' :
          apt.estado === 'completado' ? 'bg-green-500/20 text-green-400' :
          apt.estado === 'cancelado'  ? 'bg-red-500/20 text-red-400' :
                                        'bg-white/10 text-white/50'
        }`}>
          {isNueva ? '⏳ Pendiente' : isAceptada ? '✅ Aceptada' :
           apt.estado === 'completado' ? '🎉 Completada' :
           apt.estado === 'cancelado'  ? '❌ Cancelada' :
           apt.estado === 'no_show'    ? '👻 No Show' : apt.estado}
        </span>
      </div>

      <div className="space-y-1.5 mb-3">
        <div className="text-sm"><span className="text-muted-foreground">👤 Cliente:</span>{' '}
          <span className="text-white font-medium">{apt.clienteNombre || apt.cliente_nombre || '—'}</span>
          {(apt.clienteTelefono || apt.cliente_telefono) && (
            <a href={`tel:${apt.clienteTelefono || apt.cliente_telefono}`} className="ml-2 text-green-400 text-xs hover:underline">
              📞 {apt.clienteTelefono || apt.cliente_telefono}
            </a>
          )}
        </div>
        <div className="text-sm"><span className="text-muted-foreground">💃 Modelo:</span>{' '}
          <span className="text-white font-medium">{apt.modeloNombre || apt.modelo_nombre || '—'}</span>
        </div>
        <div className="text-sm flex flex-wrap gap-x-4 gap-y-1">
          <span><span className="text-muted-foreground">⏱️</span> {apt.tipoServicio || apt.tipo_servicio}{apt.duracionMinutos ? ` — ${apt.duracionMinutos} min` : ''}</span>
          {(apt.montoPago || apt.precio) > 0 && (
            <span className="text-amber-400 font-semibold">💰 ${(Number(apt.montoPago || apt.precio)).toLocaleString('es-CO')}</span>
          )}
        </div>
      </div>

      {apt.notas && (
        <div className="text-xs text-muted-foreground bg-white/5 rounded-lg px-3 py-2 mb-3">
          📝 {apt.notas}
        </div>
      )}

      <div className="flex gap-2">
        <Button size="sm" variant="outline" className="h-8 w-8 p-0 flex-shrink-0"
          onClick={() => setModalDetalle({ isOpen: true, agendamiento: apt })}>
          <Eye className="w-4 h-4" />
        </Button>

        {isNueva && (
          <>
            <Button
              size="sm"
              className="flex-1 h-9 bg-gradient-to-r from-yellow-700 to-primary hover:from-yellow-600 hover:to-primary/90 text-black font-bold text-sm gap-1.5"
              disabled={aceptandoId === apt.id}
              onClick={() => handleAceptarClick(apt)}
            >
              {aceptandoId === apt.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
              Aceptar y asignar habitación
            </Button>
            <Button size="sm" variant="ghost"
              className="flex-shrink-0 h-9 px-3 border border-red-500/40 text-red-400 hover:bg-red-950/30 hover:text-red-300 text-sm"
              onClick={() => handleCancelarClick(apt)}>
              <XCircle className="w-4 h-4" />
            </Button>
          </>
        )}

        {isAceptada && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onSelect={() => handleCancelarClick(apt)}>
                <XCircle className="w-4 h-4 mr-2" /> Cancelar
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => handleNoShowClick(apt)}>
                <UserX className="w-4 h-4 mr-2" /> No Show
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </div>
  );
})}
                          </div>
                        </div>
                      ))
                    )}
                  </CardContent>
                </Card>
              </div>
            );
          })()}

          {activeTab === 'chat' && (
            <Card className="border-primary/20 bg-gradient-to-br from-card to-primary/5">
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="flex items-center gap-2 text-primary" style={{ fontFamily: 'Playfair Display, serif' }}>
                  <MessageSquare className="w-5 h-5" />
                  Chat Terminal
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="min-h-[500px]">
                  <TerminalChatProgramador userId={userId} userEmail={userEmail} />
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === 'habitaciones' && (
            <Card className="border-primary/20 bg-gradient-to-br from-card to-primary/5">
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="flex items-center gap-2 text-primary" style={{ fontFamily: 'Playfair Display, serif' }}>
                  <DoorOpen className="w-5 h-5" />
                   Gestión de Habitaciones
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 pt-0">
                <HabitacionesPanel />
              </CardContent>
            </Card>
          )}

          {activeTab === 'configuracion' && (
            <Card className="border-primary/20 bg-gradient-to-br from-card to-primary/5">
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="flex items-center gap-2 text-primary" style={{ fontFamily: 'Playfair Display, serif' }}>
                  <Settings className="w-5 h-5" />
                  Configuración del Sistema
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 pt-0">
                <ConfiguracionChatPanel />
              </CardContent>
            </Card>
          )}

          {activeTab === 'estadisticas' && (
            <ProgramadorAnalyticsPanel userEmail={userEmail} userId={userId} />
          )}

          {activeTab === 'notificaciones' ? (
            <div className="space-y-4">
              <Card className="border-primary/30 bg-gradient-to-br from-card to-card/50">
                <CardHeader className="p-4">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg font-bold flex items-center gap-2">
                      <Bell className="w-5 h-5 text-primary" />
                      Notificaciones
                      {noLeidas > 0 && (
                        <span className="bg-red-500 text-white text-xs font-bold rounded-full min-w-[20px] h-5 flex items-center justify-center px-1">
                          {noLeidas}
                        </span>
                      )}
                    </CardTitle>
                    {noLeidas > 0 && (
                      <button
                        onClick={async () => {
                          await supabase.from('notificaciones').update({ leida: true }).eq('usuario_id', currentUser.id).eq('leida', false);
                          setNotificaciones(prev => prev.map((n: any) => ({ ...n, leida: true })));
                          setNoLeidas(0);
                        }}
                        className="text-xs text-primary/70 hover:text-primary underline"
                      >
                        Marcar todas como leídas
                      </button>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="p-0 pb-2">
                  {notificaciones.length === 0 ? (
                    <div className="py-16 text-center">
                      <Bell className="w-12 h-12 mx-auto mb-3 text-muted-foreground/20" />
                      <p className="text-muted-foreground text-sm">No tienes notificaciones</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-border/30">
                      {notificaciones.map((notif: any) => (
                        <div
                          key={notif.id}
                          className={`p-4 transition-colors ${!notif.leida ? 'bg-primary/8' : ''}`}
                        >
                          <div className="flex gap-3">
                            <div className="text-2xl flex-shrink-0">
                              {notif.tipo === 'agendamiento_nuevo' ? '🔔' :
                               notif.tipo === 'agendamiento_confirmado' ? '✅' :
                               notif.tipo === 'pago_recibido' ? '💰' : '📢'}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2">
                                <h3 className={`text-sm font-semibold leading-tight ${!notif.leida ? 'text-white' : 'text-muted-foreground'}`}>
                                  {notif.titulo}
                                </h3>
                                {!notif.leida && <div className="w-2 h-2 bg-primary rounded-full flex-shrink-0 mt-1.5" />}
                              </div>
                              <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                                {notif.mensaje}
                              </p>
                              <p className="text-xs text-muted-foreground/40 mt-1">
                                {(() => { try { return new Date(notif.created_at).toLocaleString('es-CO', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }); } catch { return ''; } })()}
                              </p>

                              {notif.tipo === 'agendamiento_nuevo' && notif.referencia_id && (
                                <button
                                  onClick={async (e) => {
                                    e.stopPropagation();
                                    const { data: ag } = await supabase
                                      .from('agendamientos').select('*').eq('id', notif.referencia_id).single();
                                    if (ag) {
                                      setModalAceptar(ag);
                                      if (!notif.leida) {
                                        await supabase.from('notificaciones').update({ leida: true }).eq('id', notif.id);
                                        setNotificaciones(prev => prev.map((n: any) => n.id === notif.id ? { ...n, leida: true } : n));
                                        setNoLeidas(prev => Math.max(0, prev - 1));
                                      }
                                    } else {
                                      toast.error('Agendamiento no encontrado');
                                    }
                                  }}
                                  style={{
                                    marginTop: 10, width: '100%',
                                    background: 'linear-gradient(135deg, #B8860B, #FFD700)',
                                    border: 'none', borderRadius: 8,
                                    padding: '9px 14px', color: 'black',
                                    fontWeight: 700, cursor: 'pointer', fontSize: 12,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                                  }}
                                >
                                  ✅ Ver y aceptar agendamiento
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          ) : null}

          {activeTab === 'analytics' && (
            <div className="space-y-4 sm:space-y-6">
              <AnalyticsPanel />
            </div>
          )}
        </div>
      </main>

      {modalCancelar.agendamiento && (
        <CancelarAgendamientoModal
          isOpen={modalCancelar.isOpen}
          onClose={() => setModalCancelar({ isOpen: false, agendamiento: null, tipo: 'cancelar' })}
          agendamiento={modalCancelar.agendamiento}
          userEmail={userEmail}
          tipo={modalCancelar.tipo}
        />
      )}

      {modalCrear && (
        <CrearAgendamientoModal
          isOpen={modalCrear}
          onClose={() => setModalCrear(false)}
          userEmail={userEmail}
        />
      )}

      {modalDetalle.agendamiento && (
        <DetalleAgendamientoModal
          isOpen={modalDetalle.isOpen}
          onClose={() => setModalDetalle({ isOpen: false, agendamiento: null })}
          agendamiento={modalDetalle.agendamiento}
        />
      )}

      {/* ─── Modal Aceptar con habitación ───────────────────────────── */}
      {modalAceptar && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.88)' }}
          onClick={(e) => { if (e.target === e.currentTarget) { setModalAceptar(null); setHabitacionSeleccionada(null); } }}
        >
          <div className="w-full max-w-sm rounded-2xl p-6" style={{ background: '#111', border: '0.5px solid rgba(255,215,0,0.3)' }}>
            <h3 className="font-bold text-lg mb-4" style={{ color: '#FFD700' }}>✅ Aceptar cita</h3>

            {/* Resumen completo del agendamiento */}
            <div style={{
              background: 'rgba(255,255,255,0.05)', borderRadius: 10,
              padding: 14, marginBottom: 16
            }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, fontSize: 13 }}>
                <div>
                  <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 2 }}>CLIENTE</div>
                  <div style={{ fontWeight: 600, color: 'white' }}>{modalAceptar.clienteNombre || modalAceptar.cliente_nombre || '—'}</div>
                  {(modalAceptar.clienteTelefono || modalAceptar.cliente_telefono) && (
                    <a href={'tel:' + (modalAceptar.clienteTelefono || modalAceptar.cliente_telefono)}
                      style={{ color: '#4CAF50', fontSize: 11, textDecoration: 'none', display: 'block', marginTop: 2 }}>
                      📞 {modalAceptar.clienteTelefono || modalAceptar.cliente_telefono}
                    </a>
                  )}
                </div>
                <div>
                  <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 2 }}>MODELO</div>
                  <div style={{ fontWeight: 600, color: 'white' }}>{modalAceptar.modeloNombre || modalAceptar.modelo_nombre || 'Sin asignar'}</div>
                </div>
                <div>
                  <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 2 }}>FECHA</div>
                  <div style={{ fontWeight: 600, color: '#FFD700' }}>
                    {(() => {
                      const f = (modalAceptar.fecha || '').toString().split('T')[0];
                      if (!f) return '—';
                      const [y, m, d] = f.split('-');
                      return new Date(+y, +m - 1, +d).toLocaleDateString('es-CO', { weekday: 'short', day: 'numeric', month: 'long' });
                    })()}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 2 }}>HORA</div>
                  <div style={{ fontWeight: 600, color: '#FFD700' }}>
                    {(() => {
                      const h = (modalAceptar.hora || '').toString().substring(0, 5);
                      if (!h) return '—';
                      const [hh, mm] = h.split(':');
                      const n = parseInt(hh);
                      return (n % 12 || 12) + ':' + mm + ' ' + (n >= 12 ? 'PM' : 'AM');
                    })()}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 2 }}>SERVICIO</div>
                  <div style={{ color: 'white' }}>{modalAceptar.tipoServicio || modalAceptar.tipo_servicio || '—'}</div>
                </div>
                {(modalAceptar.montoPago || modalAceptar.precio) > 0 && (
                  <div>
                    <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 2 }}>PRECIO</div>
                    <div style={{ color: '#4CAF50', fontWeight: 700 }}>${Number(modalAceptar.montoPago || modalAceptar.precio).toLocaleString('es-CO')}</div>
                  </div>
                )}
                {(modalAceptar.ubicacion || modalAceptar.habitacion) && (
                  <div style={{ gridColumn: '1 / -1' }}>
                    <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 2 }}>UBICACIÓN</div>
                    <div style={{ color: 'white' }}>{modalAceptar.ubicacion || modalAceptar.habitacion}</div>
                  </div>
                )}
                {modalAceptar.notas && (
                  <div style={{ gridColumn: '1 / -1' }}>
                    <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 2 }}>NOTAS</div>
                    <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12 }}>{modalAceptar.notas}</div>
                  </div>
                )}
              </div>
            </div>

            <p className="text-xs text-white/50 mb-3 font-medium uppercase tracking-wider">Habitaciones (Asignación por Modelo)</p>

            {habitacionesDisponibles.length === 0 ? (
              <div className="p-4 text-center text-sm rounded-xl mb-4" style={{ background: 'rgba(255,0,0,0.1)', color: '#FF4444' }}>
                ⚠️ No hay habitaciones registradas
              </div>
            ) : (
              <div className="grid grid-cols-4 gap-2 mb-4 opacity-50 cursor-not-allowed">
                {habitacionesDisponibles.map((hab: any) => {
                  const enUso = !['disponible', 'libre'].includes(hab.estado);
                  return (
                    <div
                      key={hab.id}
                      title="La modelo asigna la habitación"
                      className="py-3 rounded-xl text-sm font-bold transition-all relative text-center"
                      style={{
                        border: '0.5px solid rgba(255,255,255,0.15)',
                        background: 'rgba(255,255,255,0.03)',
                        color: 'rgba(255,255,255,0.4)',
                      }}
                    >
                      {enUso ? '🔴' : '🟢'} {hab.numero}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Botones */}
            <div className="flex gap-2">
              <button
                onClick={() => { setModalAceptar(null); setHabitacionSeleccionada(null); }}
                className="flex-1 py-2.5 rounded-xl text-sm text-white/60 transition-all hover:text-white"
                style={{ border: '0.5px solid rgba(255,255,255,0.2)', background: 'transparent' }}
              >
                Cancelar
              </button>
              <button
                onClick={() => aceptarSinHabitacion(modalAceptar)}
                disabled={loadingAceptar}
                className="flex-[2] py-2.5 rounded-xl text-sm font-bold text-black disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                style={{ background: 'linear-gradient(135deg, #B8860B, #FFD700)' }}
              >
                {loadingAceptar ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Aceptando...</>
                ) : (
                  '✅ Aceptar agendamiento'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}