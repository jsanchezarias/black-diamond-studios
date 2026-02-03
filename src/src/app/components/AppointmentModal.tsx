import { X, Calendar, Clock, Gem, Phone, Send } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';

interface Model {
  id: string;
  name: string;
  photo: string;
  available: boolean;
  age: number;
}

interface AppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  availableModels: Model[];
}

export function AppointmentModal({ isOpen, onClose, availableModels }: AppointmentModalProps) {
  if (!isOpen) return null;

  const handleContactWhatsApp = () => {
    window.open('https://wa.me/573017626768?text=Hola, quiero agendar una cita', '_blank');
  };

  const handleContactTelegram = () => {
    window.open('https://t.me/BlackDiamondScorts', '_blank');
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-in fade-in duration-300">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-background/95 backdrop-blur-md" 
        onClick={onClose}
      />

      {/* Modal */}
      <Card className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto border-primary/30 bg-gradient-to-br from-card to-primary/5 shadow-2xl shadow-primary/20">
        <CardContent className="p-6 md:p-8">
          {/* Header */}
          <div className="flex items-start justify-between mb-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Gem className="w-8 h-8 text-primary" />
                <h2 className="text-3xl md:text-4xl font-bold" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                  Tiempo de Visualización <span className="text-primary">Agotado</span>
                </h2>
              </div>
              <p className="text-muted-foreground">
                ¡Agenda una cita con nuestras modelos disponibles para una experiencia completa!
              </p>
            </div>
            <Button
              onClick={onClose}
              variant="ghost"
              size="sm"
              className="hover:bg-primary/10 rounded-full"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* Modelos Disponibles */}
          <div className="mb-8">
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-primary" />
              Modelos Disponibles Ahora
            </h3>
            
            <div className="grid md:grid-cols-2 gap-4">
              {availableModels.filter(m => m.available).map((model) => (
                <Card key={model.id} className="border-primary/20 bg-gradient-to-br from-card to-primary/5 hover:shadow-lg hover:shadow-primary/10 transition-all">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      <div className="relative">
                        <img
                          src={model.photo}
                          alt={model.name}
                          className="w-20 h-20 rounded-full object-cover border-2 border-primary/30"
                        />
                        <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full border-2 border-card flex items-center justify-center">
                          <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                        </div>
                      </div>
                      <div className="flex-1">
                        <h4 className="font-bold text-lg">{model.name}</h4>
                        <p className="text-sm text-muted-foreground">{model.age} años</p>
                        <Badge className="bg-green-500/20 text-green-400 border-green-500/30 mt-2">
                          <Clock className="w-3 h-3 mr-1" />
                          Disponible Ahora
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {availableModels.filter(m => m.available).length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <Clock className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No hay modelos disponibles en este momento.</p>
                <p className="text-sm mt-2">Por favor, contacta para verificar disponibilidad.</p>
              </div>
            )}
          </div>

          {/* Información de Cooldown */}
          <div className="mb-8 p-4 bg-primary/10 rounded-lg border border-primary/20">
            <div className="flex items-start gap-3">
              <Clock className="w-5 h-5 text-primary mt-0.5" />
              <div>
                <h4 className="font-bold mb-1">Tiempo de Espera</h4>
                <p className="text-sm text-muted-foreground">
                  Podrás volver a acceder al stream en <span className="text-primary font-bold">1 hora</span>. 
                  Mientras tanto, agenda una cita para disfrutar de la experiencia completa.
                </p>
              </div>
            </div>
          </div>

          {/* Botones de Contacto */}
          <div className="space-y-3">
            <h3 className="font-bold mb-4">Reserva Tu Experiencia</h3>
            
            <Button
              onClick={handleContactTelegram}
              size="lg"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white gap-2 text-lg py-6"
            >
              <Send className="w-5 h-5" />
              Agendar por Telegram
            </Button>

            <Button
              onClick={handleContactWhatsApp}
              size="lg"
              className="w-full bg-green-600 hover:bg-green-700 text-white gap-2 text-lg py-6"
            >
              <Phone className="w-5 h-5" />
              Agendar por WhatsApp
            </Button>

            <Button
              onClick={onClose}
              variant="ghost"
              size="lg"
              className="w-full hover:bg-primary/10"
            >
              Cerrar
            </Button>
          </div>

          {/* Nota de privacidad */}
          <div className="mt-6 p-4 bg-background/50 rounded-lg border border-primary/10">
            <p className="text-xs text-muted-foreground text-center">
              💎 Todas las reservas son confidenciales. Garantizamos total discreción y profesionalismo.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}