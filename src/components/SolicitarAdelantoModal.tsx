import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { usePagos } from '../app/components/PagosContext';
import { toast } from 'sonner';

interface SolicitarAdelantoModalProps {
  isOpen: boolean;
  onClose: () => void;
  modeloEmail: string;
  modeloNombre: string;
}

export function SolicitarAdelantoModal({ isOpen, onClose, modeloEmail, modeloNombre }: SolicitarAdelantoModalProps) {
  const { solicitarAdelanto } = usePagos();
  const [monto, setMonto] = useState('');
  const [concepto, setConcepto] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!monto || !concepto.trim()) {
      toast.error('Completa todos los campos');
      return;
    }
    try {
      await solicitarAdelanto(modeloEmail, modeloNombre, parseFloat(monto), concepto);
      toast.success('Adelanto solicitado');
      setMonto('');
      setConcepto('');
      onClose();
    } catch {
      toast.error('Error al solicitar el adelanto');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Solicitar Adelanto</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Monto</Label>
            <Input
              type="number"
              value={monto}
              onChange={e => setMonto(e.target.value)}
              placeholder="Ingresa el monto"
            />
          </div>
          <div>
            <Label>Concepto</Label>
            <Textarea
              value={concepto}
              onChange={e => setConcepto(e.target.value)}
              placeholder="Motivo del adelanto"
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
            <Button type="submit">Solicitar</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
