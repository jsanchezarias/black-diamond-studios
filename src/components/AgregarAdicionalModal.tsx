import { useState } from 'react';
import { X, Plus, DollarSign, Upload, Image as ImageIcon } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { useServicios } from '../src/app/components/ServiciosContext';

interface AgregarAdicionalModalProps {
  isOpen: boolean;
  onClose: () => void;
  servicioId: string | number;
}

export function AgregarAdicionalModal({ isOpen, onClose, servicioId }: AgregarAdicionalModalProps) {
  const { agregarAdicionalAServicio } = useServicios();
  
  const [descripcionAdicional, setDescripcionAdicional] = useState('');
  const [costoAdicional, setCostoAdicional] = useState('');
  const [comprobante, setComprobante] = useState<string | null>(null);
  const [nombreArchivo, setNombreArchivo] = useState('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setNombreArchivo(file.name);
      const reader = new FileReader();
      reader.onloadend = () => {
        setComprobante(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!descripcionAdicional || !costoAdicional) {
      alert('Por favor completa todos los campos requeridos');
      return;
    }

    agregarAdicionalAServicio(servicioId, {
      descripcion: descripcionAdicional,
      costo: parseFloat(costoAdicional),
      comprobante: comprobante || undefined,
    });

    // Mostrar confirmación
    alert(`✅ Adicional agregado\n\n${descripcionAdicional}\nCosto: $${parseFloat(costoAdicional).toLocaleString()}\n\nEl costo se agregará al total del servicio.`);

    // Reset
    setDescripcionAdicional('');
    setCostoAdicional('');
    setComprobante(null);
    setNombreArchivo('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-card border border-primary/30 rounded-lg shadow-2xl max-w-md w-full">
        <div className="bg-card border-b border-border p-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-primary flex items-center gap-2">
              <Plus className="w-6 h-6" />
              Agregar Adicional
            </h2>
            <p className="text-sm text-muted-foreground mt-1">Agrega un servicio adicional</p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Descripción del Adicional */}
          <div className="space-y-2">
            <Label htmlFor="descripcionAdicional">Descripción del Adicional</Label>
            <Textarea
              id="descripcionAdicional"
              placeholder="Ej: Masaje extra, Bebida premium, etc."
              value={descripcionAdicional}
              onChange={(e) => setDescripcionAdicional(e.target.value)}
              required
              rows={3}
              className="resize-none"
            />
            <p className="text-xs text-muted-foreground">
              Describe el servicio adicional que se está agregando
            </p>
          </div>

          {/* Costo del Adicional */}
          <div className="space-y-2">
            <Label htmlFor="costoAdicional">
              <DollarSign className="w-4 h-4 inline mr-1" />
              Costo del Adicional
            </Label>
            <Input
              id="costoAdicional"
              type="number"
              placeholder="30000"
              value={costoAdicional}
              onChange={(e) => setCostoAdicional(e.target.value)}
              required
              className="text-lg"
            />
          </div>

          {/* Comprobante de Pago */}
          <div className="space-y-2">
            <Label htmlFor="comprobante">Comprobante de Pago (Opcional)</Label>
            <div className="space-y-2">
              <label
                htmlFor="comprobante"
                className="flex items-center justify-center gap-2 p-4 border-2 border-dashed border-border rounded-lg hover:border-primary/50 cursor-pointer transition-all"
              >
                <Upload className="w-5 h-5 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  {nombreArchivo || 'Subir comprobante'}
                </span>
              </label>
              <Input
                id="comprobante"
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
              
              {comprobante && (
                <div className="relative p-2 bg-secondary/50 rounded-lg border border-border">
                  <div className="flex items-center gap-2">
                    <ImageIcon className="w-4 h-4 text-primary" />
                    <span className="text-sm flex-1 truncate">{nombreArchivo}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setComprobante(null);
                        setNombreArchivo('');
                      }}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                  <img 
                    src={comprobante} 
                    alt="Comprobante" 
                    className="mt-2 w-full h-32 object-cover rounded-lg"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Total Preview */}
          {costoAdicional && (
            <div className="p-4 bg-primary/10 border-2 border-primary/30 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Costo adicional:</span>
                <span className="text-2xl font-bold text-primary">
                  ${parseFloat(costoAdicional).toLocaleString()}
                </span>
              </div>
            </div>
          )}

          {/* Información */}
          <div className="p-3 bg-secondary/50 border border-border rounded-lg">
            <p className="text-xs text-muted-foreground">
              💡 Este adicional se sumará al costo total del servicio actual. El cliente deberá pagar este monto adicional.
            </p>
          </div>

          {/* Botones */}
          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Cancelar
            </Button>
            <Button type="submit" className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90">
              <Plus className="w-4 h-4 mr-2" />
              Agregar Adicional
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
