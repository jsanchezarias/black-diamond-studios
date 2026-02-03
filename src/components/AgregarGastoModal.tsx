import { useState } from 'react';
import { X, DollarSign, FileText, Calendar, Tag, Upload, CheckCircle } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Label } from './ui/label';
import { toast } from 'sonner@2.0.3';
import { useGastos } from '../src/app/components/GastosContext';

interface AgregarGastoModalProps {
  isOpen: boolean;
  onClose: () => void;
  userEmail: string;
}

export function AgregarGastoModal({ isOpen, onClose, userEmail }: AgregarGastoModalProps) {
  const { agregarGasto } = useGastos();
  const [concepto, setConcepto] = useState('');
  const [categoria, setCategoria] = useState<'nomina' | 'arriendo' | 'servicios' | 'mantenimiento' | 'marketing' | 'insumos' | 'transporte' | 'honorarios' | 'otros'>('otros');
  const [monto, setMonto] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0]);
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

    if (!concepto.trim() || !monto || parseFloat(monto) <= 0) {
      toast.error('Por favor completa todos los campos obligatorios');
      return;
    }

    agregarGasto({
      fecha: new Date(fecha),
      concepto: concepto.trim(),
      categoria,
      monto: parseFloat(monto),
      descripcion: descripcion.trim(),
      comprobante: comprobante || undefined,
      responsable: userEmail,
      estado: 'pendiente',
    });

    toast.success('Gasto registrado correctamente', {
      description: 'El gasto está pendiente de aprobación',
    });

    // Reset
    setConcepto('');
    setCategoria('otros');
    setMonto('');
    setDescripcion('');
    setFecha(new Date().toISOString().split('T')[0]);
    setComprobante(null);
    onClose();
  };

  const categorias = [
    { value: 'nomina', label: 'Nómina', icon: '👥' },
    { value: 'arriendo', label: 'Arriendo', icon: '🏢' },
    { value: 'servicios', label: 'Servicios Públicos', icon: '💡' },
    { value: 'mantenimiento', label: 'Mantenimiento', icon: '🔧' },
    { value: 'marketing', label: 'Marketing', icon: '📢' },
    { value: 'insumos', label: 'Insumos', icon: '📦' },
    { value: 'transporte', label: 'Transporte', icon: '🚗' },
    { value: 'honorarios', label: 'Honorarios', icon: '💼' },
    { value: 'otros', label: 'Otros', icon: '📋' },
  ];

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto border-primary/30 shadow-2xl">
        <CardHeader className="border-b border-border/50 bg-gradient-to-r from-primary/5 to-transparent">
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-2xl flex items-center gap-2 text-primary">
                <DollarSign className="w-6 h-6" />
                Registrar Gasto Operativo
              </CardTitle>
              <CardDescription className="mt-2">
                Registra un nuevo gasto de la agencia para aprobación
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
            {/* Fecha */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-primary" />
                Fecha del Gasto *
              </Label>
              <input
                type="date"
                value={fecha}
                onChange={(e) => setFecha(e.target.value)}
                className="w-full px-4 py-2 bg-secondary border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                required
              />
            </div>

            {/* Concepto */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-primary" />
                Concepto del Gasto *
              </Label>
              <input
                type="text"
                value={concepto}
                onChange={(e) => setConcepto(e.target.value)}
                placeholder="Ej: Pago arriendo local mes de enero"
                className="w-full px-4 py-2 bg-secondary border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                required
              />
            </div>

            {/* Categoría */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Tag className="w-4 h-4 text-primary" />
                Categoría *
              </Label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {categorias.map((cat) => (
                  <button
                    key={cat.value}
                    type="button"
                    onClick={() => setCategoria(cat.value as any)}
                    className={`p-3 rounded-lg border-2 transition-all text-left ${
                      categoria === cat.value
                        ? 'border-primary bg-primary/10'
                        : 'border-border bg-secondary hover:border-primary/50'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{cat.icon}</span>
                      <span className="text-sm font-medium">{cat.label}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Monto */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-primary" />
                Monto *
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
                  className="w-full pl-8 pr-4 py-2 bg-secondary border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                  required
                />
              </div>
              {monto && parseFloat(monto) > 0 && (
                <p className="text-sm text-muted-foreground">
                  ${parseFloat(monto).toLocaleString('es-CO')} COP
                </p>
              )}
            </div>

            {/* Descripción */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-primary" />
                Descripción (Opcional)
              </Label>
              <textarea
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                placeholder="Detalles adicionales del gasto..."
                rows={3}
                className="w-full px-4 py-2 bg-secondary border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
              />
            </div>

            {/* Comprobante */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Upload className="w-4 h-4 text-primary" />
                Comprobante de Pago (Opcional)
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
                      id="comprobante-upload"
                    />
                    <label htmlFor="comprobante-upload">
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
              <Button type="submit" className="flex-1 bg-primary text-primary-foreground">
                <DollarSign className="w-4 h-4 mr-2" />
                Registrar Gasto
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
