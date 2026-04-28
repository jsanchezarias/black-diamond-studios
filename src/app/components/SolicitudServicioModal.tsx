import { useState } from 'react';
import { X, Send, Clock, MapPin, Building2, Home } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { ImageWithFallback } from '../../components/figma/ImageWithFallback';

interface SolicitudServicioModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (mensaje: string) => void;
  data: {
    model: any;
    service?: any;
    location?: 'sede' | 'domicilio';
    price?: string;
  } | null;
}

export function SolicitudServicioModal({ isOpen, onClose, onConfirm, data }: SolicitudServicioModalProps) {
  const [mensajeAdicional, setMensajeAdicional] = useState('');

  if (!isOpen || !data) return null;

  const { model, service, location, price } = data;

  const handleConfirm = () => {
    let mensajeChat = '';
    
    if (service) {
      const ubicacionStr = model.domicilio 
        ? (location === 'sede' ? 'En Sede' : 'A Domicilio')
        : 'En Sede';

      mensajeChat = `¡Hola! Quiero solicitar un servicio:\\n\\n` +
                    `👩 *Modelo:* ${model.name}\\n` +
                    `📋 *Servicio:* ${service.name}\\n` +
                    `⏱️ *Duración:* ${service.duration}\\n` +
                    `📍 *Ubicación:* ${ubicacionStr}\\n` +
                    `💰 *Tarifa:* $${price}\\n\\n` +
                    `*Mensaje adicional:* ${mensajeAdicional || 'Ninguno'}`;
    } else {
      mensajeChat = `¡Hola! Quisiera más información sobre la disponibilidad y servicios de *${model.name}*.\\n\\n` +
                    `*Mensaje adicional:* ${mensajeAdicional || 'Ninguno'}`;
    }

    onConfirm(mensajeChat);
  };

  return (
    <div className="fixed inset-0 z-[100] bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
      <Card className="w-full max-w-md border-primary/20 bg-card/95 shadow-2xl overflow-hidden bd-animate-scale-in relative">
        <Button 
          variant="ghost" 
          size="icon" 
          className="absolute top-2 right-2 text-muted-foreground hover:text-foreground z-10 rounded-full bg-background/50 backdrop-blur-sm"
          onClick={onClose}
        >
          <X className="w-5 h-5" />
        </Button>
        
        <div className="h-32 w-full relative overflow-hidden bg-black">
          <ImageWithFallback
            src={model.photo}
            alt={model.name}
            className="w-full h-full object-cover opacity-60"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-card via-card/80 to-transparent" />
          <div className="absolute bottom-4 left-4 right-4 flex items-end gap-4">
            <div className="w-16 h-16 rounded-full border-2 border-primary overflow-hidden flex-shrink-0 bg-black">
              <ImageWithFallback
                src={model.photo}
                alt={model.name}
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white drop-shadow-md" style={{ fontFamily: 'Playfair Display, serif' }}>
                {model.name}
              </h3>
              <Badge variant="outline" className="border-primary/50 text-primary bg-primary/10 mt-1">
                Solicitud de Servicio
              </Badge>
            </div>
          </div>
        </div>

        <CardContent className="p-6 pt-6 space-y-5">
          {service ? (
            <div className="space-y-4">
              <div className="bg-primary/5 border border-primary/10 rounded-lg p-4 space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-semibold text-sm text-foreground">{service.name}</h4>
                    <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {service.duration}
                    </p>
                  </div>
                  <p className="font-bold text-primary" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                    ${price}
                  </p>
                </div>
                
                <div className="flex items-center gap-2 pt-2 border-t border-primary/10">
                  <Badge variant="secondary" className="bg-background border-primary/20 text-xs font-medium">
                    {location === 'sede' ? (
                      <span className="flex items-center gap-1 text-primary">
                        <Building2 className="w-3 h-3" /> En Sede
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-primary">
                        <Home className="w-3 h-3" /> A Domicilio
                      </span>
                    )}
                  </Badge>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-primary/5 border border-primary/10 rounded-lg p-4 text-center">
              <p className="text-sm text-muted-foreground">
                Estás solicitando información general sobre la disponibilidad de esta modelo.
              </p>
            </div>
          )}

          <div className="space-y-2">
            <label className="text-xs font-semibold text-foreground/80 ml-1">
              Mensaje adicional (Opcional)
            </label>
            <textarea
              className="w-full h-24 bg-background border border-input rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-colors resize-none placeholder:text-muted-foreground/50"
              placeholder="Ej: Prefiero a las 4:00 PM, tengo dudas sobre..."
              value={mensajeAdicional}
              onChange={(e) => setMensajeAdicional(e.target.value)}
            />
          </div>

          <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3 text-xs text-blue-200">
            <p className="flex gap-2">
              <Send className="w-4 h-4 text-blue-400 flex-shrink-0" />
              <span>
                Esta solicitud se enviará como un mensaje al <strong>chat de soporte</strong>. Un programador te responderá en breve para confirmar.
              </span>
            </p>
          </div>

          <div className="flex gap-3 pt-2">
            <Button variant="outline" className="flex-1 border-primary/30" onClick={onClose}>
              Cancelar
            </Button>
            <Button className="flex-1 bg-primary text-background hover:bg-primary/90 gap-2" onClick={handleConfirm}>
              <Send className="w-4 h-4" />
              Enviar Solicitud
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
