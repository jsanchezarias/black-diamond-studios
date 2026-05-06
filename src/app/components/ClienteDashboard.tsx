import { useState, useEffect, useCallback } from 'react';
import { ClienteNavbar } from './ClienteNavbar';
import { useAgendamientos } from './AgendamientosContext';
import { useModelos } from './ModelosContext';
import { ClienteAgendarModal } from './ClienteAgendarModal';
import { supabase } from '../../utils/supabase/info';
import { toast } from 'sonner';
import { Calendar, Sparkles, Lock, Mail, Phone, Loader2, Star, ArrowRight } from 'lucide-react';

// ─── Props ────────────────────────────────────────────────────────────────────
interface ClienteDashboardProps {
  accessToken: string;
  userId: string;
  userEmail: string;
  onLogout: () => void;
}

type Tab = 'explorar' | 'mis-citas' | 'perfil';

// ─── Paleta de colores ────────────────────────────────────────────────────────
const C = {
  bg: '#0f1014',
  card: '#16181c',
  gold: '#c9a961',
  goldHover: '#d4b86a',
  goldSoft: 'rgba(201,169,97,0.1)',
  text: '#e8e6e3',
  muted: '#888',
  border: '#2a2a2a',
  borderGold: 'rgba(201,169,97,0.3)',
};

// ─── Configuración de estados ─────────────────────────────────────────────────
const ESTADO_CONFIG: Record<string, { label: string; bg: string; color: string; icon: string }> = {
  pendiente:            { label: 'Pendiente',  bg: 'rgba(234,179,8,0.12)',   color: '#eab308', icon: '⏳' },
  solicitud_cliente:    { label: 'Pendiente',  bg: 'rgba(234,179,8,0.12)',   color: '#eab308', icon: '⏳' },
  aceptado_programador: { label: 'Aceptada',   bg: 'rgba(34,197,94,0.12)',   color: '#22c55e', icon: '✅' },
  confirmado:           { label: 'Confirmada', bg: 'rgba(34,197,94,0.12)',   color: '#22c55e', icon: '✅' },
  aprobado:             { label: 'Aprobada',   bg: 'rgba(59,130,246,0.12)',  color: '#60a5fa', icon: '✅' },
  completado:           { label: 'Completada', bg: 'rgba(107,114,128,0.12)', color: '#9ca3af', icon: '☑️' },
  finalizado:           { label: 'Completada', bg: 'rgba(107,114,128,0.12)', color: '#9ca3af', icon: '☑️' },
  cancelado:            { label: 'Cancelada',  bg: 'rgba(239,68,68,0.12)',   color: '#ef4444', icon: '❌' },
  rechazado:            { label: 'Rechazada',  bg: 'rgba(239,68,68,0.12)',   color: '#ef4444', icon: '🚫' },
  no_show:              { label: 'No Show',    bg: 'rgba(239,68,68,0.12)',   color: '#ef4444', icon: '❌' },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatFecha(f: string) {
  if (!f) return '';
  try {
    const [y, m, d] = f.split('T')[0].split('-');
    return new Date(+y, +m - 1, +d).toLocaleDateString('es-CO', {
      weekday: 'long', day: 'numeric', month: 'long',
    });
  } catch { return f; }
}

function isLocked(fecha: string, hora: string): boolean {
  try {
    const [y, m, d] = fecha.split('-').map(Number);
    const [hh, mm] = (hora || '00:00').split(':').map(Number);
    const citaDate = new Date(y, m - 1, d, hh, mm);
    return (citaDate.getTime() - Date.now()) / (1000 * 60 * 60) <= 12;
  } catch { return false; }
}

// ─── Skeleton card ────────────────────────────────────────────────────────────
function SkeletonCard({ delay = 0 }: { delay?: number }) {
  return (
    <div 
      className="rounded-2xl overflow-hidden flex flex-col h-auto sm:h-[600px] w-full animate-pulse"
      style={{ 
        background: C.card, 
        border: `1px solid ${C.border}`,
        animationDelay: `${delay}s`
      }}
    >
      <div className="h-[240px] sm:h-[300px] md:h-[400px] bg-white/5" />
      <div className="p-5 flex-1 flex flex-col">
        <div className="h-4 w-3/4 bg-white/5 rounded mb-4" />
        <div className="flex flex-wrap gap-2 mb-8">
          <div className="h-5 w-16 bg-white/5 rounded-full" />
          <div className="h-5 w-20 bg-white/5 rounded-full" />
          <div className="h-5 w-14 bg-white/5 rounded-full" />
        </div>
        <div className="mt-auto pt-4 border-t border-white/5">
          <div className="h-8 w-1/2 bg-white/5 rounded mb-4" />
          <div className="h-12 w-full bg-white/5 rounded-xl" />
        </div>
      </div>
    </div>
  );
}

// ─── PremiumModelCard ─────────────────────────────────────────────────────────
interface PremiumModelCardProps {
  modelo: any;
  index: number;
  onAgendar: () => void;
}

function PremiumModelCard({ modelo, index, onAgendar }: PremiumModelCardProps) {
  const [hovered, setHovered] = useState(false);
  const [imgError, setImgError] = useState(false);
  const delay = `${index * 0.1}s`;

  const photoToShow = modelo.photo || (modelo.gallery && modelo.gallery[0]);
  
  const precios = (modelo.services || [])
    .map((s: any) => {
      if (!s.price) return 0;
      const cleanPrice = String(s.price).replace(/[^0-9]/g, '');
      return parseInt(cleanPrice) || 0;
    })
    .filter((p: number) => p > 0);
  
  const precioBase = precios.length > 0 
    ? Math.min(...precios).toLocaleString('es-CO') 
    : (modelo.services?.[0]?.price || null);

  return (
    <div
      className="rounded-2xl overflow-hidden flex flex-col w-full min-h-[600px] h-full group"
      style={{
        background: C.card,
        border: hovered ? `1px solid ${C.gold}` : `1px solid ${C.border}`,
        boxShadow: hovered ? '0 10px 30px rgba(0,0,0,0.5), 0 0 20px rgba(201,169,97,0.1)' : 'none',
        transition: 'all 0.4s cubic-bezier(0.165, 0.84, 0.44, 1)',
        animation: `bdFadeInUp 0.5s ease ${delay} both`,
        position: 'relative',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* 1. Foto Area - Responsiva */}
      <div className="relative h-[240px] sm:h-[300px] md:h-[400px] w-full overflow-hidden flex-none">
        {photoToShow && !imgError ? (
          <img
            src={photoToShow}
            alt={modelo.name}
            onError={() => setImgError(true)}
            className="w-full h-full object-cover"
            style={{
              transform: hovered ? 'scale(1.05)' : 'scale(1)',
              transition: 'transform 0.6s cubic-bezier(0.165, 0.84, 0.44, 1)',
            }}
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-3"
            style={{ background: 'linear-gradient(135deg, #1a1c20 0%, #0f1014 100%)' }}>
            <Sparkles className="w-8 h-8 opacity-20" style={{ color: C.gold }} />
            <span className="text-[10px] uppercase tracking-widest opacity-30" style={{ color: C.text }}>Sin Imagen</span>
          </div>
        )}

        {/* Gradiente sobre la foto para legibilidad del nombre */}
        <div className="absolute inset-0 pointer-events-none" style={{
          background: 'linear-gradient(to top, rgba(15,16,20,0.95) 0%, rgba(15,16,20,0.4) 30%, transparent 100%)',
        }} />

        {/* Nombre y Estado (Flotando sobre la foto) */}
        <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-5">
          <div className="flex items-end justify-between gap-3">
            <div className="flex-1 min-w-0">
              <h3 className="truncate" style={{
                fontFamily: "'Playfair Display', serif",
                fontSize: '1.25rem', fontWeight: 700,
                color: 'white', margin: 0, textShadow: '0 2px 10px rgba(0,0,0,0.8)',
              }}>
                {modelo.name}
              </h3>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-[10px] font-medium opacity-80" style={{ color: C.gold }}>
                  {modelo.location}
                </span>
                <span className="w-1 h-1 rounded-full bg-white/20" />
                <span className="text-[10px] font-medium opacity-80" style={{ color: 'white' }}>
                  {modelo.age} años
                </span>
              </div>
            </div>
            
            {modelo.available ? (
              <div className="flex items-center gap-1.5 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full text-[8px] sm:text-[9px] font-bold uppercase tracking-wider flex-shrink-0"
                style={{ background: 'rgba(34,197,94,0.15)', color: '#4ade80', border: '1px solid rgba(34,197,94,0.3)' }}>
                <span className="w-1.5 h-1.5 rounded-full bg-green-400 shadow-[0_0_8px_#4ade80]"
                  style={{ animation: 'bdPulse 2s infinite' }} />
                Libre
              </div>
            ) : (
              <div className="px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full text-[8px] sm:text-[9px] font-bold uppercase tracking-wider flex-shrink-0"
                style={{ background: 'rgba(255,255,255,0.05)', color: '#9ca3af', border: '1px solid rgba(255,255,255,0.1)' }}>
                Ocupada
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 2. Content Area */}
      <div className="p-4 sm:p-5 flex flex-col flex-1" style={{ background: 'rgba(255,255,255,0.01)' }}>
        {/* Sección de Tags (Especialidades/Servicios) - Scroll horizontal en móvil */}
        <div className="mb-4 relative">
          <div className="flex gap-1.5 overflow-x-auto scrollbar-hide pb-1 pr-8">
            {(modelo.services || []).length > 0 ? (
              (modelo.services || []).map((s: any, i: number) => (
                <span key={i} className="px-2.5 py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-wider transition-colors whitespace-nowrap flex-shrink-0"
                  style={{ 
                    background: 'rgba(201,169,97,0.1)', 
                    color: C.gold, 
                    border: '1px solid rgba(201,169,97,0.2)',
                  }}>
                  {s.name}
                </span>
              ))
            ) : (
              <span className="px-2 py-1 rounded-md text-[9px] font-semibold uppercase tracking-wider opacity-30" style={{ color: C.text }}>
                Servicios premium
              </span>
            )}
          </div>
          {/* Indicador de scroll sutil */}
          <div className="absolute right-0 top-0 bottom-1 w-8 bg-gradient-to-l from-[#16181c] to-transparent pointer-events-none sm:hidden" />
        </div>

        {/* Footer: Precio + Botón - SIEMPRE VISIBLE */}
        <div className="mt-auto pt-4 border-t border-white/5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex flex-col bg-white/10 p-2 px-3 rounded-xl border border-white/10 shadow-inner">
              <span className="text-[10px] uppercase tracking-[0.2em] font-black mb-1" style={{ color: C.gold }}>
                Desde
              </span>
              <div className="flex items-baseline gap-1">
                <span className="text-sm font-bold" style={{ color: C.gold }}>$</span>
                <span className="text-2xl font-black tracking-tighter" style={{ color: 'white' }}>
                  {precioBase || 'Ver tarifas'}
                </span>
                <span className="text-[10px] font-bold ml-1" style={{ color: C.gold }}>COP</span>
              </div>
            </div>
            
            <div className="flex flex-col items-end gap-1">
              <div className="flex items-center gap-1">
                <span className="text-sm font-black text-white">5.0</span>
                <Star className="w-4 h-4" style={{ fill: C.gold, color: C.gold }} />
              </div>
              <span className="text-[10px] uppercase tracking-widest font-bold text-white/40">Rating</span>
            </div>
          </div>

          <button
            onClick={onAgendar}
            className="w-full py-4 rounded-xl font-black text-[11px] uppercase tracking-[0.15em] transition-all duration-300 flex items-center justify-center gap-2 group/btn shadow-lg"
            style={{
              background: `linear-gradient(135deg, ${C.gold} 0%, #a07c3a 100%)`,
              color: '#0f1014',
              transform: hovered ? 'translateY(-2px)' : 'none',
              boxShadow: hovered ? `0 8px 25px rgba(201,169,97,0.4)` : '0 4px 15px rgba(0,0,0,0.3)',
            }}
          >
            ◆ Agendar Experiencia
            <ArrowRight className="w-4 h-4 transition-transform group-hover/btn:translate-x-1" />
          </button>
        </div>
      </div>
    </div>
  );
}

interface CitaCardProps {
  cita: any;
  cfg: { label: string; bg: string; color: string; icon: string };
  locked: boolean;
  esActiva: boolean;
  cancelando: boolean;
  confirmCancel: boolean;
  onModificar: () => void;
  onCancelar: () => void;
  onConfirmCancel: () => void;
  onAbortCancel: () => void;
}

function CitaCard({
  cita, cfg, locked, esActiva,
  cancelando, confirmCancel,
  onModificar, onCancelar, onConfirmCancel, onAbortCancel,
}: CitaCardProps) {
  return (
    <div
      className="rounded-2xl p-5 transition-all duration-200"
      style={{ background: C.card, border: `1px solid ${C.border}`, animation: 'bdFadeInUp 0.3s ease' }}
    >
      <div className="flex items-start gap-4">
        {/* Icono de cita */}
        <div className="w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: 'rgba(201,169,97,0.08)', border: `1px solid ${C.borderGold}` }}>
          <Calendar style={{ color: C.gold, width: 22, height: 22 }} />
        </div>

        {/* Información */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 flex-wrap">
            <h4 className="font-bold text-white truncate"
              style={{ fontFamily: "'Playfair Display', serif", fontSize: '1rem' }}>
              {cita.modeloNombre || cita.modelo_nombre || 'Modelo'}
            </h4>
            <span className="text-xs font-bold px-2.5 py-1 rounded-full flex-shrink-0 flex items-center gap-1"
              style={{ background: cfg.bg, color: cfg.color }}>
              {cfg.icon} {cfg.label}
            </span>
          </div>

          <div className="mt-2 space-y-1" style={{ fontSize: '0.8rem', color: C.muted }}>
            <div className="flex items-center gap-2">
              <span>📅</span>
              <span>{formatFecha(cita.fecha)} · {cita.hora || '--:--'}</span>
            </div>
            <div className="flex items-center gap-2">
              <span>💆</span>
              <span>{cita.tarifaNombre || cita.servicio || cita.tipoServicio || 'Servicio'}</span>
            </div>
            {(cita.montoPago > 0 || cita.monto_pago > 0) && (
              <div className="flex items-center gap-2">
                <span>💰</span>
                <span style={{ color: C.gold, fontWeight: 600 }}>
                  ${(cita.montoPago || cita.monto_pago || 0).toLocaleString('es-CO')} COP
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Acciones solo para citas activas */}
      {esActiva && (
        <div className="mt-4 pt-4" style={{ borderTop: `1px solid ${C.border}` }}>
          {confirmCancel ? (
            <div className="flex items-center gap-3">
              <p className="text-xs flex-1" style={{ color: '#ef4444' }}>
                ¿Confirmar cancelación?
              </p>
              <button
                onClick={onAbortCancel}
                className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all hover:opacity-80"
                style={{ border: `1px solid ${C.border}`, color: C.muted, background: 'transparent' }}
              >
                No
              </button>
              <button
                onClick={onConfirmCancel}
                disabled={cancelando}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all hover:opacity-80"
                style={{ background: 'rgba(239,68,68,0.15)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.3)' }}
              >
                {cancelando && <Loader2 className="w-3 h-3 animate-spin" />}
                Sí, cancelar
              </button>
            </div>
          ) : locked ? (
            <div className="flex items-center gap-2 text-xs p-3 rounded-xl"
              style={{ background: 'rgba(255,255,255,0.03)', color: C.muted, border: `1px solid ${C.border}` }}>
              <Lock style={{ width: 13, height: 13, flexShrink: 0 }} />
              <span>No modificable — faltan menos de 12 horas</span>
            </div>
          ) : (
            <div className="flex gap-2">
              <button
                onClick={onModificar}
                className="flex-1 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all hover:opacity-80 active:scale-95"
                style={{ border: `1px solid ${C.borderGold}`, color: C.gold, background: 'transparent' }}
              >
                ✏️ Modificar
              </button>
              <button
                onClick={onCancelar}
                className="flex-1 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all hover:opacity-80 active:scale-95"
                style={{ border: '1px solid rgba(239,68,68,0.3)', color: '#ef4444', background: 'transparent' }}
              >
                ❌ Cancelar
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── PerfilTab ────────────────────────────────────────────────────────────────
interface PerfilTabProps {
  userEmail: string;
  nombreMostrado: string;
  perfilCliente: any;
  misCitas: any[];
  citasActivas: any[];
}

function PerfilTab({ userEmail, nombreMostrado, perfilCliente, misCitas, citasActivas }: PerfilTabProps) {
  const nombre = perfilCliente?.nombre || nombreMostrado;
  const inicial = nombre[0]?.toUpperCase() || 'C';
  const telefono = perfilCliente?.telefono;
  const miembroDesde = perfilCliente?.created_at
    ? new Date(perfilCliente.created_at).toLocaleDateString('es-CO', { year: 'numeric', month: 'long' })
    : null;
  const citasCompletadas = misCitas.filter(a => ['completado', 'finalizado'].includes(a.estado)).length;

  return (
    <div className="max-w-lg mx-auto space-y-6" style={{ animation: 'bdFadeInUp 0.35s ease' }}>
      {/* Card perfil */}
      <div className="rounded-2xl p-8 text-center"
        style={{ background: C.card, border: `1px solid ${C.border}` }}>
        {/* Avatar con inicial */}
        <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4"
          style={{
            background: 'linear-gradient(135deg, rgba(201,169,97,0.18), rgba(201,169,97,0.05))',
            border: `2px solid ${C.borderGold}`,
          }}>
          <span style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: '2rem', fontWeight: 700, color: C.gold,
          }}>
            {inicial}
          </span>
        </div>

        <h3 style={{
          fontFamily: "'Playfair Display', serif",
          fontSize: '1.4rem', fontWeight: 700,
          color: C.text, margin: '0 0 6px',
        }}>
          {nombre}
        </h3>

        <div className="flex flex-col items-center gap-2 mt-4" style={{ color: C.muted, fontSize: '0.875rem' }}>
          <div className="flex items-center gap-2">
            <Mail style={{ width: 13, height: 13 }} />
            <span>{userEmail}</span>
          </div>
          {telefono && (
            <div className="flex items-center gap-2">
              <Phone style={{ width: 13, height: 13 }} />
              <span>{telefono}</span>
            </div>
          )}
        </div>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Total Citas', value: misCitas.length },
          { label: 'Completadas', value: citasCompletadas },
          { label: 'Pendientes', value: citasActivas.length },
        ].map(stat => (
          <div key={stat.label} className="rounded-xl p-4 text-center"
            style={{ background: C.card, border: `1px solid ${C.border}` }}>
            <div style={{
              fontSize: '1.6rem', fontWeight: 700, color: C.gold,
              fontFamily: "'Playfair Display', serif",
            }}>
              {stat.value}
            </div>
            <div style={{ fontSize: '0.7rem', color: C.muted, marginTop: 4, letterSpacing: '0.03em' }}>
              {stat.label}
            </div>
          </div>
        ))}
      </div>

      {miembroDesde && (
        <p className="text-center text-sm" style={{ color: C.muted }}>
          Miembro desde {miembroDesde}
        </p>
      )}
    </div>
  );
}

// ─── ClienteDashboard (componente principal) ──────────────────────────────────
export function ClienteDashboard({ userId, userEmail, onLogout }: ClienteDashboardProps) {
  const [activeTab, setActiveTab] = useState<Tab>('explorar');
  const [modalData, setModalData] = useState<{ modelo: any; modeloEmail: string } | null>(null);
  const [cancelando, setCancelando] = useState<string | null>(null);
  const [confirmCancel, setConfirmCancel] = useState<string | null>(null);
  const [perfilCliente, setPerfilCliente] = useState<any | null>(null);
  const [loadingPerfil, setLoadingPerfil] = useState(false);

  const { agendamientos = [] } = useAgendamientos() || {};
  const { modelos = [], loading: cargandoModelos = false } = (useModelos() || {}) as any;

  // ── Cargar perfil cuando el tab se activa ────────────────────────────────
  useEffect(() => {
    if (activeTab !== 'perfil' || !userId) return;
    setLoadingPerfil(true);
    supabase
      .from('clientes')
      .select('nombre, email, telefono, created_at, nombre_usuario')
      .or(`user_id.eq.${userId},email.eq.${userEmail}`)
      .maybeSingle()
      .then(({ data }) => {
        setPerfilCliente(data);
        setLoadingPerfil(false);
      });
  }, [activeTab, userId, userEmail]);

  // ── Mis citas ─────────────────────────────────────────────────────────────
  const misCitas = Array.isArray(agendamientos)
    ? agendamientos.filter((a: any) =>
        a?.cliente_id === userId ||
        a?.clienteId === userId ||
        a?.cliente_email === userEmail ||
        a?.clienteEmail === userEmail
      )
    : [];

  const citasActivas = misCitas.filter(a =>
    ['pendiente', 'solicitud_cliente', 'aceptado_programador', 'confirmado', 'aprobado'].includes(a?.estado)
  );

  const todasMisCitas = [...misCitas].sort((a, b) => {
    const fa = (a.fecha || '') + 'T' + (a.hora || '00:00');
    const fb = (b.fecha || '') + 'T' + (b.hora || '00:00');
    return fb.localeCompare(fa);
  });

  // ── Convertir modelo para tarjeta premium ────────────────────────────────
  const convertirModelo = (m: any) => ({
    id: String(m.id),
    name: m.nombreArtistico || m.nombre || 'Sin nombre',
    age: m.edad || 0,
    photo: m.fotoPerfil || '',
    gallery: [m.fotoPerfil, ...(m.fotosAdicionales || [])].filter(Boolean),
    rating: m.calificacion || 5.0,
    height: m.altura || '165 cm',
    measurements: m.medidas || '90-60-90',
    languages: m.idiomas || ['Español'],
    location: m.sede || 'Sede Norte',
    available: !!(m.activa && m.disponible),
    description: m.descripcion || 'Modelo profesional',
    services: m.serviciosDisponibles || m.services || m.servicios || [],
    specialties: m.especialidades || m.specialties || [],
    domicilio: m.domicilio !== undefined ? m.domicilio : true,
    _email: m.email,
  });

  const modelosActivos = Array.isArray(modelos)
    ? modelos.filter((m: any) => m?.activa).map(convertirModelo)
    : [];

  // ── Abrir modal ───────────────────────────────────────────────────────────
  const abrirModal = useCallback((modelConverted: any) => {
    const original = (modelos as any[]).find(m =>
      String(m.id) === String(modelConverted.id) || m.email === modelConverted._email
    );
    setModalData({
      modelo: modelConverted,
      modeloEmail: original?.email || modelConverted._email || '',
    });
  }, [modelos]);

  // ── Cancelar cita ─────────────────────────────────────────────────────────
  const cancelarCita = async (citaId: string) => {
    setCancelando(citaId);
    const { error } = await supabase
      .from('agendamientos')
      .update({
        estado: 'cancelado',
        motivo_cancelacion: 'Cancelado por el cliente',
        cancelado_por: userEmail,
        fecha_cancelacion: new Date().toISOString(),
      })
      .eq('id', citaId);

    if (error) {
      toast.error('No se pudo cancelar la cita');
    } else {
      toast.success('✦ Cita cancelada correctamente');
    }
    setCancelando(null);
    setConfirmCancel(null);
  };

  // ── Nombre para mostrar ───────────────────────────────────────────────────
  const nombreMostrado = (() => {
    try {
      const s = localStorage.getItem('blackDiamondUser');
      if (s) {
        const p = JSON.parse(s);
        return p.nombre || p.email?.split('@')[0] || userEmail.split('@')[0];
      }
    } catch { /* ignore */ }
    return userEmail.split('@')[0];
  })();

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen pb-20"
      style={{ background: C.bg, color: C.text, fontFamily: "'Inter', sans-serif" }}>

      {/* CSS keyframes inyectados inline para no depender de globals */}
      <style>{`
        @keyframes bdShimmer {
          0%   { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        @keyframes bdPulse {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.4; }
        }
        @keyframes bdFadeInUp {
          from { opacity: 0; transform: translateY(14px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>

      {/* ── Navbar ─────────────────────────────────────────────────────────── */}
      <ClienteNavbar
        currentUser={{ id: userId, nombre: nombreMostrado, email: userEmail }}
        onLogout={onLogout}
      />

      <main className="mx-auto px-4 sm:px-6" style={{ paddingTop: 80, maxWidth: 1200 }}>

        {/* ── Header del dashboard ────────────────────────────────────────── */}
        <div className="pt-8 pb-6">
          <p className="mb-1" style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: '0.7rem', letterSpacing: '0.22em',
            textTransform: 'uppercase', color: C.gold,
          }}>
            ◆ Black Diamond Studios
          </p>
          <h1 style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: 'clamp(1.6rem, 4vw, 2.4rem)',
            fontWeight: 700, color: C.text,
            lineHeight: 1.2, margin: '4px 0 6px',
          }}>
            Bienvenido,{' '}
            <em style={{ color: C.gold, fontStyle: 'italic' }}>{nombreMostrado}</em>
          </h1>
          <p style={{ color: C.muted, fontSize: '0.875rem', fontStyle: 'italic' }}>
            "Experiencias que marcan la diferencia"
          </p>
        </div>

        {/* ── Tabs ───────────────────────────────────────────────────────── */}
        <div className="flex gap-0 overflow-x-auto pb-0 mb-8"
          style={{ borderBottom: `1px solid ${C.border}` }}>
          {([
            { id: 'explorar',   label: 'Explorar',  icon: '✦',  badge: 0 },
            { id: 'mis-citas',  label: 'Mis Citas', icon: '📅', badge: citasActivas.length },
            { id: 'perfil',     label: 'Mi Perfil', icon: '👤', badge: 0 },
          ] as const).map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="relative flex items-center gap-2 px-5 py-3 text-sm font-medium whitespace-nowrap transition-all duration-200"
              style={{
                background: 'transparent',
                border: 'none',
                color: activeTab === tab.id ? C.gold : C.muted,
                cursor: 'pointer',
                fontFamily: "'Inter', sans-serif",
              }}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
              {tab.badge > 0 && (
                <span
                  className="flex items-center justify-center rounded-full"
                  style={{
                    background: '#ef4444', color: 'white',
                    width: 18, height: 18, fontSize: '0.6rem', fontWeight: 700,
                  }}
                >
                  {tab.badge}
                </span>
              )}
              {/* Línea activa */}
              {activeTab === tab.id && (
                <span
                  className="absolute bottom-0 left-0 right-0 rounded-t-full"
                  style={{ height: 2, background: C.gold }}
                />
              )}
            </button>
          ))}
        </div>

        {/* TAB: EXPLORAR */}
        {activeTab === 'explorar' && (
          <div style={{ animation: 'bdFadeInUp 0.3s ease' }}>
            <div className="mb-8">
              <h2 style={{
                fontFamily: "'Playfair Display', serif",
                fontSize: '1.75rem', fontWeight: 700,
                color: C.text, marginBottom: 4,
              }}>
                Nuestras Acompañantes
              </h2>
              <p style={{ color: C.muted, fontSize: '0.875rem' }}>
                Selecciona y agenda tu experiencia con nuestras profesionales
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {cargandoModelos ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <SkeletonCard key={i} />
                ))
              ) : modelosActivos.length === 0 ? (
                <div className="col-span-full text-center py-16">
                  <div style={{ fontSize: '2.5rem', marginBottom: 12, color: C.gold, opacity: 0.4 }}>◆</div>
                  <p style={{ color: C.muted }}>No hay acompañantes disponibles en este momento</p>
                </div>
              ) : (
                modelosActivos.map((modelo, idx) => (
                  <PremiumModelCard
                    key={modelo.id}
                    modelo={modelo}
                    index={idx}
                    onAgendar={() => abrirModal(modelo)}
                  />
                ))
              )}
            </div>
          </div>
        )}

        {/* TAB: MIS CITAS */}
        {activeTab === 'mis-citas' && (
          <div style={{ animation: 'bdFadeInUp 0.3s ease' }}>
            <div className="mb-8">
              <h2 style={{
                fontFamily: "'Playfair Display', serif",
                fontSize: '1.75rem', fontWeight: 700,
                color: C.text, marginBottom: 4,
              }}>
                Mis Citas
              </h2>
              <p style={{ color: C.muted, fontSize: '0.875rem' }}>
                Historial completo y próximos agendamientos
              </p>
            </div>

            {todasMisCitas.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="w-20 h-20 rounded-full flex items-center justify-center mb-6"
                  style={{ background: C.goldSoft, border: `1px solid ${C.borderGold}` }}>
                  <span style={{ fontSize: '2rem' }}>◆</span>
                </div>
                <h3 style={{
                  fontFamily: "'Playfair Display', serif",
                  fontSize: '1.25rem', color: C.text, marginBottom: 8,
                }}>
                  No tienes citas aún
                </h3>
                <p style={{ color: C.muted, fontSize: '0.875rem', marginBottom: 24 }}>
                  Explora nuestras acompañantes y agenda tu primera experiencia
                </p>
                <button
                  onClick={() => setActiveTab('explorar')}
                  className="px-6 py-3 rounded-xl font-semibold text-sm transition-all hover:scale-105 active:scale-95"
                  style={{
                    background: `linear-gradient(135deg, ${C.gold}, #a07c3a)`,
                    color: '#0f1014',
                  }}
                >
                  ◆ Explorar ahora
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {todasMisCitas.map(cita => {
                  const cfg = ESTADO_CONFIG[cita.estado] || {
                    label: cita.estado, bg: 'rgba(255,255,255,0.06)',
                    color: '#9ca3af', icon: '•',
                  };
                  const locked = isLocked(cita.fecha, cita.hora);
                  const esActiva = ['pendiente', 'solicitud_cliente', 'aceptado_programador', 'confirmado', 'aprobado'].includes(cita.estado);
                  const cAny = cita as any;
                  const modeloParaModal = modelosActivos.find(m =>
                    m._email === cAny.modeloEmail || m._email === cAny.modelo_email ||
                    m.name === (cAny.modeloNombre || cAny.modelo_nombre)
                  );

                  return (
                    <CitaCard
                      key={cita.id}
                      cita={cita}
                      cfg={cfg}
                      locked={locked}
                      esActiva={esActiva}
                      cancelando={cancelando === cita.id}
                      confirmCancel={confirmCancel === cita.id}
                      onModificar={() => {
                        if (modeloParaModal) abrirModal(modeloParaModal);
                        else toast.error('No se encontró la modelo para modificar la cita');
                      }}
                      onCancelar={() => setConfirmCancel(cita.id)}
                      onConfirmCancel={() => cancelarCita(cita.id)}
                      onAbortCancel={() => setConfirmCancel(null)}
                    />
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB: MI PERFIL */}
        {activeTab === 'perfil' && (
          <div style={{ animation: 'bdFadeInUp 0.3s ease' }}>
            <div className="mb-8">
              <h2 style={{
                fontFamily: "'Playfair Display', serif",
                fontSize: '1.75rem', fontWeight: 700,
                color: C.text, marginBottom: 4,
              }}>
                Mi Perfil
              </h2>
            </div>

            {loadingPerfil ? (
              <div className="flex justify-center py-16">
                <Loader2 className="w-8 h-8 animate-spin" style={{ color: C.gold }} />
              </div>
            ) : (
              <PerfilTab
                userEmail={userEmail}
                nombreMostrado={nombreMostrado}
                perfilCliente={perfilCliente}
                misCitas={misCitas}
                citasActivas={citasActivas}
              />
            )}
          </div>
        )}

      </main>

      {/* Modal de agendamiento */}
      {modalData && (
        <ClienteAgendarModal
          modelo={modalData.modelo}
          modeloEmail={modalData.modeloEmail}
          clienteId={userId}
          clienteEmail={userEmail}
          onClose={() => setModalData(null)}
          onSuccess={() => setModalData(null)}
        />
      )}
    </div>
  );
}
