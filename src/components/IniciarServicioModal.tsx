import React, { useState, useEffect, useMemo } from 'react';
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
  Search,
  Upload,
  Image as ImageIcon,
  PlayCircle,
  Trash2,
  ChevronDown,
  ChevronUp,
  CheckCircle,
  Building2,
  Car,
  DollarSign,
  Sparkles,
  Clock,
  Check,
  Zap,
  Phone,
  AlertCircle
} from 'lucide-react';
import { useServicios } from '../app/components/ServiciosContext';
import { useTurnos } from '../app/components/TurnosContext';
import { useAgendamientos } from '../app/components/AgendamientosContext';
import { useClientes, Cliente } from '../app/components/ClientesContext';
import { useInventory } from '../app/components/InventoryContext';
import { ClienteHistorialCard } from './ClienteHistorialCard';
import { supabase } from '../utils/supabase/info';
import { uploadComprobante } from '../utils/supabase/uploadComprobante';

interface IniciarServicioModalProps {
  isOpen: boolean;
  onClose: () => void;
  modeloEmail: string;
  modeloNombre: string;
}

interface ProductoSeleccionado {
  id: string;
  nombre: string;
  precio: number;
  cantidad: number;
  imagen: string;
  categoria: string;
}

interface HabRow {
  id: string;
  numero: number;
  nombre: string | null;
  estado: 'disponible' | 'ocupada' | 'limpieza';
  modelo_email: string | null;
  modelo_nombre: string | null;
  hora_inicio: string | null;
  duracion_minutos: number | null;
  hora_fin_estimada: string | null;
}

// Tarifas base predeterminadas con duración y minutos
const TARIFAS_PRESET = [
  { id: 'rato', nombre: 'Rato', duracionTexto: '15 min', minutos: 15, precio: 130000 },
  { id: '30m', nombre: '30 Min', duracionTexto: '30 min', minutos: 30, precio: 160000 },
  { id: '1h', nombre: '1 Hora', duracionTexto: '1 hora', minutos: 60, precio: 190000 },
  { id: '2h', nombre: '2 Horas', duracionTexto: '2 horas', minutos: 120, precio: 360000 },
  { id: '3h', nombre: '3 Horas', duracionTexto: '3 horas', minutos: 180, precio: 520000 },
  { id: '6h', nombre: '6 Horas', duracionTexto: '6 horas', minutos: 360, precio: 1000000 },
  { id: 'amanecida', nombre: 'Amanecida', duracionTexto: '8 horas', minutos: 480, precio: 1200000 },
];

export function IniciarServicioModal({ isOpen, onClose, modeloEmail, modeloNombre }: IniciarServicioModalProps) {
  const { iniciarServicio } = useServicios();
  const { cambiarEstado } = useTurnos();
  const { obtenerAgendamientosPendientes } = useAgendamientos();
  const { buscarPorTelefono, agregarCliente, registrarServicio } = useClientes();
  const { inventario } = useInventory();

  // Tipo de registro
  const [tipoRegistro, setTipoRegistro] = useState<'agendamiento' | 'walkin'>('agendamiento');
  const [agendamientoSeleccionado, setAgendamientoSeleccionado] = useState<string | null>(null);

  // Cliente
  const [esAnonimo, setEsAnonimo] = useState(false);
  const [clienteNombre, setClienteNombre] = useState('');
  const [clienteTelefono, setClienteTelefono] = useState('');
  const [clienteEmail, setClienteEmail] = useState('');
  const [clienteEncontrado, setClienteEncontrado] = useState<Cliente | null>(null);
  const [buscandoCliente, setBuscandoCliente] = useState(false);
  const [mostrarHistorialCliente, setMostrarHistorialCliente] = useState(false);

  // Servicio & Duración
  const [tarifaSeleccionada, setTarifaSeleccionada] = useState<typeof TARIFAS_PRESET[0]>(TARIFAS_PRESET[2]); // Default 1 Hora
  const [costoServicioManual, setCostoServicioManual] = useState<string>('190000');
  const [tipoServicio, setTipoServicio] = useState<'Sede' | 'Domicilio'>('Sede');
  const [habitacionSeleccionada, setHabitacionSeleccionada] = useState<string>('101');
  const [habitaciones, setHabitaciones] = useState<HabRow[]>([]);
  const [cargandoHabitaciones, setCargandoHabitaciones] = useState(false);

  // Pago
  const [metodoPago, setMetodoPago] = useState<'Efectivo' | 'QR' | 'Nequi' | 'Daviplata' | 'Datafono' | 'Convenio'>('Efectivo');
  const [comprobantePago, setComprobantePago] = useState<string | null>(null);
  const [nombreArchivo, setNombreArchivo] = useState<string>('');

  // Adicionales
  const [costoAdicionales, setCostoAdicionales] = useState('');

  // Boutique / Consumos
  const [mostrarBoutique, setMostrarBoutique] = useState(false);
  const [categoriaBoutique, setCategoriaBoutique] = useState<string>('todos');
  const [busquedaBoutique, setBusquedaBoutique] = useState<string>('');
  const [productosSeleccionados, setProductosSeleccionados] = useState<ProductoSeleccionado[]>([]);

  // Estado general
  const [submitting, setSubmitting] = useState(false);

  // Obtener agendamientos pendientes de esta modelo
  const agendamientosPendientes = useMemo(() => {
    return obtenerAgendamientosPendientes(modeloEmail) || [];
  }, [obtenerAgendamientosPendientes, modeloEmail]);

  // Si no hay agendamientos pendientes, cambiar a walkin por defecto al abrir
  useEffect(() => {
    if (isOpen) {
      if (agendamientosPendientes.length === 0) {
        setTipoRegistro('walkin');
      } else {
        setTipoRegistro('agendamiento');
      }
    }
  }, [isOpen, agendamientosPendientes.length]);

  // Cargar habitaciones en tiempo real desde Supabase
  useEffect(() => {
    if (!isOpen) return;

    const cargarHabitaciones = async () => {
      setCargandoHabitaciones(true);
      try {
        const { data, error } = await supabase
          .from('habitaciones')
          .select('*')
          .order('numero', { ascending: true });

        if (error) throw error;
        if (data && data.length > 0) {
          setHabitaciones(data as HabRow[]);
          // Pre-seleccionar la primera disponible si la actual no es válida
          const disponible = data.find((h: HabRow) => h.estado === 'disponible');
          if (disponible) {
            setHabitacionSeleccionada(String(disponible.numero));
          }
        } else {
          // Fallback a números estándar si la tabla está vacía
          setHabitaciones([
            { id: '1', numero: 101, nombre: 'Suite 101', estado: 'disponible', modelo_email: null, modelo_nombre: null, hora_inicio: null, duracion_minutos: null, hora_fin_estimada: null },
            { id: '2', numero: 102, nombre: 'Suite 102', estado: 'disponible', modelo_email: null, modelo_nombre: null, hora_inicio: null, duracion_minutos: null, hora_fin_estimada: null },
            { id: '3', numero: 201, nombre: 'Suite 201', estado: 'disponible', modelo_email: null, modelo_nombre: null, hora_inicio: null, duracion_minutos: null, hora_fin_estimada: null },
            { id: '4', numero: 202, nombre: 'Suite 202', estado: 'disponible', modelo_email: null, modelo_nombre: null, hora_inicio: null, duracion_minutos: null, hora_fin_estimada: null },
            { id: '5', numero: 203, nombre: 'Suite 203', estado: 'disponible', modelo_email: null, modelo_nombre: null, hora_inicio: null, duracion_minutos: null, hora_fin_estimada: null },
          ]);
        }
      } catch (err) {
        // Fallback gracioso
        setHabitaciones([
          { id: '1', numero: 101, nombre: 'Suite 101', estado: 'disponible', modelo_email: null, modelo_nombre: null, hora_inicio: null, duracion_minutos: null, hora_fin_estimada: null },
          { id: '2', numero: 102, nombre: 'Suite 102', estado: 'disponible', modelo_email: null, modelo_nombre: null, hora_inicio: null, duracion_minutos: null, hora_fin_estimada: null },
          { id: '3', numero: 201, nombre: 'Suite 201', estado: 'disponible', modelo_email: null, modelo_nombre: null, hora_inicio: null, duracion_minutos: null, hora_fin_estimada: null },
        ]);
      } finally {
        setCargandoHabitaciones(false);
      }
    };

    cargarHabitaciones();

    // Suscripción a cambios en tiempo real
    const channel = supabase
      .channel('iniciar-servicio-habs')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'habitaciones' }, () => {
        cargarHabitaciones();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isOpen]);

  // Manejar selección de agendamiento
  useEffect(() => {
    if (tipoRegistro === 'agendamiento' && agendamientoSeleccionado) {
      const ag = agendamientosPendientes.find(a => a.id === agendamientoSeleccionado);
      if (ag) {
        setClienteNombre(ag.clienteNombre);
        setClienteTelefono(ag.clienteTelefono || '');
        setClienteEmail(ag.clienteEmail || '');
        setEsAnonimo(false);

        // Buscar coincidencia de tarifa por duración o nombre
        const duracionMin = ag.duracionMinutos || 60;
        const presetMatch = TARIFAS_PRESET.find(p => p.minutos === duracionMin) || TARIFAS_PRESET[2];
        setTarifaSeleccionada(presetMatch);
        setCostoServicioManual(String(ag.montoPago || ag.precio || presetMatch.precio));

        if (ag.habitacion) {
          setHabitacionSeleccionada(String(ag.habitacion));
        }
        if (ag.tipoServicio) {
          setTipoServicio(ag.tipoServicio.toLowerCase().includes('domicilio') ? 'Domicilio' : 'Sede');
        }
      }
    }
  }, [agendamientoSeleccionado, tipoRegistro, agendamientosPendientes]);

  // Buscar cliente por teléfono (walk-in)
  useEffect(() => {
    if (tipoRegistro === 'walkin' && !esAnonimo && clienteTelefono.trim().length >= 10) {
      setBuscandoCliente(true);
      const timer = setTimeout(() => {
        const found = buscarPorTelefono(clienteTelefono.trim());
        if (found) {
          setClienteEncontrado(found);
          if (!clienteNombre || clienteNombre === 'Cliente Directo') {
            setClienteNombre(found.nombreUsuario || found.nombre || '');
          }
          if (found.email) setClienteEmail(found.email);
        } else {
          setClienteEncontrado(null);
        }
        setBuscandoCliente(false);
      }, 250);
      return () => clearTimeout(timer);
    } else {
      setClienteEncontrado(null);
      setBuscandoCliente(false);
    }
  }, [clienteTelefono, tipoRegistro, esAnonimo, buscarPorTelefono]);

  // Selección rápida de tarifa
  const seleccionarTarifa = (tarifa: typeof TARIFAS_PRESET[0]) => {
    setTarifaSeleccionada(tarifa);
    setCostoServicioManual(String(tarifa.precio));
  };

  // 1-Tap Cliente Anónimo / Directo
  const toggleClienteAnonimo = () => {
    if (!esAnonimo) {
      setEsAnonimo(true);
      setClienteNombre('Cliente Directo');
      setClienteTelefono('');
      setClienteEmail('');
      setClienteEncontrado(null);
    } else {
      setEsAnonimo(false);
      setClienteNombre('');
      setClienteTelefono('');
    }
  };

  // Subir comprobante
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setNombreArchivo(file.name);
      const url = await uploadComprobante(file);
      setComprobantePago(url);
      toast.success('Comprobante cargado exitosamente');
    } catch (err: any) {
      toast.error('Error al cargar comprobante', { description: err.message });
    }
  };

  // Boutique: Agregar / Quitar producto
  const agregarProducto = (item: any) => {
    const precio = item.precioServicio || item.precioRegular || 0;
    setProductosSeleccionados(prev => {
      const existe = prev.find(p => p.id === item.id);
      if (existe) {
        return prev.map(p => p.id === item.id ? { ...p, cantidad: p.cantidad + 1 } : p);
      }
      return [...prev, {
        id: item.id,
        nombre: item.nombre,
        precio,
        cantidad: 1,
        imagen: item.imagen || '',
        categoria: item.categoria || 'General',
      }];
    });
  };

  const modificarCantidadProducto = (id: string, delta: number) => {
    setProductosSeleccionados(prev => {
      return prev
        .map(p => p.id === id ? { ...p, cantidad: p.cantidad + delta } : p)
        .filter(p => p.cantidad > 0);
    });
  };

  // Totales
  const costoServicioNumerico = parseFloat(costoServicioManual) || 0;
  const costoAdicionalesNumerico = parseFloat(costoAdicionales) || 0;
  const totalBoutique = productosSeleccionados.reduce((sum, p) => sum + (p.precio * p.cantidad), 0);
  const totalGeneral = costoServicioNumerico + costoAdicionalesNumerico + totalBoutique;

  // Filtrado de boutique
  const productosFiltrados = useMemo(() => {
    if (!inventario) return [];
    return inventario.filter(item => {
      if (item.stock !== undefined && item.stock <= 0) return false;
      const matchCat = categoriaBoutique === 'todos' || item.categoria?.toLowerCase() === categoriaBoutique.toLowerCase();
      const matchBusqueda = !busquedaBoutique || item.nombre.toLowerCase().includes(busquedaBoutique.toLowerCase());
      return matchCat && matchBusqueda;
    });
  }, [inventario, categoriaBoutique, busquedaBoutique]);

  // Lista de categorías disponibles
  const categoriasDisponibles = useMemo(() => {
    if (!inventario) return ['todos'];
    const cats = new Set(inventario.map(i => i.categoria).filter(Boolean));
    return ['todos', ...Array.from(cats)];
  }, [inventario]);

  // Confirmar e Iniciar Servicio
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (tipoRegistro === 'agendamiento' && !agendamientoSeleccionado) {
      toast.error('Por favor selecciona una cita agendada o cambia a Walk-In');
      return;
    }

    if (!clienteNombre.trim()) {
      toast.error('Por favor ingresa el nombre o alias del cliente');
      return;
    }

    if (costoServicioNumerico <= 0) {
      toast.error('El costo del servicio debe ser mayor a 0');
      return;
    }

    try {
      setSubmitting(true);
      const ahora = new Date();
      const duracionMin = tarifaSeleccionada.minutos;
      const horaFin = new Date(ahora.getTime() + duracionMin * 60000).toISOString();

      // 1. Si es en Sede, actualizar la habitación en Supabase
      const habActual = habitaciones.find(h => String(h.numero) === String(habitacionSeleccionada));
      if (tipoServicio === 'Sede' && habActual) {
        await supabase
          .from('habitaciones')
          .update({
            estado: 'ocupada',
            modelo_email: modeloEmail,
            modelo_nombre: modeloNombre,
            hora_inicio: ahora.toISOString(),
            duracion_minutos: duracionMin,
            hora_fin_estimada: horaFin,
          })
          .eq('id', habActual.id);
      }

      // 2. Gestionar cliente en CRM si tiene teléfono
      let clienteId: string | undefined = clienteEncontrado?.id;
      if (tipoRegistro === 'walkin' && clienteTelefono.trim().length >= 7) {
        try {
          if (clienteEncontrado) {
            await registrarServicio(clienteEncontrado.id, totalGeneral);
          } else {
            const nuevo = await agregarCliente({
              telefono: clienteTelefono.trim(),
              nombre: clienteNombre.trim(),
              nombreUsuario: clienteNombre.toLowerCase().replace(/\s+/g, ''),
              email: clienteEmail.trim() || undefined,
            });
            if (nuevo?.id) clienteId = nuevo.id;
          }
        } catch (crmErr) {
          console.warn('Advertencia al guardar cliente en CRM:', crmErr);
        }
      }

      // 3. Preparar consumos detallados
      const consumosDetallados = productosSeleccionados.map(p => ({
        productoId: p.id,
        nombre: p.nombre,
        descripcion: p.nombre,
        costo: p.precio * p.cantidad,
        cantidad: p.cantidad,
      }));

      // 4. Iniciar servicio en el contexto principal
      const agendamientoIdStr = tipoRegistro === 'agendamiento' && agendamientoSeleccionado ? String(agendamientoSeleccionado) : '';

      const resultado = await iniciarServicio(agendamientoIdStr, {
        modeloEmail,
        modeloNombre,
        clienteId: clienteId || '',
        clienteNombre: clienteNombre.trim(),
        clienteTelefono: clienteTelefono.trim() || undefined,
        clienteEmail: clienteEmail.trim() || undefined,
        tipoServicio: tipoServicio === 'Sede' ? 'sede' : 'domicilio',
        habitacion: tipoServicio === 'Sede' ? String(habitacionSeleccionada) : undefined,
        tiempoServicio: tarifaSeleccionada.nombre,
        duracionMinutos: duracionMin,
        tarifaNombre: tarifaSeleccionada.nombre,
        costoServicio: costoServicioNumerico,
        montoPactado: costoServicioNumerico,
        metodoPago,
        comprobantePago: comprobantePago || undefined,
        costoAdicionales: costoAdicionalesNumerico,
        costoConsumo: totalBoutique,
        consumosDetallados,
      });

      if (!resultado.success && resultado.error) {
        throw new Error(typeof resultado.error === 'string' ? resultado.error : (resultado.error.message || 'Error al iniciar servicio'));
      }

      // 5. Enviar notificación a administradores / recepción
      try {
        const { data: admins } = await supabase
          .from('usuarios')
          .select('id')
          .in('role', ['owner', 'admin', 'administrador', 'recepcionista']);

        if (admins && admins.length > 0) {
          const ubicacionTexto = tipoServicio === 'Sede' ? ` — Hab. ${habitacionSeleccionada}` : ' — Domicilio';
          const notificaciones = admins.map((a: any) => ({
            usuario_id: a.id,
            titulo: '🟢 Servicio iniciado',
            mensaje: `${modeloNombre} inició "${tarifaSeleccionada.nombre}" (${tarifaSeleccionada.duracionTexto})${ubicacionTexto} — Cliente: ${clienteNombre.trim()}`,
            tipo: 'servicio_iniciado',
            leida: false,
          }));
          await supabase.from('notificaciones').insert(notificaciones);
        }
      } catch (notifErr) {
        console.warn('Advertencia al enviar notificación a administración:', notifErr);
      }

      // 6. Cambiar estado de turno a "En Servicio"
      cambiarEstado(modeloEmail, 'En Servicio');

      toast.success('¡Servicio iniciado con éxito!', {
        description: `${tarifaSeleccionada.nombre} en curso (${tarifaSeleccionada.duracionTexto})`,
      });

      onClose();
    } catch (err: any) {
      toast.error('No se pudo iniciar el servicio', { description: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center z-50 p-2 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-[#0f0f14] border border-[#d4af37]/35 rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.8)] max-w-2xl w-full max-h-[92vh] flex flex-col overflow-hidden text-white">
        
        {/* ── HEADER ──────────────────────────────────────────────────────── */}
        <div className="bg-[#15151e] border-b border-white/10 px-5 py-3.5 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#d4af37]/30 to-[#d4af37]/5 border border-[#d4af37]/40 flex items-center justify-center text-[#d4af37]">
              <PlayCircle className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
                Iniciar Servicio
                <span className="text-[11px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#d4af37]/15 text-[#d4af37] border border-[#d4af37]/30">
                  {modeloNombre}
                </span>
              </h2>
              <p className="text-xs text-white/50">Registro rápido en menos de 15 segundos</p>
            </div>
          </div>
          <button 
            type="button" 
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/15 text-white/60 hover:text-white flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* ── SELECTOR DE TIPO (CITA O WALK-IN) ────────────────────────────── */}
        <div className="p-4 border-b border-white/10 bg-[#12121a] flex-shrink-0">
          <div className="grid grid-cols-2 gap-2 p-1 bg-black/40 rounded-xl border border-white/5">
            <button
              type="button"
              onClick={() => setTipoRegistro('agendamiento')}
              className={`py-2.5 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                tipoRegistro === 'agendamiento'
                  ? 'bg-gradient-to-r from-[#b8860b] to-[#d4af37] text-black shadow-md shadow-[#d4af37]/20'
                  : 'text-white/60 hover:text-white hover:bg-white/5'
              }`}
            >
              <CalendarIcon className="w-4 h-4" />
              <span>Cita Agendada</span>
              {agendamientosPendientes.length > 0 && (
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
                  tipoRegistro === 'agendamiento' ? 'bg-black text-[#d4af37]' : 'bg-[#d4af37]/20 text-[#d4af37]'
                }`}>
                  {agendamientosPendientes.length}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setTipoRegistro('walkin')}
              className={`py-2.5 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                tipoRegistro === 'walkin'
                  ? 'bg-gradient-to-r from-[#b8860b] to-[#d4af37] text-black shadow-md shadow-[#d4af37]/20'
                  : 'text-white/60 hover:text-white hover:bg-white/5'
              }`}
            >
              <Zap className="w-4 h-4" />
              <span>Walk-In / Directo</span>
            </button>
          </div>
        </div>

        {/* ── CUERPO DEL FORMULARIO CON SCROLL ────────────────────────────── */}
        <form id="iniciar-servicio-form" onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-5">
          
          {/* CASO A: LISTA DE CITAS PENDIENTES */}
          {tipoRegistro === 'agendamiento' && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-bold text-white/80 uppercase tracking-wider">
                  Citas programadas para hoy
                </Label>
                <span className="text-[11px] text-[#d4af37]">{agendamientosPendientes.length} disponibles</span>
              </div>

              {agendamientosPendientes.length > 0 ? (
                <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto pr-1">
                  {agendamientosPendientes.map((ag) => {
                    const isSelected = agendamientoSeleccionado === ag.id;
                    return (
                      <div
                        key={ag.id}
                        onClick={() => setAgendamientoSeleccionado(ag.id)}
                        className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                          isSelected
                            ? 'bg-[#d4af37]/15 border-[#d4af37] shadow-[0_0_15px_rgba(212,175,55,0.15)]'
                            : 'bg-white/[0.03] border-white/10 hover:border-white/25 hover:bg-white/[0.06]'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-lg flex items-center justify-center text-sm font-black ${
                            isSelected ? 'bg-[#d4af37] text-black' : 'bg-white/10 text-white'
                          }`}>
                            {ag.hora ? ag.hora.slice(0, 5) : '🕒'}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-white flex items-center gap-2">
                              {ag.clienteNombre}
                              {ag.estado === 'confirmado' && (
                                <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-1.5 py-0.2 rounded border border-emerald-500/30">
                                  Confirmado
                                </span>
                              )}
                            </p>
                            <p className="text-xs text-white/50">
                              {ag.tipoServicio || 'Sede'} · {ag.clienteTelefono || 'Sin teléfono'}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-black text-[#d4af37]">
                            ${((ag.montoPago || ag.precio || 0)).toLocaleString('es-CO')}
                          </p>
                          <div className="text-[11px] text-white/40 flex items-center gap-1 justify-end">
                            <Clock className="w-3 h-3" />
                            {ag.duracionMinutos ? `${ag.duracionMinutos} min` : '1 hora'}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-5 rounded-xl border border-dashed border-white/15 bg-white/[0.02] text-center space-y-2">
                  <CalendarIcon className="w-8 h-8 text-white/30 mx-auto" />
                  <p className="text-sm text-white/60 font-medium">No tienes citas agendadas para hoy</p>
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => setTipoRegistro('walkin')}
                    className="bg-[#d4af37]/20 text-[#d4af37] hover:bg-[#d4af37]/30 border border-[#d4af37]/40 text-xs mt-1"
                  >
                    Registrar Cliente Directo (Walk-In)
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* CASO B: DATOS DEL CLIENTE (WALK-IN O DETALLE DE CITA) */}
          <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/10 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-white/80">
                <User className="w-3.5 h-3.5 text-[#d4af37]" />
                <span>Datos del Cliente</span>
              </div>

              {tipoRegistro === 'walkin' && (
                <button
                  type="button"
                  onClick={toggleClienteAnonimo}
                  className={`text-[11px] font-bold px-2.5 py-1 rounded-full transition-all flex items-center gap-1.5 border ${
                    esAnonimo
                      ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                      : 'bg-white/5 text-white/60 hover:text-white border-white/10 hover:border-white/20'
                  }`}
                >
                  <Sparkles className="w-3 h-3" />
                  {esAnonimo ? '✓ Cliente Directo (Anónimo)' : '⚡ Usar Cliente Directo'}
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label htmlFor="clienteNombre" className="text-xs text-white/70">Nombre o Alias</Label>
                <Input
                  id="clienteNombre"
                  placeholder="Ej: Carlos o Anónimo"
                  value={clienteNombre}
                  onChange={(e) => {
                    setClienteNombre(e.target.value);
                    if (esAnonimo) setEsAnonimo(false);
                  }}
                  required
                  disabled={tipoRegistro === 'agendamiento' && !!agendamientoSeleccionado}
                  className="mt-1 bg-black/40 border-white/15 focus:border-[#d4af37] text-white text-sm h-10"
                />
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="clienteTelefono" className="text-xs text-white/70">
                    Teléfono <span className="text-white/40 text-[10px]">(opcional)</span>
                  </Label>
                  {buscandoCliente && (
                    <span className="text-[10px] text-[#d4af37] flex items-center gap-1">
                      <Search className="w-3 h-3 animate-spin" /> Buscando...
                    </span>
                  )}
                </div>
                <div className="relative mt-1">
                  <Input
                    id="clienteTelefono"
                    type="tel"
                    placeholder="310 123 4567"
                    value={clienteTelefono}
                    onChange={(e) => setClienteTelefono(e.target.value)}
                    disabled={tipoRegistro === 'agendamiento' && !!agendamientoSeleccionado}
                    className="bg-black/40 border-white/15 focus:border-[#d4af37] text-white text-sm h-10 pr-8"
                  />
                  {clienteEncontrado && (
                    <div className="absolute right-2.5 top-1/2 -translate-y-1/2 text-emerald-400">
                      <CheckCircle className="w-4 h-4" />
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Ficha rápida de cliente frecuente si se detectó */}
            {clienteEncontrado && (
              <div className="mt-2 pt-2 border-t border-white/10">
                <div className="flex items-center justify-between p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/30">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xs">
                      ★
                    </div>
                    <div>
                      <p className="text-xs font-bold text-white">
                        {clienteEncontrado.nombreUsuario || clienteEncontrado.nombre}
                        <span className="text-[10px] text-emerald-400 ml-2 font-normal">Cliente Registrado</span>
                      </p>
                      <p className="text-[10px] text-white/50">
                        {clienteEncontrado.serviciosCompletados || 0} visitas · Nivel {clienteEncontrado.nivel || 'Estándar'}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setMostrarHistorialCliente(!mostrarHistorialCliente)}
                    className="text-[11px] text-[#d4af37] hover:underline font-medium"
                  >
                    {mostrarHistorialCliente ? 'Ocultar' : 'Ver historial'}
                  </button>
                </div>

                {mostrarHistorialCliente && (
                  <div className="mt-2">
                    <ClienteHistorialCard cliente={clienteEncontrado} mostrarFormularioObservacion={false} />
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ── DURACIÓN Y TARIFA PREESTABLECIDA CON EDICIÓN LIBRE ───────────── */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-bold text-white/80 uppercase tracking-wider flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-[#d4af37]" />
                Duración del Servicio
              </Label>
              <span className="text-[11px] text-white/40">Tarifas preestablecidas</span>
            </div>

            {/* Chips de duración */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {TARIFAS_PRESET.map((tarifa) => {
                const isSelected = tarifaSeleccionada.id === tarifa.id;
                return (
                  <button
                    key={tarifa.id}
                    type="button"
                    onClick={() => seleccionarTarifa(tarifa)}
                    className={`p-2.5 rounded-xl border text-left transition-all ${
                      isSelected
                        ? 'bg-[#d4af37]/20 border-[#d4af37] text-white shadow-md shadow-[#d4af37]/10'
                        : 'bg-white/[0.02] border-white/10 hover:border-white/20 text-white/70 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold">{tarifa.nombre}</span>
                      {isSelected && <Check className="w-3 h-3 text-[#d4af37]" />}
                    </div>
                    <p className="text-[10px] text-white/50 mt-0.5">{tarifa.duracionTexto}</p>
                    <p className="text-xs font-black text-[#d4af37] mt-1">
                      ${Math.round(tarifa.precio / 1000)}k
                    </p>
                  </button>
                );
              })}
            </div>

            {/* Campo de precio editable */}
            <div className="p-3 rounded-xl bg-black/40 border border-white/10 flex items-center justify-between gap-4 mt-2">
              <div className="flex-1">
                <Label htmlFor="costoServicioManual" className="text-xs text-white/70 block">
                  Tarifa Pactada <span className="text-[#d4af37] text-[10px]">(editable si acordaste descuento)</span>
                </Label>
                <div className="relative mt-1 flex items-center">
                  <span className="absolute left-3 text-sm text-[#d4af37] font-bold">$</span>
                  <Input
                    id="costoServicioManual"
                    type="number"
                    value={costoServicioManual}
                    onChange={(e) => setCostoServicioManual(e.target.value)}
                    required
                    className="pl-7 bg-white/[0.05] border-white/15 focus:border-[#d4af37] text-white text-base font-bold h-10"
                  />
                </div>
              </div>

              <div className="text-right">
                <p className="text-[10px] uppercase text-white/40 font-bold">Duración</p>
                <p className="text-sm font-black text-white">{tarifaSeleccionada.duracionTexto}</p>
                <p className="text-[10px] text-[#d4af37]">({tarifaSeleccionada.minutos} min)</p>
              </div>
            </div>
          </div>

          {/* ── UBICACIÓN Y HABITACIÓN EN VIVO ──────────────────────────────── */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-bold text-white/80 uppercase tracking-wider flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-[#d4af37]" />
                Ubicación del Servicio
              </Label>
              <div className="flex items-center gap-1 bg-black/40 p-0.5 rounded-lg border border-white/10">
                <button
                  type="button"
                  onClick={() => setTipoServicio('Sede')}
                  className={`px-3 py-1 rounded-md text-xs font-bold transition-all ${
                    tipoServicio === 'Sede'
                      ? 'bg-[#d4af37] text-black shadow-sm'
                      : 'text-white/60 hover:text-white'
                  }`}
                >
                  Sede
                </button>
                <button
                  type="button"
                  onClick={() => setTipoServicio('Domicilio')}
                  className={`px-3 py-1 rounded-md text-xs font-bold transition-all ${
                    tipoServicio === 'Domicilio'
                      ? 'bg-[#d4af37] text-black shadow-sm'
                      : 'text-white/60 hover:text-white'
                  }`}
                >
                  Domicilio
                </button>
              </div>
            </div>

            {/* Selector de habitaciones en Sede */}
            {tipoServicio === 'Sede' && (
              <div className="p-3 rounded-xl bg-white/[0.02] border border-white/10 space-y-2">
                <div className="flex items-center justify-between text-[11px] text-white/50">
                  <span>Selecciona una habitación disponible:</span>
                  <span className="flex items-center gap-3">
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" /> Libre</span>
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-rose-500 inline-block" /> Ocupada</span>
                  </span>
                </div>

                <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                  {habitaciones.map((hab) => {
                    const numeroStr = String(hab.numero);
                    const isSelected = habitacionSeleccionada === numeroStr;
                    const isOcupada = hab.estado === 'ocupada';
                    const isLimpieza = hab.estado === 'limpieza';

                    return (
                      <button
                        key={hab.id}
                        type="button"
                        disabled={isOcupada}
                        onClick={() => setHabitacionSeleccionada(numeroStr)}
                        className={`p-2.5 rounded-xl border transition-all text-center relative ${
                          isSelected
                            ? 'bg-[#d4af37] text-black font-black border-[#d4af37] shadow-lg shadow-[#d4af37]/30 scale-[1.02]'
                            : isOcupada
                            ? 'bg-rose-950/20 border-rose-500/30 text-white/40 cursor-not-allowed opacity-60'
                            : isLimpieza
                            ? 'bg-amber-950/20 border-amber-500/30 text-amber-300'
                            : 'bg-white/[0.03] border-white/10 text-white hover:border-[#d4af37]/60'
                        }`}
                      >
                        <div className="text-sm font-bold">
                          Hab. {hab.numero}
                        </div>
                        <div className="text-[10px] mt-0.5 opacity-80">
                          {isOcupada ? 'Ocupada' : isLimpieza ? 'Aseo' : 'Libre'}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* ── BOUTIQUE & MINIBAR (SIEMPRE DISPONIBLE - TARIFA SERVICIO) ──────── */}
          <div className="rounded-xl border border-white/10 bg-white/[0.02] overflow-hidden">
            <button
              type="button"
              onClick={() => setMostrarBoutique(!mostrarBoutique)}
              className="w-full px-4 py-3 bg-white/[0.04] hover:bg-white/[0.07] transition-colors flex items-center justify-between text-left"
            >
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-4 h-4 text-[#d4af37]" />
                <span className="text-xs font-bold uppercase tracking-wider text-white">
                  Boutique & Minibar
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#d4af37]/15 text-[#d4af37] border border-[#d4af37]/30 font-semibold">
                  Tarifas Especiales de Servicio
                </span>
              </div>
              <div className="flex items-center gap-2">
                {totalBoutique > 0 && (
                  <span className="text-xs font-bold text-[#d4af37]">
                    +{productosSeleccionados.reduce((acc, p) => acc + p.cantidad, 0)} items (${totalBoutique.toLocaleString('es-CO')})
                  </span>
                )}
                {mostrarBoutique ? <ChevronUp className="w-4 h-4 text-white/60" /> : <ChevronDown className="w-4 h-4 text-white/60" />}
              </div>
            </button>

            {mostrarBoutique && (
              <div className="p-4 space-y-3 bg-black/40 border-t border-white/10 animate-in slide-in-from-top-2 duration-200">
                {/* Categorías & Filtro */}
                <div className="flex items-center gap-2 overflow-x-auto pb-1">
                  {categoriasDisponibles.map(cat => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setCategoriaBoutique(cat)}
                      className={`text-[11px] px-2.5 py-1 rounded-lg uppercase tracking-wider font-bold transition-all flex-shrink-0 ${
                        categoriaBoutique === cat
                          ? 'bg-[#d4af37] text-black font-black'
                          : 'bg-white/5 text-white/60 hover:text-white hover:bg-white/10'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>

                {/* Lista de productos para selección rápida */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-52 overflow-y-auto pr-1">
                  {productosFiltrados.map((item) => {
                    const sel = productosSeleccionados.find(p => p.id === item.id);
                    const cantidad = sel?.cantidad || 0;
                    const precio = item.precioServicio || item.precioRegular || 0;

                    return (
                      <div
                        key={item.id}
                        className={`p-2 rounded-xl border flex items-center gap-2.5 transition-all ${
                          cantidad > 0
                            ? 'bg-[#d4af37]/10 border-[#d4af37]/50'
                            : 'bg-white/[0.03] border-white/5 hover:border-white/15'
                        }`}
                      >
                        {item.imagen ? (
                          <img
                            src={item.imagen}
                            alt={item.nombre}
                            className="w-11 h-11 rounded-lg object-cover bg-black/50 flex-shrink-0 border border-white/10"
                          />
                        ) : (
                          <div className="w-11 h-11 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center flex-shrink-0 text-white/40">
                            <ShoppingBag className="w-5 h-5" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-white truncate">{item.nombre}</p>
                          <p className="text-xs font-black text-[#d4af37]">
                            ${precio.toLocaleString('es-CO')}
                          </p>
                        </div>

                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          {cantidad > 0 ? (
                            <>
                              <button
                                type="button"
                                onClick={() => modificarCantidadProducto(item.id, -1)}
                                className="w-6 h-6 rounded-md bg-white/10 hover:bg-white/20 text-white flex items-center justify-center text-xs font-bold"
                              >
                                <Minus className="w-3 h-3" />
                              </button>
                              <span className="text-xs font-black text-[#d4af37] w-5 text-center">
                                {cantidad}
                              </span>
                              <button
                                type="button"
                                onClick={() => modificarCantidadProducto(item.id, 1)}
                                className="w-6 h-6 rounded-md bg-[#d4af37] hover:bg-[#d4af37]/80 text-black flex items-center justify-center text-xs font-bold"
                              >
                                <Plus className="w-3 h-3" />
                              </button>
                            </>
                          ) : (
                            <button
                              type="button"
                              onClick={() => agregarProducto(item)}
                              className="px-2.5 py-1 rounded-md bg-white/10 hover:bg-[#d4af37] hover:text-black text-white text-[11px] font-bold transition-colors flex items-center gap-1"
                            >
                              <Plus className="w-3 h-3" /> Agregar
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Resumen de items seleccionados */}
                {productosSeleccionados.length > 0 && (
                  <div className="p-2.5 rounded-lg bg-[#d4af37]/10 border border-[#d4af37]/30 flex items-center justify-between text-xs">
                    <span className="text-white/80 font-medium">
                      {productosSeleccionados.length} productos en el pedido
                    </span>
                    <span className="font-black text-[#d4af37] text-sm">
                      Total Consumo: ${totalBoutique.toLocaleString('es-CO')}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ── MÉTODO DE PAGO ──────────────────────────────────────────────── */}
          <div className="space-y-2.5">
            <Label className="text-xs font-bold text-white/80 uppercase tracking-wider flex items-center gap-1.5">
              <DollarSign className="w-3.5 h-3.5 text-[#d4af37]" />
              Método de Pago
            </Label>

            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              {(['Efectivo', 'Nequi', 'Daviplata', 'Datafono', 'QR', 'Convenio'] as const).map((m) => {
                const isSelected = metodoPago === m;
                return (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setMetodoPago(m)}
                    className={`py-2 px-1 rounded-xl text-xs font-bold border transition-all text-center truncate ${
                      isSelected
                        ? 'bg-[#d4af37] text-black border-[#d4af37] shadow-md shadow-[#d4af37]/20 font-black'
                        : 'bg-white/[0.03] border-white/10 text-white/70 hover:text-white hover:border-white/20'
                    }`}
                  >
                    {m}
                  </button>
                );
              })}
            </div>

            {/* Subir comprobante (relevante para transferencias o datáfono) */}
            {metodoPago !== 'Efectivo' && (
              <div className="p-3 rounded-xl bg-black/40 border border-white/10 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-white/70">Comprobante de Transferencia:</span>
                  <span className="text-[10px] text-white/40">(Opcional)</span>
                </div>

                <label className="flex items-center justify-center gap-2 p-2.5 rounded-lg border border-dashed border-white/20 hover:border-[#d4af37]/60 cursor-pointer bg-white/[0.02] hover:bg-white/[0.05] transition-all">
                  <Upload className="w-4 h-4 text-[#d4af37]" />
                  <span className="text-xs text-white/70 truncate">
                    {nombreArchivo || 'Subir foto o captura del comprobante'}
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>

                {comprobantePago && (
                  <div className="relative rounded-lg overflow-hidden border border-[#d4af37]/40 max-h-24">
                    <img src={comprobantePago} alt="Comprobante" className="w-full h-24 object-cover" />
                    <button
                      type="button"
                      onClick={() => {
                        setComprobantePago(null);
                        setNombreArchivo('');
                      }}
                      className="absolute top-1.5 right-1.5 p-1 rounded-md bg-black/70 text-white/80 hover:text-white"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </form>

        {/* ── FOOTER STICKY CON RESUMEN Y BOTÓN DORADO ────────────────────── */}
        <div className="bg-[#12121a] border-t border-white/10 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 flex-shrink-0">
          <div className="space-y-0.5">
            <div className="flex items-baseline gap-2">
              <span className="text-xs text-white/50 uppercase font-bold tracking-wider">Total a Cobrar:</span>
              <span className="text-2xl font-black text-[#d4af37] tracking-tight">
                ${totalGeneral.toLocaleString('es-CO')}
              </span>
            </div>
            <p className="text-[11px] text-white/40">
              Servicio: ${costoServicioNumerico.toLocaleString('es-CO')}
              {totalBoutique > 0 && ` + Boutique: $${totalBoutique.toLocaleString('es-CO')}`}
              {costoAdicionalesNumerico > 0 && ` + Extras: $${costoAdicionalesNumerico.toLocaleString('es-CO')}`}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="border-white/15 text-white/70 hover:text-white bg-transparent text-xs h-11 px-4"
            >
              Cancelar
            </Button>
            
            <Button
              type="submit"
              form="iniciar-servicio-form"
              disabled={submitting}
              className="bg-gradient-to-r from-[#b8860b] via-[#d4af37] to-[#ffd700] hover:brightness-110 text-black font-black text-sm h-11 px-6 shadow-lg shadow-[#d4af37]/25 flex items-center gap-2 transition-all flex-1 sm:flex-initial"
            >
              <PlayCircle className="w-4 h-4 fill-black" />
              {submitting ? 'Iniciando...' : 'Iniciar Servicio Ya'}
            </Button>
          </div>
        </div>

      </div>
    </div>
  );
}