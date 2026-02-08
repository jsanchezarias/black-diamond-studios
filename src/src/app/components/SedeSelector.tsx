import { MapPin, Radio, Gem } from 'lucide-react';
import { Card, CardContent } from '../../../components/ui/card';
import { Badge } from '../../../components/ui/badge';

export interface Sede {
  id: string;
  name: string;
  location: string;
  streamUrl: string;
  modelosDisponibles: number;
  isLive: boolean;
  description: string;
}

interface SedeSelectorProps {
  sedes: Sede[];
  sedeActual: string;
  onSedeChange: (sedeId: string) => void;
}

export function SedeSelector({ sedes, sedeActual, onSedeChange }: SedeSelectorProps) {
  return (
    <section className="py-16 md:py-24 bg-gradient-to-b from-background to-primary/5">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <Badge className="mb-4 bg-primary/20 text-primary border-primary/30">
            <MapPin className="w-4 h-4 mr-2 inline" />
            Nuestras Ubicaciones
          </Badge>
          <h2 className="text-4xl md:text-6xl font-bold mb-4" style={{ fontFamily: 'Montserrat, sans-serif' }}>
            Selecciona una <span className="text-primary">Sede</span>
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Contamos con 5 sedes exclusivas. Cada una con su propio stream en vivo y modelos disponibles.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6 max-w-7xl mx-auto">
          {sedes.map((sede) => (
            <Card
              key={sede.id}
              onClick={() => onSedeChange(sede.id)}
              className={`cursor-pointer transition-all duration-300 hover:scale-105 ${
                sedeActual === sede.id
                  ? 'border-primary bg-gradient-to-br from-primary/20 to-primary/10 shadow-lg shadow-primary/30'
                  : 'border-primary/20 bg-gradient-to-br from-card to-primary/5 hover:shadow-lg hover:shadow-primary/10'
              }`}
            >
              <CardContent className="p-6">
                {/* Header con Live Badge */}
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                    <MapPin className="w-6 h-6 text-primary" />
                  </div>
                  {sede.isLive && (
                    <Badge className="bg-red-500/90 text-white border-none gap-1 text-xs animate-pulse">
                      <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></div>
                      LIVE
                    </Badge>
                  )}
                </div>

                {/* Nombre de la Sede */}
                <h3 className="text-xl font-bold mb-2" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                  {sede.name}
                </h3>

                {/* Ubicación */}
                <p className="text-sm text-muted-foreground mb-3 flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  {sede.location}
                </p>

                {/* Descripción */}
                <p className="text-xs text-muted-foreground mb-4 line-clamp-2">
                  {sede.description}
                </p>

                {/* Modelos Disponibles */}
                <div className="flex items-center justify-between pt-3 border-t border-primary/10">
                  <span className="text-xs text-muted-foreground">Modelos</span>
                  <Badge className="bg-primary/20 text-primary border-primary/30">
                    <Gem className="w-3 h-3 mr-1" />
                    {sede.modelosDisponibles}
                  </Badge>
                </div>

                {/* Indicador de selección */}
                {sedeActual === sede.id && (
                  <div className="mt-4 pt-3 border-t border-primary/20 flex items-center justify-center gap-2 text-primary font-bold text-sm">
                    <Radio className="w-4 h-4 animate-pulse" />
                    <span>Sede Activa</span>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Nota informativa */}
        <div className="mt-8 text-center">
          <p className="text-sm text-muted-foreground">
            💎 Cada sede tiene su propio stream en vivo y equipo de modelos exclusivas
          </p>
        </div>
      </div>
    </section>
  );
}