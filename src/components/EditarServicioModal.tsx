import { toast } from 'sonner';
import { useState } from 'react';
import { X, Edit, AlertTriangle, Save } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { useServicios, Servicio } from '../app/components/ServiciosContext';

interface EditarServicioModalProps {
  isOpen: boolean;
  onClose: () => void;
  servicio: Servicio;
}

export function EditarServicioModal({ isOpen, onClose, servicio }: EditarServicioModalProps) {
  const { editarServicioFinalizado } = useServicios();
  
  const [tipoServicio, setTipoServicio] = useState<'sede' | 'domicilio'>(servicio.tipoServicio);
  const [tiempoServicio, setTiempoServicio] = useState<string>(servicio.tiempoServicio ?? '');
  const [costoServicio, setCostoServicio] = useState((servicio.costoServicio ?? 0).toString());
  const [costoAdicionales, setCostoAdicionales] = useState((servicio.costoAdicionales ?? 0).toString());
  const [costoConsumo, setCostoConsumo] = useState((servicio.costoConsumo ?? 0).toString());
  const [motivoEdicion, setMotivoEdicion] = useState('');
  const [confirmacion, setConfirmacion] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!motivoEdicion.trim()) {
      toast.error('⚠️ Debes ingresar el motivo de la modificación');
      return;
    }

    if (confirmacion.toUpperCase() !== 'MODIFICAR') {
      toast.error('⚠️ Debes escribir "MODIFICAR" para confirmar los cambios');
      return;
    }

    const datosEditados = {
      tipoServicio,
      tiempoServicio,
      costoServicio: parseFloat(costoServicio),
      costoAdicionales: parseFloat(costoAdicionales),
      costoConsumo: parseFloat(costoConsumo),
      motivoEdicion,
    };

    editarServicioFinalizado(servicio.id, datosEditados);

    toast.success(`✅ Servicio modificado exitosamente\n\nMotivo: ${motivoEdicion}\n\nLos cambios se reflejarán en el cálculo de liquidación.`);

    // Reset
    setMotivoEdicion('');
    setConfirmacion('');
    onClose();
  };

  if (!isOpen) return null;

  // Calcular totales
  const costoOriginal = (servicio.costoServicio ?? 0) + (servicio.costoAdicionales ?? 0) + (servicio.costoConsumo ?? 0);
  const costoNuevo = parseFloat(costoServicio || '0') + parseFloat(costoAdicionales || '0') + parseFloat(costoConsumo || '0');
  const diferencia = costoNuevo - costoOriginal;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-card border border-primary/30 rounded-lg shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-card border-b border-border p-6 flex items-center justify-between z-10">
          <div>
            <h2 className="text-2xl font-bold text-primary flex items-center gap-2">
              <Edit className="w-6 h-6" />
              Editar Servicio
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Modificación administrativa autorizada
            </p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Advertencia */}
          <div className="p-4 bg-yellow-950/30 border-2 border-yellow-500/50 rounded-lg">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-yellow-500 mb-1">⚠️ Modificación Administrativa</h3>
                <p className="text-sm text-muted-foreground">
                  Esta acción modificará el servicio reportado por la modelo. Los cambios afectarán el cálculo de liquidación. 
                  Solo procede si tienes autorización de la empresa.
                </p>
              </div>
            </div>
          </div>

          {/* Información Original */}
          <div className="space-y-2">
            <Label className="text-primary font-semibold">Información Original</Label>
            <div className="grid grid-cols-2 gap-3 p-4 bg-secondary/50 rounded-lg border border-border">
              <div>
                <span className="text-xs text-muted-foreground">Modelo</span>
                <p className="font-medium">{servicio.modeloNombre}</p>
              </div>
              <div>
                <span className="text-xs text-muted-foreground">Tipo Original</span>
                <p className="font-medium">{servicio.tipoServicio}</p>
              </div>
              <div>
                <span className="text-xs text-muted-foreground">Tiempo Original</span>
                <p className="font-medium">{servicio.tiempoServicio}</p>
              </div>
              <div>
                <span className="text-xs text-muted-foreground">Total Original</span>
                <p className="font-bold text-primary">${costoOriginal.toLocaleString()}</p>
              </div>
            </div>
          </div>

          {/* Tipo de Servicio */}
          <div className="space-y-2">
            <Label>Tipo de Servicio</Label>
            <div className="grid grid-cols-2 gap-3">
              {(['sede', 'domicilio'] as const).map((tipo) => (
                <button
                  key={tipo}
                  type="button"
                  onClick={() => setTipoServicio(tipo)}
                  className={`p-3 rounded-lg border-2 transition-all font-medium ${
                    tipoServicio === tipo
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  {tipo.charAt(0).toUpperCase() + tipo.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Tiempo de Servicio */}
          <div className="space-y-2">
            <Label>Tiempo de Servicio</Label>
            <div className="grid grid-cols-2 gap-3">
              {(['30 minutos', '1 hora', 'rato', 'varias horas', 'amanecida'] as const).map((tiempo) => (
                <button
                  key={tiempo}
                  type="button"
                  onClick={() => setTiempoServicio(tiempo)}
                  className={`p-3 rounded-lg border-2 transition-all font-medium ${
                    tiempoServicio === tiempo
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  {tiempo}
                </button>
              ))}
            </div>
          </div>

          {/* Costos */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="costoServicio">Costo Servicio</Label>
              <Input
                id="costoServicio"
                type="number"
                value={costoServicio}
                onChange={(e) => setCostoServicio(e.target.value)}
                required
                className="text-lg"
              />
              <p className="text-xs text-muted-foreground">
                Original: ${servicio.costoServicio.toLocaleString()}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="costoAdicionales">Costo Adicionales</Label>
              <Input
                id="costoAdicionales"
                type="number"
                value={costoAdicionales}
                onChange={(e) => setCostoAdicionales(e.target.value)}
                required
                className="text-lg"
              />
              <p className="text-xs text-muted-foreground">
                Original: ${servicio.costoAdicionales.toLocaleString()}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="costoConsumo">Costo Consumo</Label>
              <Input
                id="costoConsumo"
                type="number"
                value={costoConsumo}
                onChange={(e) => setCostoConsumo(e.target.value)}
                required
                className="text-lg"
              />
              <p className="text-xs text-muted-foreground">
                Original: ${servicio.costoConsumo.toLocaleString()}
              </p>
            </div>
          </div>

          {/* Comparación de Totales */}
          <div className="p-4 bg-primary/10 border-2 border-primary/30 rounded-lg">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <span className="text-xs text-muted-foreground block mb-1">Total Original</span>
                <span className="text-xl font-bold text-foreground">
                  ${costoOriginal.toLocaleString()}
                </span>
              </div>
              <div>
                <span className="text-xs text-muted-foreground block mb-1">Total Nuevo</span>
                <span className="text-xl font-bold text-primary">
                  ${costoNuevo.toLocaleString()}
                </span>
              </div>
              <div>
                <span className="text-xs text-muted-foreground block mb-1">Diferencia</span>
                <span className={`text-xl font-bold ${diferencia >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {diferencia >= 0 ? '+' : ''}${diferencia.toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {/* Motivo de la Edición */}
          <div className="space-y-2">
            <Label htmlFor="motivoEdicion" className="text-destructive">
              Motivo de la Modificación *
            </Label>
            <Textarea
              id="motivoEdicion"
              placeholder="Ej: Ajuste autorizado por gerencia debido a cambio de habitación de último momento"
              value={motivoEdicion}
              onChange={(e) => setMotivoEdicion(e.target.value)}
              required
              rows={3}
              className="resize-none"
            />
            <p className="text-xs text-muted-foreground">
              Este motivo quedará registrado en el historial del servicio para auditoría
            </p>
          </div>

          {/* Confirmación */}
          <div className="space-y-2">
            <Label htmlFor="confirmacion" className="text-destructive">
              Confirmación *
            </Label>
            <Input
              id="confirmacion"
              type="text"
              placeholder='Escribe "MODIFICAR" para confirmar'
              value={confirmacion}
              onChange={(e) => setConfirmacion(e.target.value)}
              required
              className="text-lg"
            />
            <p className="text-xs text-muted-foreground">
              Escribe exactamente "MODIFICAR" (en mayúsculas) para confirmar los cambios
            </p>
          </div>

          {/* Nota Legal */}
          <div className="p-3 bg-secondary/50 border border-border rounded-lg">
            <p className="text-xs text-muted-foreground">
              📋 <strong>Nota:</strong> Esta modificación quedará registrada con fecha, hora, usuario administrador y motivo. 
              El historial completo está disponible para auditorías internas.
            </p>
          </div>

          {/* Botones */}
          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Cancelar
            </Button>
            <Button 
              type="submit" 
              className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
              disabled={confirmacion.toUpperCase() !== 'MODIFICAR'}
            >
              <Save className="w-4 h-4 mr-2" />
              Guardar Cambios
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
