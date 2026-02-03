import { useState } from 'react';
import { X, DollarSign, Upload, CheckCircle, FileText, Calendar } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Label } from './ui/label';
import { toast } from 'sonner@2.0.3';
import { useGastos, ServicioPublico } from '../src/app/components/GastosContext';

interface PagarServicioModalProps {
  isOpen: boolean;
  onClose: () => void;
  servicio: ServicioPublico;
}

export function PagarServicioModal({ isOpen, onClose, servicio }: PagarServicioModalProps) {
  const { marcarServicioPagado } = useGastos();
  const [monto, setMonto] = useState(servicio.montoPromedio.toString());
  const [numeroReferencia, setNumeroReferencia] = useState('');
  const [comprobante, setComprobante] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setComprobante(event.target?.result as string);
        toast.success('Comprobante cargado correctamente');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!monto || parseFloat(monto) <= 0) {
      toast.error('Por favor ingresa un monto válido');
      return;
    }

    marcarServicioPagado(
      servicio.id,
      parseFloat(monto),
      comprobante || undefined,
      numeroReferencia.trim() || undefined
    );

    toast.success('✅ Servicio marcado como pagado', {
      description: `${servicio.nombre} - $${parseFloat(monto).toLocaleString('es-CO')}`,
    });

    // Reset
    setMonto(servicio.montoPromedio.toString());
    setNumeroReferencia('');
    setComprobante(null);
    onClose();
  };

  const tipoIconos: Record<string, string> = {
    agua: '💧',
    luz: '⚡',
    gas: '🔥',
    internet: '🌐',
    telefono: '📞',
    alarma: '🔔',
    aseo: '🧹',
    otro: '📋',
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-xl border-primary/30 shadow-2xl">
        <CardHeader className="border-b border-border/50 bg-gradient-to-r from-green-500/10 to-transparent">
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-2xl flex items-center gap-2 text-primary">
                <CheckCircle className="w-6 h-6" />
                Marcar Servicio como Pagado
              </CardTitle>
              <CardDescription className="mt-2">
                {servicio.nombre} - {servicio.proveedor}
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
          {/* Info del Servicio */}
          <div className="bg-secondary/50 rounded-lg p-4 mb-6 space-y-2">
            <div className="flex items-center gap-3">
              <span className="text-3xl">{tipoIconos[servicio.tipo]}</span>
              <div className="flex-1">
                <h3 className="font-semibold text-lg">{servicio.nombre}</h3>
                <p className="text-sm text-muted-foreground">{servicio.proveedor}</p>
              </div>
            </div>
            {servicio.numeroCuenta && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground pt-2 border-t border-border/50">
                <FileText className="w-4 h-4" />
                <span>Cuenta: {servicio.numeroCuenta}</span>
              </div>
            )}
            {servicio.proximoPago && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="w-4 h-4" />
                <span>
                  Fecha límite: {new Date(servicio.proximoPago).toLocaleDateString('es-ES', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric'
                  })}
                </span>
              </div>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Monto Pagado */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-primary" />
                Monto Pagado *
              </Label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">
                  $
                </span>
                <input
                  type="number"
                  value={monto}
                  onChange={(e) => setMonto(e.target.value)}
                  placeholder="0"
                  min="0"
                  step="1000"
                  className="w-full pl-8 pr-4 py-3 text-lg bg-secondary border-2 border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
                  required
                />
              </div>
              {monto && parseFloat(monto) > 0 && (
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    ${parseFloat(monto).toLocaleString('es-CO')} COP
                  </p>
                  {servicio.montoPromedio && Math.abs(parseFloat(monto) - servicio.montoPromedio) > 50000 && (
                    <p className="text-xs text-yellow-500">
                      Promedio: ${servicio.montoPromedio.toLocaleString('es-CO')}
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Número de Referencia */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-primary" />
                Número de Referencia (Opcional)
              </Label>
              <input
                type="text"
                value={numeroReferencia}
                onChange={(e) => setNumeroReferencia(e.target.value)}
                placeholder="Ej: REF-2026-01-001"
                className="w-full px-4 py-2 bg-secondary border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>

            {/* Comprobante */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Upload className="w-4 h-4 text-primary" />
                Comprobante de Pago
              </Label>
              <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary/50 transition-all">
                {comprobante ? (
                  <div className="space-y-3">
                    <div className="w-16 h-16 mx-auto rounded-full bg-green-500/20 flex items-center justify-center">
                      <CheckCircle className="w-8 h-8 text-green-500" />
                    </div>
                    <p className="text-sm font-medium text-green-500">
                      Comprobante cargado correctamente
                    </p>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setComprobante(null)}
                    >
                      Cambiar archivo
                    </Button>
                  </div>
                ) : (
                  <>
                    <Upload className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
                    <p className="text-sm text-muted-foreground mb-2">
                      Arrastra un archivo o haz clic para seleccionar
                    </p>
                    <input
                      type="file"
                      accept="image/*,application/pdf"
                      onChange={handleFileUpload}
                      className="hidden"
                      id="comprobante-pago-upload"
                    />
                    <label htmlFor="comprobante-pago-upload">
                      <Button type="button" variant="outline" size="sm" asChild>
                        <span>Seleccionar Archivo</span>
                      </Button>
                    </label>
                  </>
                )}
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
              <Button 
                type="submit" 
                className="flex-1 bg-green-600 text-white hover:bg-green-700"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Confirmar Pago
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
