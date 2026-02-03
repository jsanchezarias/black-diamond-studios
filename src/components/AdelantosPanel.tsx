import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { 
  CreditCard, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  DollarSign,
  Calendar,
  FileText,
  Plus
} from 'lucide-react';
import { usePagos } from '../src/app/components/PagosContext';
import { SolicitarAdelantoModal } from './SolicitarAdelantoModal';

interface AdelantosPanelProps {
  modeloEmail: string;
  modeloNombre: string;
}

export function AdelantosPanel({ modeloEmail, modeloNombre }: AdelantosPanelProps) {
  const { obtenerAdelantosModelo } = usePagos();
  const [mostrarModal, setMostrarModal] = useState(false);

  const adelantosModelo = obtenerAdelantosModelo(modeloEmail);
  const adelantosPendientes = adelantosModelo.filter((a) => a.estado === 'pendiente');
  const adelantosAprobados = adelantosModelo.filter((a) => a.estado === 'aprobado');
  const adelantosRechazados = adelantosModelo.filter((a) => a.estado === 'rechazado');

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

  // Calcular total de adelantos aprobados pendientes de pago
  const totalAdelantosAprobados = adelantosAprobados.reduce((sum, a) => sum + a.monto, 0);

  return (
    <div className="space-y-6">
      {/* ✅ Banner demo eliminado - Sistema en producción */}

      {/* Información de adelantos */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-primary/30 bg-gradient-to-br from-primary/10 to-transparent">
          <CardHeader className="pb-3">
            <CardDescription className="flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              Adelantos Aprobados
            </CardDescription>
            <CardTitle className="text-3xl text-primary">
              ${totalAdelantosAprobados.toLocaleString('es-CO')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              Se descontarán en tu próxima liquidación
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Pendientes de Aprobación
            </CardDescription>
            <CardTitle className="text-3xl text-yellow-500">
              {adelantosPendientes.length}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              Esperando revisión del administrador
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Monto Máximo
            </CardDescription>
            <CardTitle className="text-3xl">
              $50,000
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              Por solicitud de adelanto
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Botón para solicitar adelanto */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="w-5 h-5" />
                Solicitar Adelanto
              </CardTitle>
              <CardDescription>
                Solicita hasta $50,000 de adelanto sobre tu liquidación
              </CardDescription>
            </div>
            <Button
              onClick={() => setMostrarModal(true)}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              <Plus className="w-4 h-4 mr-2" />
              Nuevo Adelanto
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Historial de adelantos */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Historial de Adelantos
          </CardTitle>
          <CardDescription>
            Todos tus adelantos solicitados
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {adelantosModelo.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <CreditCard className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No has solicitado adelantos</p>
                <p className="text-sm mt-1">
                  Puedes solicitar hasta $50,000 cuando lo necesites
                </p>
              </div>
            ) : (
              adelantosModelo
                .sort((a, b) => b.fechaSolicitud.getTime() - a.fechaSolicitud.getTime())
                .map((adelanto) => (
                  <div
                    key={adelanto.id}
                    className="p-4 border border-white/10 rounded-lg bg-secondary/30"
                  >
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-1">
                          <span className="text-2xl font-bold text-primary">
                            ${adelanto.monto.toLocaleString('es-CO')}
                          </span>
                          {estadoBadge(adelanto.estado)}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Calendar className="w-4 h-4" />
                          <span>
                            Solicitado: {adelanto.fechaSolicitud.toLocaleDateString('es-CO')}
                          </span>
                        </div>
                      </div>
                    </div>

                    {adelanto.motivo && (
                      <div className="mb-3">
                        <p className="text-sm text-muted-foreground mb-1">Motivo:</p>
                        <p className="text-sm">{adelanto.motivo}</p>
                      </div>
                    )}

                    {adelanto.fechaRespuesta && (
                      <div className="flex items-center gap-2 text-xs text-muted-foreground pt-2 border-t border-white/10">
                        <CheckCircle className="w-3 h-3" />
                        <span>
                          Procesado el {adelanto.fechaRespuesta.toLocaleDateString('es-CO')} por{' '}
                          {adelanto.aprobadoPor}
                        </span>
                      </div>
                    )}
                  </div>
                ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Modal mejorado para solicitar adelanto */}
      <SolicitarAdelantoModal
        isOpen={mostrarModal}
        onClose={() => setMostrarModal(false)}
        modeloEmail={modeloEmail}
        modeloNombre={modeloNombre}
      />
    </div>
  );
}
