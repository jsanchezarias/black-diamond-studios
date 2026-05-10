import { useState, useEffect, useCallback } from 'react';
import { ClienteNavbar } from './ClienteNavbar';
import { useAgendamientos } from './AgendamientosContext';
import { useModelos } from './ModelosContext';
import { ClienteAgendarModal } from './ClienteAgendarModal';
import { BDPremiumStream, BDWalletProvider } from './BDPremiumStream';
import { createClient } from '@supabase/supabase-js';
import { supabase, projectId, publicAnonKey } from '../../utils/supabase/info';
import { toast } from 'sonner';

// Cliente anónimo para consultas públicas de modelos.
// RLS solo permite anon ver modelos; el JWT de cliente autenticado
// usa el rol 'authenticated' que no tiene esa política SELECT.
const supabasePublic = createClient(
  `https://${projectId}.supabase.co`,
  publicAnonKey,
  { auth: { persistSession: false } }
);
import { Calendar, Sparkles, Lock, Mail, Phone, Loader2, Star, ArrowRight } from 'lucide-react';
import { ModeloCard } from './ModeloCard';

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
    <div className="
      rounded-xl overflow-hidden
      bg-[#16181c] animate-pulse
    ">
      <div className="h-[240px] bg-[#2a2a2a]"/>
      <div className="p-3 space-y-2">
        <div className="h-4 bg-[#2a2a2a] rounded w-3/4"/>
        <div className="h-4 bg-[#2a2a2a] rounded w-1/2"/>
        <div className="h-10 bg-[#2a2a2a] rounded"/>
      </div>
    </div>
  );
}

// Old ModeloCard removed to use shared ModeloCard

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
  const [modelos, setModelos] = useState<any[]>([]);
  const [cargandoModelos, setCargandoModelos] = useState(true);
  const [errorModelos, setErrorModelos] = useState<string | null>(null);

  const { agendamientos = [] } = useAgendamientos() || {};

  useEffect(() => {
    const cargarModelos = async () => {
      try {
        console.log('🔍 Cargando modelos...')
        
        const { data, error } = await supabasePublic
          .from('usuarios')
          .select(`
            id,
            nombre_artistico,
            estado,
            descripcion,
            foto_url,
            modelo_fotos!modelo_fotos_modelo_id_fkey (
              id, url, es_principal, orden
            ),
            servicios_modelo!servicios_modelo_modelo_id_fkey (
              id, nombre,
              precio_sede, precio_domicilio,
              activo
            )
          `)
          .eq('role', 'modelo')
          .eq('estado', 'activo')
          .order('nombre_artistico')

        console.log('📊 Modelos:', { 
          total: data?.length, 
          error 
        })

        if (error) {
          console.error('❌ Error RLS:', error)
          setErrorModelos(error.message)
          return
        }

        setModelos(data || [])

      } catch (err: any) {
        console.error('❌ Error:', err)
        setErrorModelos(err.message)
      } finally {
        setCargandoModelos(false)
      }
    }

    cargarModelos()
  }, [])

  // ── Cargar perfil (y balance de diamantes) ────────────────────────────────
  useEffect(() => {
    if (!userId && !userEmail) return;
    setLoadingPerfil(true);
    supabase
      .from('clientes')
      .select('nombre, email, telefono, created_at, nombre_usuario, diamantes')
      .or(`user_id.eq.${userId},email.eq.${userEmail}`)
      .maybeSingle()
      .then(({ data }) => {
        setPerfilCliente(data);
        setLoadingPerfil(false);
      });
  }, [userId, userEmail]);

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
  // Eliminado porque usamos el render directo

  // ── Abrir modal ───────────────────────────────────────────────────────────
  const abrirModal = useCallback((modelo: any) => {
    setModalData({
      modelo,
      modeloEmail: modelo.email || '',
    });
  }, []);

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
    <div className="min-h-screen"
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
            
            {/* ── Reproductor Premium Stream ── */}
            <div className="mb-8 px-4 sm:px-6">
              <div className="w-full h-[260px] sm:h-[450px] lg:h-[550px] shadow-2xl rounded-lg overflow-hidden border border-[#2a2a2a]">
                <BDWalletProvider 
                  balance={perfilCliente?.diamantes || 0} 
                  onRecargar={() => toast('💎 Funcionalidad de recarga en construcción', { style: { background: '#16181c', color: '#c9a961', border: '1px solid #c9a961' } })}
                >
                  <BDPremiumStream />
                </BDWalletProvider>
              </div>
            </div>
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

            {/* CARGANDO */}
            {cargandoModelos && (
              <div className="grid grid-cols-1 
                              sm:grid-cols-2 
                              lg:grid-cols-3 
                              gap-4 px-4">
                {[1,2,3,4,5,6].map(i => (
                  <div key={i} className="
                    rounded-xl bg-[#16181c] 
                    animate-pulse overflow-hidden
                  ">
                    <div className="h-[240px] 
                                    bg-[#2a2a2a]"/>
                    <div className="p-3 space-y-2">
                      <div className="h-4 bg-[#2a2a2a] 
                                      rounded w-3/4"/>
                      <div className="h-4 bg-[#2a2a2a] 
                                      rounded w-1/2"/>
                      <div className="h-10 bg-[#2a2a2a] 
                                      rounded"/>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* ERROR */}
            {!cargandoModelos && errorModelos && (
              <div className="mx-4 p-6 text-center
                              rounded-xl
                              border border-red-500/30
                              bg-red-500/5">
                <p className="text-red-400 text-sm">
                  {errorModelos}
                </p>
              </div>
            )}

            {/* VACÍO */}
            {!cargandoModelos && !errorModelos && 
            modelos.length === 0 && (
              <div className="py-16 text-center">
                <p className="text-[#c9a961] text-xl 
                              font-bold">◆</p>
                <p className="text-[#888] text-sm mt-2">
                  Próximamente disponible
                </p>
              </div>
            )}

            {/* MOSAICO */}
            {!cargandoModelos && !errorModelos && 
            modelos.length > 0 && (
              <div className="
                grid
                grid-cols-1
                sm:grid-cols-2
                lg:grid-cols-3
                gap-4 sm:gap-5
                px-4 sm:px-6
                pb-8
              ">
                {modelos.map(modelo => (
                  <ModeloCard 
                    key={modelo.id} 
                    modelo={modelo} 
                    onAgendar={(m: any) => abrirModal(m)} 
                  />
                ))}
              </div>
            )}
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
                  const modeloParaModal = modelos.find(m =>
                    m.email === cAny.modeloEmail || m.email === cAny.modelo_email ||
                    m.nombre_artistico === (cAny.modeloNombre || cAny.modelo_nombre)
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
