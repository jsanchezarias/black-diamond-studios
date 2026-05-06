import { useState, useMemo, useEffect } from 'react';
import { supabase } from '../utils/supabase/info';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
// import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
//  Calendar,
  FileText,
  Check,
//  X,
//  Clock,
//  ShoppingCart,
  AlertCircle,
  CreditCard,
  Receipt,
  User
} from 'lucide-react';
import { useModelos } from '../app/components/ModelosContext';
import { useServicios } from '../app/components/ServiciosContext';
import { useCarrito } from '../app/components/CarritoContext';
import { useMultas } from '../app/components/MultasContext';
import { usePagos, LiquidacionDetalle } from '../app/components/PagosContext';

interface LiquidacionPanelProps {
  userEmail: string;
}

export function LiquidacionPanel({ userEmail }: LiquidacionPanelProps) {
  const { modelos, loading: modelosLoading } = useModelos();
  const { servicios, loading: serviciosLoading } = useServicios();
  const { compras } = useCarrito();
  const { multas } = useMultas();
  const { registrarPago, obtenerPagosModelo, obtenerTotalAdelantosAprobados, loading: pagosLoading } = usePagos();
  const [deudasBoutique, setDeudasBoutique] = useState<any[]>([]);
  const [loadingDeudas, setLoadingDeudas] = useState(false);
  const isLoading = modelosLoading || serviciosLoading || pagosLoading || loadingDeudas;

  const [modeloSeleccionado, setModeloSeleccionado] = useState<string>('');
  const [mostrarModalPago, setMostrarModalPago] = useState(false);
  const [metodoPago, setMetodoPago] = useState('Efectivo');
  const [notas, setNotas] = useState('');

  // Cargar deudas de boutique pendientes
  useEffect(() => {
    const cargarDeudas = async () => {
      setLoadingDeudas(true);
      try {
        const { data, error } = await supabase
          .from('ventas_boutique')
          .select('*')
          .eq('estado', 'aceptado')
          .eq('liquidado', false);
        
        if (error) throw error;
        setDeudasBoutique(data || []);
      } catch (err) {
        console.error('Error cargando deudas boutique:', err);
      } finally {
        setLoadingDeudas(false);
      }
    };

    cargarDeudas();
  }, []);

  // Calcular liquidación de una modelo usando el modelo actual de datos
  const calcularLiquidacion = (modeloEmail: string): LiquidacionDetalle => {
    const modelo = modelos.find((m) => m.email === modeloEmail);
    const pagosAnteriores = obtenerPagosModelo(modeloEmail);
    const ultimoPago = pagosAnteriores.length > 0 ? pagosAnteriores[0].fecha : null;

    // Filtrar servicios completados de esta modelo desde el último pago
    const serviciosModelo = servicios.filter(
      (s) =>
        s.modeloEmail === modeloEmail &&
        s.estado === 'completado' &&
        (!ultimoPago || new Date(s.fechaCreacion) > ultimoPago)
    );

    // Calcular servicios (50% del valor pagado/pactado)
    const valorServicios = serviciosModelo.reduce(
      (total, s) => total + (s.montoPagado ?? s.montoPactado ?? 0),
      0
    );
    const liquidacionServicios = valorServicios * 0.5;

    // Sin campo costoAdicionales en el modelo actual — se omite
    const valorAdicionales = 0;
    const liquidacionAdicionales = 0;

    // Obtener compras de la modelo
    const comprasModelo = compras.filter(
      (c) => c.modeloEmail === modeloEmail && (!ultimoPago || new Date(c.fecha as string) > ultimoPago)
    );

    // Todas las compras de boutique se restan (no hay campo duranteServicio en modelo actual)
    const valorComprasBoutique = comprasModelo.reduce((total, c) => total + c.total, 0);

    // DEUDAS BOUTIQUE (ventas_boutique aceptadas no liquidadas)
    const deudasModelo = deudasBoutique.filter(d => d.modelo_id === modelo?.id);
    const valorDeudasBoutique = deudasModelo.reduce((total, d) => total + d.total, 0);

    // Multas pendientes (se restan)
    const multasModelo = multas.filter(
      (m) =>
        m.modeloEmail === modeloEmail &&
        m.estado === 'pendiente' &&
        (!ultimoPago || new Date(m.fecha) > ultimoPago)
    );
    const valorMultas = multasModelo.reduce((total, m) => total + m.monto, 0);

    // Adelantos aprobados (se restan)
    const valorAdelantos = obtenerTotalAdelantosAprobados(modeloEmail);

    // Calcular totales
    const subtotal = liquidacionServicios + liquidacionAdicionales;
    const deducciones = valorComprasBoutique + valorDeudasBoutique + valorMultas + valorAdelantos;
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
        cantidad: 0,
        valorTotal: valorAdicionales,
        porcentaje: 100,
        liquidacion: liquidacionAdicionales,
      },
      consumoDuranteServicio: {
        cantidad: 0,
        valorTotal: 0,
        porcentaje: 20,
        liquidacion: 0,
      },
      comprasFueraServicio: {
        cantidad: comprasModelo.length + deudasModelo.length,
        valorTotal: valorComprasBoutique + valorDeudasBoutique,
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
  }, [modelos, servicios, compras, multas, deudasBoutique]);

  const liquidacionActual = modeloSeleccionado
    ? calcularLiquidacion(modeloSeleccionado)
    : null;

  const handleProcesarPago = async () => {
    if (!liquidacionActual || !modeloSeleccionado) return;

    // 1. Registrar el pago en el contexto/base de datos
    registrarPago(
      modeloSeleccionado,
      liquidacionActual.modeloNombre,
      liquidacionActual,
      userEmail,
      metodoPago,
      notas
    );

    // 2. Marcar deudas de boutique como LIQUIDADAS en Supabase
    const modelo = modelos.find(m => m.email === modeloSeleccionado);
    if (modelo) {
      try {
        const { error } = await supabase
          .from('ventas_boutique')
          .update({ 
            liquidado: true,
            liquidacion_id: crypto.randomUUID() // O el ID del pago si estuviera disponible
          })
          .eq('modelo_id', modelo.id)
          .eq('estado', 'aceptado')
          .eq('liquidado', false);
        
        if (error) throw error;
        
        // Actualizar estado local para reflejar el cambio
        setDeudasBoutique(prev => prev.filter(d => d.modelo_id !== modelo.id));
      } catch (err) {
        console.error('Error al liquidar deudas boutique:', err);
      }
    }

    setMostrarModalPago(false);
    setModeloSeleccionado('');
    setNotas('');
    setMetodoPago('Efectivo');
  };

  // Estadísticas generales
  const statsGenerales = {
    totalAPagar: liquidaciones.reduce((sum, l) => sum + l.totalAPagar, 0),
    totalModelos: liquidaciones.filter((l) => l.totalAPagar > 0).length,
    mayorLiquidacion: liquidaciones.length ? Math.max(...liquidaciones.map((l) => l.totalAPagar)) : 0,
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <Card key={i} className="border-primary/30">
              <CardHeader className="pb-3">
                <div className="h-4 w-32 bg-secondary/50 rounded animate-pulse mb-2"></div>
                <div className="h-8 w-24 bg-secondary/50 rounded animate-pulse"></div>
              </CardHeader>
            </Card>
          ))}
        </div>
        <Card>
          <CardHeader>
            <div className="h-6 w-48 bg-secondary/50 rounded animate-pulse mb-2"></div>
            <div className="h-4 w-64 bg-secondary/50 rounded animate-pulse"></div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-32 rounded-lg bg-secondary/50 animate-pulse border border-border/50"></div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

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
