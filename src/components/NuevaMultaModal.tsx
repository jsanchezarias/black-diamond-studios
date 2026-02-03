import { useState } from 'react';
import { X, AlertTriangle } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { useModelos } from '../src/app/components/ModelosContext';

interface NuevaMultaModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (multa: MultaData) => void;
}

export interface MultaData {
  modeloId: number;
  modeloNombre: string;
  concepto: string;
  monto: number;
}

export function NuevaMultaModal({ open, onClose, onSave }: NuevaMultaModalProps) {
  const { modelos } = useModelos();
  const [formData, setFormData] = useState<MultaData>({
    modeloId: 0,
    modeloNombre: '',
    concepto: '',
    monto: 0,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.modeloId || !formData.concepto || formData.monto <= 0) {
      alert('Por favor completa todos los campos correctamente');
      return;
    }

    onSave(formData);
    
    // Reset form
    setFormData({
      modeloId: 0,
      modeloNombre: '',
      concepto: '',
      monto: 0,
    });
    onClose();
  };

  const handleCancel = () => {
    setFormData({
      modeloId: 0,
      modeloNombre: '',
      concepto: '',
      monto: 0,
    });
    onClose();
  };

  const handleModeloChange = (value: string) => {
    const modeloId = parseInt(value);
    const modelo = modelos.find(m => m.id === modeloId);
    if (modelo) {
      setFormData(prev => ({
        ...prev,
        modeloId: modelo.id,
        modeloNombre: modelo.nombre,
      }));
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleCancel}>
      <DialogContent className="max-w-2xl bg-card backdrop-blur-lg border-primary/30">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-destructive" />
            </div>
            <div>
              <DialogTitle className="text-2xl text-primary">Agregar Nueva Multa</DialogTitle>
              <DialogDescription>
                Registra una multa para una modelo
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Selección de Modelo */}
          <div className="space-y-2">
            <Label htmlFor="modelo">
              Modelo <span className="text-destructive">*</span>
            </Label>
            <Select onValueChange={handleModeloChange}>
              <SelectTrigger className="bg-input-background border-border focus:border-primary">
                <SelectValue placeholder="Selecciona una modelo" />
              </SelectTrigger>
              <SelectContent>
                {modelos.map((modelo) => (
                  <SelectItem key={modelo.id} value={modelo.id.toString()}>
                    <div className="flex items-center gap-3">
                      <img 
                        src={modelo.fotoPerfil} 
                        alt={modelo.nombre}
                        className="w-8 h-8 rounded-full object-cover"
                      />
                      <span>{modelo.nombre}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Concepto */}
          <div className="space-y-2">
            <Label htmlFor="concepto">
              Concepto <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="concepto"
              placeholder="Ej: Llegada tarde al servicio, falta sin justificar, daño de material, etc."
              value={formData.concepto}
              onChange={(e) => setFormData(prev => ({ ...prev, concepto: e.target.value }))}
              rows={3}
              className="bg-input-background border-border focus:border-primary resize-none"
              required
            />
            <p className="text-xs text-muted-foreground">
              Describe la razón de la multa de forma clara
            </p>
          </div>

          {/* Monto */}
          <div className="space-y-2">
            <Label htmlFor="monto">
              Monto <span className="text-destructive">*</span>
            </Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">
                $
              </span>
              <Input
                id="monto"
                type="number"
                placeholder="50000"
                min="0"
                step="1000"
                value={formData.monto || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, monto: parseFloat(e.target.value) || 0 }))}
                className="bg-input-background border-border focus:border-primary pl-8"
                required
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Este monto se descontará del balance de la modelo
            </p>
          </div>

          {/* Preview */}
          {formData.modeloId > 0 && formData.monto > 0 && (
            <div className="bg-secondary/50 border border-border/50 rounded-lg p-4">
              <h4 className="text-sm font-semibold text-foreground mb-3">Resumen de Multa</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Modelo:</span>
                  <span className="font-medium text-foreground">{formData.modeloNombre}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Monto:</span>
                  <span className="font-bold text-destructive">
                    ${formData.monto.toLocaleString('es-CO')}
                  </span>
                </div>
              </div>
            </div>
          )}

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
              className="flex-1 bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Registrar Multa
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
