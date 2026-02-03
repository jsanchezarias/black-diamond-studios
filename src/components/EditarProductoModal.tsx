import { useState, useEffect } from 'react';
import { X, Upload } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { toast } from 'sonner@2.0.3';

interface Producto {
  id: number;
  nombre: string;
  descripcion: string;
  precioRegular: number;
  precioServicio: number;
  stock: number;
  categoria: string;
  imagen: string;
}

interface EditarProductoModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (id: number, producto: Partial<Producto>) => void;
  producto: Producto | null;
}

export function EditarProductoModal({ open, onClose, onSave, producto }: EditarProductoModalProps) {
  const [formData, setFormData] = useState<Producto>({
    id: 0,
    nombre: '',
    descripcion: '',
    precioRegular: 0,
    precioServicio: 0,
    stock: 0,
    categoria: '',
    imagen: '',
  });
  
  const [imagePreview, setImagePreview] = useState<string>('');
  const [imageFile, setImageFile] = useState<File | null>(null);

  // Cargar datos del producto cuando se abre el modal
  useEffect(() => {
    if (producto && open) {
      setFormData(producto);
      setImagePreview(producto.imagen);
    }
  }, [producto, open]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setImagePreview(result);
        setFormData(prev => ({ ...prev, imagen: result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.nombre || !formData.precioRegular || !formData.imagen) {
      alert('Por favor completa todos los campos obligatorios (nombre, precio e imagen)');
      return;
    }

    onSave(formData.id, {
      nombre: formData.nombre,
      descripcion: formData.descripcion,
      precioRegular: formData.precioRegular,
      precioServicio: formData.precioServicio,
      stock: formData.stock,
      categoria: formData.categoria,
      imagen: formData.imagen,
    });

    toast.success('✅ Producto actualizado', {
      description: `${formData.nombre} ha sido actualizado exitosamente.`
    });
    
    onClose();
  };

  const handleCancel = () => {
    setImagePreview('');
    setImageFile(null);
    onClose();
  };

  if (!producto) return null;

  return (
    <Dialog open={open} onOpenChange={handleCancel}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-card backdrop-blur-lg border-primary/30">
        <DialogHeader>
          <DialogTitle className="text-2xl text-primary">Editar Producto</DialogTitle>
          <DialogDescription>
            Actualiza la información del producto
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Image Upload */}
          <div className="space-y-3">
            <Label htmlFor="imagen" className="text-base">
              Imagen del Producto <span className="text-destructive">*</span>
            </Label>
            
            {imagePreview ? (
              <div className="relative">
                <div className="aspect-square w-full max-w-md mx-auto rounded-lg overflow-hidden border-2 border-primary/30">
                  <img 
                    src={imagePreview} 
                    alt="Preview" 
                    className="w-full h-full object-cover"
                  />
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="absolute top-2 right-2 bg-background/80 backdrop-blur-sm"
                  onClick={() => {
                    setImagePreview('');
                    setImageFile(null);
                    setFormData(prev => ({ ...prev, imagen: '' }));
                  }}
                >
                  <X className="w-4 h-4 mr-1" />
                  Cambiar
                </Button>
              </div>
            ) : (
              <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary/50 transition-colors">
                <input
                  id="imagen"
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />
                <label 
                  htmlFor="imagen" 
                  className="cursor-pointer flex flex-col items-center gap-3"
                >
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                    <Upload className="w-8 h-8 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">Haz clic para subir una imagen</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      PNG, JPG o WEBP (máx. 5MB)
                    </p>
                  </div>
                </label>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Nombre */}
            <div className="space-y-2">
              <Label htmlFor="nombre">
                Nombre del Producto <span className="text-destructive">*</span>
              </Label>
              <Input
                id="nombre"
                placeholder="Ej: Perfume Luxury"
                value={formData.nombre}
                onChange={(e) => setFormData(prev => ({ ...prev, nombre: e.target.value }))}
                className="bg-input-background border-border focus:border-primary"
                required
              />
            </div>

            {/* Categoría */}
            <div className="space-y-2">
              <Label htmlFor="categoria">Categoría</Label>
              <select
                id="categoria"
                value={formData.categoria}
                onChange={(e) => setFormData(prev => ({ ...prev, categoria: e.target.value }))}
                className="w-full px-3 py-2 bg-input-background border border-border rounded-md text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="">Selecciona una categoría</option>
                <option value="Licores y cigarrillos">Licores y cigarrillos</option>
                <option value="Magia">Magia</option>
                <option value="Lencería">Lencería</option>
                <option value="Juguetes">Juguetes</option>
                <option value="Farmacia">Farmacia</option>
                <option value="Bebidas">Bebidas</option>
                <option value="Alimentos">Alimentos</option>
              </select>
            </div>
          </div>

          {/* Descripción */}
          <div className="space-y-2">
            <Label htmlFor="descripcion">Descripción</Label>
            <Textarea
              id="descripcion"
              placeholder="Describe el producto, características, materiales, etc."
              value={formData.descripcion}
              onChange={(e) => setFormData(prev => ({ ...prev, descripcion: e.target.value }))}
              rows={4}
              className="bg-input-background border-border focus:border-primary resize-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Precio Regular */}
            <div className="space-y-2">
              <Label htmlFor="precioRegular">
                Precio Regular <span className="text-destructive">*</span>
              </Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  $
                </span>
                <Input
                  id="precioRegular"
                  type="number"
                  min="0"
                  step="1000"
                  placeholder="250000"
                  value={formData.precioRegular || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, precioRegular: parseInt(e.target.value) || 0 }))}
                  className="bg-input-background border-border focus:border-primary pl-7"
                  required
                />
              </div>
            </div>

            {/* Precio Servicio */}
            <div className="space-y-2">
              <Label htmlFor="precioServicio">Precio Servicio</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  $
                </span>
                <Input
                  id="precioServicio"
                  type="number"
                  min="0"
                  step="1000"
                  placeholder="250000"
                  value={formData.precioServicio || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, precioServicio: parseInt(e.target.value) || 0 }))}
                  className="bg-input-background border-border focus:border-primary pl-7"
                />
              </div>
            </div>

            {/* Stock */}
            <div className="space-y-2">
              <Label htmlFor="stock">Stock</Label>
              <Input
                id="stock"
                type="number"
                min="0"
                placeholder="10"
                value={formData.stock || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, stock: parseInt(e.target.value) || 0 }))}
                className="bg-input-background border-border focus:border-primary"
              />
            </div>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-4 border-t border-border/50">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              className="flex-1 border-border/50 hover:bg-secondary"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
            >
              Guardar Cambios
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
