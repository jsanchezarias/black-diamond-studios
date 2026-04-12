import { useState, lazy, Suspense } from 'react';
import { 
  BarChart3, 
  Users, 
  UserCheck, 
  Receipt, 
  DoorOpen, 
  DollarSign, 
  Calendar, 
  ShoppingCart, 
  Video,
  Activity,
  TrendingUp,
  ChevronDown,
  Eye,
  Archive,
  CreditCard,
  UserPlus,
  MessageSquare,
  Code, // Agregado para el icono de programadores
  Bell,
  PieChart, // 📊 Icono para Analytics
  Menu,
  X,
  LogOut
} from 'lucide-react';
import { LogoIsotipo } from './LogoIsotipo';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { useModelos, Modelo } from './ModelosContext';
import { useServicios } from './ServiciosContext';
import { usePagos } from './PagosContext';
import { useInventory } from './InventoryContext';
import { useGastos } from './GastosContext';
import { toast } from 'sonner';
// Lazy loading de paneles — solo se cargan cuando se activa la pestaña correspondiente
const AsistenciaPanel = lazy(() => import('./AsistenciaPanel').then(m => ({ default: m.AsistenciaPanel })));
const RendimientoModelosPanel = lazy(() => import('../../components/RendimientoModelosPanel').then(m => ({ default: m.RendimientoModelosPanel })));
const ModelosArchivadasPanel = lazy(() => import('../../components/ModelosArchivadasPanel').then(m => ({ default: m.ModelosArchivadasPanel })));
const HistorialClientesPanel = lazy(() => import('../../components/HistorialClientesPanel').then(m => ({ default: m.HistorialClientesPanel })));
const LiquidacionPanel = lazy(() => import('../../components/LiquidacionPanel').then(m => ({ default: m.LiquidacionPanel })));
const GestionAdelantosPanel = lazy(() => import('../../components/GestionAdelantosPanel').then(m => ({ default: m.GestionAdelantosPanel })));
const HabitacionesPanel = lazy(() => import('../../components/HabitacionesPanel').then(m => ({ default: m.HabitacionesPanel })));
const FinanzasPanel = lazy(() => import('../../components/FinanzasPanel').then(m => ({ default: m.FinanzasPanel })));
const GastosOperativosPanel = lazy(() => import('../../components/GastosOperativosPanel').then(m => ({ default: m.GastosOperativosPanel })));
const StreamConfigPanel = lazy(() => import('../../components/StreamConfigPanel').then(m => ({ default: m.StreamConfigPanel })));
const DetalleModeloPanel = lazy(() => import('../../components/DetalleModeloPanel').then(m => ({ default: m.DetalleModeloPanel })));
const EditarModeloModal = lazy(() => import('./EditarModeloModal').then(m => ({ default: m.EditarModeloModal })));
const CrearModeloModal = lazy(() => import('../../components/CrearModeloModal').then(m => ({ default: m.CrearModeloModal })));
const BoutiquePanel = lazy(() => import('../../components/BoutiquePanel').then(m => ({ default: m.BoutiquePanel })));
const SolicitudesEntradaPanel = lazy(() => import('../../components/SolicitudesEntradaPanel').then(m => ({ default: m.SolicitudesEntradaPanel })));
const ServiciosPublicosPanel = lazy(() => import('../../components/ServiciosPublicosPanel').then(m => ({ default: m.ServiciosPublicosPanel })));
const DiagnosticoPanel = lazy(() => import('../../components/admin/DiagnosticoPanel').then(m => ({ default: m.DiagnosticoPanel })));
const ConfiguracionChatPanel = lazy(() => import('../../components/ConfiguracionChatPanel').then(m => ({ default: m.ConfiguracionChatPanel })));
const ChatModeratorPanel = lazy(() => import('../../components/ChatModeratorPanel').then(m => ({ default: m.ChatModeratorPanel })));
const GestionUsuariosPanel = lazy(() => import('../../components/GestionUsuariosPanel').then(m => ({ default: m.GestionUsuariosPanel })));
const GestionClientesAdmin = lazy(() => import('./GestionClientesAdmin').then(m => ({ default: m.GestionClientesAdmin })));
const NotificacionesPanel = lazy(() => import('./NotificacionesPanel').then(m => ({ default: m.NotificacionesPanel })));
const AnalyticsPanel = lazy(() => import('./AnalyticsPanel').then(m => ({ default: m.AnalyticsPanel })));
const GestionTestimoniosPanel = lazy(() => import('../../components/GestionTestimoniosPanel').then(m => ({ default: m.GestionTestimoniosPanel })));
const AdminResumenPanel = lazy(() => import('../../components/admin/AdminResumenPanel').then(m => ({ default: m.AdminResumenPanel })));
const AgendamientosPanel = lazy(() => import('./AgendamientosPanel').then(m => ({ default: m.AgendamientosPanel })));
const AgendamientosMetrics = lazy(() => import('./AgendamientosMetrics').then(m => ({ default: m.AgendamientosMetrics })));

type ModuloType = 'general' | 'modelos' | 'clientes' | 'pagos' | 'habitaciones' | 'finanzas' | 'operaciones' | 'agendamientos' | 'boutique' | 'streams' | 'diagnostico' | 'chat' | 'programadores' | 'notificaciones' | 'analytics' | 'testimonios';

interface Modulo {
  id: ModuloType;
  nombre: string;
  icono: React.ReactNode;
  descripcion: string;
}

interface AdminDashboardProps {
  accessToken: string;
  userId: string;
  userEmail?: string;
  onLogout?: () => void;
}

export function AdminDashboard({ accessToken, userId, userEmail = '', onLogout }: AdminDashboardProps) {
  const [moduloActivo, setModuloActivo] = useState<ModuloType>('general');
  const [modeloDetalle, setModeloDetalle] = useState<Modelo | null>(null);
  const [modeloEditar, setModeloEditar] = useState<Modelo | null>(null);
  const [mostrarCrearModelo, setMostrarCrearModelo] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  // ✅ MANEJO DEFENSIVO DE CONTEXTOS
  try {
    var pagosCtx = usePagos();
    var modelosCtx = useModelos();
    var serviciosCtx = useServicios();
    var inventoryCtx = useInventory();
    var gastosCtx = useGastos();
  } catch (error) {
    const isDev = process.env.NODE_ENV === 'development';
    if (isDev) console.error('❌ ERROR AL CARGAR CONTEXTOS EN ADMIN DASHBOARD:', error);
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-[#0f1014]">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold text-red-500">Error al cargar AdminDashboard</h1>
          <p className="text-gray-400">{error instanceof Error ? error.message : 'Error desconocido'}</p>
          {onLogout && (
            <Button onClick={onLogout} className="mt-4">
              Volver al inicio
            </Button>
          )}
        </div>
      </div>
    );
  }

  const { obtenerAdelantosPendientes } = pagosCtx;
  const { modelos = [], modelosArchivadas = [] } = modelosCtx;
  const { servicios = [] } = serviciosCtx;
  const { inventario = [] } = inventoryCtx;
  const { gastosOperativos = [] } = gastosCtx || { gastosOperativos: [] };

  // Derivar estadísticas desde los servicios reales
  const hoy = new Date().toISOString().split('T')[0];
  const inicioMes = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];
  const serviciosFinalizados = servicios.filter(s => s.estado === 'completado');
  const serviciosHoy = serviciosFinalizados.filter(s => s.fecha === hoy).length;
  const serviciosMes = serviciosFinalizados.filter(s => s.fecha >= inicioMes).length;
  const ingresosHoy = serviciosFinalizados.filter(s => s.fecha === hoy).reduce((sum, s) => sum + (s.montoPagado ?? s.montoPactado ?? 0), 0);
  const ingresosMes = serviciosFinalizados.filter(s => s.fecha >= inicioMes).reduce((sum, s) => sum + (s.montoPagado ?? s.montoPactado ?? 0), 0);
  const gastosHoy = gastosOperativos.filter((g: any) => (g.fecha || '').startsWith(hoy)).reduce((sum: number, g: any) => sum + (g.monto ?? 0), 0);
  const gastosMes = gastosOperativos.filter((g: any) => (g.fecha || '') >= inicioMes).reduce((sum: number, g: any) => sum + (g.monto ?? 0), 0);

  const modulos: Modulo[] = [
    {
      id: 'general',
      nombre: 'General',
      icono: <BarChart3 className="w-5 h-5" />,
      descripcion: 'Vista general y actividad reciente'
    },
    {
      id: 'modelos',
      nombre: 'Modelos',
      icono: <Users className="w-5 h-5" />,
      descripcion: 'Rendimiento y estadísticas de modelos'
    },
    {
      id: 'clientes',
      nombre: 'Clientes',
      icono: <UserCheck className="w-5 h-5" />,
      descripcion: 'Historial y gestión de clientes'
    },
    {
      id: 'pagos',
      nombre: 'Pagos',
      icono: <Receipt className="w-5 h-5" />,
      descripcion: 'Liquidaciones y adelantos'
    },
    {
      id: 'habitaciones',
      nombre: 'Habitaciones',
      icono: <DoorOpen className="w-5 h-5" />,
      descripcion: 'Estado de habitaciones en tiempo real'
    },
    {
      id: 'finanzas',
      nombre: 'Finanzas',
      icono: <DollarSign className="w-5 h-5" />,
      descripcion: 'Análisis financiero y reportes'
    },
    {
      id: 'operaciones',
      nombre: 'Operaciones',
      icono: <Calendar className="w-5 h-5" />,
      descripcion: 'Servicios y ocupación'
    },
    {
      id: 'agendamientos',
      nombre: 'Agendamientos',
      icono: <Calendar className="w-5 h-5" />,
      descripcion: 'Gestión de citas y aprobaciones'
    },
    {
      id: 'boutique',
      nombre: 'Boutique',
      icono: <ShoppingCart className="w-5 h-5" />,
      descripcion: 'Ventas y productos'
    },
    {
      id: 'streams',
      nombre: 'Streams',
      icono: <Video className="w-5 h-5" />,
      descripcion: 'Configuración de streams'
    },
    {
      id: 'diagnostico',
      nombre: 'Diagnóstico',
      icono: <Activity className="w-5 h-5" />,
      descripcion: 'Herramientas de depuración y diagnóstico'
    },
    {
      id: 'chat',
      nombre: 'Chat',
      icono: <MessageSquare className="w-5 h-5" />,
      descripcion: 'Configuración del chat público'
    },
    {
      id: 'programadores',
      nombre: 'Programadores',
      icono: <Code className="w-5 h-5" />,
      descripcion: 'Gestión de usuarios y roles'
    },
    {
      id: 'notificaciones',
      nombre: 'Notificaciones',
      icono: <Bell className="w-5 h-5" />,
      descripcion: 'Gestión de notificaciones'
    },
    {
      id: 'analytics',
      nombre: 'Analytics',
      icono: <PieChart className="w-5 h-5" />,
      descripcion: 'Análisis de datos y métricas'
    },
    {
      id: 'testimonios',
      nombre: 'Testimonios',
      icono: <MessageSquare className="w-5 h-5" />,
      descripcion: 'Gestión de reseñas y testimonios'
    }
  ];

  const moduloSeleccionado = modulos.find(m => m.id === moduloActivo);
  const adelantosPendientes = obtenerAdelantosPendientes().length;

  // Estadísticas del sistema
  const globalStats = {
    totalModelos: modelos.length + modelosArchivadas.length,
    modelosActivas: modelos.filter(m => m.activa).length,
    serviciosHoy,
    serviciosMes,
    ingresosHoy,
    ingresosMes,
    productosVendidos: inventario.reduce((t: number, p: any) => t + (p.vendidos ?? 0), 0),
    ventasBoutique: inventario.reduce((t: number, p: any) => t + ((p.vendidos ?? 0) * (p.precioRegular ?? 0)), 0),
  };

  const recentActivity = serviciosFinalizados
    .slice()
    .sort((a, b) => new Date(b.fechaCreacion || b.fecha).getTime() - new Date(a.fechaCreacion || a.fecha).getTime())
    .slice(0, 10)
    .map(s => ({
      id: s.id,
      descripcion: `Servicio — ${s.modeloNombre} con ${s.clienteNombre}`,
      tiempo: new Date(s.fechaCreacion || s.fecha).toLocaleString('es-CO'),
      tipo: s.estado,
    }));

  const financialSummary = [
    { periodo: 'Hoy', ingresos: ingresosHoy, egresos: gastosHoy, neto: ingresosHoy - gastosHoy },
    { periodo: 'Este mes', ingresos: ingresosMes, egresos: gastosMes, neto: ingresosMes - gastosMes },
  ];

  // Ocupación real: servicios de hoy vs habitaciones disponibles (asumimos 5)
  const TOTAL_HABITACIONES = 5;
  const ocupacionPct = TOTAL_HABITACIONES > 0 ? Math.min(100, Math.round((serviciosHoy / TOTAL_HABITACIONES) * 100)) : 0;

  return (
    <div className="min-h-screen w-full bg-background" style={{ fontFamily: 'Montserrat, sans-serif' }}>
      {/* Header Premium Fijo */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-card/98 backdrop-blur-premium border-b border-primary/15 shadow-premium">
        <div className="flex items-center justify-between px-3 sm:px-6 py-3 max-w-7xl mx-auto">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <LogoIsotipo size="sm" />
            <div>
              <h1 className="text-base sm:text-lg font-bold text-primary uppercase tracking-wide truncate" style={{ fontFamily: 'Playfair Display, serif' }}>
                ADMIN DASHBOARD
              </h1>
              <p className="text-xs text-muted-foreground hidden sm:block truncate max-w-[200px]">{userEmail}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onLogout && (
              <Button 
                onClick={onLogout}
                variant="ghost" 
                size="sm"
                className="hidden sm:flex border-primary/20 hover:bg-primary/10 text-red-400 hover:text-red-500"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Salir
              </Button>
            )}
            
            <Button
              onClick={() => setMenuOpen(!menuOpen)}
              variant="outline"
              size="sm"
              className="border-primary/30 hover:bg-primary/10 h-9 w-9 p-0"
            >
              {menuOpen ? <X className="w-4 h-4 text-primary" /> : <Menu className="w-4 h-4 text-primary" />}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation / Dropdown */}
        {menuOpen && (
          <div className="bg-card/95 backdrop-blur-md border-t border-primary/10 shadow-lg lg:hidden">
            <nav className="flex flex-col px-4 py-3 space-y-2 max-w-7xl mx-auto">
              {modulos.slice(0, 8).map((modulo) => (
                <Button 
                  key={modulo.id}
                  onClick={() => {
                    setModuloActivo(modulo.id);
                    setMenuOpen(false);
                  }}
                  variant={moduloActivo === modulo.id ? 'default' : 'ghost'}
                  className="justify-start h-10 text-sm"
                >
                  <span className="mr-3">{modulo.icono}</span>
                  {modulo.nombre}
                </Button>
              ))}
              {onLogout && (
                <>
                  <div className="h-px bg-border my-2" />
                  <Button 
                    onClick={onLogout} 
                    variant="ghost" 
                    className="justify-start h-10 text-sm text-red-400 hover:text-red-500"
                  >
                    <LogOut className="w-4 h-4 mr-3" />
                    Cerrar Sesión
                  </Button>
                </>
              )}
            </nav>
          </div>
        )}
      </header>

      <main className="pt-24 pb-12 px-4 max-w-7xl mx-auto space-y-6">

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-primary/30 bg-gradient-to-br from-primary/10 to-transparent">
          <CardHeader className="pb-3">
            <CardDescription className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Modelos Activas
            </CardDescription>
            <CardTitle className="text-4xl text-primary">
              {globalStats.modelosActivas}/{globalStats.totalModelos}
            </CardTitle>
          </CardHeader>
        </Card>

        <Card className="border-primary/30 bg-gradient-to-br from-primary/10 to-transparent">
          <CardHeader className="pb-3">
            <CardDescription className="flex items-center gap-2">
              <Activity className="w-4 h-4" />
              Servicios Hoy
            </CardDescription>
            <CardTitle className="text-4xl text-primary">{globalStats.serviciosHoy}</CardTitle>
          </CardHeader>
        </Card>

        <Card className="border-primary/30 bg-gradient-to-br from-primary/10 to-transparent">
          <CardHeader className="pb-3">
            <CardDescription className="flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              Ingresos Hoy
            </CardDescription>
            <CardTitle className="text-3xl text-primary">
              ${(globalStats.ingresosHoy / 1000000).toFixed(1)}M
            </CardTitle>
          </CardHeader>
        </Card>

        <Card className="border-primary/30 bg-gradient-to-br from-primary/10 to-transparent">
          <CardHeader className="pb-3">
            <CardDescription className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Ingresos Mes
            </CardDescription>
            <CardTitle className="text-3xl text-primary">
              ${(globalStats.ingresosMes / 1000000).toFixed(1)}M
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Panel de Asistencia */}
      <Suspense fallback={<div className="p-8 text-center text-muted-foreground">Cargando Asistencia...</div>}>
        <AsistenciaPanel userRole="admin" />
      </Suspense>

      {/* Selector de Módulo - Menú Desplegable */}
      <Card className="border-primary/30 bg-gradient-to-br from-card to-card/50">
        <CardContent className="p-4">
          <div className="relative">
            <label className="block text-sm font-medium text-muted-foreground mb-2">
              Módulo Activo
            </label>
            <div className="relative">
              <select
                value={moduloActivo}
                onChange={(e) => setModuloActivo(e.target.value as ModuloType)}
                className="w-full appearance-none px-4 py-3 pr-10 bg-secondary border-2 border-border rounded-lg text-foreground font-medium focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all cursor-pointer hover:border-primary/50"
                style={{ fontFamily: 'Poppins, sans-serif' }}
              >
                {modulos.map((modulo) => (
                  <option key={modulo.id} value={modulo.id}>
                    {modulo.nombre}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-primary pointer-events-none" />
            </div>
            {moduloSeleccionado && (
              <div className="mt-3 flex items-start gap-3 p-3 bg-primary/5 border border-primary/20 rounded-lg">
                <div className="text-primary mt-0.5">
                  {moduloSeleccionado.icono}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">
                    {moduloSeleccionado.nombre}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {moduloSeleccionado.descripcion}
                  </p>
                </div>
                {moduloActivo === 'pagos' && adelantosPendientes > 0 && (
                  <Badge className="bg-yellow-500 text-black text-xs px-2 py-0.5 flex-shrink-0">
                    {adelantosPendientes} pendientes
                  </Badge>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Contenido del Módulo */}
      <Suspense fallback={
        <Card className="w-full h-96 flex items-center justify-center bg-card/50 border-dashed border-2 border-primary/20">
          <div className="text-center space-y-4">
            <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto" />
            <p className="text-primary font-medium">Preparando panel {moduloSeleccionado?.nombre}...</p>
          </div>
        </Card>
      }>
      <div className="space-y-4">
        {moduloActivo === 'general' && (
          <AdminResumenPanel 
            recentActivity={recentActivity}
            financialSummary={financialSummary}
          />
        )}

        {moduloActivo === 'testimonios' && (
          <GestionTestimoniosPanel />
        )}

        {moduloActivo === 'modelos' && (
          <Tabs defaultValue="perfiles" className="w-full">
            <TabsList className="grid w-full grid-cols-3 bg-secondary">
              <TabsTrigger value="perfiles">
                <Users className="w-4 h-4 mr-2" />
                Perfiles
              </TabsTrigger>
              <TabsTrigger value="rendimiento">
                <BarChart3 className="w-4 h-4 mr-2" />
                Rendimiento
              </TabsTrigger>
              <TabsTrigger value="archivadas" className="relative">
                <Archive className="w-4 h-4 mr-2" />
                Archivo
                {modelosArchivadas.length > 0 && (
                  <Badge className="ml-2 bg-yellow-500 text-black text-xs px-1.5 py-0.5">
                    {modelosArchivadas.length}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="perfiles" className="space-y-4 mt-4">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Perfiles de Modelos</CardTitle>
                      <CardDescription>Vista completa de información de las modelos</CardDescription>
                    </div>
                    <Button 
                      onClick={() => setMostrarCrearModelo(true)} 
                      className="bg-primary hover:bg-primary/90 gap-2"
                    >
                      <UserPlus className="w-4 h-4" />
                      Crear Nueva Modelo
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {modelos.filter(m => !m.fechaArchivado).map((modelo) => (
                      <div 
                        key={modelo.id}
                        className="bg-secondary rounded-lg overflow-hidden border border-border/50 hover:border-primary/30 transition-all"
                      >
                        <div className="aspect-square overflow-hidden">
                          <img 
                            src={modelo.fotoPerfil} 
                            alt={modelo.nombre}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="p-4 space-y-3">
                          <div>
                            <h3 className="font-medium text-lg">{modelo.nombreArtistico || modelo.nombre}</h3>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant="outline" className="text-xs">
                                {modelo.edad} años
                              </Badge>
                              <Badge 
                                className={modelo.activa ? 'bg-green-500/20 text-green-400 border-green-500/30' : 'bg-gray-500/20 text-gray-400 border-gray-500/30'}
                              >
                                {modelo.activa ? 'Activa' : 'Inactiva'}
                              </Badge>
                            </div>
                          </div>
                          
                          <div className="space-y-1 text-sm">
                            <p className="text-muted-foreground">
                              <span className="font-medium">Email:</span> {modelo.email}
                            </p>
                            <p className="text-muted-foreground">
                              <span className="font-medium">Teléfono:</span> {modelo.telefono}
                            </p>
                            <p className="text-muted-foreground">
                              <span className="font-medium">Cédula:</span> {modelo.cedula}
                            </p>
                          </div>

                          <div className="flex items-center justify-between pt-2 border-t border-border/50">
                            <div>
                              <p className="text-xs text-muted-foreground">Servicios</p>
                              <p className="text-lg font-bold text-primary">{modelo.servicios}</p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">Ingresos</p>
                              <p className="text-lg font-bold text-primary">${(modelo.ingresos / 1000000).toFixed(1)}M</p>
                            </div>
                          </div>

                          <Button 
                            size="sm" 
                            variant="default"
                            className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
                            onClick={() => setModeloDetalle(modelo)}
                          >
                            <Eye className="w-4 h-4 mr-2" />
                            Ver Detalles
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                  {modelos.filter(m => !m.fechaArchivado).length === 0 && (
                    <div className="text-center py-12">
                      <Users className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                      <p className="text-muted-foreground">No hay modelos activas</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="rendimiento" className="space-y-4 mt-4">
              <RendimientoModelosPanel />
            </TabsContent>

            <TabsContent value="archivadas" className="space-y-4 mt-4">
              <ModelosArchivadasPanel />
            </TabsContent>
          </Tabs>
        )}

        {moduloActivo === 'clientes' && (
          <GestionClientesAdmin />
        )}

        {moduloActivo === 'pagos' && (
          <Tabs defaultValue="liquidacion" className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-secondary">
              <TabsTrigger value="liquidacion">
                <Receipt className="w-4 h-4 mr-2" />
                Liquidación
              </TabsTrigger>
              <TabsTrigger value="adelantos" className="relative">
                <CreditCard className="w-4 h-4 mr-2" />
                Adelantos
                {adelantosPendientes > 0 && (
                  <Badge className="ml-2 bg-yellow-500 text-black text-xs px-1.5 py-0.5">
                    {adelantosPendientes}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="liquidacion" className="space-y-4 mt-4">
              <LiquidacionPanel userEmail={userEmail} />
            </TabsContent>

            <TabsContent value="adelantos" className="space-y-4 mt-4">
              <GestionAdelantosPanel userEmail={userEmail} />
            </TabsContent>
          </Tabs>
        )}

        {moduloActivo === 'habitaciones' && (
          <HabitacionesPanel />
        )}

        {moduloActivo === 'finanzas' && (
          <Tabs defaultValue="analisis">
            <TabsList className="mb-6">
              <TabsTrigger value="analisis">Análisis Financiero</TabsTrigger>
              <TabsTrigger value="gastos">Gastos Operativos</TabsTrigger>
            </TabsList>
            <TabsContent value="analisis">
              <FinanzasPanel serviciosFinalizados={serviciosFinalizados} />
            </TabsContent>
            <TabsContent value="gastos">
              <GastosOperativosPanel userEmail={userId} />
            </TabsContent>
          </Tabs>
        )}

        {moduloActivo === 'operaciones' && (
          <Tabs defaultValue="solicitudes">
            <TabsList className="mb-6">
              <TabsTrigger value="solicitudes">Solicitudes & Estadísticas</TabsTrigger>
              <TabsTrigger value="servicios-publicos">Servicios Públicos</TabsTrigger>
            </TabsList>

            <TabsContent value="solicitudes">
              <div className="space-y-4">
                {/* Panel de Solicitudes de Entrada */}
                <SolicitudesEntradaPanel userEmail={userId} />

                {/* Estadísticas de Operaciones */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Servicios del Día</CardTitle>
                      <CardDescription>Agendamientos activos</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="text-center py-8">
                        <Calendar className="w-16 h-16 mx-auto text-primary mb-4" />
                        <p className="text-3xl font-bold text-primary">{globalStats.serviciosHoy}</p>
                        <p className="text-sm text-muted-foreground mt-2">
                          Servicios programados hoy
                        </p>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Ocupación</CardTitle>
                      <CardDescription>Promedio del mes</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="text-center py-8">
                        <Activity className="w-16 h-16 mx-auto text-primary mb-4" />
                        <p className="text-3xl font-bold text-primary">{ocupacionPct}%</p>
                        <p className="text-sm text-muted-foreground mt-2">
                          Tasa de ocupación hoy
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="servicios-publicos">
              <ServiciosPublicosPanel />
            </TabsContent>
          </Tabs>
        )}

        {moduloActivo === 'agendamientos' && (
          <div className="space-y-4">
            <AgendamientosMetrics rol="admin" />
            <AgendamientosPanel rol="admin" userEmail={userEmail} />
          </div>
        )}

        {moduloActivo === 'boutique' && <BoutiquePanel />}

        {moduloActivo === 'streams' && (
          <StreamConfigPanel accessToken={accessToken} />
        )}

        {moduloActivo === 'diagnostico' && (
          <DiagnosticoPanel />
        )}

        {moduloActivo === 'chat' && (
          <Tabs defaultValue="configuracion">
            <TabsList className="mb-6">
              <TabsTrigger value="configuracion">Configuración del Chat</TabsTrigger>
              <TabsTrigger value="moderador">Chat Moderador</TabsTrigger>
            </TabsList>
            <TabsContent value="configuracion">
              <ConfiguracionChatPanel />
            </TabsContent>
            <TabsContent value="moderador">
              <ChatModeratorPanel />
            </TabsContent>
          </Tabs>
        )}

        {moduloActivo === 'programadores' && (
          <GestionUsuariosPanel userRole="admin" />
        )}

        {moduloActivo === 'notificaciones' && (
          <NotificacionesPanel />
        )}

        {moduloActivo === 'analytics' && (
          <AnalyticsPanel />
        )}
      </div>
      </Suspense>

      {/* Modal de Detalle de Modelo */}
      {modeloDetalle && (
        <Suspense fallback={null}>
          <DetalleModeloPanel 
            modelo={modeloDetalle} 
            onClose={() => setModeloDetalle(null)} 
            onEdit={() => {
              setModeloEditar(modeloDetalle);
              setModeloDetalle(null);
            }}
          />
        </Suspense>
      )}

      {/* Modal de Editar Modelo */}
      <Suspense fallback={null}>
        <EditarModeloModal 
          open={!!modeloEditar}
          onClose={() => setModeloEditar(null)}
          modelo={modeloEditar}
        />
      </Suspense>

      {/* Modal de Crear Modelo */}
      <Suspense fallback={null}>
        <CrearModeloModal open={mostrarCrearModelo} onClose={() => setMostrarCrearModelo(false)} />
      </Suspense>

      </main>
    </div>
  );
}
