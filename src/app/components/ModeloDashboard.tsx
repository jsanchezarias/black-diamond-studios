import { useState, lazy, Suspense, useEffect } from 'react';
import IngresosWidget from '../../components/IngresosWidget';
import { GaleriaFotosModelo } from '../../components/GaleriaFotosModelo';
import { format, subMonths, startOfMonth, endOfMonth, getMonth, getYear, parseISO, isValid } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  User,
  Calendar,
  DollarSign,
  CheckCircle,
  Clock,
  TrendingUp,
  AlertCircle,
  LogOut,
  Activity,
  CreditCard,
  XCircle,
  Camera,
  Play,
  ShoppingBag,
  ShoppingCart,
  Sparkles,
  Info,
  MapPin,
  Bell,
  PieChart,
  Video,
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
} from 'lucide-react';
import {
  BarChart, Bar, LineChart, Line, PieChart as RechartsPie, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, AreaChart
} from 'recharts';
import { LogoIsotipo } from './LogoIsotipo';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '../../components/ui/avatar';
import { useModelos } from './ModelosContext';
import { useServicios } from './ServiciosContext';
import { useMultas } from './MultasContext';
import { usePagos } from './PagosContext';
import { useAgendamientos, formatearHora } from './AgendamientosContext';
import { useAsistencia } from './AsistenciaContext';
import { useInventory } from './InventoryContext';
import { useCarrito } from './CarritoContext';
import { supabase } from '../../utils/supabase/info';
import { toast } from 'sonner';
import { useServiceAlarms } from './useServiceAlarms';

// Lazy loading de paneles pesados
const AgendamientosPanel = lazy(() => import('./AgendamientosPanel').then(m => ({ default: m.AgendamientosPanel })));
const AgendamientosMetrics = lazy(() => import('./AgendamientosMetrics').then(m => ({ default: m.AgendamientosMetrics })));
const RegistroEntradaModal = lazy(() => import('../../components/RegistroEntradaModal').then(m => ({ default: m.RegistroEntradaModal })));
const IniciarServicioModal = lazy(() => import('../../components/IniciarServicioModal').then(m => ({ default: m.IniciarServicioModal })));
const ServicioActivoCard = lazy(() => import('../../components/ServicioActivoCard').then(m => ({ default: m.ServicioActivoCard })));
const CarritoBoutiqueModal = lazy(() => import('../../components/CarritoBoutiqueModal').then(m => ({ default: m.CarritoBoutiqueModal })));
const CheckoutBoutiqueModal = lazy(() => import('../../components/CheckoutBoutiqueModal').then(m => ({ default: m.CheckoutBoutiqueModal })));
const CalendarioModeloView = lazy(() => import('../../components/CalendarioModeloView').then(m => ({ default: m.CalendarioModeloView })));
const CalendarioPanel = lazy(() => import('../../components/CalendarioPanel').then(m => ({ default: m.CalendarioPanel })));
const DetalleCitaModal = lazy(() => import('../../components/DetalleCitaModal').then(m => ({ default: m.DetalleCitaModal })));
const NotificacionesPanel = lazy(() => import('./NotificacionesPanel').then(m => ({ default: m.NotificacionesPanel })));
const AnalyticsPanel = lazy(() => import('./AnalyticsPanel').then(m => ({ default: m.AnalyticsPanel })));
const StreamingControl = lazy(() => import('./StreamingControl').then(m => ({ default: m.StreamingControl })));

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
function KPISkeleton() {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {[1, 2, 3, 4].map(i => (
        <div key={i} className="h-28 rounded-xl animate-pulse bg-white/5 border border-white/10" />
      ))}
    </div>
  );
}

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

// ─── Component principal ──────────────────────────────────────────────────────
export function ModeloDashboard({ accessToken, userId, userEmail, onLogout }: ModeloDashboardProps) {
  const [selectedTab, setSelectedTab] = useState('inicio');
  const [menuOpen, setMenuOpen] = useState(false);
  const [mostrarRegistroEntrada, setMostrarRegistroEntrada] = useState(false);
  const [mostrarIniciarServicio, setMostrarIniciarServicio] = useState(false);
  const [mostrarCarritoBoutique, setMostrarCarritoBoutique] = useState(false);
  const [mostrarCheckoutBoutique, setMostrarCheckoutBoutique] = useState(false);
  const [citaSeleccionada, setCitaSeleccionada] = useState<any>(null);

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
  const [filtroServicios, setFiltroServicios] = useState<'mes' | '3meses' | 'todo'>('mes');
  const [busquedaServicios, setBusquedaServicios] = useState('');

  const { modelos, loading: loadingModelos } = useModelos();
  const { servicios, obtenerServiciosPorModelo } = useServicios();
  const { multas, obtenerTotalMultasPendientesPorEmail } = useMultas();
  const { obtenerAdelantosPendientes } = usePagos();
  const { obtenerAgendamientosPendientes } = useAgendamientos();
  const { registrarSalida, obtenerRegistroActual, obtenerSolicitudPorModelo } = useAsistencia();
  const { inventario } = useInventory();
  const { carrito, agregarAlCarrito } = useCarrito();

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

  // ── Construir modeloActual: contexto → DB → fallback mínimo ───────────────
  const modeloDesdeContexto = modelos.find(m =>
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

  const citasProximas = modeloActual ? obtenerAgendamientosPendientes(emailModelo) : [];
  const citasHoy = citasProximas.filter(c => {
    const d = new Date(c.fecha);
    return d.toDateString() === ahora.toDateString();
  }).sort((a, b) => (a.hora ?? '').localeCompare(b.hora ?? ''));

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
        return ok && matchBusq;
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
              </div>
            </div>

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
                      onClick={() => { registrarSalida(emailModelo); toast.success('Salida registrada'); }}>
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
                  onFinalizar={() => toast.success('Servicio finalizado')}
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
                {(['mes', '3meses', 'todo'] as const).map(f => (
                  <button
                    key={f}
                    onClick={() => { setFiltroServicios(f); setPaginaServicios(1); }}
                    className={`px-4 py-2 text-xs font-medium transition-colors ${filtroServicios === f ? 'bg-primary text-black' : 'bg-card text-muted-foreground hover:text-white'}`}
                  >
                    {f === 'mes' ? 'Este mes' : f === '3meses' ? 'Últimos 3 meses' : 'Todo'}
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
                          <td className="px-4 py-3 text-muted-foreground capitalize">{s.tipoServicio || '—'}</td>
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
                        <p className="text-sm font-medium text-white">{m.concepto}</p>
                        <p className="text-xs text-muted-foreground">{m.fecha}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge className={`text-xs border ${m.estado === 'pendiente' ? 'bg-red-500/15 text-red-400 border-red-500/30' : 'bg-green-500/15 text-green-400 border-green-500/30'}`}>
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
                          setEnviandoSolicitud(true);
                          try {
                            const modeloIdValido = userId && String(userId).includes('-') ? userId : null;
                            const { error } = await supabase
                              .from('boutique_solicitudes')
                              .insert({
                                modelo_email: emailModelo,
                                modelo_id: modeloIdValido,
                                items: carritoLocal,
                                total: carritoLocal.reduce((s, i) => s + i.precio * i.cantidad, 0),
                                estado: 'pendiente',
                              });
                            if (error) throw error;
                            setCarritoLocal([]);
                            setMostrarPanelCarrito(false);
                            toast.success('✅ Solicitud enviada correctamente. El admin la procesará pronto.');
                          } catch {
                            toast.error('Error al enviar la solicitud. Intenta de nuevo.');
                          } finally {
                            setEnviandoSolicitud(false);
                          }
                        }}
                      >
                        {enviandoSolicitud ? (
                          <><RefreshCw className="w-4 h-4 animate-spin" /> Enviando...</>
                        ) : (
                          <><CheckCircle className="w-4 h-4" /> Enviar Solicitud</>
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
      </Suspense>
    </div>
  );
}