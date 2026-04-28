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

const SERVICIOS_MODAL = [
  { nombre: 'Rato',    duracion: '15 min',  duracion_minutos: 15,  precio: 130000 },
  { nombre: '30 Min',  duracion: '30 min',  duracion_minutos: 30,  precio: 160000 },
  { nombre: '1 Hora',  duracion: '1 hora',  duracion_minutos: 60,  precio: 190000 },
  { nombre: '2 Horas', duracion: '2 horas', duracion_minutos: 120, precio: 360000 },
  { nombre: '3 Horas', duracion: '3 horas', duracion_minutos: 180, precio: 520000 },
  { nombre: '6 Horas', duracion: '6 horas', duracion_minutos: 360, precio: 1000000 },
];

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
  const mañana = new Date(Date.now() + 86400000).toISOString().split('T')[0];
  const [modalReserva, setModalReserva] = useState<any>(null);
  const [modalServicio, setModalServicio] = useState<any>(null);
  const [modalFecha, setModalFecha] = useState('');
  const [modalHora, setModalHora] = useState('');
  const [modalSede, setModalSede] = useState<'sede_norte' | 'domicilio'>('sede_norte');
  const [modalDireccion, setModalDireccion] = useState('');
  const [loadingReserva, setLoadingReserva] = useState(false);

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

  const abrirModalReserva = (modelo: any) => {
    setModalReserva(modelo);
    setModalServicio(null);
    setModalFecha('');
    setModalHora('');
    setModalSede('sede_norte');
    setModalDireccion('');
  };

  const cerrarModal = () => { setModalReserva(null); };

  const enviarReserva = async () => {
    if (!modalServicio || !modalFecha || !modalHora) return;
    if (modalSede === 'domicilio' && !modalDireccion.trim()) {
      toast.error('Ingresa tu dirección para el domicilio');
      return;
    }
    setLoadingReserva(true);
    try {
      const modeloIdValido = modalReserva.id && String(modalReserva.id).includes('-') ? modalReserva.id : null;
      const clienteIdValido = userId && String(userId).includes('-') ? userId : null;

      const insertData = {
        cliente_id: clienteIdValido,
        cliente_email: userEmail,
        cliente_nombre: perfil?.nombre || userEmail,
        cliente_telefono: perfil?.telefono || 'No registrado',
        creado_por: userEmail,
        creado_por_rol: 'cliente',
        modelo_id: modeloIdValido,
        modelo_email: modalReserva.email,
        modelo_nombre: modalReserva.nombreArtistico || modalReserva.nombre || '',
        tipo_servicio: modalServicio.nombre,
        servicio: modalServicio.nombre,
        fecha: modalFecha,
        hora: modalHora,
        duracion: modalServicio.duracion_minutos || 60,
        duracion_minutos: modalServicio.duracion_minutos || 60,
        precio: modalServicio.precio,
        monto_pago: modalServicio.precio,
        ubicacion: modalSede === 'sede_norte' ? 'Sede Norte' : 'Domicilio',
        habitacion: modalSede === 'sede_norte' ? 'Por asignar' : modalDireccion,
        estado: 'pendiente',
        estado_pago: 'pendiente',
      };

      console.log('INSERT DATA (ClienteDashboard):', insertData);

      const { data: nuevoAg, error } = await supabase.from('agendamientos').insert(insertData).select().single();

      if (error) throw error;

      if (nuevoAg) {
        notificarProgramadores({
          clienteNombre: perfil?.nombre || userEmail,
          modeloNombre: modalReserva.nombreArtistico || modalReserva.nombre || '',
          fecha: modalFecha,
          hora: modalHora,
          tipoServicio: modalServicio.nombre,
          agendamientoId: nuevoAg.id,
          duracion: modalServicio.duracion_minutos,
        }).catch(() => {});
      }

      toast.success('Reserva enviada. Te notificaremos cuando sea confirmada.');
      cerrarModal();
      setTab('citas');
      await cargarCitas();
    } catch (e: any) {
      toast.error('Error al enviar la reserva: ' + e.message);
    }
    setLoadingReserva(false);
  };

  const totalCitas = citasHoy.length + proximas.length + historial.length;
  const citasCompletadas = historial.filter(c => c.estado === 'completado').length;
  const totalGastado = historial
    .filter(c => c.estado === 'completado')
    .reduce((acc, c) => acc + (Number(c.precio) || 0), 0);

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
            onAbrirModal={abrirModalReserva}
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
            totalGastado={totalGastado}
          />
        )}
      </div>

      {/* ─── Modal de Reserva ─────────────────────────────────────────────── */}
      {modalReserva && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.88)' }}
          onClick={(e) => { if (e.target === e.currentTarget) cerrarModal(); }}
        >
          <div
            className="w-full max-w-md rounded-2xl overflow-y-auto"
            style={{ background: '#111', border: '0.5px solid rgba(255,215,0,0.25)', maxHeight: '92vh' }}
          >
            {/* Cabecera */}
            <div className="flex items-center gap-3 p-5 border-b border-white/10">
              {modalReserva.foto_url && (
                <img
                  src={modalReserva.foto_url}
                  alt=""
                  className="w-12 h-12 rounded-full object-cover flex-shrink-0"
                  onError={(e: any) => { e.target.style.display = 'none'; }}
                />
              )}
              <div className="flex-1 min-w-0">
                <p className="font-bold text-amber-400 truncate">
                  {modalReserva.nombreArtistico || modalReserva.nombre}
                </p>
                <p className="text-xs text-white/40">Confirmar reserva</p>
              </div>
              <button onClick={cerrarModal} className="text-white/40 hover:text-white text-2xl leading-none ml-2">×</button>
            </div>

            <div className="p-5 space-y-5">
              {/* Servicios */}
              <div>
                <p className="text-xs text-white/50 mb-3 font-medium uppercase tracking-wider">Selecciona el servicio</p>
                <div className="grid grid-cols-2 gap-2">
                  {SERVICIOS_MODAL.map(s => (
                    <div
                      key={s.nombre}
                      onClick={() => setModalServicio(s)}
                      className="p-3 rounded-xl cursor-pointer transition-all"
                      style={{
                        border: modalServicio?.nombre === s.nombre ? '1.5px solid #FFD700' : '0.5px solid rgba(255,255,255,0.1)',
                        background: modalServicio?.nombre === s.nombre ? 'rgba(255,215,0,0.1)' : 'rgba(255,255,255,0.03)',
                      }}
                    >
                      <p className="font-semibold text-sm text-white">{s.nombre}</p>
                      <p className="text-xs text-white/40 mt-0.5">⏱ {s.duracion}</p>
                      <p className="text-sm font-bold mt-1.5" style={{ color: '#4CAF50' }}>
                        ${s.precio.toLocaleString('es-CO')}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Sede */}
              <div>
                <p className="text-xs text-white/50 mb-3 font-medium uppercase tracking-wider">¿Dónde prefieres el servicio?</p>
                <div className="flex gap-2">
                  {[
                    { key: 'sede_norte' as const, label: '🏢 Sede Norte' },
                    { key: 'domicilio' as const, label: '🏠 A Domicilio' },
                  ].map(({ key, label }) => (
                    <button
                      key={key}
                      onClick={() => setModalSede(key)}
                      className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white transition-all"
                      style={{
                        border: modalSede === key ? '1.5px solid #FFD700' : '0.5px solid rgba(255,255,255,0.1)',
                        background: modalSede === key ? 'rgba(255,215,0,0.1)' : 'rgba(255,255,255,0.03)',
                      }}
                    >
                      {label}
                    </button>
                  ))}
                </div>
                {modalSede === 'domicilio' && (
                  <input
                    placeholder="Escribe tu dirección completa"
                    value={modalDireccion}
                    onChange={e => setModalDireccion(e.target.value)}
                    className="w-full mt-2 px-3 py-2.5 rounded-xl text-sm text-white placeholder:text-white/20 focus:outline-none"
                    style={{ background: 'rgba(255,255,255,0.05)', border: '0.5px solid rgba(255,255,255,0.1)' }}
                  />
                )}
                {modalSede === 'sede_norte' && (
                  <p className="mt-2 text-xs text-white/30 px-1">📍 Dirección exacta se comparte al confirmar la cita</p>
                )}
              </div>

              {/* Fecha */}
              <div>
                <p className="text-xs text-white/50 mb-3 font-medium uppercase tracking-wider">Fecha del servicio</p>
                <input
                  type="date"
                  value={modalFecha}
                  min={mañana}
                  onChange={e => setModalFecha(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl text-sm text-white focus:outline-none"
                  style={{ background: 'rgba(255,255,255,0.05)', border: '0.5px solid rgba(255,255,255,0.1)' }}
                />
              </div>

              {/* Hora */}
              <div>
                <p className="text-xs text-white/50 mb-3 font-medium uppercase tracking-wider">Hora preferida</p>
                <div className="grid grid-cols-4 gap-1.5">
                  {['10:00','11:00','12:00','13:00','14:00','15:00','16:00','17:00','18:00','19:00','20:00','21:00'].map(h => (
                    <button
                      key={h}
                      onClick={() => setModalHora(h)}
                      className="py-2 rounded-lg text-xs transition-all"
                      style={{
                        border: modalHora === h ? '1.5px solid #FFD700' : '0.5px solid rgba(255,255,255,0.1)',
                        background: modalHora === h ? 'rgba(255,215,0,0.15)' : 'rgba(255,255,255,0.03)',
                        color: modalHora === h ? '#FFD700' : 'rgba(255,255,255,0.6)',
                        fontWeight: modalHora === h ? 700 : 400,
                      }}
                    >
                      {h}
                    </button>
                  ))}
                </div>
              </div>

              {/* Resumen */}
              {modalServicio && modalFecha && modalHora && (
                <div className="rounded-xl p-4" style={{ background: 'rgba(255,215,0,0.07)', border: '0.5px solid rgba(255,215,0,0.25)' }}>
                  <p className="text-xs font-bold text-amber-400 mb-2.5 uppercase tracking-wider">📋 Resumen de tu reserva</p>
                  <div className="space-y-1 text-sm text-white/75">
                    <p>💃 <strong className="text-white">{modalReserva.nombreArtistico || modalReserva.nombre}</strong></p>
                    <p>⏱ {modalServicio.nombre} — {modalServicio.duracion}</p>
                    <p>📅 {formatearFechaES(modalFecha)}</p>
                    <p>🕐 {formatearHora(modalHora)}</p>
                    <p>📍 {modalSede === 'sede_norte' ? 'Sede Norte' : `A domicilio — ${modalDireccion}`}</p>
                    <p className="pt-2 text-base font-bold" style={{ color: '#4CAF50' }}>
                      💰 Total: ${modalServicio.precio.toLocaleString('es-CO')}
                      {modalSede === 'domicilio' ? ' + desplazamiento' : ''}
                    </p>
                  </div>
                </div>
              )}

              {/* Botón confirmar */}
              <button
                onClick={enviarReserva}
                disabled={!modalServicio || !modalFecha || !modalHora || loadingReserva || (modalSede === 'domicilio' && !modalDireccion.trim())}
                className="w-full py-3.5 rounded-xl text-sm font-bold text-black transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                style={{ background: 'linear-gradient(135deg, #B8860B, #FFD700)' }}
              >
                {loadingReserva ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Enviando reserva...</>
                ) : (
                  '✅ Confirmar reserva'
                )}
              </button>
              {(!modalServicio || !modalFecha || !modalHora) && (
                <p className="text-center text-xs text-white/30">
                  Selecciona servicio, fecha y hora para continuar
                </p>
              )}
            </div>
          </div>
        </div>
      )}
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
  modelosActivos, onAbrirModal
}: {
  modelosActivos: any[];
  onAbrirModal: (modelo: any) => void;
}) {
  if (modelosActivos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mb-4">
          <Sparkles className="w-8 h-8 text-amber-400/60" />
        </div>
        <p className="text-white/60 font-medium">No hay modelos disponibles</p>
        <p className="text-sm text-white/30 mt-1">Vuelve pronto, nuevas chicas se unen cada semana</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-semibold text-white">Solicitar Cita</h2>
        <p className="text-sm text-white/40 mt-0.5">Elige tu modelo y confirma la reserva.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {modelosActivos.map((m: any) => (
          <div
            key={m.id}
            className="rounded-2xl overflow-hidden"
            style={{ background: '#161616', border: '0.5px solid rgba(255,255,255,0.08)' }}
          >
            {/* Foto */}
            <div className="relative h-48 bg-white/5 overflow-hidden">
              {m.foto_url ? (
                <img
                  src={m.foto_url}
                  alt={m.nombreArtistico || m.nombre}
                  className="w-full h-full object-cover"
                  onError={(e: any) => { e.target.style.display = 'none'; }}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <User className="w-12 h-12 text-white/10" />
                </div>
              )}
              <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.7) 30%, transparent)' }} />
              <div className="absolute bottom-3 left-3">
                <p className="font-bold text-white text-base leading-tight">{m.nombreArtistico || m.nombre}</p>
                {m.edad && <p className="text-xs text-white/60">{m.edad} años</p>}
              </div>
            </div>

            {/* Botón */}
            <div className="p-3">
              <button
                onClick={() => onAbrirModal(m)}
                className="w-full py-3 rounded-xl text-sm font-bold text-black transition-all active:scale-95"
                style={{ background: 'linear-gradient(135deg, #B8860B, #FFD700)' }}
              >
                Confirmar reserva
              </button>
            </div>
          </div>
        ))}
      </div>
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
  perfil, editandoPerfil, setEditandoPerfil, formPerfil, setFormPerfil, onGuardar, totalCitas, citasCompletadas, totalGastado
}: {
  perfil: any; editandoPerfil: boolean; setEditandoPerfil: (v: boolean) => void;
  formPerfil: any; setFormPerfil: any; onGuardar: () => void;
  totalCitas: number; citasCompletadas: number; totalGastado: number;
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
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Citas totales', value: totalCitas },
          { label: 'Completadas', value: citasCompletadas },
          { label: 'Total gastado', value: `$${totalGastado.toLocaleString('es-CO')}` },
        ].map(({ label, value }) => (
          <div key={label} className="bg-white/[0.03] border border-white/8 rounded-xl p-3 text-center flex flex-col justify-center items-center">
            <p className="text-lg font-bold text-amber-400 truncate max-w-full">{value}</p>
            <p className="text-[10px] text-white/40 mt-0.5">{label}</p>
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
