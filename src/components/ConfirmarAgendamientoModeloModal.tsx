import { useState, useEffect } from 'react';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { toast } from 'sonner';
import { 
  Calendar as CalendarIcon, 
  User, 
  ShoppingBag, 
  Plus, 
  Minus, 
  X,
  Upload,
  Image as ImageIcon,
  PlayCircle,
  Trash2,
  Loader2,
  DoorOpen,
  Timer,
  ChevronDown,
  ChevronRight
} from 'lucide-react';
import { supabase } from '../utils/supabase/info';
import { useInventory } from '../app/components/InventoryContext';
import { Agendamiento } from '../app/components/AgendamientosContext';

interface ConfirmarAgendamientoModeloModalProps {
  isOpen: boolean;
  onClose: () => void;
  agendamiento: Agendamiento;
  modeloEmail: string;
  modeloNombre: string;
  onSuccess?: () => void;
}

interface ProductoSeleccionado {
  id: string;
  nombre: string;
  precio: number;
  cantidad: number;
  imagen: string;
  categoria: string;
}

interface Habitacion {
  id: string;
  numero: number;
  nombre: string | null;
  estado: 'disponible' | 'ocupada' | 'limpieza';
}

export function ConfirmarAgendamientoModeloModal({ 
  isOpen, 
  onClose, 
  agendamiento, 
  modeloEmail, 
  modeloNombre,
  onSuccess
}: ConfirmarAgendamientoModeloModalProps) {
  const { inventario, actualizarStock } = useInventory();
  
  const [habitaciones, setHabitaciones] = useState<Habitacion[]>([]);
  const [loadingHabitaciones, setLoadingHabitaciones] = useState(false);
  const [habitacionSeleccionada, setHabitacionSeleccionada] = useState<string>('');
  
  const [productosSeleccionados, setProductosSeleccionados] = useState<ProductoSeleccionado[]>([]);
  const [comprobantePago, setComprobantePago] = useState<string | null>(null);
  const [nombreArchivo, setNombreArchivo] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);
  const [categoriasAbiertas, setCategoriasAbiertas] = useState<Record<string, boolean>>({});

  const toggleCategoria = (cat: string) => {
    setCategoriasAbiertas(prev => ({ ...prev, [cat]: !prev[cat] }));
  };

  // Cargar habitaciones disponibles
  useEffect(() => {
    if (isOpen) {
      cargarHabitaciones();
    }
  }, [isOpen]);

  const cargarHabitaciones = async () => {
    setLoadingHabitaciones(true);
    try {
      const { data, error } = await supabase
        .from('habitaciones')
        .select('*')
        .order('numero', { ascending: true });

      if (error) throw error;
      setHabitaciones(data || []);
    } catch (err: any) {
      console.error('Error al cargar habitaciones:', err);
      toast.error('No se pudieron cargar las habitaciones disponibles');
    } finally {
      setLoadingHabitaciones(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('La imagen es demasiado grande (máx 5MB)');
        return;
      }
      setNombreArchivo(file.name);
      const reader = new FileReader();
      reader.onloadend = () => {
        setComprobantePago(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const agregarProducto = (producto: any) => {
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
          precio: producto.precioServicio || producto.precioRegular,
          cantidad: 1,
          imagen: producto.imagen,
          categoria: producto.categoria,
        },
      ]);
    }
  };

  const cambiarCantidad = (id: string, cantidad: number) => {
    if (cantidad <= 0) {
      setProductosSeleccionados(prev => prev.filter(p => p.id !== id));
    } else {
      setProductosSeleccionados(prev =>
        prev.map(p => p.id === id ? { ...p, cantidad } : p)
      );
    }
  };

  const totalConsumo = productosSeleccionados.reduce(
    (total, producto) => total + (producto.precio * producto.cantidad),
    0
  );

  const handleSubmit = async () => {
    if (!habitacionSeleccionada) {
      toast.error('Debes seleccionar una habitación');
      return;
    }

    if (!comprobantePago) {
      toast.error('Debes adjuntar el comprobante de pago');
      return;
    }

    try {
      setSubmitting(true);
      const now = new Date();
      const horaInicioReal = now.toISOString();
      const duracion = agendamiento.duracionMinutos || 60;
      const horaFinEstimada = new Date(now.getTime() + duracion * 60 * 1000).toISOString();

      // 1. Obtener datos de la habitación seleccionada
      const hab = habitaciones.find(h => h.id === habitacionSeleccionada);
      if (!hab) throw new Error('Habitación no válida');

      // 2. Transacción Atómica (vía varios queries por ahora, idealmente un RPC)
      
      // A. Actualizar Agendamiento
      const { error: errorAg } = await supabase
        .from('agendamientos')
        .update({
          estado: 'en_curso',
          habitacion_id: habitacionSeleccionada,
          comprobante_pago: comprobantePago,
          adicionales_boutique: JSON.stringify(productosSeleccionados),
          total_adicionales: totalConsumo,
          hora_inicio_real: horaInicioReal,
          updated_at: horaInicioReal
        })
        .eq('id', agendamiento.id);

      if (errorAg) throw errorAg;

      // B. Ocupar Habitación
      const { error: errorHab } = await supabase
        .from('habitaciones')
        .update({
          estado: 'ocupada',
          modelo_email: modeloEmail,
          modelo_nombre: modeloNombre,
          hora_inicio: horaInicioReal,
          duracion_minutos: duracion,
          hora_fin_estimada: horaFinEstimada
        })
        .eq('id', habitacionSeleccionada);

      if (errorHab) throw errorHab;

      // C. Registrar Ventas Boutique y actualizar stock
      for (const item of productosSeleccionados) {
        // Insertar venta
        await supabase.from('ventas_boutique').insert({
          producto_id: item.id,
          producto_nombre: item.nombre,
          modelo_id: agendamiento.modeloId,
          cantidad: item.cantidad,
          precio_unitario: item.precio,
          total: item.precio * item.cantidad,
          estado: 'aceptado',
          fecha: horaInicioReal,
          agendamiento_id: agendamiento.id
        });

        // Actualizar stock localmente y en DB
        const prodOriginal = inventario.find(p => p.id === item.id);
        if (prodOriginal) {
          await actualizarStock(item.id, Math.max(0, prodOriginal.stock - item.cantidad));
        }
      }

      // D. Notificar a Admin y Owner
      const resumenBoutique = productosSeleccionados.length > 0 
        ? `\n🛍️ Adicionales: ${productosSeleccionados.map(p => `${p.cantidad}x ${p.nombre}`).join(', ')}`
        : '';

      await supabase.from('notificaciones').insert([
        {
          para_rol: 'administrador',
          tipo: 'servicio_iniciado',
          titulo: '🚀 Servicio en Curso',
          mensaje: `La modelo ${modeloNombre} ha iniciado un servicio con ${agendamiento.clienteNombre} en la habitación ${hab.numero}.\n💰 Precio: $${agendamiento.montoPago.toLocaleString()}${resumenBoutique}`,
          leida: false,
          referencia_id: agendamiento.id
        },
        {
          para_rol: 'owner',
          tipo: 'servicio_iniciado',
          titulo: '🚀 Servicio en Curso',
          mensaje: `La modelo ${modeloNombre} ha iniciado un servicio con ${agendamiento.clienteNombre} en la habitación ${hab.numero}.\n💰 Precio: $${agendamiento.montoPago.toLocaleString()}${resumenBoutique}`,
          leida: false,
          referencia_id: agendamiento.id
        }
      ]);

      toast.success('🚀 ¡Servicio iniciado con éxito!');
      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Error al iniciar servicio:', err);
      toast.error('Error al iniciar servicio: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-[#0f0f15] border border-primary/30 rounded-2xl shadow-2xl max-w-2xl w-full my-auto overflow-hidden animate-in fade-in zoom-in duration-300">
        {/* Header */}
        <div className="relative p-6 border-b border-white/5 bg-gradient-to-r from-primary/10 to-transparent">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                <PlayCircle className="w-7 h-7 text-primary" />
                Confirmar e Iniciar Servicio
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                Cliente: <span className="text-white font-medium">{agendamiento.clienteNombre}</span> · 
                Servicio: <span className="text-primary font-medium">{agendamiento.tarifaNombre}</span>
              </p>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
              <X className="w-6 h-6 text-muted-foreground" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
          {/* 1. SELECCIÓN DE HABITACIÓN */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-primary">
              <DoorOpen className="w-5 h-5" />
              <Label className="text-base font-bold uppercase tracking-wider">Asignar Habitación</Label>
            </div>
            {loadingHabitaciones ? (
              <div className="flex items-center gap-2 text-muted-foreground animate-pulse">
                <Loader2 className="w-4 h-4 animate-spin" />
                Cargando habitaciones...
              </div>
            ) : habitaciones.length > 0 ? (
              <div className="grid grid-cols-4 sm:grid-cols-6 gap-3">
                {habitaciones.map((hab) => {
                  const isDisponible = hab.estado === 'disponible';
                  const isOcupada = hab.estado === 'ocupada';
                  const isLimpieza = hab.estado === 'limpieza';
                  const isSelected = habitacionSeleccionada === hab.id;

                  return (
                    <button
                      key={hab.id}
                      type="button"
                      disabled={!isDisponible}
                      onClick={() => isDisponible && setHabitacionSeleccionada(hab.id)}
                      className={`
                        relative py-3 rounded-xl border-2 transition-all duration-200 flex flex-col items-center justify-center gap-0.5
                        ${isSelected 
                          ? 'border-primary bg-primary/20 text-white shadow-[0_0_15px_rgba(212,175,55,0.3)]' 
                          : isDisponible
                            ? 'border-white/10 bg-white/5 text-muted-foreground hover:border-primary/50 hover:bg-white/10'
                            : isOcupada
                              ? 'border-red-500/30 bg-red-500/10 text-red-400 cursor-not-allowed opacity-80'
                              : 'border-yellow-500/30 bg-yellow-500/10 text-yellow-400 cursor-not-allowed opacity-80'}
                      `}
                    >
                      <span className="text-xl font-black">{hab.numero}</span>
                      <span className="text-[9px] uppercase font-bold tracking-tighter">
                        {isOcupada ? 'Ocupada' : isLimpieza ? 'Limpieza' : 'Libre'}
                      </span>
                      {isSelected && (
                        <div className="absolute -top-2 -right-2 bg-primary text-black rounded-full p-0.5 shadow-lg">
                          <CheckCircle className="w-3 h-3" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="p-4 bg-red-500/5 border border-red-500/20 rounded-xl text-center">
                <p className="text-sm text-red-400">No hay habitaciones registradas.</p>
              </div>
            )}
          </div>

          {/* 2. COMPROBANTE DE PAGO */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-primary">
              <Upload className="w-5 h-5" />
              <Label className="text-base font-bold uppercase tracking-wider">Comprobante de Pago</Label>
            </div>
            <div 
              className={`
                relative border-2 border-dashed rounded-2xl p-8 transition-all cursor-pointer group
                ${comprobantePago ? 'border-primary/50 bg-primary/5' : 'border-white/10 hover:border-primary/40 bg-white/2'}
              `}
              onClick={() => document.getElementById('file-upload-confirm')?.click()}
            >
              <input
                id="file-upload-confirm"
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
              {comprobantePago ? (
                <div className="flex flex-col items-center gap-3">
                  <div className="relative w-full max-w-[200px] aspect-video rounded-lg overflow-hidden border border-primary/30">
                    <img src={comprobantePago} alt="Comprobante" className="w-full h-full object-cover" />
                    <button 
                      onClick={(e) => { e.stopPropagation(); setComprobantePago(null); setNombreArchivo(''); }}
                      className="absolute top-1 right-1 bg-black/60 text-white p-1 rounded-full hover:bg-red-500 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <p className="text-xs text-primary font-medium truncate max-w-[250px]">{nombreArchivo}</p>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2 text-muted-foreground group-hover:text-primary transition-colors">
                  <ImageIcon className="w-10 h-10 opacity-20 group-hover:opacity-100" />
                  <p className="text-sm font-medium">Click para subir foto del pago</p>
                  <p className="text-[10px] opacity-50">Soporta JPG, PNG (máx. 5MB)</p>
                </div>
              )}
            </div>
          </div>

          {/* 3. BOUTIQUE EXPRESS */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-primary">
              <ShoppingBag className="w-5 h-5" />
              <Label className="text-base font-bold uppercase tracking-wider">Adicionales Boutique</Label>
            </div>
            
            <div className="bg-white/2 border border-white/5 rounded-2xl overflow-hidden">
              {Object.entries(
                inventario
                  .filter(i => i.stock > 0)
                  .reduce((acc, item) => {
                    const cat = item.categoria || 'Otros';
                    if (!acc[cat]) acc[cat] = [];
                    acc[cat].push(item);
                    return acc;
                  }, {} as Record<string, typeof inventario>)
              ).map(([categoria, items]) => {
                const isOpen = categoriasAbiertas[categoria];
                return (
                  <div key={categoria} className="border-b border-white/5 last:border-0">
                    <button 
                      onClick={() => toggleCategoria(categoria)}
                      className="w-full bg-white/5 px-4 py-3 flex items-center justify-between hover:bg-white/10 transition-colors"
                    >
                      <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">{categoria}</span>
                      {isOpen ? <ChevronDown className="w-4 h-4 text-primary" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
                    </button>
                    
                    {isOpen && (
                      <div className="divide-y divide-white/5 bg-black/20 animate-in slide-in-from-top-2 duration-200">
                        {items.map((item) => {
                          const isAdded = productosSeleccionados.some(p => p.id === item.id);
                          return (
                            <div 
                              key={item.id} 
                              className="flex items-center gap-3 p-3 hover:bg-white/5 transition-colors group"
                            >
                              <div className="w-12 h-12 rounded-lg overflow-hidden bg-black/40 border border-white/10 flex-shrink-0">
                                <img 
                                  src={item.imagen} 
                                  alt={item.nombre} 
                                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" 
                                />
                              </div>
                              <div className="flex-1 min-w-0">
                                <h4 className="text-sm font-bold text-white truncate">{item.nombre}</h4>
                                <p className="text-xs text-primary font-black">
                                  ${(item.precioServicio || item.precioRegular).toLocaleString()}
                                </p>
                              </div>
                              <button
                                onClick={() => agregarProducto(item)}
                                className={`
                                  w-8 h-8 rounded-full flex items-center justify-center transition-all
                                  ${isAdded 
                                    ? 'bg-primary text-black scale-110 shadow-[0_0_10px_rgba(212,175,55,0.4)]' 
                                    : 'bg-white/10 text-white hover:bg-primary hover:text-black'}
                                `}
                              >
                                {isAdded ? <CheckCircle className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {productosSeleccionados.length > 0 && (
              <div className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-3">
                <Label className="text-xs text-muted-foreground uppercase font-black">Carrito Express</Label>
                <div className="space-y-2">
                  {productosSeleccionados.map((p) => (
                    <div key={p.id} className="flex items-center justify-between gap-3 text-sm">
                      <span className="flex-1 truncate text-white/80">{p.nombre}</span>
                      <div className="flex items-center gap-2">
                        <button onClick={() => cambiarCantidad(p.id, p.cantidad - 1)} className="w-6 h-6 rounded bg-white/10 flex items-center justify-center hover:bg-white/20">-</button>
                        <span className="w-4 text-center font-bold">{p.cantidad}</span>
                        <button onClick={() => cambiarCantidad(p.id, p.cantidad + 1)} className="w-6 h-6 rounded bg-white/10 flex items-center justify-center hover:bg-white/20">+</button>
                      </div>
                      <span className="font-bold text-primary w-20 text-right">${(p.precio * p.cantidad).toLocaleString()}</span>
                    </div>
                  ))}
                </div>
                <div className="pt-3 border-t border-white/5 flex justify-between items-center">
                  <span className="text-sm font-bold text-white">Subtotal Boutique</span>
                  <span className="text-lg font-black text-primary">${totalConsumo.toLocaleString()}</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 bg-black/40 border-t border-white/5">
          <div className="flex flex-col gap-4">
            <div className="flex justify-between items-end">
              <div>
                <p className="text-xs text-muted-foreground uppercase font-black tracking-widest">Inversión Total</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-black text-primary tracking-tighter">
                    ${(agendamiento.montoPago + totalConsumo).toLocaleString()}
                  </span>
                  <span className="text-xs text-muted-foreground line-through opacity-50">
                    COP
                  </span>
                </div>
              </div>
              <div className="text-right">
                <Badge className="bg-primary/20 text-primary border-primary/30 py-1">
                  {agendamiento.duracionMinutos || 60} MINUTOS
                </Badge>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Button 
                variant="outline" 
                className="h-12 border-white/10 hover:bg-white/5 text-white"
                onClick={onClose}
                disabled={submitting}
              >
                Cancelar
              </Button>
              <Button 
                className="h-12 bg-primary text-black hover:bg-primary/90 font-black text-lg shadow-[0_0_20px_rgba(212,175,55,0.4)] disabled:opacity-50"
                onClick={handleSubmit}
                disabled={submitting || !habitacionSeleccionada || !comprobantePago}
              >
                {submitting ? (
                  <><Loader2 className="w-5 h-5 animate-spin mr-2" /> PROCESANDO...</>
                ) : (
                  <><PlayCircle className="w-5 h-5 mr-2" /> COMENZAR SERVICIO</>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function CheckCircle({ className }: { className?: string }) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width="24" 
      height="24" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="3" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      <path d="M20 6 9 17l-5-5"/>
    </svg>
  );
}
