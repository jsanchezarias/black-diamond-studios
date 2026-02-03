import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import { AlertCircle, XCircle } from 'lucide-react';

interface RechazarActivacionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (observaciones: string) => void;
  modeloNombre: string;
}

export function RechazarActivacionModal({ isOpen, onClose, onConfirm, modeloNombre }: RechazarActivacionModalProps) {
  const [observaciones, setObservaciones] = useState('');
  const [error, setError] = useState('');

  const handleConfirmar = () => {
    if (!observaciones.trim()) {
      setError('Debes ingresar las observaciones para que la modelo sepa qué corregir');
      return;
    }

    onConfirm(observaciones);
    handleClose();
  };

  const handleClose = () => {
    setObservaciones('');
    setError('');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg bg-card backdrop-blur-lg border-red-500/30">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-red-500/20 border-2 border-red-500/30 flex items-center justify-center">
              <XCircle className="w-6 h-6 text-red-400" />
            </div>
            <div>
              <DialogTitle className="text-xl">Rechazar Activación</DialogTitle>
              <DialogDescription>
                {modeloNombre}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 pt-4">
          {/* Alerta informativa */}
          <div className="p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-yellow-400 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-yellow-400/90">
                La modelo recibirá estas observaciones para saber qué debe corregir antes de volver a solicitar la activación.
              </p>
            </div>
          </div>

          {/* Campo de observaciones */}
          <div className="space-y-2">
            <Label htmlFor="observaciones" className="text-sm font-medium">
              Observaciones <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="observaciones"
              value={observaciones}
              onChange={(e) => {
                setObservaciones(e.target.value);
                setError('');
              }}
              placeholder="Ej: La foto de perfil no cumple con los estándares de calidad. Por favor, sube una foto con mejor iluminación y enfoque."
              rows={5}
              className="bg-secondary/50 resize-none"
            />
            {error && (
              <p className="text-xs text-red-400 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {error}
              </p>
            )}
            <p className="text-xs text-muted-foreground">
              Sé específico sobre qué debe corregir la modelo
            </p>
          </div>

          {/* Ejemplos comunes */}
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Ejemplos comunes:</Label>
            <div className="space-y-1">
              {[
                'Foto de perfil no cumple con estándares de calidad',
                'Documentos de identidad no son legibles',
                'Información de contacto incompleta',
                'Nombre artístico no apropiado',
              ].map((ejemplo, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => setObservaciones(ejemplo)}
                  className="block w-full text-left text-xs text-muted-foreground hover:text-primary transition-colors px-2 py-1 rounded hover:bg-primary/5"
                >
                  • {ejemplo}
                </button>
              ))}
            </div>
          </div>

          {/* Botones */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={handleConfirmar}
              className="flex-1 bg-red-500 hover:bg-red-600 text-white"
            >
              <XCircle className="w-4 h-4 mr-2" />
              Rechazar con Observaciones
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
