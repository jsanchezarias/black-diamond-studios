import { useState } from 'react';
import { Camera, CheckCircle, XCircle, Clock, AlertCircle, User, Calendar, MessageSquare } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import { useAsistencia, SolicitudEntrada } from '../src/app/components/AsistenciaContext';
import { toast } from 'sonner';

interface SolicitudesEntradaPanelProps {
  userEmail: string;
}

export function SolicitudesEntradaPanel({ userEmail }: SolicitudesEntradaPanelProps) {
  const { obtenerSolicitudesPendientes, aprobarSolicitudEntrada, rechazarSolicitudEntrada, solicitudesEntrada } = useAsistencia();
  const [solicitudSeleccionada, setSolicitudSeleccionada] = useState<SolicitudEntrada | null>(null);
  const [accion, setAccion] = useState<'aprobar' | 'rechazar' | null>(null);
  const [comentarios, setComentarios] = useState('');
  const [mostrarModal, setMostrarModal] = useState(false);
  const [mostrarImagenCompleta, setMostrarImagenCompleta] = useState(false);

  const solicitudesPendientes = obtenerSolicitudesPendientes();
  const solicitudesAprobadas = solicitudesEntrada.filter(s => s.estado === 'aprobada');
  const solicitudesRechazadas = solicitudesEntrada.filter(s => s.estado === 'rechazada');

  const abrirModalRevision = (solicitud: SolicitudEntrada, tipo: 'aprobar' | 'rechazar') => {
    setSolicitudSeleccionada(solicitud);
    setAccion(tipo);
    setComentarios('');
    setMostrarModal(true);
  };

  const confirmarAccion = () => {
    if (!solicitudSeleccionada || !accion) return;

    if (accion === 'aprobar') {
      aprobarSolicitudEntrada(solicitudSeleccionada.id, userEmail, comentarios || undefined);
      toast.success(`Entrada aprobada para ${solicitudSeleccionada.modeloNombre}`);
    } else {
      if (!comentarios.trim()) {
        toast.error('Debes proporcionar un motivo para rechazar la solicitud');
        return;
      }
      rechazarSolicitudEntrada(solicitudSeleccionada.id, userEmail, comentarios);
      toast.error(`Entrada rechazada para ${solicitudSeleccionada.modeloNombre}`);
    }

    cerrarModal();
  };

  const cerrarModal = () => {
    setMostrarModal(false);
    setSolicitudSeleccionada(null);
    setAccion(null);
    setComentarios('');
  };

  const verImagenCompleta = (solicitud: SolicitudEntrada) => {
    setSolicitudSeleccionada(solicitud);
    setMostrarImagenCompleta(true);
  };

  return (
    <>
      <Card className="border-primary/30 bg-gradient-to-br from-card to-card/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-primary">
            <Camera className="w-5 h-5" />
            Solicitudes de Entrada
          </CardTitle>
          <CardDescription>
            Revisa y aprueba/rechaza las solicitudes de registro con selfie
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Estadísticas Rápidas */}
          <div className="grid grid-cols-3 gap-3">
            <div className="p-3 bg-yellow-950/30 border-2 border-yellow-500/30 rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <Clock className="w-4 h-4 text-yellow-500" />
                <span className="text-xs text-muted-foreground">Pendientes</span>
              </div>
              <p className="text-2xl font-bold text-yellow-400">{solicitudesPendientes.length}</p>
            </div>
            <div className="p-3 bg-green-950/30 border-2 border-green-500/30 rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span className="text-xs text-muted-foreground">Aprobadas</span>
              </div>
              <p className="text-2xl font-bold text-green-400">{solicitudesAprobadas.length}</p>
            </div>
            <div className="p-3 bg-red-950/30 border-2 border-red-500/30 rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <XCircle className="w-4 h-4 text-red-500" />
                <span className="text-xs text-muted-foreground">Rechazadas</span>
              </div>
              <p className="text-2xl font-bold text-red-400">{solicitudesRechazadas.length}</p>
            </div>
          </div>

          {/* Solicitudes Pendientes */}
          {solicitudesPendientes.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                <Badge className="bg-yellow-500/80 text-white">
                  <Clock className="w-3 h-3 mr-1" />
                  Requieren Atención ({solicitudesPendientes.length})
                </Badge>
              </h4>
              <div className="space-y-3">
                {solicitudesPendientes.map((solicitud) => (
                  <div
                    key={solicitud.id}
                    className="p-4 bg-yellow-950/20 rounded-lg border-2 border-yellow-500/30 hover:border-yellow-500/50 transition-colors"
                  >
                    <div className="flex items-start gap-4">
                      {/* Thumbnail de la selfie */}
                      <div 
                        className="w-20 h-20 rounded-lg overflow-hidden border-2 border-primary/30 cursor-pointer hover:border-primary transition-colors flex-shrink-0"
                        onClick={() => verImagenCompleta(solicitud)}
                      >
                        <img 
                          src={solicitud.selfieUrl} 
                          alt={`Selfie ${solicitud.modeloNombre}`}
                          className="w-full h-full object-cover"
                        />
                      </div>

                      {/* Información */}
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <p className="font-semibold text-lg">{solicitud.modeloNombre}</p>
                            <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                              <div className="flex items-center gap-1">
                                <User className="w-3 h-3" />
                                <span>{solicitud.modeloEmail}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                <span>{solicitud.fecha.toLocaleDateString('es-CO')}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                <span>{solicitud.fecha.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}</span>
                              </div>
                            </div>
                          </div>
                          <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
                            Pendiente
                          </Badge>
                        </div>

                        {/* Botones de acción */}
                        <div className="flex gap-2 mt-3">
                          <Button 
                            size="sm" 
                            className="bg-green-600 hover:bg-green-700"
                            onClick={() => abrirModalRevision(solicitud, 'aprobar')}
                          >
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Aprobar
                          </Button>
                          <Button 
                            size="sm" 
                            variant="destructive"
                            onClick={() => abrirModalRevision(solicitud, 'rechazar')}
                          >
                            <XCircle className="w-3 h-3 mr-1" />
                            Rechazar
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => verImagenCompleta(solicitud)}
                          >
                            Ver Selfie
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {solicitudesPendientes.length === 0 && (
            <div className="text-center p-8 bg-secondary/50 rounded-lg border-2 border-dashed border-border">
              <CheckCircle className="w-16 h-16 mx-auto text-green-500 mb-4" />
              <p className="text-muted-foreground">
                No hay solicitudes pendientes en este momento
              </p>
            </div>
          )}

          {/* Historial (Aprobadas y Rechazadas del día) */}
          {(solicitudesAprobadas.length > 0 || solicitudesRechazadas.length > 0) && (
            <div>
              <h4 className="text-sm font-semibold mb-3">Historial de Hoy</h4>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {[...solicitudesAprobadas, ...solicitudesRechazadas]
                  .sort((a, b) => b.fecha.getTime() - a.fecha.getTime())
                  .slice(0, 10)
                  .map((solicitud) => (
                    <div
                      key={solicitud.id}
                      className={`flex items-center justify-between p-3 rounded-lg border ${
                        solicitud.estado === 'aprobada'
                          ? 'bg-green-950/20 border-green-500/30'
                          : 'bg-red-950/20 border-red-500/30'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-10 h-10 rounded-full overflow-hidden border-2 border-border cursor-pointer"
                          onClick={() => verImagenCompleta(solicitud)}
                        >
                          <img 
                            src={solicitud.selfieUrl} 
                            alt={solicitud.modeloNombre}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div>
                          <p className="font-medium text-sm">{solicitud.modeloNombre}</p>
                          <p className="text-xs text-muted-foreground">
                            {solicitud.fecha.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>
                      <Badge 
                        className={
                          solicitud.estado === 'aprobada'
                            ? 'bg-green-500/20 text-green-400 border-green-500/30'
                            : 'bg-red-500/20 text-red-400 border-red-500/30'
                        }
                      >
                        {solicitud.estado === 'aprobada' ? 'Aprobada' : 'Rechazada'}
                      </Badge>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal de Confirmación de Acción */}
      <Dialog open={mostrarModal} onOpenChange={cerrarModal}>
        <DialogContent className="max-w-lg bg-card backdrop-blur-sm border-primary/30">
          <DialogHeader>
            <DialogTitle className="text-2xl flex items-center gap-2">
              {accion === 'aprobar' ? (
                <>
                  <CheckCircle className="w-6 h-6 text-green-500" />
                  Aprobar Entrada
                </>
              ) : (
                <>
                  <XCircle className="w-6 h-6 text-red-500" />
                  Rechazar Entrada
                </>
              )}
            </DialogTitle>
            <DialogDescription>
              {accion === 'aprobar' 
                ? 'La modelo será registrada automáticamente al aprobar'
                : 'Proporciona un motivo para rechazar la solicitud'
              }
            </DialogDescription>
          </DialogHeader>

          {solicitudSeleccionada && (
            <div className="space-y-4">
              {/* Información de la modelo */}
              <div className="flex items-start gap-4 p-4 bg-secondary rounded-lg border border-border">
                <div className="w-16 h-16 rounded-lg overflow-hidden border-2 border-primary/30">
                  <img 
                    src={solicitudSeleccionada.selfieUrl} 
                    alt={solicitudSeleccionada.modeloNombre}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <p className="font-semibold text-lg">{solicitudSeleccionada.modeloNombre}</p>
                  <p className="text-sm text-muted-foreground">{solicitudSeleccionada.modeloEmail}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Solicitud enviada: {solicitudSeleccionada.fecha.toLocaleTimeString('es-CO', { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </p>
                </div>
              </div>

              {/* Campo de comentarios */}
              <div className="space-y-2">
                <Label htmlFor="comentarios">
                  {accion === 'aprobar' ? 'Comentarios (opcional)' : 'Motivo del rechazo *'}
                </Label>
                <Textarea
                  id="comentarios"
                  placeholder={
                    accion === 'aprobar'
                      ? 'Ej: Bienvenida al turno'
                      : 'Ej: La imagen no es clara, por favor toma otra selfie'
                  }
                  value={comentarios}
                  onChange={(e) => setComentarios(e.target.value)}
                  rows={3}
                  className={accion === 'rechazar' && !comentarios ? 'border-red-500' : ''}
                />
                {accion === 'rechazar' && !comentarios && (
                  <p className="text-xs text-red-500 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    El motivo es obligatorio para rechazar
                  </p>
                )}
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={cerrarModal}>
              Cancelar
            </Button>
            <Button 
              onClick={confirmarAccion}
              className={accion === 'aprobar' ? 'bg-green-600 hover:bg-green-700' : ''}
              variant={accion === 'rechazar' ? 'destructive' : 'default'}
              disabled={accion === 'rechazar' && !comentarios.trim()}
            >
              {accion === 'aprobar' ? (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Aprobar Entrada
                </>
              ) : (
                <>
                  <XCircle className="w-4 h-4 mr-2" />
                  Rechazar Solicitud
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal para Ver Imagen Completa */}
      <Dialog open={mostrarImagenCompleta} onOpenChange={setMostrarImagenCompleta}>
        <DialogContent className="max-w-2xl bg-card backdrop-blur-sm border-primary/30">
          <DialogHeader>
            <DialogTitle className="text-2xl flex items-center gap-2">
              <Camera className="w-6 h-6 text-primary" />
              Selfie de Registro
            </DialogTitle>
            {solicitudSeleccionada && (
              <DialogDescription>
                {solicitudSeleccionada.modeloNombre} - {solicitudSeleccionada.fecha.toLocaleString('es-CO')}
              </DialogDescription>
            )}
          </DialogHeader>

          {solicitudSeleccionada && (
            <div className="space-y-4">
              <div className="relative w-full rounded-lg overflow-hidden border-2 border-primary/30">
                <img 
                  src={solicitudSeleccionada.selfieUrl} 
                  alt={`Selfie ${solicitudSeleccionada.modeloNombre}`}
                  className="w-full h-auto"
                />
              </div>

              <div className="flex items-center justify-between p-3 bg-secondary rounded-lg border border-border">
                <div className="flex items-center gap-2">
                  <Badge 
                    className={
                      solicitudSeleccionada.estado === 'pendiente'
                        ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
                        : solicitudSeleccionada.estado === 'aprobada'
                        ? 'bg-green-500/20 text-green-400 border-green-500/30'
                        : 'bg-red-500/20 text-red-400 border-red-500/30'
                    }
                  >
                    {solicitudSeleccionada.estado === 'pendiente' && 'Pendiente'}
                    {solicitudSeleccionada.estado === 'aprobada' && 'Aprobada'}
                    {solicitudSeleccionada.estado === 'rechazada' && 'Rechazada'}
                  </Badge>
                  {solicitudSeleccionada.aprobadoPor && (
                    <span className="text-xs text-muted-foreground">
                      por {solicitudSeleccionada.aprobadoPor}
                    </span>
                  )}
                </div>
              </div>

              {solicitudSeleccionada.comentariosAdmin && (
                <div className="p-3 bg-secondary rounded-lg border border-border">
                  <div className="flex items-center gap-2 mb-2">
                    <MessageSquare className="w-4 h-4 text-primary" />
                    <span className="text-sm font-semibold">Comentarios:</span>
                  </div>
                  <p className="text-sm">{solicitudSeleccionada.comentariosAdmin}</p>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button onClick={() => setMostrarImagenCompleta(false)}>
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
