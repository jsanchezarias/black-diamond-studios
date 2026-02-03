import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Badge } from './ui/badge';
import { Card, CardContent } from './ui/card';
import { 
  User, 
  Phone, 
  Mail, 
  Calendar, 
  MapPin, 
  Star,
  DollarSign,
  Clock,
  FileText,
  Award
} from 'lucide-react';
import { useClientes, Cliente } from './ClientesContext';

interface ClienteInfoModalProps {
  telefono: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ClienteInfoModal({ telefono, open, onOpenChange }: ClienteInfoModalProps) {
  const { buscarPorTelefono } = useClientes();
  
  const cliente = telefono ? buscarPorTelefono(telefono) : null;

  if (!cliente) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl bg-card backdrop-blur-lg border-primary/30">
          <DialogHeader>
            <DialogTitle>Información del Cliente</DialogTitle>
            <DialogDescription>
              No se encontró información del cliente
            </DialogDescription>
          </DialogHeader>
          <div className="py-8 text-center text-muted-foreground">
            <User className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <p>Cliente no registrado en el sistema</p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl bg-card backdrop-blur-lg border-primary/30 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary via-primary/80 to-primary/60 flex items-center justify-center">
              <User className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span>{cliente.nombre}</span>
                {cliente.rating && cliente.rating >= 4 && (
                  <Badge className="bg-primary/20 text-primary border-primary/30">
                    <Award className="w-3 h-3 mr-1" />
                    Cliente VIP
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground font-normal">
                @{cliente.nombreUsuario}
              </p>
            </div>
          </DialogTitle>
          <DialogDescription>
            Información completa del cliente en el sistema
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Información de Contacto */}
          <Card className="border-primary/20">
            <CardContent className="p-4 space-y-3">
              <h3 className="font-semibold text-sm text-primary mb-3 flex items-center gap-2">
                <Phone className="w-4 h-4" />
                Información de Contacto
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground flex items-center gap-1">
                    <Phone className="w-3 h-3" />
                    Teléfono
                  </label>
                  <p className="font-semibold">{cliente.telefono}</p>
                </div>

                {cliente.email && (
                  <div className="space-y-1">
                    <label className="text-xs text-muted-foreground flex items-center gap-1">
                      <Mail className="w-3 h-3" />
                      Email
                    </label>
                    <p className="font-semibold text-sm break-all">{cliente.email}</p>
                  </div>
                )}

                {cliente.ciudad && (
                  <div className="space-y-1">
                    <label className="text-xs text-muted-foreground flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      Ciudad
                    </label>
                    <p className="font-semibold">{cliente.ciudad}</p>
                  </div>
                )}

                {cliente.fechaNacimiento && (
                  <div className="space-y-1">
                    <label className="text-xs text-muted-foreground flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      Fecha de Nacimiento
                    </label>
                    <p className="font-semibold">
                      {cliente.fechaNacimiento.toLocaleDateString('es-CO', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Estadísticas del Cliente */}
          <Card className="border-primary/20">
            <CardContent className="p-4">
              <h3 className="font-semibold text-sm text-primary mb-3 flex items-center gap-2">
                <DollarSign className="w-4 h-4" />
                Estadísticas
              </h3>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-gradient-to-br from-primary/10 to-primary/5 rounded-lg border border-primary/20">
                  <p className="text-2xl font-bold text-primary">{cliente.totalServicios}</p>
                  <p className="text-xs text-muted-foreground mt-1">Servicios</p>
                </div>

                <div className="text-center p-4 bg-gradient-to-br from-primary/10 to-primary/5 rounded-lg border border-primary/20">
                  <p className="text-2xl font-bold text-primary">
                    ${cliente.totalGastado.toLocaleString('es-CO')}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">Total Gastado</p>
                </div>

                {cliente.rating && (
                  <div className="text-center p-4 bg-gradient-to-br from-primary/10 to-primary/5 rounded-lg border border-primary/20">
                    <div className="flex items-center justify-center gap-1">
                      <p className="text-2xl font-bold text-primary">{cliente.rating.toFixed(1)}</p>
                      <Star className="w-5 h-5 text-primary fill-primary" />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">Rating</p>
                  </div>
                )}

                {cliente.ultimaVisita && (
                  <div className="text-center p-4 bg-gradient-to-br from-primary/10 to-primary/5 rounded-lg border border-primary/20">
                    <Clock className="w-6 h-6 text-primary mx-auto mb-1" />
                    <p className="text-xs font-semibold">
                      {cliente.ultimaVisita.toLocaleDateString('es-CO', {
                        month: 'short',
                        day: 'numeric'
                      })}
                    </p>
                    <p className="text-xs text-muted-foreground">Última Visita</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Información Adicional */}
          {(cliente.preferencias || cliente.notas) && (
            <Card className="border-primary/20">
              <CardContent className="p-4 space-y-3">
                <h3 className="font-semibold text-sm text-primary mb-3 flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Información Adicional
                </h3>

                {cliente.preferencias && (
                  <div className="space-y-1">
                    <label className="text-xs text-muted-foreground font-semibold">
                      Preferencias
                    </label>
                    <p className="text-sm p-3 bg-secondary rounded-lg">
                      {cliente.preferencias}
                    </p>
                  </div>
                )}

                {cliente.notas && (
                  <div className="space-y-1">
                    <label className="text-xs text-muted-foreground font-semibold">
                      Notas Administrativas
                    </label>
                    <p className="text-sm p-3 bg-secondary rounded-lg">
                      {cliente.notas}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Fecha de Registro */}
          <div className="text-center text-xs text-muted-foreground pt-2 border-t border-border">
            Cliente registrado el {cliente.fechaRegistro.toLocaleDateString('es-CO', {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
