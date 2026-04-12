import { useState, useEffect, useRef, useMemo } from 'react';
import { Zap, Plus, Bell, CheckCircle, AlertTriangle, Clock, Calendar, Eye, Edit, Trash2, DollarSign } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { useGastos } from '../app/components/GastosContext';
import { AgregarServicioPublicoModal } from './AgregarServicioPublicoModal';
import { PagarServicioModal } from './PagarServicioModal';
import { toast } from 'sonner';

export function ServiciosPublicosPanel() {
  const { 
    serviciosPublicos, 
    eliminarServicio,
    obtenerServiciosPorPagar,
    obtenerServiciosVencidos,
    verificarNotificaciones
  } = useGastos();
  
  const [mostrarAgregarServicio, setMostrarAgregarServicio] = useState(false);
  const [servicioSeleccionado, setServicioSeleccionado] = useState<any>(null);
  const [mostrarPagarServicio, setMostrarPagarServicio] = useState(false);

  // Ref para evitar que el mismo servicio dispare toast más de una vez por sesión
  const notificadosRef = useRef<Set<string>>(new Set());

  // Memoizar para que la referencia solo cambie cuando cambie la lista base de servicios
  const serviciosPorPagar = useMemo(() => obtenerServiciosPorPagar(), [serviciosPublicos]);
  const serviciosVencidos = useMemo(() => obtenerServiciosVencidos(), [serviciosPublicos]);
  const serviciosConNotificacion = useMemo(() => verificarNotificaciones(), [serviciosPublicos]);

  // Notificaciones automáticas — se ejecuta solo cuando cambia serviciosConNotificacion
  useEffect(() => {
    if (serviciosConNotificacion.length > 0) {
      serviciosConNotificacion.forEach(servicio => {
        // Omitir si ya se notificó este servicio en la sesión actual
        if (notificadosRef.current.has(servicio.id)) return;
        notificadosRef.current.add(servicio.id);

        const diasRestantes = Math.ceil(
          (new Date(servicio.proximoPago!).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
        );

        if (diasRestantes < 0) {
          toast.error(`⚠️ SERVICIO VENCIDO: ${servicio.nombre}`, {
            description: `El pago está vencido. Por favor pagar cuanto antes.`,
            duration: 10000,
          });
        } else if (diasRestantes === 0) {
          toast.error(`🔔 ÚLTIMO DÍA: ${servicio.nombre}`, {
            description: `Hoy es la fecha límite de pago.`,
            duration: 10000,
          });
        } else {
          toast.warning(`⏰ RECORDATORIO: ${servicio.nombre}`, {
            description: `Faltan ${diasRestantes} días para la fecha límite de pago.`,
            duration: 8000,
          });
        }
      });
    }
  }, [serviciosConNotificacion]);

  const handlePagarServicio = (servicio: any) => {
    setServicioSeleccionado(servicio);
    setMostrarPagarServicio(true);
  };

  const tipoIconos: Record<string, string> = {
    agua: '💧',
    luz: '⚡',
    gas: '🔥',
    internet: '🌐',
    telefono: '📞',
    alarma: '🔔',
    aseo: '🧹',
    otro: '📋',
  };

  const calcularDiasRestantes = (fecha: Date) => {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const fechaPago = new Date(fecha);
    fechaPago.setHours(0, 0, 0, 0);
    return Math.ceil((fechaPago.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24));
  };

  const estadoBadge = (servicio: any) => {
    if (!servicio.proximoPago) {
      return <Badge className="bg-gray-500/20 text-gray-500 border-gray-500/50">Sin configurar</Badge>;
    }

    const dias = calcularDiasRestantes(servicio.proximoPago);
    
    if (dias < 0) {
      return <Badge className="bg-red-500/20 text-red-500 border-red-500/50 animate-pulse"><AlertTriangle className="w-3 h-3 mr-1" /> Vencido</Badge>;
    } else if (dias === 0) {
      return <Badge className="bg-red-500/20 text-red-500 border-red-500/50 animate-pulse"><Clock className="w-3 h-3 mr-1" /> Vence Hoy</Badge>;
    } else if (dias <= 3) {
      return <Badge className="bg-yellow-500/20 text-yellow-500 border-yellow-500/50"><Bell className="w-3 h-3 mr-1" /> {dias} días</Badge>;
    } else if (dias <= 7) {
      return <Badge className="bg-blue-500/20 text-blue-500 border-blue-500/50"><Calendar className="w-3 h-3 mr-1" /> {dias} días</Badge>;
    } else {
      return <Badge className="bg-green-500/20 text-green-500 border-green-500/50"><CheckCircle className="w-3 h-3 mr-1" /> Al día</Badge>;
    }
  };

  const totalMensual = serviciosPublicos.reduce((sum, s) => sum + s.montoPromedio, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-primary">Servicios Públicos</h2>
          <p className="text-muted-foreground mt-1">Gestión y recordatorios automáticos</p>
        </div>
        <Button 
          onClick={() => setMostrarAgregarServicio(true)}
          className="bg-primary text-primary-foreground"
        >
          <Plus className="w-4 h-4 mr-2" />
          Agregar Servicio
        </Button>
      </div>

      {/* Alertas de Servicios Vencidos */}
      {serviciosVencidos.length > 0 && (
        <Card className="border-red-500/50 bg-red-500/10">
          <CardHeader>
            <CardTitle className="text-red-500 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              ⚠️ SERVICIOS VENCIDOS ({serviciosVencidos.length})
            </CardTitle>
            <CardDescription>
              Los siguientes servicios tienen pagos vencidos. Por favor realizar el pago cuanto antes.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {serviciosVencidos.map(servicio => (
                <div key={servicio.id} className="flex items-center justify-between bg-card p-3 rounded-lg border border-red-500/30">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{tipoIconos[servicio.tipo]}</span>
                    <div>
                      <p className="font-semibold">{servicio.nombre}</p>
                      <p className="text-sm text-muted-foreground">
                        Vencido hace {Math.abs(calcularDiasRestantes(servicio.proximoPago!))} días
                      </p>
                    </div>
                  </div>
                  <Button
                    onClick={() => handlePagarServicio(servicio)}
                    className="bg-red-600 text-white hover:bg-red-700"
                  >
                    <DollarSign className="w-4 h-4 mr-2" />
                    Pagar Ahora
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Alertas de Servicios Por Pagar */}
      {serviciosPorPagar.length > 0 && serviciosVencidos.length === 0 && (
        <Card className="border-yellow-500/50 bg-yellow-500/10">
          <CardHeader>
            <CardTitle className="text-yellow-500 flex items-center gap-2">
              <Bell className="w-5 h-5" />
              🔔 Recordatorios de Pago ({serviciosPorPagar.length})
            </CardTitle>
            <CardDescription>
              Los siguientes servicios tienen pagos próximos (dentro de los próximos 7 días)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {serviciosPorPagar.map(servicio => {
                const dias = calcularDiasRestantes(servicio.proximoPago!);
                return (
                  <div key={servicio.id} className="flex items-center justify-between bg-card p-3 rounded-lg border border-yellow-500/30">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{tipoIconos[servicio.tipo]}</span>
                      <div>
                        <p className="font-semibold">{servicio.nombre}</p>
                        <p className="text-sm text-muted-foreground">
                          Vence en {dias} {dias === 1 ? 'día' : 'días'} - {new Date(servicio.proximoPago!).toLocaleDateString('es-ES')}
                        </p>
                      </div>
                    </div>
                    <Button
                      onClick={() => handlePagarServicio(servicio)}
                      className="bg-yellow-600 text-white hover:bg-yellow-700"
                    >
                      <DollarSign className="w-4 h-4 mr-2" />
                      Pagar
                    </Button>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-primary/20">
          <CardHeader className="pb-3">
            <CardDescription>Total Servicios</CardDescription>
            <CardTitle className="text-3xl text-primary">
              {serviciosPublicos.length}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-green-500/20">
          <CardHeader className="pb-3">
            <CardDescription>Servicios Activos</CardDescription>
            <CardTitle className="text-3xl text-green-500">
              {serviciosPublicos.filter(s => s.activo).length}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-yellow-500/20">
          <CardHeader className="pb-3">
            <CardDescription>Por Pagar (7 días)</CardDescription>
            <CardTitle className="text-3xl text-yellow-500">
              {serviciosPorPagar.length}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-primary/20">
          <CardHeader className="pb-3">
            <CardDescription>Total Mensual Aprox.</CardDescription>
            <CardTitle className="text-2xl text-primary">
              ${(totalMensual / 1000000).toFixed(2)}M
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Lista de Servicios */}
      <Card>
        <CardHeader>
          <CardTitle>Todos los Servicios</CardTitle>
          <CardDescription>
            Mostrando {serviciosPublicos.length} servicios configurados
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {serviciosPublicos.length === 0 ? (
              <div className="text-center py-12">
                <Zap className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">No hay servicios configurados</p>
                <Button
                  onClick={() => setMostrarAgregarServicio(true)}
                  variant="outline"
                  className="mt-4"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Agregar Primer Servicio
                </Button>
              </div>
            ) : (
              serviciosPublicos.map((servicio) => (
                <div
                  key={servicio.id}
                  className="bg-secondary/50 rounded-lg p-4 border border-border/50 hover:border-primary/30 transition-all"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-16 h-16 rounded-full flex items-center justify-center text-3xl bg-card border border-border">
                      {tipoIconos[servicio.tipo]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4 mb-3">
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg">{servicio.nombre}</h3>
                          <p className="text-sm text-muted-foreground">{servicio.proveedor}</p>
                          {servicio.numeroCuenta && (
                            <p className="text-xs text-muted-foreground mt-1">
                              Cuenta: {servicio.numeroCuenta}
                            </p>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="text-xl font-bold text-primary">
                            ${(servicio.montoPromedio / 1000).toFixed(0)}K
                          </p>
                          <p className="text-xs text-muted-foreground">promedio</p>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                        <div className="bg-card p-3 rounded-lg border border-border/50">
                          <p className="text-xs text-muted-foreground mb-1">Fecha Límite Pago</p>
                          <p className="font-semibold">Día {servicio.fechaLimitePago.getDate()} de cada mes</p>
                        </div>
                        {servicio.proximoPago && (
                          <div className="bg-card p-3 rounded-lg border border-border/50">
                            <p className="text-xs text-muted-foreground mb-1">Próximo Pago</p>
                            <p className="font-semibold">
                              {new Date(servicio.proximoPago).toLocaleDateString('es-ES', {
                                day: 'numeric',
                                month: 'long',
                                year: 'numeric'
                              })}
                            </p>
                          </div>
                        )}
                      </div>

                      {servicio.ultimoPago && (
                        <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3 mb-3">
                          <div className="flex items-start gap-2">
                            <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
                            <div className="flex-1">
                              <p className="text-xs text-muted-foreground mb-1">Último Pago</p>
                              <div className="flex items-center justify-between">
                                <p className="font-semibold text-sm">
                                  {new Date(servicio.ultimoPago.fecha).toLocaleDateString('es-ES')}
                                </p>
                                <p className="font-bold text-green-500">
                                  ${servicio.ultimoPago.monto.toLocaleString('es-CO')}
                                </p>
                              </div>
                              {servicio.ultimoPago.numeroReferencia && (
                                <p className="text-xs text-muted-foreground mt-1">
                                  Ref: {servicio.ultimoPago.numeroReferencia}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                      
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <div className="flex items-center gap-2">
                          {estadoBadge(servicio)}
                          {servicio.ultimoPago?.comprobante && (
                            <Badge variant="outline" className="text-xs">
                              <Eye className="w-3 h-3 mr-1" />
                              Con comprobante
                            </Badge>
                          )}
                        </div>
                        
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => handlePagarServicio(servicio)}
                            className="bg-green-600 text-white hover:bg-green-700"
                          >
                            <DollarSign className="w-4 h-4 mr-1" />
                            Pagar
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => eliminarServicio(servicio.id)}
                            className="border-red-500/50 text-red-500 hover:bg-red-500/10"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Modales */}
      <AgregarServicioPublicoModal
        isOpen={mostrarAgregarServicio}
        onClose={() => setMostrarAgregarServicio(false)}
      />

      {servicioSeleccionado && (
        <PagarServicioModal
          isOpen={mostrarPagarServicio}
          onClose={() => {
            setMostrarPagarServicio(false);
            setServicioSeleccionado(null);
          }}
          servicio={servicioSeleccionado}
        />
      )}
    </div>
  );
}
