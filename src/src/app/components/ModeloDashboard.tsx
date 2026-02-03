import { useState } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { 
  User, 
  Calendar, 
  DollarSign, 
  CheckCircle, 
  Clock, 
  Star, 
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
  ChevronDown
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../components/ui/tabs';
import { Button } from '../../../components/ui/button';
import { Badge } from '../../../components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '../../../components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
import { useModelos } from './ModelosContext';
import { useServicios } from './ServiciosContext';
import { useMultas } from './MultasContext';
import { usePagos } from './PagosContext';
import { useAgendamientos } from './AgendamientosContext';
import { useAsistencia } from './AsistenciaContext';
import { useInventory } from './InventoryContext';
import { useCarrito } from './CarritoContext';
import { RegistroEntradaModal } from '../../../components/RegistroEntradaModal';
import { IniciarServicioModal } from '../../../components/IniciarServicioModal';
import { ServicioActivoCard } from '../../../components/ServicioActivoCard';
import { CarritoBoutiqueModal } from '../../../components/CarritoBoutiqueModal';
import { CheckoutBoutiqueModal } from '../../../components/CheckoutBoutiqueModal';
import { toast } from 'sonner@2.0.3';

interface ModeloDashboardProps {
  accessToken: string;
  userId: string;
  userEmail: string;
  onLogout: () => void;
}

export function ModeloDashboard({ accessToken, userId, userEmail, onLogout }: ModeloDashboardProps) {
  const [selectedTab, setSelectedTab] = useState('resumen');
  const [mostrarRegistroEntrada, setMostrarRegistroEntrada] = useState(false);
  const [mostrarIniciarServicio, setMostrarIniciarServicio] = useState(false);
  const [mostrarCarritoBoutique, setMostrarCarritoBoutique] = useState(false);
  const [mostrarCheckoutBoutique, setMostrarCheckoutBoutique] = useState(false);
  const { modelos } = useModelos();
  const { serviciosActivos, serviciosFinalizados, obtenerServicioActivo } = useServicios();
  const { multas, obtenerTotalMultasPendientes } = useMultas();
  const { obtenerAdelantosPendientes } = usePagos();
  const { obtenerAgendamientosPendientes } = useAgendamientos();
  const { registrarLlegada, registrarSalida, obtenerRegistroActual, obtenerSolicitudPorModelo } = useAsistencia();
  const { inventario } = useInventory();
  const { carrito, agregarAlCarrito, eliminarDelCarrito } = useCarrito();

  // Obtener el perfil de la modelo actual basado en el email del usuario autenticado
  const modeloActual = modelos.find(m => m.email.toLowerCase() === userEmail.toLowerCase()) || null;

  // Verificar estado de registro de entrada
  const registroActivo = modeloActual ? obtenerRegistroActual(modeloActual.email) : undefined;
  const solicitudEntrada = modeloActual ? obtenerSolicitudPorModelo(modeloActual.email) : undefined;
  const puedeIniciarServicio = true; // TEMPORAL: Permite iniciar servicio sin registro de entrada

  // Obtener servicio activo de la modelo
  const servicioActivo = modeloActual ? obtenerServicioActivo(modeloActual.email) : undefined;

  // Estadísticas - Filtrar servicios por modelo
  const serviciosActivosModelo = serviciosActivos.filter(s => s.modeloId === modeloActual?.id);
  
  // Obtener servicios de hoy
  const serviciosHoyModelo = serviciosFinalizados.filter(s => {
    const esHoy = s.horaFin && new Date(s.horaFin).toDateString() === new Date().toDateString();
    const esDeModelo = s.modeloId === modeloActual?.id;
    return esHoy && esDeModelo;
  });
  
  const serviciosFinalizadosModelo = serviciosFinalizados.filter(s => s.modeloId === modeloActual?.id);
  const multasModelo = multas.filter(m => m.modeloId === modeloActual?.id);
  const multasPendientes = obtenerTotalMultasPendientes(modeloActual?.id || 0);
  const adelantosPendientes = obtenerAdelantosPendientes(modeloActual?.id || 0);
  
  // Obtener citas próximas usando el email de la modelo
  const citasProximas = modeloActual ? obtenerAgendamientosPendientes(modeloActual.email) : [];
  
  // Obtener asistencia del día actual
  const asistenciaHoy = modeloActual ? obtenerRegistroActual(modeloActual.email) : undefined;

  const ingresosHoy = serviciosHoyModelo.reduce((sum, s) => sum + s.totalPagado, 0);
  const ingresosMes = serviciosFinalizadosModelo.reduce((sum, s) => sum + s.totalPagado, 0);

  if (!modeloActual) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">Perfil no encontrado</h1>
          <p className="text-gray-400 mb-6">No se pudo cargar tu perfil de modelo</p>
          <Button onClick={onLogout}>Cerrar Sesión</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black">
      {/* Header */}
      <header className="border-b border-white/10 bg-black/40 backdrop-blur-xl sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-pink-500 to-purple-500 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-xl">BD</span>
                </div>
                <div>
                  <h1 className="text-xl font-bold text-white">Black Diamond Studios</h1>
                  <p className="text-xs text-gray-400">Portal de Modelo</p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <Avatar className="w-10 h-10 border-2 border-primary">
                  <AvatarImage src={modeloActual.fotoPerfil} />
                  <AvatarFallback>{modeloActual.nombre.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="hidden md:block">
                  <p className="text-sm font-medium text-white">{modeloActual.nombreArtistico}</p>
                  <p className="text-xs text-gray-400">Modelo</p>
                </div>
              </div>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={onLogout}
                className="text-gray-400 hover:text-white"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Salir
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-6">
          {/* Navegación en Desktop - Tabs horizontales */}
          <TabsList className="bg-black/40 border border-white/10 hidden md:inline-flex">
            <TabsTrigger value="resumen" className="data-[state=active]:bg-primary">
              <Activity className="w-4 h-4 mr-2" />
              Resumen
            </TabsTrigger>
            <TabsTrigger value="servicios" className="data-[state=active]:bg-primary">
              <CheckCircle className="w-4 h-4 mr-2" />
              Servicios
            </TabsTrigger>
            <TabsTrigger value="ingresos" className="data-[state=active]:bg-primary">
              <DollarSign className="w-4 h-4 mr-2" />
              Ingresos
            </TabsTrigger>
            <TabsTrigger value="boutique" className="data-[state=active]:bg-primary">
              <ShoppingBag className="w-4 h-4 mr-2" />
              Boutique
            </TabsTrigger>
            <TabsTrigger value="calendario" className="data-[state=active]:bg-primary">
              <Calendar className="w-4 h-4 mr-2" />
              Calendario
            </TabsTrigger>
            <TabsTrigger value="perfil" className="data-[state=active]:bg-primary">
              <User className="w-4 h-4 mr-2" />
              Mi Perfil
            </TabsTrigger>
          </TabsList>

          {/* Navegación en Móvil - Select desplegable */}
          <div className="md:hidden">
            <Select value={selectedTab} onValueChange={setSelectedTab}>
              <SelectTrigger className="w-full bg-black/40 border-white/10 text-white">
                <div className="flex items-center gap-2">
                  {selectedTab === 'resumen' && <><Activity className="w-4 h-4" /> <span>Resumen</span></>}
                  {selectedTab === 'servicios' && <><CheckCircle className="w-4 h-4" /> <span>Servicios</span></>}
                  {selectedTab === 'ingresos' && <><DollarSign className="w-4 h-4" /> <span>Ingresos</span></>}
                  {selectedTab === 'boutique' && <><ShoppingBag className="w-4 h-4" /> <span>Boutique</span></>}
                  {selectedTab === 'calendario' && <><Calendar className="w-4 h-4" /> <span>Calendario</span></>}
                  {selectedTab === 'perfil' && <><User className="w-4 h-4" /> <span>Mi Perfil</span></>}
                </div>
              </SelectTrigger>
              <SelectContent className="bg-black/95 border-white/10">
                <SelectItem value="resumen" className="text-white hover:bg-white/10">
                  <div className="flex items-center gap-2">
                    <Activity className="w-4 h-4" />
                    <span>Resumen</span>
                  </div>
                </SelectItem>
                <SelectItem value="servicios" className="text-white hover:bg-white/10">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4" />
                    <span>Servicios</span>
                  </div>
                </SelectItem>
                <SelectItem value="ingresos" className="text-white hover:bg-white/10">
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4" />
                    <span>Ingresos</span>
                  </div>
                </SelectItem>
                <SelectItem value="boutique" className="text-white hover:bg-white/10">
                  <div className="flex items-center gap-2">
                    <ShoppingBag className="w-4 h-4" />
                    <span>Boutique</span>
                  </div>
                </SelectItem>
                <SelectItem value="calendario" className="text-white hover:bg-white/10">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    <span>Calendario</span>
                  </div>
                </SelectItem>
                <SelectItem value="perfil" className="text-white hover:bg-white/10">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4" />
                    <span>Mi Perfil</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Tab: Resumen */}
          <TabsContent value="resumen" className="space-y-6">
            {/* Botones de Acción Rápida */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Botón de Registro de Entrada */}
              {!registroActivo && !solicitudEntrada && (
                <Card className="bg-gradient-to-br from-yellow-500/10 to-yellow-600/10 border-yellow-500/30">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold text-lg text-white mb-1">Registrar Entrada</h3>
                        <p className="text-sm text-muted-foreground">Toma una selfie para iniciar tu turno</p>
                      </div>
                      <Button onClick={() => setMostrarRegistroEntrada(true)} size="lg">
                        <Camera className="w-4 h-4 mr-2" />
                        Registrar
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {solicitudEntrada && solicitudEntrada.estado === 'pendiente' && (
                <Card className="bg-gradient-to-br from-yellow-500/10 to-yellow-600/10 border-yellow-500/30">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold text-lg text-yellow-400 mb-1">Solicitud Pendiente</h3>
                        <p className="text-sm text-muted-foreground">Esperando aprobación del admin</p>
                      </div>
                      <Button onClick={() => setMostrarRegistroEntrada(true)} variant="outline" size="lg">
                        Ver Estado
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {registroActivo && (
                <Card className="bg-gradient-to-br from-green-500/10 to-green-600/10 border-green-500/30">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold text-lg text-green-400 mb-1">Turno Activo</h3>
                        <p className="text-sm text-muted-foreground">
                          Desde {new Date(registroActivo.horaLlegada).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                      <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                        En Turno
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Botón de Iniciar Servicio */}
              <Card className={`bg-gradient-to-br ${puedeIniciarServicio ? 'from-primary/10 to-primary/5 border-primary/30' : 'from-gray-500/10 to-gray-600/10 border-gray-500/30'}`}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-lg text-white mb-1">Iniciar Servicio</h3>
                      <p className="text-sm text-muted-foreground">
                        {puedeIniciarServicio ? 'Servicio agendado o walk-in' : 'Debes registrar entrada primero'}
                      </p>
                    </div>
                    <Button 
                      onClick={() => setMostrarIniciarServicio(true)} 
                      size="lg"
                      disabled={!puedeIniciarServicio}
                    >
                      <Play className="w-4 h-4 mr-2" />
                      Iniciar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Cards de estadísticas */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/10 border-blue-500/20">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-blue-400">Servicios Hoy</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-3xl font-bold text-white">{serviciosHoyModelo.length}</p>
                      <p className="text-xs text-gray-400 mt-1">Activos ahora</p>
                    </div>
                    <CheckCircle className="w-10 h-10 text-blue-500 opacity-50" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-green-500/10 to-green-600/10 border-green-500/20">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-green-400">Ingresos Hoy</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-3xl font-bold text-white">${ingresosHoy.toLocaleString()}</p>
                      <p className="text-xs text-gray-400 mt-1">Del mes: ${ingresosMes.toLocaleString()}</p>
                    </div>
                    <DollarSign className="w-10 h-10 text-green-500 opacity-50" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/10 border-purple-500/20">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-purple-400">Citas Próximas</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-3xl font-bold text-white">{citasProximas.length}</p>
                      <p className="text-xs text-gray-400 mt-1">Próximos 7 días</p>
                    </div>
                    <Calendar className="w-10 h-10 text-purple-500 opacity-50" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-orange-500/10 to-orange-600/10 border-orange-500/20">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-orange-400">Multas Pendientes</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-3xl font-bold text-white">${multasPendientes.toLocaleString()}</p>
                      <p className="text-xs text-gray-400 mt-1">{multasModelo.filter(m => m.estado === 'pendiente').length} multas</p>
                    </div>
                    <AlertCircle className="w-10 h-10 text-orange-500 opacity-50" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Asistencia */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-primary" />
                  Asistencia de Hoy
                </CardTitle>
              </CardHeader>
              <CardContent>
                {asistenciaHoy ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-secondary rounded-lg">
                      <div>
                        <p className="text-sm text-muted-foreground">Entrada</p>
                        <p className="text-lg font-bold text-white">
                          {asistenciaHoy.horaLlegada ? new Date(asistenciaHoy.horaLlegada).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' }) : 'No registrada'}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Salida</p>
                        <p className="text-lg font-bold text-white">
                          {asistenciaHoy.horaSalida ? new Date(asistenciaHoy.horaSalida).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' }) : 'Pendiente'}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Horas trabajadas</p>
                        <p className="text-lg font-bold text-white">
                          {asistenciaHoy.horasTrabajadas ? asistenciaHoy.horasTrabajadas.toFixed(1) : 0}h
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      {asistenciaHoy.estado === 'En Turno' && !asistenciaHoy.horaSalida && (
                        <Button 
                          onClick={() => registrarSalida(modeloActual.email)}
                          variant="outline"
                          className="flex-1"
                        >
                          <XCircle className="w-4 h-4 mr-2" />
                          Registrar Salida
                        </Button>
                      )}
                      {asistenciaHoy.estado === 'Finalizado' && (
                        <div className="text-center w-full p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                          <p className="text-sm text-green-400">✅ Turno finalizado</p>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Clock className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                    <p className="text-muted-foreground mb-4">No has registrado asistencia hoy</p>
                    <Button onClick={() => setMostrarRegistroEntrada(true)}>
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Registrar Entrada
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Servicios Activos */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="w-5 h-5 text-primary" />
                  Servicios Activos
                </CardTitle>
                <CardDescription>
                  Servicios en curso en este momento
                </CardDescription>
              </CardHeader>
              <CardContent>
                {servicioActivo ? (
                  <ServicioActivoCard 
                    servicio={servicioActivo}
                    onFinalizar={() => {
                      // Actualizar la vista después de finalizar
                      toast.success('Servicio finalizado correctamente');
                    }}
                  />
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <CheckCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>No tienes servicios activos en este momento</p>
                    {puedeIniciarServicio && (
                      <Button onClick={() => setMostrarIniciarServicio(true)} className="mt-4">
                        <Play className="w-4 h-4 mr-2" />
                        Iniciar Nuevo Servicio
                      </Button>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab: Servicios */}
          <TabsContent value="servicios" className="space-y-6">
            {/* Servicio Activo en el Tab de Servicios */}
            {servicioActivo && (
              <div>
                <h2 className="text-lg font-semibold mb-4">Servicio en Curso</h2>
                <ServicioActivoCard 
                  servicio={servicioActivo}
                  onFinalizar={() => {
                    toast.success('Servicio finalizado correctamente');
                  }}
                />
              </div>
            )}

            <Card>
              <CardHeader>
                <CardTitle>Historial de Servicios</CardTitle>
                <CardDescription>Todos tus servicios completados</CardDescription>
              </CardHeader>
              <CardContent>
                {serviciosFinalizadosModelo.length > 0 ? (
                  <div className="space-y-2">
                    {serviciosFinalizadosModelo.slice(0, 10).map((servicio) => (
                      <div key={servicio.id} className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg hover:bg-secondary transition-colors">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-medium text-white">{servicio.cliente}</p>
                            <Badge variant="outline" className="text-xs">
                              {servicio.habitacion}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {servicio.fecha} • {servicio.horaInicio} - {servicio.horaFin} • {servicio.duracion} min
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-white">${servicio.totalPagado}</p>
                          <p className="text-xs text-muted-foreground">{servicio.metodoPago}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <CheckCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>No tienes servicios completados aún</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab: Ingresos */}
          <TabsContent value="ingresos" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="w-5 h-5 text-green-500" />
                    Resumen de Ingresos
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-secondary rounded-lg">
                    <div>
                      <p className="text-sm text-muted-foreground">Ingresos Totales</p>
                      <p className="text-2xl font-bold text-white">${(modeloActual.ingresos || 0).toLocaleString()}</p>
                    </div>
                    <TrendingUp className="w-8 h-8 text-green-500" />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 bg-secondary rounded-lg">
                      <p className="text-xs text-muted-foreground">Hoy</p>
                      <p className="text-lg font-bold text-white">${ingresosHoy.toLocaleString()}</p>
                    </div>
                    <div className="p-3 bg-secondary rounded-lg">
                      <p className="text-xs text-muted-foreground">Este Mes</p>
                      <p className="text-lg font-bold text-white">${ingresosMes.toLocaleString()}</p>
                    </div>
                  </div>

                  <div className="p-3 bg-secondary rounded-lg">
                    <p className="text-xs text-muted-foreground mb-1">Comisión</p>
                    <p className="text-lg font-bold text-primary">{modeloActual.comision}%</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="w-5 h-5 text-orange-500" />
                    Adelantos y Multas
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-4 bg-orange-500/10 border border-orange-500/20 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm text-orange-400">Adelantos Pendientes</p>
                      <AlertCircle className="w-5 h-5 text-orange-500" />
                    </div>
                    <p className="text-2xl font-bold text-white">${adelantosPendientes.toLocaleString()}</p>
                  </div>

                  <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm text-red-400">Multas Pendientes</p>
                      <XCircle className="w-5 h-5 text-red-500" />
                    </div>
                    <p className="text-2xl font-bold text-white">${multasPendientes.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {multasModelo.filter(m => m.estado === 'pendiente').length} multas activas
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Lista de multas */}
            {multasModelo.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Detalle de Multas</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {multasModelo.map((multa) => (
                      <div key={multa.id} className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg">
                        <div className="flex-1">
                          <p className="font-medium text-white">{multa.motivo}</p>
                          <p className="text-xs text-muted-foreground">
                            {multa.fecha} • {multa.horaRegistro}
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge 
                            variant={multa.estado === 'pendiente' ? 'destructive' : 'default'}
                            className="capitalize"
                          >
                            {multa.estado}
                          </Badge>
                          <p className="font-bold text-white min-w-[80px] text-right">
                            ${multa.monto.toLocaleString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Tab: Boutique */}
          <TabsContent value="boutique" className="space-y-4">
            {/* Banner informativo */}
            <Card className="border-primary/30 bg-gradient-to-r from-primary/10 to-purple-500/10">
              <CardContent className="py-4">
                <div className="flex items-start gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                    servicioActivo ? 'bg-green-500/20' : 'bg-blue-500/20'
                  }`}>
                    <ShoppingBag className={`w-5 h-5 ${servicioActivo ? 'text-green-400' : 'text-blue-400'}`} />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-white mb-1">
                      {servicioActivo ? '🎉 Precio Especial Activo' : 'Boutique - Precio Regular'}
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      {servicioActivo 
                        ? 'Estás en servicio. Los productos se cobran al precio especial de servicio (precio más alto).'
                        : 'Compra productos al precio regular. Cuando inicies un servicio, los precios cambiarán automáticamente.'}
                    </p>
                  </div>
                  {servicioActivo && (
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-green-500/20 border border-green-500/30 rounded-full">
                      <CheckCircle className="w-4 h-4 text-green-400" />
                      <span className="text-xs font-medium text-green-400">EN SERVICIO</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Productos Disponibles</CardTitle>
                    <CardDescription>
                      {inventario.filter(item => item.stock > 0).length} productos en stock
                    </CardDescription>
                  </div>
                  {carrito.length > 0 && (
                    <Badge variant="default" className="text-base px-4 py-2">
                      <ShoppingCart className="w-4 h-4 mr-2" />
                      {carrito.length} en carrito
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {inventario.filter(item => item.stock > 0).length === 0 ? (
                  <div className="text-center py-12">
                    <ShoppingBag className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-xl font-semibold mb-2">No hay productos disponibles</h3>
                    <p className="text-muted-foreground">
                      Los productos están temporalmente agotados. Vuelve más tarde.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {inventario.filter(item => item.stock > 0).map((item) => (
                      <div 
                        key={item.id}
                        className="bg-secondary rounded-lg overflow-hidden border border-border/50 hover:border-primary/50 transition-all hover:shadow-lg group"
                      >
                        {/* Imagen del producto */}
                        <div className="aspect-square overflow-hidden relative">
                          <img 
                            src={item.imagen} 
                            alt={item.nombre}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                          />
                          {/* Badge de categoría sobre la imagen */}
                          <div className="absolute top-2 right-2">
                            <Badge variant="secondary" className="text-xs backdrop-blur-sm bg-black/60">
                              {item.categoria}
                            </Badge>
                          </div>
                          {/* Badge de stock bajo */}
                          {item.stock <= 5 && (
                            <div className="absolute top-2 left-2">
                              <Badge className="text-xs backdrop-blur-sm bg-yellow-500/90">
                                ¡Últimas {item.stock}!
                              </Badge>
                            </div>
                          )}
                        </div>

                        {/* Información del producto */}
                        <div className="p-4 space-y-3">
                          <div>
                            <h3 className="font-semibold text-base line-clamp-1">{item.nombre}</h3>
                            <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                              {item.descripcion}
                            </p>
                          </div>
                          
                          {/* Precios con comparación visual */}
                          <div className="space-y-2">
                            {servicioActivo ? (
                              <>
                                <div className="flex items-baseline gap-2">
                                  <p className="text-2xl text-green-400 font-bold">
                                    ${(item.precioServicio || 0).toLocaleString('es-CO')}
                                  </p>
                                  <p className="text-xs text-muted-foreground line-through">
                                    ${(item.precioRegular || 0).toLocaleString('es-CO')}
                                  </p>
                                </div>
                                <div className="flex items-center gap-1.5 text-xs text-green-400">
                                  <Sparkles className="w-3 h-3" />
                                  <span className="font-medium">Precio especial en servicio</span>
                                </div>
                              </>
                            ) : (
                              <>
                                <p className="text-2xl text-primary font-bold">
                                  ${(item.precioRegular || 0).toLocaleString('es-CO')}
                                </p>
                                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                  <Info className="w-3 h-3" />
                                  <span>En servicio: ${(item.precioServicio || 0).toLocaleString('es-CO')}</span>
                                </div>
                              </>
                            )}
                          </div>
                          
                          {/* Botón agregar */}
                          <Button 
                            size="sm" 
                            className="w-full bg-primary text-primary-foreground hover:bg-primary/90" 
                            onClick={() => {
                              agregarAlCarrito({
                                productoId: item.id,
                                nombre: item.nombre,
                                precio: servicioActivo ? (item.precioServicio || 0) : (item.precioRegular || 0),
                                imagen: item.imagen,
                                categoria: item.categoria,
                              });
                              toast.success(`${item.nombre} agregado al carrito`, {
                                description: `Precio: $${(servicioActivo ? (item.precioServicio || 0) : (item.precioRegular || 0)).toLocaleString('es-CO')}`
                              });
                            }}
                          >
                            <ShoppingCart className="w-4 h-4 mr-2" />
                            Agregar al Carrito
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab: Calendario */}
          <TabsContent value="calendario" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-primary" />
                  Citas Próximas
                </CardTitle>
                <CardDescription>Agendamientos confirmados</CardDescription>
              </CardHeader>
              <CardContent>
                {citasProximas.length > 0 ? (
                  <div className="space-y-3">
                    {citasProximas.map((cita) => (
                      <div key={cita.id} className="p-4 bg-secondary rounded-lg border border-primary/20">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <p className="font-medium text-white">{cita.clienteNombre}</p>
                            <p className="text-sm text-muted-foreground">{cita.clienteTelefono}</p>
                          </div>
                          <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                            {cita.estado}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {format(new Date(cita.fecha), "dd 'de' MMMM", { locale: es })}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            {cita.hora}
                          </span>
                        </div>
                        {cita.notas && (
                          <p className="text-sm text-muted-foreground mt-2 italic">
                            "{cita.notas}"
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Calendar className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>No tienes citas próximas</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab: Mi Perfil */}
          <TabsContent value="perfil" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Mi Perfil</CardTitle>
                <CardDescription>Información personal y estadísticas</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col md:flex-row gap-6">
                  {/* Foto y datos básicos */}
                  <div className="flex flex-col items-center gap-4">
                    <Avatar className="w-32 h-32 border-4 border-primary">
                      <AvatarImage src={modeloActual.fotoPerfil} />
                      <AvatarFallback className="text-3xl">{modeloActual.nombre.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="text-center">
                      <h3 className="text-xl font-bold text-white">{modeloActual.nombreArtistico}</h3>
                      <p className="text-sm text-muted-foreground">{modeloActual.nombre}</p>
                      <div className="flex items-center justify-center gap-1 mt-2">
                        <Star className="w-4 h-4 fill-yellow-500 text-yellow-500" />
                        <span className="text-sm font-medium text-white">{modeloActual.calificacion}</span>
                      </div>
                    </div>
                  </div>

                  {/* Información detallada */}
                  <div className="flex-1 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-3 bg-secondary rounded-lg">
                        <p className="text-xs text-muted-foreground mb-1">Edad</p>
                        <p className="text-lg font-bold text-white">{modeloActual.edad} años</p>
                      </div>
                      <div className="p-3 bg-secondary rounded-lg">
                        <p className="text-xs text-muted-foreground mb-1">Estado</p>
                        <Badge variant={modeloActual.activa ? 'default' : 'secondary'}>
                          {modeloActual.activa ? 'Activa' : 'Inactiva'}
                        </Badge>
                      </div>
                      <div className="p-3 bg-secondary rounded-lg">
                        <p className="text-xs text-muted-foreground mb-1">Servicios Totales</p>
                        <p className="text-lg font-bold text-white">{modeloActual.servicios}</p>
                      </div>
                      <div className="p-3 bg-secondary rounded-lg">
                        <p className="text-xs text-muted-foreground mb-1">Comisión</p>
                        <p className="text-lg font-bold text-primary">{modeloActual.comision}%</p>
                      </div>
                    </div>

                    <div className="p-3 bg-secondary rounded-lg">
                      <p className="text-xs text-muted-foreground mb-1">Email</p>
                      <p className="text-sm text-white">{modeloActual.email}</p>
                    </div>

                    <div className="p-3 bg-secondary rounded-lg">
                      <p className="text-xs text-muted-foreground mb-1">Teléfono</p>
                      <p className="text-sm text-white">{modeloActual.telefono || 'No registrado'}</p>
                    </div>

                    {modeloActual.especialidades && modeloActual.especialidades.length > 0 && (
                      <div className="p-3 bg-secondary rounded-lg">
                        <p className="text-xs text-muted-foreground mb-2">Especialidades</p>
                        <div className="flex flex-wrap gap-2">
                          {modeloActual.especialidades.map((esp, index) => (
                            <Badge key={index} variant="outline">
                              {esp}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Botón flotante del carrito */}
      {carrito.length > 0 && (
        <button
          onClick={() => setMostrarCarritoBoutique(true)}
          className="fixed bottom-6 right-6 z-40 bg-primary hover:bg-primary/90 text-primary-foreground rounded-full p-4 shadow-2xl transition-all hover:scale-110 group"
        >
          <div className="relative">
            <ShoppingCart className="w-6 h-6" />
            <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center animate-pulse">
              {carrito.length}
            </div>
          </div>
          <span className="absolute right-full mr-3 top-1/2 -translate-y-1/2 bg-black/90 text-white text-sm px-3 py-1.5 rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
            Ver Carrito ({carrito.length} {carrito.length === 1 ? 'producto' : 'productos'})
          </span>
        </button>
      )}

      {/* Modales */}
      <RegistroEntradaModal
        isOpen={mostrarRegistroEntrada}
        onClose={() => setMostrarRegistroEntrada(false)}
        modeloEmail={modeloActual.email}
        modeloNombre={modeloActual.nombre}
      />
      <IniciarServicioModal
        isOpen={mostrarIniciarServicio}
        onClose={() => setMostrarIniciarServicio(false)}
        modeloEmail={modeloActual.email}
        modeloNombre={modeloActual.nombre}
      />
      <CarritoBoutiqueModal
        isOpen={mostrarCarritoBoutique}
        onClose={() => setMostrarCarritoBoutique(false)}
        onProcederCheckout={() => setMostrarCheckoutBoutique(true)}
      />
      <CheckoutBoutiqueModal
        isOpen={mostrarCheckoutBoutique}
        onClose={() => setMostrarCheckoutBoutique(false)}
        modeloEmail={modeloActual.email}
        modeloNombre={modeloActual.nombre}
      />
    </div>
  );
}