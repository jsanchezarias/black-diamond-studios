import { useState, useEffect } from 'react';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { ScrollArea } from './ui/scroll-area';
import { toast } from 'sonner@2.0.3';
import { 
  Calendar as CalendarIcon, 
  Clock, 
  User, 
  Phone, 
  Mail, 
  DollarSign, 
  Home, 
  Briefcase, 
  ShoppingBag, 
  Plus, 
  Minus, 
  X,
  Search,
  Upload,
  Image as ImageIcon,
  PlayCircle,
  Trash2
} from 'lucide-react';
import { useServicios } from '../src/app/components/ServiciosContext';
import { useTurnos } from '../src/app/components/TurnosContext';
import { useAgendamientos } from '../src/app/components/AgendamientosContext';
import { useClientes, Cliente } from '../src/app/components/ClientesContext';
import { useInventory } from '../src/app/components/InventoryContext';
import { ClienteHistorialCard } from './ClienteHistorialCard';

interface IniciarServicioModalProps {
  isOpen: boolean;
  onClose: () => void;
  modeloEmail: string;
  modeloNombre: string;
}

interface ProductoSeleccionado {
  id: number;
  nombre: string;
  precio: number;
  cantidad: number;
  imagen: string;
  categoria: string;
}

export function IniciarServicioModal({ isOpen, onClose, modeloEmail, modeloNombre }: IniciarServicioModalProps) {
  const { iniciarServicio } = useServicios();
  const { cambiarEstado } = useTurnos();
  const { obtenerAgendamientosPendientes } = useAgendamientos();
  const { buscarPorTelefono, agregarCliente, registrarServicio } = useClientes();
  const { inventario } = useInventory();
  
  // Tipo de registro: agendamiento programado o walk-in
  const [tipoRegistro, setTipoRegistro] = useState<'agendamiento' | 'walkin'>('agendamiento');
  const [agendamientoSeleccionado, setAgendamientoSeleccionado] = useState<number | null>(null);
  
  // Estado para cliente encontrado
  const [clienteEncontrado, setClienteEncontrado] = useState<Cliente | null>(null);
  const [buscandoCliente, setBuscandoCliente] = useState(false);
  
  // Productos seleccionados para el consumo
  const [productosSeleccionados, setProductosSeleccionados] = useState<ProductoSeleccionado[]>([]);
  
  const [formData, setFormData] = useState({
    clienteNombre: '',
    clienteTelefono: '',
    clienteEmail: '',
    tipoServicio: 'Sede' as 'Sede' | 'Domicilio',
    habitacion: '101',
    tiempoServicio: '1 hora' as '30 minutos' | '1 hora' | 'rato' | 'varias horas' | 'amanecida',
    costoServicio: '',
    metodoPago: 'Efectivo' as 'Efectivo' | 'QR' | 'Nequi' | 'Daviplata' | 'Datafono' | 'Convenio',
    adicionales: '',
    costoAdicionales: '',
  });

  const [comprobantePago, setComprobantePago] = useState<string | null>(null);
  const [nombreArchivo, setNombreArchivo] = useState<string>('');

  // Obtener agendamientos pendientes de esta modelo con validación
  const agendamientosPendientes = obtenerAgendamientosPendientes(modeloEmail) || [];
  const inventarioDisponible = inventario || [];

  // Auto-llenar datos cuando se selecciona un agendamiento
  useEffect(() => {
    if (tipoRegistro === 'agendamiento' && agendamientoSeleccionado !== null) {
      const agendamiento = agendamientosPendientes.find(a => a.id === agendamientoSeleccionado);
      if (agendamiento) {
        setFormData(prev => ({
          ...prev,
          clienteNombre: agendamiento.clienteNombre,
          clienteTelefono: agendamiento.clienteTelefono,
          tiempoServicio: agendamiento.tipoServicio as any,
        }));
      }
    }
  }, [agendamientoSeleccionado, tipoRegistro, agendamientosPendientes]);

  // Limpiar datos del cliente cuando se cambia a walk-in
  useEffect(() => {
    if (tipoRegistro === 'walkin') {
      setAgendamientoSeleccionado(null);
      setClienteEncontrado(null);
      setFormData(prev => ({
        ...prev,
        clienteNombre: '',
        clienteTelefono: '',
        clienteEmail: '',
      }));
    }
  }, [tipoRegistro]);

  // Buscar cliente automáticamente cuando se ingresa teléfono (solo para walk-in)
  useEffect(() => {
    if (tipoRegistro === 'walkin' && formData.clienteTelefono.length >= 10) {
      setBuscandoCliente(true);
      // Simular búsqueda async
      setTimeout(() => {
        const cliente = buscarPorTelefono(formData.clienteTelefono);
        if (cliente) {
          setClienteEncontrado(cliente);
          setFormData(prev => ({
            ...prev,
            clienteNombre: cliente.nombreUsuario || cliente.nombre,
            clienteEmail: cliente.email || '',
          }));
        } else {
          setClienteEncontrado(null);
        }
        setBuscandoCliente(false);
      }, 300);
    } else if (formData.clienteTelefono.length < 10) {
      setClienteEncontrado(null);
    }
  }, [formData.clienteTelefono, tipoRegistro, buscarPorTelefono]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setNombreArchivo(file.name);
      const reader = new FileReader();
      reader.onloadend = () => {
        setComprobantePago(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Agregar producto a la selección
  const agregarProducto = (producto: typeof inventarioDisponible[0]) => {
    const existe = productosSeleccionados.find(p => p.id === producto.id);
    if (existe) {
      setProductosSeleccionados(prev =>
        prev.map(p => p.id === producto.id ? { ...p, cantidad: p.cantidad + 1 } : p)
      );
    } else {
      setProductosSeleccionados(prev => [
        ...prev,
        {
          id: producto.id,
          nombre: producto.nombre,
          precio: producto.precioServicio,
          cantidad: 1,
          imagen: producto.imagen,
          categoria: producto.categoria,
        },
      ]);
    }
  };

  // Quitar producto de la selección
  const quitarProducto = (id: number) => {
    setProductosSeleccionados(prev => prev.filter(p => p.id !== id));
  };

  // Cambiar cantidad de producto
  const cambiarCantidad = (id: number, cantidad: number) => {
    if (cantidad <= 0) {
      quitarProducto(id);
    } else {
      setProductosSeleccionados(prev =>
        prev.map(p => p.id === id ? { ...p, cantidad } : p)
      );
    }
  };

  // Calcular total de consumo
  const totalConsumo = productosSeleccionados.reduce(
    (total, producto) => total + (producto.precio * producto.cantidad),
    0
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const totalServicio = (parseFloat(formData.costoServicio) || 0) +
                         (parseFloat(formData.costoAdicionales) || 0) +
                         totalConsumo;
    
    // Crear o actualizar cliente y registrar servicio
    let clienteId: string | undefined;
    
    if (tipoRegistro === 'walkin') {
      try {
        // Si ya existe, actualizar con el registro del servicio
        if (clienteEncontrado) {
          clienteId = clienteEncontrado.id;
          await registrarServicio(clienteId, totalServicio);
        } else {
          // Crear nuevo cliente
          const nuevoCliente = await agregarCliente({
            telefono: formData.clienteTelefono,
            nombre: formData.clienteNombre,
            nombreUsuario: formData.clienteNombre.toLowerCase().replace(/\s+/g, ''),
            email: formData.clienteEmail || undefined,
          });
          clienteId = nuevoCliente.id;
        }
      } catch (error) {
        console.error('Error al gestionar cliente:', error);
      }
    }

    // Preparar datos de consumo detallado
    const consumosDetallados = productosSeleccionados.map(producto => ({
      descripcion: producto.nombre,
      costo: producto.precio,
      cantidad: producto.cantidad,
      timestamp: new Date(),
    }));

    iniciarServicio({
      modeloEmail,
      modeloNombre,
      clienteId,
      clienteNombre: formData.clienteNombre,
      clienteTelefono: formData.clienteTelefono,
      clienteEmail: formData.clienteEmail || undefined,
      agendamientoId: tipoRegistro === 'agendamiento' ? agendamientoSeleccionado : undefined,
      tipoServicio: formData.tipoServicio,
      habitacion: formData.tipoServicio === 'Sede' ? formData.habitacion : undefined,
      tiempoServicio: formData.tiempoServicio,
      costoServicio: parseFloat(formData.costoServicio) || 0,
      metodoPago: formData.metodoPago,
      comprobantePago: comprobantePago || undefined,
      adicionales: formData.adicionales,
      costoAdicionales: parseFloat(formData.costoAdicionales) || 0,
      consumo: '', // Dejar vacío ya que ahora usamos consumosDetallados
      costoConsumo: 0, // Dejar en 0 ya que está en consumosDetallados
      consumosDetallados, // Agregar los productos seleccionados
      duracionMinutos: 0,
    });

    // Cambiar estado del turno a "En Servicio"
    cambiarEstado(modeloEmail, 'En Servicio');

    // Reset form
    setTipoRegistro('agendamiento');
    setAgendamientoSeleccionado(null);
    setClienteEncontrado(null);
    setProductosSeleccionados([]);
    setFormData({
      clienteNombre: '',
      clienteTelefono: '',
      clienteEmail: '',
      tipoServicio: 'Sede',
      habitacion: '101',
      tiempoServicio: '1 hora',
      costoServicio: '',
      metodoPago: 'Efectivo',
      adicionales: '',
      costoAdicionales: '',
    });
    setComprobantePago(null);
    setNombreArchivo('');

    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-card border border-primary/30 rounded-lg shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-card border-b border-border p-6 flex items-center justify-between z-10">
          <div>
            <h2 className="text-2xl font-bold text-primary">Iniciar Servicio</h2>
            <p className="text-sm text-muted-foreground mt-1">Completa los datos del servicio</p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Tipo de Registro */}
          <div className="space-y-2">
            <Label>Tipo de Registro</Label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setTipoRegistro('agendamiento')}
                className={`p-4 rounded-lg border-2 transition-all flex items-center gap-3 ${
                  tipoRegistro === 'agendamiento'
                    ? 'border-primary bg-[#d4af37] text-[#0a0a0f] shadow-lg shadow-primary/50'
                    : 'border-border bg-[#1a1a24] hover:border-primary/50 text-muted-foreground hover:text-foreground'
                }`}
              >
                <CalendarIcon className="w-5 h-5" />
                <div className="text-left">
                  <div className="font-medium">Agendamiento</div>
                  <div className="text-xs opacity-70">Servicio programado</div>
                </div>
              </button>
              <button
                type="button"
                onClick={() => setTipoRegistro('walkin')}
                className={`p-4 rounded-lg border-2 transition-all flex items-center gap-3 ${
                  tipoRegistro === 'walkin'
                    ? 'border-primary bg-[#d4af37] text-[#0a0a0f] shadow-lg shadow-primary/50'
                    : 'border-border bg-[#1a1a24] hover:border-primary/50 text-muted-foreground hover:text-foreground'
                }`}
              >
                <User className="w-5 h-5" />
                <div className="text-left">
                  <div className="font-medium">Walk-in</div>
                  <div className="text-xs opacity-70">Cliente directo</div>
                </div>
              </button>
            </div>
          </div>

          {/* Selección de Agendamiento (solo si tipo es agendamiento) */}
          {tipoRegistro === 'agendamiento' && (
            <div className="space-y-2">
              <Label>Seleccionar Agendamiento</Label>
              {agendamientosPendientes.length > 0 ? (
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {agendamientosPendientes.map((agendamiento) => (
                    <button
                      key={agendamiento.id}
                      type="button"
                      onClick={() => setAgendamientoSeleccionado(agendamiento.id)}
                      className={`w-full p-3 rounded-lg border-2 transition-all text-left ${
                        agendamientoSeleccionado === agendamiento.id
                          ? 'border-primary bg-primary/10'
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium">{agendamiento.clienteNombre}</p>
                          <p className="text-sm text-muted-foreground">{agendamiento.clienteTelefono}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {agendamiento.tipoServicio} - {new Date(agendamiento.fecha).toLocaleDateString('es')} {agendamiento.hora}
                          </p>
                        </div>
                        {agendamiento.estado === 'confirmado' && (
                          <span className="text-xs bg-primary/20 text-primary px-2 py-1 rounded">
                            Confirmado
                          </span>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="p-4 bg-secondary/50 rounded-lg border border-border text-center">
                  <p className="text-sm text-muted-foreground">
                    No hay agendamientos pendientes para hoy
                  </p>
                  <Button
                    type="button"
                    variant="link"
                    size="sm"
                    onClick={() => setTipoRegistro('walkin')}
                    className="mt-2"
                  >
                    Cambiar a Walk-in
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Datos del Cliente (manual para walk-in, auto-llenado para agendamiento) */}
          {(tipoRegistro === 'walkin' || (tipoRegistro === 'agendamiento' && agendamientoSeleccionado)) && (
            <>
              <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg space-y-3">
                <div className="flex items-center gap-2 mb-2">
                  <User className="w-4 h-4 text-primary" />
                  <Label className="text-primary font-medium">Datos del Cliente</Label>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="md:col-span-2">
                    <Label htmlFor="clienteTelefono" className="text-xs">Teléfono</Label>
                    <div className="relative">
                      <Input
                        id="clienteTelefono"
                        placeholder="+57 310 123 4567"
                        value={formData.clienteTelefono}
                        onChange={(e) => setFormData({ ...formData, clienteTelefono: e.target.value })}
                        required
                        disabled={tipoRegistro === 'agendamiento'}
                        className="mt-1"
                      />
                      {buscandoCliente && tipoRegistro === 'walkin' && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                          <Search className="w-4 h-4 text-primary animate-pulse" />
                        </div>
                      )}
                    </div>
                    {/* Indicador de cliente encontrado */}
                    {clienteEncontrado && tipoRegistro === 'walkin' && (
                      <div className="mt-3 space-y-3">
                        {/* Historial Completo del Cliente */}
                        <ClienteHistorialCard 
                          cliente={clienteEncontrado}
                          mostrarFormularioObservacion={false}
                        />
                      </div>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="clienteNombre" className="text-xs">Nombre</Label>
                    <Input
                      id="clienteNombre"
                      placeholder="Nombre del cliente"
                      value={formData.clienteNombre}
                      onChange={(e) => setFormData({ ...formData, clienteNombre: e.target.value })}
                      required
                      disabled={tipoRegistro === 'agendamiento'}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="clienteEmail" className="text-xs">Email (Opcional)</Label>
                    <Input
                      id="clienteEmail"
                      type="email"
                      placeholder="email@example.com"
                      value={formData.clienteEmail}
                      onChange={(e) => setFormData({ ...formData, clienteEmail: e.target.value })}
                      disabled={tipoRegistro === 'agendamiento'}
                      className="mt-1"
                    />
                  </div>
                </div>
              </div>

              {/* Tipo de Servicio */}
              <div className="space-y-2">
                <Label>Tipo de Servicio</Label>
                <div className="grid grid-cols-2 gap-3">
                  {(['Sede', 'Domicilio'] as const).map((tipo) => (
                    <button
                      key={tipo}
                      type="button"
                      onClick={() => setFormData({ ...formData, tipoServicio: tipo })}
                      className={`p-3 rounded-lg border-2 transition-all font-medium ${
                        formData.tipoServicio === tipo
                          ? 'border-primary bg-[#d4af37] text-[#0a0a0f] shadow-lg shadow-primary/50'
                          : 'border-border bg-[#1a1a24] hover:border-primary/50 text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      {tipo}
                    </button>
                  ))}
                </div>
              </div>

              {/* Habitación (solo si es Sede) */}
              {formData.tipoServicio === 'Sede' && (
                <div className="space-y-2">
                  <Label>Habitación</Label>
                  <div className="grid grid-cols-5 gap-2">
                    {['101', '102', '201', '202', '203'].map((hab) => (
                      <button
                        key={hab}
                        type="button"
                        onClick={() => setFormData({ ...formData, habitacion: hab })}
                        className={`p-3 rounded-lg border-2 font-bold transition-all ${
                          formData.habitacion === hab
                            ? 'border-primary bg-[#d4af37] text-[#0a0a0f] shadow-lg shadow-primary/50'
                            : 'border-border bg-[#1a1a24] hover:border-primary/50 text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        {hab}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Tiempo de Servicio */}
              <div className="space-y-2">
                <Label>Tiempo de Servicio</Label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {(['30 minutos', '1 hora', 'rato', 'varias horas', 'amanecida'] as const).map((tiempo) => (
                    <button
                      key={tiempo}
                      type="button"
                      onClick={() => setFormData({ ...formData, tiempoServicio: tiempo })}
                      className={`p-2.5 rounded-lg border-2 text-sm transition-all font-medium ${
                        formData.tiempoServicio === tiempo
                          ? 'border-primary bg-[#d4af37] text-[#0a0a0f] shadow-lg shadow-primary/50'
                          : 'border-border bg-[#1a1a24] hover:border-primary/50 text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      {tiempo}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Costo del Servicio */}
                <div className="space-y-2">
                  <Label htmlFor="costoServicio">Costo del Servicio</Label>
                  <Input
                    id="costoServicio"
                    type="number"
                    placeholder="150000"
                    value={formData.costoServicio}
                    onChange={(e) => setFormData({ ...formData, costoServicio: e.target.value })}
                    required
                  />
                </div>

                {/* Método de Pago */}
                <div className="space-y-2">
                  <Label htmlFor="metodoPago">Método de Pago</Label>
                  <select
                    id="metodoPago"
                    value={formData.metodoPago}
                    onChange={(e) => setFormData({ ...formData, metodoPago: e.target.value as any })}
                    className="w-full px-3 py-2 bg-input-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="Efectivo">Efectivo</option>
                    <option value="QR">QR</option>
                    <option value="Nequi">Nequi</option>
                    <option value="Daviplata">Daviplata</option>
                    <option value="Datafono">Datafono</option>
                    <option value="Convenio">Convenio</option>
                  </select>
                </div>
              </div>

              {/* Adicionales */}
              <div className="space-y-2">
                <Label htmlFor="adicionales">Adicionales</Label>
                <Input
                  id="adicionales"
                  placeholder="Describe los servicios adicionales"
                  value={formData.adicionales}
                  onChange={(e) => setFormData({ ...formData, adicionales: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="costoAdicionales">Costo de Adicionales</Label>
                <Input
                  id="costoAdicionales"
                  type="number"
                  placeholder="0"
                  value={formData.costoAdicionales}
                  onChange={(e) => setFormData({ ...formData, costoAdicionales: e.target.value })}
                />
              </div>

              {/* MÓDULO DE BOUTIQUE - Reemplaza el campo de Consumo */}
              <div className="p-4 bg-secondary/30 border-2 border-primary/20 rounded-lg space-y-4">
                <div className="flex items-center gap-2">
                  <ShoppingBag className="w-5 h-5 text-primary" />
                  <Label className="text-primary font-medium text-lg">Productos de Boutique</Label>
                </div>
                
                <p className="text-sm text-muted-foreground">
                  Selecciona los productos que el cliente desea consumir durante el servicio
                </p>

                {/* Grid de productos disponibles */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 max-h-80 overflow-y-auto p-2">
                  {inventarioDisponible.filter(item => item.stock > 0).map((producto) => (
                    <button
                      key={producto.id}
                      type="button"
                      onClick={() => agregarProducto(producto)}
                      className="group relative bg-card border border-border hover:border-primary/50 rounded-lg overflow-hidden transition-all hover:shadow-lg hover:scale-105"
                    >
                      <div className="aspect-square overflow-hidden">
                        <img 
                          src={producto.imagen} 
                          alt={producto.nombre}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="p-2 space-y-1">
                        <p className="font-medium text-xs line-clamp-1">{producto.nombre}</p>
                        <Badge variant="outline" className="text-[10px] px-1 py-0">{producto.categoria}</Badge>
                        <p className="text-sm font-bold text-primary">
                          ${((producto.precioServicio || 0) || 0).toLocaleString()}
                        </p>
                        <div className="absolute top-2 right-2 bg-primary/90 text-primary-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Plus className="w-3 h-3" />
                        </div>
                      </div>
                    </button>
                  ))}
                </div>

                {/* Productos seleccionados */}
                {productosSeleccionados.length > 0 && (
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Productos Seleccionados</Label>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {productosSeleccionados.map((producto) => (
                        <div 
                          key={producto.id}
                          className="flex items-center gap-3 p-3 bg-primary/5 border border-primary/20 rounded-lg"
                        >
                          <img 
                            src={producto.imagen} 
                            alt={producto.nombre}
                            className="w-12 h-12 object-cover rounded"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">{producto.nombre}</p>
                            <p className="text-xs text-muted-foreground">${((producto.precio || 0) || 0).toLocaleString()} c/u</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              onClick={() => cambiarCantidad(producto.id, producto.cantidad - 1)}
                              className="h-7 w-7 p-0"
                            >
                              <Minus className="w-3 h-3" />
                            </Button>
                            <span className="font-bold min-w-[2rem] text-center">{producto.cantidad}</span>
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              onClick={() => cambiarCantidad(producto.id, producto.cantidad + 1)}
                              className="h-7 w-7 p-0"
                            >
                              <Plus className="w-3 h-3" />
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              variant="ghost"
                              onClick={() => quitarProducto(producto.id)}
                              className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                          <div className="text-right min-w-[5rem]">
                            <p className="font-bold text-primary">
                              ${(producto.precio * producto.cantidad).toLocaleString()}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    {/* Total de consumo */}
                    <div className="p-3 bg-primary/10 border border-primary/30 rounded-lg">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">Total Consumo:</span>
                        <span className="text-xl font-bold text-primary">
                          ${totalConsumo.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Comprobante de Pago */}
              <div className="space-y-2">
                <Label htmlFor="comprobantePago">Comprobante de Pago (Opcional)</Label>
                <div className="space-y-2">
                  <label
                    htmlFor="comprobantePago"
                    className="flex items-center justify-center gap-2 p-4 border-2 border-dashed border-border rounded-lg hover:border-primary/50 cursor-pointer transition-all"
                  >
                    <Upload className="w-5 h-5 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      {nombreArchivo || 'Subir imagen del comprobante'}
                    </span>
                  </label>
                  <Input
                    id="comprobantePago"
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  
                  {comprobantePago && (
                    <div className="relative p-2 bg-secondary/50 rounded-lg border border-border">
                      <div className="flex items-center gap-2">
                        <ImageIcon className="w-4 h-4 text-primary" />
                        <span className="text-sm flex-1 truncate">{nombreArchivo}</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setComprobantePago(null);
                            setNombreArchivo('');
                          }}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                      <img 
                        src={comprobantePago} 
                        alt="Comprobante" 
                        className="mt-2 w-full h-32 object-cover rounded-lg"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Total */}
              <div className="p-4 bg-primary/10 border-2 border-primary/30 rounded-lg">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Servicio:</span>
                    <span className="font-medium">${(parseFloat(formData.costoServicio) || 0).toLocaleString()}</span>
                  </div>
                  {(parseFloat(formData.costoAdicionales) || 0) > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Adicionales:</span>
                      <span className="font-medium">${(parseFloat(formData.costoAdicionales) || 0).toLocaleString()}</span>
                    </div>
                  )}
                  {totalConsumo > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Consumo:</span>
                      <span className="font-medium">${totalConsumo.toLocaleString()}</span>
                    </div>
                  )}
                  <div className="h-px bg-border my-2" />
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-medium">Total:</span>
                    <span className="text-2xl font-bold text-primary">
                      ${(
                        (parseFloat(formData.costoServicio) || 0) +
                        (parseFloat(formData.costoAdicionales) || 0) +
                        totalConsumo
                      ).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Botones */}
              <div className="flex gap-3 pt-4">
                <Button type="button" variant="outline" onClick={onClose} className="flex-1">
                  Cancelar
                </Button>
                <Button type="submit" className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90">
                  <PlayCircle className="w-4 h-4 mr-2" />
                  Iniciar Servicio
                </Button>
              </div>
            </>
          )}
        </form>
      </div>
    </div>
  );
}