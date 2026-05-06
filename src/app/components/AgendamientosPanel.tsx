import { useState, useEffect } from 'react';
import {
  Calendar, Clock, CheckCircle, XCircle, AlertCircle,
  User, Phone, ThumbsUp, ThumbsDown, Filter,
  RefreshCw, Plus, Star, X, Users, MapPin,
  Archive, Trash2, RotateCcw, Square, CheckSquare, Loader2,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { useAgendamientos, Agendamiento, formatearFecha, formatearHora } from './AgendamientosContext';
import { useModelos } from './ModelosContext';
import { supabase } from '../../utils/supabase/info';
import { toast } from 'sonner';

// ── Constantes de estilo ──────────────────────────────────────────────────────

const COLOR_PRIMARY = '#c9a961';

export const ESTADO_CONFIG: Record<Agendamiento['estado'], { label: string; color: string; icon: React.ReactNode }> = {
  pendiente:            { label: 'Pendiente',   color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30', icon: <Clock className="w-3 h-3" /> },
  solicitud_cliente:    { label: 'Solicitud',   color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30', icon: <Clock className="w-3 h-3" /> },
  aceptado_programador: { label: 'Aceptado',    color: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',       icon: <CheckCircle className="w-3 h-3" /> },
  confirmado:           { label: 'Confirmado',  color: 'bg-blue-500/20 text-blue-400 border-blue-500/30',       icon: <CheckCircle className="w-3 h-3" /> },
  aprobado:             { label: 'Aprobado',    color: 'bg-blue-500/20 text-blue-400 border-blue-500/30',       icon: <CheckCircle className="w-3 h-3" /> },
  en_curso:             { label: 'En Curso',    color: 'bg-purple-500/20 text-purple-400 border-purple-500/30', icon: <Star className="w-3 h-3" /> },
  activo:               { label: 'Activo',      color: 'bg-purple-500/20 text-purple-400 border-purple-500/30', icon: <Star className="w-3 h-3" /> },
  completado:           { label: 'Completado',  color: 'bg-green-500/20 text-green-400 border-green-500/30',    icon: <CheckCircle className="w-3 h-3" /> },
  finalizado:           { label: 'Finalizado',  color: 'bg-green-500/20 text-green-400 border-green-500/30',    icon: <CheckCircle className="w-3 h-3" /> },
  cancelado:            { label: 'Cancelado',   color: 'bg-red-500/20 text-red-400 border-red-500/30',          icon: <XCircle className="w-3 h-3" /> },
  no_show:              { label: 'No Show',     color: 'bg-gray-500/20 text-gray-400 border-gray-500/30',       icon: <AlertCircle className="w-3 h-3" /> },
};

// ── Props ─────────────────────────────────────────────────────────────────────

interface AgendamientosPanelProps {
  rol: 'owner' | 'admin' | 'supervisor' | 'recepcionista' | 'modelo';
  userEmail?: string;
  /** Sólo para rol='modelo': filtra por este email */
  modeloEmail?: string;
}

// ── Fila de agendamiento ──────────────────────────────────────────────────────

function AgendamientoRow({
  ag,
  rol,
  userEmail = '',
  onAprobar,
  onRechazar,
  onCompletar,
  onNoShow,
  onCancelar,
  onArchivar,
  onEliminar,
  onRestaurar,
  seleccionado,
  onToggleSelect,
}: {
  ag: Agendamiento;
  rol: AgendamientosPanelProps['rol'];
  userEmail?: string;
  onAprobar: (id: string) => void;
  onRechazar: (id: string) => void;
  onCompletar: (id: string) => void;
  onNoShow: (id: string) => void;
  onCancelar: (id: string) => void;
  onArchivar?: (ag: Agendamiento) => void;
  onEliminar?: (ag: Agendamiento) => void;
  onRestaurar?: (ag: Agendamiento) => void;
  seleccionado?: boolean;
  onToggleSelect?: (id: string) => void;
}) {
  const cfg = ESTADO_CONFIG[ag.estado] ?? ESTADO_CONFIG.pendiente;
  const puedeAprobar    = (rol === 'supervisor' || rol === 'admin' || rol === 'owner') && ag.estado === 'pendiente';
  const puedeCompletar  = (rol !== 'modelo') && (ag.estado === 'confirmado' || ag.estado === 'aprobado');
  const puedeNoShow     = (rol !== 'modelo') && (ag.estado === 'confirmado' || ag.estado === 'aprobado');
  const puedeCancelar   = (rol !== 'modelo') && (ag.estado === 'pendiente' || ag.estado === 'confirmado' || ag.estado === 'aprobado');

  const esAdmin = rol === 'admin' || rol === 'owner';
  const esArchivado = !!(ag as any).archivado;

  return (
    <div className={`flex flex-col sm:flex-row sm:items-center gap-3 p-3 rounded-lg border transition-colors ${
      seleccionado
        ? 'border-amber-500/40 bg-amber-500/5'
        : 'border-white/5 bg-white/[0.02] hover:bg-white/[0.04]'
    }`}>
      {/* Checkbox selección múltiple */}
      {onToggleSelect && esAdmin && (
        <button
          onClick={() => onToggleSelect(ag.id)}
          className="flex-shrink-0 text-white/30 hover:text-amber-400 transition-colors"
        >
          {seleccionado
            ? <CheckSquare className="w-4 h-4 text-amber-400" />
            : <Square className="w-4 h-4" />}
        </button>
      )}
      {/* Hora */}
      <div className="flex-shrink-0 w-24 text-center hidden sm:block">
        <span className="text-sm font-bold" style={{ color: COLOR_PRIMARY }}>{formatearHora(ag.hora)}</span>
        <p className="text-[10px] text-gray-500 capitalize">{formatearFecha(ag.fecha).split(',')[0]}</p>
      </div>

      {/* Info principal */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-medium text-white truncate">{ag.clienteNombre}</span>
          <Badge className={`text-[10px] border ${cfg.color} flex items-center gap-1`}>
            {cfg.icon}
            {cfg.label}
          </Badge>
          {ag.creadoPorRol === 'modelo' && (
            <Badge className="text-[10px] font-bold border-none" style={{ background: 'linear-gradient(135deg, #B8860B, #FFD700)', color: 'black' }}>
              ⚡ Directo
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-3 mt-0.5 flex-wrap">
          <span className="text-xs text-gray-400 flex items-center gap-1">
            <User className="w-3 h-3" />{ag.modeloNombre}
          </span>
          {ag.clienteTelefono && (
            <span className="text-xs text-gray-500 flex items-center gap-1">
              <Phone className="w-3 h-3" />{ag.clienteTelefono}
            </span>
          )}
          <span className="text-xs text-gray-500 sm:hidden">{formatearHora(ag.hora)} · <span className="capitalize">{formatearFecha(ag.fecha)}</span></span>
        </div>
        {ag.tipoServicio && (
          <span className="text-[10px] text-gray-500 mt-0.5 block">{ag.tipoServicio} · {ag.duracionMinutos}min · ${(ag.montoPago / 1000).toFixed(0)}k</span>
        )}
      </div>

      {/* Acciones */}
      <div className="flex items-center gap-1.5 flex-wrap flex-shrink-0">
        {puedeAprobar && (
          <>
            <Button size="sm" onClick={() => onAprobar(ag.id)}
              className="h-7 px-2 text-xs bg-blue-500/20 text-blue-400 border border-blue-500/30 hover:bg-blue-500/30">
              <ThumbsUp className="w-3 h-3 mr-1" />Aprobar
            </Button>
            <Button size="sm" onClick={() => onRechazar(ag.id)}
              className="h-7 px-2 text-xs bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20">
              <ThumbsDown className="w-3 h-3 mr-1" />Rechazar
            </Button>
          </>
        )}
        {puedeCompletar && (
          <Button size="sm" onClick={() => onCompletar(ag.id)}
            className="h-7 px-2 text-xs bg-green-500/20 text-green-400 border border-green-500/30 hover:bg-green-500/30">
            <CheckCircle className="w-3 h-3 mr-1" />Completar
          </Button>
        )}
        {puedeNoShow && (
          <Button size="sm" onClick={() => onNoShow(ag.id)}
            className="h-7 px-2 text-xs bg-gray-500/10 text-gray-400 border border-gray-500/20 hover:bg-gray-500/20">
            <AlertCircle className="w-3 h-3 mr-1" />No Show
          </Button>
        )}
        {puedeCancelar && (
          <Button size="sm" onClick={() => onCancelar(ag.id)}
            className="h-7 px-2 text-xs bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20">
            <XCircle className="w-3 h-3 mr-1" />Cancelar
          </Button>
        )}
        {/* Restaurar (solo en vista archivados) */}
        {esArchivado && onRestaurar && esAdmin && (
          <Button size="sm" onClick={() => onRestaurar(ag)}
            className="h-7 px-2 text-xs bg-green-500/10 text-green-400 border border-green-500/20 hover:bg-green-500/20">
            <RotateCcw className="w-3 h-3 mr-1" />Restaurar
          </Button>
        )}
        {/* Archivar */}
        {!esArchivado && onArchivar && esAdmin && (
          <Button size="sm" onClick={() => onArchivar(ag)}
            className="h-7 px-2 text-xs bg-amber-500/10 text-amber-400 border border-amber-500/20 hover:bg-amber-500/20">
            <Archive className="w-3 h-3 mr-1" />Archivar
          </Button>
        )}
        {/* Eliminar */}
        {onEliminar && rol === 'admin' && (
          <Button size="sm" onClick={() => onEliminar(ag)}
            className="h-7 px-2 text-xs bg-red-900/20 text-red-400 border border-red-900/30 hover:bg-red-900/30">
            <Trash2 className="w-3 h-3" />
          </Button>
        )}
      </div>
    </div>
  );
}

// ── Modal: Nuevo Agendamiento ─────────────────────────────────────────────────

const DURACIONES = [
  { label: '30 min', value: 30 },
  { label: '1 hora', value: 60 },
  { label: '1.5 horas', value: 90 },
  { label: '2 horas', value: 120 },
  { label: '3 horas', value: 180 },
  { label: '4 horas', value: 240 },
];

const TIPOS_SERVICIO = ['VIP', 'Estándar', 'Premium', 'Básico', 'Personalizado'];
const TIPOS_UBICACION = ['Sede', 'Domicilio', 'Virtual'];

interface NuevoAgendamientoModalProps {
  onClose: () => void;
  userEmail: string;
  onCreado: () => void;
}

function NuevoAgendamientoModal({ onClose, userEmail, onCreado }: NuevoAgendamientoModalProps) {
  const { modelos } = useModelos();
  const modelosActivos = modelos.filter(m => m.activa);
  const { agregarAgendamiento, actualizarAgendamiento } = useAgendamientos();

  const hoyISO = new Date().toISOString().split('T')[0];
  const [guardando, setGuardando] = useState(false);
  const [form, setForm] = useState({
    clienteNombre: '',
    clienteTelefono: '',
    clienteEmail: '',
    modeloEmail: '',
    tipoServicio: 'Estándar',
    ubicacion: 'Sede',
    habitacion: '',
    direccion: '',
    fecha: hoyISO,
    hora: '10:00',
    duracion: 60,
    precio: 0,
    notas: '',
  });
  const [sugerenciasClientes, setSugerenciasClientes] = useState<any[]>([]);
  const [mostrarSugerencias, setMostrarSugerencias] = useState(false);

  const modeloSeleccionada = modelosActivos.find(m => m.email === form.modeloEmail);

  const set = (k: string, v: any) => setForm(prev => ({ ...prev, [k]: v }));

  // ── Buscar clientes por teléfono (autocomplete) ──────────────────────────────
  const buscarClientePorTelefono = async (tel: string) => {
    if (tel.length < 6) { setSugerenciasClientes([]); setMostrarSugerencias(false); return; }
    const { data } = await supabase
      .from('clientes')
      .select('id, nombre, telefono, email, total_visitas, total_gastado')
      .ilike('telefono', `%${tel}%`)
      .limit(5);
    setSugerenciasClientes(data || []);
    setMostrarSugerencias((data?.length || 0) > 0);
  };

  // ── Auto-guardar/actualizar cliente en la tabla clientes ─────────────────────
  const guardarCliente = async (nombre: string, telefono: string, email?: string): Promise<string | null> => {
    try {
      let clienteId: string | null = null;

      if (telefono) {
        const { data: byPhone } = await supabase
          .from('clientes')
          .select('id, total_visitas')
          .eq('telefono', telefono)
          .maybeSingle();

        if (byPhone) {
          await supabase.from('clientes').update({
            nombre,
            ultimo_agendamiento: new Date().toISOString().split('T')[0],
            total_visitas: (byPhone.total_visitas || 0) + 1,
            updated_at: new Date().toISOString(),
          }).eq('id', byPhone.id);
          clienteId = byPhone.id;
        }
      }

      if (!clienteId && email) {
        const { data: byEmail } = await supabase
          .from('clientes')
          .select('id, total_visitas')
          .eq('email', email)
          .maybeSingle();

        if (byEmail) {
          await supabase.from('clientes').update({
            nombre,
            ultimo_agendamiento: new Date().toISOString().split('T')[0],
            total_visitas: (byEmail.total_visitas || 0) + 1,
            updated_at: new Date().toISOString(),
          }).eq('id', byEmail.id);
          clienteId = byEmail.id;
        }
      }

      if (!clienteId) {
        const { data: newCliente } = await supabase
          .from('clientes')
          .insert({
            nombre,
            telefono: telefono || null,
            email: email || null,
            total_visitas: 1,
            ultimo_agendamiento: new Date().toISOString().split('T')[0],
          })
          .select('id')
          .single();
        clienteId = newCliente?.id || null;
      }

      return clienteId;
    } catch {
      return null;
    }
  };

  const guardar = async (aprobar: boolean) => {
    if (!form.clienteNombre.trim()) { toast.error('Ingresa el nombre del cliente'); return; }
    if (!form.modeloEmail) { toast.error('Selecciona una modelo'); return; }
    if (!form.fecha) { toast.error('Selecciona una fecha'); return; }

    setGuardando(true);
    try {
      const result = await agregarAgendamiento({
        clienteId: `manual-${Date.now()}`,
        clienteNombre: form.clienteNombre.trim(),
        clienteTelefono: form.clienteTelefono.trim(),
        modeloEmail: form.modeloEmail,
        modeloNombre: modeloSeleccionada?.nombreArtistico || modeloSeleccionada?.nombre || '',
        tipoServicio: form.tipoServicio,
        fecha: form.fecha,
        hora: form.hora,
        duracionMinutos: form.duracion,
        montoPago: form.precio,
        estadoPago: 'pendiente',
        notas: form.notas.trim() || undefined,
        estado: aprobar ? 'aprobado' : 'pendiente',
      });
      if (result.success) {
        // Auto-save client and link to booking
        const clienteId = await guardarCliente(
          form.clienteNombre.trim(),
          form.clienteTelefono.trim(),
          form.clienteEmail.trim() || undefined,
        );
        if (clienteId && result.data?.id) {
          await actualizarAgendamiento(result.data.id, { clienteRefId: clienteId });
        }
        toast.success(aprobar ? 'Agendamiento creado y aprobado' : 'Agendamiento guardado como pendiente');
        onCreado();
        onClose();
      } else {
        toast.error('Error al guardar: ' + (result.error?.message || 'Error desconocido'));
      }
    } catch (e: any) {
      toast.error('Error: ' + e.message);
    }
    setGuardando(false);
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-3 overflow-y-auto">
      <div className="bg-[#111] border border-white/10 rounded-xl w-full max-w-lg my-4">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <h3 className="font-bold text-base flex items-center gap-2" style={{ color: COLOR_PRIMARY }}>
            <Plus className="w-4 h-4" /> Nuevo Agendamiento
          </h3>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose}><X className="w-4 h-4" /></Button>
        </div>

        <div className="p-4 space-y-4 max-h-[75vh] overflow-y-auto">
          {/* Cliente */}
          <div>
            <p className="text-[10px] uppercase text-gray-500 font-semibold mb-2 tracking-wider">Cliente</p>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs text-gray-400 block mb-1">Nombre *</label>
                <input className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-primary" value={form.clienteNombre} onChange={e => set('clienteNombre', e.target.value)} placeholder="Nombre del cliente" />
              </div>
              <div className="relative">
                <label className="text-xs text-gray-400 block mb-1">Teléfono</label>
                <input
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-primary"
                  value={form.clienteTelefono}
                  onChange={e => { set('clienteTelefono', e.target.value); buscarClientePorTelefono(e.target.value); }}
                  onBlur={() => setTimeout(() => setMostrarSugerencias(false), 200)}
                  placeholder="3XX XXX XXXX"
                  autoComplete="off"
                />
                {mostrarSugerencias && sugerenciasClientes.length > 0 && (
                  <div className="absolute left-0 right-0 top-full mt-1 z-50 bg-[#1a1a1a] border border-white/10 rounded-lg shadow-xl overflow-hidden">
                    {sugerenciasClientes.map(c => (
                      <button
                        key={c.id}
                        type="button"
                        className="w-full text-left px-3 py-2 hover:bg-white/10 transition-colors border-b border-white/5 last:border-b-0"
                        onMouseDown={() => {
                          set('clienteNombre', c.nombre);
                          set('clienteTelefono', c.telefono || '');
                          set('clienteEmail', c.email || '');
                          setMostrarSugerencias(false);
                        }}
                      >
                        <p className="text-xs font-medium text-white">{c.nombre}</p>
                        <p className="text-[10px] text-gray-400">{c.telefono}{c.total_visitas ? ` · ${c.total_visitas} visita${c.total_visitas !== 1 ? 's' : ''}` : ''}</p>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div className="mt-2">
              <label className="text-xs text-gray-400 block mb-1">Email (opcional)</label>
              <input className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-primary" value={form.clienteEmail} onChange={e => set('clienteEmail', e.target.value)} placeholder="cliente@email.com" />
            </div>
          </div>

          {/* Modelo */}
          <div>
            <p className="text-[10px] uppercase text-gray-500 font-semibold mb-2 tracking-wider">Modelo</p>
            <select className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary" value={form.modeloEmail} onChange={e => set('modeloEmail', e.target.value)}>
              <option value="">— Seleccionar modelo —</option>
              {modelosActivos.map(m => (
                <option key={m.id} value={m.email}>{m.nombreArtistico || m.nombre}</option>
              ))}
            </select>
            {modeloSeleccionada && (
              <div className="mt-2 flex items-center gap-2 p-2 bg-white/5 rounded-lg">
                <img src={modeloSeleccionada.fotoPerfil} alt="" className="w-8 h-8 rounded-full object-cover border border-primary/30" loading="lazy" width={32} height={32} />
                <div>
                  <p className="text-xs font-medium text-white">{modeloSeleccionada.nombreArtistico || modeloSeleccionada.nombre}</p>
                  <p className="text-[10px] text-gray-500">{modeloSeleccionada.email}</p>
                </div>
              </div>
            )}
          </div>

          {/* Servicio */}
          <div>
            <p className="text-[10px] uppercase text-gray-500 font-semibold mb-2 tracking-wider">Servicio</p>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs text-gray-400 block mb-1">Tipo</label>
                <select className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-primary" value={form.tipoServicio} onChange={e => set('tipoServicio', e.target.value)}>
                  {TIPOS_SERVICIO.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-400 block mb-1">Ubicación</label>
                <select className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-primary" value={form.ubicacion} onChange={e => set('ubicacion', e.target.value)}>
                  {TIPOS_UBICACION.map(u => <option key={u} value={u}>{u}</option>)}
                </select>
              </div>
            </div>
            {form.ubicacion === 'Sede' && (
              <input className="mt-2 w-full bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-primary" value={form.habitacion} onChange={e => set('habitacion', e.target.value)} placeholder="Habitación (ej: Hab. 3)" />
            )}
            {form.ubicacion === 'Domicilio' && (
              <input className="mt-2 w-full bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-primary" value={form.direccion} onChange={e => set('direccion', e.target.value)} placeholder="Dirección completa" />
            )}
          </div>

          {/* Fecha y Hora */}
          <div>
            <p className="text-[10px] uppercase text-gray-500 font-semibold mb-2 tracking-wider">Fecha y Hora</p>
            <div className="grid grid-cols-3 gap-2">
              <div className="col-span-1">
                <label className="text-xs text-gray-400 block mb-1">Fecha *</label>
                <input type="date" className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-primary" value={form.fecha} onChange={e => set('fecha', e.target.value)} />
              </div>
              <div>
                <label className="text-xs text-gray-400 block mb-1">Hora</label>
                <input type="time" className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-primary" value={form.hora} onChange={e => set('hora', e.target.value)} />
              </div>
              <div>
                <label className="text-xs text-gray-400 block mb-1">Duración</label>
                <select className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-primary" value={form.duracion} onChange={e => set('duracion', Number(e.target.value))}>
                  {DURACIONES.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
                </select>
              </div>
            </div>
          </div>

          {/* Precio */}
          <div>
            <p className="text-[10px] uppercase text-gray-500 font-semibold mb-2 tracking-wider">Precio</p>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
              <input type="number" min={0} className="w-full bg-white/5 border border-white/10 rounded-lg pl-7 pr-3 py-1.5 text-sm focus:outline-none focus:border-primary" value={form.precio || ''} onChange={e => set('precio', Number(e.target.value))} placeholder="0" />
            </div>
          </div>

          {/* Notas */}
          <div>
            <label className="text-xs text-gray-400 block mb-1">Notas adicionales</label>
            <textarea rows={2} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-primary resize-none" value={form.notas} onChange={e => set('notas', e.target.value)} placeholder="Preferencias, requerimientos especiales..." />
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/10 flex flex-col sm:flex-row gap-2">
          <Button variant="outline" className="flex-1 border-white/10 text-gray-400 hover:bg-white/5" onClick={onClose}>Cancelar</Button>
          <Button variant="outline" className="flex-1 border-white/20 text-white hover:bg-white/10" disabled={guardando} onClick={() => guardar(false)}>
            {guardando ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : null}
            Guardar pendiente
          </Button>
          <Button className="flex-1 text-black font-semibold" style={{ background: COLOR_PRIMARY }} disabled={guardando} onClick={() => guardar(true)}>
            {guardando ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : null}
            Aprobar directo
          </Button>
        </div>
      </div>
    </div>
  );
}

// ── Modal: Crear Evento ───────────────────────────────────────────────────────

const TIPOS_EVENTO = ['Privado', 'Corporativo', 'Especial', 'VIP', 'Otro'];
const TARIFA_BASE = 150000; // Tarifa base por hora por modelo

interface CrearEventoModalProps {
  onClose: () => void;
  userEmail: string;
  onCreado: () => void;
}

function CrearEventoModal({ onClose, userEmail, onCreado }: CrearEventoModalProps) {
  const { modelos } = useModelos();
  const { agregarAgendamiento } = useAgendamientos();
  const modelosActivos = modelos.filter(m => m.activa);

  const hoyISO = new Date().toISOString().split('T')[0];
  const [guardando, setGuardando] = useState(false);
  const [form, setForm] = useState({
    nombre: '',
    tipo: 'Privado',
    descripcion: '',
    ubicacionTipo: 'Sede',
    direccion: '',
    ciudad: '',
    fecha: hoyISO,
    horaInicio: '18:00',
    horaFin: '22:00',
  });
  const [modelosSeleccionadas, setModelosSeleccionadas] = useState<string[]>([]);

  const set = (k: string, v: any) => setForm(prev => ({ ...prev, [k]: v }));

  const toggleModelo = (email: string) => {
    setModelosSeleccionadas(prev =>
      prev.includes(email) ? prev.filter(e => e !== email) : [...prev, email]
    );
  };

  // Cálculo de costos
  const calcular = () => {
    const [hIni, mIni] = form.horaInicio.split(':').map(Number);
    const [hFin, mFin] = form.horaFin.split(':').map(Number);
    const durMinutos = (hFin * 60 + mFin) - (hIni * 60 + mIni);
    const durHoras = Math.max(0, durMinutos / 60);
    const costoModelos = modelosSeleccionadas.length * TARIFA_BASE * durHoras;
    const subtotal = costoModelos;
    const iva = subtotal * 0.19;
    const total = subtotal + iva;
    return { durMinutos: Math.max(0, durMinutos), durHoras, costoModelos, subtotal, iva, total };
  };

  const costos = calcular();

  const guardar = async () => {
    if (!form.nombre.trim()) { toast.error('Ingresa el nombre del evento'); return; }
    if (modelosSeleccionadas.length === 0) { toast.error('Selecciona al menos una modelo'); return; }
    if (!form.fecha) { toast.error('Selecciona la fecha'); return; }

    setGuardando(true);
    try {
      // Intentar guardar en tabla eventos (puede no existir)
      const eventoPayload = {
        nombre: form.nombre,
        tipo: form.tipo,
        descripcion: form.descripcion,
        modelos_ids: modelosSeleccionadas,
        modelos_nombres: modelosSeleccionadas.map(email => {
          const m = modelos.find(x => x.email === email);
          return m?.nombreArtistico || m?.nombre || email;
        }),
        ubicacion_tipo: form.ubicacionTipo,
        direccion: form.ubicacionTipo !== 'Sede' ? form.direccion : null,
        fecha_evento: form.fecha,
        hora_inicio: form.horaInicio,
        hora_fin: form.horaFin,
        duracion_minutos: costos.durMinutos,
        costo_modelos: costos.costoModelos,
        subtotal: costos.subtotal,
        iva: costos.iva,
        total: costos.total,
        estado: 'pendiente',
        creado_por: userEmail,
      };

      const { error: errorEvento } = await supabase.from('eventos').insert(eventoPayload);
      if (errorEvento && process.env.NODE_ENV === 'development') {
        console.warn('Tabla eventos no existe, solo se crearán agendamientos:', errorEvento.message);
      }

      // Crear agendamiento individual por cada modelo
      let errores = 0;
      for (const email of modelosSeleccionadas) {
        const modelo = modelos.find(m => m.email === email);
        const result = await agregarAgendamiento({
          clienteId: `evento-${Date.now()}`,
          clienteNombre: form.nombre,
          clienteTelefono: '',
          modeloEmail: email,
          modeloNombre: modelo?.nombreArtistico || modelo?.nombre || '',
          tipoServicio: `Evento ${form.tipo}`,
          fecha: form.fecha,
          hora: form.horaInicio,
          duracionMinutos: costos.durMinutos,
          montoPago: Math.round(TARIFA_BASE * costos.durHoras),
          estadoPago: 'pendiente',
          notas: form.descripcion || undefined,
          estado: 'aprobado',
        });
        if (!result.success) errores++;
      }

      if (errores === 0) {
        toast.success(`Evento creado con ${modelosSeleccionadas.length} modelo${modelosSeleccionadas.length > 1 ? 's' : ''}. Total: $${costos.total.toLocaleString('es-CO', { maximumFractionDigits: 0 })}`);
        onCreado();
        onClose();
      } else {
        toast.error(`Se crearon ${modelosSeleccionadas.length - errores} de ${modelosSeleccionadas.length} agendamientos`);
      }
    } catch (e: any) {
      toast.error('Error: ' + e.message);
    }
    setGuardando(false);
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-3 overflow-y-auto">
      <div className="bg-[#111] border border-white/10 rounded-xl w-full max-w-2xl my-4">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <h3 className="font-bold text-base flex items-center gap-2" style={{ color: COLOR_PRIMARY }}>
            <Star className="w-4 h-4" /> Crear Evento
          </h3>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose}><X className="w-4 h-4" /></Button>
        </div>

        <div className="p-4 space-y-4 max-h-[75vh] overflow-y-auto">
          {/* Info del evento */}
          <div>
            <p className="text-[10px] uppercase text-gray-500 font-semibold mb-2 tracking-wider">Evento</p>
            <div className="grid grid-cols-3 gap-2 mb-2">
              <div className="col-span-2">
                <label className="text-xs text-gray-400 block mb-1">Nombre del evento *</label>
                <input className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-primary" value={form.nombre} onChange={e => set('nombre', e.target.value)} placeholder="Ej: Fiesta Privada VIP" />
              </div>
              <div>
                <label className="text-xs text-gray-400 block mb-1">Tipo</label>
                <select className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-primary" value={form.tipo} onChange={e => set('tipo', e.target.value)}>
                  {TIPOS_EVENTO.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
            </div>
            <textarea rows={2} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-primary resize-none" value={form.descripcion} onChange={e => set('descripcion', e.target.value)} placeholder="Descripción del evento..." />
          </div>

          {/* Modelos */}
          <div>
            <p className="text-[10px] uppercase text-gray-500 font-semibold mb-2 tracking-wider flex items-center gap-2">
              <Users className="w-3 h-3" /> Modelos
              {modelosSeleccionadas.length > 0 && (
                <Badge className="text-[10px] border-none" style={{ background: COLOR_PRIMARY, color: 'black' }}>
                  {modelosSeleccionadas.length} seleccionada{modelosSeleccionadas.length > 1 ? 's' : ''}
                </Badge>
              )}
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-44 overflow-y-auto pr-1">
              {modelosActivos.map(m => {
                const sel = modelosSeleccionadas.includes(m.email);
                return (
                  <button
                    key={m.id}
                    onClick={() => toggleModelo(m.email)}
                    className={`flex items-center gap-2 p-2 rounded-lg border text-left transition-all ${sel ? 'border-primary/70 bg-primary/10' : 'border-white/10 bg-white/[0.02] hover:bg-white/5'}`}
                  >
                    <img src={m.fotoPerfil} alt="" className={`w-8 h-8 rounded-full object-cover flex-shrink-0 ${sel ? 'ring-2 ring-primary' : ''}`} loading="lazy" width={32} height={32} />
                    <span className="text-xs font-medium truncate text-white">{m.nombreArtistico || m.nombre}</span>
                    {sel && <CheckCircle className="w-3 h-3 text-primary flex-shrink-0 ml-auto" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Ubicación */}
          <div>
            <p className="text-[10px] uppercase text-gray-500 font-semibold mb-2 tracking-wider flex items-center gap-2">
              <MapPin className="w-3 h-3" /> Ubicación
            </p>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs text-gray-400 block mb-1">Tipo</label>
                <select className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-primary" value={form.ubicacionTipo} onChange={e => set('ubicacionTipo', e.target.value)}>
                  {['Sede', 'Domicilio', 'Venue externo'].map(u => <option key={u} value={u}>{u}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-400 block mb-1">Ciudad</label>
                <input className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-primary" value={form.ciudad} onChange={e => set('ciudad', e.target.value)} placeholder="Ciudad" />
              </div>
            </div>
            {form.ubicacionTipo !== 'Sede' && (
              <input className="mt-2 w-full bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-primary" value={form.direccion} onChange={e => set('direccion', e.target.value)} placeholder="Dirección completa" />
            )}
          </div>

          {/* Fecha y Hora */}
          <div>
            <p className="text-[10px] uppercase text-gray-500 font-semibold mb-2 tracking-wider">Fecha y Hora</p>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="text-xs text-gray-400 block mb-1">Fecha *</label>
                <input type="date" className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-primary" value={form.fecha} onChange={e => set('fecha', e.target.value)} />
              </div>
              <div>
                <label className="text-xs text-gray-400 block mb-1">Hora inicio</label>
                <input type="time" className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-primary" value={form.horaInicio} onChange={e => set('horaInicio', e.target.value)} />
              </div>
              <div>
                <label className="text-xs text-gray-400 block mb-1">Hora fin</label>
                <input type="time" className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-primary" value={form.horaFin} onChange={e => set('horaFin', e.target.value)} />
              </div>
            </div>
            {costos.durMinutos > 0 && (
              <p className="text-xs text-gray-500 mt-1">
                Duración: {Math.floor(costos.durMinutos / 60)}h {costos.durMinutos % 60 > 0 ? `${costos.durMinutos % 60}m` : ''}
              </p>
            )}
          </div>

          {/* Resumen de costos */}
          {modelosSeleccionadas.length > 0 && costos.durMinutos > 0 && (
            <div className="rounded-lg border border-primary/30 bg-primary/5 p-4">
              <p className="text-[10px] uppercase font-semibold mb-3 tracking-wider" style={{ color: COLOR_PRIMARY }}>Resumen del Costo</p>
              <div className="space-y-1.5 text-sm">
                <div className="flex justify-between text-gray-400">
                  <span>Modelos ({modelosSeleccionadas.length}) × {costos.durHoras.toFixed(1)}h</span>
                  <span>${costos.costoModelos.toLocaleString('es-CO', { maximumFractionDigits: 0 })}</span>
                </div>
                <div className="flex justify-between text-gray-500 border-t border-white/5 pt-1.5 mt-1.5">
                  <span>Subtotal</span>
                  <span>${costos.subtotal.toLocaleString('es-CO', { maximumFractionDigits: 0 })}</span>
                </div>
                <div className="flex justify-between text-gray-500">
                  <span>IVA (19%)</span>
                  <span>${costos.iva.toLocaleString('es-CO', { maximumFractionDigits: 0 })}</span>
                </div>
                <div className="flex justify-between font-bold text-base border-t border-white/10 pt-2 mt-1" style={{ color: COLOR_PRIMARY }}>
                  <span>TOTAL</span>
                  <span>${costos.total.toLocaleString('es-CO', { maximumFractionDigits: 0 })}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/10 flex gap-2">
          <Button variant="outline" className="flex-1 border-white/10 text-gray-400 hover:bg-white/5" onClick={onClose}>Cancelar</Button>
          <Button className="flex-1 text-black font-semibold" style={{ background: COLOR_PRIMARY }} disabled={guardando} onClick={guardar}>
            {guardando ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-2" /> : <Star className="w-3.5 h-3.5 mr-2" />}
            Guardar Evento
          </Button>
        </div>
      </div>
    </div>
  );
}

// ── Componente principal ──────────────────────────────────────────────────────

export function AgendamientosPanel({ rol, userEmail = '', modeloEmail }: AgendamientosPanelProps) {
  const {
    agendamientos,
    aprobarAgendamiento,
    rechazarAgendamiento,
    cancelarAgendamiento,
    marcarComoCompletado,
    marcarComoNoShow,
    recargarAgendamientos,
    getAgendamientosPendientesAprobacion,
  } = useAgendamientos();

  const [filtroEstado, setFiltroEstado] = useState<string>('todos');
  const [filtroVista, setFiltroVista]   = useState<'todos' | 'pendientes'>('todos');
  const [cargando, setCargando]         = useState(false);
  const [paginaHistorial, setPaginaHistorial] = useState(1);
  const [mostrarNuevoAgendamiento, setMostrarNuevoAgendamiento] = useState(false);
  const [mostrarCrearEvento, setMostrarCrearEvento] = useState(false);

  // Archivar / Eliminar / Selección múltiple
  const [mostrarArchivados, setMostrarArchivados] = useState(false);
  const [archivados, setArchivados] = useState<any[]>([]);
  const [cargandoArchivados, setCargandoArchivados] = useState(false);
  const [modalArchivado, setModalArchivado] = useState<Agendamiento | null>(null);
  const [modalEliminacion, setModalEliminacion] = useState<{ag: Agendamiento, tieneRelacionados: boolean} | null>(null);
  const [seleccionados, setSeleccionados] = useState<string[]>([]);

  const esAdmin = rol === 'admin' || rol === 'owner';

  // Cargar archivados cuando se activa el toggle
  useEffect(() => {
    if (!mostrarArchivados || !esAdmin) return;
    const cargar = async () => {
      setCargandoArchivados(true);
      const { data } = await supabase
        .from('agendamientos')
        .select('*')
        .eq('archivado', true)
        .order('fecha_archivado', { ascending: false })
        .limit(100);
      setArchivados(data || []);
      setCargandoArchivados(false);
    };
    cargar();
  }, [mostrarArchivados]);

  // ── Handlers archivar / eliminar / restaurar ──────────────────────────────────
  const ejecutarArchivado = async () => {
    if (!modalArchivado) return;
    const { error } = await supabase
      .from('agendamientos')
      .update({
        archivado: true,
        archivado_por: userEmail,
        fecha_archivado: new Date().toISOString(),
      })
      .eq('id', modalArchivado.id);
    if (error) { toast.error('Error al archivar'); return; }
    toast.success('Agendamiento archivado');
    setModalArchivado(null);
    await recargarAgendamientos();
  };

  const handleConfirmarEliminar = async (ag: Agendamiento) => {
    // Verificar si tiene relacionados
    const [ {count: notifs}, {count: multas}, {count: pagos} ] = await Promise.all([
      supabase.from('notificaciones').select('id', { count: 'exact', head: true }).or(`agendamiento_id.eq.${ag.id},referencia_id.eq.${ag.id}`),
      supabase.from('multas').select('id', { count: 'exact', head: true }).eq('agendamiento_id', ag.id),
      supabase.from('pagos').select('id', { count: 'exact', head: true }).eq('agendamiento_id', ag.id)
    ]);
    const tieneRelacionados = (notifs || 0) > 0 || (multas || 0) > 0 || (pagos || 0) > 0;
    setModalEliminacion({ ag, tieneRelacionados });
  };

  const eliminarAgendamientoCompleto = async () => {
    if (!modalEliminacion) return;
    const id = modalEliminacion.ag.id;
    try {
      const ahora = new Date().toISOString();

      // PASO 1 — Soft delete notificaciones por agendamiento_id
      const { error: errNoti1 } = await supabase
        .from('notificaciones')
        .update({ eliminado: true })
        .eq('agendamiento_id', id);
      if (errNoti1) console.warn('⚠️ notificaciones(agendamiento_id):', errNoti1.message);

      // PASO 1b — Soft delete notificaciones por referencia_id
      const { error: errNoti2 } = await supabase
        .from('notificaciones')
        .update({ eliminado: true })
        .eq('referencia_id', id);
      if (errNoti2) console.warn('⚠️ notificaciones(referencia_id):', errNoti2.message);

      // PASO 2 — Soft delete multas
      const { error: errMultas } = await supabase
        .from('multas')
        .update({ eliminado: true })
        .eq('agendamiento_id', id);
      if (errMultas) console.warn('⚠️ multas:', errMultas.message);

      // PASO 3 — Soft delete pagos
      const { error: errPagos } = await supabase
        .from('pagos')
        .update({ eliminado: true, eliminado_en: ahora })
        .eq('agendamiento_id', id);
      if (errPagos) console.warn('⚠️ pagos:', errPagos.message);

      // PASO 4 — Soft delete el agendamiento
      const { error } = await supabase
        .from('agendamientos')
        .update({ eliminado: true, eliminado_en: ahora })
        .eq('id', id);

      if (error) {
        console.error('❌ agendamiento delete error:', error.code, error.message);
        throw error;
      }

      // PASO 5 — Actualizar estado local
      setModalEliminacion(null);
      if (mostrarArchivados) {
        setArchivados(prev => prev.filter(a => a.id !== id));
      } else {
        await recargarAgendamientos();
      }

      toast.success('Agendamiento eliminado correctamente');

    } catch (error) {
      console.error('Error eliminando agendamiento:', error);
      toast.error('Error al eliminar el agendamiento');
    }
  };

  const restaurarAgendamiento = async (ag: any) => {
    const { error } = await supabase
      .from('agendamientos')
      .update({ archivado: false, archivado_por: null, fecha_archivado: null })
      .eq('id', ag.id);
    if (error) { toast.error('Error al restaurar'); return; }
    toast.success('Agendamiento restaurado');
    setArchivados(prev => prev.filter(a => a.id !== ag.id));
    await recargarAgendamientos();
  };

  const toggleSeleccionado = (id: string) => {
    setSeleccionados(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const archivarSeleccionados = async () => {
    if (!seleccionados.length) return;
    await supabase
      .from('agendamientos')
      .update({ archivado: true, archivado_por: userEmail, fecha_archivado: new Date().toISOString() })
      .in('id', seleccionados);
    toast.success(`${seleccionados.length} agendamiento(s) archivados`);
    setSeleccionados([]);
    await recargarAgendamientos();
  };

  const eliminarSeleccionados = async () => {
    if (!seleccionados.length) return;
    const ahora = new Date().toISOString();
    try {
      await supabase.from('notificaciones').update({ eliminado: true }).in('agendamiento_id', seleccionados);
      await supabase.from('notificaciones').update({ eliminado: true }).in('referencia_id', seleccionados);
      await supabase.from('multas').update({ eliminado: true }).in('agendamiento_id', seleccionados);
      await supabase.from('pagos').update({ eliminado: true, eliminado_en: ahora }).in('agendamiento_id', seleccionados);

      const { error } = await supabase
        .from('agendamientos')
        .update({ eliminado: true, eliminado_en: ahora })
        .in('id', seleccionados);
      if (error) throw error;

      toast.success(`${seleccionados.length} agendamiento(s) eliminados`);
      setSeleccionados([]);
      await recargarAgendamientos();
    } catch (error) {
      console.error('Error al eliminar seleccionados:', error);
      toast.error('Error al eliminar agendamientos');
    }
  };

  // ── Selección y Ordenamiento ─────────────────────────────────────
  let rawList = [...agendamientos].filter(a => !(a as any).archivado);
  
  if (rol === 'modelo' && modeloEmail) {
    rawList = rawList.filter(a => a.modeloEmail === modeloEmail);
  }
  
  if (filtroVista === 'pendientes') {
    rawList = rawList.filter(a => a.estado === 'pendiente');
  }

  if (filtroEstado !== 'todos') {
    rawList = rawList.filter(a => a.estado === filtroEstado);
  }

  // Ordenamiento defensivo ASC
  rawList.sort((a, b) => {
    const msA = new Date(a.fecha + 'T' + (a.hora || '00:00')).getTime();
    const msB = new Date(b.fecha + 'T' + (b.hora || '00:00')).getTime();
    return msA - msB;
  });

  const hoyISO = new Date().toISOString().split('T')[0];

  // Separar en 3 secciones
  const hoyList = rawList.filter(a => a.fecha === hoyISO);
  const proximosList = rawList.filter(a => a.fecha > hoyISO);
  
  // Historial ordenado DESC
  const historialList = rawList.filter(a => a.fecha < hoyISO).sort((a, b) => {
    const msA = new Date(a.fecha + 'T' + (a.hora || '00:00')).getTime();
    const msB = new Date(b.fecha + 'T' + (b.hora || '00:00')).getTime();
    return msB - msA;
  });

  const historialPaginado = historialList.slice((paginaHistorial - 1) * 10, paginaHistorial * 10);
  const totalPaginasHistorial = Math.ceil(historialList.length / 10);

  // Agrupar 'Próximos'
  const proximosAgrupados = proximosList.reduce((acc, ag) => {
    if (!acc[ag.fecha]) acc[ag.fecha] = [];
    acc[ag.fecha].push(ag);
    return acc;
  }, {} as Record<string, Agendamiento[]>);


  // ── Handlers ─────────────────────────────────────────────────────────────────
  const handleAprobar = async (id: string) => {
    try {
      await aprobarAgendamiento(id, userEmail || 'staff');
      toast.success('Agendamiento aprobado');
    } catch { toast.error('Error al aprobar'); }
  };

  const handleRechazar = async (id: string) => {
    try {
      await rechazarAgendamiento(id, 'Rechazado por staff', userEmail || 'staff');
      toast.success('Agendamiento rechazado');
    } catch { toast.error('Error al rechazar'); }
  };

  const handleCompletar = async (id: string) => {
    try {
      await marcarComoCompletado(id);
      toast.success('Marcado como completado');
    } catch { toast.error('Error al completar'); }
  };

  const handleNoShow = async (id: string) => {
    try {
      await marcarComoNoShow(id, 'Cliente no se presentó', userEmail || 'staff');
      toast.success('Marcado como No Show');
    } catch { toast.error('Error'); }
  };

  const handleCancelar = async (id: string) => {
    try {
      await cancelarAgendamiento(id, 'Cancelado por staff', userEmail || 'staff');
      toast.success('Agendamiento cancelado');
    } catch { toast.error('Error al cancelar'); }
  };

  const handleRecargar = async () => {
    setCargando(true);
    await recargarAgendamientos();
    setCargando(false);
  };

  const pendientesAprobacion = getAgendamientosPendientesAprobacion().length;

  // ── Render ────────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Header con controles */}
      <Card className="border-white/10 bg-black/20">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <CardTitle className="flex items-center gap-2 text-base" style={{ color: COLOR_PRIMARY }}>
                <Calendar className="w-4 h-4" />
                Agendamientos
                {pendientesAprobacion > 0 && rol !== 'modelo' && (
                  <Badge className="ml-1 bg-amber-500 text-black text-[10px] border-none">
                    {pendientesAprobacion} pendientes
                  </Badge>
                )}
              </CardTitle>
              <CardDescription className="text-xs mt-0.5">
                {rawList.length} registro{rawList.length !== 1 ? 's' : ''} encontrado{rawList.length !== 1 ? 's' : ''}
              </CardDescription>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {/* Botones crear — solo admin/owner */}
              {esAdmin && (
                <>
                  <Button
                    size="sm"
                    className="h-8 px-3 text-xs bg-blue-600 hover:bg-blue-700 text-white border-none"
                    onClick={() => setMostrarNuevoAgendamiento(true)}
                  >
                    <Plus className="w-3 h-3 mr-1" />Nuevo Agendamiento
                  </Button>
                  <Button
                    size="sm"
                    className="h-8 px-3 text-xs text-black font-semibold border-none"
                    style={{ background: COLOR_PRIMARY }}
                    onClick={() => setMostrarCrearEvento(true)}
                  >
                    <Star className="w-3 h-3 mr-1" />Crear Evento
                  </Button>
                </>
              )}

              {/* Vista (no para modelo) */}
              {rol !== 'modelo' && (
                <Select value={filtroVista} onValueChange={(v) => setFiltroVista(v as any)}>
                  <SelectTrigger className="h-8 text-xs w-36 bg-black/30 border-white/10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Vista General</SelectItem>
                    <SelectItem value="pendientes">
                      Pendientes aprobación
                      {pendientesAprobacion > 0 && ` (${pendientesAprobacion})`}
                    </SelectItem>
                  </SelectContent>
                </Select>
              )}

              {/* Filtro estado */}
              <Select value={filtroEstado} onValueChange={setFiltroEstado}>
                <SelectTrigger className="h-8 text-xs w-32 bg-black/30 border-white/10">
                  <Filter className="w-3 h-3 mr-1" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="pendiente">Pendiente</SelectItem>
                  <SelectItem value="confirmado">Confirmado</SelectItem>
                  <SelectItem value="aprobado">Aprobado</SelectItem>
                  <SelectItem value="completado">Completado</SelectItem>
                  <SelectItem value="cancelado">Cancelado</SelectItem>
                  <SelectItem value="no_show">No Show</SelectItem>
                </SelectContent>
              </Select>

              {/* Toggle archivados — solo admin/owner */}
              {esAdmin && (
                <Button
                  size="sm"
                  onClick={() => { setMostrarArchivados(v => !v); setSeleccionados([]); }}
                  className={`h-8 px-3 text-xs border ${mostrarArchivados
                    ? 'bg-amber-500/15 border-amber-500/40 text-amber-400'
                    : 'bg-transparent border-white/10 text-gray-400 hover:bg-white/5'
                  }`}
                >
                  <Archive className="w-3 h-3 mr-1" />
                  {mostrarArchivados ? 'Ver activos' : 'Ver archivados'}
                </Button>
              )}

              <Button size="sm" variant="ghost" onClick={handleRecargar} disabled={cargando}
                className="h-8 w-8 p-0 border border-white/10 hover:bg-white/5">
                <RefreshCw className={`w-3.5 h-3.5 ${cargando ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Barra de selección múltiple */}
      {seleccionados.length > 0 && (
        <div className="sticky top-0 z-10 flex items-center gap-3 px-4 py-2.5 bg-[#111] border border-amber-500/20 rounded-lg">
          <span className="text-xs text-amber-400 font-medium">{seleccionados.length} seleccionado(s)</span>
          <Button size="sm" onClick={archivarSeleccionados}
            className="h-7 px-2 text-xs bg-amber-500/10 text-amber-400 border border-amber-500/20 hover:bg-amber-500/20">
            <Archive className="w-3 h-3 mr-1" />Archivar todos
          </Button>
          {rol === 'admin' && (
            <Button size="sm" onClick={eliminarSeleccionados}
              className="h-7 px-2 text-xs bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20">
              <Trash2 className="w-3 h-3 mr-1" />Eliminar todos
            </Button>
          )}
          <button onClick={() => setSeleccionados([])}
            className="ml-auto text-xs text-white/40 hover:text-white/70">
            Cancelar
          </button>
        </div>
      )}

      {/* VISTA ARCHIVADOS */}
      {mostrarArchivados && (
        <Card className="border-amber-500/20 bg-amber-500/5">
          <CardHeader className="pb-3 pt-4 px-4 border-b border-amber-500/10">
            <CardTitle className="text-sm font-semibold flex items-center justify-between text-amber-400">
              <div className="flex items-center gap-2">
                <Archive className="w-4 h-4" />
                Archivados
              </div>
              <span className="text-xs font-normal text-amber-400/60">{archivados.length} registro(s)</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            {cargandoArchivados ? (
              <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-amber-400" /></div>
            ) : archivados.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Archive className="w-8 h-8 mx-auto mb-2 opacity-20" />
                <p className="text-sm">No hay agendamientos archivados</p>
              </div>
            ) : (
              <div className="space-y-2">
                {archivados.map(ag => {
                  const agNorm: Agendamiento = {
                    id: ag.id,
                    clienteId: ag.cliente_id || '',
                    clienteNombre: ag.cliente_nombre || ag.clienteNombre || '',
                    clienteTelefono: ag.cliente_telefono || ag.clienteTelefono || '',
                    modeloEmail: ag.modelo_email || ag.modeloEmail || '',
                    modeloNombre: ag.modelo_nombre || ag.modeloNombre || '',
                    tipoServicio: ag.servicio_tipo || ag.tipoServicio || '',
                    fecha: ag.fecha_servicio || ag.fecha || '',
                    hora: ag.hora_inicio || ag.hora || '',
                    duracionMinutos: ag.duracion_minutos || ag.duracionMinutos || 0,
                    montoPago: ag.precio || ag.montoPago || 0,
                    estadoPago: ag.estado_pago || ag.estadoPago || 'pendiente',
                    estado: ag.estado || 'cancelado',
                    archivado: true,
                  } as any;
                  return (
                    <div key={ag.id} className="opacity-80">
                      <AgendamientoRow ag={agNorm} rol={rol} userEmail={userEmail}
                        onAprobar={() => {}} onRechazar={() => {}} onCompletar={() => {}} onNoShow={() => {}} onCancelar={() => {}}
                        onRestaurar={restaurarAgendamiento}
                        onEliminar={handleConfirmarEliminar}
                      />
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {!mostrarArchivados && rawList.length === 0 ? (
        <Card className="border-white/10 bg-black/20">
          <CardContent className="pt-12 pb-12">
            <div className="text-center text-gray-500">
              <Calendar className="w-10 h-10 mx-auto mb-3 opacity-20" />
              <p className="text-sm">No hay agendamientos para mostrar</p>
            </div>
          </CardContent>
        </Card>
      ) : !mostrarArchivados && (
        <div className="space-y-6">
          
          {/* SECCIÓN HOY */}
          {hoyList.length > 0 && (
            <Card className="border-primary/20 bg-primary/5">
              <CardHeader className="pb-3 pt-4 px-4 bg-primary/10 rounded-t-lg">
                <CardTitle className="text-sm font-semibold flex items-center justify-between">
                  <div className="flex items-center gap-2 text-primary">
                    <Clock className="w-4 h-4" />
                    Hoy — <span className="capitalize">{formatearFecha(hoyISO)}</span>
                  </div>
                  <Badge className="bg-primary/20 text-primary border-none">
                    {hoyList.length}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-2">
                {hoyList.map(ag => (
                  <AgendamientoRow key={ag.id} ag={ag} rol={rol} userEmail={userEmail}
                    onAprobar={handleAprobar} onRechazar={handleRechazar} onCompletar={handleCompletar} onNoShow={handleNoShow} onCancelar={handleCancelar}
                    onArchivar={setModalArchivado} onEliminar={handleConfirmarEliminar}
                    seleccionado={seleccionados.includes(ag.id)} onToggleSelect={toggleSeleccionado}
                  />
                ))}
              </CardContent>
            </Card>
          )}

          {/* SECCIÓN PRÓXIMOS */}
          {proximosList.length > 0 && (
            <Card className="border-white/10 bg-black/20">
              <CardHeader className="pb-3 pt-4 px-4 border-b border-white/5">
                <CardTitle className="text-sm font-semibold flex items-center justify-between text-white">
                  <span>Próximos</span>
                  <Badge className="bg-white/10 text-gray-300 border-none">
                    {proximosList.length}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-6">
                {Object.entries(proximosAgrupados).map(([fecha, ags]) => (
                  <div key={fecha} className="space-y-2">
                    <h4 className="text-xs font-semibold text-primary uppercase tracking-wider mb-2 flex items-center gap-2">
                      <Calendar className="w-3 h-3" />
                      <span className="capitalize">{formatearFecha(fecha)}</span>
                    </h4>
                    <div className="pl-2 border-l border-white/5 space-y-2 relative before:absolute before:left-[-1px] before:top-4 before:bottom-4 before:w-[2px] before:bg-white/5">
                      {ags.map(ag => (
                        <AgendamientoRow key={ag.id} ag={ag} rol={rol} userEmail={userEmail}
                          onAprobar={handleAprobar} onRechazar={handleRechazar} onCompletar={handleCompletar} onNoShow={handleNoShow} onCancelar={handleCancelar}
                          onArchivar={setModalArchivado} onEliminar={handleConfirmarEliminar}
                          seleccionado={seleccionados.includes(ag.id)} onToggleSelect={toggleSeleccionado}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* SECCIÓN HISTORIAL */}
          {historialList.length > 0 && (
            <Card className="border-white/10 bg-black/20">
              <CardHeader className="pb-3 pt-4 px-4 border-b border-white/5">
                <CardTitle className="text-sm font-semibold flex items-center justify-between text-gray-400">
                  <span>Historial</span>
                  <Badge className="bg-white/5 text-gray-500 border-none">
                    {historialList.length}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-2">
                {historialPaginado.map(ag => (
                  <div key={ag.id} className="opacity-80 grayscale-[30%]">
                    <AgendamientoRow ag={ag} rol={rol} userEmail={userEmail}
                      onAprobar={handleAprobar} onRechazar={handleRechazar} onCompletar={handleCompletar} onNoShow={handleNoShow} onCancelar={handleCancelar}
                        onArchivar={setModalArchivado} onEliminar={handleConfirmarEliminar}
                      seleccionado={seleccionados.includes(ag.id)} onToggleSelect={toggleSeleccionado}
                    />
                  </div>
                ))}

                {/* PAGINACIÓN HISTORIAL */}
                {totalPaginasHistorial > 1 && (
                  <div className="flex items-center justify-between pt-4 mt-4 border-t border-white/5">
                    <Button 
                      variant="outline" 
                      onClick={() => setPaginaHistorial(p => Math.max(1, p - 1))}
                      disabled={paginaHistorial === 1}
                      className="h-8 text-xs bg-black/30 border-white/10"
                    >
                      Anterior
                    </Button>
                    <span className="text-xs text-gray-500">
                      Página {paginaHistorial} de {totalPaginasHistorial}
                    </span>
                    <Button 
                      variant="outline" 
                      onClick={() => setPaginaHistorial(p => Math.min(totalPaginasHistorial, p + 1))}
                      disabled={paginaHistorial === totalPaginasHistorial}
                      className="h-8 text-xs bg-black/30 border-white/10"
                    >
                      Siguiente
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

        </div>
      )}

      {/* Modal: Confirmar Archivar */}
      {modalArchivado && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#111] border border-white/10 rounded-xl p-6 max-w-sm w-full">
            <div className="text-3xl text-center mb-3">📦</div>
            <h3 className="text-center font-semibold text-white mb-1">¿Archivar agendamiento?</h3>
            <p className="text-center text-sm text-gray-400 mb-1">
              {modalArchivado.clienteNombre} — {formatearFecha(modalArchivado.fecha)}
            </p>
            <p className="text-center text-xs text-gray-500 mb-5">
              Se moverá a Archivados y podrás recuperarlo cuando quieras.
            </p>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1 border-white/10 text-gray-400" onClick={() => setModalArchivado(null)}>Cancelar</Button>
              <Button className="flex-1 bg-amber-500 hover:bg-amber-400 text-black font-semibold" onClick={ejecutarArchivado}>Sí, archivar</Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Confirmar Eliminar Inteligente */}
      {modalEliminacion && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#111] border border-red-500/20 rounded-xl p-6 max-w-sm w-full">
            <div className="flex justify-center mb-4"><AlertCircle className="w-12 h-12 text-red-500" /></div>
            <h3 className="text-center font-bold text-red-500 text-lg mb-4">⚠️ Eliminar agendamiento</h3>
            
            <div className="bg-white/5 rounded-lg p-3 mb-4 space-y-1.5 text-sm border border-white/10">
              <div className="flex gap-2 text-gray-300">
                <span className="font-semibold w-16 text-gray-400">Cliente:</span> 
                <span className="truncate">{(modalEliminacion.ag as any).clienteNombre || (modalEliminacion.ag as any).cliente_nombre || '—'}</span>
              </div>
              <div className="flex gap-2 text-gray-300">
                <span className="font-semibold w-16 text-gray-400">Modelo:</span> 
                <span className="truncate">{(modalEliminacion.ag as any).modeloNombre || (modalEliminacion.ag as any).modelo_nombre || '—'}</span>
              </div>
              <div className="flex gap-2 text-gray-300">
                <span className="font-semibold w-16 text-gray-400">Fecha:</span> 
                <span>{formatearFecha((modalEliminacion.ag as any).fecha || (modalEliminacion.ag as any).fecha_servicio)}</span>
              </div>
              <div className="flex gap-2 text-gray-300">
                <span className="font-semibold w-16 text-gray-400">Estado:</span> 
                <span className="capitalize">{modalEliminacion.ag.estado}</span>
              </div>
            </div>

            {modalEliminacion.tieneRelacionados && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 mb-4">
                <p className="text-xs text-red-400 font-bold mb-2">Se eliminarán también:</p>
                <ul className="text-xs text-red-400/80 list-disc pl-4 space-y-1">
                  <li>Pagos asociados</li>
                  <li>Multas asociadas</li>
                  <li>Notificaciones asociadas</li>
                </ul>
              </div>
            )}

            <p className="text-center text-xs font-semibold text-red-500/90 mb-5">
              ⚠️ Esta acción no se puede deshacer.
            </p>

            <div className="flex gap-2">
              <Button 
                variant="outline" 
                className="flex-1 border-gray-600 text-gray-300 hover:bg-gray-800" 
                onClick={() => setModalEliminacion(null)}
              >
                Cancelar
              </Button>
              <Button 
                className="flex-[1.5] bg-[#dc2626] hover:bg-[#b91c1c] text-white font-bold" 
                onClick={eliminarAgendamientoCompleto}
              >
                🗑️ Eliminar todo
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modales */}
      {mostrarNuevoAgendamiento && (
        <NuevoAgendamientoModal
          onClose={() => setMostrarNuevoAgendamiento(false)}
          userEmail={userEmail}
          onCreado={handleRecargar}
        />
      )}
      {mostrarCrearEvento && (
        <CrearEventoModal
          userEmail={userEmail}
          onClose={() => setMostrarCrearEvento(false)}
          onCreado={handleRecargar}
        />
      )}
    </div>
  );
}
