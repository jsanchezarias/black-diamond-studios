import { useState, lazy, Suspense } from 'react';
import { LogOut, DollarSign, Receipt, TrendingUp, BarChart3, Bell } from 'lucide-react';
import { LogoIsotipo } from './LogoIsotipo';
import { NotificacionBell } from './NotificacionBell';
import { useServicios } from './ServiciosContext';
import { usePagos } from './PagosContext';

const LiquidacionPanel = lazy(() => import('../../components/LiquidacionPanel').then(m => ({ default: m.LiquidacionPanel })));
const GastosOperativosPanel = lazy(() => import('../../components/GastosOperativosPanel').then(m => ({ default: m.GastosOperativosPanel })));
const ResumenFinancieroPanel = lazy(() => import('./ResumenFinancieroPanel').then(m => ({ default: m.ResumenFinancieroPanel })));
const BalanceDashboard = lazy(() => import('./BalanceDashboard').then(m => ({ default: m.BalanceDashboard })));
const NotificacionesPanel = lazy(() => import('./NotificacionesPanel').then(m => ({ default: m.NotificacionesPanel })));

type Seccion = 'balance' | 'liquidaciones' | 'gastos' | 'finanzas' | 'notificaciones';

interface ContadorDashboardProps {
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
  borderGold: 'rgba(201,169,97,0.3)',
};

const SECCIONES = [
  { id: 'balance' as Seccion,       icon: BarChart3,    label: 'Balance' },
  { id: 'finanzas' as Seccion,      icon: TrendingUp,   label: 'Finanzas' },
  { id: 'liquidaciones' as Seccion, icon: Receipt,      label: 'Liquidaciones' },
  { id: 'gastos' as Seccion,        icon: DollarSign,   label: 'Gastos' },
  { id: 'notificaciones' as Seccion,icon: Bell,         label: 'Notificaciones' },
];

function LoadingFallback() {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="w-10 h-10 border-4 border-transparent border-t-[#c9a961] rounded-full animate-spin" />
    </div>
  );
}

export function ContadorDashboard({ userEmail, onLogout }: ContadorDashboardProps) {
  const [seccion, setSeccion] = useState<Seccion>('balance');
  const { servicios } = useServicios();
  const { pagos } = usePagos();

  const hoy = new Date().toISOString().split('T')[0];
  const mes = new Date().toISOString().slice(0, 7);
  const toDateStr = (f: Date | string | undefined) => (f instanceof Date ? f.toISOString() : String(f ?? '')).split('T')[0];
  const ingresosHoy = pagos.filter(p => toDateStr(p.fecha) === hoy).reduce((s, p) => s + (p.monto || 0), 0);
  const ingresosMes = pagos.filter(p => toDateStr(p.fecha).startsWith(mes)).reduce((s, p) => s + (p.monto || 0), 0);
  const serviciosMes = servicios.filter(s => s.fecha?.startsWith(mes) && s.estado === 'completado').length;

  return (
    <div style={{ minHeight: '100vh', background: C.bg, color: C.text, fontFamily: "'Inter', sans-serif" }}>

      {/* Navbar */}
      <nav style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50, background: 'rgba(15,16,20,0.95)', backdropFilter: 'blur(12px)', borderBottom: `1px solid ${C.border}`, height: 64 }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 20px', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <LogoIsotipo size="sm" />
            <div>
              <span style={{ fontSize: 13, fontWeight: 700, color: C.text }}>Black Diamond</span>
              <div style={{ fontSize: 10, color: C.gold, letterSpacing: '0.1em', fontWeight: 600 }}>CONTADOR</div>
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

        {/* Sidebar */}
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

        {/* Main */}
        <main style={{ flex: 1, padding: '32px 28px', maxWidth: 'calc(100% - 220px)' }}>
          {/* Stats rápidas */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 32 }}>
            {[
              { label: 'Ingresos Hoy', value: `$${(ingresosHoy || 0).toLocaleString('es-CO')}`, icon: DollarSign },
              { label: 'Ingresos Mes', value: `$${(ingresosMes || 0).toLocaleString('es-CO')}`, icon: TrendingUp },
              { label: 'Servicios Mes', value: serviciosMes, icon: BarChart3 },
            ].map(stat => (
              <div key={stat.label} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: '18px 20px', display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{ width: 44, height: 44, borderRadius: 10, background: `rgba(201,169,97,0.1)`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <stat.icon style={{ width: 20, height: 20, color: C.gold }} />
                </div>
                <div>
                  <div style={{ fontSize: 20, fontWeight: 700, color: C.gold, fontFamily: "'Playfair Display', serif" }}>{stat.value}</div>
                  <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>{stat.label}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Panel activo */}
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, overflow: 'hidden' }}>
            <Suspense fallback={<LoadingFallback />}>
              {seccion === 'balance' && <BalanceDashboard />}
              {seccion === 'finanzas' && <ResumenFinancieroPanel />}
              {seccion === 'liquidaciones' && <LiquidacionPanel userEmail={userEmail} />}
              {seccion === 'gastos' && <GastosOperativosPanel userEmail={userEmail} />}
              {seccion === 'notificaciones' && <NotificacionesPanel />}
            </Suspense>
          </div>
        </main>
      </div>
    </div>
  );
}
