import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import { useState } from 'react';
import { 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  DollarSign,
  Calendar,
  User,
  FileText,
  MessageSquare
} from 'lucide-react';
import { Adelanto } from '../src/app/components/PagosContext';
import { Logo } from '../src/app/components/Logo';

interface GestionarAdelantoModalProps {
  isOpen: boolean;
  onClose: () => void;
  adelanto: Adelanto | null;
  onAprobar: (adelantoId: string) => void;
  onRechazar: (adelantoId: string) => void;
}

export function GestionarAdelantoModal({ 
  isOpen, 
  onClose, 
  adelanto,
  onAprobar,
  onRechazar
}: GestionarAdelantoModalProps) {
  const [accion, setAccion] = useState<'aprobar' | 'rechazar' | null>(null);
  const [notas, setNotas] = useState('');
  const [procesando, setProcesando] = useState(false);
  const [exitoso, setExitoso] = useState(false);

  if (!adelanto) return null;

  const handleConfirmar = () => {
    if (!accion) return;

    setProcesando(true);

    // Simular procesamiento
    setTimeout(() => {
      if (accion === 'aprobar') {
        onAprobar(adelanto.id);
      } else {
        onRechazar(adelanto.id);
      }

      setProcesando(false);
      setExitoso(true);

      // Cerrar después de mostrar éxito
      setTimeout(() => {
        handleClose();
      }, 2000);
    }, 800);
  };

  const handleClose = () => {
    setAccion(null);
    setNotas('');
    setProcesando(false);
    setExitoso(false);
    onClose();
  };

  const handleSeleccionarAccion = (nuevaAccion: 'aprobar' | 'rechazar') => {
    setAccion(nuevaAccion);
    setNotas('');
  };

  // Pantalla de éxito
  if (exitoso) {
    return (
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="max-w-md bg-card backdrop-blur-sm border-primary/30">
          <DialogHeader>
            <DialogTitle className="sr-only">Resultado de la solicitud</DialogTitle>
            <DialogDescription className="sr-only">
              {accion === 'aprobar' ? 'Adelanto aprobado exitosamente' : 'Adelanto rechazado'}
            </DialogDescription>
          </DialogHeader>
          <div className="text-center py-8 space-y-6">
            {/* Logo */}
            <div className="flex justify-center">
              <Logo variant="horizontal" size="lg" />
            </div>

            {/* Ícono de éxito */}
            <div className={`w-20 h-20 rounded-full border-2 flex items-center justify-center mx-auto animate-pulse ${
              accion === 'aprobar' 
                ? 'bg-green-500/20 border-green-500' 
                : 'bg-red-500/20 border-red-500'
            }`}>
              {accion === 'aprobar' ? (
                <CheckCircle className="w-12 h-12 text-green-500" />
              ) : (
                <XCircle className="w-12 h-12 text-red-500" />
              )}
            </div>

            {/* Mensaje */}
            <div>
              <h2 className={`text-2xl font-bold mb-2 ${
                accion === 'aprobar' ? 'text-green-500' : 'text-red-500'
              }`}>
                {accion === 'aprobar' ? '¡Adelanto Aprobado!' : 'Adelanto Rechazado'}
              </h2>
              <p className="text-muted-foreground mb-4">
                {accion === 'aprobar' 
                  ? 'El adelanto ha sido aprobado correctamente' 
                  : 'La solicitud de adelanto ha sido rechazada'}
              </p>
              <div className="bg-secondary border border-white/20 rounded-lg p-4">
                <p className="text-sm text-muted-foreground mb-1">{adelanto.modeloNombre}</p>
                <p className="text-3xl font-bold text-primary">
                  ${adelanto.monto.toLocaleString('es-CO')}
                </p>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // Selección de acción
  if (!accion) {
    return (
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="max-w-2xl bg-card backdrop-blur-sm border-primary/30">
          <DialogHeader>
            <DialogTitle className="text-2xl flex items-center gap-2">
              <FileText className="w-6 h-6 text-primary" />
              Gestionar Solicitud de Adelanto
            </DialogTitle>
            <DialogDescription>
              Revisa los detalles y decide si aprobar o rechazar
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Información de la modelo */}
            <div className="flex items-start gap-4 p-4 bg-secondary rounded-lg border border-white/20">
              <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                <User className="w-6 h-6 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-lg text-white mb-1">
                  {adelanto.modeloNombre}
                </h3>
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    <span>
                      {adelanto.fechaSolicitud.toLocaleDateString('es-CO', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric'
                      })}
                    </span>
                  </div>
                  <span>•</span>
                  <span>
                    {adelanto.fechaSolicitud.toLocaleTimeString('es-CO', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                </div>
              </div>
            </div>

            {/* Monto solicitado */}
            <div className="text-center p-6 bg-gradient-to-br from-primary/10 to-transparent rounded-lg border-2 border-primary/30">
              <p className="text-sm text-muted-foreground mb-2">Monto Solicitado</p>
              <p className="text-5xl font-bold text-primary mb-2">
                ${adelanto.monto.toLocaleString('es-CO')}
              </p>
              <div className="flex items-center justify-center gap-2">
                <div className="h-1 w-20 bg-primary/20 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-primary"
                    style={{ width: `${(adelanto.monto / 50000) * 100}%` }}
                  />
                </div>
                <span className="text-xs text-muted-foreground">
                  {((adelanto.monto / 50000) * 100).toFixed(0)}% del máximo
                </span>
              </div>
            </div>

            {/* Motivo */}
            {adelanto.motivo && (
              <div className="p-4 bg-blue-950/60 border border-blue-500/40 rounded-lg">
                <div className="flex items-start gap-2 mb-2">
                  <MessageSquare className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
                  <p className="text-sm font-semibold text-blue-400">Motivo de la Solicitud:</p>
                </div>
                <p className="text-sm text-muted-foreground pl-6">
                  "{adelanto.motivo}"
                </p>
              </div>
            )}

            {/* Información adicional */}
            <div className="bg-secondary border border-white/20 rounded-lg p-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Email:</span>
                <span className="font-medium">{adelanto.modeloEmail}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">ID de Solicitud:</span>
                <span className="font-mono text-xs">{adelanto.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Estado:</span>
                <Badge variant="outline" className="border-yellow-500/50 text-yellow-500 bg-yellow-500/10">
                  Pendiente
                </Badge>
              </div>
            </div>

            {/* Botones de acción */}
            <div className="grid grid-cols-2 gap-3 pt-4 border-t border-white/10">
              <Button
                onClick={() => handleSeleccionarAccion('rechazar')}
                variant="outline"
                size="lg"
                className="border-red-500/50 text-red-500 hover:bg-red-500/10"
              >
                <XCircle className="w-5 h-5 mr-2" />
                Rechazar
              </Button>
              <Button
                onClick={() => handleSeleccionarAccion('aprobar')}
                size="lg"
                className="bg-green-500 text-white hover:bg-green-600"
              >
                <CheckCircle className="w-5 h-5 mr-2" />
                Aprobar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // Confirmación de acción
  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg bg-card backdrop-blur-lg border-primary/30">
        <DialogHeader>
          <DialogTitle className="text-2xl flex items-center gap-2">
            {accion === 'aprobar' ? (
              <>
                <CheckCircle className="w-6 h-6 text-green-500" />
                Confirmar Aprobación
              </>
            ) : (
              <>
                <XCircle className="w-6 h-6 text-red-500" />
                Confirmar Rechazo
              </>
            )}
          </DialogTitle>
          <DialogDescription>
            {adelanto.modeloNombre} • ${adelanto.monto.toLocaleString('es-CO')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Resumen */}
          <div className={`p-4 rounded-lg border ${
            accion === 'aprobar' 
              ? 'bg-green-500/10 border-green-500/30' 
              : 'bg-red-500/10 border-red-500/30'
          }`}>
            <div className="flex items-start gap-3">
              <AlertCircle className={`w-5 h-5 flex-shrink-0 mt-0.5 ${
                accion === 'aprobar' ? 'text-green-500' : 'text-red-500'
              }`} />
              <div className="text-sm text-muted-foreground">
                {accion === 'aprobar' ? (
                  <>
                    <p className="font-semibold text-green-400 mb-2">
                      Al aprobar este adelanto:
                    </p>
                    <ul className="space-y-1 pl-4">
                      <li className="list-disc">
                        Se agregará ${adelanto.monto.toLocaleString('es-CO')} a las deducciones de la próxima liquidación
                      </li>
                      <li className="list-disc">
                        La modelo recibirá una notificación de aprobación
                      </li>
                      <li className="list-disc">
                        El monto se descontará automáticamente cuando se procese el pago
                      </li>
                    </ul>
                  </>
                ) : (
                  <>
                    <p className="font-semibold text-red-400 mb-2">
                      Al rechazar este adelanto:
                    </p>
                    <ul className="space-y-1 pl-4">
                      <li className="list-disc">
                        La solicitud será marcada como rechazada
                      </li>
                      <li className="list-disc">
                        La modelo recibirá una notificación del rechazo
                      </li>
                      <li className="list-disc">
                        Podrá enviar una nueva solicitud si lo necesita
                      </li>
                    </ul>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Notas opcionales */}
          <div className="space-y-2">
            <Label htmlFor="notas">
              Notas Internas (Opcional)
            </Label>
            <Textarea
              id="notas"
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              placeholder="Agrega cualquier observación o comentario sobre esta decisión..."
              rows={3}
              disabled={procesando}
            />
            <p className="text-xs text-muted-foreground">
              Estas notas son solo para registro interno
            </p>
          </div>

          {/* Botones */}
          <div className="flex gap-3 justify-end pt-4 border-t border-white/10">
            <Button
              variant="outline"
              onClick={() => setAccion(null)}
              disabled={procesando}
            >
              Volver
            </Button>
            <Button
              onClick={handleConfirmar}
              disabled={procesando}
              className={
                accion === 'aprobar'
                  ? 'bg-green-500 text-white hover:bg-green-600'
                  : 'bg-red-500 text-white hover:bg-red-600'
              }
            >
              {procesando ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin mr-2" />
                  Procesando...
                </>
              ) : (
                <>
                  {accion === 'aprobar' ? (
                    <>
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Confirmar Aprobación
                    </>
                  ) : (
                    <>
                      <XCircle className="w-4 h-4 mr-2" />
                      Confirmar Rechazo
                    </>
                  )}
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}