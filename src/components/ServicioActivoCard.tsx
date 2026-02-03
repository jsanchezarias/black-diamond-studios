import { useState } from 'react';
import { Clock, Plus, DollarSign, ShoppingBag, AlertTriangle, CheckCircle, FileText, X, Receipt, Upload, Image as ImageIcon } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Textarea } from './ui/textarea';
import { Separator } from './ui/separator';
import { useServicios, Servicio } from '../src/app/components/ServiciosContext';
import { useInventory } from '../src/app/components/InventoryContext';
import { toast } from 'sonner@2.0.3';
import { uploadComprobante } from '../src/utils/supabase/uploadComprobante';

interface ServicioActivoCardProps {
  servicio: Servicio;
  onFinalizar?: () => void;
}

const COSTOS_TIEMPO_ADICIONAL = {
  '30 minutos': 80000,
  '1 hora': 150000,
  '2 horas': 280000,
};

export function ServicioActivoCard({ servicio, onFinalizar }: ServicioActivoCardProps) {
  const { agregarTiempoAdicional, agregarAdicionalAServicio, finalizarServicio } = useServicios();
  const { inventario, actualizarStock } = useInventory();
  
  const [mostrarTiempoExtra, setMostrarTiempoExtra] = useState(false);
  const [mostrarAdicionales, setMostrarAdicionales] = useState(false);
  const [mostrarBoutique, setMostrarBoutique] = useState(false);
  const [mostrarFinalizar, setMostrarFinalizar] = useState(false);
  const [mostrarReporte, setMostrarReporte] = useState(false);

  // Estados para tiempo adicional
  const [tiempoAdicional, setTiempoAdicional] = useState<'30 minutos' | '1 hora' | '2 horas'>('30 minutos');
  const [metodoPagoTiempo, setMetodoPagoTiempo] = useState<'Efectivo' | 'QR' | 'Nequi' | 'Daviplata' | 'Datafono' | 'Convenio'>('Efectivo');
  const [archivoComprobanteTiempo, setArchivoComprobanteTiempo] = useState<File | null>(null);
  const [subiendoTiempo, setSubiendoTiempo] = useState(false);

  // Estados para adicionales
  const [descripcionAdicional, setDescripcionAdicional] = useState('');
  const [costoAdicional, setCostoAdicional] = useState('');
  const [metodoPagoAdicional, setMetodoPagoAdicional] = useState<'Efectivo' | 'QR' | 'Nequi' | 'Daviplata' | 'Datafono' | 'Convenio'>('Efectivo');
  const [archivoComprobanteAdicional, setArchivoComprobanteAdicional] = useState<File | null>(null);
  const [subiendoAdicional, setSubiendoAdicional] = useState(false);

  // Estados para boutique
  const [productoSeleccionado, setProductoSeleccionado] = useState<string>('');
  const [cantidadProducto, setCantidadProducto] = useState(1);
  const [metodoPagoBoutique, setMetodoPagoBoutique] = useState<'Efectivo' | 'QR' | 'Nequi' | 'Daviplata' | 'Datafono' | 'Convenio'>('Efectivo');
  const [archivoComprobanteBoutique, setArchivoComprobanteBoutique] = useState<File | null>(null);
  const [subiendoBoutique, setSubiendoBoutique] = useState(false);
  const [productosAgregados, setProductosAgregados] = useState<{
    productoId: string; // ✅ Cambiar a string
    nombre: string;
    cantidad: number;
    precioUnitario: number;
    total: number;
  }[]>([]);

  // Estados para finalizar
  const [notasCierre, setNotasCierre] = useState('');

  // Calcular costo total del servicio
  const calcularCostoTotal = () => {
    let total = servicio.costoServicio;

    // Sumar tiempos adicionales
    if (servicio.tiemposAdicionales) {
      total += servicio.tiemposAdicionales.reduce((sum, t) => sum + t.costo, 0);
    }

    // Sumar adicionales
    if (servicio.adicionalesExtra) {
      total += servicio.adicionalesExtra.reduce((sum, a) => sum + a.costo, 0);
    }

    // Sumar consumos (boutique)
    if (servicio.consumosDetallados) {
      total += servicio.consumosDetallados.reduce((sum, c) => sum + c.costo, 0);
    }

    return total;
  };

  // Formatear tiempo restante
  const formatearTiempo = (segundos: number) => {
    const horas = Math.floor(segundos / 3600);
    const minutos = Math.floor((segundos % 3600) / 60);
    const segs = segundos % 60;
    return `${horas.toString().padStart(2, '0')}:${minutos.toString().padStart(2, '0')}:${segs.toString().padStart(2, '0')}`;
  };

  // Agregar tiempo adicional
  const handleAgregarTiempo = async () => {
    if (metodoPagoTiempo !== 'Efectivo' && !archivoComprobanteTiempo) {
      toast.error('Debes subir una imagen del comprobante');
      return;
    }

    try {
      setSubiendoTiempo(true);
      let urlComprobante: string | undefined;

      // Si hay archivo, subirlo
      if (archivoComprobanteTiempo) {
        urlComprobante = await uploadComprobante(archivoComprobanteTiempo, 'comprobantes-tiempo');
        toast.success('Comprobante subido exitosamente');
      }

      const costo = COSTOS_TIEMPO_ADICIONAL[tiempoAdicional];
      agregarTiempoAdicional(servicio.id, {
        tiempoAdicional,
        costoAdicional: costo,
        comprobante: urlComprobante,
      });

      toast.success(`${tiempoAdicional} agregados al servicio`);
      setMostrarTiempoExtra(false);
      setArchivoComprobanteTiempo(null);
    } catch (error: any) {
      toast.error(error.message || 'Error al procesar el comprobante');
    } finally {
      setSubiendoTiempo(false);
    }
  };

  // Agregar adicional al servicio
  const handleAgregarAdicional = async () => {
    if (!descripcionAdicional.trim() || !costoAdicional) {
      toast.error('Completa todos los campos');
      return;
    }

    if (metodoPagoAdicional !== 'Efectivo' && !archivoComprobanteAdicional) {
      toast.error('Debes subir una imagen del comprobante');
      return;
    }

    try {
      setSubiendoAdicional(true);
      let urlComprobante: string | undefined;

      // Si hay archivo, subirlo
      if (archivoComprobanteAdicional) {
        urlComprobante = await uploadComprobante(archivoComprobanteAdicional, 'comprobantes-adicionales');
        toast.success('Comprobante subido exitosamente');
      }

      agregarAdicionalAServicio(servicio.id, {
        descripcion: descripcionAdicional,
        costo: parseFloat(costoAdicional),
        comprobante: urlComprobante,
      });

      toast.success('Adicional agregado al servicio');
      setMostrarAdicionales(false);
      setDescripcionAdicional('');
      setCostoAdicional('');
      setArchivoComprobanteAdicional(null);
    } catch (error: any) {
      toast.error(error.message || 'Error al procesar el comprobante');
    } finally {
      setSubiendoAdicional(false);
    }
  };

  // Agregar producto de boutique
  const handleAgregarProducto = () => {
    if (!productoSeleccionado) {
      toast.error('Selecciona un producto');
      return;
    }

    const producto = inventario.find(p => p.id === productoSeleccionado); // ✅ Ya no necesita .toString() porque id es string
    if (!producto) return;

    if (producto.stock < cantidadProducto) {
      toast.error('Stock insuficiente');
      return;
    }

    const productoAgregado = {
      productoId: producto.id,
      nombre: producto.nombre,
      cantidad: cantidadProducto,
      precioUnitario: producto.precioServicio,
      total: producto.precioServicio * cantidadProducto,
    };

    setProductosAgregados(prev => [...prev, productoAgregado]);
    setCantidadProducto(1);
    setProductoSeleccionado('');
    toast.success('Producto agregado');
  };

  // Confirmar venta de boutique
  const handleConfirmarBoutique = async () => { // ✅ Hacer async
    if (productosAgregados.length === 0) {
      toast.error('No hay productos agregados');
      return;
    }

    try {
      // Actualizar stock (pasar el nuevo stock calculado)
      for (const p of productosAgregados) {
        const productoActual = inventario.find(inv => inv.id === p.productoId);
        if (productoActual) {
          const nuevoStock = productoActual.stock - p.cantidad;
          await actualizarStock(p.productoId, nuevoStock); // ✅ Pasar el valor absoluto del nuevo stock
        }
      }

      // Agregar como consumo al servicio
      productosAgregados.forEach(p => {
        agregarAdicionalAServicio(servicio.id, {
          descripcion: `${p.nombre} (x${p.cantidad})`,
          costo: p.total,
        });
      });

      toast.success('Venta de boutique registrada');
      setProductosAgregados([]);
      setMostrarBoutique(false);
    } catch (error) {
      console.error('Error confirmando venta de boutique:', error);
      toast.error('Error al actualizar el stock de productos');
    }
  };

  // Finalizar servicio
  const handleFinalizar = () => {
    finalizarServicio(servicio.id, notasCierre);
    toast.success('Servicio finalizado exitosamente');
    setMostrarFinalizar(false);
    setMostrarReporte(true);
  };

  const costoTotal = calcularCostoTotal();
  const tiempoAgotado = servicio.tiempoRestante === 0;
  const tiempoExcedido = (servicio.tiempoNegativo || 0) > 0;

  return (
    <>
      <Card className={`border-2 ${tiempoExcedido ? 'border-red-500/50 bg-red-950/20' : tiempoAgotado ? 'border-yellow-500/50 bg-yellow-950/20' : 'border-primary/30'}`}>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-xl">{servicio.modeloNombre}</CardTitle>
              <CardDescription>
                {servicio.clienteNombre || 'Cliente Anónimo'}
                {servicio.habitacion && ` • Hab. ${servicio.habitacion}`}
              </CardDescription>
            </div>
            <Badge className={tiempoExcedido ? 'bg-red-500' : tiempoAgotado ? 'bg-yellow-500' : 'bg-green-500'}>
              {servicio.estado}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Countdown Timer */}
          <div className={`p-6 rounded-lg text-center ${
            tiempoExcedido 
              ? 'bg-red-950/50 border-2 border-red-500' 
              : tiempoAgotado 
              ? 'bg-yellow-950/50 border-2 border-yellow-500'
              : 'bg-primary/10 border-2 border-primary/30'
          }`}>
            <div className="flex items-center justify-center gap-2 mb-2">
              <Clock className={`w-6 h-6 ${tiempoExcedido ? 'text-red-500' : tiempoAgotado ? 'text-yellow-500' : 'text-primary'}`} />
              <p className="text-sm text-muted-foreground">
                {tiempoExcedido ? 'Tiempo Excedido' : tiempoAgotado ? 'Tiempo Agotado' : 'Tiempo Restante'}
              </p>
            </div>
            <p className={`text-4xl font-bold font-mono ${
              tiempoExcedido ? 'text-red-500' : tiempoAgotado ? 'text-yellow-500' : 'text-primary'
            }`}>
              {tiempoExcedido 
                ? `+${formatearTiempo(servicio.tiempoNegativo || 0)}`
                : formatearTiempo(servicio.tiempoRestante)
              }
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              Inicio: {servicio.horaInicio.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}
              {' • '}
              Duración: {servicio.duracionMinutos} min
            </p>
          </div>

          {/* Alerta de tiempo excedido */}
          {tiempoExcedido && (
            <div className="p-4 bg-red-950/30 border-2 border-red-500/50 rounded-lg flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-red-400">¡Tiempo excedido!</p>
                <p className="text-xs text-muted-foreground mt-1">
                  El servicio ha superado el tiempo contratado. Considera agregar más tiempo o finalizar el servicio.
                </p>
              </div>
            </div>
          )}

          {/* Información del servicio */}
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="p-3 bg-secondary rounded-lg">
              <p className="text-muted-foreground text-xs mb-1">Tipo</p>
              <p className="font-semibold">{servicio.tipoServicio}</p>
            </div>
            <div className="p-3 bg-secondary rounded-lg">
              <p className="text-muted-foreground text-xs mb-1">Duración</p>
              <p className="font-semibold">{servicio.tiempoServicio}</p>
            </div>
            <div className="p-3 bg-secondary rounded-lg">
              <p className="text-muted-foreground text-xs mb-1">Pago</p>
              <p className="font-semibold">{servicio.metodoPago}</p>
            </div>
            <div className="p-3 bg-secondary rounded-lg">
              <p className="text-muted-foreground text-xs mb-1">Costo Inicial</p>
              <p className="font-semibold text-primary">${servicio.costoServicio.toLocaleString('es-CO')}</p>
            </div>
          </div>

          {/* Extras agregados */}
          {(servicio.tiemposAdicionales?.length || servicio.adicionalesExtra?.length) && (
            <div className="space-y-2">
              <p className="text-sm font-semibold">Extras Agregados:</p>
              <div className="space-y-1">
                {servicio.tiemposAdicionales?.map((t, i) => (
                  <div key={i} className="flex items-center justify-between p-2 bg-secondary/50 rounded text-sm">
                    <span className="flex items-center gap-2">
                      <Clock className="w-3 h-3 text-primary" />
                      {t.tiempo}
                    </span>
                    <span className="font-semibold">${t.costo.toLocaleString('es-CO')}</span>
                  </div>
                ))}
                {servicio.adicionalesExtra?.map((a, i) => (
                  <div key={i} className="flex items-center justify-between p-2 bg-secondary/50 rounded text-sm">
                    <span className="flex items-center gap-2">
                      <Plus className="w-3 h-3 text-primary" />
                      {a.descripcion}
                    </span>
                    <span className="font-semibold">${a.costo.toLocaleString('es-CO')}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Costo total */}
          <Separator />
          <div className="flex items-center justify-between p-4 bg-primary/10 rounded-lg border-2 border-primary/30">
            <span className="text-lg font-semibold">TOTAL SERVICIO:</span>
            <span className="text-2xl font-bold text-primary">${costoTotal.toLocaleString('es-CO')}</span>
          </div>

          {/* Botones de acción */}
          <div className="grid grid-cols-2 gap-2">
            <Button onClick={() => setMostrarTiempoExtra(true)} variant="outline" size="sm">
              <Clock className="w-4 h-4 mr-2" />
              Agregar Tiempo
            </Button>
            <Button onClick={() => setMostrarAdicionales(true)} variant="outline" size="sm">
              <Plus className="w-4 h-4 mr-2" />
              Adicionales
            </Button>
            <Button onClick={() => setMostrarBoutique(true)} variant="outline" size="sm">
              <ShoppingBag className="w-4 h-4 mr-2" />
              Boutique
            </Button>
            <Button onClick={() => setMostrarFinalizar(true)} className="bg-green-600 hover:bg-green-700" size="sm">
              <CheckCircle className="w-4 h-4 mr-2" />
              Finalizar
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Modal: Agregar Tiempo Adicional */}
      <Dialog open={mostrarTiempoExtra} onOpenChange={setMostrarTiempoExtra}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-primary" />
              Agregar Tiempo Adicional
            </DialogTitle>
            <DialogDescription>
              Extiende la duración del servicio actual
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label>Tiempo a Agregar</Label>
              <Select value={tiempoAdicional} onValueChange={(v) => setTiempoAdicional(v as any)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="30 minutos">30 minutos - $80,000</SelectItem>
                  <SelectItem value="1 hora">1 hora - $150,000</SelectItem>
                  <SelectItem value="2 horas">2 horas - $280,000</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Método de Pago</Label>
              <Select value={metodoPagoTiempo} onValueChange={(v) => setMetodoPagoTiempo(v as any)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Efectivo">Efectivo</SelectItem>
                  <SelectItem value="QR">QR Bancolombia</SelectItem>
                  <SelectItem value="Nequi">Nequi</SelectItem>
                  <SelectItem value="Daviplata">Daviplata</SelectItem>
                  <SelectItem value="Datafono">Datafono</SelectItem>
                  <SelectItem value="Convenio">Convenio</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {metodoPagoTiempo !== 'Efectivo' && (
              <div>
                <Label>Subir Comprobante</Label>
                <Input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setArchivoComprobanteTiempo(e.target.files?.[0] || null)}
                />
                {archivoComprobanteTiempo && (
                  <div className="flex items-center gap-2 mt-2">
                    <ImageIcon className="w-4 h-4 text-primary" />
                    <p className="text-sm text-muted-foreground">{archivoComprobanteTiempo.name}</p>
                  </div>
                )}
              </div>
            )}

            <div className="p-3 bg-primary/10 rounded-lg border border-primary/30">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Costo:</span>
                <span className="text-xl font-bold text-primary">
                  ${COSTOS_TIEMPO_ADICIONAL[tiempoAdicional].toLocaleString('es-CO')}
                </span>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setMostrarTiempoExtra(false)}>
              Cancelar
            </Button>
            <Button onClick={handleAgregarTiempo} disabled={subiendoTiempo}>
              {subiendoTiempo ? 'Subiendo...' : 'Agregar Tiempo'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal: Agregar Adicionales */}
      <Dialog open={mostrarAdicionales} onOpenChange={setMostrarAdicionales}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="w-5 h-5 text-primary" />
              Agregar Adicional
            </DialogTitle>
            <DialogDescription>
              Agrega servicios o conceptos adicionales al servicio
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label>Descripción</Label>
              <Input
                placeholder="Ej: Bebida, Propina, etc."
                value={descripcionAdicional}
                onChange={(e) => setDescripcionAdicional(e.target.value)}
              />
            </div>

            <div>
              <Label>Costo</Label>
              <Input
                type="number"
                placeholder="0"
                value={costoAdicional}
                onChange={(e) => setCostoAdicional(e.target.value)}
              />
            </div>

            <div>
              <Label>Método de Pago</Label>
              <Select value={metodoPagoAdicional} onValueChange={(v) => setMetodoPagoAdicional(v as any)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Efectivo">Efectivo</SelectItem>
                  <SelectItem value="QR">QR Bancolombia</SelectItem>
                  <SelectItem value="Nequi">Nequi</SelectItem>
                  <SelectItem value="Daviplata">Daviplata</SelectItem>
                  <SelectItem value="Datafono">Datafono</SelectItem>
                  <SelectItem value="Convenio">Convenio</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {metodoPagoAdicional !== 'Efectivo' && (
              <div>
                <Label>Subir Comprobante</Label>
                <Input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setArchivoComprobanteAdicional(e.target.files?.[0] || null)}
                />
                {archivoComprobanteAdicional && (
                  <div className="flex items-center gap-2 mt-2">
                    <ImageIcon className="w-4 h-4 text-primary" />
                    <p className="text-sm text-muted-foreground">{archivoComprobanteAdicional.name}</p>
                  </div>
                )}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setMostrarAdicionales(false)}>
              Cancelar
            </Button>
            <Button onClick={handleAgregarAdicional} disabled={subiendoAdicional}>
              {subiendoAdicional ? 'Subiendo...' : 'Agregar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal: Venta de Boutique */}
      <Dialog open={mostrarBoutique} onOpenChange={setMostrarBoutique}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-primary" />
              Boutique - Venta en Servicio
            </DialogTitle>
            <DialogDescription>
              Precios especiales durante el servicio activo
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto space-y-4 pr-2">
            {/* Catálogo de productos */}
            <div>
              <Label className="text-base font-semibold mb-3 block">Productos Disponibles</Label>
              
              {inventario.filter(p => p.stock > 0).length === 0 ? (
                <div className="text-center py-8">
                  <ShoppingBag className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
                  <p className="text-muted-foreground">No hay productos disponibles</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {inventario
                    .filter(p => p.stock > 0)
                    .map((producto) => {
                      const yaAgregado = productosAgregados.find(p => p.productoId === producto.id);
                      
                      return (
                        <div 
                          key={producto.id}
                          className={`relative bg-secondary rounded-lg overflow-hidden border-2 transition-all cursor-pointer hover:shadow-lg ${
                            yaAgregado ? 'border-primary ring-2 ring-primary/20' : 'border-border hover:border-primary/50'
                          }`}
                          onClick={() => setProductoSeleccionado(producto.id.toString())}
                        >
                          {/* Imagen del producto */}
                          <div className="aspect-square overflow-hidden relative">
                            <img 
                              src={producto.imagen} 
                              alt={producto.nombre}
                              className="w-full h-full object-cover"
                            />
                            {yaAgregado && (
                              <div className="absolute top-2 right-2 w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                                <CheckCircle className="w-4 h-4 text-primary-foreground" />
                              </div>
                            )}
                            {producto.stock <= 5 && (
                              <div className="absolute top-2 left-2">
                                <Badge className="text-xs bg-yellow-500">
                                  ¡{producto.stock} left!
                                </Badge>
                              </div>
                            )}
                          </div>

                          {/* Info del producto */}
                          <div className="p-3 space-y-2">
                            <div>
                              <h4 className="font-semibold text-sm line-clamp-1">{producto.nombre}</h4>
                              <p className="text-xs text-muted-foreground line-clamp-1">{producto.categoria}</p>
                            </div>
                            
                            <div className="flex items-baseline gap-2">
                              <p className="text-lg font-bold text-primary">
                                ${(producto.precioServicio || 0).toLocaleString('es-CO')}
                              </p>
                              <p className="text-xs text-muted-foreground line-through">
                                ${(producto.precioRegular || 0).toLocaleString('es-CO')}
                              </p>
                            </div>

                            {/* Selector de cantidad si está seleccionado */}
                            {productoSeleccionado === producto.id.toString() && (
                              <div className="flex items-center gap-2 pt-2 border-t">
                                <Label className="text-xs">Cant:</Label>
                                <Input
                                  type="number"
                                  min="1"
                                  max={producto.stock}
                                  value={cantidadProducto}
                                  onChange={(e) => {
                                    const val = parseInt(e.target.value) || 1;
                                    setCantidadProducto(Math.min(val, producto.stock));
                                  }}
                                  className="h-8 text-sm"
                                  onClick={(e) => e.stopPropagation()}
                                />
                                <Button 
                                  size="sm" 
                                  className="h-8 flex-1"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleAgregarProducto();
                                    setProductoSeleccionado('');
                                    setCantidadProducto(1);
                                  }}
                                >
                                  <Plus className="w-3 h-3 mr-1" />
                                  Add
                                </Button>
                              </div>
                            )}

                            {yaAgregado && (
                              <div className="text-xs text-primary font-medium pt-1">
                                ✓ {yaAgregado.cantidad} en carrito
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}
            </div>

            {/* Carrito de productos agregados */}
            {productosAgregados.length > 0 && (
              <div className="space-y-3 pt-4 border-t">
                <Label className="text-base font-semibold">Carrito ({productosAgregados.length})</Label>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {productosAgregados.map((p, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 bg-secondary/50 rounded-lg border border-border">
                      {/* Imagen miniatura */}
                      <div className="w-12 h-12 rounded overflow-hidden flex-shrink-0">
                        <img 
                          src={inventario.find(inv => inv.id === p.productoId)?.imagen || ''} 
                          alt={p.nombre}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      
                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm truncate">{p.nombre}</p>
                        <p className="text-xs text-muted-foreground">
                          {p.cantidad} × ${(p.precioUnitario || 0).toLocaleString('es-CO')}
                        </p>
                      </div>
                      
                      {/* Total */}
                      <div className="text-right">
                        <p className="font-bold text-primary">${(p.total || 0).toLocaleString('es-CO')}</p>
                      </div>
                      
                      {/* Botón eliminar */}
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 w-8 p-0 hover:bg-destructive/20 hover:text-destructive"
                        onClick={() => setProductosAgregados(prev => prev.filter((_, idx) => idx !== i))}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>

                {/* Total general */}
                <div className="p-4 bg-primary/10 rounded-lg border-2 border-primary/30">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-base">Total Boutique:</span>
                    <span className="text-2xl font-bold text-primary">
                      ${productosAgregados.reduce((sum, p) => sum + p.total, 0).toLocaleString('es-CO')}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="border-t pt-4 mt-4">
            <Button variant="outline" onClick={() => setMostrarBoutique(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleConfirmarBoutique} 
              disabled={productosAgregados.length === 0}
              className="min-w-[140px]"
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Confirmar Venta
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal: Finalizar Servicio */}
      <Dialog open={mostrarFinalizar} onOpenChange={setMostrarFinalizar}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-500" />
              Finalizar Servicio
            </DialogTitle>
            <DialogDescription>
              Confirma la finalización del servicio
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="p-4 bg-secondary rounded-lg space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Duración total:</span>
                <span className="font-semibold">{servicio.duracionMinutos} minutos</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Costo total:</span>
                <span className="font-bold text-primary text-lg">${costoTotal.toLocaleString('es-CO')}</span>
              </div>
            </div>

            <div>
              <Label>Notas de Cierre (opcional)</Label>
              <Textarea
                placeholder="Observaciones finales del servicio..."
                value={notasCierre}
                onChange={(e) => setNotasCierre(e.target.value)}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setMostrarFinalizar(false)}>
              Cancelar
            </Button>
            <Button onClick={handleFinalizar} className="bg-green-600 hover:bg-green-700">
              Finalizar Servicio
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal: Reporte Final */}
      <Dialog open={mostrarReporte} onOpenChange={setMostrarReporte}>
        <DialogContent className="w-[95vw] max-w-md max-h-[90vh] flex flex-col p-0">
          <DialogHeader className="pb-3 px-4 pt-4 sm:px-6 sm:pt-6 border-b">
            <DialogTitle className="flex items-center gap-2 text-sm sm:text-base">
              <Receipt className="w-4 h-4 sm:w-5 sm:h-5 text-primary flex-shrink-0" />
              <span className="break-words">Reporte de Servicio</span>
            </DialogTitle>
            <DialogDescription className="text-xs sm:text-sm">
              Resumen completo del servicio finalizado
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto px-4 py-3 sm:px-6 sm:py-4 space-y-3 sm:space-y-4">
            {/* Información del servicio */}
            <div className="p-3 sm:p-4 bg-secondary/50 rounded-lg">
              <h3 className="font-semibold text-xs sm:text-sm mb-2 text-primary">INFORMACIÓN GENERAL</h3>
              <div className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm">
                <div className="flex justify-between items-start gap-2">
                  <span className="text-muted-foreground flex-shrink-0">Modelo:</span>
                  <span className="font-semibold text-right break-words">{servicio.modeloNombre}</span>
                </div>
                <div className="flex justify-between items-start gap-2">
                  <span className="text-muted-foreground flex-shrink-0">Cliente:</span>
                  <span className="font-semibold text-right break-words">{servicio.clienteNombre || 'Anónimo'}</span>
                </div>
                <div className="flex justify-between items-start gap-2">
                  <span className="text-muted-foreground flex-shrink-0">Tipo:</span>
                  <span className="font-semibold text-right">{servicio.tipoServicio}</span>
                </div>
                {servicio.habitacion && (
                  <div className="flex justify-between items-start gap-2">
                    <span className="text-muted-foreground flex-shrink-0">Habitación:</span>
                    <span className="font-semibold text-right">{servicio.habitacion}</span>
                  </div>
                )}
                <div className="flex justify-between items-start gap-2">
                  <span className="text-muted-foreground flex-shrink-0">Hora inicio:</span>
                  <span className="font-semibold text-right whitespace-nowrap">{servicio.horaInicio.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
                <div className="flex justify-between items-start gap-2">
                  <span className="text-muted-foreground flex-shrink-0">Hora fin:</span>
                  <span className="font-semibold text-right whitespace-nowrap">{servicio.horaFin?.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              </div>
            </div>

            {/* Desglose de costos */}
            <div className="p-3 sm:p-4 bg-primary/5 rounded-lg border border-primary/20">
              <h3 className="font-semibold text-xs sm:text-sm mb-2 text-primary">DESGLOSE DE COSTOS</h3>
              <div className="space-y-1.5 sm:space-y-2">
                {/* Servicio base */}
                <div className="flex justify-between items-start gap-2">
                  <span className="text-xs sm:text-sm text-muted-foreground flex-shrink-0">Servicio base ({servicio.tiempoServicio})</span>
                  <span className="font-semibold text-sm sm:text-base whitespace-nowrap">${servicio.costoServicio.toLocaleString('es-CO')}</span>
                </div>

                {/* Tiempos adicionales */}
                {servicio.tiemposAdicionales && servicio.tiemposAdicionales.length > 0 && (
                  <>
                    {servicio.tiemposAdicionales.map((t, i) => (
                      <div key={i} className="flex justify-between items-start gap-2 pl-2 border-l-2 border-primary/30">
                        <span className="text-xs sm:text-sm text-muted-foreground flex-shrink-0">+ Tiempo ({t.tiempo})</span>
                        <span className="font-semibold text-sm sm:text-base whitespace-nowrap">${t.costo.toLocaleString('es-CO')}</span>
                      </div>
                    ))}
                  </>
                )}

                {/* Adicionales extra */}
                {servicio.adicionalesExtra && servicio.adicionalesExtra.length > 0 && (
                  <>
                    {servicio.adicionalesExtra.map((a, i) => (
                      <div key={i} className="flex justify-between items-start gap-2 pl-2 border-l-2 border-primary/30">
                        <span className="text-xs sm:text-sm text-muted-foreground break-words flex-1 min-w-0">+ {a.descripcion}</span>
                        <span className="font-semibold text-sm sm:text-base whitespace-nowrap flex-shrink-0">${a.costo.toLocaleString('es-CO')}</span>
                      </div>
                    ))}
                  </>
                )}

                {/* Adicionales antiguos (compatibilidad) */}
                {servicio.costoAdicionales > 0 && (
                  <div className="flex justify-between items-start gap-2 pl-2 border-l-2 border-primary/30">
                    <span className="text-xs sm:text-sm text-muted-foreground break-words flex-1 min-w-0">+ {servicio.adicionales || 'Adicionales'}</span>
                    <span className="font-semibold text-sm sm:text-base whitespace-nowrap flex-shrink-0">${servicio.costoAdicionales.toLocaleString('es-CO')}</span>
                  </div>
                )}

                {/* Consumos detallados */}
                {servicio.consumosDetallados && servicio.consumosDetallados.length > 0 && (
                  <>
                    {servicio.consumosDetallados.map((c, i) => (
                      <div key={i} className="flex justify-between items-start gap-2 pl-2 border-l-2 border-primary/30">
                        <span className="text-xs sm:text-sm text-muted-foreground break-words flex-1 min-w-0">+ {c.descripcion}</span>
                        <span className="font-semibold text-sm sm:text-base whitespace-nowrap flex-shrink-0">${c.costo.toLocaleString('es-CO')}</span>
                      </div>
                    ))}
                  </>
                )}

                {/* Consumo antiguo (compatibilidad) */}
                {servicio.costoConsumo > 0 && !servicio.consumosDetallados?.length && (
                  <div className="flex justify-between items-start gap-2 pl-2 border-l-2 border-primary/30">
                    <span className="text-xs sm:text-sm text-muted-foreground break-words flex-1 min-w-0">+ {servicio.consumo || 'Consumo'}</span>
                    <span className="font-semibold text-sm sm:text-base whitespace-nowrap flex-shrink-0">${servicio.costoConsumo.toLocaleString('es-CO')}</span>
                  </div>
                )}

                <Separator className="my-2" />

                <div className="flex justify-between items-center pt-1 bg-primary/10 -mx-3 px-3 py-2 rounded">
                  <span className="font-bold text-sm sm:text-base">TOTAL:</span>
                  <span className="text-base sm:text-lg font-bold text-primary whitespace-nowrap">
                    ${costoTotal.toLocaleString('es-CO')}
                  </span>
                </div>
              </div>
            </div>

            {/* Método de pago */}
            <div className="p-3 sm:p-4 bg-secondary/50 rounded-lg">
              <div className="flex justify-between items-start gap-2 mb-1.5">
                <span className="font-semibold text-xs sm:text-sm text-muted-foreground flex-shrink-0">Método de Pago:</span>
                <span className="text-sm sm:text-base font-bold text-primary text-right">{servicio.metodoPago}</span>
              </div>
              {servicio.comprobantePago && (
                <div className="mt-2">
                  <p className="text-xs sm:text-sm text-muted-foreground font-medium mb-1">Comprobante:</p>
                  <p className="text-xs text-muted-foreground break-all bg-secondary/30 p-2 rounded">
                    {servicio.comprobantePago}
                  </p>
                </div>
              )}
            </div>

            {/* Notas */}
            {notasCierre && (
              <div className="p-3 sm:p-4 bg-secondary/50 rounded-lg">
                <h3 className="font-semibold text-xs sm:text-sm mb-1.5 text-primary">NOTAS DE CIERRE</h3>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed break-words">{notasCierre}</p>
              </div>
            )}
          </div>

          <DialogFooter className="px-4 py-3 sm:px-6 sm:py-4 border-t flex-shrink-0">
            <Button 
              onClick={() => {
                setMostrarReporte(false);
                onFinalizar?.();
              }} 
              className="w-full h-11 font-semibold"
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Cerrar Reporte
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}