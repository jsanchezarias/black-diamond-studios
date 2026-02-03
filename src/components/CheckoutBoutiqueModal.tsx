import { useState } from 'react';
import { X, CreditCard, Banknote, Smartphone, Upload, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { useCarrito } from '../src/app/components/CarritoContext';
import { useInventory } from '../src/app/components/InventoryContext';
import { toast } from 'sonner@2.0.3';
import { uploadComprobante } from '../src/utils/supabase/uploadComprobante';

interface CheckoutBoutiqueModalProps {
  isOpen: boolean;
  onClose: () => void;
  modeloEmail: string;
  modeloNombre: string;
}

type MetodoPago = 'Efectivo' | 'QR' | 'Nequi' | 'Daviplata' | 'Datafono' | 'Tarjeta';

export function CheckoutBoutiqueModal({ 
  isOpen, 
  onClose, 
  modeloEmail,
  modeloNombre 
}: CheckoutBoutiqueModalProps) {
  const { carrito, obtenerTotal, finalizarCompra } = useCarrito();
  const { actualizarStock } = useInventory();
  const [metodoPago, setMetodoPago] = useState<MetodoPago>('Efectivo');
  const [comprobante, setComprobante] = useState<File | null>(null);
  const [urlComprobante, setUrlComprobante] = useState<string>('');
  const [subiendoComprobante, setSubiendoComprobante] = useState(false);
  const [procesando, setProcesando] = useState(false);

  if (!isOpen) return null;

  const metodosPago: { valor: MetodoPago; icono: any; nombre: string; descripcion: string }[] = [
    { 
      valor: 'Efectivo', 
      icono: Banknote, 
      nombre: 'Efectivo', 
      descripcion: 'Pago en efectivo' 
    },
    { 
      valor: 'QR', 
      icono: Smartphone, 
      nombre: 'QR Bancolombia', 
      descripcion: 'Código QR' 
    },
    { 
      valor: 'Nequi', 
      icono: Smartphone, 
      nombre: 'Nequi', 
      descripcion: 'Transferencia Nequi' 
    },
    { 
      valor: 'Daviplata', 
      icono: Smartphone, 
      nombre: 'Daviplata', 
      descripcion: 'Transferencia Daviplata' 
    },
    { 
      valor: 'Datafono', 
      icono: CreditCard, 
      nombre: 'Datafonó', 
      descripcion: 'Tarjeta débito/crédito' 
    },
    { 
      valor: 'Tarjeta', 
      icono: CreditCard, 
      nombre: 'Tarjeta', 
      descripcion: 'Tarjeta de crédito' 
    },
  ];

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

  const handleFinalizarCompra = async () => {
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
      finalizarCompra(
        modeloEmail,
        modeloNombre,
        metodoPago,
        urlComprobante || undefined
      );

      toast.success('¡Compra realizada con éxito!');
      onClose();
    } catch (error) {
      console.error('Error al finalizar compra:', error);
      toast.error('Error al procesar la compra');
    } finally {
      setProcesando(false);
    }
  };

  const total = obtenerTotal();

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gradient-to-br from-gray-900 to-black border border-white/10 rounded-xl w-full max-w-3xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center">
              <CreditCard className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Finalizar Compra</h2>
              <p className="text-sm text-muted-foreground">
                Selecciona el método de pago
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="text-gray-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Contenido */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Resumen de productos */}
          <div>
            <h3 className="font-semibold text-white mb-3">Resumen de Compra</h3>
            <div className="bg-secondary/30 rounded-lg border border-border/50 divide-y divide-border/30">
              {carrito.map((item) => (
                <div key={item.id} className="flex items-center justify-between p-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded overflow-hidden">
                      <img 
                        src={item.imagen} 
                        alt={item.nombre}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">{item.nombre}</p>
                      <p className="text-xs text-muted-foreground">
                        {item.cantidad} × ${item.precio.toLocaleString('es-CO')}
                      </p>
                    </div>
                  </div>
                  <p className="font-semibold text-white">
                    ${(item.precio * item.cantidad).toLocaleString('es-CO')}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Total */}
          <div className="flex items-center justify-between p-4 bg-primary/10 border border-primary/30 rounded-lg">
            <span className="font-semibold text-white">Total a Pagar</span>
            <span className="text-2xl font-bold text-primary">
              ${total.toLocaleString('es-CO')}
            </span>
          </div>

          {/* Método de pago */}
          <div>
            <h3 className="font-semibold text-white mb-3">Método de Pago</h3>
            <div className="grid grid-cols-2 gap-3">
              {metodosPago.map((metodo) => {
                const Icon = metodo.icono;
                const isSelected = metodoPago === metodo.valor;
                
                return (
                  <button
                    key={metodo.valor}
                    onClick={() => setMetodoPago(metodo.valor)}
                    className={`
                      relative p-4 rounded-lg border-2 transition-all text-left
                      ${isSelected 
                        ? 'border-primary bg-primary/10' 
                        : 'border-border/50 bg-secondary/30 hover:border-primary/50'
                      }
                    `}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`
                        w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0
                        ${isSelected ? 'bg-primary/20' : 'bg-background/50'}
                      `}>
                        <Icon className={`w-5 h-5 ${isSelected ? 'text-primary' : 'text-muted-foreground'}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`font-medium ${isSelected ? 'text-white' : 'text-gray-300'}`}>
                          {metodo.nombre}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {metodo.descripcion}
                        </p>
                      </div>
                    </div>
                    {isSelected && (
                      <div className="absolute top-2 right-2">
                        <CheckCircle className="w-5 h-5 text-primary" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Subir comprobante */}
          {metodoPago !== 'Efectivo' && (
            <div>
              <h3 className="font-semibold text-white mb-3 flex items-center gap-2">
                Comprobante de Pago
                <Badge variant="destructive" className="text-xs">Requerido</Badge>
              </h3>
              
              <div className="space-y-3">
                <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-yellow-200">
                      <p className="font-medium mb-1">Importante</p>
                      <p className="text-yellow-200/80">
                        Asegúrate de subir un comprobante claro que muestre el monto de ${total.toLocaleString('es-CO')} 
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
        </div>

        {/* Footer */}
        <div className="border-t border-white/10 p-6">
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1"
              disabled={procesando}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleFinalizarCompra}
              className="flex-1 bg-primary hover:bg-primary/90"
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
        </div>
      </div>
    </div>
  );
}
