import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  Calendar,
  FileText,
  Check,
  X,
  Clock,
  ShoppingCart,
  AlertCircle,
  CreditCard,
  Receipt,
  User
} from 'lucide-react';
import { useModelos } from '../src/app/components/ModelosContext';
import { useServicios } from '../src/app/components/ServiciosContext';
import { useCarrito } from '../src/app/components/CarritoContext';
import { useMultas } from '../src/app/components/MultasContext';
import { usePagos, LiquidacionDetalle } from '../src/app/components/PagosContext';

interface LiquidacionPanelProps {
  userEmail: string;
}

export function LiquidacionPanel({ userEmail }: LiquidacionPanelProps) {
  const { modelos } = useModelos();
  const { serviciosActivos, serviciosFinalizados } = useServicios();
  const { compras } = useCarrito();
  const { multas } = useMultas();
  const { registrarPago, obtenerPagosModelo, obtenerTotalAdelantosAprobados } = usePagos();

  const [modeloSeleccionado, setModeloSeleccionado] = useState<string>('');
  const [mostrarModalPago, setMostrarModalPago] = useState(false);
  const [metodoPago, setMetodoPago] = useState('Efectivo');
  const [notas, setNotas] = useState('');

  // Calcular liquidación de una modelo
  const calcularLiquidacion = (modeloEmail: string): LiquidacionDetalle => {
    const modelo = modelos.find((m) => m.email === modeloEmail);
    const pagosAnteriores = obtenerPagosModelo(modeloEmail);
    const ultimoPago = pagosAnteriores.length > 0 ? pagosAnteriores[0].fecha : null;

    // Combinar servicios activos y finalizados
    const todosLosServicios = [...serviciosActivos, ...serviciosFinalizados];

    // Filtrar servicios desde el último pago
    const serviciosModelo = todosLosServicios.filter(
      (s) => 
        s.modeloEmail === modeloEmail && 
        s.estado === 'finalizado' &&
        (!ultimoPago || s.horaFin! > ultimoPago)
    );

    // Calcular servicios (50% del valor base)
    const valorServicios = serviciosModelo.reduce((total, s) => {
      const costoTiemposAdicionales = s.tiemposAdicionales?.reduce((sum, t) => sum + t.costo, 0) || 0;
      return total + s.costoServicio + costoTiemposAdicionales;
    }, 0);
    const liquidacionServicios = valorServicios * 0.5;

    // Calcular adicionales (100% del valor)
    const valorAdicionales = serviciosModelo.reduce(
      (total, s) => total + s.costoAdicionales,
      0
    );
    const liquidacionAdicionales = valorAdicionales;

    // Obtener compras de la modelo
    const comprasModelo = compras.filter(
      (c) => c.modeloEmail === modeloEmail && (!ultimoPago || c.fecha > ultimoPago)
    );

    // Separar compras durante servicio y fuera de servicio
    const comprasDuranteServicio = comprasModelo.filter((c) => c.duranteServicio);
    const comprasFueraServicio = comprasModelo.filter((c) => !c.duranteServicio);

    // Consumo durante servicio (20% del valor)
    const valorConsumoDuranteServicio = comprasDuranteServicio.reduce(
      (total, c) => total + c.total,
      0
    );
    const liquidacionConsumo = valorConsumoDuranteServicio * 0.2;

    // Compras fuera de servicio (se restan)
    const valorComprasFueraServicio = comprasFueraServicio.reduce(
      (total, c) => total + c.total,
      0
    );

    // Multas (se restan)
    const multasModelo = multas.filter(
      (m) => 
        m.modeloEmail === modeloEmail && 
        m.estado === 'activa' &&
        (!ultimoPago || m.fecha > ultimoPago)
    );
    const valorMultas = multasModelo.reduce((total, m) => total + m.monto, 0);

    // Adelantos aprobados (se restan)
    const valorAdelantos = obtenerTotalAdelantosAprobados(modeloEmail);

    // Calcular totales
    const subtotal = liquidacionServicios + liquidacionAdicionales + liquidacionConsumo;
    const deducciones = valorComprasFueraServicio + valorMultas + valorAdelantos;
    const totalAPagar = Math.max(0, subtotal - deducciones);

    return {
      modeloEmail,
      modeloNombre: modelo?.nombre || '',
      servicios: {
        cantidad: serviciosModelo.length,
        valorTotal: valorServicios,
        porcentaje: 50,
        liquidacion: liquidacionServicios,
      },
      adicionales: {
        cantidad: serviciosModelo.filter(s => s.costoAdicionales > 0).length,
        valorTotal: valorAdicionales,
        porcentaje: 100,
        liquidacion: liquidacionAdicionales,
      },
      consumoDuranteServicio: {
        cantidad: comprasDuranteServicio.length,
        valorTotal: valorConsumoDuranteServicio,
        porcentaje: 20,
        liquidacion: liquidacionConsumo,
      },
      comprasFueraServicio: {
        cantidad: comprasFueraServicio.length,
        valorTotal: valorComprasFueraServicio,
      },
      multas: {
        cantidad: multasModelo.length,
        valorTotal: valorMultas,
      },
      adelantos: {
        cantidad: valorAdelantos > 0 ? 1 : 0,
        valorTotal: valorAdelantos,
      },
      subtotal,
      deducciones,
      totalAPagar,
      ultimoPago: ultimoPago || undefined,
    };
  };

  // Calcular liquidaciones de todas las modelos
  const liquidaciones = useMemo(() => {
    return modelos.map((modelo) => calcularLiquidacion(modelo.email));
  }, [modelos, serviciosActivos, serviciosFinalizados, compras, multas]);

  const liquidacionActual = modeloSeleccionado
    ? calcularLiquidacion(modeloSeleccionado)
    : null;

  const handleProcesarPago = () => {
    if (!liquidacionActual || !modeloSeleccionado) return;

    registrarPago(
      modeloSeleccionado,
      liquidacionActual.modeloNombre,
      liquidacionActual,
      userEmail,
      metodoPago,
      notas
    );

    setMostrarModalPago(false);
    setModeloSeleccionado('');
    setNotas('');
    setMetodoPago('Efectivo');
  };

  // Estadísticas generales
  const statsGenerales = {
    totalAPagar: liquidaciones.reduce((sum, l) => sum + l.totalAPagar, 0),
    totalModelos: liquidaciones.filter((l) => l.totalAPagar > 0).length,
    mayorLiquidacion: Math.max(...liquidaciones.map((l) => l.totalAPagar)),
  };

  return (
    <div className="space-y-6">
      {/* Estadísticas generales */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-primary/30 bg-gradient-to-br from-primary/10 to-transparent">
          <CardHeader className="pb-3">
            <CardDescription className="flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              Total a Pagar
            </CardDescription>
            <CardTitle className="text-3xl text-primary">
              ${statsGenerales.totalAPagar.toLocaleString('es-CO')}
            </CardTitle>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription className="flex items-center gap-2">
              <User className="w-4 h-4" />
              Modelos Pendientes
            </CardDescription>
            <CardTitle className="text-3xl">
              {statsGenerales.totalModelos}
            </CardTitle>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Mayor Liquidación
            </CardDescription>
            <CardTitle className="text-3xl text-green-500">
              ${statsGenerales.mayorLiquidacion.toLocaleString('es-CO')}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Listado de liquidaciones */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Receipt className="w-5 h-5" />
            Liquidaciones Pendientes
          </CardTitle>
          <CardDescription>
            Revisa y procesa los pagos de las modelos
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {liquidaciones
              .filter((l) => l.totalAPagar > 0)
              .sort((a, b) => b.totalAPagar - a.totalAPagar)
              .map((liquidacion) => (
                <div
                  key={liquidacion.modeloEmail}
                  className="p-4 border border-white/10 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h4 className="font-semibold text-white">
                          {liquidacion.modeloNombre}
                        </h4>
                        <Badge variant="outline" className="border-primary/50 text-primary">
                          ${liquidacion.totalAPagar.toLocaleString('es-CO')}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                        {/* Ingresos */}
                        <div className="flex items-center gap-2 text-green-400">
                          <TrendingUp className="w-4 h-4" />
                          <div>
                            <p className="text-xs text-muted-foreground">Servicios</p>
                            <p className="font-semibold">
                              ${liquidacion.servicios.liquidacion.toLocaleString('es-CO')}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 text-green-400">
                          <TrendingUp className="w-4 h-4" />
                          <div>
                            <p className="text-xs text-muted-foreground">Adicionales</p>
                            <p className="font-semibold">
                              ${liquidacion.adicionales.liquidacion.toLocaleString('es-CO')}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 text-green-400">
                          <TrendingUp className="w-4 h-4" />
                          <div>
                            <p className="text-xs text-muted-foreground">Consumo</p>
                            <p className="font-semibold">
                              ${liquidacion.consumoDuranteServicio.liquidacion.toLocaleString('es-CO')}
                            </p>
                          </div>
                        </div>

                        {/* Deducciones */}
                        {liquidacion.comprasFueraServicio.valorTotal > 0 && (
                          <div className="flex items-center gap-2 text-red-400">
                            <TrendingDown className="w-4 h-4" />
                            <div>
                              <p className="text-xs text-muted-foreground">Compras</p>
                              <p className="font-semibold">
                                -${liquidacion.comprasFueraServicio.valorTotal.toLocaleString('es-CO')}
                              </p>
                            </div>
                          </div>
                        )}

                        {liquidacion.multas.valorTotal > 0 && (
                          <div className="flex items-center gap-2 text-red-400">
                            <AlertCircle className="w-4 h-4" />
                            <div>
                              <p className="text-xs text-muted-foreground">Multas</p>
                              <p className="font-semibold">
                                -${liquidacion.multas.valorTotal.toLocaleString('es-CO')}
                              </p>
                            </div>
                          </div>
                        )}

                        {liquidacion.adelantos.valorTotal > 0 && (
                          <div className="flex items-center gap-2 text-red-400">
                            <CreditCard className="w-4 h-4" />
                            <div>
                              <p className="text-xs text-muted-foreground">Adelantos</p>
                              <p className="font-semibold">
                                -${liquidacion.adelantos.valorTotal.toLocaleString('es-CO')}
                              </p>
                            </div>
                          </div>
                        )}
                      </div>

                      {liquidacion.ultimoPago && (
                        <p className="text-xs text-muted-foreground mt-2">
                          Último pago: {liquidacion.ultimoPago.toLocaleDateString('es-CO')}
                        </p>
                      )}
                    </div>

                    <Button
                      onClick={() => {
                        setModeloSeleccionado(liquidacion.modeloEmail);
                        setMostrarModalPago(true);
                      }}
                      className="bg-primary text-primary-foreground hover:bg-primary/90"
                    >
                      <DollarSign className="w-4 h-4 mr-2" />
                      Pagar
                    </Button>
                  </div>
                </div>
              ))}

            {liquidaciones.filter((l) => l.totalAPagar > 0).length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No hay liquidaciones pendientes</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Modal de pago */}
      <Dialog open={mostrarModalPago} onOpenChange={setMostrarModalPago}>
        <DialogContent className="max-w-2xl bg-card backdrop-blur-lg border-primary/30">
          <DialogHeader>
            <DialogTitle className="text-2xl flex items-center gap-2">
              <DollarSign className="w-6 h-6 text-primary" />
              Procesar Pago
            </DialogTitle>
            <DialogDescription>
              {liquidacionActual?.modeloNombre}
            </DialogDescription>
          </DialogHeader>

          {liquidacionActual && (
            <div className="space-y-6">
              {/* Resumen detallado */}
              <div className="border border-white/10 rounded-lg p-4 space-y-3 bg-secondary/30">
                <h3 className="font-semibold text-primary mb-3">Detalle de Liquidación</h3>

                {/* Ingresos */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">
                      Servicios ({liquidacionActual.servicios.cantidad}) × 50%
                    </span>
                    <span className="text-green-400 font-semibold">
                      +${liquidacionActual.servicios.liquidacion.toLocaleString('es-CO')}
                    </span>
                  </div>

                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">
                      Adicionales ({liquidacionActual.adicionales.cantidad}) × 100%
                    </span>
                    <span className="text-green-400 font-semibold">
                      +${liquidacionActual.adicionales.liquidacion.toLocaleString('es-CO')}
                    </span>
                  </div>

                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">
                      Consumo durante servicio ({liquidacionActual.consumoDuranteServicio.cantidad}) × 20%
                    </span>
                    <span className="text-green-400 font-semibold">
                      +${liquidacionActual.consumoDuranteServicio.liquidacion.toLocaleString('es-CO')}
                    </span>
                  </div>

                  <div className="border-t border-white/10 pt-2 flex justify-between font-semibold">
                    <span>Subtotal</span>
                    <span className="text-primary">
                      ${liquidacionActual.subtotal.toLocaleString('es-CO')}
                    </span>
                  </div>
                </div>

                {/* Deducciones */}
                {liquidacionActual.deducciones > 0 && (
                  <div className="space-y-2 pt-2 border-t border-white/10">
                    <h4 className="text-sm font-semibold text-red-400">Deducciones</h4>

                    {liquidacionActual.comprasFueraServicio.valorTotal > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">
                          Compras fuera de servicio ({liquidacionActual.comprasFueraServicio.cantidad})
                        </span>
                        <span className="text-red-400 font-semibold">
                          -${liquidacionActual.comprasFueraServicio.valorTotal.toLocaleString('es-CO')}
                        </span>
                      </div>
                    )}

                    {liquidacionActual.multas.valorTotal > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">
                          Multas ({liquidacionActual.multas.cantidad})
                        </span>
                        <span className="text-red-400 font-semibold">
                          -${liquidacionActual.multas.valorTotal.toLocaleString('es-CO')}
                        </span>
                      </div>
                    )}

                    {liquidacionActual.adelantos.valorTotal > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Adelantos</span>
                        <span className="text-red-400 font-semibold">
                          -${liquidacionActual.adelantos.valorTotal.toLocaleString('es-CO')}
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {/* Total a pagar */}
                <div className="border-t-2 border-primary/30 pt-3 flex justify-between text-lg font-bold">
                  <span>Total a Pagar</span>
                  <span className="text-primary text-2xl">
                    ${liquidacionActual.totalAPagar.toLocaleString('es-CO')}
                  </span>
                </div>
              </div>

              {/* Método de pago */}
              <div className="space-y-2">
                <Label>Método de Pago</Label>
                <Select value={metodoPago} onValueChange={setMetodoPago}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Efectivo">Efectivo</SelectItem>
                    <SelectItem value="Transferencia">Transferencia Bancaria</SelectItem>
                    <SelectItem value="Nequi">Nequi</SelectItem>
                    <SelectItem value="Daviplata">Daviplata</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Notas */}
              <div className="space-y-2">
                <Label>Notas (Opcional)</Label>
                <Textarea
                  value={notas}
                  onChange={(e) => setNotas(e.target.value)}
                  placeholder="Observaciones sobre el pago..."
                  rows={3}
                />
              </div>

              {/* Botones */}
              <div className="flex gap-3 justify-end">
                <Button
                  variant="outline"
                  onClick={() => setMostrarModalPago(false)}
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleProcesarPago}
                  className="bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  <Check className="w-4 h-4 mr-2" />
                  Confirmar Pago
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
