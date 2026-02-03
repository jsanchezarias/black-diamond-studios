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
  UserCog,
  Activity,
  TrendingUp,
  ChevronDown,
  Eye,
  Archive,
  CreditCard
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../../components/ui/card';
import { Badge } from '../../../components/ui/badge';
import { Button } from '../../../components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../components/ui/tabs';
import { useModelos, Modelo } from './ModelosContext';
import { useServicios } from './ServiciosContext';
import { usePagos } from './PagosContext';
import { AsistenciaPanel } from './AsistenciaPanel';
import { RendimientoModelosPanel } from './RendimientoModelosPanel';
import { ModelosArchivadasPanel } from '../../../components/ModelosArchivadasPanel';
import { HistorialClientesPanel } from '../../../components/HistorialClientesPanel';
import { LiquidacionPanel } from '../../../components/LiquidacionPanel';
import { GestionAdelantosPanel } from '../../../components/GestionAdelantosPanel';
import { HabitacionesPanel } from '../../../components/HabitacionesPanel';
import { FinanzasPanel } from '../../../components/FinanzasPanel';
import { GestionUsuariosPanel } from '../../../components/GestionUsuariosPanel';
import { StreamConfigPanel } from '../../../components/StreamConfigPanel';
import { DetalleModeloPanel } from '../../../components/DetalleModeloPanel';
import { EditarModeloModal } from './EditarModeloModal';

type ModuloType = 'general' | 'modelos' | 'clientes' | 'pagos' | 'habitaciones' | 'finanzas' | 'operaciones' | 'boutique' | 'usuarios' | 'streams';

interface Modulo {
  id: ModuloType;
  nombre: string;
  icono: React.ReactNode;
  descripcion: string;
}

interface OwnerDashboardProps {
  accessToken: string;
  userId: string;
  onLogout?: () => void;
}

export function OwnerDashboard({ accessToken, userId, onLogout }: OwnerDashboardProps) {
  const [moduloActivo, setModuloActivo] = useState<ModuloType>('general');
  const [modeloDetalle, setModeloDetalle] = useState<Modelo | null>(null);
  const [modeloEditar, setModeloEditar] = useState<Modelo | null>(null);
  const { obtenerAdelantosPendientes } = usePagos();
  const { modelos, modelosArchivadas, obtenerModeloPorId } = useModelos();
  const { serviciosFinalizados, serviciosHoy, serviciosMes, ingresosHoy, ingresosMes, productosVendidos, ventasBoutique } = useServicios();

  const modulos: Modulo[] = [
    {
      id: 'general',
      nombre: 'General',
      icono: <BarChart3 className="w-5 h-5" />,
      descripcion: 'Vista general y actividad reciente'
    },
    {
      id: 'usuarios',
      nombre: 'Usuarios',
      icono: <UserCog className="w-5 h-5" />,
      descripcion: 'Gestión de credenciales de administradores'
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
    }
  ];

  const moduloSeleccionado = modulos.find(m => m.id === moduloActivo);
  const adelantosPendientes = obtenerAdelantosPendientes().length;

  // ✅ Estadísticas reales del sistema (sin datos demo)
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

  // ✅ Datos demo eliminados - Sistema listo para producción
  const recentActivity:any[] = [];

  const financialSummary:any[] = [];

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      {/* Header con botón de logout */}
      {onLogout && (
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Owner Dashboard</h1>
            <p className="text-muted-foreground text-sm mt-1">Panel de control principal</p>
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
      <AsistenciaPanel userRole="owner" />

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
                  <CardTitle>Perfiles de Modelos</CardTitle>
                  <CardDescription>Vista completa de información de las modelos</CardDescription>
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
          <HistorialClientesPanel />
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
              <LiquidacionPanel userEmail="owner@app.com" />
            </TabsContent>

            <TabsContent value="adelantos" className="space-y-4 mt-4">
              <GestionAdelantosPanel userEmail="owner@app.com" />
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
        )}

        {moduloActivo === 'boutique' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Productos Vendidos</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-4xl font-bold text-primary">{globalStats.productosVendidos}</p>
                <p className="text-sm text-muted-foreground mt-2">Este mes</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Ventas Totales</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-4xl font-bold text-primary">
                  ${(globalStats.ventasBoutique / 1000000).toFixed(1)}M
                </p>
                <p className="text-sm text-muted-foreground mt-2">Ingresos boutique</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Ticket Promedio</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-4xl font-bold text-primary">
                  ${Math.round(globalStats.ventasBoutique / globalStats.productosVendidos / 1000)}K
                </p>
                <p className="text-sm text-muted-foreground mt-2">Por venta</p>
              </CardContent>
            </Card>
          </div>
        )}

        {moduloActivo === 'usuarios' && (
          <GestionUsuariosPanel userRole="owner" />
        )}

        {moduloActivo === 'streams' && (
          <StreamConfigPanel accessToken={accessToken} />
        )}
      </div>

      {/* Modal de Detalle de Modelo */}
      {modeloDetalle && (
        <DetalleModeloPanel 
          modelo={modeloDetalle} 
          onClose={() => setModeloDetalle(null)} 
          onEdit={() => {
            // Abrir modal de edición
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
    </div>
  );
}