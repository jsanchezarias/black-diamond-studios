import { useState, useEffect, useCallback } from 'react';
import { ClienteNavbar } from './ClienteNavbar';
import { useAgendamientos } from './AgendamientosContext';
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
import { Calendar, Mail, Phone, Loader2, ShoppingBag, Plus, Minus, ShoppingCart, X as XIcon } from 'lucide-react';
import { ModeloCard } from './ModeloCard';
import { useInventory, type Producto } from './InventoryContext';

// ─── Props ────────────────────────────────────────────────────────────────────
interface ClienteDashboardProps {
  accessToken: string;
  userId: string;
  userEmail: string;
  onLogout: () => void;
}

type Tab = 'explorar' | 'mis-citas' | 'boutique' | 'perfil';

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


// ─── Servicios con precios fijos ─────────────────────────────────────────────
const SERVICIOS_FIJOS = [
  { nombre: 'Rato',      duracion: '15 minutos', duracion_minutos: 15,   precio_sede: 130000,  precio_domicilio: 150000 },
  { nombre: '30 Min',    duracion: '30 minutos', duracion_minutos: 30,   precio_sede: 160000,  precio_domicilio: 180000 },
  { nombre: '1 Hora',    duracion: '1 hora',     duracion_minutos: 60,   precio_sede: 190000,  precio_domicilio: 220000 },
  { nombre: '2 Horas',   duracion: '2 horas',    duracion_minutos: 120,  precio_sede: 360000,  precio_domicilio: 400000 },
  { nombre: '3 Horas',   duracion: '3 horas',    duracion_minutos: 180,  precio_sede: 520000,  precio_domicilio: 580000 },
  { nombre: '6 Horas',   duracion: '6 horas',    duracion_minutos: 360,  precio_sede: 1000000, precio_domicilio: 1100000 },
  { nombre: '8 Horas',   duracion: '8 horas',    duracion_minutos: 480,  precio_sede: 1300000, precio_domicilio: 1400000 },
  { nombre: '12 Horas',  duracion: '12 horas',   duracion_minutos: 720,  precio_sede: 1800000, precio_domicilio: 1900000 },
  { nombre: '24 Horas',  duracion: '24 horas',   duracion_minutos: 1440, precio_sede: 2300000, precio_domicilio: 2500000 },
];

const HORAS_DISPONIBLES = ['10:00','11:00','12:00','13:00','14:00','15:00','16:00','17:00','18:00','19:00','20:00','21:00','22:00'];

// ─── Modal de Reserva ─────────────────────────────────────────────────────────
function ModalReserva({
  modelo, currentUser, onClose, onExito,
}: { modelo: any; currentUser: { id: string; email: string }; onClose: () => void; onExito?: () => void }) {
  const [servicioSel, setServicioSel] = useState<typeof SERVICIOS_FIJOS[0] | null>(null);
  const [sede, setSede] = useState<'sede_norte' | 'domicilio'>('sede_norte');
  const [direccion, setDireccion] = useState('');
  const [fecha, setFecha] = useState('');
  const [hora, setHora] = useState('');
  const [obs, setObs] = useState('');
  const [loading, setLoading] = useState(false);

  const hoy = new Date().toISOString().split('T')[0];
  const precioActual = servicioSel ? (sede === 'sede_norte' ? servicioSel.precio_sede : servicioSel.precio_domicilio) : 0;
  const completo = servicioSel && fecha && hora && (sede === 'sede_norte' || direccion.trim());

  const enviar = async () => {
    if (!completo || !servicioSel) return;
    setLoading(true);
    try {
      const { data: perfil } = await supabase.from('clientes').select('nombre, telefono').eq('user_id', currentUser.id).maybeSingle();
      const { data: usuario } = await supabase.from('usuarios').select('nombre').eq('id', currentUser.id).maybeSingle();
      const nombreCliente = perfil?.nombre || usuario?.nombre || currentUser.email.split('@')[0];

      const isUUID = (s: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s);

      const { data: ag, error } = await supabase.from('agendamientos').insert({
        cliente_id: isUUID(currentUser.id) ? currentUser.id : null,
        cliente_nombre: nombreCliente,
        cliente_telefono: perfil?.telefono || null,
        modelo_id: modelo.id && isUUID(modelo.id) ? modelo.id : null,
        modelo_email: modelo.email || null,
        modelo_nombre: modelo.nombre_artistico || modelo.nombre,
        tipo_servicio: sede === 'sede_norte' ? 'sede' : 'domicilio',
        servicio: servicioSel.nombre,
        tarifa_nombre: servicioSel.nombre,
        duracion_minutos: servicioSel.duracion_minutos,
        precio: precioActual,
        monto_pago: precioActual,
        fecha,
        hora,
        ubicacion: sede === 'sede_norte' ? 'Sede Norte' : 'Domicilio',
        habitacion: sede === 'domicilio' ? direccion : 'Por asignar',
        notas: obs || null,
        estado: 'pendiente',
        estado_pago: 'pendiente',
        creado_por: currentUser.email,
        archivado: false,
        fecha_creacion: new Date().toISOString(),
      }).select().single();

      if (error) { toast.error('Error al reservar: ' + error.message); setLoading(false); return; }

      // Notificaciones (fire-and-forget, errores no bloquean el flujo)
      try {
        await supabase.from('notificaciones').insert({
          usuario_id: currentUser.id, para_usuario_id: currentUser.id,
          tipo: 'agendamiento_pendiente', titulo: '📅 Solicitud enviada',
          mensaje: `Tu reserva con ${modelo.nombre_artistico || modelo.nombre} para el ${fecha} a las ${hora} está pendiente.`,
          leida: false, referencia_id: ag.id,
        });
        const { data: progs } = await supabase.from('usuarios').select('id').in('role', ['programador', 'administrador', 'owner']);
        if (progs?.length) {
          await supabase.from('notificaciones').insert(progs.map((p: any) => ({
            usuario_id: p.id, para_usuario_id: p.id, para_rol: 'programador',
            tipo: 'agendamiento_nuevo', titulo: '📅 Nueva solicitud de cita',
            mensaje: `${nombreCliente} solicita cita con ${modelo.nombre_artistico || modelo.nombre} el ${fecha} a las ${hora} — ${servicioSel.nombre} (${sede === 'sede_norte' ? 'Sede Norte' : 'Domicilio'})`,
            leida: false, referencia_id: ag.id,
          })));
        }
      } catch (_) { /* notificaciones no críticas */ }

      toast.success('✅ Reserva enviada correctamente');
      onExito?.();
      onClose();
    } catch (e: any) {
      toast.error('Error inesperado: ' + (e?.message || 'intenta de nuevo'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.92)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16, overflowY: 'auto' }}>
      <div style={{ background: '#111', border: '0.5px solid rgba(255,215,0,0.3)', borderRadius: 16, padding: 24, maxWidth: 500, width: '100%', maxHeight: '95vh', overflowY: 'auto' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
          {modelo.foto_url && (
            <img src={modelo.foto_url} style={{ width: 48, height: 48, borderRadius: '50%', objectFit: 'cover' }} onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
          )}
          <div>
            <div style={{ fontWeight: 700, fontSize: 16, color: 'white' }}>{modelo.nombre_artistico || modelo.nombre}</div>
            <div style={{ fontSize: 12, color: 'rgba(255,215,0,0.7)' }}>Nueva reserva</div>
          </div>
          <button onClick={onClose} style={{ marginLeft: 'auto', background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.4)', fontSize: 22, cursor: 'pointer' }}>×</button>
        </div>

        {/* Aviso política */}
        <div style={{ background: 'rgba(255,165,0,0.08)', border: '0.5px solid rgba(255,165,0,0.3)', borderRadius: 8, padding: '10px 14px', marginBottom: 20, display: 'flex', gap: 8, alignItems: 'flex-start' }}>
          <span style={{ fontSize: 16, flexShrink: 0 }}>⚠️</span>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', lineHeight: 1.6 }}>
            <strong style={{ color: '#FFA500' }}>Política de cancelación:</strong>{' '}
            Puedes modificar o cancelar tu reserva hasta <strong style={{ color: 'white' }}>12 horas antes</strong> del servicio.
          </div>
        </div>

        {/* 1. Servicio */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.1em', marginBottom: 10 }}>1. SELECCIONA EL SERVICIO</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
            {SERVICIOS_FIJOS.map(s => (
              <div key={s.nombre} onClick={() => setServicioSel(s)}
                style={{
                  padding: '10px 8px', borderRadius: 8, cursor: 'pointer', textAlign: 'center',
                  border: servicioSel?.nombre === s.nombre ? '1.5px solid #FFD700' : '0.5px solid rgba(255,255,255,0.1)',
                  background: servicioSel?.nombre === s.nombre ? 'rgba(255,215,0,0.1)' : 'rgba(255,255,255,0.03)',
                }}
              >
                <div style={{ fontWeight: 700, fontSize: 13, color: servicioSel?.nombre === s.nombre ? '#FFD700' : 'white' }}>{s.nombre}</div>
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', margin: '3px 0' }}>⏱ {s.duracion}</div>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#4CAF50' }}>
                  ${(sede === 'sede_norte' ? s.precio_sede : s.precio_domicilio).toLocaleString('es-CO')}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 2. Lugar */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.1em', marginBottom: 10 }}>2. LUGAR DEL SERVICIO</div>
          <div style={{ display: 'flex', gap: 8 }}>
            {[{ value: 'sede_norte', label: '🏢 Sede Norte' }, { value: 'domicilio', label: '🏠 A Domicilio' }].map(op => (
              <button key={op.value} onClick={() => setSede(op.value as any)}
                style={{
                  flex: 1, padding: 10, borderRadius: 8, cursor: 'pointer',
                  border: sede === op.value ? '1.5px solid #FFD700' : '0.5px solid rgba(255,255,255,0.1)',
                  background: sede === op.value ? 'rgba(255,215,0,0.1)' : 'transparent',
                  color: sede === op.value ? '#FFD700' : 'rgba(255,255,255,0.6)',
                  fontWeight: sede === op.value ? 700 : 400, fontSize: 13,
                }}
              >{op.label}</button>
            ))}
          </div>
          {sede === 'domicilio' && (
            <input placeholder="Dirección completa" value={direccion} onChange={e => setDireccion(e.target.value)}
              style={{ width: '100%', marginTop: 8, padding: '10px 12px', borderRadius: 8, background: 'rgba(255,255,255,0.05)', border: '0.5px solid rgba(255,255,255,0.15)', color: 'white', fontSize: 13, boxSizing: 'border-box' }} />
          )}
        </div>

        {/* 3. Fecha */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.1em', marginBottom: 10 }}>3. FECHA</div>
          <input type="date" value={fecha} min={hoy} onChange={e => setFecha(e.target.value)}
            style={{ width: '100%', padding: '10px 12px', borderRadius: 8, background: 'rgba(255,255,255,0.05)', border: '0.5px solid rgba(255,255,255,0.15)', color: 'white', fontSize: 13, boxSizing: 'border-box', colorScheme: 'dark' }} />
          {fecha && (
            <div style={{ fontSize: 12, color: '#FFD700', marginTop: 6 }}>
              📅 {new Date(fecha + 'T12:00:00').toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </div>
          )}
        </div>

        {/* 4. Hora */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.1em', marginBottom: 10 }}>4. HORA</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6 }}>
            {HORAS_DISPONIBLES.map(h => (
              <button key={h} onClick={() => setHora(h)}
                style={{
                  padding: '9px 4px', borderRadius: 6, cursor: 'pointer',
                  border: hora === h ? '1.5px solid #FFD700' : '0.5px solid rgba(255,255,255,0.1)',
                  background: hora === h ? 'rgba(255,215,0,0.15)' : 'rgba(255,255,255,0.03)',
                  color: hora === h ? '#FFD700' : 'rgba(255,255,255,0.6)',
                  fontWeight: hora === h ? 700 : 400, fontSize: 12,
                }}
              >{h}</button>
            ))}
          </div>
        </div>

        {/* 5. Observaciones */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.1em', marginBottom: 10 }}>5. OBSERVACIONES (opcional)</div>
          <textarea placeholder="Preferencias, solicitudes especiales..." value={obs} onChange={e => setObs(e.target.value)} rows={3}
            style={{ width: '100%', padding: '10px 12px', borderRadius: 8, background: 'rgba(255,255,255,0.05)', border: '0.5px solid rgba(255,255,255,0.15)', color: 'white', fontSize: 13, resize: 'none', boxSizing: 'border-box' }} />
        </div>

        {/* Resumen */}
        {completo && servicioSel && (
          <div style={{ background: 'rgba(255,215,0,0.06)', border: '0.5px solid rgba(255,215,0,0.25)', borderRadius: 10, padding: 16, marginBottom: 16 }}>
            <div style={{ fontSize: 12, color: '#FFD700', fontWeight: 700, marginBottom: 12 }}>📋 Resumen de tu reserva</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, fontSize: 13, color: 'white' }}>
              <div><div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)' }}>MODELO</div><div style={{ fontWeight: 600 }}>{modelo.nombre_artistico || modelo.nombre}</div></div>
              <div><div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)' }}>SERVICIO</div><div style={{ fontWeight: 600 }}>{servicioSel.nombre}</div></div>
              <div><div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)' }}>DURACIÓN</div><div style={{ fontWeight: 600 }}>⏱ {servicioSel.duracion}</div></div>
              <div><div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)' }}>FECHA Y HORA</div><div style={{ fontWeight: 600 }}>{new Date(fecha + 'T12:00:00').toLocaleDateString('es-CO', { day: 'numeric', month: 'short' })} · {hora}</div></div>
              <div><div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)' }}>LUGAR</div><div style={{ fontWeight: 600 }}>{sede === 'sede_norte' ? '🏢 Sede Norte' : '🏠 ' + direccion}</div></div>
              <div><div style={{ fontSize: 10, color: 'rgba(255,215,0,0.6)' }}>TOTAL A PAGAR</div><div style={{ fontWeight: 700, fontSize: 18, color: '#FFD700' }}>${precioActual.toLocaleString('es-CO')}</div></div>
            </div>
            {obs && <div style={{ marginTop: 8, fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>📝 {obs}</div>}
          </div>
        )}

        {/* Botón confirmar */}
        <button onClick={enviar} disabled={!completo || loading}
          style={{
            width: '100%', padding: 14, border: 'none', borderRadius: 10,
            background: !completo ? 'rgba(255,215,0,0.2)' : 'linear-gradient(135deg, #B8860B, #FFD700)',
            color: !completo ? 'rgba(0,0,0,0.3)' : 'black',
            fontWeight: 700, fontSize: 15,
            cursor: !completo || loading ? 'not-allowed' : 'pointer',
          }}
        >
          {loading ? '⏳ Enviando...' : completo ? '✅ Confirmar reserva' : 'Completa todos los campos'}
        </button>
      </div>
    </div>
  );
}

// ─── Modal Cancelar Cita ──────────────────────────────────────────────────────
function ModalCancelarCita({ cita, userEmail, onClose, onCancelado }: { cita: any; userEmail: string; onClose: () => void; onCancelado: () => void }) {
  const [loading, setLoading] = useState(false);

  const cancelar = async () => {
    setLoading(true);
    const { error } = await supabase.from('agendamientos').update({
      estado: 'cancelado',
      motivo_cancelacion: 'Cancelado por el cliente',
      cancelado_por: userEmail,
      fecha_cancelacion: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }).eq('id', cita.id);

    if (error) { toast.error('Error al cancelar'); setLoading(false); return; }

    // Notificar programadores
    try {
      const { data: progs } = await supabase.from('usuarios').select('id, email').in('role', ['programador', 'administrador', 'owner']);
      if (progs?.length) {
        await supabase.from('notificaciones').insert(progs.map((p: any) => ({
          usuario_id: p.id, para_usuario_id: p.id, para_rol: 'programador',
          titulo: '❌ Cita cancelada por el cliente',
          mensaje: `${cita.cliente_nombre || 'Cliente'} canceló su cita con ${cita.modelo_nombre} del ${(cita.fecha || '').split('T')[0]} a las ${cita.hora}`,
          tipo: 'agendamiento_cancelado',
          referencia_id: cita.id, leida: false,
          created_at: new Date().toISOString(),
        })));
      }
    } catch (_) { /* notificación no crítica */ }

    toast.success('Cita cancelada');
    setLoading(false);
    onCancelado();
    onClose();
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1001, padding: 16 }}>
      <div style={{ background: '#111', border: '0.5px solid rgba(255,0,0,0.3)', borderRadius: 12, padding: 24, maxWidth: 380, width: '100%', textAlign: 'center' }}>
        <div style={{ fontSize: 40, marginBottom: 12 }}>⚠️</div>
        <h3 style={{ color: 'white', margin: '0 0 8px', fontSize: 18 }}>¿Cancelar esta cita?</h3>
        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', marginBottom: 16, lineHeight: 1.6 }}>
          {cita.modelo_nombre} · {cita.servicio || cita.tipo_servicio}<br />
          {(cita.fecha || '').split('T')[0]} · {cita.hora}
        </p>
        <div style={{ background: 'rgba(255,165,0,0.08)', border: '0.5px solid rgba(255,165,0,0.3)', borderRadius: 8, padding: 12, marginBottom: 20 }}>
          <p style={{ fontSize: 12, color: '#FFA500', margin: 0 }}>Esta acción no se puede deshacer. Si tienes dudas contáctanos antes de cancelar.</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={onClose} style={{ flex: 1, padding: 10, background: 'transparent', border: '0.5px solid rgba(255,255,255,0.2)', borderRadius: 8, color: 'rgba(255,255,255,0.6)', cursor: 'pointer' }}>Volver</button>
          <button onClick={cancelar} disabled={loading} style={{ flex: 1, padding: 10, background: '#FF4444', border: 'none', borderRadius: 8, color: 'white', fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1 }}>
            {loading ? '⏳...' : 'Sí, cancelar'}
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
  onModificar: () => void;
  onCancelar: () => void;
}

function CitaCard({ cita, cfg, locked, esActiva, onModificar, onCancelar }: CitaCardProps) {
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

          <div className="mt-2" style={{ fontSize: '0.8rem', color: C.muted }}>
            <div className="flex items-center gap-2 mb-2">
              <span>📅</span>
              <span>{formatFecha(cita.fecha)} · {cita.hora || '--:--'}</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6 }}>
              <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 6, padding: '8px 10px' }}>
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', marginBottom: 2 }}>SERVICIO</div>
                <div style={{ fontSize: 12, fontWeight: 500, color: 'white', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {cita.tarifaNombre || cita.servicio || cita.tipoServicio || 'N/A'}
                </div>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 6, padding: '8px 10px' }}>
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', marginBottom: 2 }}>DURACIÓN</div>
                <div style={{ fontSize: 12, fontWeight: 500, color: 'white' }}>
                  {cita.duracion_minutos
                    ? cita.duracion_minutos < 60
                      ? cita.duracion_minutos + ' min'
                      : cita.duracion_minutos === 60
                        ? '1 hora'
                        : (cita.duracion_minutos / 60) + ' horas'
                    : 'N/A'}
                </div>
              </div>
              <div style={{ background: 'rgba(255,215,0,0.06)', border: '0.5px solid rgba(255,215,0,0.2)', borderRadius: 6, padding: '8px 10px' }}>
                <div style={{ fontSize: 10, color: 'rgba(255,215,0,0.5)', marginBottom: 2 }}>PRECIO</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#FFD700' }}>
                  {(cita.montoPago || cita.monto_pago)
                    ? '$' + parseInt(cita.montoPago || cita.monto_pago).toLocaleString('es-CO')
                    : 'N/A'}
                </div>
              </div>
            </div>
            {cita.ubicacion && (
              <div style={{ marginTop: 8, fontSize: 12, color: 'rgba(255,255,255,0.4)', display: 'flex', alignItems: 'center', gap: 4 }}>
                📍 {cita.ubicacion}
                {cita.habitacion && cita.habitacion !== 'Por asignar' && (
                  <span> — {cita.habitacion}</span>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Acciones solo para citas activas */}
      {esActiva && (
        <div className="mt-4 pt-4" style={{ borderTop: `1px solid ${C.border}` }}>
          {locked ? (
            <div style={{ background: 'rgba(255,165,0,0.08)', border: '0.5px solid rgba(255,165,0,0.2)', borderRadius: 6, padding: '8px 12px', fontSize: 11, color: 'rgba(255,165,0,0.8)', textAlign: 'center' }}>
              ⚠️ Ya no puedes modificar esta cita — faltan menos de 12 horas
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
  const citasCompletadas = misCitas.filter(a => a.estado === 'completado').length;

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

// ─── Boutique Tab ─────────────────────────────────────────────────────────────
interface CarritoItem extends Producto {
  cantidad: number;
}

function BoutiqueTab() {
  const { inventario, loading } = useInventory();
  const [carrito, setCarrito] = useState<CarritoItem[]>([]);
  const [carritoAbierto, setCarritoAbierto] = useState(false);
  const [categoriaActiva, setCategoriaActiva] = useState<string>('Todos');

  const productosDisponibles = inventario.filter(p => p.stock > 0);
  const categorias = ['Todos', ...Array.from(new Set(productosDisponibles.map(p => p.categoria || 'General')))];
  const productosFiltrados = categoriaActiva === 'Todos'
    ? productosDisponibles
    : productosDisponibles.filter(p => (p.categoria || 'General') === categoriaActiva);

  const totalCarrito = carrito.reduce((s, i) => s + (i.precioRegular || 0) * i.cantidad, 0);
  const totalItems = carrito.reduce((s, i) => s + i.cantidad, 0);

  const agregar = (p: Producto) => {
    setCarrito(prev => {
      const existe = prev.find(i => i.id === p.id);
      if (existe) return prev.map(i => i.id === p.id ? { ...i, cantidad: i.cantidad + 1 } : i);
      return [...prev, { ...p, cantidad: 1 }];
    });
  };

  const quitar = (id: string) => {
    setCarrito(prev => {
      const item = prev.find(i => i.id === id);
      if (!item || item.cantidad <= 1) return prev.filter(i => i.id !== id);
      return prev.map(i => i.id === id ? { ...i, cantidad: i.cantidad - 1 } : i);
    });
  };

  const cantidadEnCarrito = (id: string) => carrito.find(i => i.id === id)?.cantidad || 0;

  return (
    <div style={{ animation: 'bdFadeInUp 0.3s ease', position: 'relative' }}>
      {/* Header */}
      <div className="mb-6 flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.75rem', fontWeight: 700, color: C.text, marginBottom: 4 }}>
            Boutique
          </h2>
          <p style={{ color: C.muted, fontSize: '0.875rem' }}>Productos exclusivos disponibles en nuestras instalaciones</p>
        </div>
        {totalItems > 0 && (
          <button onClick={() => setCarritoAbierto(true)}
            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 18px', background: `linear-gradient(135deg, ${C.gold}, #a07c3a)`, border: 'none', borderRadius: 10, color: '#0f1014', fontWeight: 700, cursor: 'pointer', fontSize: 14 }}>
            <ShoppingCart style={{ width: 18, height: 18 }} />
            Carrito ({totalItems}) — ${totalCarrito.toLocaleString('es-CO')}
          </button>
        )}
      </div>

      {/* Filtro por categoría */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-6 scrollbar-hide">
        {categorias.map(cat => (
          <button key={cat} onClick={() => setCategoriaActiva(cat)}
            style={{ padding: '7px 16px', borderRadius: 20, border: 'none', cursor: 'pointer', whiteSpace: 'nowrap', fontSize: 13, fontWeight: 600, background: categoriaActiva === cat ? C.gold : 'rgba(255,255,255,0.06)', color: categoriaActiva === cat ? '#0f1014' : C.muted, transition: 'all 0.15s' }}>
            {cat}
          </button>
        ))}
      </div>

      {/* Grid de productos */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {[1,2,3,4,5,6,7,8].map(i => (
            <div key={i} style={{ background: C.card, borderRadius: 12, overflow: 'hidden', border: `1px solid ${C.border}` }} className="animate-pulse">
              <div style={{ height: 180, background: '#2a2a2a' }} />
              <div style={{ padding: 12 }}>
                <div style={{ height: 12, background: '#2a2a2a', borderRadius: 4, marginBottom: 8, width: '70%' }} />
                <div style={{ height: 16, background: '#2a2a2a', borderRadius: 4, width: '40%' }} />
              </div>
            </div>
          ))}
        </div>
      ) : productosFiltrados.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px' }}>
          <ShoppingBag style={{ width: 48, height: 48, color: C.muted, margin: '0 auto 16px' }} />
          <p style={{ color: C.muted, fontSize: '0.875rem' }}>No hay productos disponibles en esta categoría</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 pb-8">
          {productosFiltrados.map(producto => {
            const enCarrito = cantidadEnCarrito(producto.id);
            return (
              <div key={producto.id} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, overflow: 'hidden', transition: 'transform 0.2s', cursor: 'default' }}
                onMouseEnter={e => (e.currentTarget.style.transform = 'translateY(-2px)')}
                onMouseLeave={e => (e.currentTarget.style.transform = 'translateY(0)')}>
                <div style={{ position: 'relative', height: 180, overflow: 'hidden', background: '#1a1c20' }}>
                  {producto.imagen ? (
                    <img src={producto.imagen} alt={producto.nombre} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                      <ShoppingBag style={{ width: 40, height: 40, color: C.muted }} />
                    </div>
                  )}
                  {producto.categoria && (
                    <span style={{ position: 'absolute', top: 8, left: 8, background: 'rgba(0,0,0,0.7)', color: C.gold, fontSize: 9, fontWeight: 700, padding: '3px 8px', borderRadius: 20, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                      {producto.categoria}
                    </span>
                  )}
                </div>
                <div style={{ padding: '12px 14px' }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: C.text, marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{producto.nombre}</div>
                  {producto.descripcion && (
                    <div style={{ fontSize: 11, color: C.muted, marginBottom: 8, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as any }}>{producto.descripcion}</div>
                  )}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 }}>
                    <div>
                      {(producto.precioInicial && producto.precioFinal && producto.precioInicial > producto.precioFinal) ? (
                        <div>
                          <span style={{ fontSize: 10, color: C.muted, textDecoration: 'line-through', marginRight: 4 }}>${(producto.precioInicial || 0).toLocaleString('es-CO')}</span>
                          <span style={{ fontSize: 15, fontWeight: 700, color: '#4ade80' }}>${(producto.precioFinal || 0).toLocaleString('es-CO')}</span>
                        </div>
                      ) : (
                        <span style={{ fontSize: 15, fontWeight: 700, color: C.gold }}>${(producto.precioRegular || 0).toLocaleString('es-CO')}</span>
                      )}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      {enCarrito > 0 ? (
                        <>
                          <button onClick={() => quitar(producto.id)} style={{ width: 26, height: 26, borderRadius: '50%', border: `1px solid ${C.borderGold}`, background: 'transparent', color: C.gold, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Minus style={{ width: 12, height: 12 }} />
                          </button>
                          <span style={{ fontSize: 13, fontWeight: 700, color: C.gold, minWidth: 20, textAlign: 'center' }}>{enCarrito}</span>
                          <button onClick={() => agregar(producto)} style={{ width: 26, height: 26, borderRadius: '50%', border: 'none', background: C.gold, color: '#0f1014', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Plus style={{ width: 12, height: 12 }} />
                          </button>
                        </>
                      ) : (
                        <button onClick={() => agregar(producto)} style={{ padding: '5px 12px', borderRadius: 8, border: 'none', background: C.gold, color: '#0f1014', fontSize: 11, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                          <Plus style={{ width: 12, height: 12 }} /> Agregar
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Drawer del carrito */}
      {carritoAbierto && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 1000, display: 'flex', justifyContent: 'flex-end' }} onClick={() => setCarritoAbierto(false)}>
          <div style={{ width: Math.min(420, window.innerWidth), height: '100%', background: '#111', borderLeft: `1px solid ${C.border}`, display: 'flex', flexDirection: 'column', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
            <div style={{ padding: '20px 24px', borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.1rem', fontWeight: 700, color: C.text, margin: 0 }}>
                Mi Carrito
              </h3>
              <button onClick={() => setCarritoAbierto(false)} style={{ background: 'transparent', border: 'none', color: C.muted, cursor: 'pointer', padding: 4 }}>
                <XIcon style={{ width: 20, height: 20 }} />
              </button>
            </div>
            <div style={{ flex: 1, padding: '16px 24px', overflowY: 'auto' }}>
              {carrito.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 0', color: C.muted }}>
                  <ShoppingCart style={{ width: 40, height: 40, margin: '0 auto 12px', opacity: 0.5 }} />
                  <p style={{ fontSize: 14 }}>Tu carrito está vacío</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {carrito.map(item => (
                    <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px', background: 'rgba(255,255,255,0.03)', borderRadius: 10, border: `1px solid ${C.border}` }}>
                      {item.imagen && <img src={item.imagen} alt={item.nombre} style={{ width: 48, height: 48, borderRadius: 8, objectFit: 'cover', flexShrink: 0 }} />}
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{item.nombre}</div>
                        <div style={{ fontSize: 12, color: C.gold, fontWeight: 700 }}>${(item.precioRegular || 0).toLocaleString('es-CO')} c/u</div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <button onClick={() => quitar(item.id)} style={{ width: 26, height: 26, borderRadius: '50%', border: `1px solid ${C.borderGold}`, background: 'transparent', color: C.gold, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Minus style={{ width: 12, height: 12 }} />
                        </button>
                        <span style={{ fontSize: 14, fontWeight: 700, color: C.text, minWidth: 24, textAlign: 'center' }}>{item.cantidad}</span>
                        <button onClick={() => agregar(item)} style={{ width: 26, height: 26, borderRadius: '50%', border: 'none', background: C.gold, color: '#0f1014', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Plus style={{ width: 12, height: 12 }} />
                        </button>
                      </div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: C.gold, minWidth: 80, textAlign: 'right' }}>
                        ${((item.precioRegular || 0) * item.cantidad).toLocaleString('es-CO')}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            {carrito.length > 0 && (
              <div style={{ padding: '20px 24px', borderTop: `1px solid ${C.border}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
                  <span style={{ color: C.muted, fontSize: 14 }}>Total</span>
                  <span style={{ fontSize: 20, fontWeight: 700, color: C.gold }}>${totalCarrito.toLocaleString('es-CO')}</span>
                </div>
                <div style={{ background: 'rgba(201,169,97,0.1)', border: `1px solid ${C.borderGold}`, borderRadius: 10, padding: '12px 16px', marginBottom: 16 }}>
                  <p style={{ fontSize: 12, color: C.muted, margin: 0, lineHeight: 1.5 }}>
                    Los productos de boutique se pagan al momento del servicio. Informa a tu acompañante los productos que deseas.
                  </p>
                </div>
                <button onClick={() => { toast.success('✅ Lista de productos guardada. Tu acompañante la tendrá disponible.'); setCarritoAbierto(false); }}
                  style={{ width: '100%', padding: 13, border: 'none', borderRadius: 10, background: `linear-gradient(135deg, ${C.gold}, #a07c3a)`, color: '#0f1014', fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>
                  Confirmar Lista
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── ClienteDashboard (componente principal) ──────────────────────────────────
export function ClienteDashboard({ userId, userEmail, onLogout }: ClienteDashboardProps) {
  const [activeTab, setActiveTab] = useState<Tab>('explorar');
  const [modalData, setModalData] = useState<{ modelo: any; modeloEmail: string } | null>(null);
  const [modalCancelar, setModalCancelar] = useState<any | null>(null);
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
            { id: 'boutique',   label: 'Boutique',  icon: '🛍️', badge: 0 },
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

        {/* TAB: BOUTIQUE */}
        {activeTab === 'boutique' && <BoutiqueTab />}

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
                      onModificar={() => {
                        if (modeloParaModal) abrirModal(modeloParaModal);
                        else toast.error('No se encontró la modelo para modificar la cita');
                      }}
                      onCancelar={() => setModalCancelar(cita)}
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

      {/* Modal de reserva */}
      {modalData && (
        <ModalReserva
          modelo={modalData.modelo}
          currentUser={{ id: userId, email: userEmail }}
          onClose={() => setModalData(null)}
          onExito={() => setModalData(null)}
        />
      )}

      {/* Modal cancelar cita */}
      {modalCancelar && (
        <ModalCancelarCita
          cita={modalCancelar}
          userEmail={userEmail}
          onClose={() => setModalCancelar(null)}
          onCancelado={() => setModalCancelar(null)}
        />
      )}
    </div>
  );
}
