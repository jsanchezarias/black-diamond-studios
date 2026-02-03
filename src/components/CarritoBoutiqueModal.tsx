import { X, ShoppingCart, Plus, Minus, Trash2 } from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { useCarrito } from '../src/app/components/CarritoContext';

interface CarritoBoutiqueModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProcederCheckout: () => void;
}

export function CarritoBoutiqueModal({ isOpen, onClose, onProcederCheckout }: CarritoBoutiqueModalProps) {
  const { carrito, eliminarDelCarrito, actualizarCantidad, obtenerTotal, vaciarCarrito } = useCarrito();

  if (!isOpen) return null;

  const handleProceder = () => {
    onClose();
    onProcederCheckout();
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gradient-to-br from-gray-900 to-black border border-white/10 rounded-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center">
              <ShoppingCart className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Carrito de Compras</h2>
              <p className="text-sm text-muted-foreground">
                {carrito.length} {carrito.length === 1 ? 'producto' : 'productos'}
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
        <div className="flex-1 overflow-y-auto p-6">
          {carrito.length === 0 ? (
            <div className="text-center py-12">
              <ShoppingCart className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-semibold text-white mb-2">Tu carrito está vacío</h3>
              <p className="text-sm text-muted-foreground mb-6">
                Agrega productos de la boutique para comenzar
              </p>
              <Button onClick={onClose}>
                Explorar Productos
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {carrito.map((item) => (
                <div 
                  key={item.id}
                  className="flex gap-4 p-4 bg-secondary/50 rounded-lg border border-border/50 hover:border-primary/30 transition-colors"
                >
                  {/* Imagen del producto */}
                  <div className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0">
                    <img 
                      src={item.imagen} 
                      alt={item.nombre}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {/* Info del producto */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-white truncate">{item.nombre}</h3>
                        <Badge variant="outline" className="text-xs mt-1">
                          {item.categoria}
                        </Badge>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => eliminarDelCarrito(item.id)}
                        className="text-red-400 hover:text-red-300 hover:bg-red-500/10 flex-shrink-0"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>

                    {/* Precio y cantidad */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2 bg-background/50 rounded-lg p-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => actualizarCantidad(item.id, item.cantidad - 1)}
                          >
                            <Minus className="w-3 h-3" />
                          </Button>
                          <span className="text-sm font-medium w-8 text-center">
                            {item.cantidad}
                          </span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => actualizarCantidad(item.id, item.cantidad + 1)}
                          >
                            <Plus className="w-3 h-3" />
                          </Button>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          ${item.precio.toLocaleString('es-CO')} c/u
                        </span>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-white">
                          ${(item.precio * item.cantidad).toLocaleString('es-CO')}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer con total y acciones */}
        {carrito.length > 0 && (
          <div className="border-t border-white/10 p-6 space-y-4">
            {/* Subtotal */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="text-white">${obtenerTotal().toLocaleString('es-CO')}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-semibold text-white">Total</span>
                <span className="text-2xl font-bold text-primary">
                  ${obtenerTotal().toLocaleString('es-CO')}
                </span>
              </div>
            </div>

            {/* Botones */}
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  if (window.confirm('¿Estás segura de vaciar el carrito?')) {
                    vaciarCarrito();
                  }
                }}
                className="flex-1"
              >
                Vaciar Carrito
              </Button>
              <Button
                onClick={handleProceder}
                className="flex-1 bg-primary hover:bg-primary/90"
              >
                Proceder al Pago
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
