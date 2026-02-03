import { ShoppingCart, X, Plus, Minus, Trash2, CreditCard } from 'lucide-react';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { useCarrito } from '../src/app/components/CarritoContext';
import { Badge } from './ui/badge';

interface CarritoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCheckout: () => void;
}

export function CarritoModal({ isOpen, onClose, onCheckout }: CarritoModalProps) {
  const { carrito, eliminarDelCarrito, actualizarCantidad, obtenerTotal } = useCarrito();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl bg-card backdrop-blur-lg border-primary/30 max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-2xl text-primary flex items-center gap-2">
            <ShoppingCart className="w-6 h-6" />
            Mi Carrito
          </DialogTitle>
          <DialogDescription>
            {carrito.length === 0 ? 'Tu carrito está vacío' : `${carrito.length} producto(s) en tu carrito`}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-3 py-4">
          {carrito.length === 0 ? (
            <div className="text-center py-12">
              <ShoppingCart className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No hay productos en tu carrito</p>
            </div>
          ) : (
            carrito.map((item) => (
              <div 
                key={item.id}
                className="flex items-center gap-4 p-4 bg-secondary rounded-lg border border-border/50"
              >
                <img 
                  src={item.imagen} 
                  alt={item.nombre}
                  className="w-20 h-20 rounded-lg object-cover border border-border"
                />
                
                <div className="flex-1">
                  <h3 className="font-medium">{item.nombre}</h3>
                  <Badge variant="outline" className="text-xs mt-1">{item.categoria}</Badge>
                  <p className="text-lg font-bold text-primary mt-2">
                    ${item.precio.toLocaleString('es-CO')}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => actualizarCantidad(item.id, item.cantidad - 1)}
                    className="w-8 h-8 p-0"
                  >
                    <Minus className="w-4 h-4" />
                  </Button>
                  
                  <span className="w-8 text-center font-medium">{item.cantidad}</span>
                  
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => actualizarCantidad(item.id, item.cantidad + 1)}
                    className="w-8 h-8 p-0"
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>

                <div className="text-right">
                  <p className="text-xs text-muted-foreground">Subtotal</p>
                  <p className="text-lg font-bold text-primary">
                    ${(item.precio * item.cantidad).toLocaleString('es-CO')}
                  </p>
                </div>

                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => eliminarDelCarrito(item.id)}
                  className="text-destructive hover:text-destructive hover:bg-destructive/10"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))
          )}
        </div>

        {carrito.length > 0 && (
          <div className="border-t border-border/50 pt-4 space-y-4">
            <div className="flex items-center justify-between text-lg">
              <span className="font-medium">Total:</span>
              <span className="text-2xl font-bold text-primary">
                ${obtenerTotal().toLocaleString('es-CO')}
              </span>
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={onClose}
                className="flex-1"
              >
                Seguir Comprando
              </Button>
              <Button
                onClick={onCheckout}
                className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
              >
                <CreditCard className="w-4 h-4 mr-2" />
                Proceder al Pago
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
