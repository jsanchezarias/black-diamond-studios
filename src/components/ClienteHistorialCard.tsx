import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { 
  User, 
  Phone, 
  Mail, 
  Calendar, 
  DollarSign, 
  TrendingUp, 
  Clock,
  Star,
  MessageSquare,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  CheckCircle,
  ThumbsUp,
  ThumbsDown
} from 'lucide-react';
import { Cliente, ServicioCliente, ObservacionModelo } from '../src/app/components/ClientesContext';

// Función helper para formatear moneda
const formatCurrency = (amount: number) => {
  return `$${amount.toLocaleString('es-CO')}`;
};

interface ClienteHistorialCardProps {
  cliente: Cliente;
  mostrarFormularioObservacion?: boolean;
  onAgregarObservacion?: (observacion: string, rating: number, tipo: 'positiva' | 'negativa' | 'neutral') => void;
}

export function ClienteHistorialCard({ 
  cliente, 
  mostrarFormularioObservacion = false,
  onAgregarObservacion 
}: ClienteHistorialCardProps) {
  const [expandido, setExpandido] = useState(false);
  const [nuevaObservacion, setNuevaObservacion] = useState('');
  const [rating, setRating] = useState(3);
  const [tipoObservacion, setTipoObservacion] = useState<'positiva' | 'negativa' | 'neutral'>('neutral');

  const handleAgregarObservacion = () => {
    if (nuevaObservacion.trim() && onAgregarObservacion) {
      onAgregarObservacion(nuevaObservacion, rating, tipoObservacion);
      setNuevaObservacion('');
      setRating(3);
      setTipoObservacion('neutral');
    }
  };

  const formatearFecha = (fecha: string | Date) => {
    return new Date(fecha).toLocaleDateString('es-CO', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTipoObservacionColor = (tipo?: 'positiva' | 'negativa' | 'neutral') => {
    switch (tipo) {
      case 'positiva': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'negativa': return 'bg-red-500/20 text-red-400 border-red-500/30';
      default: return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
    }
  };

  const getTipoObservacionIcon = (tipo?: 'positiva' | 'negativa' | 'neutral') => {
    switch (tipo) {
      case 'positiva': return <ThumbsUp className="w-3 h-3" />;
      case 'negativa': return <ThumbsDown className="w-3 h-3" />;
      default: return <MessageSquare className="w-3 h-3" />;
    }
  };

  return (
    <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-transparent">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
              <User className="w-6 h-6 text-background" />
            </div>
            <div>
              <CardTitle className="text-xl">{cliente.nombre}</CardTitle>
              <div className="flex flex-col gap-1 mt-1">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Phone className="w-3 h-3" />
                  <span>{cliente.telefono}</span>
                </div>
                {cliente.email && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Mail className="w-3 h-3" />
                    <span>{cliente.email}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {cliente.rating && (
            <div className="flex items-center gap-1">
              <Star className="w-4 h-4 fill-primary text-primary" />
              <span className="font-bold text-primary">{cliente.rating.toFixed(1)}</span>
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Estadísticas Rápidas */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-card/50 rounded-lg p-3 border border-border/50">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Calendar className="w-3 h-3" />
              <span className="text-xs">Total Servicios</span>
            </div>
            <p className="text-xl font-bold text-foreground">{cliente.totalServicios}</p>
          </div>

          <div className="bg-card/50 rounded-lg p-3 border border-border/50">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <DollarSign className="w-3 h-3" />
              <span className="text-xs">Total Gastado</span>
            </div>
            <p className="text-xl font-bold text-primary">{formatCurrency(cliente.totalGastado)}</p>
          </div>

          <div className="bg-card/50 rounded-lg p-3 border border-border/50">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <TrendingUp className="w-3 h-3" />
              <span className="text-xs">Promedio</span>
            </div>
            <p className="text-lg font-bold text-foreground">
              {formatCurrency(cliente.totalServicios > 0 ? cliente.totalGastado / cliente.totalServicios : 0)}
            </p>
          </div>

          <div className="bg-card/50 rounded-lg p-3 border border-border/50">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Clock className="w-3 h-3" />
              <span className="text-xs">Última Visita</span>
            </div>
            <p className="text-xs font-medium text-foreground">
              {cliente.ultimaVisita ? new Date(cliente.ultimaVisita).toLocaleDateString('es-CO') : 'N/A'}
            </p>
          </div>
        </div>

        {/* Botón para expandir/colapsar */}
        <Button
          onClick={() => setExpandido(!expandido)}
          variant="outline"
          className="w-full"
        >
          {expandido ? (
            <>
              <ChevronUp className="w-4 h-4 mr-2" />
              Ocultar Historial
            </>
          ) : (
            <>
              <ChevronDown className="w-4 h-4 mr-2" />
              Ver Historial Completo ({cliente.historialServicios?.length || 0} servicios)
            </>
          )}
        </Button>

        {/* Historial Expandido */}
        {expandido && (
          <div className="space-y-4 border-t border-border/50 pt-4">
            {/* Observaciones de Modelos */}
            {cliente.observaciones && cliente.observaciones.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-semibold flex items-center gap-2 text-sm">
                  <MessageSquare className="w-4 h-4 text-primary" />
                  Observaciones de Modelos
                </h4>
                <div className="space-y-2">
                  {cliente.observaciones.map((obs: ObservacionModelo) => (
                    <div key={obs.id} className="bg-card/30 rounded-lg p-3 border border-border/30">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-foreground">{obs.modeloNombre}</span>
                          <Badge variant="outline" className={getTipoObservacionColor(obs.tipo)}>
                            {getTipoObservacionIcon(obs.tipo)}
                            <span className="ml-1 capitalize">{obs.tipo || 'neutral'}</span>
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2">
                          {obs.rating && (
                            <div className="flex items-center gap-1">
                              {[...Array(5)].map((_, i) => (
                                <Star
                                  key={i}
                                  className={`w-3 h-3 ${
                                    i < obs.rating! ? 'fill-primary text-primary' : 'text-muted-foreground'
                                  }`}
                                />
                              ))}
                            </div>
                          )}
                          <span className="text-xs text-muted-foreground">
                            {formatearFecha(obs.fecha)}
                          </span>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground italic">"{obs.observacion}"</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Historial de Servicios */}
            {cliente.historialServicios && cliente.historialServicios.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-semibold flex items-center gap-2 text-sm">
                  <Calendar className="w-4 h-4 text-primary" />
                  Historial de Servicios
                </h4>
                <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
                  {cliente.historialServicios.map((servicio: ServicioCliente) => (
                    <div key={servicio.id} className="bg-card/30 rounded-lg p-3 border border-border/30">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-medium">{servicio.modeloNombre}</span>
                            <Badge variant="outline">{servicio.tipoServicio}</Badge>
                            {servicio.estado && (
                              <Badge 
                                variant={servicio.estado === 'completado' ? 'default' : 'destructive'}
                              >
                                {servicio.estado === 'completado' ? (
                                  <CheckCircle className="w-3 h-3 mr-1" />
                                ) : (
                                  <AlertCircle className="w-3 h-3 mr-1" />
                                )}
                                {servicio.estado}
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-3 text-xs text-muted-foreground">
                            <span>{formatearFecha(servicio.fecha)}</span>
                            <span>•</span>
                            <span>{servicio.tiempoServicio}</span>
                            {servicio.habitacion && (
                              <>
                                <span>•</span>
                                <span>Hab. {servicio.habitacion}</span>
                              </>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-primary">{formatCurrency(servicio.costoTotal || servicio.monto)}</p>
                          <p className="text-xs text-muted-foreground">{servicio.metodoPago}</p>
                        </div>
                      </div>
                      
                      {/* Detalles del servicio */}
                      {(servicio.adicionales || servicio.consumo || servicio.notas || servicio.observacionModelo) && (
                        <div className="mt-2 pt-2 border-t border-border/30 space-y-1">
                          {servicio.adicionales && (
                            <p className="text-xs text-muted-foreground">
                              <span className="font-medium">Adicionales:</span> {servicio.adicionales}
                            </p>
                          )}
                          {servicio.consumo && (
                            <p className="text-xs text-muted-foreground">
                              <span className="font-medium">Consumo:</span> {servicio.consumo}
                            </p>
                          )}
                          {servicio.notas && (
                            <p className="text-xs text-muted-foreground">
                              <span className="font-medium">Notas:</span> {servicio.notas}
                            </p>
                          )}
                          {servicio.observacionModelo && (
                            <p className="text-xs italic text-primary/80">
                              <MessageSquare className="w-3 h-3 inline mr-1" />
                              {servicio.observacionModelo}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Formulario para agregar observación */}
            {mostrarFormularioObservacion && (
              <div className="space-y-3 border-t border-border/50 pt-4">
                <h4 className="font-semibold flex items-center gap-2 text-sm">
                  <MessageSquare className="w-4 h-4 text-primary" />
                  Agregar Observación
                </h4>

                {/* Tipo de observación */}
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant={tipoObservacion === 'positiva' ? 'default' : 'outline'}
                    onClick={() => setTipoObservacion('positiva')}
                    className={tipoObservacion === 'positiva' ? 'bg-green-600 hover:bg-green-700' : ''}
                  >
                    <ThumbsUp className="w-3 h-3 mr-1" />
                    Positiva
                  </Button>
                  <Button
                    size="sm"
                    variant={tipoObservacion === 'neutral' ? 'default' : 'outline'}
                    onClick={() => setTipoObservacion('neutral')}
                  >
                    <MessageSquare className="w-3 h-3 mr-1" />
                    Neutral
                  </Button>
                  <Button
                    size="sm"
                    variant={tipoObservacion === 'negativa' ? 'default' : 'outline'}
                    onClick={() => setTipoObservacion('negativa')}
                    className={tipoObservacion === 'negativa' ? 'bg-red-600 hover:bg-red-700' : ''}
                  >
                    <ThumbsDown className="w-3 h-3 mr-1" />
                    Negativa
                  </Button>
                </div>

                {/* Rating */}
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">Rating del cliente</label>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((value) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => setRating(value)}
                        className="focus:outline-none"
                      >
                        <Star
                          className={`w-6 h-6 cursor-pointer transition-colors ${
                            value <= rating ? 'fill-primary text-primary' : 'text-muted-foreground'
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Textarea de observación */}
                <Textarea
                  value={nuevaObservacion}
                  onChange={(e) => setNuevaObservacion(e.target.value)}
                  placeholder="Escribe tu observación sobre este cliente..."
                  rows={3}
                  className="resize-none"
                />

                <Button
                  onClick={handleAgregarObservacion}
                  disabled={!nuevaObservacion.trim()}
                  className="w-full"
                >
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Guardar Observación
                </Button>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}