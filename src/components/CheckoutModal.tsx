import { useState } from 'react';
import { CreditCard, Upload, X, CheckCircle, Image as ImageIcon, AlertCircle } from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Label } from './ui/label';
import { Input } from './ui/input';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { useCarrito } from '../src/app/components/CarritoContext';
import { useInventory } from '../src/app/components/InventoryContext';
import { Logo } from '../src/app/components/Logo';
import { toast } from 'sonner@2.0.3';
import { uploadComprobante } from '../src/utils/supabase/uploadComprobante';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  modeloEmail: string;
  modeloNombre: string;
}

export function CheckoutModal({ isOpen, onClose, modeloEmail, modeloNombre }: CheckoutModalProps) {
  const { carrito, obtenerTotal, finalizarCompra } = useCarrito();
  const { actualizarStock } = useInventory();
  
  const [metodoPago, setMetodoPago] = useState<'Efectivo' | 'QR' | 'Nequi' | 'Daviplata' | 'Datafono' | 'Tarjeta'>('Efectivo');
  const [comprobante, setComprobante] = useState<File | null>(null);
  const [urlComprobante, setUrlComprobante] = useState<string>('');
  const [subiendoComprobante, setSubiendoComprobante] = useState(false);
  const [mostrarExito, setMostrarExito] = useState(false);
  const [procesando, setProcesando] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar tamaño (máx 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('El archivo debe pesar menos de 5MB');
      return;
    }

    // Validar tipo
    if (!file.type.startsWith('image/')) {
      toast.error('Solo se permiten imágenes');
      return;
    }

    setComprobante(file);
    
    // Subir a Supabase
    setSubiendoComprobante(true);
    try {
      const url = await uploadComprobante(file, 'comprobantes-boutique');
      setUrlComprobante(url);
      toast.success('Comprobante subido correctamente');
    } catch (error) {
      console.error('Error al subir comprobante:', error);
      toast.error('Error al subir el comprobante');
      setComprobante(null);
    } finally {
      setSubiendoComprobante(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validar que haya comprobante si el método lo requiere
    const requiereComprobante = metodoPago !== 'Efectivo';
    
    if (requiereComprobante && !urlComprobante) {
      toast.error('Debes subir un comprobante de pago');
      return;
    }

    setProcesando(true);

    try {
      // Actualizar stock de cada producto
      for (const item of carrito) {
        actualizarStock(item.productoId, -item.cantidad);
      }

      // Finalizar compra
      finalizarCompra(modeloEmail, modeloNombre, metodoPago, urlComprobante || undefined);
      
      // Mostrar mensaje de éxito
      setMostrarExito(true);
      
      // Cerrar después de 2 segundos
      setTimeout(() => {
        setMostrarExito(false);
        setComprobante(null);
        setUrlComprobante('');
        setMetodoPago('Efectivo');
        onClose();
      }, 2000);
    } catch (error) {
      console.error('Error al finalizar compra:', error);
      toast.error('Error al procesar la compra');
    } finally {
      setProcesando(false);
    }
  };

  if (mostrarExito) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-md bg-card border-primary/30">
          <DialogHeader>
            <DialogTitle className="sr-only">Compra exitosa</DialogTitle>
            <DialogDescription className="sr-only">
              Tu pedido ha sido procesado correctamente
            </DialogDescription>
          </DialogHeader>
          <div className="text-center py-8 space-y-6">
            {/* Logo horizontal */}
            <div className="flex justify-center mb-6">
              <Logo variant="horizontal" size="lg" />
            </div>
            
            <div className="w-20 h-20 rounded-full bg-green-500/20 border-2 border-green-500 flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-12 h-12 text-green-500" />
            </div>
            <h2 className="text-2xl font-bold text-primary mb-2">¡Compra Exitosa!</h2>
            <p className="text-muted-foreground">
              Tu pedido ha sido procesado correctamente
            </p>
            <p className="text-sm text-muted-foreground mt-4">
              Total pagado: <span className="font-bold text-primary">${obtenerTotal().toLocaleString('es-CO')}</span>
            </p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl bg-card backdrop-blur-lg border-primary/30 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl text-primary flex items-center gap-2">
            <CreditCard className="w-6 h-6" />
            Checkout
          </DialogTitle>
          <DialogDescription>
            Completa la información de pago para finalizar tu compra
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Resumen de la compra */}
          <div className="space-y-3">
            <h3 className="font-medium text-lg">Resumen de la Compra</h3>
            <div className="bg-secondary rounded-lg p-4 space-y-2 max-h-60 overflow-y-auto">
              {carrito.map((item) => (
                <div key={item.id} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <img 
                      src={item.imagen} 
                      alt={item.nombre}
                      className="w-10 h-10 rounded object-cover border border-border"
                    />
                    <div>
                      <p className="font-medium">{item.nombre}</p>
                      <p className="text-xs text-muted-foreground">x{item.cantidad}</p>
                    </div>
                  </div>
                  <p className="font-bold text-primary">
                    ${(item.precio * item.cantidad).toLocaleString('es-CO')}
                  </p>
                </div>
              ))}
            </div>
            
            <div className="flex items-center justify-between p-4 bg-primary/10 rounded-lg border border-primary/30">
              <span className="font-medium text-lg">Total a Pagar:</span>
              <span className="text-2xl font-bold text-primary">
                ${obtenerTotal().toLocaleString('es-CO')}
              </span>
            </div>
          </div>

          {/* Método de Pago */}
          <div className="space-y-3">
            <Label className="text-base font-medium">Método de Pago</Label>
            <div className="grid grid-cols-3 gap-3">
              {['Efectivo', 'QR', 'Nequi', 'Daviplata', 'Datafono', 'Tarjeta'].map((metodo) => (
                <button
                  key={metodo}
                  type="button"
                  onClick={() => setMetodoPago(metodo as any)}
                  className={`p-3 rounded-lg border-2 transition-all ${
                    metodoPago === metodo
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  <p className="font-medium text-sm">{metodo}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Comprobante de Pago */}
          {metodoPago !== 'Efectivo' && (
            <div className="space-y-3">
              <Label className="text-base font-medium flex items-center gap-2">
                Comprobante de Pago
                <Badge variant="destructive" className="text-xs">Requerido</Badge>
              </Label>
              
              <div className="space-y-3">
                <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-yellow-200">
                      <p className="font-medium mb-1">Importante</p>
                      <p className="text-yellow-200/80">
                        Asegúrate de subir un comprobante claro que muestre el monto de ${obtenerTotal().toLocaleString('es-CO')} 
                        y la fecha/hora de la transacción.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="relative">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                    id="comprobante-upload"
                  />
                  <label
                    htmlFor="comprobante-upload"
                    className={`
                      flex items-center justify-center gap-3 p-6 rounded-lg border-2 border-dashed cursor-pointer transition-all
                      ${comprobante 
                        ? 'border-green-500/50 bg-green-500/10' 
                        : 'border-border/50 bg-secondary/30 hover:border-primary/50'
                      }
                    `}
                  >
                    {subiendoComprobante ? (
                      <div className="text-center">
                        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                        <p className="text-sm text-muted-foreground">Subiendo comprobante...</p>
                      </div>
                    ) : comprobante ? (
                      <div className="flex items-center gap-3">
                        <CheckCircle className="w-8 h-8 text-green-500" />
                        <div>
                          <p className="font-medium text-white">{comprobante.name}</p>
                          <p className="text-xs text-green-400">Comprobante subido correctamente</p>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center">
                        <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                        <p className="text-sm font-medium text-white mb-1">
                          Subir Comprobante
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Click para seleccionar imagen (máx 5MB)
                        </p>
                      </div>
                    )}
                  </label>
                </div>

                {comprobante && (
                  <div className="relative rounded-lg overflow-hidden border border-border/50">
                    <img 
                      src={URL.createObjectURL(comprobante)}
                      alt="Preview comprobante"
                      className="w-full h-48 object-contain bg-black/50"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setComprobante(null);
                        setUrlComprobante('');
                      }}
                      className="absolute top-2 right-2 bg-black/80 hover:bg-black"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Información de Pasarelas */}
          {metodoPago === 'QR' && (
            <div className="p-4 bg-secondary rounded-lg border border-primary/30">
              <p className="text-sm text-muted-foreground">
                <span className="font-medium text-foreground">📱 Pago con QR:</span> Escanea el código QR proporcionado por el establecimiento y sube el comprobante.
              </p>
            </div>
          )}

          {metodoPago === 'Nequi' && (
            <div className="p-4 bg-secondary rounded-lg border border-primary/30">
              <p className="text-sm text-muted-foreground">
                <span className="font-medium text-foreground">💜 Nequi:</span> Realiza la transferencia y sube una captura de pantalla del comprobante.
              </p>
            </div>
          )}

          {metodoPago === 'Daviplata' && (
            <div className="p-4 bg-secondary rounded-lg border border-primary/30">
              <p className="text-sm text-muted-foreground">
                <span className="font-medium text-foreground">🔴 Daviplata:</span> Realiza la transferencia y sube una captura de pantalla del comprobante.
              </p>
            </div>
          )}

          {metodoPago === 'Tarjeta' && (
            <div className="p-4 bg-secondary rounded-lg border border-primary/30">
              <p className="text-sm text-muted-foreground">
                <span className="font-medium text-foreground">💳 Tarjeta:</span> El pago será procesado mediante datafono. Sube el voucher del pago.
              </p>
            </div>
          )}

          {/* Botones */}
          <div className="flex gap-3 pt-4 border-t border-border/50">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
              disabled={procesando}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
              disabled={procesando || subiendoComprobante || (metodoPago !== 'Efectivo' && !urlComprobante)}
            >
              {procesando ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Procesando...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Confirmar Compra
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}