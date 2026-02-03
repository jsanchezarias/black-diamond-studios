import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  DollarSign,
  Calendar,
  User,
  FileText,
  TrendingUp,
  Bell
} from 'lucide-react';
import { usePagos, Adelanto } from '../src/app/components/PagosContext';
import { GestionarAdelantoModal } from './GestionarAdelantoModal';

interface GestionAdelantosPanelProps {
  userEmail: string;
}

export function GestionAdelantosPanel({ userEmail }: GestionAdelantosPanelProps) {
  const { adelantos, aprobarAdelanto, rechazarAdelanto, obtenerAdelantosPendientes } = usePagos();
  const [adelantoSeleccionado, setAdelantoSeleccionado] = useState<Adelanto | null>(null);
  const [mostrarModal, setMostrarModal] = useState(false);

  const adelantosPendientes = obtenerAdelantosPendientes();
  const adelantosAprobados = adelantos.filter((a) => a.estado === 'aprobado');
  const adelantosRechazados = adelantos.filter((a) => a.estado === 'rechazado');

  const totalAprobados = adelantosAprobados.reduce((sum, a) => sum + a.monto, 0);

  const handleAbrirModal = (adelanto: Adelanto) => {
    setAdelantoSeleccionado(adelanto);
    setMostrarModal(true);
  };

  const handleConfirmar = () => {
    if (!adelantoSeleccionado) return;

    if (adelantoSeleccionado.estado === 'pendiente') {
      aprobarAdelanto(adelantoSeleccionado.id, userEmail);
    } else {
      rechazarAdelanto(adelantoSeleccionado.id, userEmail);
    }

    setMostrarModal(false);
    setAdelantoSeleccionado(null);
  };

  const estadoBadge = (estado: string) => {
    switch (estado) {
      case 'pendiente':
        return (
          <Badge variant="outline" className="border-yellow-500/50 text-yellow-500 bg-yellow-500/10">
            <Clock className="w-3 h-3 mr-1" />
            Pendiente
          </Badge>
        );
      case 'aprobado':
        return (
          <Badge variant="outline" className="border-green-500/50 text-green-500 bg-green-500/10">
            <CheckCircle className="w-3 h-3 mr-1" />
            Aprobado
          </Badge>
        );
      case 'rechazado':
        return (
          <Badge variant="outline" className="border-red-500/50 text-red-500 bg-red-500/10">
            <XCircle className="w-3 h-3 mr-1" />
            Rechazado
          </Badge>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-yellow-500/30 bg-gradient-to-br from-yellow-500/10 to-transparent">
          <CardHeader className="pb-3">
            <CardDescription className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Pendientes
            </CardDescription>
            <CardTitle className="text-3xl text-yellow-500">
              {adelantosPendientes.length}
            </CardTitle>
          </CardHeader>
        </Card>

        <Card className="border-green-500/30 bg-gradient-to-br from-green-500/10 to-transparent">
          <CardHeader className="pb-3">
            <CardDescription className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              Aprobados
            </CardDescription>
            <CardTitle className="text-3xl text-green-500">
              {adelantosAprobados.length}
            </CardTitle>
          </CardHeader>
        </Card>

        <Card className="border-primary/30 bg-gradient-to-br from-primary/10 to-transparent">
          <CardHeader className="pb-3">
            <CardDescription className="flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              Total Aprobado
            </CardDescription>
            <CardTitle className="text-2xl text-primary">
              ${totalAprobados.toLocaleString('es-CO')}
            </CardTitle>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription className="flex items-center gap-2">
              <XCircle className="w-4 h-4" />
              Rechazados
            </CardDescription>
            <CardTitle className="text-3xl text-red-500">
              {adelantosRechazados.length}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Solicitudes pendientes */}
      {adelantosPendientes.length > 0 && (
        <Card className="border-yellow-500/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-yellow-500">
              <Clock className="w-5 h-5" />
              Solicitudes Pendientes
            </CardTitle>
            <CardDescription>
              Revisa y aprueba las solicitudes de adelanto
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {adelantosPendientes.map((adelanto) => (
                <div
                  key={adelanto.id}
                  className="p-4 border border-yellow-500/30 rounded-lg bg-yellow-500/20"
                >
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h4 className="font-semibold text-white">{adelanto.modeloNombre}</h4>
                        <span className="text-2xl font-bold text-yellow-500">
                          ${adelanto.monto.toLocaleString('es-CO')}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                        <Calendar className="w-4 h-4" />
                        <span>
                          {adelanto.fechaSolicitud.toLocaleDateString('es-CO')} a las{' '}
                          {adelanto.fechaSolicitud.toLocaleTimeString('es-CO', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                      {adelanto.motivo && (
                        <div className="mt-2 p-2 bg-secondary/80 rounded border border-white/20">
                          <p className="text-xs text-muted-foreground mb-1">Motivo:</p>
                          <p className="text-sm">{adelanto.motivo}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2 justify-end">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleAbrirModal(adelanto)}
                      className="border-red-500/50 text-red-500 hover:bg-red-500/10"
                    >
                      <XCircle className="w-4 h-4 mr-2" />
                      Rechazar
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleAbrirModal(adelanto)}
                      className="bg-green-500 text-white hover:bg-green-600"
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Aprobar
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Historial de adelantos */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Historial Completo
          </CardTitle>
          <CardDescription>
            Todos los adelantos gestionados
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {adelantos.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No hay adelantos registrados</p>
              </div>
            ) : (
              adelantos
                .sort((a, b) => b.fechaSolicitud.getTime() - a.fechaSolicitud.getTime())
                .map((adelanto) => (
                  <div
                    key={adelanto.id}
                    className="p-4 border border-white/10 rounded-lg bg-secondary/60"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4 text-muted-foreground" />
                            <span className="font-semibold">{adelanto.modeloNombre}</span>
                          </div>
                          <span className="text-xl font-bold text-primary">
                            ${adelanto.monto.toLocaleString('es-CO')}
                          </span>
                          {estadoBadge(adelanto.estado)}
                        </div>

                        <div className="space-y-1 text-sm text-muted-foreground">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-3 h-3" />
                            <span>
                              Solicitado: {adelanto.fechaSolicitud.toLocaleDateString('es-CO')}
                            </span>
                          </div>

                          {adelanto.fechaRespuesta && (
                            <div className="flex items-center gap-2">
                              <CheckCircle className="w-3 h-3" />
                              <span>
                                Procesado: {adelanto.fechaRespuesta.toLocaleDateString('es-CO')} por{' '}
                                {adelanto.aprobadoPor}
                              </span>
                            </div>
                          )}
                        </div>

                        {adelanto.motivo && (
                          <div className="mt-2 p-2 bg-secondary/80 rounded border border-white/20">
                            <p className="text-xs text-muted-foreground">"{adelanto.motivo}"</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Modal mejorado de gestión */}
      <GestionarAdelantoModal
        isOpen={mostrarModal}
        onClose={() => {
          setMostrarModal(false);
          setAdelantoSeleccionado(null);
        }}
        adelanto={adelantoSeleccionado}
        onAprobar={(adelantoId) => {
          aprobarAdelanto(adelantoId, userEmail);
        }}
        onRechazar={(adelantoId) => {
          rechazarAdelanto(adelantoId, userEmail);
        }}
      />
    </div>
  );
}
