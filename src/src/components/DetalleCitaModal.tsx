import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { X, User, Phone, Calendar, Clock, MapPin, DollarSign, FileText, CheckCircle } from 'lucide-react';
import { Badge } from '../app/components/ui/badge';
import { Button } from '../app/components/ui/button';

interface Agendamiento {
  id: string;
  fecha: string;
  fechaInicio: string;
  hora: string;
  duracion: number;
  clienteNombre: string;
  clienteTelefono: string;
  tipoServicio: 'sede' | 'domicilio';
  precioTotal?: number;
  estado: string;
  notas?: string;
  direccion?: string;
}

interface DetalleCitaModalProps {
  isOpen: boolean;
  onClose: () => void;
  cita: Agendamiento | null;
}

export function DetalleCitaModal({ isOpen, onClose, cita }: DetalleCitaModalProps) {
  if (!isOpen || !cita) return null;

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const getBadgeColor = (estado: string) => {
    switch (estado.toLowerCase()) {
      case 'confirmada':
        return 'bg-green-500/10 text-green-400 border-green-500/30';
      case 'pendiente':
        return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30';
      case 'cancelada':
        return 'bg-red-500/10 text-red-400 border-red-500/30';
      default:
        return 'bg-primary/10 text-primary border-primary/30';
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200"
      onClick={handleBackdropClick}
    >
      <div className="bg-gradient-to-br from-gray-900 via-black to-gray-900 border border-white/10 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10 bg-gradient-to-r from-primary/10 via-purple-500/10 to-transparent">
          <div>
            <h2 className="text-2xl font-bold text-white mb-1">Detalle de Cita</h2>
            <p className="text-sm text-muted-foreground">Información completa del agendamiento</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <X className="w-6 h-6 text-white" />
          </button>
        </div>

        {/* Contenido */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          <div className="space-y-6">
            {/* Estado */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Estado</span>
              <Badge variant="outline" className={`${getBadgeColor(cita.estado)} px-4 py-1.5`}>
                {cita.estado}
              </Badge>
            </div>

            {/* Información del cliente */}
            <div className="bg-white/5 rounded-lg p-4 border border-white/5">
              <h3 className="text-sm font-semibold text-primary mb-3 flex items-center gap-2">
                <User className="w-4 h-4" />
                Cliente
              </h3>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Nombre</span>
                  <span className="text-sm font-medium text-white">{cita.clienteNombre}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Teléfono</span>
                  <a 
                    href={`tel:${cita.clienteTelefono}`}
                    className="text-sm font-medium text-primary hover:underline flex items-center gap-1"
                  >
                    <Phone className="w-3 h-3" />
                    {cita.clienteTelefono}
                  </a>
                </div>
              </div>
            </div>

            {/* Información de la cita */}
            <div className="bg-white/5 rounded-lg p-4 border border-white/5">
              <h3 className="text-sm font-semibold text-primary mb-3 flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Detalles del Servicio
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Fecha</span>
                  <span className="text-sm font-medium text-white">
                    {format(new Date(cita.fechaInicio), "EEEE, dd 'de' MMMM yyyy", { locale: es })}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Hora</span>
                  <span className="text-sm font-medium text-white flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {cita.hora}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Duración</span>
                  <span className="text-sm font-medium text-white">{cita.duracion} {cita.duracion === 1 ? 'hora' : 'horas'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Tipo de servicio</span>
                  <Badge variant="outline" className="bg-purple-500/10 text-purple-400 border-purple-500/30">
                    <MapPin className="w-3 h-3 mr-1" />
                    {cita.tipoServicio === 'domicilio' ? 'Domicilio' : 'Sede'}
                  </Badge>
                </div>
                {cita.direccion && cita.tipoServicio === 'domicilio' && (
                  <div className="flex flex-col gap-1 pt-2 border-t border-white/5">
                    <span className="text-sm text-muted-foreground">Dirección</span>
                    <span className="text-sm font-medium text-white">{cita.direccion}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Información de pago */}
            {cita.precioTotal && (
              <div className="bg-gradient-to-r from-primary/10 to-purple-500/10 rounded-lg p-4 border border-primary/20">
                <h3 className="text-sm font-semibold text-primary mb-3 flex items-center gap-2">
                  <DollarSign className="w-4 h-4" />
                  Información de Pago
                </h3>
                <div className="flex items-center justify-between">
                  <span className="text-base text-muted-foreground">Total</span>
                  <span className="text-2xl font-bold text-primary">
                    ${cita.precioTotal.toLocaleString('es-CO')}
                  </span>
                </div>
              </div>
            )}

            {/* Notas */}
            {cita.notas && (
              <div className="bg-white/5 rounded-lg p-4 border border-white/5">
                <h3 className="text-sm font-semibold text-primary mb-2 flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Notas
                </h3>
                <p className="text-sm text-muted-foreground italic">"{cita.notas}"</p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-white/10 bg-black/40 flex justify-end gap-3">
          <Button 
            variant="outline" 
            onClick={onClose}
            className="border-white/10"
          >
            Cerrar
          </Button>
          <Button 
            className="bg-primary hover:bg-primary/90"
            onClick={() => {
              // Aquí podrías agregar funcionalidad para confirmar la cita
              onClose();
            }}
          >
            <CheckCircle className="w-4 h-4 mr-2" />
            Entendido
          </Button>
        </div>
      </div>
    </div>
  );
}