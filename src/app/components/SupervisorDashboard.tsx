import { useState, lazy, Suspense } from 'react';
import { LogOut, Users, Calendar, Activity, ShieldAlert, Bell, BarChart3 } from 'lucide-react';
import { LogoIsotipo } from './LogoIsotipo';
import { NotificacionBell } from './NotificacionBell';
import { useModelos } from './ModelosContext';
import { useAgendamientos } from './AgendamientosContext';
import { useMultas } from './MultasContext';

const AsistenciaPanel = lazy(() => import('./AsistenciaPanel').then(m => ({ default: m.AsistenciaPanel })));
const AgendamientosPanel = lazy(() => import('./AgendamientosPanel').then(m => ({ default: m.AgendamientosPanel })));
const NotificacionesPanel = lazy(() => import('./NotificacionesPanel').then(m => ({ default: m.NotificacionesPanel })));
const AnalyticsPanel = lazy(() => import('./AnalyticsPanel').then(m => ({ default: m.AnalyticsPanel })));
const RendimientoModelosPanel = lazy(() => import('../../components/RendimientoModelosPanel').then(m => ({ default: m.RendimientoModelosPanel })));

type Seccion = 'overview' | 'modelos' | 'agendamientos' | 'asistencia' | 'analytics' | 'notificaciones';

interface SupervisorDashboardProps {
  accessToken: string;
  userId: string;
  userEmail: string;
  onLogout: () => void;
}

const C = {
  bg: '#0f1014',
  card: '#16181c',
  gold: '#c9a961',
  text: '#e8e6e3',
  muted: '#888',
  border: '#2a2a2a',
};

const SECCIONES = [
  { id: 'overview' as Seccion,       icon: Activity,    label: 'Resumen' },
  { id: 'modelos' as Seccion,        icon: Users,       label: 'Modelos' },
  { id: 'agendamientos' as Seccion,  icon: Calendar,    label: 'Agendamientos' },
  { id: 'asistencia' as Seccion,     icon: ShieldAlert, label: 'Asistencia' },
  { id: 'analytics' as Seccion,      icon: BarChart3,   label: 'Analytics' },
  { id: 'notificaciones' as Seccion, icon: Bell,        label: 'Notificaciones' },
];

function LoadingFallback() {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="w-10 h-10 border-4 border-transparent border-t-[#c9a961] rounded-full animate-spin" />
    </div>
  );
}

function OverviewPanel() {
  const { modelos } = useModelos();
  const { agendamientos } = useAgendamientos();
  const { multas } = useMultas();

  const modelosActivos = (modelos || []).filter((m: any) => m.activa || m.estado === 'activo').length;
  const hoy = new Date().toISOString().split('T')[0];
  const citasHoy = (agendamientos || []).filter((a: any) => (a.fecha || '').startsWith(hoy)).length;
  const multasActivas = multas.filter(m => m.estado === 'activa').length;
  const pendientes = (agendamientos || []).filter((a: any) => a.estado === 'pendiente').length;

  const stats = [
    { label: 'Modelos Activas', value: modelosActivos, color: '#c9a961', icon: Users },
    { label: 'Citas Hoy', value: citasHoy, color: '#60a5fa', icon: Calendar },
    { label: 'Multas Activas', value: multasActivas, color: '#ef4444', icon: ShieldAlert },
    { label: 'Citas Pendientes', value: pendientes, color: '#eab308', icon: Activity },
  ];

  return (
    <div style={{ padding: 24 }}>
      <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.25rem', fontWeight: 700, color: C.text, marginBottom: 24 }}>
        Resumen Operativo
      </h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
        {stats.map(stat => (
          <div key={stat.label} style={{ background: '#1a1c20', border: `1px solid ${C.border}`, borderRadius: 12, padding: '20px 24px', display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ width: 48, height: 48, borderRadius: 12, background: `${stat.color}1a`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <stat.icon style={{ width: 22, height: 22, color: stat.color }} />
            </div>
            <div>
              <div style={{ fontSize: 28, fontWeight: 700, color: stat.color, fontFamily: "'Playfair Display', serif" }}>{stat.value}</div>
              <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>{stat.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Multas recientes */}
      {multas.filter(m => m.estado === 'activa').slice(0, 5).length > 0 && (
        <div style={{ marginTop: 24 }}>
          <div style={{ fontSize: 12, color: C.muted, letterSpacing: '0.1em', fontWeight: 700, textTransform: 'uppercase', marginBottom: 12 }}>Multas Activas</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {multas.filter(m => m.estado === 'activa').slice(0, 5).map(m => (
              <div key={m.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 8 }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{m.modeloNombre}</div>
                  <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>{m.motivo}</div>
                </div>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#ef4444' }}>${(m.monto || 0).toLocaleString('es-CO')}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export function SupervisorDashboard({ userEmail, onLogout }: SupervisorDashboardProps) {
  const [seccion, setSeccion] = useState<Seccion>('overview');

  return (
    <div style={{ minHeight: '100vh', background: C.bg, color: C.text, fontFamily: "'Inter', sans-serif" }}>

      {/* Navbar */}
      <nav style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50, background: 'rgba(15,16,20,0.95)', backdropFilter: 'blur(12px)', borderBottom: `1px solid ${C.border}`, height: 64 }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 20px', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <LogoIsotipo size="sm" />
            <div>
              <span style={{ fontSize: 13, fontWeight: 700, color: C.text }}>Black Diamond</span>
              <div style={{ fontSize: 10, color: C.gold, letterSpacing: '0.1em', fontWeight: 600 }}>SUPERVISOR</div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <NotificacionBell />
            <button onClick={onLogout} style={{ background: 'transparent', border: `1px solid rgba(239,68,68,0.3)`, borderRadius: 8, padding: '6px 14px', color: '#ef4444', cursor: 'pointer', fontSize: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
              <LogOut style={{ width: 14, height: 14 }} /> Salir
            </button>
          </div>
        </div>
      </nav>

      <div style={{ paddingTop: 64, display: 'flex', minHeight: '100vh' }}>
        <aside style={{ width: 220, borderRight: `1px solid ${C.border}`, paddingTop: 24, position: 'sticky', top: 64, height: 'calc(100vh - 64px)', overflowY: 'auto', background: C.bg }}>
          <div style={{ padding: '0 12px 12px', fontSize: 10, color: C.muted, letterSpacing: '0.1em', fontWeight: 700, textTransform: 'uppercase' }}>Módulos</div>
          {SECCIONES.map(s => {
            const Icon = s.icon;
            const activo = seccion === s.id;
            return (
              <button key={s.id} onClick={() => setSeccion(s.id)}
                style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '11px 16px', border: 'none', background: activo ? `rgba(201,169,97,0.12)` : 'transparent', borderRight: activo ? `2px solid ${C.gold}` : '2px solid transparent', color: activo ? C.gold : C.muted, cursor: 'pointer', fontSize: 13, fontWeight: activo ? 700 : 400, transition: 'all 0.15s' }}>
                <Icon style={{ width: 16, height: 16 }} /> {s.label}
              </button>
            );
          })}
        </aside>

        <main style={{ flex: 1, padding: '32px 28px', maxWidth: 'calc(100% - 220px)' }}>
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, overflow: 'hidden' }}>
            <Suspense fallback={<LoadingFallback />}>
              {seccion === 'overview' && <OverviewPanel />}
              {seccion === 'modelos' && <RendimientoModelosPanel />}
              {seccion === 'agendamientos' && <AgendamientosPanel rol="supervisor" userEmail={userEmail} />}
              {seccion === 'asistencia' && <AsistenciaPanel userRole="administrador" />}
              {seccion === 'analytics' && <AnalyticsPanel />}
              {seccion === 'notificaciones' && <NotificacionesPanel />}
            </Suspense>
          </div>
        </main>
      </div>
    </div>
  );
}
