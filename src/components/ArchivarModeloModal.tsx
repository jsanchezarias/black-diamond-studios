import { useState } from 'react';
import { Archive, AlertTriangle } from 'lucide-react';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import { Modelo } from '../src/app/components/ModelosContext';

interface ArchivarModeloModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (motivo: string) => void;
  modelo: Modelo | null;
}

export function ArchivarModeloModal({ open, onClose, onConfirm, modelo }: ArchivarModeloModalProps) {
  const [motivo, setMotivo] = useState('');

  const handleConfirm = () => {
    onConfirm(motivo);
    setMotivo('');
    onClose();
  };

  const handleClose = () => {
    setMotivo('');
    onClose();
  };

  if (!modelo) return null;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md bg-card backdrop-blur-lg border-yellow-500/30">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-yellow-500/20 flex items-center justify-center">
              <Archive className="w-6 h-6 text-yellow-400" />
            </div>
            <div>
              <DialogTitle className="text-xl text-yellow-400">Archivar Modelo</DialogTitle>
              <DialogDescription>
                Esta acción moverá la modelo al archivo
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center gap-3 p-3 bg-secondary rounded-lg border border-border/50">
            <img 
              src={modelo.fotoPerfil} 
              alt={modelo.nombre}
              className="w-16 h-16 rounded-full object-cover border-2 border-primary/30"
            />
            <div>
              <p className="font-medium text-lg">{modelo.nombre}</p>
              <p className="text-sm text-muted-foreground">{modelo.email}</p>
              <div className="flex gap-2 mt-1">
                <span className="text-xs text-muted-foreground">
                  {modelo.servicios} servicios
                </span>
                <span className="text-xs text-muted-foreground">•</span>
                <span className="text-xs text-muted-foreground">
                  ${(modelo.ingresos / 1000000).toFixed(1)}M generados
                </span>
              </div>
            </div>
          </div>

          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 space-y-2">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
              <div className="space-y-1 text-sm">
                <p className="font-medium text-yellow-400">¿Qué sucede al archivar?</p>
                <ul className="text-muted-foreground space-y-1">
                  <li>• La modelo ya no podrá iniciar sesión</li>
                  <li>• Se conservará todo su historial y datos</li>
                  <li>• Podrás restaurarla cuando regrese</li>
                  <li>• No se eliminarán sus servicios ni multas</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="motivo">Motivo del archivo (opcional)</Label>
            <Textarea
              id="motivo"
              placeholder="Ej: Renunció, Viaje temporal, Cambio de ciudad..."
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              rows={3}
              className="bg-input-background border-border focus:border-primary resize-none"
            />
            <p className="text-xs text-muted-foreground">
              Este motivo te ayudará a recordar por qué fue archivada
            </p>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={handleClose}
            className="border-border/50 hover:bg-secondary"
          >
            Cancelar
          </Button>
          <Button
            onClick={handleConfirm}
            className="bg-yellow-500 text-black hover:bg-yellow-600"
          >
            <Archive className="w-4 h-4 mr-2" />
            Archivar Modelo
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
