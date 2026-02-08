import { useState } from 'react';
import { useAgendamientos, Agendamiento } from '../src/app/components/AgendamientosContext';
import { useClientes } from '../src/app/components/ClientesContext';
import { Logo } from '../src/app/components/Logo';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Badge } from './ui/badge';
import { CheckCircle, XCircle, UserX, AlertCircle, Clock } from 'lucide-react';

interface CancelarAgendamientoModalProps {
  isOpen: boolean;
  onClose: () => void;
  agendamiento: Agendamiento | null;
  userEmail: string;
  tipo: 'cancelar' | 'no_show'; // Tipo de acción
}

export function CancelarAgendamientoModal({ 
  isOpen, 
  onClose, 
  agendamiento,
  userEmail,
  tipo
}: CancelarAgendamientoModalProps) {
  const agendamientosContext = useAgendamientos();
  const clientesContext = useClientes();
  
  const cancelarAgendamiento = agendamientosContext?.cancelarAgendamiento ?? (async () => {});
  const marcarComoNoShow = agendamientosContext?.marcarComoNoShow ?? (async () => {});
  const agregarServicioACliente = clientesContext?.agregarServicioACliente ?? (async () => {});
  
  const [motivo, setMotivo] = useState('');
  const [error, setError] = useState('');
  const [exitoso, setExitoso] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (loading) return; // Prevenir doble click
    
    setError('');
    setLoading(true);

    // Validaciones
    if (!motivo.trim()) {
      setError('Por favor ingresa un motivo');
      setLoading(false);
      return;
    }

    if (!agendamiento) {
      setLoading(false);
      return;
    }

    try {
      if (tipo === 'cancelar') {
        // Cancelar agendamiento
        await cancelarAgendamiento(agendamiento.id, motivo, userEmail);

        // Registrar en el historial del cliente como cancelado
        await agregarServicioACliente(agendamiento.clienteTelefono, {
          fecha: new Date().toISOString(),
          modeloNombre: agendamiento.modeloNombre,
          tipoServicio: agendamiento.tipoServicio,
          tiempoServicio: agendamiento.tipoServicio,
          duracionMinutos: agendamiento.duracionMinutos,
          monto: 0,
          costoTotal: 0,
          costoServicio: 0,
          costoAdicionales: 0,
          costoConsumo: 0,
          metodoPago: 'N/A',
          notasServicio: `Servicio cancelado. Motivo: ${motivo}`,
          estado: 'cancelado',
          motivoCancelacion: motivo,
          agendamientoId: agendamiento.id,
        });
      } else {
        // Marcar como no show
        await marcarComoNoShow(agendamiento.id, motivo, userEmail);

        // Registrar en el historial del cliente como no show
        await agregarServicioACliente(agendamiento.clienteTelefono, {
          fecha: new Date().toISOString(),
          modeloNombre: agendamiento.modeloNombre,
          tipoServicio: agendamiento.tipoServicio,
          tiempoServicio: agendamiento.tipoServicio,
          duracionMinutos: agendamiento.duracionMinutos,
          monto: 0,
          costoTotal: 0,
          costoServicio: 0,
          costoAdicionales: 0,
          costoConsumo: 0,
          metodoPago: 'N/A',
          notasServicio: `Cliente no se presentó (No Show). Motivo: ${motivo}`,
          estado: 'no_show',
          motivoCancelacion: motivo,
          agendamientoId: agendamiento.id,
        });
      }

      // Mostrar éxito
      setExitoso(true);
      setLoading(false);

      // Cerrar después de 2 segundos
      setTimeout(() => {
        handleClose();
      }, 2000);
    } catch (error) {
      console.error('Error al procesar agendamiento:', error);
      setError('Error al procesar la solicitud. Intenta nuevamente.');
      setLoading(false);
    }
  };

  const handleClose = () => {
    setMotivo('');
    setError('');
    setExitoso(false);
    onClose();
  };

  if (!agendamiento) return null;

  // Pantalla de éxito
  if (exitoso) {
    return (
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="max-w-md bg-[#1a1a24] border-primary/30">
          <DialogHeader>
            <DialogTitle className="sr-only">
              {tipo === 'cancelar' ? 'Agendamiento cancelado' : 'Marcado como No Show'}
            </DialogTitle>
            <DialogDescription className="sr-only">
              El agendamiento ha sido procesado correctamente
            </DialogDescription>
          </DialogHeader>
          <div className="text-center py-8 space-y-6">
            {/* Logo */}
            <div className="flex justify-center">
              <Logo variant="horizontal" size="lg" />
            </div>

            {/* Ícono de éxito */}
            <div className="w-20 h-20 rounded-full bg-green-500/20 border-2 border-green-500 flex items-center justify-center mx-auto animate-pulse">
              <CheckCircle className="w-12 h-12 text-green-500" />
            </div>

            {/* Mensaje */}
            <div>
              <h2 className="text-2xl font-bold text-green-500 mb-2">
                {tipo === 'cancelar' ? '¡Agendamiento Cancelado!' : '¡Marcado como No Show!'}
              </h2>
              <p className="text-muted-foreground mb-4">
                {tipo === 'cancelar' 
                  ? 'El agendamiento ha sido cancelado correctamente'
                  : 'El agendamiento ha sido marcado como No Show'
                }
              </p>
              <div className="bg-secondary/50 border border-white/10 rounded-lg p-4">
                <p className="text-sm font-medium text-foreground mb-1">
                  {agendamiento.clienteNombre}
                </p>
                <p className="text-xs text-muted-foreground">
                  La información se ha agregado al historial del cliente
                </p>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  const titulo = tipo === 'cancelar' ? 'Cancelar Agendamiento' : 'Marcar como No Show';
  const descripcion = tipo === 'cancelar' 
    ? 'Cancela este agendamiento y registra el motivo'
    : 'Marca este agendamiento cuando el cliente no se presente';
  const icono = tipo === 'cancelar' ? XCircle : UserX;
  const IconoComponente = icono;
  const colorIcono = tipo === 'cancelar' ? 'text-orange-500' : 'text-red-500';
  const colorBg = tipo === 'cancelar' ? 'bg-orange-500/20' : 'bg-red-500/20';

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-xl bg-[#1a1a24] backdrop-blur-lg border-primary/30">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className={`w-12 h-12 rounded-full ${colorBg} flex items-center justify-center`}>
              <IconoComponente className={`w-6 h-6 ${colorIcono}`} />
            </div>
            <div>
              <DialogTitle className="text-2xl">{titulo}</DialogTitle>
              <DialogDescription>
                {descripcion}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Información del agendamiento */}
          <div className="bg-secondary/50 border border-white/10 rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Cliente</p>
                <p className="font-semibold text-foreground">{agendamiento.clienteNombre}</p>
                <p className="text-xs text-muted-foreground">{agendamiento.clienteTelefono}</p>
              </div>
              <Badge 
                variant="outline" 
                className={
                  agendamiento.estado === 'confirmado' 
                    ? 'border-green-500/50 text-green-500 bg-green-500/10'
                    : 'border-yellow-500/50 text-yellow-500 bg-yellow-500/10'
                }
              >
                {agendamiento.estado === 'confirmado' ? 'Confirmado' : 'Pendiente'}
              </Badge>
            </div>
            <div className="pt-2 border-t border-white/10 grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Modelo</p>
                <p className="text-sm font-medium">{agendamiento.modeloNombre}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Servicio</p>
                <p className="text-sm font-medium">{agendamiento.tipoServicio}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Fecha</p>
                <p className="text-sm font-medium">
                  {new Date(agendamiento.fecha).toLocaleDateString('es-CO', {
                    weekday: 'short',
                    day: 'numeric',
                    month: 'short',
                  })}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Hora</p>
                <p className="text-sm font-medium flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {agendamiento.hora}
                </p>
              </div>
            </div>
            {agendamiento.notas && (
              <div className="pt-2 border-t border-white/10">
                <p className="text-xs text-muted-foreground mb-1">Notas del agendamiento</p>
                <p className="text-sm">{agendamiento.notas}</p>
              </div>
            )}
          </div>

          {/* Advertencia */}
          <div className={`${tipo === 'cancelar' ? 'bg-orange-500/10 border-orange-500/30' : 'bg-red-500/10 border-red-500/30'} border rounded-lg p-4`}>
            <div className="flex items-start gap-3">
              <AlertCircle className={`w-5 h-5 ${tipo === 'cancelar' ? 'text-orange-500' : 'text-red-500'} flex-shrink-0 mt-0.5`} />
              <div className="space-y-2 text-xs text-muted-foreground">
                <p>
                  <strong className="text-foreground">Importante:</strong>
                </p>
                <ul className="space-y-1 pl-4">
                  <li className="list-disc">
                    Esta acción se registrará en el historial del cliente
                  </li>
                  {tipo === 'no_show' && (
                    <>
                      <li className="list-disc">
                        Los No Shows afectan el rating del cliente
                      </li>
                      <li className="list-disc">
                        Esta información será visible para futuras referencias
                      </li>
                    </>
                  )}
                  <li className="list-disc">
                    El agendamiento no podrá ser reactivado después
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Motivo */}
          <div className="space-y-2">
            <Label htmlFor="motivo" className="text-base">
              Motivo *
            </Label>
            <Textarea
              id="motivo"
              value={motivo}
              onChange={(e) => {
                setMotivo(e.target.value);
                setError('');
              }}
              placeholder={
                tipo === 'cancelar'
                  ? 'Ej: Cliente solicitó cancelación, Cambio de horario, etc.'
                  : 'Ej: Cliente no llegó a la hora acordada, No respondió llamadas, etc.'
              }
              rows={4}
              maxLength={300}
              className="resize-none"
            />
            <div className="flex justify-between items-center">
              <p className="text-xs text-muted-foreground">
                Describe el motivo de {tipo === 'cancelar' ? 'la cancelación' : 'no presentarse'}
              </p>
              <span className="text-xs text-muted-foreground">
                {motivo.length}/300
              </span>
            </div>
          </div>

          {/* Mensaje de error */}
          {error && (
            <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-3">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-destructive flex-shrink-0 mt-0.5" />
                <p className="text-sm text-destructive">{error}</p>
              </div>
            </div>
          )}

          {/* Botones */}
          <div className="flex gap-3 justify-end pt-4 border-t border-white/10">
            <Button
              variant="outline"
              onClick={handleClose}
            >
              Volver
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!motivo.trim() || loading}
              className={
                tipo === 'cancelar'
                  ? 'bg-orange-600 text-white hover:bg-orange-700'
                  : 'bg-red-600 text-white hover:bg-red-700'
              }
            >
              <IconoComponente className="w-4 h-4 mr-2" />
              {tipo === 'cancelar' ? 'Cancelar Agendamiento' : 'Marcar como No Show'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}