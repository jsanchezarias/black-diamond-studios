import { DoorOpen, Clock, User, Timer } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { useServicios } from '../src/app/components/ServiciosContext';
import { useModelos } from '../src/app/components/ModelosContext';

export function HabitacionesPanel() {
  const { habitaciones } = useServicios();
  const { modelos } = useModelos();

  const formatTiempoRestante = (segundos: number) => {
    const horas = Math.floor(segundos / 3600);
    const minutos = Math.floor((segundos % 3600) / 60);
    const segs = segundos % 60;
    
    if (horas > 0) {
      return `${horas}:${minutos.toString().padStart(2, '0')}:${segs.toString().padStart(2, '0')}`;
    }
    return `${minutos}:${segs.toString().padStart(2, '0')}`;
  };

  const formatTiempoNegativo = (segundos: number) => {
    const minutos = Math.floor(segundos / 60);
    const segs = segundos % 60;
    return `+${minutos}:${segs.toString().padStart(2, '0')}`;
  };

  const obtenerFotoModelo = (modeloEmail: string) => {
    const modelo = modelos.find(m => m.email === modeloEmail);
    return modelo?.fotoPerfil || 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200';
  };

  const obtenerNombreArtistico = (modeloEmail: string, nombrePorDefecto: string) => {
    const modelo = modelos.find(m => m.email === modeloEmail);
    return modelo?.nombreArtistico || nombrePorDefecto;
  };

  return (
    <Card className="border-primary/30">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-primary">
          <DoorOpen className="w-5 h-5" />
          Estado de Habitaciones
        </CardTitle>
        <CardDescription>Disponibilidad en tiempo real</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          {habitaciones.map((hab) => (
            <div
              key={hab.numero}
              className={`relative rounded-lg border-2 transition-all overflow-hidden ${
                hab.ocupada
                  ? 'bg-gradient-to-br from-red-950/40 to-red-950/20 border-red-500/50 shadow-lg shadow-red-500/10'
                  : 'bg-gradient-to-br from-green-950/40 to-green-950/20 border-green-500/50 shadow-lg shadow-green-500/10'
              }`}
            >
              {/* Header de la habitación */}
              <div className={`px-4 py-3 border-b ${
                hab.ocupada ? 'border-red-500/30 bg-red-950/30' : 'border-green-500/30 bg-green-950/30'
              }`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <DoorOpen className={`w-5 h-5 ${hab.ocupada ? 'text-red-400' : 'text-green-400'}`} />
                    <span className="text-2xl font-bold" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
                      {hab.numero}
                    </span>
                  </div>
                  <Badge 
                    variant={hab.ocupada ? 'destructive' : 'default'}
                    className={`text-xs ${hab.ocupada ? 'bg-red-500/80 text-white' : 'bg-green-500/80 text-white'}`}
                  >
                    {hab.ocupada ? 'Ocupada' : 'Libre'}
                  </Badge>
                </div>
              </div>

              {/* Contenido - Modelo o Estado Disponible */}
              <div className="p-4">
                {hab.ocupada && hab.servicio ? (
                  <div className="space-y-3">
                    {/* Foto y nombre de la modelo */}
                    <div className="flex items-center gap-3">
                      <div className="relative flex-shrink-0">
                        <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-primary/40 ring-2 ring-primary/20">
                          <img 
                            src={obtenerFotoModelo(hab.servicio.modeloEmail)}
                            alt={obtenerNombreArtistico(hab.servicio.modeloEmail, hab.servicio.modeloNombre)}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-red-500 rounded-full border-2 border-card animate-pulse"></div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm text-foreground truncate">
                          {obtenerNombreArtistico(hab.servicio.modeloEmail, hab.servicio.modeloNombre)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {hab.servicio.tipoServicio}
                        </p>
                      </div>
                    </div>

                    {/* Tiempo restante con diseño prominente */}
                    <div className={`rounded-lg p-3 border ${ 
                      (hab.servicio.tiempoNegativo && hab.servicio.tiempoNegativo > 0)
                        ? 'bg-red-950/40 border-red-500/50'
                        : 'bg-black/20 border-primary/20'
                    }`}>
                      <div className="flex items-center justify-center gap-2 mb-1">
                        <Timer className={`w-4 h-4 animate-pulse ${
                          (hab.servicio.tiempoNegativo && hab.servicio.tiempoNegativo > 0)
                            ? 'text-red-500'
                            : 'text-primary'
                        }`} />
                        <span className="text-xs text-muted-foreground">
                          {(hab.servicio.tiempoNegativo && hab.servicio.tiempoNegativo > 0)
                            ? 'Tiempo Excedido'
                            : 'Tiempo Restante'}
                        </span>
                      </div>
                      <div className="text-center">
                        <p className={`text-2xl font-bold font-mono tabular-nums ${
                          (hab.servicio.tiempoNegativo && hab.servicio.tiempoNegativo > 0)
                            ? 'text-red-500 animate-pulse'
                            : 'text-primary'
                        }`}>
                          {(hab.servicio.tiempoNegativo && hab.servicio.tiempoNegativo > 0)
                            ? formatTiempoNegativo(hab.servicio.tiempoNegativo)
                            : formatTiempoRestante(hab.servicio.tiempoRestante)}
                        </p>
                        {(hab.servicio.tiempoNegativo && hab.servicio.tiempoNegativo > 0) && (
                          <p className="text-xs text-red-400 mt-1">
                            {Math.floor(hab.servicio.tiempoNegativo / 60) >= 5 && '⚠️ Multa generada'}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Información adicional del servicio */}
                    <div className="pt-2 border-t border-border/20 space-y-1">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-muted-foreground">Duración</span>
                        <span className="font-medium text-foreground">{hab.servicio.tiempoServicio}</span>
                      </div>
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-muted-foreground">Total</span>
                        <span className="font-bold text-primary">
                          ${(hab.servicio.costoServicio + hab.servicio.costoAdicionales + hab.servicio.costoConsumo).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <DoorOpen className="w-12 h-12 mx-auto text-green-400/50 mb-2" />
                    <p className="text-sm font-medium text-green-400">Disponible</p>
                    <p className="text-xs text-muted-foreground mt-1">Lista para usar</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Resumen de ocupación */}
        <div className="mt-6 flex items-center justify-center gap-8 text-sm border-t border-border/30 pt-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500 shadow-lg shadow-green-500/50"></div>
            <span className="text-muted-foreground">
              <span className="font-bold text-green-400">{habitaciones.filter(h => !h.ocupada).length}</span> Disponibles
            </span>
          </div>
          <div className="w-px h-4 bg-border/50"></div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500 shadow-lg shadow-red-500/50 animate-pulse"></div>
            <span className="text-muted-foreground">
              <span className="font-bold text-red-400">{habitaciones.filter(h => h.ocupada).length}</span> Ocupadas
            </span>
          </div>
          <div className="w-px h-4 bg-border/50"></div>
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">
              Ocupación: <span className="font-bold text-primary">
                {Math.round((habitaciones.filter(h => h.ocupada).length / habitaciones.length) * 100)}%
              </span>
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
