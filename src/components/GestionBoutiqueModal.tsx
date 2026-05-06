import { useState, useRef } from 'react';
import { X, Upload, DollarSign, Package, Tag, Image as ImageIcon } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { toast } from 'sonner';
import { useInventory, Producto } from '../app/components/InventoryContext'; // ✅ Importar Producto desde el contexto
import { supabase } from '../utils/supabase/info';

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
    // ✅ Nuevos campos: precio inicial (antes/tachado) y precio final (vigente)
    precioInicial: producto?.precioInicial || 0,
    precioFinal: producto?.precioFinal || 0,
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

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar tipo (solo imágenes)
    if (!file.type.startsWith('image/')) {
      toast.error('Formato no válido', { description: 'Por favor selecciona un archivo de imagen (JPG, PNG, GIF).' });
      return;
    }

    // Validar tamaño (máximo 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Imagen demasiado pesada', { description: 'El tamaño máximo permitido es 5MB.' });
      return;
    }

    // Mostrar preview local inmediatamente
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    // Intentar subir a Supabase Storage
    try {
      const ext = file.name.split('.').pop();
      const nombre = `producto-${Date.now()}.${ext}`;
      const { error } = await supabase.storage
        .from('fotos-modelos')
        .upload(nombre, file, { upsert: true });

      if (!error) {
        const { data } = supabase.storage.from('fotos-modelos').getPublicUrl(nombre);
        setImagePreview(data.publicUrl);
        setFormData(prev => ({ ...prev, imagen: data.publicUrl }));
        toast.success('Imagen cargada correctamente');
      } else {
        throw error;
      }
    } catch (err: any) {
      if (process.env.NODE_ENV === 'development') console.error('Error storage:', err);
      toast.error('Error al subir imagen', { description: 'No se pudo guardar en la nube, se usará memoria local temporal.' });
      
      // Fallback a base64 (memoria local) si falla el storage
      const readerFallback = new FileReader();
      readerFallback.onloadend = () => {
        const base64 = readerFallback.result as string;
        setImagePreview(base64);
        setFormData(prev => ({ ...prev, imagen: base64 }));
      };
      readerFallback.readAsDataURL(file);
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

    // ✅ Validación: si hay precio inicial Y final, el inicial debe ser mayor (es el "antes")
    const tieneErrorPrecio = 
      formData.precioInicial > 0 &&
      formData.precioFinal > 0 &&
      formData.precioInicial <= formData.precioFinal;

    if (tieneErrorPrecio) {
      toast.error('El precio inicial debe ser mayor al precio final');
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

    // ✅ Si hay precio final definido, lo usamos también como precioRegular para
    // mantener compatibilidad con carrito/checkout actual
    const datosFinal = {
      ...formData,
      precioRegular: formData.precioFinal > 0 ? formData.precioFinal : formData.precioRegular,
      precioInicial: formData.precioInicial > 0 ? formData.precioInicial : null,
      precioFinal: formData.precioFinal > 0 ? formData.precioFinal : null,
    };

    // ✅ Manejo asíncrono con async/await
    const guardarProducto = async () => {
      try {
        if (modo === 'crear') {
          await agregarProducto(datosFinal);
          toast.success(`Producto "${formData.nombre}" agregado a la boutique`);
        } else if (modo === 'editar' && producto) {
          await actualizarProducto(producto.id, datosFinal);
          toast.success(`Producto "${formData.nombre}" actualizado`);
        }

        onClose();

        // Reset form
        setFormData({
          nombre: '',
          precioRegular: 0,
          precioServicio: 0,
          precioInicial: 0,
          precioFinal: 0,
          stock: 0,
          categoria: '',
          descripcion: '',
          imagen: '',
        });
        setImagePreview('');
      } catch (error) {
        if (process.env.NODE_ENV === 'development') console.error('Error guardando producto:', error);
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

            {/* ✅ Precio Inicial (antes / tachado) */}
            <div className="space-y-2">
              <Label htmlFor="precioInicial" className="text-white flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-orange-400" />
                Precio Inicial (antes)
              </Label>
              <Input
                id="precioInicial"
                type="number"
                min="0"
                step="0.01"
                value={formData.precioInicial}
                onChange={(e) => setFormData({ ...formData, precioInicial: parseFloat(e.target.value) || 0 })}
                placeholder="0.00"
                className="bg-white/5 border-white/10 text-white"
              />
              <p className="text-xs text-gray-500">Se mostrará tachado. Dejar en 0 si no hay descuento.</p>
            </div>

            {/* ✅ Precio Final (vigente / con descuento) */}
            <div className="space-y-2">
              <Label htmlFor="precioFinal" className="text-white flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-pink-500" />
                Precio Final (vigente)
              </Label>
              <Input
                id="precioFinal"
                type="number"
                min="0"
                step="0.01"
                value={formData.precioFinal}
                onChange={(e) => setFormData({ ...formData, precioFinal: parseFloat(e.target.value) || 0 })}
                placeholder="0.00"
                className="bg-white/5 border-white/10 text-white"
              />
              <p className="text-xs text-gray-500">Precio que paga el cliente hoy. Dejar en 0 para usar el regular.</p>
              
              {/* ✅ Error inline si el precio inicial no es mayor al final */}
              {formData.precioInicial > 0 && formData.precioFinal > 0 && formData.precioInicial <= formData.precioFinal && (
                <p className="text-[10px] text-red-500 mt-1 font-medium bg-red-500/10 p-1 rounded border border-red-500/20">
                  ⚠️ El precio inicial debe ser mayor al vigente.
                </p>
              )}
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
                <h4 className="font-medium text-blue-400 mb-1">Sistema de Precios</h4>
                <ul className="text-sm text-blue-300/80 space-y-1 list-disc list-inside">
                  <li><strong>Regular:</strong> precio base de venta directa.</li>
                  <li><strong>En Servicio:</strong> precio cuando se consume durante un servicio activo.</li>
                  <li><strong>Inicial / Final:</strong> opcional. Sirve para mostrar un precio "antes" tachado y un precio "ahora" en oferta. Si llenas <em>Final</em>, el cliente paga ese.</li>
                </ul>
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