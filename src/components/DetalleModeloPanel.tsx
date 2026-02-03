import { useState } from 'react';
import { X, User, Mail, Phone, MapPin, CreditCard, Calendar, TrendingUp, DollarSign, Clock, Star, Edit, AlertTriangle, ShoppingBag, BarChart3, FileText, CheckCircle, Archive } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Modelo, useModelos } from '../src/app/components/ModelosContext';
import { useServicios } from '../src/app/components/ServiciosContext';
import { useMultas } from '../src/app/components/MultasContext';
import { usePagos } from '../src/app/components/PagosContext';
import { toast } from 'sonner';

interface DetalleModeloPanelProps {
  modelo: Modelo;
  onClose: () => void;
  onEdit: () => void;
}

export function DetalleModeloPanel({ modelo, onClose, onEdit }: DetalleModeloPanelProps) {
  const { serviciosActivos, serviciosFinalizados } = useServicios();
  const { multas, obtenerTotalMultasPendientes } = useMultas();
  const { adelantos, obtenerAdelantosPendientes } = usePagos();
  const { archivarModelo } = useModelos();

  // Filtrar datos de esta modelo
  const serviciosModelo = serviciosFinalizados.filter(s => s.modeloId === modelo.id);
  const multasModelo = multas.filter(m => m.modeloId === modelo.id);
  const adelantosModelo = adelantos.filter(a => a.modeloId === modelo.id);
  const servicioActivo = serviciosActivos.find(s => s.modeloId === modelo.id);

  // Calcular estadísticas
  const totalServicios = serviciosModelo.length;
  const totalIngresos = serviciosModelo.reduce((acc, s) => 
    acc + s.costoServicio + s.costoAdicionales + s.costoConsumo, 0
  );
  const totalMultasPendientes = multasModelo
    .filter(m => m.estado === 'pendiente')
    .reduce((acc, m) => acc + m.monto, 0);
  const totalAdelantosPendientes = adelantosModelo
    .filter(a => a.estado === 'pendiente')
    .reduce((acc, a) => acc + a.monto, 0);

  // Handler para archivar modelo
  const handleArchivar = async () => {
    const confirmar = window.confirm(
      `¿Estás seguro de archivar a ${modelo.nombreArtistico || modelo.nombre}?\n\nLa modelo dejará de aparecer en los listados activos, pero podrás recuperarla desde "Modelos Archivadas".`
    );
    
    if (!confirmar) return;
    
    const motivo = prompt('Motivo del archivado (opcional):');
    
    try {
      await archivarModelo(modelo.id, motivo || undefined);
      toast.success(`${modelo.nombreArtistico || modelo.nombre} ha sido archivada`);
      onClose();
    } catch (error) {
      console.error('Error archivando modelo:', error);
      toast.error('Error al archivar la modelo');
    }
  };

  // Estadísticas por periodo (último mes)
  const ahora = new Date();
  const hace30Dias = new Date(ahora.getTime() - 30 * 24 * 60 * 60 * 1000);
  
  const serviciosUltimoMes = serviciosModelo.filter(s => {
    if (!s.horaFin) return false;
    const fecha = new Date(s.horaFin);
    return fecha >= hace30Dias;
  });

  const ingresosUltimoMes = serviciosUltimoMes.reduce((acc, s) => 
    acc + s.costoServicio + s.costoAdicionales + s.costoConsumo, 0
  );

  // Calcular promedio por servicio
  const promedioServicio = totalServicios > 0 ? totalIngresos / totalServicios : 0;

  // Servicios por tipo
  const serviciosPorTipo = serviciosModelo.reduce((acc, s) => {
    acc[s.tipoServicio] = (acc[s.tipoServicio] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-2 sm:p-4">
      <div className="bg-card border border-primary/30 rounded-lg w-full max-w-7xl max-h-[95vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-primary/20 to-primary/5 border-b border-primary/30 p-3 sm:p-6">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3 sm:gap-6 flex-1">
              <div className="w-20 h-20 sm:w-32 sm:h-32 rounded-lg overflow-hidden border-2 border-primary/50 flex-shrink-0">
                <img 
                  src={modelo.fotoPerfil} 
                  alt={modelo.nombre}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="space-y-2 sm:space-y-3 flex-1 min-w-0">
                <div>
                  <h2 className="text-xl sm:text-3xl font-bold text-primary truncate">{modelo.nombreArtistico || modelo.nombre}</h2>
                  {modelo.nombreArtistico && (
                    <p className="text-base sm:text-xl text-muted-foreground mt-1 truncate">({modelo.nombre})</p>
                  )}
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge 
                    className={modelo.activa ? 'bg-green-500/20 text-green-400 border-green-500/30 text-xs' : 'bg-gray-500/20 text-gray-400 border-gray-500/30 text-xs'}
                  >
                    {modelo.activa ? '🟢 Activa' : '⚫ Inactiva'}
                  </Badge>
                  <Badge variant="outline" className="text-xs">{modelo.edad} años</Badge>
                  {servicioActivo && (
                    <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30 animate-pulse text-xs">
                      En Servicio
                    </Badge>
                  )}
                </div>
                <div className="hidden sm:grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground truncate">
                    <Mail className="w-4 h-4 flex-shrink-0" />
                    <span className="truncate">{modelo.email}</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground truncate">
                    <Phone className="w-4 h-4 flex-shrink-0" />
                    <span className="truncate">{modelo.telefono}</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground truncate">
                    <CreditCard className="w-4 h-4 flex-shrink-0" />
                    <span className="truncate">CC: {modelo.cedula}</span>
                  </div>
                  {modelo.direccion && (
                    <div className="flex items-center gap-2 text-muted-foreground truncate">
                      <MapPin className="w-4 h-4 flex-shrink-0" />
                      <span className="truncate">{modelo.direccion}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="flex gap-2 ml-2 flex-shrink-0">
              <Button variant="outline" onClick={onEdit} className="hidden sm:flex">
                <Edit className="w-4 h-4 mr-2" />
                Editar
              </Button>
              <Button variant="outline" size="icon" onClick={onEdit} className="sm:hidden">
                <Edit className="w-4 h-4" />
              </Button>
              <Button 
                variant="outline" 
                onClick={handleArchivar} 
                className="hidden sm:flex border-orange-500/30 text-orange-400 hover:bg-orange-500/10"
              >
                <Archive className="w-4 h-4 mr-2" />
                Archivar
              </Button>
              <Button 
                variant="outline" 
                size="icon" 
                onClick={handleArchivar} 
                className="sm:hidden border-orange-500/30 text-orange-400 hover:bg-orange-500/10"
              >
                <Archive className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-4 p-3 sm:p-6 border-b border-border/50">
          <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
            <CardHeader className="pb-2 sm:pb-3 p-3 sm:p-6">
              <CardDescription className="text-xs">Total Servicios</CardDescription>
              <CardTitle className="text-xl sm:text-2xl text-primary">{totalServicios}</CardTitle>
            </CardHeader>
          </Card>
          <Card className="border-green-500/20 bg-gradient-to-br from-green-500/5 to-transparent">
            <CardHeader className="pb-2 sm:pb-3 p-3 sm:p-6">
              <CardDescription className="text-xs">Ingresos Totales</CardDescription>
              <CardTitle className="text-xl sm:text-2xl text-green-400">
                ${(totalIngresos / 1000000).toFixed(1)}M
              </CardTitle>
            </CardHeader>
          </Card>
          <Card className="border-blue-500/20 bg-gradient-to-br from-blue-500/5 to-transparent">
            <CardHeader className="pb-2 sm:pb-3 p-3 sm:p-6">
              <CardDescription className="text-xs">Último Mes</CardDescription>
              <CardTitle className="text-xl sm:text-2xl text-blue-400">
                {serviciosUltimoMes.length}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card className="border-purple-500/20 bg-gradient-to-br from-purple-500/5 to-transparent">
            <CardHeader className="pb-2 sm:pb-3 p-3 sm:p-6">
              <CardDescription className="text-xs">Promedio</CardDescription>
              <CardTitle className="text-xl sm:text-2xl text-purple-400">
                ${(promedioServicio / 1000).toFixed(0)}K
              </CardTitle>
            </CardHeader>
          </Card>
          <Card className="border-yellow-500/20 bg-gradient-to-br from-yellow-500/5 to-transparent">
            <CardHeader className="pb-2 sm:pb-3 p-3 sm:p-6">
              <CardDescription className="text-xs">Multas Pend.</CardDescription>
              <CardTitle className="text-xl sm:text-2xl text-yellow-400">
                ${(totalMultasPendientes / 1000).toFixed(0)}K
              </CardTitle>
            </CardHeader>
          </Card>
          <Card className="border-orange-500/20 bg-gradient-to-br from-orange-500/5 to-transparent">
            <CardHeader className="pb-2 sm:pb-3 p-3 sm:p-6">
              <CardDescription className="text-xs">Adelantos</CardDescription>
              <CardTitle className="text-xl sm:text-2xl text-orange-400">
                ${(totalAdelantosPendientes / 1000).toFixed(0)}K
              </CardTitle>
            </CardHeader>
          </Card>
        </div>

        {/* Tabs Content */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-6">
          <Tabs defaultValue="historial" className="w-full">
            <TabsList className="grid w-full grid-cols-3 sm:grid-cols-5 bg-secondary text-xs sm:text-sm">
              <TabsTrigger value="historial" className="px-2">
                <FileText className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-2" />
                <span className="hidden sm:inline">Historial</span>
              </TabsTrigger>
              <TabsTrigger value="estadisticas" className="px-2">
                <BarChart3 className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-2" />
                <span className="hidden sm:inline">Estadísticas</span>
              </TabsTrigger>
              <TabsTrigger value="multas" className="px-2">
                <AlertTriangle className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-2" />
                <span className="hidden sm:inline">Multas</span>
                <span className="sm:hidden">({multasModelo.length})</span>
              </TabsTrigger>
              <TabsTrigger value="adelantos" className="px-2">
                <DollarSign className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-2" />
                <span className="hidden sm:inline">Adelantos</span>
                <span className="sm:hidden">({adelantosModelo.length})</span>
              </TabsTrigger>
              <TabsTrigger value="documentos" className="px-2">
                <User className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-2" />
                <span className="hidden sm:inline">Documentos</span>
              </TabsTrigger>
            </TabsList>

            {/* Historial de Servicios */}
            <TabsContent value="historial" className="space-y-3 mt-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Historial de Servicios</h3>
                <Badge variant="outline">{serviciosModelo.length} servicios</Badge>
              </div>
              
              {serviciosModelo.length > 0 ? (
                <div className="space-y-3">
                  {serviciosModelo.map((servicio) => {
                    const total = servicio.costoServicio + servicio.costoAdicionales + servicio.costoConsumo;
                    return (
                      <Card key={servicio.id} className="border-border/50 hover:border-primary/30 transition-all">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="space-y-2 flex-1">
                              <div className="flex items-center gap-3">
                                <Badge variant="outline">{servicio.tipoServicio}</Badge>
                                <Badge variant="outline">{servicio.tiempoServicio}</Badge>
                                {servicio.adicionales && servicio.adicionales.length > 0 && (
                                  <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30">
                                    +{servicio.adicionales.length} adicionales
                                  </Badge>
                                )}
                              </div>
                              
                              {servicio.clienteNombre && (
                                <div className="text-sm text-muted-foreground">
                                  Cliente: {servicio.clienteNombre} {servicio.clienteTelefono && `(${servicio.clienteTelefono})`}
                                </div>
                              )}

                              <div className="grid grid-cols-4 gap-3 text-sm">
                                <div>
                                  <span className="text-muted-foreground">Servicio:</span>
                                  <p className="font-medium text-primary">${servicio.costoServicio.toLocaleString()}</p>
                                </div>
                                <div>
                                  <span className="text-muted-foreground">Adicionales:</span>
                                  <p className="font-medium text-primary">${servicio.costoAdicionales.toLocaleString()}</p>
                                </div>
                                <div>
                                  <span className="text-muted-foreground">Consumo:</span>
                                  <p className="font-medium text-primary">${servicio.costoConsumo.toLocaleString()}</p>
                                </div>
                                <div>
                                  <span className="text-muted-foreground">Total:</span>
                                  <p className="font-bold text-primary text-lg">${total.toLocaleString()}</p>
                                </div>
                              </div>

                              {servicio.horaFin && (
                                <div className="text-xs text-muted-foreground">
                                  <Clock className="w-3 h-3 inline mr-1" />
                                  {new Date(servicio.horaFin).toLocaleString('es-CO', {
                                    day: '2-digit',
                                    month: '2-digit',
                                    year: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}
                                </div>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-12">
                  <FileText className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No hay servicios registrados aún</p>
                </div>
              )}
            </TabsContent>

            {/* Estadísticas */}
            <TabsContent value="estadisticas" className="space-y-4 mt-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                {/* Servicios por Tipo */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base sm:text-lg">Servicios por Tipo</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {Object.entries(serviciosPorTipo).map(([tipo, cantidad]) => {
                        const porcentaje = (cantidad / totalServicios) * 100;
                        return (
                          <div key={tipo} className="space-y-1">
                            <div className="flex items-center justify-between text-sm">
                              <span className="font-medium truncate">{tipo}</span>
                              <span className="text-muted-foreground flex-shrink-0 ml-2">{cantidad} ({porcentaje.toFixed(0)}%)</span>
                            </div>
                            <div className="h-2 bg-secondary rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-primary rounded-full transition-all"
                                style={{ width: `${porcentaje}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>

                {/* Performance Último Mes */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base sm:text-lg">Performance Último Mes</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Servicios</span>
                        <span className="text-xl sm:text-2xl font-bold text-primary">{serviciosUltimoMes.length}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Ingresos</span>
                        <span className="text-xl sm:text-2xl font-bold text-green-400">
                          ${(ingresosUltimoMes / 1000000).toFixed(2)}M
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Promedio/Servicio</span>
                        <span className="text-xl sm:text-2xl font-bold text-blue-400">
                          ${serviciosUltimoMes.length > 0 ? ((ingresosUltimoMes / serviciosUltimoMes.length) / 1000).toFixed(0) : 0}K
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Resumen Financiero */}
                <Card className="col-span-1 lg:col-span-2">
                  <CardHeader>
                    <CardTitle className="text-base sm:text-lg">Resumen Financiero</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
                      <div className="text-center p-3 sm:p-4 bg-green-500/10 rounded-lg border border-green-500/30">
                        <p className="text-xs sm:text-sm text-muted-foreground mb-2">Ingresos Brutos</p>
                        <p className="text-xl sm:text-3xl font-bold text-green-400">
                          ${(totalIngresos / 1000000).toFixed(2)}M
                        </p>
                      </div>
                      <div className="text-center p-3 sm:p-4 bg-yellow-500/10 rounded-lg border border-yellow-500/30">
                        <p className="text-xs sm:text-sm text-muted-foreground mb-2">Multas Pendientes</p>
                        <p className="text-xl sm:text-3xl font-bold text-yellow-400">
                          -${(totalMultasPendientes / 1000).toFixed(0)}K
                        </p>
                      </div>
                      <div className="text-center p-3 sm:p-4 bg-orange-500/10 rounded-lg border border-orange-500/30">
                        <p className="text-xs sm:text-sm text-muted-foreground mb-2">Adelantos Pendientes</p>
                        <p className="text-xl sm:text-3xl font-bold text-orange-400">
                          -${(totalAdelantosPendientes / 1000).toFixed(0)}K
                        </p>
                      </div>
                      <div className="text-center p-3 sm:p-4 bg-primary/10 rounded-lg border border-primary/30">
                        <p className="text-xs sm:text-sm text-muted-foreground mb-2">Balance</p>
                        <p className="text-xl sm:text-3xl font-bold text-primary">
                          ${((totalIngresos - totalMultasPendientes - totalAdelantosPendientes) / 1000000).toFixed(2)}M
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Multas */}
            <TabsContent value="multas" className="space-y-3 mt-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Multas Registradas</h3>
                <Badge variant="destructive">{multasModelo.length} multas</Badge>
              </div>

              {multasModelo.length > 0 ? (
                <div className="space-y-3">
                  {multasModelo.map((multa) => (
                    <Card key={multa.id} className="border-destructive/30">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="space-y-1">
                            <p className="font-medium">{multa.concepto}</p>
                            <p className="text-sm text-muted-foreground">{multa.fecha}</p>
                            {multa.descripcion && (
                              <p className="text-sm text-muted-foreground italic">{multa.descripcion}</p>
                            )}
                          </div>
                          <div className="text-right space-y-2">
                            <p className="text-2xl font-bold text-destructive">
                              -${multa.monto.toLocaleString('es-CO')}
                            </p>
                            <Badge 
                              variant={multa.estado === 'pendiente' ? 'destructive' : multa.estado === 'pagada' ? 'default' : 'outline'}
                            >
                              {multa.estado === 'pendiente' ? 'Pendiente' : multa.estado === 'pagada' ? 'Pagada' : 'Cancelada'}
                            </Badge>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <CheckCircle className="w-16 h-16 mx-auto text-green-500 mb-4" />
                  <p className="text-muted-foreground">No tiene multas registradas</p>
                </div>
              )}
            </TabsContent>

            {/* Adelantos */}
            <TabsContent value="adelantos" className="space-y-3 mt-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Adelantos de Pago</h3>
                <Badge variant="outline">{adelantosModelo.length} adelantos</Badge>
              </div>

              {adelantosModelo.length > 0 ? (
                <div className="space-y-3">
                  {adelantosModelo.map((adelanto) => (
                    <Card key={adelanto.id} className="border-orange-500/30">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="space-y-1">
                            <p className="font-medium">{adelanto.concepto}</p>
                            <p className="text-sm text-muted-foreground">
                              {new Date(adelanto.fecha).toLocaleDateString('es-CO')}
                            </p>
                            {adelanto.observaciones && (
                              <p className="text-sm text-muted-foreground italic">{adelanto.observaciones}</p>
                            )}
                          </div>
                          <div className="text-right space-y-2">
                            <p className="text-2xl font-bold text-orange-400">
                              ${adelanto.monto.toLocaleString('es-CO')}
                            </p>
                            <Badge 
                              variant={adelanto.estado === 'pendiente' ? 'default' : 'outline'}
                              className={adelanto.estado === 'pendiente' ? 'bg-orange-500/20 text-orange-400 border-orange-500/30' : ''}
                            >
                              {adelanto.estado === 'pendiente' ? 'Pendiente' : 'Descontado'}
                            </Badge>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <DollarSign className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No tiene adelantos registrados</p>
                </div>
              )}
            </TabsContent>

            {/* Documentos */}
            <TabsContent value="documentos" className="space-y-4 mt-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base sm:text-lg">Documento Identidad - Frente</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="aspect-[16/10] rounded-lg overflow-hidden border-2 border-primary/30">
                      <img 
                        src={modelo.documentoFrente} 
                        alt="Documento Frente"
                        className="w-full h-full object-cover cursor-pointer hover:scale-105 transition-transform"
                        onClick={() => window.open(modelo.documentoFrente, '_blank')}
                      />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base sm:text-lg">Documento Identidad - Reverso</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="aspect-[16/10] rounded-lg overflow-hidden border-2 border-primary/30">
                      <img 
                        src={modelo.documentoReverso} 
                        alt="Documento Reverso"
                        className="w-full h-full object-cover cursor-pointer hover:scale-105 transition-transform"
                        onClick={() => window.open(modelo.documentoReverso, '_blank')}
                      />
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base sm:text-lg">Información Personal</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-muted-foreground text-xs sm:text-sm">Nombre Completo</Label>
                      <p className="font-medium text-base sm:text-lg break-words">{modelo.nombre}</p>
                    </div>
                    {modelo.nombreArtistico && (
                      <div>
                        <Label className="text-muted-foreground text-xs sm:text-sm">Nombre Artístico</Label>
                        <p className="font-medium text-base sm:text-lg break-words">{modelo.nombreArtistico}</p>
                      </div>
                    )}
                    <div>
                      <Label className="text-muted-foreground text-xs sm:text-sm">Cédula</Label>
                      <p className="font-medium text-base sm:text-lg">{modelo.cedula}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground text-xs sm:text-sm">Edad</Label>
                      <p className="font-medium text-base sm:text-lg">{modelo.edad} años</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground text-xs sm:text-sm">Email</Label>
                      <p className="font-medium text-base sm:text-lg break-all">{modelo.email}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground text-xs sm:text-sm">Teléfono</Label>
                      <p className="font-medium text-base sm:text-lg">{modelo.telefono}</p>
                    </div>
                    {modelo.direccion && (
                      <div className="col-span-1 sm:col-span-2">
                        <Label className="text-muted-foreground text-xs sm:text-sm">Dirección</Label>
                        <p className="font-medium text-base sm:text-lg break-words">{modelo.direccion}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}