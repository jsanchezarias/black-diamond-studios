import { useState } from 'react';
import { X, StopCircle, Clock, DollarSign, Image as ImageIcon, CheckCircle2, MessageSquare, Star, ThumbsUp, ThumbsDown } from 'lucide-react';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { useServicios, Servicio } from '../src/app/components/ServiciosContext';
import { useTurnos } from '../src/app/components/TurnosContext';
import { useAgendamientos } from '../src/app/components/AgendamientosContext';
import { useClientes } from '../src/app/components/ClientesContext';

interface FinalizarServicioModalProps {
  isOpen: boolean;
  onClose: () => void;
  servicio: Servicio;
}

export function FinalizarServicioModal({ isOpen, onClose, servicio }: FinalizarServicioModalProps) {
  const { finalizarServicio } = useServicios();
  const { cambiarEstado } = useTurnos();
  const { marcarComoCompletado } = useAgendamientos();
  const { agregarServicioACliente, agregarObservacionModelo } = useClientes();
  const [notasCierre, setNotasCierre] = useState('');
  const [observacionCliente, setObservacionCliente] = useState('');
  const [ratingCliente, setRatingCliente] = useState(3);
  const [tipoObservacion, setTipoObservacion] = useState<'positiva' | 'negativa' | 'neutral'>('neutral');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Calcular duración real del servicio
    const duracionReal = Math.floor((new Date().getTime() - servicio.horaInicio.getTime()) / 60000);
    
    // Calcular costo total de tiempos adicionales
    const costoTiemposAdicionales = servicio.tiemposAdicionales?.reduce((sum, t) => sum + t.costo, 0) || 0;
    const costoAdicionalesExtra = servicio.adicionalesExtra?.reduce((sum, a) => sum + a.costo, 0) || 0;
    const costoConsumosDetallados = servicio.consumosDetallados?.reduce((sum, c) => sum + (c.costo * c.cantidad), 0) || 0;
    const total = servicio.costoServicio + servicio.costoAdicionales + servicio.costoConsumo + costoTiemposAdicionales + costoAdicionalesExtra + costoConsumosDetallados;
    
    // Marcar agendamiento como completado si existe
    if (servicio.agendamientoId) {
      marcarComoCompletado(servicio.agendamientoId);
    }
    
    // Agregar al historial del cliente si existe teléfono
    if (servicio.clienteTelefono) {
      await agregarServicioACliente(servicio.clienteTelefono, {
        fecha: new Date().toISOString(),
        modeloNombre: servicio.modeloNombre,
        modeloEmail: servicio.modeloEmail,
        tipoServicio: servicio.tipoServicio,
        tiempoServicio: servicio.tiempoServicio,
        costoTotal: total, // TOTAL COMPLETO con todos los ítems
        costoServicio: servicio.costoServicio, // Costo base del servicio
        costoAdicionales: servicio.costoAdicionales + costoAdicionalesExtra, // Incluir adicionales extra
        costoConsumo: servicio.costoConsumo + costoConsumosDetallados, // Incluir consumos detallados
        costoTiemposAdicionales, // Agregar el costo de tiempos adicionales
        costoAdicionalesExtra, // Agregar el costo de adicionales extra
        costoConsumosDetallados, // Agregar el costo de productos de boutique
        metodoPago: servicio.metodoPago,
        adicionales: servicio.adicionales,
        consumo: servicio.consumo,
        habitacion: servicio.habitacion,
        duracionMinutos: duracionReal,
        notasServicio: notasCierre, // Incluir las notas del servicio
        observacionModelo: observacionCliente, // Observación privada de la modelo
        // Pasar arrays completos de ítems agregados
        tiemposAdicionales: servicio.tiemposAdicionales,
        adicionalesExtra: servicio.adicionalesExtra,
        consumosDetallados: servicio.consumosDetallados,
      });
      
      // Agregar observación sobre el cliente si hay
      if (observacionCliente.trim()) {
        await agregarObservacionModelo(
          servicio.clienteTelefono,
          servicio.modeloNombre,
          servicio.modeloEmail,
          observacionCliente,
          ratingCliente,
          tipoObservacion
        );
      }
    }
    
    finalizarServicio(servicio.id, notasCierre);
    
    // Cambiar estado del turno a "Disponible"
    cambiarEstado(servicio.modeloEmail, 'Disponible');
    
    setNotasCierre('');
    setObservacionCliente('');
    setRatingCliente(3);
    setTipoObservacion('neutral');
    onClose();
  };

  const formatTiempoRestante = (segundos: number) => {
    const horas = Math.floor(segundos / 3600);
    const minutos = Math.floor((segundos % 3600) / 60);
    const segs = segundos % 60;
    
    if (horas > 0) {
      return `${horas}h ${minutos}m ${segs}s`;
    }
    return `${minutos}m ${segs}s`;
  };

  // Calcular costo total de tiempos adicionales
  const costoTiemposAdicionales = servicio.tiemposAdicionales?.reduce((sum, t) => sum + t.costo, 0) || 0;
  const costoAdicionalesExtra = servicio.adicionalesExtra?.reduce((sum, a) => sum + a.costo, 0) || 0;
  const costoConsumosDetallados = servicio.consumosDetallados?.reduce((sum, c) => sum + (c.costo * c.cantidad), 0) || 0;
  const total = servicio.costoServicio + servicio.costoAdicionales + servicio.costoConsumo + costoTiemposAdicionales + costoAdicionalesExtra + costoConsumosDetallados;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-card border border-primary/30 rounded-lg shadow-2xl max-w-lg w-full max-h-[90vh] flex flex-col">
        <div className="bg-card border-b border-border p-4 sm:p-6 flex items-center justify-between flex-shrink-0">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-primary">Finalizar Servicio</h2>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1">Registra el cierre del servicio</p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="flex-shrink-0">
            <X className="w-5 h-5" />
          </Button>
        </div>

        <div className="p-4 sm:p-6 space-y-4 overflow-y-auto">
          {/* Resumen del Servicio */}
          <div className="space-y-3 p-3 sm:p-4 bg-secondary/50 rounded-lg border border-border">
            <h3 className="font-bold text-primary text-sm sm:text-base">Resumen del Servicio</h3>
            
            {/* Datos del Cliente */}
            {servicio.clienteNombre && (
              <div className="p-3 bg-primary/5 border border-primary/20 rounded-lg">
                <p className="text-xs text-muted-foreground mb-1">Cliente</p>
                <p className="font-medium text-sm sm:text-base">{servicio.clienteNombre}</p>
                {servicio.clienteTelefono && (
                  <p className="text-xs sm:text-sm text-muted-foreground">{servicio.clienteTelefono}</p>
                )}
              </div>
            )}
            
            <div className="grid grid-cols-2 gap-3 text-xs sm:text-sm">
              <div>
                <span className="text-muted-foreground">Tipo:</span>
                <p className="font-medium">{servicio.tipoServicio}</p>
              </div>
              {servicio.habitacion && (
                <div>
                  <span className="text-muted-foreground">Habitación:</span>
                  <p className="font-medium">{servicio.habitacion}</p>
                </div>
              )}
              <div>
                <span className="text-muted-foreground">Duración:</span>
                <p className="font-medium">{servicio.tiempoServicio}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Método de Pago:</span>
                <p className="font-medium break-words">{servicio.metodoPago}</p>
              </div>
            </div>

            <div className="pt-3 border-t border-border space-y-2">
              <div className="flex justify-between text-xs sm:text-sm">
                <span className="text-muted-foreground">Servicio:</span>
                <span className="font-medium">${servicio.costoServicio.toLocaleString()}</span>
              </div>
              {costoTiemposAdicionales > 0 && (
                <div className="flex justify-between text-xs sm:text-sm gap-2">
                  <span className="text-muted-foreground flex-shrink-0">
                    Tiempo Adicional:
                    <span className="text-xs ml-1 block sm:inline">
                      ({servicio.tiemposAdicionales?.map(t => t.tiempo).join(', ')})
                    </span>
                  </span>
                  <span className="font-medium text-primary flex-shrink-0">${costoTiemposAdicionales.toLocaleString()}</span>
                </div>
              )}
              {servicio.costoAdicionales > 0 && (
                <div className="flex justify-between text-xs sm:text-sm">
                  <span className="text-muted-foreground">Adicionales:</span>
                  <span className="font-medium">${servicio.costoAdicionales.toLocaleString()}</span>
                </div>
              )}
              {costoAdicionalesExtra > 0 && (
                <div className="flex justify-between text-xs sm:text-sm">
                  <span className="text-muted-foreground">Adicionales Extra:</span>
                  <span className="font-medium text-primary">${costoAdicionalesExtra.toLocaleString()}</span>
                </div>
              )}
              {costoConsumosDetallados > 0 && (
                <div className="flex justify-between text-xs sm:text-sm">
                  <span className="text-muted-foreground flex-shrink-0">Consumos Detallados:</span>
                  <span className="font-medium text-primary flex-shrink-0">${costoConsumosDetallados.toLocaleString()}</span>
                </div>
              )}
              {servicio.costoConsumo > 0 && (
                <div className="flex justify-between text-xs sm:text-sm">
                  <span className="text-muted-foreground">Consumo:</span>
                  <span className="font-medium">${servicio.costoConsumo.toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between items-center pt-2 border-t border-border">
                <span className="font-bold text-sm sm:text-base">Total:</span>
                <span className="text-xl sm:text-2xl font-bold text-primary">${total.toLocaleString()}</span>
              </div>
            </div>

            {/* Tiempo Restante */}
            {servicio.tiempoRestante > 0 && (
              <div className="flex items-center gap-2 p-3 bg-primary/10 rounded-lg border border-primary/30">
                <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-primary flex-shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground">Tiempo restante</p>
                  <p className="font-bold text-sm sm:text-base text-primary">{formatTiempoRestante(servicio.tiempoRestante)}</p>
                </div>
              </div>
            )}

            {/* Comprobante de Pago */}
            {servicio.comprobantePago && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
                  <ImageIcon className="w-4 h-4" />
                  <span>Comprobante de Pago</span>
                </div>
                <img 
                  src={servicio.comprobantePago} 
                  alt="Comprobante de pago" 
                  className="w-full h-32 sm:h-40 object-cover rounded-lg border border-border"
                />
              </div>
            )}
          </div>

          {/* Notas de Cierre */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Indicador de Acciones que se Realizarán */}
            <div className="p-3 bg-primary/5 border border-primary/20 rounded-lg space-y-2">
              <p className="text-xs font-medium text-primary mb-2">Al finalizar este servicio se realizará:</p>
              <div className="space-y-1 text-xs">
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-3 h-3 text-primary flex-shrink-0 mt-0.5" />
                  <span className="break-words">Cambiar estado del turno a "Disponible"</span>
                </div>
                {servicio.clienteTelefono && (
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="w-3 h-3 text-primary flex-shrink-0 mt-0.5" />
                    <span className="break-words">Registrar servicio en historial de cliente ({servicio.clienteNombre})</span>
                  </div>
                )}
                {servicio.agendamientoId && (
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="w-3 h-3 text-primary flex-shrink-0 mt-0.5" />
                    <span className="break-words">Marcar agendamiento como completado</span>
                  </div>
                )}
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-3 h-3 text-primary flex-shrink-0 mt-0.5" />
                  <span className="break-words">Guardar registro del servicio finalizado</span>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notasCierre" className="text-sm">
                Notas sobre el Cliente y el Servicio
                <span className="text-destructive ml-1">*</span>
              </Label>
              <Textarea
                id="notasCierre"
                placeholder="Describe aspectos importantes del cliente, el servicio, comportamiento, preferencias, etc."
                value={notasCierre}
                onChange={(e) => setNotasCierre(e.target.value)}
                rows={4}
                required
                className="resize-none text-sm"
              />
              <p className="text-xs text-muted-foreground">
                Esta información es importante para futuras referencias
              </p>
            </div>

            {/* Observación del Cliente */}
            <div className="space-y-2">
              <Label htmlFor="observacionCliente" className="text-sm">
                Observación del Cliente
              </Label>
              <Textarea
                id="observacionCliente"
                placeholder="Escribe una observación sobre el cliente para la modelo"
                value={observacionCliente}
                onChange={(e) => setObservacionCliente(e.target.value)}
                rows={4}
                className="resize-none text-sm"
              />
              <p className="text-xs text-muted-foreground">
                Esta observación será visible solo para la modelo
              </p>
            </div>

            {/* Calificación del Cliente */}
            <div className="space-y-2">
              <Label htmlFor="ratingCliente" className="text-sm">
                Calificación del Cliente
              </Label>
              <div className="flex items-center gap-2">
                <Star className="w-4 h-4 text-primary" />
                <select
                  id="ratingCliente"
                  value={ratingCliente}
                  onChange={(e) => setRatingCliente(Number(e.target.value))}
                  className="text-sm"
                >
                  <option value={1}>1</option>
                  <option value={2}>2</option>
                  <option value={3}>3</option>
                  <option value={4}>4</option>
                  <option value={5}>5</option>
                </select>
              </div>
            </div>

            {/* Tipo de Observación */}
            <div className="space-y-2">
              <Label htmlFor="tipoObservacion" className="text-sm">
                Tipo de Observación
              </Label>
              <div className="flex items-center gap-2">
                <ThumbsUp className="w-4 h-4 text-primary" />
                <select
                  id="tipoObservacion"
                  value={tipoObservacion}
                  onChange={(e) => setTipoObservacion(e.target.value as 'positiva' | 'negativa' | 'neutral')}
                  className="text-sm"
                >
                  <option value="positiva">Positiva</option>
                  <option value="negativa">Negativa</option>
                  <option value="neutral">Neutral</option>
                </select>
              </div>
            </div>

            {/* Botones */}
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <Button type="button" variant="outline" onClick={onClose} className="flex-1 text-sm">
                Cancelar
              </Button>
              <Button type="submit" className="flex-1 bg-destructive text-destructive-foreground hover:bg-destructive/90 text-sm">
                <StopCircle className="w-4 h-4 mr-2" />
                Finalizar Servicio
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}