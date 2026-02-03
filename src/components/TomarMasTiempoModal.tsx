import { useState } from 'react';
import { X, Clock, DollarSign, Upload, Image as ImageIcon } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { useServicios } from '../src/app/components/ServiciosContext';

interface TomarMasTiempoModalProps {
  isOpen: boolean;
  onClose: () => void;
  servicioId: string | number;
}

export function TomarMasTiempoModal({ isOpen, onClose, servicioId }: TomarMasTiempoModalProps) {
  const { agregarTiempoAdicional } = useServicios();
  
  const [tiempoAdicional, setTiempoAdicional] = useState<'30 minutos' | '1 hora' | '2 horas' | 'Otra'>('30 minutos');
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
    
    if (!costoAdicional) {
      alert('Por favor ingresa el costo del tiempo adicional');
      return;
    }

    agregarTiempoAdicional(servicioId, {
      tiempoAdicional,
      costoAdicional: parseFloat(costoAdicional),
      comprobante: comprobante || undefined,
    });

    // Mostrar confirmación
    alert(`✅ Tiempo adicional agregado\n\nTiempo: ${tiempoAdicional}\nCosto: $${parseFloat(costoAdicional).toLocaleString()}\n\nEl costo se agregará al total del servicio.`);

    // Reset
    setTiempoAdicional('30 minutos');
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
              <Clock className="w-6 h-6" />
              Tomar Más Tiempo
            </h2>
            <p className="text-sm text-muted-foreground mt-1">Agrega tiempo adicional al servicio</p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Selección de Tiempo */}
          <div className="space-y-2">
            <Label>Tiempo Adicional</Label>
            <div className="grid grid-cols-2 gap-3">
              {(['30 minutos', '1 hora', '2 horas', 'Otra'] as const).map((tiempo) => (
                <button
                  key={tiempo}
                  type="button"
                  onClick={() => setTiempoAdicional(tiempo)}
                  className={`p-3 rounded-lg border-2 transition-all font-medium ${
                    tiempoAdicional === tiempo
                      ? 'border-primary bg-[#d4af37] text-[#0a0a0f] shadow-lg shadow-primary/50'
                      : 'border-border bg-[#1a1a24] hover:border-primary/50 text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {tiempo}
                </button>
              ))}
            </div>
          </div>

          {/* Costo del Tiempo Adicional */}
          <div className="space-y-2">
            <Label htmlFor="costoAdicional">
              <DollarSign className="w-4 h-4 inline mr-1" />
              Costo del Tiempo Adicional
            </Label>
            <Input
              id="costoAdicional"
              type="number"
              placeholder="50000"
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

          {/* Botones */}
          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Cancelar
            </Button>
            <Button type="submit" className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90">
              <Clock className="w-4 h-4 mr-2" />
              Agregar Tiempo
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
