import { useState, useRef } from 'react';
import { X, Upload, DollarSign, Package, Tag, Image as ImageIcon } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { toast } from 'sonner@2.0.3';
import { useInventory, Producto } from '../src/app/components/InventoryContext'; // ✅ Importar Producto desde el contexto

interface GestionBoutiqueModalProps {
  open: boolean;
  onClose: () => void;
  producto?: Producto | null;
  modo: 'crear' | 'editar';
}

export function GestionBoutiqueModal({ open, onClose, producto, modo }: GestionBoutiqueModalProps) {
  const { agregarProducto, actualizarProducto } = useInventory();
  const [imagePreview, setImagePreview] = useState<string>(producto?.imagen || '');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    nombre: producto?.nombre || '',
    precioRegular: producto?.precioRegular || 0,
    precioServicio: producto?.precioServicio || 0,
    stock: producto?.stock || 0,
    categoria: producto?.categoria || '',
    descripcion: producto?.descripcion || '',
    imagen: producto?.imagen || '',
  });

  const categorias = [
    'Bebidas',
    'Snacks',
    'Cigarrillos',
    'Preservativos',
    'Lubricantes',
    'Juguetes',
    'Accesorios',
    'Ropa Interior',
    'Otro',
  ];

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validar tamaño (máximo 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('La imagen no debe superar los 5MB');
        return;
      }

      // Validar tipo
      if (!file.type.startsWith('image/')) {
        toast.error('Solo se permiten archivos de imagen');
        return;
      }

      // Convertir a base64 para preview
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        setImagePreview(base64);
        setFormData(prev => ({ ...prev, imagen: base64 }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validaciones
    if (!formData.nombre.trim()) {
      toast.error('El nombre del producto es obligatorio');
      return;
    }

    if (formData.precioRegular <= 0) {
      toast.error('El precio regular debe ser mayor a 0');
      return;
    }

    if (formData.precioServicio <= 0) {
      toast.error('El precio en servicio debe ser mayor a 0');
      return;
    }

    if (formData.stock < 0) {
      toast.error('El stock no puede ser negativo');
      return;
    }

    if (!formData.categoria) {
      toast.error('Selecciona una categoría');
      return;
    }

    // ✅ Manejo asíncrono con async/await
    const guardarProducto = async () => {
      try {
        if (modo === 'crear') {
          await agregarProducto(formData);
          toast.success(`Producto "${formData.nombre}" agregado a la boutique`);
        } else if (modo === 'editar' && producto) {
          await actualizarProducto(producto.id, formData);
          toast.success(`Producto "${formData.nombre}" actualizado`);
        }

        onClose();
        
        // Reset form
        setFormData({
          nombre: '',
          precioRegular: 0,
          precioServicio: 0,
          stock: 0,
          categoria: '',
          descripcion: '',
          imagen: '',
        });
        setImagePreview('');
      } catch (error) {
        console.error('Error guardando producto:', error);
        toast.error('Error al guardar el producto en la base de datos');
      }
    };

    guardarProducto();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-card border border-primary/20 rounded-lg w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-card border-b border-primary/20 p-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-foreground">
              {modo === 'crear' ? 'Agregar Producto' : 'Editar Producto'}
            </h2>
            <p className="text-sm text-foreground/80 mt-1">
              {modo === 'crear' 
                ? 'Completa la información del nuevo producto'
                : 'Actualiza la información del producto'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Imagen del producto */}
          <div className="space-y-3">
            <Label className="text-white flex items-center gap-2">
              <ImageIcon className="w-4 h-4 text-primary" />
              Imagen del Producto
            </Label>
            
            <div className="flex gap-4">
              {/* Preview */}
              <div className="w-32 h-32 rounded-lg border-2 border-dashed border-white/20 bg-white/5 flex items-center justify-center overflow-hidden">
                {imagePreview ? (
                  <img 
                    src={imagePreview} 
                    alt="Preview" 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="text-center">
                    <ImageIcon className="w-8 h-8 text-gray-500 mx-auto mb-1" />
                    <p className="text-xs text-gray-500">Sin imagen</p>
                  </div>
                )}
              </div>

              {/* Upload button */}
              <div className="flex-1 flex flex-col justify-center gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  {imagePreview ? 'Cambiar Imagen' : 'Subir Imagen'}
                </Button>
                <p className="text-xs text-gray-500">
                  JPG, PNG o GIF. Máximo 5MB.
                </p>
              </div>
            </div>
          </div>

          {/* Grid de campos principales */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Nombre */}
            <div className="md:col-span-2 space-y-2">
              <Label htmlFor="nombre" className="text-white flex items-center gap-2">
                <Package className="w-4 h-4 text-primary" />
                Nombre del Producto *
              </Label>
              <Input
                id="nombre"
                value={formData.nombre}
                onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                placeholder="Ej: Cerveza Corona, Condones Durex, etc."
                className="bg-white/5 border-white/10 text-white"
                required
              />
            </div>

            {/* Precio Regular */}
            <div className="space-y-2">
              <Label htmlFor="precioRegular" className="text-white flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-green-500" />
                Precio Regular *
              </Label>
              <Input
                id="precioRegular"
                type="number"
                min="0"
                step="0.01"
                value={formData.precioRegular}
                onChange={(e) => setFormData({ ...formData, precioRegular: parseFloat(e.target.value) || 0 })}
                placeholder="0.00"
                className="bg-white/5 border-white/10 text-white"
                required
              />
              <p className="text-xs text-gray-500">Precio para venta normal</p>
            </div>

            {/* Precio en Servicio */}
            <div className="space-y-2">
              <Label htmlFor="precioServicio" className="text-white flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-primary" />
                Precio en Servicio *
              </Label>
              <Input
                id="precioServicio"
                type="number"
                min="0"
                step="0.01"
                value={formData.precioServicio}
                onChange={(e) => setFormData({ ...formData, precioServicio: parseFloat(e.target.value) || 0 })}
                placeholder="0.00"
                className="bg-white/5 border-white/10 text-white"
                required
              />
              <p className="text-xs text-gray-500">Precio cuando modelo está en servicio</p>
            </div>

            {/* Stock */}
            <div className="space-y-2">
              <Label htmlFor="stock" className="text-white flex items-center gap-2">
                <Package className="w-4 h-4 text-blue-500" />
                Stock Inicial *
              </Label>
              <Input
                id="stock"
                type="number"
                min="0"
                value={formData.stock}
                onChange={(e) => setFormData({ ...formData, stock: parseInt(e.target.value) || 0 })}
                placeholder="0"
                className="bg-white/5 border-white/10 text-white"
                required
              />
              <p className="text-xs text-gray-500">Unidades disponibles</p>
            </div>

            {/* Categoría */}
            <div className="space-y-2">
              <Label htmlFor="categoria" className="text-white flex items-center gap-2">
                <Tag className="w-4 h-4 text-purple-500" />
                Categoría *
              </Label>
              <select
                id="categoria"
                value={formData.categoria}
                onChange={(e) => setFormData({ ...formData, categoria: e.target.value })}
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-primary"
                required
              >
                <option value="" className="bg-gray-900">Seleccionar categoría</option>
                {categorias.map((cat) => (
                  <option key={cat} value={cat} className="bg-gray-900">
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            {/* Descripción */}
            <div className="md:col-span-2 space-y-2">
              <Label htmlFor="descripcion" className="text-white">
                Descripción (Opcional)
              </Label>
              <Textarea
                id="descripcion"
                value={formData.descripcion}
                onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                placeholder="Detalles adicionales del producto..."
                className="bg-white/5 border-white/10 text-white resize-none h-24"
              />
            </div>
          </div>

          {/* Información de precios */}
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                <DollarSign className="w-5 h-5 text-blue-400" />
              </div>
              <div className="flex-1">
                <h4 className="font-medium text-blue-400 mb-1">Sistema de Precios Dual</h4>
                <p className="text-sm text-blue-300/80">
                  El <strong>precio regular</strong> se aplica para ventas directas en la boutique. 
                  El <strong>precio en servicio</strong> se aplica automáticamente cuando el producto 
                  se consume durante un servicio activo de la modelo.
                </p>
              </div>
            </div>
          </div>

          {/* Botones de acción */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              className="flex-1"
            >
              {modo === 'crear' ? 'Agregar Producto' : 'Guardar Cambios'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}