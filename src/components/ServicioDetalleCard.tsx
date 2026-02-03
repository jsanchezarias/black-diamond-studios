import { 
  Clock, 
  DollarSign, 
  User, 
  MapPin, 
  Calendar,
  ShoppingBag,
  Plus,
  FileText,
  Receipt,
  CreditCard,
  CheckCircle,
  Image as ImageIcon
} from 'lucide-react';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { Button } from './ui/button';
import { Servicio } from '../src/app/components/ServiciosContext';

interface ServicioDetalleCardProps {
  servicio: Servicio;
  mostrarCliente?: boolean; // Si es false (modelo), muestra nombre pero NO teléfono
}

export function ServicioDetalleCard({ servicio, mostrarCliente = false }: ServicioDetalleCardProps) {
  // Calcular costo total
  const calcularCostoTotal = () => {
    let total = servicio.costoServicio;

    // Sumar tiempos adicionales
    if (servicio.tiemposAdicionales) {
      total += servicio.tiemposAdicionales.reduce((sum, t) => sum + t.costo, 0);
    }

    // Sumar adicionales extra
    if (servicio.adicionalesExtra) {
      total += servicio.adicionalesExtra.reduce((sum, a) => sum + a.costo, 0);
    }

    // Sumar consumos detallados
    if (servicio.consumosDetallados) {
      total += servicio.consumosDetallados.reduce((sum, c) => sum + c.costo, 0);
    }

    // Adicionales y consumos antiguos (compatibilidad)
    total += servicio.costoAdicionales || 0;
    total += servicio.costoConsumo || 0;

    return total;
  };

  const costoTotal = calcularCostoTotal();

  return (
    <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
      {/* Header del servicio */}
      <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-primary/10">
        <CardContent className="p-4">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2">
              <User className="w-5 h-5 text-primary" />
              <div>
                <h3 className="font-bold text-lg">{servicio.modeloNombre}</h3>
                {/* Mostrar nombre del cliente siempre (si existe) */}
                {servicio.clienteNombre && (
                  <p className="text-sm text-muted-foreground">Cliente: {servicio.clienteNombre}</p>
                )}
                {/* Solo mostrar teléfono si es owner/admin/programador */}
                {mostrarCliente && servicio.clienteTelefono && (
                  <p className="text-xs text-muted-foreground">Tel: {servicio.clienteTelefono}</p>
                )}
              </div>
            </div>
            <Badge 
              variant={servicio.estado === 'activo' ? 'default' : 'secondary'}
              className={servicio.estado === 'activo' ? 'bg-green-500' : ''}
            >
              {servicio.estado === 'activo' ? '🟢 En Curso' : '✅ Finalizado'}
            </Badge>
          </div>

          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-primary" />
              <div>
                <p className="text-xs text-muted-foreground">Fecha</p>
                <p className="font-semibold">
                  {servicio.horaInicio.toLocaleDateString('es-CO', { 
                    day: '2-digit', 
                    month: 'short', 
                    year: 'numeric' 
                  })}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-primary" />
              <div>
                <p className="text-xs text-muted-foreground">Horario</p>
                <p className="font-semibold">
                  {servicio.horaInicio.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}
                  {servicio.horaFin && ` - ${servicio.horaFin.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}`}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Información del servicio */}
      <Card>
        <CardContent className="p-4 space-y-3">
          <h4 className="font-semibold text-sm text-primary flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Información del Servicio
          </h4>

          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="p-3 bg-secondary/50 rounded-lg">
              <p className="text-xs text-muted-foreground mb-1">Tipo de Servicio</p>
              <p className="font-semibold flex items-center gap-1">
                <MapPin className="w-3 h-3 text-primary" />
                {servicio.tipoServicio}
              </p>
            </div>

            <div className="p-3 bg-secondary/50 rounded-lg">
              <p className="text-xs text-muted-foreground mb-1">Duración</p>
              <p className="font-semibold flex items-center gap-1">
                <Clock className="w-3 h-3 text-primary" />
                {servicio.tiempoServicio}
              </p>
            </div>

            {servicio.habitacion && (
              <div className="p-3 bg-secondary/50 rounded-lg">
                <p className="text-xs text-muted-foreground mb-1">Habitación</p>
                <p className="font-semibold">{servicio.habitacion}</p>
              </div>
            )}

            <div className="p-3 bg-secondary/50 rounded-lg">
              <p className="text-xs text-muted-foreground mb-1">Método de Pago</p>
              <p className="font-semibold flex items-center gap-1">
                <CreditCard className="w-3 h-3 text-primary" />
                {servicio.metodoPago}
              </p>
            </div>
          </div>

          {servicio.comprobantePago && (
            <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
              <div className="flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-blue-400" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-blue-400 font-medium">Comprobante de Pago</p>
                  <p className="text-xs text-muted-foreground truncate">{servicio.comprobantePago}</p>
                </div>
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="h-7 text-xs"
                  onClick={() => window.open(servicio.comprobantePago, '_blank')}
                >
                  Ver
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Desglose de costos */}
      <Card>
        <CardContent className="p-4 space-y-3">
          <h4 className="font-semibold text-sm text-primary flex items-center gap-2">
            <Receipt className="w-4 h-4" />
            Desglose de Costos
          </h4>

          <div className="space-y-2">
            {/* Servicio base */}
            <div className="flex items-center justify-between p-2 bg-secondary/30 rounded">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-primary" />
                <div>
                  <p className="text-sm font-medium">Servicio Base</p>
                  <p className="text-xs text-muted-foreground">{servicio.tiempoServicio}</p>
                </div>
              </div>
              <span className="font-semibold">${servicio.costoServicio.toLocaleString('es-CO')}</span>
            </div>

            {/* Tiempos adicionales */}
            {servicio.tiemposAdicionales && servicio.tiemposAdicionales.length > 0 && (
              <>
                <Separator />
                <p className="text-xs font-semibold text-muted-foreground">Tiempos Adicionales</p>
                {servicio.tiemposAdicionales.map((t, i) => (
                  <div key={i} className="flex items-center justify-between p-2 bg-blue-500/5 border border-blue-500/20 rounded">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-blue-400" />
                      <div>
                        <p className="text-sm font-medium">{t.tiempo}</p>
                        {t.comprobante && (
                          <p className="text-xs text-muted-foreground">Con comprobante</p>
                        )}
                      </div>
                    </div>
                    <span className="font-semibold text-blue-400">${t.costo.toLocaleString('es-CO')}</span>
                  </div>
                ))}
              </>
            )}

            {/* Adicionales extra */}
            {servicio.adicionalesExtra && servicio.adicionalesExtra.length > 0 && (
              <>
                <Separator />
                <p className="text-xs font-semibold text-muted-foreground">Adicionales</p>
                {servicio.adicionalesExtra.map((a, i) => (
                  <div key={i} className="flex items-center justify-between p-2 bg-purple-500/5 border border-purple-500/20 rounded">
                    <div className="flex items-center gap-2">
                      <Plus className="w-4 h-4 text-purple-400" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{a.descripcion}</p>
                        {a.comprobante && (
                          <p className="text-xs text-muted-foreground">Con comprobante</p>
                        )}
                      </div>
                    </div>
                    <span className="font-semibold text-purple-400">${a.costo.toLocaleString('es-CO')}</span>
                  </div>
                ))}
              </>
            )}

            {/* Consumos detallados (Boutique) */}
            {servicio.consumosDetallados && servicio.consumosDetallados.length > 0 && (
              <>
                <Separator />
                <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
                  <ShoppingBag className="w-3 h-3" />
                  Boutique
                </p>
                {servicio.consumosDetallados.map((c, i) => (
                  <div key={i} className="flex items-center justify-between p-2 bg-green-500/5 border border-green-500/20 rounded">
                    <div className="flex items-center gap-2">
                      <ShoppingBag className="w-4 h-4 text-green-400" />
                      <div>
                        <p className="text-sm font-medium">{c.descripcion}</p>
                        {c.cantidad > 1 && (
                          <p className="text-xs text-muted-foreground">Cantidad: {c.cantidad}</p>
                        )}
                      </div>
                    </div>
                    <span className="font-semibold text-green-400">${c.costo.toLocaleString('es-CO')}</span>
                  </div>
                ))}
              </>
            )}

            {/* Adicionales antiguos (compatibilidad) */}
            {servicio.costoAdicionales > 0 && !servicio.adicionalesExtra?.length && (
              <div className="flex items-center justify-between p-2 bg-purple-500/5 border border-purple-500/20 rounded">
                <div className="flex items-center gap-2">
                  <Plus className="w-4 h-4 text-purple-400" />
                  <p className="text-sm font-medium">{servicio.adicionales || 'Adicionales'}</p>
                </div>
                <span className="font-semibold text-purple-400">${servicio.costoAdicionales.toLocaleString('es-CO')}</span>
              </div>
            )}

            {/* Consumo antiguo (compatibilidad) */}
            {servicio.costoConsumo > 0 && !servicio.consumosDetallados?.length && (
              <div className="flex items-center justify-between p-2 bg-green-500/5 border border-green-500/20 rounded">
                <div className="flex items-center gap-2">
                  <ShoppingBag className="w-4 h-4 text-green-400" />
                  <p className="text-sm font-medium">{servicio.consumo || 'Consumo'}</p>
                </div>
                <span className="font-semibold text-green-400">${servicio.costoConsumo.toLocaleString('es-CO')}</span>
              </div>
            )}
          </div>

          {/* Total */}
          <Separator />
          <div className="p-4 bg-primary/10 rounded-lg border-2 border-primary/30">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-primary" />
                <span className="text-base font-bold">TOTAL SERVICIO</span>
              </div>
              <span className="text-2xl font-bold text-primary">
                ${costoTotal.toLocaleString('es-CO')}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notas y observaciones */}
      {servicio.notasCierre && (
        <Card>
          <CardContent className="p-4">
            <h4 className="font-semibold text-sm text-primary flex items-center gap-2 mb-3">
              <FileText className="w-4 h-4" />
              Notas del Servicio
            </h4>
            <div className="p-3 bg-secondary/50 rounded-lg">
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                {servicio.notasCierre}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Estado del servicio */}
      <Card className={`border-${servicio.estado === 'finalizado' ? 'green' : 'blue'}-500/20 bg-${servicio.estado === 'finalizado' ? 'green' : 'blue'}-500/5`}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle className={`w-5 h-5 text-${servicio.estado === 'finalizado' ? 'green' : 'blue'}-500`} />
              <div>
                <p className="font-semibold text-sm">Estado del Servicio</p>
                <p className="text-xs text-muted-foreground">
                  {servicio.estado === 'finalizado' ? 'Servicio completado' : 'Servicio en curso'}
                </p>
              </div>
            </div>
            <Badge className={servicio.estado === 'finalizado' ? 'bg-green-500' : 'bg-blue-500'}>
              {servicio.estado === 'finalizado' ? 'Finalizado' : 'En Curso'}
            </Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}