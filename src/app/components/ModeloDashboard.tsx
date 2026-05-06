import { useState, lazy, Suspense, useEffect, useRef } from 'react';
import IngresosWidget from '../../components/IngresosWidget';
import { GaleriaFotosModelo } from '../../components/GaleriaFotosModelo';
import { format, subMonths, startOfMonth, getMonth, getYear, parseISO, isValid } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  User,
  Calendar,
  DollarSign,
  CheckCircle,
  Clock,
  TrendingUp,
  Activity,
  CreditCard,
  XCircle,
  Camera,
  Play,
  ShoppingBag,
  ShoppingCart,
  Sparkles,
  MapPin,
  Bell,
  PieChart,
  Menu,
  X,
  BarChart3,
  Home,
  Zap,
  Users,
  Download,
  Search,
  ChevronLeft,
  ChevronRight,
  Save,
  Edit3,
  RefreshCw,
  LogOut,
  Video,
  History
} from 'lucide-react';
import {
  BarChart, Bar, PieChart as RechartsPie, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart
} from 'recharts';
// import { LogoIsotipo } from './LogoIsotipo';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '../../components/ui/avatar';
import { useModelos } from './ModelosContext';
import { useServicios, Servicio } from './ServiciosContext';
import { useMultas } from './MultasContext';
import { usePagos } from './PagosContext';
import { useAgendamientos, formatearHora } from './AgendamientosContext';
import { useAsistencia } from './AsistenciaContext';
import { useInventory } from './InventoryContext';
import { useCarrito } from './CarritoContext';
import { supabase } from '../../utils/supabase/info';
import { toast } from 'sonner';
import { useServiceAlarms } from './useServiceAlarms';
import { ConfirmarAgendamientoModeloModal } from '../../components/ConfirmarAgendamientoModeloModal';
import type { CalificacionData } from '../../components/CalificarClienteModal';

// Lazy loading de paneles pesados
// const AgendamientosPanel = lazy(() => import('./AgendamientosPanel').then(m => ({ default: m.AgendamientosPanel })));
// const AgendamientosMetrics = lazy(() => import('./AgendamientosMetrics').then(m => ({ default: m.AgendamientosMetrics })));
const RegistroEntradaModal = lazy(() => import('../../components/RegistroEntradaModal').then(m => ({ default: m.RegistroEntradaModal })));
const IniciarServicioModal = lazy(() => import('../../components/IniciarServicioModal').then(m => ({ default: m.IniciarServicioModal })));
const ServicioDirectoModal = lazy(() => import('./ServicioDirectoModal').then(m => ({ default: m.ServicioDirectoModal })));
const ServicioActivoCard = lazy(() => import('../../components/ServicioActivoCard').then(m => ({ default: m.ServicioActivoCard })));
const CarritoBoutiqueModal = lazy(() => import('../../components/CarritoBoutiqueModal').then(m => ({ default: m.CarritoBoutiqueModal })));
const CheckoutBoutiqueModal = lazy(() => import('../../components/CheckoutBoutiqueModal').then(m => ({ default: m.CheckoutBoutiqueModal })));
const CalendarioModeloView = lazy(() => import('../../components/CalendarioModeloView').then(m => ({ default: m.CalendarioModeloView })));
const CalendarioPanel = lazy(() => import('../../components/CalendarioPanel').then(m => ({ default: m.CalendarioPanel })));
const DetalleCitaModal = lazy(() => import('../../components/DetalleCitaModal').then(m => ({ default: m.DetalleCitaModal })));
const NotificacionesPanel = lazy(() => import('./NotificacionesPanel').then(m => ({ default: m.NotificacionesPanel })));
// const AnalyticsPanel = lazy(() => import('./AnalyticsPanel').then(m => ({ default: m.AnalyticsPanel })));
const StreamingControl = lazy(() => import('./StreamingControl').then(m => ({ default: m.StreamingControl })));
const CalificarClienteModal = lazy(() => import('../../components/CalificarClienteModal').then(m => ({ default: m.CalificarClienteModal })));

interface ModeloDashboardProps {
  accessToken: string;
  userId: string;
  userEmail: string;
  onLogout: () => void;
}

// ─── Colores del sistema de diseño ───────────────────────────────────────────
const CHART_COLORS = ['#c9a84c', '#e8c97a', '#a07830', '#7c5c1e', '#f0d890', '#d4af37'];
const formatCOP = (v: number) => `$${v.toLocaleString('es-CO')}`;

// ─── Helper: imagen de producto ───────────────────────────────────────────────
const getFotoProducto = (producto: { nombre?: string; imagen?: string; categoria?: string }): string => {
  if (producto.imagen) return producto.imagen;

  const nombre = producto.nombre?.toLowerCase() || '';
  const categoria = producto.categoria?.toLowerCase() || '';

  if (nombre.includes('perfume') || nombre.includes('fragancia') || categoria.includes('perfume'))
    return 'https://images.unsplash.com/photo-1541643600914-78b084683702?w=400&q=80';
  if (nombre.includes('labial') || nombre.includes('labios') || categoria.includes('maquillaje'))
    return 'https://images.unsplash.com/photo-1586495777744-4e6232bf2263?w=400&q=80';
  if (nombre.includes('ropa') || nombre.includes('vestido') || nombre.includes('outfit') || categoria.includes('ropa'))
    return 'https://images.unsplash.com/photo-1445205170230-053b83016050?w=400&q=80';
  if (nombre.includes('lenceria') || nombre.includes('lencería') || categoria.includes('lenceria') || categoria.includes('ropa interior'))
    return 'https://images.unsplash.com/photo-1616763355548-1b606f439f86?w=400&q=80';
  if (nombre.includes('zapato') || nombre.includes('tacon') || nombre.includes('tacón') || nombre.includes('calzado'))
    return 'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=400&q=80';
  if (nombre.includes('accesorio') || nombre.includes('collar') || nombre.includes('aretes') || nombre.includes('joya') || categoria.includes('accesorios'))
    return 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=400&q=80';
  if (nombre.includes('bolso') || nombre.includes('cartera') || nombre.includes('bolsa'))
    return 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=400&q=80';
  if (nombre.includes('crema') || nombre.includes('locion') || nombre.includes('loción') || nombre.includes('cuidado'))
    return 'https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=400&q=80';
  if (nombre.includes('kit') || nombre.includes('set') || nombre.includes('combo'))
    return 'https://images.unsplash.com/photo-1512496015851-a90fb38ba796?w=400&q=80';
  if (nombre.includes('vela') || nombre.includes('aromatica') || nombre.includes('aromática'))
    return 'https://images.unsplash.com/photo-1602523961358-f9f03dd557db?w=400&q=80';
  if (nombre.includes('toalla') || nombre.includes('sabana') || nombre.includes('sábana'))
    return 'https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?w=400&q=80';
  if (nombre.includes('copa') || nombre.includes('vino') || nombre.includes('champagne') || nombre.includes('bebida') || categoria.includes('bebidas'))
    return 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=400&q=80';
  if (nombre.includes('chocolate') || nombre.includes('dulce') || nombre.includes('snack') || categoria.includes('snacks'))
    return 'https://images.unsplash.com/photo-1481391319762-47dff72954d9?w=400&q=80';
  if (nombre.includes('masaje') || nombre.includes('aceite') || nombre.includes('spa'))
    return 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=400&q=80';
  if (nombre.includes('preservativo') || nombre.includes('condon') || nombre.includes('condón') || categoria.includes('preservativos'))
    return 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=400&q=80';
  if (nombre.includes('lubricante') || categoria.includes('lubricantes'))
    return 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=400&q=80';
  if (nombre.includes('cigarro') || nombre.includes('cigarrillo') || nombre.includes('tabaco') || categoria.includes('cigarrillos'))
    return 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=400&q=80';
  if (nombre.includes('juguete') || categoria.includes('juguetes'))
    return 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=400&q=80';

  return 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=400&q=80';
};

// ─── Skeletons ────────────────────────────────────────────────────────────────
/*
function KPISkeleton() {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {[1, 2, 3, 4].map(i => (
        <div key={i} className="h-28 rounded-xl animate-pulse bg-white/5 border border-white/10" />
      ))}
    </div>
  );
}
*/

function ChartSkeleton({ h = 280 }: { h?: number }) {
  return <div className={`rounded-xl animate-pulse bg-white/5 border border-white/10`} style={{ height: h }} />;
}

// ─── Tooltip COP personalizado ────────────────────────────────────────────────
function TooltipCOP({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-black/90 border border-yellow-500/30 rounded-lg px-3 py-2 text-sm">
      <p className="text-yellow-400 font-semibold mb-1">{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} style={{ color: p.color }}>{p.name}: {formatCOP(p.value)}</p>
      ))}
    </div>
  );
}

// ─── TemporizadorTurno: siempre visible, muestra jornada activa o "sin turno" ─
function JornadaBanner({ userEmail, onRegistrarEntrada }: { userEmail: string; onRegistrarEntrada: () => void }) {
  const { jornadas, finalizarJornada, obtenerRegistroActual, obtenerSolicitudPorModelo } = useAsistencia();
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const jornadaActiva = (jornadas || []).find(j => j.modeloEmail === userEmail && j.estado === 'en_curso');

  if (!jornadaActiva) {
    const solicitud = obtenerSolicitudPorModelo(userEmail);
    const registro = obtenerRegistroActual(userEmail);
    return (
      <Card className="border-[#2a2a2a] bg-[#16181c]">
        <CardContent className="p-3 sm:p-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center flex-shrink-0">
                <Clock className="w-5 h-5 text-red-400" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-white">⏱️ Sin turno activo</p>
                <p className="text-xs text-muted-foreground">
                  {solicitud ? 'Solicitud de entrada pendiente de aprobación' : 'Registra tu entrada para iniciar el turno'}
                </p>
              </div>
            </div>
            {!solicitud && !registro && (
              <Button onClick={onRegistrarEntrada} size="sm" className="bg-primary text-black hover:bg-primary/90 gap-1.5 flex-shrink-0">
                <Camera className="w-4 h-4" />
                <span className="hidden sm:inline">Registrar</span> Entrada
              </Button>
            )}
            {solicitud && (
              <span className="text-xs px-2 py-1 rounded-full bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 flex-shrink-0 whitespace-nowrap">
                ⏳ Pendiente
              </span>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  const diffMs = now.getTime() - new Date(jornadaActiva.horaInicio).getTime();
  const diffSecs = Math.max(0, Math.floor(diffMs / 1000));
  const horas = Math.floor(diffSecs / 3600);
  const mins = Math.floor((diffSecs % 3600) / 60);
  const secs = diffSecs % 60;
  const totalReqSecs = (jornadaActiva.horasRequeridas || 8) * 3600;
  const progreso = Math.min(100, (diffSecs / totalReqSecs) * 100);
  const faltanSecs = Math.max(0, totalReqSecs - diffSecs);
  const faltanHoras = Math.floor(faltanSecs / 3600);
  const faltanMins = Math.floor((faltanSecs % 3600) / 60);
  const colorBarra = progreso < 40 ? '#ef4444' : progreso < 75 ? '#eab308' : progreso < 100 ? '#22c55e' : '#c9a961';

  const handleCheckout = async () => {
    const confirm = window.confirm(
      progreso < 100
        ? `⚠️ Aún no has completado las ${jornadaActiva.horasRequeridas} horas de turno. Si finalizas ahora, el sistema generará una multa automática. ¿Deseas continuar?`
        : `¿Deseas finalizar tu jornada de hoy?`
    );
    if (confirm) {
      try {
        await finalizarJornada(jornadaActiva.id);
        toast.success("Jornada finalizada correctamente");
      } catch (e: any) {
        toast.error("Error al finalizar jornada: " + e.message);
      }
    }
  };

  const horaInicio = jornadaActiva.horaInicio instanceof Date
    ? jornadaActiva.horaInicio
    : new Date(jornadaActiva.horaInicio);

  return (
    <Card className="border-[#2a2a2a] bg-[#16181c] overflow-hidden relative">
      <div className="absolute bottom-0 left-0 h-1 bg-[#2a2a2a] w-full" />
      <div
        className="absolute bottom-0 left-0 h-1 transition-all duration-1000"
        style={{ width: `${progreso}%`, backgroundColor: colorBarra, boxShadow: `0 0 8px ${colorBarra}66` }}
      />
      <CardContent className="p-3 sm:p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[#888] text-xs flex items-center gap-1.5 font-medium">⏱️ TURNO</span>
          <span className={`text-[10px] px-2 py-0.5 rounded-full flex items-center gap-1 border ${
            progreso >= 100
              ? 'bg-[#c9a961]/20 text-[#c9a961] border-[#c9a961]/30'
              : 'bg-green-500/20 text-green-400 border-green-500/30'
          }`}>
            {progreso >= 100 ? '✅ Turno completo' : '🟢 En turno'}
          </span>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="flex-shrink-0">
            <span className="text-3xl sm:text-4xl font-black tabular-nums tracking-tighter" style={{ color: colorBarra }}>
              {horas.toString().padStart(2, '0')}
              <span className="text-[#444] mx-0.5">:</span>
              {mins.toString().padStart(2, '0')}
              <span className="text-[#444] mx-0.5">:</span>
              {secs.toString().padStart(2, '0')}
            </span>
          </div>
          <div className="flex-1 min-w-0 space-y-1.5">
            <div className="flex justify-between text-[11px] text-[#888]">
              <span>Entrada: {horaInicio.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}</span>
              <span style={{ color: colorBarra }}>{Math.floor(progreso)}%</span>
              <span>{progreso >= 100 ? '✅ Completo' : `Faltan ${faltanHoras}h ${faltanMins}m`}</span>
            </div>
          </div>
          <Button
            onClick={handleCheckout}
            size="sm"
            className={`flex-shrink-0 ${progreso >= 100 ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600/20 hover:bg-red-600 border border-red-500/50'} text-white font-bold h-9 px-4 rounded-xl gap-1.5`}
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Finalizar</span> Jornada
          </Button>
        </div>
        {progreso >= 100 && (
          <div className="mt-2 text-center text-[11px] text-[#c9a961] bg-[#c9a961]/10 rounded-lg py-1.5">
            ✅ ¡Completaste tus {jornadaActiva.horasRequeridas}h! Puedes salir sin multa
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── TemporizadorServicio: contador dorado del servicio activo ────────────────
function TemporizadorServicio({ servicio }: { servicio: Servicio }) {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const horaInicio = servicio.horaInicio
    ? (servicio.horaInicio instanceof Date ? servicio.horaInicio : new Date(servicio.horaInicio))
    : new Date();
  const diffMs = Math.max(0, now.getTime() - horaInicio.getTime());
  const diffSecs = Math.floor(diffMs / 1000);
  const horas = Math.floor(diffSecs / 3600);
  const mins = Math.floor((diffSecs % 3600) / 60);
  const secs = diffSecs % 60;
  const duracionSecs = (servicio.duracionMinutos || 60) * 60;
  const porcentaje = Math.min(100, (diffSecs / duracionSecs) * 100);
  const excedido = porcentaje >= 100;
  const colorActivo = excedido ? '#ef4444' : '#c9a961';

  return (
    <Card className="overflow-hidden relative" style={{ border: `1px solid ${colorActivo}44`, background: `${colorActivo}08` }}>
      <div className="absolute bottom-0 left-0 h-1 bg-[#2a2a2a] w-full" />
      <div
        className="absolute bottom-0 left-0 h-1 transition-all duration-1000"
        style={{ width: `${porcentaje}%`, backgroundColor: colorActivo, boxShadow: `0 0 8px ${colorActivo}66` }}
      />
      <CardContent className="p-3 sm:p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold flex items-center gap-1.5" style={{ color: colorActivo }}>
            🛎️ SERVICIO ACTIVO
          </span>
          <span className={`text-[10px] px-2 py-0.5 rounded-full flex items-center gap-1 border ${
            excedido
              ? 'bg-red-500/20 text-red-400 border-red-500/30'
              : 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
          }`}>
            {excedido ? '⚠️ Tiempo excedido' : '💛 En progreso'}
          </span>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="flex-shrink-0">
            <p className="text-[11px] text-[#888] mb-1">
              Cliente: <span className="text-[#e8e6e3] font-medium">{servicio.clienteNombre || 'Anónimo'}</span>
              {servicio.habitacion && <span className="ml-2">· 🏠 {servicio.habitacion}</span>}
            </p>
            <span className="text-3xl sm:text-4xl font-black tabular-nums tracking-tighter" style={{ color: colorActivo }}>
              {horas.toString().padStart(2, '0')}
              <span className="opacity-40 mx-0.5">:</span>
              {mins.toString().padStart(2, '0')}
              <span className="opacity-40 mx-0.5">:</span>
              {secs.toString().padStart(2, '0')}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex justify-between text-[11px] text-[#888]">
              <span>💆 {servicio.tipoServicio}</span>
              <span style={{ color: colorActivo }}>{Math.floor(porcentaje)}%</span>
              <span>{servicio.duracionMinutos ?? '—'}min pactados</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Component principal ──────────────────────────────────────────────────────
export function ModeloDashboard({ accessToken: _accessToken, userId, userEmail, onLogout }: ModeloDashboardProps) {
  const [selectedTab, setSelectedTab] = useState('inicio');
  const [menuOpen, setMenuOpen] = useState(false);
  const [mostrarRegistroEntrada, setMostrarRegistroEntrada] = useState(false);
  const [mostrarIniciarServicio, setMostrarIniciarServicio] = useState(false);
  const [mostrarServicioDirecto, setMostrarServicioDirecto] = useState(false);
  const [mostrarCarritoBoutique, setMostrarCarritoBoutique] = useState(false);
  const [mostrarCheckoutBoutique, setMostrarCheckoutBoutique] = useState(false);
  const [citaSeleccionada, setCitaSeleccionada] = useState<any>(null);
  const [mostrarConfirmarAgendamiento, setMostrarConfirmarAgendamiento] = useState(false);
  const [agendamientoAConfirmar, setAgendamientoAConfirmar] = useState<any>(null);
  const [calificacionPendiente, setCalificacionPendiente] = useState<CalificacionData | null>(null);

  // 🔔 Integrar alarmas de 15 min para la modelo
  useServiceAlarms(userEmail, 'modelo');

  // Carrito local (independiente del CarritoContext)
  const [carritoLocal, setCarritoLocal] = useState<Array<{
    id: string; nombre: string; precio: number;
    imagen?: string; categoria?: string; cantidad: number;
  }>>([]);
  const [mostrarPanelCarrito, setMostrarPanelCarrito] = useState(false);
  const [enviandoSolicitud, setEnviandoSolicitud] = useState(false);
  const [categoriaFiltroBoutique, setCategoriaFiltroBoutique] = useState('Todos');

  // Estados Selfie Check-in
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [camaraActiva, setCamaraActiva] = useState(false);
  const [selfiePreview, setSelfiePreview] = useState<string | null>(null);
  const [selfieFile, setSelfieFile] = useState<File | null>(null);
  const [subiendo, setSubiendo] = useState(false);
  const [selfieEnviada, setSelfieEnviada] = useState(false);
  const [errorCamara, setErrorCamara] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Estados para datos directos de Supabase
  const [liquidaciones, setLiquidaciones] = useState<any[]>([]);
  const [loadingLiquidaciones, setLoadingLiquidaciones] = useState(true);

  // Perfil directo desde Supabase (más confiable que el contexto)
  const [perfilDB, setPerfilDB] = useState<any>(null);
  const [loadingPerfilDB, setLoadingPerfilDB] = useState(true);

  // Estado perfil editable
  const [editandoPerfil, setEditandoPerfil] = useState(false);
  const [perfilForm, setPerfilForm] = useState({ nombreArtistico: '', descripcion: '', especialidades: '' });
  const [guardandoPerfil, setGuardandoPerfil] = useState(false);

  // Paginación servicios
  const [paginaServicios, setPaginaServicios] = useState(1);
  const [filtroServicios, setFiltroServicios] = useState<'mes' | '3meses' | 'todo' | 'directos'>('mes');
  const [busquedaServicios, setBusquedaServicios] = useState('');
  
  // Boutique: Mis Pedidos
  const [misPedidos, setMisPedidos] = useState<any[]>([]);
  const [loadingPedidos, setLoadingPedidos] = useState(true);

  const { modelos } = useModelos();
  const { servicios, recargarServicios } = useServicios();
  const { multas, obtenerTotalMultasPendientesPorEmail } = useMultas();
  const { obtenerAdelantosPendientes } = usePagos();
  const { obtenerAgendamientosPendientes, obtenerAgendamientosPorModelo, recargarAgendamientos } = useAgendamientos();
  const { registrarSalida, obtenerRegistroActual, obtenerSolicitudPorModelo, crearSolicitudEntrada, jornadas } = useAsistencia();
  const { inventario, recargarProductos } = useInventory();
  const { carrito } = useCarrito();

  useEffect(() => {
    recargarAgendamientos();
    recargarServicios();
    recargarProductos();
  }, []);

  // ── PERFIL DIRECTO DESDE SUPABASE (fuente más confiable) ──────────────────
  useEffect(() => {
    const fetchPerfil = async () => {
      if (!userId && !userEmail) { setLoadingPerfilDB(false); return; }
      try {
        // Intentar por userId primero, si falla por email
        let data: any = null;
        if (userId) {
          const res = await supabase
            .from('usuarios')
            .select('*')
            .eq('id', userId)
            .eq('role', 'modelo')
            .maybeSingle();
          data = res.data;
        }
        if (!data && userEmail) {
          const res = await supabase
            .from('usuarios')
            .select('*')
            .eq('email', userEmail)
            .eq('role', 'modelo')
            .maybeSingle();
          data = res.data;
        }
        setPerfilDB(data || null);
      } catch {
        setPerfilDB(null);
      } finally {
        setLoadingPerfilDB(false);
      }
    };
    fetchPerfil();
  }, [userId, userEmail]);

  // ── CARGAR MIS PEDIDOS BOUTIQUE ───────────────────────────────────────────
  const cargarMisPedidos = async () => {
    if (!userId && !userEmail) return;
    try {
      const { data, error } = await supabase
        .from('ventas_boutique')
        .select('*')
        .eq('modelo_id', userId)
        .order('fecha', { ascending: false });
      
      if (error) throw error;
      setMisPedidos(data || []);
    } catch (err) {
      console.error('Error cargando pedidos boutique:', err);
    } finally {
      setLoadingPedidos(false);
    }
  };

  useEffect(() => {
    cargarMisPedidos();

    // Suscripción Realtime para cambios en mis pedidos
    const channel = supabase
      .channel(`mis-pedidos-${userId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'ventas_boutique',
        filter: `modelo_id=eq.${userId}`
      }, (payload) => {
        if (payload.eventType === 'INSERT') {
          setMisPedidos(prev => [payload.new, ...prev]);
        } else if (payload.eventType === 'UPDATE') {
          setMisPedidos(prev => prev.map(p => p.id === payload.new.id ? payload.new : p));
          if (payload.new.estado === 'aceptado') {
            toast.success(`✅ Pedido de ${payload.new.producto_nombre} aceptado`);
          } else if (payload.new.estado === 'rechazado') {
            toast.error(`❌ Pedido de ${payload.new.producto_nombre} rechazado`);
          }
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [userId]);

  // ── Construir modeloActual: contexto → DB → fallback mínimo ───────────────
  const modeloDesdeContexto = (modelos || []).find(m =>
    m.email?.toLowerCase() === userEmail?.toLowerCase()
  );

  // Fallback construido desde el registro de DB
  const modeloDesdeDB = perfilDB ? {
    id: 1,
    email: perfilDB.email || userEmail,
    nombre: perfilDB.nombre || userEmail.split('@')[0],
    nombreArtistico: perfilDB.nombre_artistico || perfilDB.nombre || userEmail.split('@')[0],
    cedula: perfilDB.cedula || '',
    telefono: perfilDB.telefono || '',
    direccion: perfilDB.direccion || '',
    password: '',
    fotoPerfil: perfilDB.foto_perfil || perfilDB.fotoPerfil || '',
    fotosAdicionales: perfilDB.fotos_adicionales || [],
    edad: perfilDB.edad || 0,
    activa: perfilDB.estado === 'activo' || perfilDB.estado === 'Activo',
    disponible: perfilDB.disponible !== undefined ? perfilDB.disponible : true,
    domicilio: perfilDB.domicilio || false,
    servicios: 0,
    ingresos: 0,
    descripcion: perfilDB.descripcion || '',
    sede: perfilDB.sede || '',
  } : null;

  // Fallback final con datos mínimos del token de auth
  const modeloFallback = {
    id: 1,
    email: userEmail,
    nombre: userEmail.split('@')[0],
    nombreArtistico: userEmail.split('@')[0],
    cedula: '',
    telefono: '',
    direccion: '',
    password: '',
    fotoPerfil: '',
    fotosAdicionales: [],
    edad: 0,
    activa: true,
    disponible: true,
    domicilio: false,
    servicios: 0,
    ingresos: 0,
    descripcion: '',
    sede: '',
  };

  // Prioridad: contexto > DB > fallback (siempre hay un perfil)
  const modeloActual = modeloDesdeContexto || modeloDesdeDB || modeloFallback;

  // ── Cargar liquidaciones de Supabase ──────────────────────────────────────
  useEffect(() => {
    const cargar = async () => {
      if (!userId) return;
      setLoadingLiquidaciones(true);
      try {
        const { data } = await supabase
          .from('liquidaciones')
          .select('*')
          .eq('modelo_id', userId)
          .order('fecha_liquidacion', { ascending: false });
        setLiquidaciones(data || []);
      } catch {
        setLiquidaciones([]);
      } finally {
        setLoadingLiquidaciones(false);
      }
    };
    cargar();
  }, [userId]);

  // Sincronizar form del perfil
  useEffect(() => {
    if (modeloActual) {
      setPerfilForm({
        nombreArtistico: modeloActual.nombreArtistico || '',
        descripcion: (modeloActual as any).descripcion || '',
        especialidades: ((modeloActual as any).especialidades || []).join(', '),
      });
    }
  }, [modeloActual?.nombre]);

  // ── Derivaciones de datos ──────────────────────────────────────────────────
  const emailModelo = modeloActual?.email || userEmail;
  const ahora = new Date();
  const inicioMes = startOfMonth(ahora).toISOString().split('T')[0];

  const serviciosFinalizados = servicios.filter(s => s.estado === 'completado');
  const serviciosDeModelo = serviciosFinalizados.filter(s => s.modeloEmail === emailModelo);

  const serviciosActivos = servicios.filter(s => s.estadoPago === 'pendiente' && s.modeloEmail === emailModelo);
  const servicioActivo = serviciosActivos[0] || null;

  const serviciosMes = serviciosDeModelo.filter(s => s.fecha >= inicioMes);
  const ingresosMes = serviciosMes.reduce((sum, s) => sum + (s.montoPagado ?? s.montoPactado ?? 0), 0);
  const clientesMes = new Set(serviciosMes.map(s => s.clienteNombre)).size;

  const agendamientosDeModelo = modeloActual ? obtenerAgendamientosPorModelo(emailModelo) : [];
  const citasProximas = modeloActual ? obtenerAgendamientosPendientes(emailModelo) : [];
  /*
  const citasHoy = citasProximas.filter(c => {
    const d = new Date(c.fecha);
    return d.toDateString() === ahora.toDateString();
  }).sort((a, b) => (a.hora ?? '').localeCompare(b.hora ?? ''));
  */

  const registroActivo = modeloActual ? obtenerRegistroActual(emailModelo) : undefined;
  const solicitudEntrada = modeloActual ? obtenerSolicitudPorModelo(emailModelo) : undefined;
  const puedeIniciarServicio = !!registroActivo;

  const multasPendientes = obtenerTotalMultasPendientesPorEmail(emailModelo);
  const multasModelo = multas.filter(m => m.modeloEmail === emailModelo);
  const adelantosPendientesLista = obtenerAdelantosPendientes().filter((a: any) => a.modeloEmail === emailModelo);

  // ── Próximo agendamiento ──────────────────────────────────────────────────
  const proximasCitasOrdenadas = [...citasProximas].sort((a, b) =>
    new Date(a.fecha + 'T' + (a.hora || '00:00')).getTime() - new Date(b.fecha + 'T' + (b.hora || '00:00')).getTime()
  );
  const proxCita = proximasCitasOrdenadas[0];

  // ── Gráfica ingresos últimos 6 meses ─────────────────────────────────────
  const datosIngresos6Meses = Array.from({ length: 6 }, (_, i) => {
    const fecha = subMonths(ahora, 5 - i);
    const mes = getMonth(fecha);
    const anio = getYear(fecha);
    const nombreMes = format(fecha, 'MMM', { locale: es });
    const total = serviciosDeModelo
      .filter(s => {
        const d = parseISO(s.fecha || '2000-01-01');
        return isValid(d) && getMonth(d) === mes && getYear(d) === anio;
      })
      .reduce((sum, s) => sum + (s.montoPagado ?? s.montoPactado ?? 0), 0);
    return { mes: nombreMes, ingresos: total };
  });

  // ── Gráfica ingresos netos por semana (liquidaciones) ────────────────────
  const datosSemanales = Array.from({ length: 8 }, (_, i) => {
    const inicio = new Date(ahora);
    inicio.setDate(inicio.getDate() - (7 - i) * 7);
    const fin = new Date(inicio);
    fin.setDate(fin.getDate() + 6);
    const semana = `S${i + 1}`;
    const total = liquidaciones
      .filter(l => {
        const d = l.fecha_liquidacion ? new Date(l.fecha_liquidacion) : null;
        return d && d >= inicio && d <= fin;
      })
      .reduce((sum, l) => sum + (l.total || 0), 0);
    return { semana, neto: total };
  });

  // ── Gráfica por día de la semana ─────────────────────────────────────────
  const diasSemana = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
  const datosPorDia = diasSemana.map((dia, idx) => ({
    dia,
    servicios: serviciosDeModelo.filter(s => {
      const d = parseISO(s.fecha || '2000-01-01');
      return isValid(d) && d.getDay() === idx;
    }).length,
  }));

  // ── Gráfica tipos de servicio ─────────────────────────────────────────────
  const tiposConteo: Record<string, number> = {};
  serviciosDeModelo.forEach(s => {
    const tipo = s.tipoServicio || 'Otro';
    tiposConteo[tipo] = (tiposConteo[tipo] || 0) + 1;
  });
  const datosTipos = Object.entries(tiposConteo).map(([name, value]) => ({ name, value }));

  // ── Filtro servicios ──────────────────────────────────────────────────────
  const getServiciosFiltrados = () => {
    const hoy = new Date();
    let desde = new Date(0);
    if (filtroServicios === 'mes') desde = startOfMonth(hoy);
    else if (filtroServicios === '3meses') { desde = new Date(hoy); desde.setMonth(desde.getMonth() - 3); }
    return serviciosDeModelo
      .filter(s => {
        const d = parseISO(s.fecha || '2000-01-01');
        const ok = isValid(d) && d >= desde;
        const busq = busquedaServicios.toLowerCase();
        const matchBusq = !busq || (s.clienteNombre || '').toLowerCase().includes(busq);
        const matchDirecto = filtroServicios !== 'directos' || s.creadoPorRol === 'modelo';
        return ok && matchBusq && matchDirecto;
      })
      .sort((a, b) => b.fecha?.localeCompare(a.fecha || '') ?? 0);
  };

  const serviciosFiltrados = getServiciosFiltrados();
  const POR_PAGINA = 10;
  const totalPaginas = Math.ceil(serviciosFiltrados.length / POR_PAGINA);
  const serviciosPagina = serviciosFiltrados.slice((paginaServicios - 1) * POR_PAGINA, paginaServicios * POR_PAGINA);
  const totalFiltrados = serviciosFiltrados.reduce((sum, s) => sum + (s.montoPagado ?? s.montoPactado ?? 0), 0);

  // ── Guardar perfil ────────────────────────────────────────────────────────
  const guardarPerfil = async () => {
    setGuardandoPerfil(true);
    try {
      const { error } = await supabase
        .from('usuarios')
        .update({
          nombre_artistico: perfilForm.nombreArtistico,
          descripcion: perfilForm.descripcion,
        })
        .eq('email', emailModelo);
      if (error) throw error;
      toast.success('Perfil actualizado correctamente');
      setEditandoPerfil(false);
    } catch {
      toast.error('Error al guardar el perfil');
    } finally {
      setGuardandoPerfil(false);
    }
  };

  // ── Exportar CSV ──────────────────────────────────────────────────────────
  const exportarCSV = () => {
    const headers = ['Fecha', 'Hora', 'Cliente', 'Tipo', 'Duracion', 'Ingreso', 'Estado'];
    const rows = serviciosFiltrados.map(s => [
      s.fecha || '', s.hora || '', s.clienteNombre || '',
      s.tipoServicio || '', s.duracionEstimadaMinutos || '',
      s.montoPagado ?? s.montoPactado ?? 0, s.estado || '',
    ]);
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'mis-servicios.csv'; a.click();
    URL.revokeObjectURL(url);
    toast.success('CSV exportado correctamente');
  };

  // ── Estado inicial de carga — mostrar spinner hasta tener el perfil ────────
  if (loadingPerfilDB) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 border-4 border-yellow-500/30 border-t-yellow-500 rounded-full animate-spin mx-auto" />
          <p className="text-yellow-400 font-semibold">Cargando tu perfil...</p>
          <p className="text-gray-500 text-sm">{userEmail}</p>
        </div>
      </div>
    );
  }

  // ── NAV TABS ──────────────────────────────────────────────────────────────
  const tabs = [
    { id: 'inicio', label: 'Inicio', icon: <Home className="w-4 h-4" /> },
    { id: 'servicios', label: 'Mis Servicios', icon: <CheckCircle className="w-4 h-4" /> },
    { id: 'ingresos', label: 'Mis Ingresos', icon: <DollarSign className="w-4 h-4" /> },
    { id: 'boutique', label: 'Boutique', icon: <ShoppingBag className="w-4 h-4" /> },
    { id: 'calendario', label: 'Calendario', icon: <Calendar className="w-4 h-4" /> },
    { id: 'perfil', label: 'Mi Perfil', icon: <User className="w-4 h-4" /> },
    { id: 'notificaciones', label: 'Notificaciones', icon: <Bell className="w-4 h-4" /> },
    { id: 'analytics', label: 'Analytics', icon: <PieChart className="w-4 h-4" /> },
    { id: 'transmision', label: 'Transmisión', icon: <Video className="w-4 h-4" /> },
  ];

  // ── Estado del badge ──────────────────────────────────────────────────────
  const estadoBadge = registroActivo
    ? { label: 'En Turno', cls: 'bg-green-500/20 text-green-400 border-green-500/40' }
    : servicioActivo
      ? { label: 'En Servicio', cls: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/40' }
      : { label: 'Disponible', cls: 'bg-blue-500/20 text-blue-400 border-blue-500/40' };

  // ── KPI card helper ───────────────────────────────────────────────────────
  const KPICard = ({ title, value, sub, icon, color }: { title: string; value: string; sub?: string; icon: React.ReactNode; color: string }) => (
    <Card className={`border ${color} bg-card/50 backdrop-blur-sm hover:scale-[1.02] transition-transform`}>
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs text-muted-foreground mb-1">{title}</p>
            <p className="text-2xl font-bold text-white">{value}</p>
            {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
          </div>
          <div className="opacity-60 mt-1">{icon}</div>
        </div>
      </CardContent>
    </Card>
  );

  const nombreDisplay = modeloActual?.nombreArtistico || modeloActual?.nombre || userEmail.split('@')[0];
  const fotoDisplay = modeloActual?.fotoPerfil || '';
  // ── Selfie Check-in ─────────────────────────────────────────────────────────
  const abrirCamara = async () => {
    setErrorCamara(null);
    if (!navigator.mediaDevices?.getUserMedia) {
      setErrorCamara('Tu navegador no soporta cámara');
      inputRef.current?.click();
      return;
    }
    try {
      console.log('📷 Intentando abrir cámara...');
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 640 } },
        audio: false
      });
      console.log('✅ Cámara abierta:', stream);
      streamRef.current = stream;
      setCamaraActiva(true);
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play()
            .then(() => console.log('▶️ Video reproduciendo'))
            .catch(e => console.error('❌ Error play:', e));
        }
      }, 100);
    } catch (err: any) {
      console.error('❌ Error cámara:', err.name, err.message);
      if (err.name === 'NotAllowedError') setErrorCamara('Permiso de cámara denegado. Ve a Configuración y permite el acceso.');
      else if (err.name === 'NotFoundError') setErrorCamara('No se encontró cámara en este dispositivo.');
      else if (err.name === 'NotReadableError') setErrorCamara('La cámara está siendo usada por otra app.');
      else setErrorCamara(`Error: ${err.message}`);
      setTimeout(() => inputRef.current?.click(), 500);
    }
  };

  const tomarFoto = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) { console.error('❌ Video o canvas no disponible'); return; }
    if (video.videoWidth === 0) { toast.error('La cámara aún no está lista, espera un momento'); return; }
    console.log('📸 Capturando foto...', video.videoWidth, 'x', video.videoHeight);
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0);
    canvas.toBlob((blob) => {
      if (!blob) { toast.error('Error al capturar imagen'); return; }
      const file = new File([blob], `selfie_${Date.now()}.jpg`, { type: 'image/jpeg' });
      setSelfieFile(file);
      setSelfiePreview(canvas.toDataURL('image/jpeg', 0.85));
      cerrarCamara();
      console.log('✅ Foto capturada:', file.size, 'bytes');
    }, 'image/jpeg', 0.85);
  };

  const cerrarCamara = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => { t.stop(); console.log('🔴 Track detenido:', t.kind); });
      streamRef.current = null;
    }
    setCamaraActiva(false);
  };

  const handleGaleria = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { toast.error('Solo imágenes'); return; }
    if (file.size > 5 * 1024 * 1024) { toast.error('Máximo 5MB'); return; }
    const reader = new FileReader();
    reader.onload = (e) => setSelfiePreview(e.target?.result as string);
    reader.readAsDataURL(file);
    setSelfieFile(file);
  };

  const subirSelfie = async () => {
    if (!selfieFile) return;
    setSubiendo(true);
    try {
      console.log('⬆️ Subiendo selfie...');
      const extension = selfieFile.name.split('.').pop() || 'jpg';
      const safeEmail = userEmail.replace(/[^a-zA-Z0-9]/g, '_');
      const path = `checkins/${safeEmail}_${Date.now()}.${extension}`;
      const arrayBuffer = await selfieFile.arrayBuffer();

      const { error: upError } = await supabase.storage
        .from('fotos-modelos')
        .upload(path, arrayBuffer, { contentType: 'image/jpeg', upsert: false });

      if (upError) {
        console.error('❌ Upload error:', upError);
        toast.error(`Error al subir: ${upError.message}`);
        return;
      }

      const { data: urlData } = supabase.storage.from('fotos-modelos').getPublicUrl(path);
      console.log('✅ URL:', urlData.publicUrl);

      await crearSolicitudEntrada(userEmail, nombreDisplay, urlData.publicUrl);
      
      setSelfieEnviada(true);
      toast.success('✅ Selfie enviada — Esperando aprobación');
      console.log('✅ Todo completado');
    } catch (err: any) {
      console.error('❌ Error inesperado:', err);
      toast.error(`Error: ${err.message}`);
    } finally {
      setSubiendo(false);
    }
  };

  useEffect(() => {
    return () => cerrarCamara();
  }, []);

  return (
    <div className="min-h-screen w-full bg-background" style={{ fontFamily: 'Montserrat, sans-serif' }}>

      {/* ── HEADER PREMIUM ───────────────────────────────────────────────── */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-card/98 backdrop-blur-xl border-b border-primary/20 shadow-[0_4px_30px_rgba(201,168,76,0.08)]">
        <div className="flex items-center justify-between px-4 sm:px-6 py-3 max-w-8xl mx-auto">

          {/* Perfil a la izquierda */}
          <div className="flex items-center gap-3 min-w-0">
            <div className="relative">
              <Avatar className="w-12 h-12 border-2 border-primary/50 ring-2 ring-primary/20">
                <AvatarImage src={fotoDisplay} />
                <AvatarFallback className="bg-primary/20 text-primary text-lg font-bold">
                  {nombreDisplay.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-card ${registroActivo ? 'bg-green-400' : 'bg-blue-400'}`} />
            </div>
            <div className="hidden sm:block min-w-0">
              <h1 className="text-base font-bold text-white truncate" style={{ fontFamily: 'Playfair Display, serif' }}>
                {nombreDisplay}
              </h1>
              <div className="flex items-center gap-2">
                <Badge className={`text-[10px] h-4 px-2 border ${estadoBadge.cls}`}>
                  {estadoBadge.label}
                </Badge>
                <span className="text-[11px] text-muted-foreground truncate max-w-[180px]">{userEmail}</span>
              </div>
            </div>
          </div>

          {/* Nav desktop */}
          <nav className="hidden xl:flex items-center gap-1">
            {tabs.map(t => (
              <button
                key={t.id}
                onClick={() => setSelectedTab(t.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  selectedTab === t.id
                    ? 'bg-primary text-black'
                    : 'text-muted-foreground hover:text-white hover:bg-white/5'
                }`}
              >
                {t.icon}
                <span>{t.label}</span>
              </button>
            ))}
          </nav>

          {/* Acciones a la derecha */}
          <div className="flex items-center gap-2">
            <Button
              onClick={onLogout}
              variant="ghost"
              size="sm"
              className="hidden sm:flex text-red-400 hover:text-red-300 hover:bg-red-500/10 border border-red-500/20 gap-2"
            >
              <LogOut className="w-4 h-4" />
              Salir
            </Button>
            <Button
              onClick={() => setMenuOpen(!menuOpen)}
              variant="outline"
              size="sm"
              className="xl:hidden border-primary/30 hover:bg-primary/10 h-9 w-9 p-0"
            >
              {menuOpen ? <X className="w-4 h-4 text-primary" /> : <Menu className="w-4 h-4 text-primary" />}
            </Button>
          </div>
        </div>

        {/* Mobile nav dropdown */}
        {menuOpen && (
          <div className="xl:hidden bg-card/97 backdrop-blur-md border-t border-primary/10">
            <nav className="grid grid-cols-3 gap-2 px-4 py-3">
              {tabs.map(t => (
                <button
                  key={t.id}
                  onClick={() => { setSelectedTab(t.id); setMenuOpen(false); }}
                  className={`flex flex-col items-center gap-1 px-2 py-3 rounded-xl text-xs font-medium transition-all ${
                    selectedTab === t.id
                      ? 'bg-primary text-black'
                      : 'text-muted-foreground hover:text-white hover:bg-white/5'
                  }`}
                >
                  {t.icon}
                  <span>{t.label}</span>
                </button>
              ))}
              <button
                onClick={onLogout}
                className="flex flex-col items-center gap-1 px-2 py-3 rounded-xl text-xs font-medium text-red-400 hover:bg-red-500/10"
              >
                <LogOut className="w-4 h-4" />
                Salir
              </button>
            </nav>
          </div>
        )}
      </header>

      {/* ── MAIN CONTENT ─────────────────────────────────────────────────── */}
      <main className="pt-[88px] pb-16 px-4 max-w-7xl mx-auto space-y-6">

        {/* ━━━ SIEMPRE VISIBLE ARRIBA ━━━ */}

        {/* CASO 1: No ha hecho check-in */}
        {!registroActivo && !solicitudEntrada && !jornadas.find(j => j.modeloEmail === userEmail && j.estado === 'en_curso') && (
          <div className="rounded-xl border border-[#c9a961]/40 bg-[#c9a961]/5 overflow-hidden shadow-[0_0_15px_rgba(201,169,97,0.1)]">
            {/* CÁMARA ACTIVA */}
            {camaraActiva && (
              <div className="relative bg-black w-full max-w-md mx-auto aspect-[3/4] sm:aspect-square">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                  style={{ transform: 'scaleX(-1)' }}
                  onLoadedMetadata={() => console.log('📹 Video metadata cargada')}
                />
                <canvas ref={canvasRef} className="hidden" />
                <div className="absolute bottom-6 left-0 right-0 flex justify-center gap-4 px-4">
                  <button
                    onClick={cerrarCamara}
                    className="px-5 py-3 rounded-xl bg-black/70 text-white border border-white/20 text-sm backdrop-blur-sm"
                  >
                    ✕ Cancelar
                  </button>
                  <button
                    onClick={tomarFoto}
                    className="flex-1 max-w-[200px] py-3 rounded-xl bg-gradient-to-r from-[#B8860B] to-[#FFD700] text-black font-black text-lg shadow-lg hover:opacity-90 transition-all"
                  >
                    📸 Capturar
                  </button>
                </div>
              </div>
            )}

            {/* PANTALLA INICIAL O PREVIEW */}
            {!camaraActiva && (
              <div className="p-5 text-center space-y-4">
                {!selfiePreview ? (
                  <>
                    <div className="text-5xl drop-shadow-md">📸</div>
                    <div>
                      <h3 className="text-[#c9a961] font-bold text-xl font-['Playfair_Display']">Registra tu entrada</h3>
                      <p className="text-[#888] text-sm mt-1">Tómate una selfie para iniciar tu turno</p>
                    </div>

                    {errorCamara && (
                      <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-red-400 text-xs mx-auto max-w-sm text-left">
                        ⚠️ {errorCamara}
                      </div>
                    )}

                    <div className="max-w-sm mx-auto space-y-3 mt-4">
                      <button
                        onClick={abrirCamara}
                        className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#B8860B] to-[#FFD700] text-black font-black text-base flex items-center justify-center gap-2 shadow-lg hover:opacity-90 transition-all"
                      >
                        <Camera className="w-5 h-5" /> Abrir cámara
                      </button>

                      <div className="flex items-center gap-3">
                        <div className="flex-1 h-px bg-[#2a2a2a]"/>
                        <span className="text-[#555] text-xs font-bold uppercase tracking-wider">o subir archivo</span>
                        <div className="flex-1 h-px bg-[#2a2a2a]"/>
                      </div>

                      <input ref={inputRef} type="file" accept="image/*" onChange={handleGaleria} className="hidden" />
                      <button
                        onClick={() => inputRef.current?.click()}
                        className="w-full py-3 rounded-xl border border-[#2a2a2a] text-[#888] font-bold hover:bg-white/5 transition-all text-sm"
                      >
                        📁 Seleccionar de galería
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <h3 className="text-[#c9a961] font-bold text-xl font-['Playfair_Display']">Vista Previa</h3>
                    </div>
                    <div className="flex justify-center">
                      <img src={selfiePreview} alt="Preview selfie" className="w-48 h-48 rounded-full object-cover border-4 border-[#c9a961] shadow-xl" />
                    </div>
                    <div className="flex gap-3 max-w-sm mx-auto mt-4">
                      <button onClick={() => { setSelfiePreview(null); setSelfieFile(null); }} className="flex-1 py-3.5 rounded-xl border border-white/10 hover:bg-white/5 text-[#888] font-bold transition-all">
                        🔄 Repetir
                      </button>
                      <button onClick={subirSelfie} disabled={subiendo || selfieEnviada} className="flex-1 py-3.5 rounded-xl bg-gradient-to-r from-[#B8860B] to-[#FFD700] text-black font-black shadow-lg disabled:opacity-50 hover:opacity-90 transition-all">
                        {subiendo ? '⏳ Enviando...' : selfieEnviada ? '✅ Enviado' : '✅ Enviar Selfie'}
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        )}

        {/* CASO: Esperando aprobación */}
        {solicitudEntrada && solicitudEntrada.estado === 'pendiente' && (
          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4 text-yellow-400 text-sm text-center font-medium shadow-[0_0_15px_rgba(234,179,8,0.1)] flex items-center justify-center gap-2">
            <Clock className="w-5 h-5 animate-pulse" /> Selfie enviada — Esperando aprobación del administrador
          </div>
        )}

        {/* CASO 2: En turno */}
        {(registroActivo || jornadas.find(j => j.modeloEmail === userEmail && j.estado === 'en_curso') || (solicitudEntrada && solicitudEntrada.estado === 'aprobada')) && (
          <JornadaBanner
            userEmail={userEmail}
            onRegistrarEntrada={() => setMostrarRegistroEntrada(true)}
          />
        )}

        {/* Temporizador de servicio activo */}
        {servicioActivo && <TemporizadorServicio servicio={servicioActivo} />}

        {/* ═══════════════════════ TAB: INICIO ═══════════════════════════ */}
        {selectedTab === 'inicio' && (
          <div className="space-y-6">

            {/* Saludo */}
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-2xl font-bold text-white" style={{ fontFamily: 'Playfair Display, serif' }}>
                  Hola, {nombreDisplay} 👋
                </h2>
                <p className="text-muted-foreground text-sm mt-1 capitalize">
                  {format(ahora, "EEEE, d 'de' MMMM 'de' yyyy — HH:mm", { locale: es })}
                </p>
              </div>
              <div className="flex gap-2">
                {!registroActivo && !solicitudEntrada && (
                  <Button onClick={() => setMostrarRegistroEntrada(true)} size="sm" className="bg-primary text-black hover:bg-primary/90 gap-2">
                    <Camera className="w-4 h-4" /> Registrar Entrada
                  </Button>
                )}
                {puedeIniciarServicio && !servicioActivo && (
                  <Button onClick={() => setMostrarIniciarServicio(true)} size="sm" variant="outline" className="border-primary/40 gap-2">
                    <Play className="w-4 h-4" /> Iniciar Servicio
                  </Button>
                )}
                {registroActivo && (
                  <button
                    onClick={() => setMostrarServicioDirecto(true)}
                    style={{
                      background: 'linear-gradient(135deg, #B8860B, #FFD700)',
                      border: 'none',
                      borderRadius: 10,
                      padding: '8px 16px',
                      cursor: 'pointer',
                      fontWeight: 700,
                      fontSize: 13,
                      color: 'black',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6
                    }}
                  >
                    ➕ Servicio Directo
                  </button>
                )}
              </div>
            </div>

            {/* Panel: Acción Requerida (Citas aceptadas por programador) */}
            {(() => {
              const pendientesConfirmar = agendamientosDeModelo.filter(a => a.estado === 'aceptado_programador');
              if (pendientesConfirmar.length === 0) return null;

              return (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-primary animate-pulse">
                    <Zap className="w-5 h-5 fill-primary" />
                    <h3 className="text-lg font-bold uppercase tracking-tighter">Acción Requerida</h3>
                    <Badge className="bg-primary text-black font-black">{pendientesConfirmar.length}</Badge>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {pendientesConfirmar.map(cita => (
                      <Card key={cita.id} className="border-primary/40 bg-primary/5 shadow-[0_0_15px_rgba(212,175,55,0.1)] hover:border-primary transition-all">
                        <CardContent className="p-4 flex items-center justify-between gap-4">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center">
                              <User className="w-6 h-6 text-primary" />
                            </div>
                            <div>
                              <p className="text-white font-bold">{cita.clienteNombre}</p>
                              <p className="text-xs text-muted-foreground">
                                {format(parseISO(cita.fecha), "dd 'de' MMMM", { locale: es })} · {formatearHora(cita.hora)}
                              </p>
                              <p className="text-[10px] text-primary font-bold uppercase mt-1">{cita.tarifaNombre}</p>
                            </div>
                          </div>
                          <Button 
                            size="sm" 
                            className="bg-primary text-black hover:bg-primary/90 font-bold"
                            onClick={() => {
                              setAgendamientoAConfirmar(cita);
                              setMostrarConfirmarAgendamiento(true);
                            }}
                          >
                            CONFIRMAR E INICIAR
                          </Button>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              );
            })()}

            <IngresosWidget rol="modelo" modeloEmail={userEmail} mostrarDetalle={false} />

            {/* KPI Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <KPICard
                title="Servicios este mes"
                value={String(serviciosMes.length)}
                sub={`${serviciosDeModelo.length} histórico`}
                icon={<CheckCircle className="w-8 h-8 text-blue-400" />}
                color="border-blue-500/20"
              />
              <KPICard
                title="Ingresos del mes"
                value={formatCOP(ingresosMes)}
                sub="servicios completados"
                icon={<DollarSign className="w-8 h-8 text-green-400" />}
                color="border-green-500/20"
              />
              <KPICard
                title="Próximo agendamiento"
                value={proxCita ? format(parseISO(proxCita.fecha), 'dd MMM', { locale: es }) : 'Sin citas'}
                sub={proxCita ? `${formatearHora(proxCita.hora)} · ${proxCita.clienteNombre}` : 'No hay citas próximas'}
                icon={<Calendar className="w-8 h-8 text-purple-400" />}
                color="border-purple-500/20"
              />
              <KPICard
                title="Clientes este mes"
                value={String(clientesMes)}
                sub="clientes únicos"
                icon={<Users className="w-8 h-8 text-orange-400" />}
                color="border-orange-500/20"
              />
            </div>

            {/* Estado solicitud entrada */}
            {solicitudEntrada && solicitudEntrada.estado === 'pendiente' && (
              <Card className="border-yellow-500/30 bg-yellow-500/5">
                <CardContent className="py-3 flex items-center gap-3">
                  <Clock className="w-5 h-5 text-yellow-400 flex-shrink-0" />
                  <p className="text-yellow-400 text-sm">Solicitud de entrada pendiente de aprobación del admin.</p>
                </CardContent>
              </Card>
            )}
            {registroActivo && (
              <Card className="border-green-500/30 bg-green-500/5">
                <CardContent className="py-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
                    <div>
                      <p className="text-green-400 text-sm font-medium">Turno activo</p>
                      <p className="text-xs text-muted-foreground">
                        Desde {new Date(registroActivo.horaLlegada).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                  {!registroActivo.horaSalida && (
                    <Button size="sm" variant="outline" className="border-red-500/30 text-red-400 hover:bg-red-500/10"
                      onClick={async () => { try { await registrarSalida(emailModelo); toast.success('Salida registrada'); } catch { toast.error('Error al registrar salida'); } }}>
                      <XCircle className="w-4 h-4 mr-2" /> Registrar Salida
                    </Button>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Servicio activo */}
            {servicioActivo && (
              <Suspense fallback={<div className="h-20 rounded-xl animate-pulse bg-white/5" />}>
                <ServicioActivoCard
                  servicio={servicioActivo}
                  onCalificarCliente={(data) => setCalificacionPendiente({ ...data, modeloId: userId })}
                />
              </Suspense>
            )}

            {/* Gráfica ingresos 6 meses */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-primary" />
                  Ingresos últimos 6 meses
                </CardTitle>
                <CardDescription>Basado en servicios completados</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={datosIngresos6Meses} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="mes" tick={{ fill: '#9ca3af', fontSize: 12 }} />
                    <YAxis tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} tick={{ fill: '#9ca3af', fontSize: 11 }} />
                    <Tooltip content={<TooltipCOP />} />
                    <Bar dataKey="ingresos" name="Ingresos" fill="#c9a84c" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Próximas citas */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-primary" />
                  Próximos Agendamientos
                </CardTitle>
              </CardHeader>
              <CardContent>
                {proximasCitasOrdenadas.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Calendar className="w-12 h-12 mx-auto mb-3 opacity-30" />
                    <p>No tienes citas próximas agendadas</p>
                  </div>
                ) : (
                  <div className="divide-y divide-border/50">
                    {proximasCitasOrdenadas.slice(0, 5).map(cita => {
                      const estadoClr: Record<string, string> = {
                        pendiente: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30',
                        aprobado: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
                        'en curso': 'bg-green-500/15 text-green-400 border-green-500/30',
                        completado: 'bg-gray-500/15 text-gray-400 border-gray-500/30',
                        cancelado: 'bg-red-500/15 text-red-400 border-red-500/30',
                      };
                      const cls = estadoClr[cita.estado] || 'bg-gray-500/15 text-gray-400 border-gray-500/30';
                      return (
                        <div key={cita.id} className="flex items-center gap-4 py-3 hover:bg-white/2 transition-colors cursor-pointer" onClick={() => setCitaSeleccionada(cita)}>
                          <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0">
                            <Calendar className="w-5 h-5 text-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-white truncate">{cita.clienteNombre}</p>
                            <p className="text-xs text-muted-foreground">
                              {format(parseISO(cita.fecha), "dd 'de' MMMM", { locale: es })} · {formatearHora(cita.hora)}
                            </p>
                          </div>
                          <Badge className={`border text-xs px-2 py-0.5 ${cls}`}>{cita.estado}</Badge>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* ═══════════════════ TAB: MIS SERVICIOS ════════════════════════ */}
        {selectedTab === 'servicios' && (
          <div className="space-y-6">
            <div className="flex items-start justify-between flex-wrap gap-3">
              <div>
                <h2 className="text-xl font-bold text-white">Mis Servicios</h2>
                <p className="text-sm text-muted-foreground">Historial completo de tus servicios</p>
              </div>
              <Button onClick={exportarCSV} variant="outline" size="sm" className="border-primary/30 gap-2">
                <Download className="w-4 h-4" /> Exportar CSV
              </Button>
            </div>

            {/* Filtros */}
            <div className="flex flex-wrap gap-3 items-center">
              <div className="flex rounded-lg overflow-hidden border border-white/10">
                {(['mes', '3meses', 'todo', 'directos'] as const).map(f => (
                  <button
                    key={f}
                    onClick={() => { setFiltroServicios(f); setPaginaServicios(1); }}
                    className={`px-4 py-2 text-xs font-medium transition-colors ${filtroServicios === f ? 'bg-primary text-black' : 'bg-card text-muted-foreground hover:text-white'}`}
                  >
                    {f === 'mes' ? 'Este mes' : f === '3meses' ? 'Últimos 3 meses' : f === 'todo' ? 'Todo' : 'Directos'}
                  </button>
                ))}
              </div>
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Buscar por cliente..."
                  value={busquedaServicios}
                  onChange={e => { setBusquedaServicios(e.target.value); setPaginaServicios(1); }}
                  className="w-full pl-9 pr-4 py-2 bg-card border border-white/10 rounded-lg text-sm text-white placeholder:text-muted-foreground focus:outline-none focus:border-primary/40"
                />
              </div>
            </div>

            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-white/10">
                        <th className="px-4 py-3 text-left text-muted-foreground font-medium">Fecha</th>
                        <th className="px-4 py-3 text-left text-muted-foreground font-medium">Hora</th>
                        <th className="px-4 py-3 text-left text-muted-foreground font-medium">Cliente</th>
                        <th className="px-4 py-3 text-left text-muted-foreground font-medium">Tipo</th>
                        <th className="px-4 py-3 text-left text-muted-foreground font-medium">Duración</th>
                        <th className="px-4 py-3 text-right text-muted-foreground font-medium">Ingreso</th>
                        <th className="px-4 py-3 text-center text-muted-foreground font-medium">Estado</th>
                      </tr>
                    </thead>
                    <tbody>
                      {serviciosPagina.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="text-center py-12 text-muted-foreground">
                            No hay servicios en este período
                          </td>
                        </tr>
                      ) : serviciosPagina.map(s => (
                        <tr key={s.id} className="border-b border-white/5 hover:bg-white/2 transition-colors">
                          <td className="px-4 py-3 text-white">{s.fecha}</td>
                          <td className="px-4 py-3 text-muted-foreground">{formatearHora(s.hora)}</td>
                          <td className="px-4 py-3 text-white font-medium">{s.clienteNombre}</td>
                          <td className="px-4 py-3 text-muted-foreground capitalize">
                            {s.tipoServicio || '—'}
                            {s.creadoPorRol === 'modelo' && (
                              <span className="ml-2 text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: 'linear-gradient(135deg, #B8860B, #FFD700)', color: 'black' }}>
                                ⚡ Directo
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-muted-foreground">{s.duracionEstimadaMinutos ? `${s.duracionEstimadaMinutos}min` : '—'}</td>
                          <td className="px-4 py-3 text-right text-green-400 font-semibold">{formatCOP(s.montoPagado ?? s.montoPactado ?? 0)}</td>
                           <td className="px-4 py-3 text-center">
                            <Badge className={`text-xs border ${s.estado === 'completado' ? 'bg-green-500/15 text-green-400 border-green-500/30' : 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30'}`}>
                              {s.estado}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Footer tabla */}
                <div className="flex items-center justify-between px-4 py-3 border-t border-white/10">
                  <div className="text-sm">
                    <span className="text-muted-foreground">Total: </span>
                    <span className="text-green-400 font-bold">{formatCOP(totalFiltrados)}</span>
                    <span className="text-muted-foreground ml-3">({serviciosFiltrados.length} registros)</span>
                  </div>
                  {totalPaginas > 1 && (
                    <div className="flex items-center gap-2">
                      <button onClick={() => setPaginaServicios(p => Math.max(1, p - 1))} disabled={paginaServicios === 1}
                        className="w-8 h-8 flex items-center justify-center rounded border border-white/10 text-muted-foreground hover:text-white disabled:opacity-30">
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <span className="text-sm text-muted-foreground">{paginaServicios} / {totalPaginas}</span>
                      <button onClick={() => setPaginaServicios(p => Math.min(totalPaginas, p + 1))} disabled={paginaServicios === totalPaginas}
                        className="w-8 h-8 flex items-center justify-center rounded border border-white/10 text-muted-foreground hover:text-white disabled:opacity-30">
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* ═══════════════════ TAB: MIS INGRESOS ════════════════════════ */}
        {selectedTab === 'ingresos' && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-white">Mis Ingresos</h2>
            <IngresosWidget rol="modelo" modeloEmail={userEmail} mostrarDetalle={false} />

            {/* Cards resumen */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {(() => {
                const liqMes = liquidaciones.filter(l => {
                  const d = l.fecha_liquidacion ? new Date(l.fecha_liquidacion) : null;
                  return d && d >= startOfMonth(ahora);
                });
                const bruto = liqMes.reduce((s, l) => s + (l.total_servicios || 0) + (l.total_adicionales || 0), 0);
                const descuentos = liqMes.reduce((s, l) => s + (l.multas || 0) + (l.total_consumos || 0), 0);
                const adelantos = liqMes.reduce((s, l) => s + (l.adelantos_descontados || 0), 0);
                const neto = liqMes.reduce((s, l) => s + (l.total || 0), 0);
                return (
                  <>
                    <KPICard title="Ingreso bruto del mes" value={formatCOP(bruto)} icon={<TrendingUp className="w-8 h-8 text-green-400" />} color="border-green-500/20" />
                    <KPICard title="Descuentos y multas" value={formatCOP(descuentos)} icon={<XCircle className="w-8 h-8 text-red-400" />} color="border-red-500/20" />
                    <KPICard title="Ingreso neto" value={formatCOP(neto)} icon={<DollarSign className="w-8 h-8 text-primary" />} color="border-primary/30" />
                    <KPICard title="Adelantos tomados" value={formatCOP(adelantos)} icon={<CreditCard className="w-8 h-8 text-orange-400" />} color="border-orange-500/20" />
                  </>
                );
              })()}
            </div>

            {/* Gráfica ingresos netos semanales */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-primary">
                  <TrendingUp className="w-5 h-5" /> Ingresos netos — últimas 8 semanas
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loadingLiquidaciones ? <ChartSkeleton h={250} /> : (
                  <ResponsiveContainer width="100%" height={250}>
                    <AreaChart data={datosSemanales} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
                      <defs>
                        <linearGradient id="gradNeto" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#c9a84c" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#c9a84c" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                      <XAxis dataKey="semana" tick={{ fill: '#9ca3af', fontSize: 12 }} />
                      <YAxis tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} tick={{ fill: '#9ca3af', fontSize: 11 }} />
                      <Tooltip content={<TooltipCOP />} />
                      <Area type="monotone" dataKey="neto" name="Neto" stroke="#c9a84c" fill="url(#gradNeto)" strokeWidth={2} dot={{ fill: '#c9a84c', r: 4 }} />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            {/* Tabla liquidaciones */}
            <Card>
              <CardHeader>
                <CardTitle>Liquidaciones</CardTitle>
                <CardDescription>Historial de pagos procesados</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-white/10">
                        <th className="px-4 py-3 text-left text-muted-foreground font-medium">Fecha</th>
                        <th className="px-4 py-3 text-right text-muted-foreground font-medium">Bruto Servicios</th>
                        <th className="px-4 py-3 text-right text-muted-foreground font-medium">Descuentos</th>
                        <th className="px-4 py-3 text-right text-muted-foreground font-medium">Neto</th>
                        <th className="px-4 py-3 text-center text-muted-foreground font-medium">Estado</th>
                      </tr>
                    </thead>
                    <tbody>
                      {loadingLiquidaciones ? (
                        <tr><td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">Cargando...</td></tr>
                      ) : liquidaciones.length === 0 ? (
                        <tr><td colSpan={5} className="px-4 py-12 text-center text-muted-foreground">No hay liquidaciones registradas</td></tr>
                      ) : liquidaciones.map(l => (
                        <tr key={l.id} className="border-b border-white/5 hover:bg-white/2">
                          <td className="px-4 py-3 text-white">
                            {l.fecha_liquidacion ? format(new Date(l.fecha_liquidacion), "dd MMM yyyy", { locale: es }) : '—'}
                          </td>
                          <td className="px-4 py-3 text-right text-muted-foreground">{formatCOP(l.total_servicios || 0)}</td>
                          <td className="px-4 py-3 text-right text-red-400">{formatCOP((l.multas || 0) + (l.total_consumos || 0) + (l.adelantos_descontados || 0))}</td>
                          <td className="px-4 py-3 text-right text-green-400 font-bold">{formatCOP(l.total || 0)}</td>
                          <td className="px-4 py-3 text-center">
                            <Badge className={`text-xs border ${l.estado === 'pagado' ? 'bg-green-500/15 text-green-400 border-green-500/30' : 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30'}`}>
                              {l.estado || 'pendiente'}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            {/* Tabla multas */}
            {multasModelo.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-red-400">Multas y Penalidades</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {multasModelo.map(m => (
                    <div key={m.id} className="flex items-center justify-between p-3 bg-red-500/5 border border-red-500/15 rounded-lg">
                      <div>
                        <p className="text-sm font-medium text-white">{m.motivo}</p>
                        <p className="text-xs text-muted-foreground">{m.fecha}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge className={`text-xs border ${m.estado === 'activa' ? 'bg-red-500/15 text-red-400 border-red-500/30' : 'bg-green-500/15 text-green-400 border-green-500/30'}`}>
                          {m.estado}
                        </Badge>
                        <span className="font-bold text-red-400">{formatCOP(m.monto)}</span>
                      </div>
                    </div>
                  ))}
                  <div className="flex justify-end pt-2">
                    <span className="text-sm font-bold text-red-400">Total pendiente: {formatCOP(multasPendientes)}</span>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Adelantos */}
            {adelantosPendientesLista.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-orange-400">Adelantos</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {adelantosPendientesLista.map((a: any) => (
                    <div key={a.id} className="flex items-center justify-between p-3 bg-orange-500/5 border border-orange-500/15 rounded-lg">
                      <div>
                        <p className="text-xs text-muted-foreground">{a.fecha}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge className="text-xs border bg-orange-500/15 text-orange-400 border-orange-500/30">pendiente</Badge>
                        <span className="font-bold text-orange-400">{formatCOP(a.monto)}</span>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* ═══════════════════ TAB: BOUTIQUE ════════════════════════════ */}
        {selectedTab === 'boutique' && (
          <div className="space-y-6">
            {/* Header boutique */}
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-white">Boutique</h2>
                <p className="text-sm text-muted-foreground">Productos disponibles para ti</p>
              </div>
              <Button
                onClick={() => setMostrarPanelCarrito(true)}
                className="relative bg-primary text-black hover:bg-primary/90 gap-2"
              >
                <ShoppingCart className="w-4 h-4" />
                Mi Carrito
                {carritoLocal.length > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                    {carritoLocal.reduce((s, i) => s + i.cantidad, 0)}
                  </span>
                )}
              </Button>
            </div>

            {servicioActivo && (
              <Card className="border-green-500/30 bg-green-500/5">
                <CardContent className="py-3 flex items-center gap-3">
                  <Sparkles className="w-5 h-5 text-green-400" />
                  <p className="text-green-400 text-sm">🎉 Precio especial activo — estás en servicio</p>
                </CardContent>
              </Card>
            )}

            {/* Filtro por categoría */}
            {(() => {
              const categoriasBoutique = ['Todos', ...Array.from(new Set(inventario.map((p) => p.categoria).filter(Boolean)))];
              const productosFiltradosBoutique = categoriaFiltroBoutique === 'Todos'
                ? inventario
                : inventario.filter((p) => p.categoria === categoriaFiltroBoutique);
              return (
                <>
                  <div className="flex gap-2 overflow-x-auto pb-2">
                    {categoriasBoutique.map(cat => (
                      <button
                        key={cat}
                        onClick={() => setCategoriaFiltroBoutique(cat)}
                        className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                          categoriaFiltroBoutique === cat
                            ? 'bg-amber-500 text-black'
                            : 'bg-white/10 text-white/70 hover:bg-white/20'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>

                  {/* Grid productos */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {productosFiltradosBoutique.length === 0 ? (
                      <div className="col-span-full text-center py-16">
                        <ShoppingBag className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-30" />
                        <p className="text-muted-foreground">No hay productos disponibles actualmente</p>
                      </div>
                    ) : productosFiltradosBoutique.map(item => {
                      const precio = servicioActivo ? (item.precioServicio || 0) : (item.precioRegular || 0);
                      const enCarrito = carritoLocal.find(c => c.id === String(item.id));
                      const agotado = item.stock === 0;
                      const stockBajo = item.stock <= 3 && item.stock > 0;
                      return (
                        <div key={item.id} className={`bg-card/60 border rounded-xl overflow-hidden hover:shadow-lg transition-all group ${agotado ? 'border-red-500/20 opacity-70' : 'border-white/10 hover:border-primary/30'}`}>
                          <div className="relative overflow-hidden bg-black/30" style={{ height: '180px' }}>
                            <img
                              src={getFotoProducto(item)}
                              alt={item.nombre}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              loading="lazy"
                              style={{ width: '100%', height: '180px', objectFit: 'cover' }}
                              onError={(e) => { e.currentTarget.src = 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=400&q=80'; }}
                            />
                            {/* Badges de stock */}
                            {agotado && (
                              <div className="absolute top-2 left-2">
                                <Badge className="text-xs bg-red-600 text-white">Agotado</Badge>
                              </div>
                            )}
                            {stockBajo && (
                              <div className="absolute top-2 left-2">
                                <Badge className="text-xs bg-amber-500 text-black">Últimas {item.stock} unidades</Badge>
                              </div>
                            )}
                            <div className="absolute top-2 right-2">
                              <Badge className="text-xs bg-black/70 text-white backdrop-blur-sm">{item.categoria}</Badge>
                            </div>
                            {enCarrito && !agotado && (
                              <div className="absolute bottom-2 right-2 bg-primary text-black text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
                                {enCarrito.cantidad}
                              </div>
                            )}
                          </div>
                          <div className="p-4 space-y-3">
                            <h3 className="font-semibold text-white truncate">{item.nombre}</h3>
                            <p className="text-xs text-muted-foreground line-clamp-2">{item.descripcion}</p>
                            <p className={`text-xl font-bold ${servicioActivo ? 'text-green-400' : 'text-primary'}`}>
                              {formatCOP(precio)}
                            </p>
                            <Button
                              size="sm"
                              className="w-full bg-primary text-black hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
                              disabled={agotado}
                              onClick={() => {
                                if (agotado) return;
                                setCarritoLocal(prev => {
                                  const existe = prev.find(c => c.id === String(item.id));
                                  if (existe) {
                                    return prev.map(c => c.id === String(item.id) ? { ...c, cantidad: c.cantidad + 1 } : c);
                                  }
                                  return [...prev, {
                                    id: String(item.id),
                                    nombre: item.nombre,
                                    precio,
                                    imagen: item.imagen,
                                    categoria: item.categoria,
                                    cantidad: 1,
                                  }];
                                });
                                toast.success(`${item.nombre} agregado al carrito`);
                              }}
                            >
                              <ShoppingCart className="w-4 h-4 mr-2" />
                              {agotado ? 'Agotado' : enCarrito ? `Agregar (${enCarrito.cantidad})` : 'Agregar'}
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              );
            })()}

            {/* Panel del carrito (slide-in) */}
            {mostrarPanelCarrito && (
              <div className="fixed inset-0 z-50 flex">
                {/* Overlay */}
                <div
                  className="flex-1 bg-black/60 backdrop-blur-sm"
                  onClick={() => setMostrarPanelCarrito(false)}
                />
                {/* Panel */}
                <div className="w-full max-w-sm bg-card border-l border-primary/20 flex flex-col h-full shadow-2xl">
                  {/* Header carrito */}
                  <div className="flex items-center justify-between p-5 border-b border-white/10">
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                      <ShoppingCart className="w-5 h-5 text-primary" />
                      Mi Carrito
                      {carritoLocal.length > 0 && (
                        <Badge className="bg-primary text-black text-xs">
                          {carritoLocal.reduce((s, i) => s + i.cantidad, 0)}
                        </Badge>
                      )}
                    </h3>
                    <button
                      onClick={() => setMostrarPanelCarrito(false)}
                      className="text-muted-foreground hover:text-white transition-colors p-1"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Items */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {carritoLocal.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-full text-muted-foreground text-center">
                        <ShoppingBag className="w-16 h-16 mb-4 opacity-20" />
                        <p className="text-sm">Tu carrito está vacío</p>
                        <p className="text-xs mt-1">Agrega productos de la tienda</p>
                      </div>
                    ) : carritoLocal.map(item => (
                      <div key={item.id} className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-lg p-3">
                        {item.imagen ? (
                          <img src={item.imagen} alt={item.nombre} className="w-14 h-14 rounded-lg object-cover flex-shrink-0" loading="lazy" width={56} height={56} />
                        ) : (
                          <div className="w-14 h-14 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                            <ShoppingBag className="w-7 h-7 text-primary/50" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-white truncate">{item.nombre}</p>
                          <p className="text-xs text-primary font-semibold">{formatCOP(item.precio)}</p>
                        </div>
                        {/* Controles cantidad */}
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <button
                            onClick={() => setCarritoLocal(prev =>
                              prev.map(c => c.id === item.id ? { ...c, cantidad: Math.max(1, c.cantidad - 1) } : c)
                            )}
                            className="w-6 h-6 rounded bg-white/10 hover:bg-white/20 flex items-center justify-center text-white text-sm"
                          >-</button>
                          <span className="text-white text-sm w-5 text-center">{item.cantidad}</span>
                          <button
                            onClick={() => setCarritoLocal(prev =>
                              prev.map(c => c.id === item.id ? { ...c, cantidad: c.cantidad + 1 } : c)
                            )}
                            className="w-6 h-6 rounded bg-white/10 hover:bg-white/20 flex items-center justify-center text-white text-sm"
                          >+</button>
                          <button
                            onClick={() => setCarritoLocal(prev => prev.filter(c => c.id !== item.id))}
                            className="w-6 h-6 rounded bg-red-500/20 hover:bg-red-500/40 flex items-center justify-center text-red-400 ml-1"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Footer carrito */}
                  {carritoLocal.length > 0 && (
                    <div className="border-t border-white/10 p-4 space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground text-sm">Total estimado</span>
                        <span className="text-xl font-bold text-primary">
                          {formatCOP(carritoLocal.reduce((s, i) => s + i.precio * i.cantidad, 0))}
                        </span>
                      </div>
                      <Button
                        className="w-full bg-primary text-black hover:bg-primary/90 gap-2"
                        disabled={enviandoSolicitud}
                        onClick={async () => {
                          if (carritoLocal.length === 0) return;
                          setEnviandoSolicitud(true);
                          try {
                            const modeloIdValido = userId && String(userId).includes('-') ? userId : null;
                            if (!modeloIdValido) throw new Error('ID de modelo no válido');

                            // PASO 3 — Insertar cada item como un pedido pendiente
                            for (const item of carritoLocal) {
                              const { error: errorInsert } = await supabase
                                .from('ventas_boutique')
                                .insert({
                                  producto_id: item.id,
                                  producto_nombre: item.nombre,
                                  modelo_id: modeloIdValido,
                                  cantidad: item.cantidad,
                                  precio_unitario: item.precio,
                                  total: item.precio * item.cantidad,
                                  estado: 'pendiente',
                                  vendido_por: modeloIdValido,
                                  fecha: new Date().toISOString(),
                                  notas: (item as any).notas || null
                                });
                              
                              if (errorInsert) throw errorInsert;
                            }

                            // Notificar al administrador (una sola notificación por pedido completo)
                            const resumenItems = carritoLocal.map(i => `• ${i.cantidad}x ${i.nombre}`).join('\n');
                            const totalPedido = carritoLocal.reduce((s, i) => s + i.precio * i.cantidad, 0);

                            await supabase.from('notificaciones').insert({
                              para_rol: 'administrador',
                              titulo: '🛍️ Nuevo pedido de boutique',
                              mensaje: `${modeloActual?.nombreArtistico || 'Una modelo'} ha realizado un nuevo pedido:\n${resumenItems}\n\n💰 Total: ${formatCOP(totalPedido)}`,
                              tipo: 'pedido_boutique',
                              leida: false
                            });

                            setCarritoLocal([]);
                            setMostrarPanelCarrito(false);
                            toast.success('✅ Pedido enviado — Esperando aprobación del admin');
                          } catch (err: any) {
                            console.error('Error al enviar pedido:', err);
                            toast.error('Error al enviar el pedido. Intenta de nuevo.');
                          } finally {
                            setEnviandoSolicitud(false);
                          }
                        }}
                      >
                        {enviandoSolicitud ? (
                          <><RefreshCw className="w-4 h-4 animate-spin" /> Enviando...</>
                        ) : (
                          <><CheckCircle className="w-4 h-4" /> Confirmar Pedido</>
                        )}
                      </Button>
                      <button
                        onClick={() => setCarritoLocal([])}
                        className="w-full text-xs text-red-400 hover:text-red-300 text-center py-1"
                      >
                        Vaciar carrito
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 🛍️ SECCIÓN: MIS PEDIDOS */}
            <div className="mt-12 space-y-4">
              <div className="flex items-center gap-2 border-b border-white/10 pb-2">
                <History className="w-5 h-5 text-primary" />
                <h3 className="text-lg font-bold text-white uppercase tracking-tighter">Mis Pedidos Boutique</h3>
              </div>

              {loadingPedidos ? (
                <div className="h-24 bg-white/5 rounded-xl animate-pulse" />
              ) : misPedidos.length === 0 ? (
                <Card className="bg-card/30 border-dashed border-white/10">
                  <CardContent className="py-8 text-center text-muted-foreground">
                    <p className="text-sm">Aún no has realizado pedidos</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {misPedidos.map((pedido) => (
                    <div key={pedido.id} className="bg-card/40 border border-white/10 rounded-xl p-4 flex flex-col gap-2 group hover:border-primary/20 transition-all">
                      <div className="flex justify-between items-start">
                        <div className="min-w-0">
                          <p className="font-bold text-white truncate">{pedido.producto_nombre}</p>
                          <p className="text-[10px] text-muted-foreground">
                            {format(new Date(pedido.fecha), "d 'de' MMMM, HH:mm", { locale: es })}
                          </p>
                        </div>
                        <Badge className={`
                          border px-2 py-0.5 text-[10px]
                          ${pedido.estado === 'pendiente' ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20' :
                            pedido.estado === 'aceptado' ? 'bg-green-500/10 text-green-500 border-green-500/20' :
                            pedido.estado === 'rechazado' ? 'bg-red-500/10 text-red-500 border-red-500/20' :
                            'bg-primary/10 text-primary border-primary/20'}
                        `}>
                          {pedido.estado}
                        </Badge>
                      </div>
                      
                      <div className="flex justify-between items-center text-sm pt-1 border-t border-white/5 mt-1">
                        <span className="text-muted-foreground">{pedido.cantidad} unidad(es)</span>
                        <span className="font-bold text-primary">{formatCOP(pedido.total)}</span>
                      </div>

                      {pedido.estado === 'rechazado' && pedido.motivo_rechazo && (
                        <div className="mt-2 p-2 bg-red-500/5 border border-red-500/10 rounded-lg">
                          <p className="text-[10px] text-red-400 font-bold uppercase">Motivo del rechazo:</p>
                          <p className="text-xs text-red-300/80 italic">{pedido.motivo_rechazo}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ═══════════════════ TAB: CALENDARIO ══════════════════════════ */}
        {selectedTab === 'calendario' && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-white">Calendario</h2>
            <Suspense fallback={<ChartSkeleton h={400} />}>
              <CalendarioModeloView citas={citasProximas.map(c => ({ ...c, fechaInicio: c.fecha || '' })) as any} onCitaClick={setCitaSeleccionada} />
            </Suspense>
            <Card>
              <CardHeader>
                <CardTitle>Próximas Citas</CardTitle>
              </CardHeader>
              <CardContent>
                {proximasCitasOrdenadas.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Calendar className="w-12 h-12 mx-auto mb-3 opacity-30" />
                    <p>No tienes citas próximas agendadas</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {proximasCitasOrdenadas.map(cita => {
                      const estadoClr: Record<string, string> = {
                        pendiente: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30',
                        aprobado: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
                        'en curso': 'bg-green-500/15 text-green-400 border-green-500/30',
                        completado: 'bg-gray-500/15 text-gray-400 border-gray-500/30',
                        cancelado: 'bg-red-500/15 text-red-400 border-red-500/30',
                      };
                      const cls = estadoClr[cita.estado] || 'bg-gray-500/15 text-gray-400 border-gray-500/30';
                      return (
                        <div key={cita.id} className="flex items-center gap-4 p-3 rounded-lg border border-white/8 hover:border-primary/20 transition-colors cursor-pointer bg-card/30" onClick={() => setCitaSeleccionada(cita)}>
                          <div className="text-center w-14 flex-shrink-0">
                            <p className="text-lg font-bold text-primary">{format(parseISO(cita.fecha), 'dd')}</p>
                            <p className="text-xs text-muted-foreground uppercase">{format(parseISO(cita.fecha), 'MMM', { locale: es })}</p>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-white">{cita.clienteNombre}</p>
                            <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                              <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{formatearHora(cita.hora)} · {cita.duracionMinutos}min</span>
                              <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{cita.tipoServicio === 'domicilio' ? 'Domicilio' : 'Sede'}</span>
                            </div>
                          </div>
                          <Badge className={`border text-xs px-2 py-0.5 flex-shrink-0 ${cls}`}>{cita.estado}</Badge>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
            <Suspense fallback={null}>
              {modeloActual && <CalendarioPanel modeloEmail={emailModelo} userRole="modelo" />}
            </Suspense>
          </div>
        )}

        {/* ═══════════════════ TAB: MI PERFIL ═══════════════════════════ */}
        {selectedTab === 'perfil' && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-white">Mi Perfil</h2>

            {/* Barra completitud */}
            {(() => {
              const campos = [
                fotoDisplay,
                modeloActual?.nombreArtistico,
                modeloActual?.telefono,
                modeloActual?.descripcion,
                modeloActual?.sede,
                modeloActual?.edad,
              ];
              const pct = Math.round((campos.filter(Boolean).length / campos.length) * 100);
              return (
                <Card>
                  <CardContent className="py-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-white">Completitud del perfil</span>
                      <span className="text-sm font-bold text-primary">{pct}%</span>
                    </div>
                    <div className="w-full bg-white/10 rounded-full h-2">
                      <div className="bg-primary h-2 rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
                    </div>
                    {pct < 100 && (
                      <p className="text-xs text-muted-foreground mt-2">Completa tu perfil para mejorar tu visibilidad</p>
                    )}
                  </CardContent>
                </Card>
              );
            })()}

            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <CardTitle>Información Personal</CardTitle>
                  <Button
                    size="sm"
                    variant={editandoPerfil ? 'default' : 'outline'}
                    onClick={() => { if (editandoPerfil) guardarPerfil(); else setEditandoPerfil(true); }}
                    disabled={guardandoPerfil}
                    className="gap-2"
                  >
                    {guardandoPerfil ? <RefreshCw className="w-4 h-4 animate-spin" /> : editandoPerfil ? <Save className="w-4 h-4" /> : <Edit3 className="w-4 h-4" />}
                    {guardandoPerfil ? 'Guardando...' : editandoPerfil ? 'Guardar' : 'Editar'}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col md:flex-row gap-8">
                  {/* Foto */}
                  <div className="flex flex-col items-center gap-4 flex-shrink-0">
                    <Avatar className="w-32 h-32 border-4 border-primary/50 ring-4 ring-primary/10">
                      <AvatarImage src={fotoDisplay} />
                      <AvatarFallback className="text-4xl font-bold bg-primary/20 text-primary">
                        {nombreDisplay.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="text-center">
                      <p className="text-lg font-bold text-white">{nombreDisplay}</p>
                      <p className="text-xs text-muted-foreground">{userEmail}</p>
                    </div>
                  </div>

                  {/* Campos */}
                  <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Editables */}
                    <div className="space-y-1">
                      <label className="text-xs text-muted-foreground">Nombre artístico</label>
                      {editandoPerfil ? (
                        <input
                          value={perfilForm.nombreArtistico}
                          onChange={e => setPerfilForm(p => ({ ...p, nombreArtistico: e.target.value }))}
                          className="w-full px-3 py-2 bg-card border border-primary/30 rounded-lg text-white text-sm focus:outline-none focus:border-primary"
                        />
                      ) : (
                        <p className="text-sm text-white bg-card/50 rounded-lg px-3 py-2">{modeloActual?.nombreArtistico || 'No definido'}</p>
                      )}
                    </div>

                    <div className="space-y-1 sm:col-span-2">
                      <label className="text-xs text-muted-foreground">Descripción / Bio</label>
                      {editandoPerfil ? (
                        <textarea
                          value={perfilForm.descripcion}
                          onChange={e => setPerfilForm(p => ({ ...p, descripcion: e.target.value }))}
                          rows={3}
                          className="w-full px-3 py-2 bg-card border border-primary/30 rounded-lg text-white text-sm focus:outline-none focus:border-primary resize-none"
                        />
                      ) : (
                        <p className="text-sm text-white bg-card/50 rounded-lg px-3 py-2 min-h-[60px]">{(modeloActual as any)?.descripcion || 'Sin descripción'}</p>
                      )}
                    </div>

                    {/* Solo lectura */}
                    {[
                      { label: 'Email', value: userEmail },
                      { label: 'Teléfono', value: modeloActual?.telefono || 'No registrado' },
                      { label: 'Sede', value: modeloActual?.sede || 'No asignada' },
                      { label: 'Estado', value: modeloActual?.activa ? 'Activa' : 'Inactiva' },
                    ].map(f => (
                      <div key={f.label} className="space-y-1">
                        <label className="text-xs text-muted-foreground">{f.label}</label>
                        <p className="text-sm text-white/70 bg-card/30 rounded-lg px-3 py-2">{f.value}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Galería de fotos */}
            {userId && (
              <Card>
                <CardHeader>
                  <CardTitle>Mi Galería de Fotos</CardTitle>
                  <CardDescription>Administra las fotos que aparecen en tu perfil público</CardDescription>
                </CardHeader>
                <CardContent>
                  <GaleriaFotosModelo
                    modeloId={userId}
                    modeloEmail={userEmail}
                    soloLectura={false}
                  />
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* ═══════════════════ TAB: NOTIFICACIONES ══════════════════════ */}
        {selectedTab === 'notificaciones' && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-white">Notificaciones</h2>
            <Suspense fallback={<ChartSkeleton h={300} />}>
              <NotificacionesPanel />
            </Suspense>
          </div>
        )}

        {/* ═══════════════════ TAB: ANALYTICS ══════════════════════════ */}
        {selectedTab === 'analytics' && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-white">Analytics</h2>

            {/* KPIs globales */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {(() => {
                const promedioIngreso = serviciosDeModelo.length > 0
                  ? serviciosDeModelo.reduce((s, x) => s + (x.montoPagado ?? x.montoPactado ?? 0), 0) / serviciosDeModelo.length
                  : 0;

                const clienteCount: Record<string, number> = {};
                serviciosDeModelo.forEach(s => { if (s.clienteNombre) clienteCount[s.clienteNombre] = (clienteCount[s.clienteNombre] || 0) + 1; });
                const topCliente = Object.entries(clienteCount).sort((a, b) => b[1] - a[1])[0];

                const mesPorMes: Record<string, number> = {};
                serviciosDeModelo.forEach(s => {
                  const d = parseISO(s.fecha || '2000-01-01');
                  if (!isValid(d)) return;
                  const k = format(d, 'yyyy-MM');
                  mesPorMes[k] = (mesPorMes[k] || 0) + (s.montoPagado ?? s.montoPactado ?? 0);
                });
                const mejorMes = Object.entries(mesPorMes).sort((a, b) => b[1] - a[1])[0];

                return (
                  <>
                    <KPICard title="Total servicios" value={String(serviciosDeModelo.length)} icon={<Activity className="w-8 h-8 text-blue-400" />} color="border-blue-500/20" />
                    <KPICard title="Promedio por servicio" value={formatCOP(Math.round(promedioIngreso))} icon={<TrendingUp className="w-8 h-8 text-green-400" />} color="border-green-500/20" />
                    <KPICard title="Cliente más frecuente" value={topCliente?.[0] || 'N/A'} sub={topCliente ? `${topCliente[1]} servicios` : ''} icon={<Users className="w-8 h-8 text-purple-400" />} color="border-purple-500/20" />
                    <KPICard title="Mejor mes" value={mejorMes ? format(parseISO(mejorMes[0] + '-01'), 'MMM yyyy', { locale: es }) : 'N/A'} sub={mejorMes ? formatCOP(mejorMes[1]) : ''} icon={<Zap className="w-8 h-8 text-yellow-400" />} color="border-yellow-500/20" />
                  </>
                );
              })()}
            </div>

            {/* Gráfica 1: Ingresos 6 meses */}
            <Card>
              <CardHeader>
                <CardTitle>Ingresos por mes — últimos 6 meses</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={datosIngresos6Meses}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="mes" tick={{ fill: '#9ca3af', fontSize: 12 }} />
                    <YAxis tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} tick={{ fill: '#9ca3af', fontSize: 11 }} />
                    <Tooltip content={<TooltipCOP />} />
                    <Bar dataKey="ingresos" name="Ingresos" fill="#c9a84c" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Gráfica 2: Servicios por día */}
              <Card>
                <CardHeader>
                  <CardTitle>Servicios por día de la semana</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={datosPorDia}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                      <XAxis dataKey="dia" tick={{ fill: '#9ca3af', fontSize: 12 }} />
                      <YAxis tick={{ fill: '#9ca3af', fontSize: 11 }} allowDecimals={false} />
                      <Tooltip />
                      <Bar dataKey="servicios" name="Servicios" fill="#a07830" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Gráfica 3: Tipos de servicio */}
              <Card>
                <CardHeader>
                  <CardTitle>Tipos de servicio</CardTitle>
                </CardHeader>
                <CardContent>
                  {datosTipos.length === 0 ? (
                    <div className="flex items-center justify-center h-[220px] text-muted-foreground">Sin datos</div>
                  ) : (
                    <ResponsiveContainer width="100%" height={220}>
                      <RechartsPie>
                        <Pie data={datosTipos} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={4} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                          {datosTipos.map((_, idx) => (
                            <Cell key={idx} fill={CHART_COLORS[idx % CHART_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </RechartsPie>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Tabla rendimiento mensual */}
            <Card>
              <CardHeader>
                <CardTitle>Rendimiento mensual</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-white/10">
                        <th className="px-4 py-3 text-left text-muted-foreground font-medium">Mes</th>
                        <th className="px-4 py-3 text-right text-muted-foreground font-medium">Servicios</th>
                        <th className="px-4 py-3 text-right text-muted-foreground font-medium">Clientes únicos</th>
                        <th className="px-4 py-3 text-right text-muted-foreground font-medium">Ingreso bruto</th>
                        <th className="px-4 py-3 text-right text-muted-foreground font-medium">Promedio</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Array.from({ length: 6 }, (_, i) => {
                        const fecha = subMonths(ahora, 5 - i);
                        const mes = getMonth(fecha);
                        const anio = getYear(fecha);
                        const srvsMes = serviciosDeModelo.filter(s => {
                          const d = parseISO(s.fecha || '2000-01-01');
                          return isValid(d) && getMonth(d) === mes && getYear(d) === anio;
                        });
                        const bruto = srvsMes.reduce((s, x) => s + (x.montoPagado ?? x.montoPactado ?? 0), 0);
                        const clientes = new Set(srvsMes.map(s => s.clienteNombre)).size;
                        const promedio = srvsMes.length > 0 ? bruto / srvsMes.length : 0;
                        return (
                          <tr key={i} className="border-b border-white/5 hover:bg-white/2">
                            <td className="px-4 py-3 text-white capitalize">{format(fecha, 'MMMM yyyy', { locale: es })}</td>
                            <td className="px-4 py-3 text-right text-white">{srvsMes.length}</td>
                            <td className="px-4 py-3 text-right text-muted-foreground">{clientes}</td>
                            <td className="px-4 py-3 text-right text-green-400 font-semibold">{formatCOP(bruto)}</td>
                            <td className="px-4 py-3 text-right text-muted-foreground">{formatCOP(Math.round(promedio))}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* ═══════════════════ TAB: TRANSMISIÓN ═════════════════════════ */}
        {selectedTab === 'transmision' && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-white">Transmisión en Vivo</h2>
            <Suspense fallback={<ChartSkeleton h={300} />}>
              {modeloActual && (
                <StreamingControl
                  modelId={String(modeloActual.id || '')}
                  modelName={modeloActual.nombreArtistico || modeloActual.nombre}
                />
              )}
            </Suspense>
          </div>
        )}

      </main>

      {/* ── Botón flotante carrito ────────────────────────────────────────── */}
      {carrito.length > 0 && (
        <button
          onClick={() => setMostrarCarritoBoutique(true)}
          className="fixed bottom-6 right-6 z-40 bg-primary text-black rounded-full p-4 shadow-2xl hover:bg-primary/90 transition-colors group"
        >
          <div className="relative">
            <ShoppingCart className="w-6 h-6" />
            <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
              {carrito.length}
            </div>
          </div>
        </button>
      )}

      {/* ── Modales ───────────────────────────────────────────────────────── */}
      <Suspense fallback={null}>
        {modeloActual && mostrarRegistroEntrada && (
          <RegistroEntradaModal
            isOpen={mostrarRegistroEntrada}
            onClose={() => setMostrarRegistroEntrada(false)}
            modeloEmail={emailModelo}
            modeloNombre={modeloActual.nombre}
          />
        )}
        {modeloActual && mostrarIniciarServicio && (
          <IniciarServicioModal
            isOpen={mostrarIniciarServicio}
            onClose={() => setMostrarIniciarServicio(false)}
            modeloEmail={emailModelo}
            modeloNombre={modeloActual.nombre}
          />
        )}
        {modeloActual && mostrarServicioDirecto && (
          <ServicioDirectoModal
            isOpen={mostrarServicioDirecto}
            onClose={() => setMostrarServicioDirecto(false)}
            currentUser={{ id: String(modeloActual.id || ''), email: emailModelo, nombre: modeloActual.nombre || '' }}
            onSuccess={() => {
              // Recargar datos
              recargarAgendamientos();
              recargarServicios();
            }}
          />
        )}
        <CarritoBoutiqueModal
          isOpen={mostrarCarritoBoutique}
          onClose={() => setMostrarCarritoBoutique(false)}
          onProcederCheckout={() => setMostrarCheckoutBoutique(true)}
        />
        {modeloActual && mostrarCheckoutBoutique && (
          <CheckoutBoutiqueModal
            isOpen={mostrarCheckoutBoutique}
            onClose={() => setMostrarCheckoutBoutique(false)}
            modeloEmail={emailModelo}
            modeloNombre={modeloActual.nombre}
          />
        )}
        <DetalleCitaModal
          isOpen={!!citaSeleccionada}
          onClose={() => setCitaSeleccionada(null)}
          cita={citaSeleccionada}
        />
        {agendamientoAConfirmar && (
          <ConfirmarAgendamientoModeloModal
            isOpen={mostrarConfirmarAgendamiento}
            onClose={() => {
              setMostrarConfirmarAgendamiento(false);
              setAgendamientoAConfirmar(null);
            }}
            agendamiento={agendamientoAConfirmar}
            modeloEmail={userEmail}
            modeloNombre={perfilDB?.nombreArtistico || perfilDB?.nombre || 'Modelo'}
            onSuccess={() => {
              // El contexto de agendamientos suele ser realtime, pero podemos forzar refresh si fuera necesario
            }}
          />
        )}
      </Suspense>

      {/* Modal de calificación de cliente — aparece tras cerrar el reporte */}
      <Suspense fallback={null}>
        <CalificarClienteModal
          isOpen={!!calificacionPendiente}
          onClose={() => setCalificacionPendiente(null)}
          data={calificacionPendiente}
        />
      </Suspense>
    </div>
  );
}