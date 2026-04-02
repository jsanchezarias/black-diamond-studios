import { useState } from 'react';
import { X, Zap, Calendar, DollarSign, FileText, CheckCircle, Building2 } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Label } from './ui/label';
import { toast } from 'sonner';
import { useGastos } from '../src/app/components/GastosContext';

interface AgregarServicioPublicoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AgregarServicioPublicoModal({ isOpen, onClose }: AgregarServicioPublicoModalProps) {
  const { agregarServicio } = useGastos();
  const [nombre, setNombre] = useState('');
  const [tipo, setTipo] = useState<'agua' | 'luz' | 'gas' | 'internet' | 'telefono' | 'alarma' | 'aseo' | 'otro'>('luz');
  const [proveedor, setProveedor] = useState('');
  const [numeroCuenta, setNumeroCuenta] = useState('');
  const [diaLimitePago, setDiaLimitePago] = useState('15');
  const [montoPromedio, setMontoPromedio] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!nombre.trim() || !proveedor.trim() || !montoPromedio || parseFloat(montoPromedio) <= 0) {
      toast.error('Por favor completa todos los campos obligatorios');
      return;
    }

    const dia = parseInt(diaLimitePago);
    if (dia < 1 || dia > 31) {
      toast.error('El día de pago debe estar entre 1 y 31');
      return;
    }

    // Calcular primera fecha de pago
    const hoy = new Date();
    const proximoPago = new Date(hoy.getFullYear(), hoy.getMonth(), dia);
    
    // Si ya pasó este mes, programar para el siguiente
    if (proximoPago < hoy) {
      proximoPago.setMonth(proximoPago.getMonth() + 1);
    }

    agregarServicio({
      nombre: nombre.trim(),
      tipo,
      proveedor: proveedor.trim(),
      numeroCuenta: numeroCuenta.trim() || undefined,
      fechaLimitePago: new Date(2026, 0, dia), // Guardar el día de referencia
      montoPromedio: parseFloat(montoPromedio),
      proximoPago,
      activo: true,
    });

    toast.success('Servicio público registrado', {
      description: `Se configuraron recordatorios para el día ${dia} de cada mes`,
    });

    // Reset
    setNombre('');
    setTipo('luz');
    setProveedor('');
    setNumeroCuenta('');
    setDiaLimitePago('15');
    setMontoPromedio('');
    onClose();
  };

  const tiposServicio = [
    { value: 'luz', label: 'Energía Eléctrica', icon: '⚡' },
    { value: 'agua', label: 'Agua y Alcantarillado', icon: '💧' },
    { value: 'gas', label: 'Gas Natural', icon: '🔥' },
    { value: 'internet', label: 'Internet', icon: '🌐' },
    { value: 'telefono', label: 'Telefonía', icon: '📞' },
    { value: 'alarma', label: 'Alarma y Seguridad', icon: '🔔' },
    { value: 'aseo', label: 'Aseo', icon: '🧹' },
    { value: 'otro', label: 'Otro', icon: '📋' },
  ];

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto border-primary/30 shadow-2xl">
        <CardHeader className="border-b border-border/50 bg-gradient-to-r from-primary/5 to-transparent">
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-2xl flex items-center gap-2 text-primary">
                <Zap className="w-6 h-6" />
                Agregar Servicio Público
              </CardTitle>
              <CardDescription className="mt-2">
                Configura un nuevo servicio con recordatorios automáticos
              </CardDescription>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="hover:bg-destructive/10 hover:text-destructive"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Tipo de Servicio */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-primary" />
                Tipo de Servicio *
              </Label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {tiposServicio.map((serv) => (
                  <button
                    key={serv.value}
                    type="button"
                    onClick={() => setTipo(serv.value as any)}
                    className={`p-3 rounded-lg border-2 transition-all ${
                      tipo === serv.value
                        ? 'border-primary bg-primary/10'
                        : 'border-border bg-secondary hover:border-primary/50'
                    }`}
                  >
                    <div className="text-center">
                      <span className="text-2xl block mb-1">{serv.icon}</span>
                      <span className="text-xs font-medium">{serv.label}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Nombre del Servicio */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-primary" />
                Nombre del Servicio *
              </Label>
              <input
                type="text"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Ej: Energía Eléctrica Local Comercial"
                className="w-full px-4 py-2 bg-secondary border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                required
              />
            </div>

            {/* Proveedor */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-primary" />
                Proveedor *
              </Label>
              <input
                type="text"
                value={proveedor}
                onChange={(e) => setProveedor(e.target.value)}
                placeholder="Ej: Empresa de Energía S.A."
                className="w-full px-4 py-2 bg-secondary border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                required
              />
            </div>

            {/* Número de Cuenta */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-primary" />
                Número de Cuenta (Opcional)
              </Label>
              <input
                type="text"
                value={numeroCuenta}
                onChange={(e) => setNumeroCuenta(e.target.value)}
                placeholder="Ej: 123456789"
                className="w-full px-4 py-2 bg-secondary border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Día Límite de Pago */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-primary" />
                  Día Límite de Pago *
                </Label>
                <select
                  value={diaLimitePago}
                  onChange={(e) => setDiaLimitePago(e.target.value)}
                  className="w-full px-4 py-2 bg-secondary border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                  required
                >
                  {Array.from({ length: 31 }, (_, i) => i + 1).map((dia) => (
                    <option key={dia} value={dia}>
                      Día {dia} de cada mes
                    </option>
                  ))}
                </select>
                <p className="text-xs text-muted-foreground">
                  ⏰ Recordatorio 3 días antes del día límite
                </p>
              </div>

              {/* Monto Promedio */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-primary" />
                  Monto Promedio *
                </Label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">
                    $
                  </span>
                  <input
                    type="number"
                    value={montoPromedio}
                    onChange={(e) => setMontoPromedio(e.target.value)}
                    placeholder="0"
                    min="0"
                    step="1000"
                    className="w-full pl-8 pr-4 py-2 bg-secondary border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                    required
                  />
                </div>
                {montoPromedio && parseFloat(montoPromedio) > 0 && (
                  <p className="text-xs text-muted-foreground">
                    ${parseFloat(montoPromedio).toLocaleString('es-CO')} COP
                  </p>
                )}
              </div>
            </div>

            {/* Información de Recordatorios */}
            <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                  <CheckCircle className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-sm mb-2">Recordatorios Automáticos</h4>
                  <ul className="text-xs text-muted-foreground space-y-1">
                    <li>• Notificación 3 días antes de la fecha límite</li>
                    <li>• Alarma diaria hasta marcar como pagado</li>
                    <li>• Opción de cargar comprobante de pago</li>
                    <li>• Historial de todos los pagos realizados</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Botones */}
            <div className="flex gap-3 pt-4 border-t border-border/50">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button type="submit" className="flex-1 bg-primary text-primary-foreground">
                <Zap className="w-4 h-4 mr-2" />
                Agregar Servicio
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
