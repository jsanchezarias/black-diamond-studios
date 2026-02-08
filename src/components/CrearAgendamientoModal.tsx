import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from './ui/dialog';
import { Label } from './ui/label';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Button } from './ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Calendar, Clock, User, Phone, MapPin, FileText, Plus, Loader2, AlertCircle, DollarSign, Timer } from 'lucide-react';
import { useAgendamientos } from '../src/app/components/AgendamientosContext';
import { useModelos } from '../src/app/components/ModelosContext';
import { useClientes } from '../src/app/components/ClientesContext';
import { ClienteStatusChecker } from '../src/app/components/ClienteStatusChecker'; // 🆕 Checker de estado del cliente
import { toast } from 'sonner@2.0.3';
import { SelectErrorBoundary } from './SelectErrorBoundary';

interface CrearAgendamientoModalProps {
  isOpen: boolean;
  onClose: () => void;
  userEmail: string;
  modeloEmailPredefinido?: string; // Opcional: para preseleccionar modelo
}

export function CrearAgendamientoModal({ 
  isOpen, 
  onClose, 
  userEmail,
  modeloEmailPredefinido 
}: CrearAgendamientoModalProps) {
  const agendamientosCtx = useAgendamientos();
  const modelosCtx = useModelos();
  const clientesCtx = useClientes();

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState({
    modeloEmail: modeloEmailPredefinido || '',
    clienteNombre: '',
    clienteTelefono: '',
    fecha: '',
    hora: '',
    tarifaSeleccionada: '', // ✅ NUEVO: JSON string con info de la tarifa
    tipoServicio: 'sede',
    notas: ''
  });

  // ✅ NUEVO: Estado para almacenar la tarifa parseada
  const [tarifaActual, setTarifaActual] = useState<{
    name: string;
    duration: string;
    price: string;
    priceHome?: string;
    description: string;
  } | null>(null);

  // ✅ NUEVO: Obtener servicios disponibles de la modelo seleccionada
  const modeloSeleccionada = modelosCtx?.modelos.find(m => m.email === formData.modeloEmail);
  const serviciosDisponibles = modeloSeleccionada?.serviciosDisponibles || [];

  // Resetear form cuando abre el modal
  useEffect(() => {
    if (isOpen) {
      setFormData({
        modeloEmail: modeloEmailPredefinido || '',
        clienteNombre: '',
        clienteTelefono: '',
        fecha: '',
        hora: '',
        tarifaSeleccionada: '', // ✅ NUEVO: Resetear tarifa seleccionada
        tipoServicio: 'sede',
        notas: ''
      });
      setTarifaActual(null); // ✅ Resetear tarifa parseada
      setErrors({});
    }
  }, [isOpen, modeloEmailPredefinido]);

  // ✅ NUEVO: Resetear tarifa cuando cambia la modelo
  useEffect(() => {
    if (formData.modeloEmail) {
      setFormData(prev => ({ ...prev, tarifaSeleccionada: '' }));
      setTarifaActual(null);
    }
  }, [formData.modeloEmail]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validación
    const newErrors: Record<string, string> = {}
    
    if (!formData.modeloEmail) {
      newErrors.modeloEmail = 'Debes seleccionar una modelo';
    }
    if (!formData.clienteNombre.trim()) {
      newErrors.clienteNombre = 'El nombre del cliente es obligatorio';
    }
    if (!formData.clienteTelefono.trim()) {
      newErrors.clienteTelefono = 'El teléfono del cliente es obligatorio';
    }
    if (!formData.fecha) {
      newErrors.fecha = 'La fecha es obligatoria';
    }
    if (!formData.hora) {
      newErrors.hora = 'La hora es obligatoria';
    }
    if (!formData.tarifaSeleccionada) {
      newErrors.tarifaSeleccionada = 'Debes seleccionar una tarifa';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      toast.error('Por favor completa todos los campos obligatorios');
      return;
    }

    setLoading(true);

    try {
      console.log('📝 Iniciando creación de agendamiento...');
      console.log('📋 Datos del form:', formData);

      // 1. Obtener o crear cliente
      console.log('1️⃣ Obteniendo/creando cliente...');
      const cliente = await clientesCtx!.obtenerOCrearCliente(
        formData.clienteTelefono.trim(),
        formData.clienteNombre.trim()
      );

      if (!cliente) {
        console.error('❌ No se pudo crear/obtener cliente');
        toast.error('❌ Error al crear/obtener cliente');
        return;
      }

      console.log('✅ Cliente obtenido:', cliente);

      // 2. Obtener datos de la modelo seleccionada
      console.log('2️⃣ Buscando modelo...');
      const modelo = modelosCtx!.modelos.find(m => m.email === formData.modeloEmail);
      
      if (!modelo) {
        console.error('❌ Modelo no encontrada');
        toast.error('❌ Modelo no encontrada');
        return;
      }

      console.log('✅ Modelo encontrada:', modelo);

      // 3. Crear agendamiento
      console.log('3️⃣ Creando agendamiento...');
      
      // ✅ Calcular el precio según el tipo de servicio
      const precioServicio = formData.tipoServicio === 'domicilio' 
        ? (tarifaActual!.priceHome || tarifaActual!.price)
        : tarifaActual!.price;

      const nuevoAgendamiento = {
        modeloEmail: formData.modeloEmail,
        modeloNombre: modelo.nombre || modelo.nombreArtistico || 'Sin nombre',
        clienteId: cliente.id,
        clienteNombre: cliente.nombre,
        clienteTelefono: cliente.telefono,
        fecha: formData.fecha,
        hora: formData.hora,
        duracionMinutos: parseInt(tarifaActual!.duration),
        tipoServicio: formData.tipoServicio,
        estado: 'pendiente' as const,
        notas: formData.notas,
        // ✅ NUEVO: Información de pago
        montoPago: parseFloat(precioServicio.replace(/[^0-9.]/g, '')),
        estadoPago: 'pendiente' as const,
        // ✅ NUEVO: Información de la tarifa para sincronización
        tarifaNombre: tarifaActual!.name,
        tarifaDescripcion: tarifaActual!.description,
      };

      console.log('📦 Datos a enviar:', nuevoAgendamiento);

      const resultado = await agendamientosCtx!.agregarAgendamiento(nuevoAgendamiento);

      if (!resultado.success) {
        console.error('❌ Error al guardar:', resultado.error);
        toast.error('❌ Error al crear agendamiento', {
          description: resultado.error?.message || 'No se pudo guardar en la base de datos'
        });
        return;
      }

      console.log('✅ ¡Agendamiento creado exitosamente!');
      toast.success('✅ Agendamiento creado exitosamente', {
        description: `${formData.clienteNombre} agendado con ${modelo.nombreArtistico || modelo.nombre}`
      });

      onClose();
      
    } catch (error: any) {
      console.error('❌ Error creando agendamiento:', error);
      console.error('📋 Stack trace:', error?.stack);
      console.error('📋 Error completo:', JSON.stringify(error, null, 2));
      
      toast.error('❌ Error al crear agendamiento', {
        description: error?.message || 'Hubo un problema al guardar. Por favor intenta de nuevo.'
      });
    } finally {
      setLoading(false);
    }
  };

  if (!modelosCtx || !clientesCtx || !agendamientosCtx) {
    return null;
  }

  const modelosActivas = modelosCtx.modelos.filter(m => m.activa);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-[#0f1014] border-[#c9a961]/30">
        <DialogHeader>
          <DialogTitle className="text-2xl" style={{ color: '#c9a961', fontFamily: 'Playfair Display, serif' }}>
            <div className="flex items-center gap-2">
              <Plus className="w-6 h-6" />
              Nuevo Agendamiento
            </div>
          </DialogTitle>
          <DialogDescription style={{ color: '#a8a6a3' }}>
            Crea un nuevo agendamiento para una modelo
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 py-4">
          {/* Seleccionar Modelo */}
          <div className="space-y-2">
            <Label htmlFor="modelo" className="text-[#e8e6e3]">
              Modelo <span className="text-red-500">*</span>
            </Label>
            <SelectErrorBoundary>
              <Select 
                value={formData.modeloEmail} 
                onValueChange={(value) => {
                  setFormData(prev => ({ ...prev, modeloEmail: value }));
                  setErrors(prev => ({ ...prev, modeloEmail: '' }));
                }}
              >
                <SelectTrigger 
                  className={`bg-[#1a1d24] border-[#c9a961]/30 text-[#e8e6e3] ${errors.modeloEmail ? 'border-red-500' : ''}`}
                >
                  <SelectValue placeholder="Selecciona una modelo" />
                </SelectTrigger>
                <SelectContent className="bg-[#1a1d24] border-[#c9a961]/30">
                  {modelosActivas.map((modelo) => (
                    <SelectItem 
                      key={modelo.email} 
                      value={modelo.email}
                      className="text-[#e8e6e3] hover:bg-[#c9a961]/20 focus:bg-[#c9a961]/20"
                    >
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4" style={{ color: '#c9a961' }} />
                        <span>{modelo.nombreArtistico || modelo.nombre}</span>
                        {modelo.disponible && (
                          <span className="ml-2 px-2 py-0.5 rounded text-xs" style={{ backgroundColor: '#2d5f2e', color: '#90ee90' }}>
                            Disponible
                          </span>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </SelectErrorBoundary>
            {errors.modeloEmail && (
              <p className="text-xs text-red-500 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {errors.modeloEmail}
              </p>
            )}
          </div>

          {/* Información del Cliente */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="clienteNombre" className="text-[#e8e6e3]">
                Nombre del Cliente <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#c9a961' }} />
                <Input
                  id="clienteNombre"
                  value={formData.clienteNombre}
                  onChange={(e) => {
                    setFormData(prev => ({ ...prev, clienteNombre: e.target.value }));
                    setErrors(prev => ({ ...prev, clienteNombre: '' }));
                  }}
                  placeholder="Nombre completo"
                  className={`pl-10 bg-[#1a1d24] border-[#c9a961]/30 text-[#e8e6e3] placeholder:text-[#a8a6a3]/50 ${errors.clienteNombre ? 'border-red-500' : ''}`}
                />
              </div>
              {errors.clienteNombre && (
                <p className="text-xs text-red-500 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {errors.clienteNombre}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="clienteTelefono" className="text-[#e8e6e3]">
                Teléfono del Cliente <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#c9a961' }} />
                <Input
                  id="clienteTelefono"
                  value={formData.clienteTelefono}
                  onChange={(e) => {
                    setFormData(prev => ({ ...prev, clienteTelefono: e.target.value }));
                    setErrors(prev => ({ ...prev, clienteTelefono: '' }));
                  }}
                  placeholder="+57 300 123 4567"
                  className={`pl-10 bg-[#1a1d24] border-[#c9a961]/30 text-[#e8e6e3] placeholder:text-[#a8a6a3]/50 ${errors.clienteTelefono ? 'border-red-500' : ''}`}
                />
              </div>
              {errors.clienteTelefono && (
                <p className="text-xs text-red-500 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {errors.clienteTelefono}
                </p>
              )}
            </div>
          </div>

          {/* Fecha y Hora */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="fecha" className="text-[#e8e6e3]">
                Fecha <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#c9a961' }} />
                <Input
                  id="fecha"
                  type="date"
                  value={formData.fecha}
                  onChange={(e) => {
                    setFormData(prev => ({ ...prev, fecha: e.target.value }));
                    setErrors(prev => ({ ...prev, fecha: '' }));
                  }}
                  className={`pl-10 bg-[#1a1d24] border-[#c9a961]/30 text-[#e8e6e3] ${errors.fecha ? 'border-red-500' : ''}`}
                />
              </div>
              {errors.fecha && (
                <p className="text-xs text-red-500 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {errors.fecha}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="hora" className="text-[#e8e6e3]">
                Hora <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#c9a961' }} />
                <Input
                  id="hora"
                  type="time"
                  value={formData.hora}
                  onChange={(e) => {
                    setFormData(prev => ({ ...prev, hora: e.target.value }));
                    setErrors(prev => ({ ...prev, hora: '' }));
                  }}
                  className={`pl-10 bg-[#1a1d24] border-[#c9a961]/30 text-[#e8e6e3] ${errors.hora ? 'border-red-500' : ''}`}
                />
              </div>
              {errors.hora && (
                <p className="text-xs text-red-500 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {errors.hora}
                </p>
              )}
            </div>
          </div>

          {/* Tarifa y Tipo de Servicio */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="tipoServicio" className="text-[#e8e6e3]">
                Tipo de Servicio
              </Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 z-10" style={{ color: '#c9a961' }} />
                <SelectErrorBoundary>
                  <Select 
                    value={formData.tipoServicio} 
                    onValueChange={(value) => {
                      try {
                        setFormData(prev => ({ ...prev, tipoServicio: value }));
                      } catch (error) {
                        console.error('Error en onValueChange tipoServicio:', error);
                      }
                    }}
                  >
                    <SelectTrigger className="pl-10 bg-[#1a1d24] border-[#c9a961]/30 text-[#e8e6e3]">
                      <SelectValue placeholder="Selecciona tipo" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1a1d24] border-[#c9a961]/30">
                      <SelectItem value="sede" className="text-[#e8e6e3]">En Sede</SelectItem>
                      <SelectItem value="domicilio" className="text-[#e8e6e3]">A Domicilio</SelectItem>
                    </SelectContent>
                  </Select>
                </SelectErrorBoundary>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="tarifa" className="text-[#e8e6e3]">
                Tarifa <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 z-10" style={{ color: '#c9a961' }} />
                <SelectErrorBoundary>
                  <Select 
                    value={formData.tarifaSeleccionada} 
                    onValueChange={(value) => {
                      try {
                        setFormData(prev => ({ ...prev, tarifaSeleccionada: value }));
                        setTarifaActual(JSON.parse(value));
                        setErrors(prev => ({ ...prev, tarifaSeleccionada: '' }));
                      } catch (error) {
                        console.error('Error en onValueChange tarifaSeleccionada:', error);
                      }
                    }}
                  >
                    <SelectTrigger className={`pl-10 bg-[#1a1d24] border-[#c9a961]/30 text-[#e8e6e3] ${errors.tarifaSeleccionada ? 'border-red-500' : ''}`}>
                      <SelectValue placeholder="Selecciona tarifa" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1a1d24] border-[#c9a961]/30">
                      {serviciosDisponibles.map((servicio, index) => (
                        <SelectItem 
                          key={`${servicio.name}-${index}`} 
                          value={JSON.stringify(servicio)}
                          className="text-[#e8e6e3] hover:bg-[#c9a961]/20 focus:bg-[#c9a961]/20"
                        >
                          <div className="flex items-center gap-2">
                            <Timer className="w-4 h-4" style={{ color: '#c9a961' }} />
                            <span>{servicio.name}</span>
                            <span className="ml-2 px-2 py-0.5 rounded text-xs" style={{ backgroundColor: '#c9a961', color: '#0f1014' }}>
                              {servicio.duration} min
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </SelectErrorBoundary>
                {errors.tarifaSeleccionada && (
                  <p className="text-xs text-red-500 flex items-center gap-1 mt-1">
                    <AlertCircle className="w-3 h-3" />
                    {errors.tarifaSeleccionada}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* ✅ NUEVA SECCIÓN: Preview de la tarifa seleccionada */}
          {tarifaActual && (
            <div className="p-4 rounded-lg border-2 border-[#c9a961]/30 bg-gradient-to-br from-[#1a1d24] to-[#0f1014]">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-[#c9a961]/10">
                  <DollarSign className="w-5 h-5" style={{ color: '#c9a961' }} />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-[#c9a961] mb-1">
                    {tarifaActual.name}
                  </h4>
                  <p className="text-sm text-[#a8a6a3] mb-2">
                    {tarifaActual.description}
                  </p>
                  <div className="flex items-center gap-4 flex-wrap">
                    <div className="flex items-center gap-2">
                      <Timer className="w-4 h-4" style={{ color: '#c9a961' }} />
                      <span className="text-sm text-[#e8e6e3]">
                        Duración: <strong>{tarifaActual.duration} minutos</strong>
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-4 h-4" style={{ color: '#c9a961' }} />
                      <span className="text-sm text-[#e8e6e3]">
                        {formData.tipoServicio === 'sede' ? 'En Sede' : 'A Domicilio'}: 
                        <strong className="ml-1" style={{ color: '#c9a961' }}>
                          {formData.tipoServicio === 'domicilio' 
                            ? (tarifaActual.priceHome || tarifaActual.price)
                            : tarifaActual.price}
                        </strong>
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Notas */}
          <div className="space-y-2">
            <Label htmlFor="notas" className="text-[#e8e6e3]">
              Notas / Observaciones
            </Label>
            <div className="relative">
              <FileText className="absolute left-3 top-3 w-4 h-4" style={{ color: '#c9a961' }} />
              <Textarea
                id="notas"
                value={formData.notas}
                onChange={(e) => setFormData(prev => ({ ...prev, notas: e.target.value }))}
                placeholder="Información adicional sobre el agendamiento..."
                rows={3}
                className="pl-10 bg-[#1a1d24] border-[#c9a961]/30 text-[#e8e6e3] placeholder:text-[#a8a6a3]/50"
              />
            </div>
          </div>
        </form>

        <DialogFooter className="gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={loading}
            className="border-[#c9a961]/30 text-[#e8e6e3] hover:bg-[#c9a961]/10"
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            onClick={handleSubmit}
            disabled={loading}
            className="bg-[#c9a961] text-[#0f1014] hover:bg-[#b8974e]"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Creando...
              </>
            ) : (
              <>
                <Plus className="w-4 h-4 mr-2" />
                Crear Agendamiento
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}