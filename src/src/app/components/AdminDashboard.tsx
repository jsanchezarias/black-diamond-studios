import { useState } from 'react';
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
  Package,
  Edit,
  Trash2,
  MessageSquare,
  Code, // Agregado para el icono de programadores
  Bell,
  PieChart // 📊 Icono para Analytics
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../../components/ui/card';
import { Badge } from '../../../components/ui/badge';
import { Button } from '../../../components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../components/ui/tabs';
import { useModelos, Modelo } from './ModelosContext';
import { useServicios } from './ServiciosContext';
import { usePagos } from './PagosContext';
import { useInventory } from './InventoryContext';
import { toast } from 'sonner@2.0.3';
import { AsistenciaPanel } from './AsistenciaPanel';
import { RendimientoModelosPanel } from '../../../components/RendimientoModelosPanel';
import { ModelosArchivadasPanel } from '../../../components/ModelosArchivadasPanel';
import { HistorialClientesPanel } from '../../../components/HistorialClientesPanel';
import { LiquidacionPanel } from '../../../components/LiquidacionPanel';
import { GestionAdelantosPanel } from '../../../components/GestionAdelantosPanel';
import { HabitacionesPanel } from '../../../components/HabitacionesPanel';
import { FinanzasPanel } from '../../../components/FinanzasPanel';
import { StreamConfigPanel } from '../../../components/StreamConfigPanel';
import { DetalleModeloPanel } from '../../../components/DetalleModeloPanel';
import { EditarModeloModal } from './EditarModeloModal';
import { CrearModeloModal } from '../../../components/CrearModeloModal';
import { GestionBoutiqueModal } from '../../../components/GestionBoutiqueModal';
import { SolicitudesEntradaPanel } from '../../../components/SolicitudesEntradaPanel';
import { MigrarModelosRealesPanel } from '../../../components/MigrarModelosRealesPanel';
import { DiagnosticoPanel } from '../../../components/admin/DiagnosticoPanel';
import { ConfiguracionChatPanel } from '../../../components/ConfiguracionChatPanel';
import { GestionUsuariosPanel } from '../../../components/GestionUsuariosPanel'; // Agregado
import { GestionClientesAdmin } from './GestionClientesAdmin'; // 🆕 Gestión de clientes con multas
import { NotificacionesPanel } from './NotificacionesPanel';
import { AnalyticsPanel } from './AnalyticsPanel'; // 📊 Sistema de Analytics

type ModuloType = 'general' | 'modelos' | 'clientes' | 'pagos' | 'habitaciones' | 'finanzas' | 'operaciones' | 'boutique' | 'streams' | 'diagnostico' | 'chat' | 'programadores' | 'notificaciones' | 'analytics'; // Agregado 'analytics'

interface Modulo {
  id: ModuloType;
  nombre: string;
  icono: React.ReactNode;
  descripcion: string;
}

interface AdminDashboardProps {
  accessToken: string;
  userId: string;
  onLogout?: () => void;
}

export function AdminDashboard({ accessToken, userId, onLogout }: AdminDashboardProps) {
  const [moduloActivo, setModuloActivo] = useState<ModuloType>('general');
  const [modeloDetalle, setModeloDetalle] = useState<Modelo | null>(null);
  const [modeloEditar, setModeloEditar] = useState<Modelo | null>(null);
  const [mostrarCrearModelo, setMostrarCrearModelo] = useState(false);
  const [mostrarGestionBoutique, setMostrarGestionBoutique] = useState(false);
  const [productoEditar, setProductoEditar] = useState<any>(null);
  const [modoGestionBoutique, setModoGestionBoutique] = useState<'crear' | 'editar'>('crear');
  
  // ✅ MANEJO DEFENSIVO DE CONTEXTOS
  try {
    var pagosCtx = usePagos();
    var modelosCtx = useModelos();
    var serviciosCtx = useServicios();
    var inventoryCtx = useInventory();
  } catch (error) {
    console.error('❌ ERROR AL CARGAR CONTEXTOS EN ADMIN DASHBOARD:', error);
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
  const { serviciosFinalizados = [], serviciosHoy = [], serviciosMes = [], ingresosHoy = 0, ingresosMes = 0, productosVendidos = 0, ventasBoutique = 0 } = serviciosCtx;
  const { inventario = [], eliminarProducto } = inventoryCtx;

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
    }
  ];

  const moduloSeleccionado = modulos.find(m => m.id === moduloActivo);
  const adelantosPendientes = obtenerAdelantosPendientes().length;

  // Estadísticas del sistema
  const globalStats = {
    totalModelos: modelos.length + modelosArchivadas.length,
    modelosActivas: modelos.filter(m => m.activa).length,
    serviciosHoy: serviciosHoy,
    serviciosMes: serviciosMes,
    ingresosHoy: ingresosHoy,
    ingresosMes: ingresosMes,
    productosVendidos: productosVendidos,
    ventasBoutique: ventasBoutique,
  };

  const recentActivity: any[] = [];
  const financialSummary: any[] = [];

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      {/* Header con botón de logout */}
      {onLogout && (
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Admin Dashboard</h1>
            <p className="text-muted-foreground text-sm mt-1">Panel de administración</p>
          </div>
          <Button 
            variant="outline" 
            onClick={onLogout}
            className="border-destructive/50 text-destructive hover:bg-destructive/10"
          >
            <DoorOpen className="w-4 h-4 mr-2" />
            Cerrar Sesión
          </Button>
        </div>
      )}

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
      <AsistenciaPanel userRole="admin" />

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
      <div className="space-y-4">
        {moduloActivo === 'general' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Actividad Reciente</CardTitle>
                <CardDescription>Últimos eventos del sistema</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {recentActivity.map((activity) => (
                    <div 
                      key={activity.id}
                      className="flex items-start gap-3 p-3 bg-secondary rounded-lg border border-border/50"
                    >
                      <div className="w-2 h-2 rounded-full bg-primary mt-2"></div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">{activity.descripcion}</p>
                        <p className="text-xs text-muted-foreground mt-1">{activity.tiempo}</p>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {activity.tipo}
                      </Badge>
                    </div>
                  ))}
                  {recentActivity.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      <Activity className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      <p className="text-sm">No hay actividad reciente</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Resumen Financiero</CardTitle>
                <CardDescription>Ingresos y egresos por período</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {financialSummary.map((item, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-sm">{item.periodo}</span>
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-sm">
                        <div className="bg-secondary p-3 rounded-lg text-center">
                          <p className="text-xs text-muted-foreground mb-1">Ingresos</p>
                          <p className="font-bold text-green-500">
                            ${(item.ingresos / 1000000).toFixed(1)}M
                          </p>
                        </div>
                        <div className="bg-secondary p-3 rounded-lg text-center">
                          <p className="text-xs text-muted-foreground mb-1">Egresos</p>
                          <p className="font-bold text-destructive">
                            ${(item.egresos / 1000000).toFixed(1)}M
                          </p>
                        </div>
                        <div className="bg-secondary p-3 rounded-lg text-center">
                          <p className="text-xs text-muted-foreground mb-1">Neto</p>
                          <p className="font-bold text-primary">
                            ${(item.neto / 1000000).toFixed(1)}M
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                  {financialSummary.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      <DollarSign className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      <p className="text-sm">No hay datos financieros disponibles</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
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
              <LiquidacionPanel userEmail="admin@app.com" />
            </TabsContent>

            <TabsContent value="adelantos" className="space-y-4 mt-4">
              <GestionAdelantosPanel userEmail="admin@app.com" />
            </TabsContent>
          </Tabs>
        )}

        {moduloActivo === 'habitaciones' && (
          <HabitacionesPanel />
        )}

        {moduloActivo === 'finanzas' && (
          <FinanzasPanel serviciosFinalizados={serviciosFinalizados} />
        )}

        {moduloActivo === 'operaciones' && (
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
                    <p className="text-3xl font-bold text-primary">78%</p>
                    <p className="text-sm text-muted-foreground mt-2">
                      Tasa de ocupación promedio
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {moduloActivo === 'boutique' && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <ShoppingCart className="w-5 h-5" />
                    Inventario de Boutique
                  </CardTitle>
                  <CardDescription>Gestión completa de productos con precios duales</CardDescription>
                </div>
                <Button 
                  onClick={() => {
                    setModoGestionBoutique('crear');
                    setProductoEditar(null);
                    setMostrarGestionBoutique(true);
                  }}
                  className="bg-primary hover:bg-primary/90"
                >
                  <Package className="w-4 h-4 mr-2" />
                  Agregar Producto
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {/* Estadísticas resumidas */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="p-4 bg-secondary rounded-lg">
                  <p className="text-sm text-muted-foreground mb-1">Productos Totales</p>
                  <p className="text-2xl font-bold text-primary">{inventario.length}</p>
                </div>
                <div className="p-4 bg-secondary rounded-lg">
                  <p className="text-sm text-muted-foreground mb-1">Productos Vendidos</p>
                  <p className="text-2xl font-bold text-green-500">{globalStats.productosVendidos}</p>
                </div>
                <div className="p-4 bg-secondary rounded-lg">
                  <p className="text-sm text-muted-foreground mb-1">Ingresos Totales</p>
                  <p className="text-2xl font-bold text-blue-500">${(globalStats.ventasBoutique / 1000).toFixed(1)}K</p>
                </div>
              </div>

              {/* Grid de productos */}
              {inventario.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {inventario.map((producto) => (
                    <div 
                      key={producto.id}
                      className="bg-secondary rounded-lg overflow-hidden border border-border/50 hover:border-primary/30 transition-all group"
                    >
                      {/* Imagen del producto */}
                      <div className="aspect-square bg-white/5 flex items-center justify-center overflow-hidden relative">
                        {producto.imagen ? (
                          <img 
                            src={producto.imagen} 
                            alt={producto.nombre}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <Package className="w-16 h-16 text-muted-foreground opacity-50" />
                        )}
                        
                        {/* Badge de stock bajo */}
                        {producto.stock <= 5 && (
                          <div className="absolute top-2 right-2">
                            <Badge variant="destructive" className="text-xs">
                              Stock bajo
                            </Badge>
                          </div>
                        )}
                      </div>

                      {/* Información del producto */}
                      <div className="p-4 space-y-3">
                        <div>
                          <h3 className="font-medium text-white truncate">{producto.nombre}</h3>
                          <Badge variant="outline" className="text-xs mt-1">
                            {producto.categoria}
                          </Badge>
                        </div>

                        {/* Precios */}
                        <div className="space-y-2">
                          <div className="flex items-center justify-between p-2 bg-white/5 rounded">
                            <span className="text-xs text-muted-foreground">Regular:</span>
                            <span className="font-bold text-green-400">${producto.precioRegular.toLocaleString()}</span>
                          </div>
                          <div className="flex items-center justify-between p-2 bg-primary/10 rounded">
                            <span className="text-xs text-muted-foreground">Servicio:</span>
                            <span className="font-bold text-primary">${producto.precioServicio.toLocaleString()}</span>
                          </div>
                        </div>

                        {/* Stock */}
                        <div className="flex items-center justify-between p-2 bg-white/5 rounded">
                          <span className="text-xs text-muted-foreground">Stock:</span>
                          <span className={`font-bold ${producto.stock <= 5 ? 'text-red-400' : 'text-white'}`}>
                            {producto.stock} unidades
                          </span>
                        </div>

                        {/* Descripción */}
                        {producto.descripcion && (
                          <p className="text-xs text-muted-foreground line-clamp-2">
                            {producto.descripcion}
                          </p>
                        )}

                        {/* Botones de acción */}
                        <div className="flex gap-2 pt-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="flex-1"
                            onClick={() => {
                              setModoGestionBoutique('editar');
                              setProductoEditar(producto);
                              setMostrarGestionBoutique(true);
                            }}
                          >
                            <Edit className="w-4 h-4 mr-1" />
                            Editar
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => {
                              if (confirm(`¿Eliminar "${producto.nombre}"?`)) {
                                eliminarProducto(producto.id);
                                toast.success('Producto eliminado');
                              }
                            }}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Package className="w-16 h-16 mx-auto text-muted-foreground mb-4 opacity-50" />
                  <h3 className="text-lg font-medium text-white mb-2">No hay productos</h3>
                  <p className="text-muted-foreground mb-6">
                    Comienza agregando productos a tu boutique
                  </p>
                  <Button 
                    onClick={() => {
                      setModoGestionBoutique('crear');
                      setProductoEditar(null);
                      setMostrarGestionBoutique(true);
                    }}
                  >
                    <Package className="w-4 h-4 mr-2" />
                    Agregar Primer Producto
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {moduloActivo === 'streams' && (
          <StreamConfigPanel accessToken={accessToken} />
        )}

        {moduloActivo === 'diagnostico' && (
          <DiagnosticoPanel />
        )}

        {moduloActivo === 'chat' && (
          <ConfiguracionChatPanel />
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

      {/* Modal de Detalle de Modelo */}
      {modeloDetalle && (
        <DetalleModeloPanel 
          modelo={modeloDetalle} 
          onClose={() => setModeloDetalle(null)} 
          onEdit={() => {
            setModeloEditar(modeloDetalle);
            setModeloDetalle(null);
          }}
        />
      )}

      {/* Modal de Editar Modelo */}
      <EditarModeloModal 
        open={!!modeloEditar}
        onClose={() => setModeloEditar(null)}
        modelo={modeloEditar}
      />

      {/* Modal de Crear Modelo */}
      <CrearModeloModal open={mostrarCrearModelo} onClose={() => setMostrarCrearModelo(false)} />

      {/* Modal de Gestion Boutique */}
      <GestionBoutiqueModal 
        open={mostrarGestionBoutique}
        onClose={() => {
          setMostrarGestionBoutique(false);
          setProductoEditar(null);
        }}
        modo={modoGestionBoutique}
        producto={productoEditar}
      />
    </div>
  );
}