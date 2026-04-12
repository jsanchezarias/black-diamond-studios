import { Calendar, CheckCircle, Clock, XCircle, AlertCircle, TrendingUp, DollarSign, ThumbsUp } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { useAgendamientos } from './AgendamientosContext';

const COLOR_PRIMARY = '#c9a961';

interface AgendamientosMetricsProps {
  rol: 'owner' | 'admin' | 'supervisor' | 'recepcionista' | 'modelo';
  modeloEmail?: string;
}

export function AgendamientosMetrics({ rol, modeloEmail }: AgendamientosMetricsProps) {
  const { agendamientos, getAgendamientosHoy, getAgendamientosPendientesAprobacion } = useAgendamientos();

  const hoy     = getAgendamientosHoy();
  const fuente  = rol === 'modelo' && modeloEmail
    ? agendamientos.filter(a => a.modeloEmail === modeloEmail)
    : agendamientos;

  const hoyFuente = rol === 'modelo' && modeloEmail
    ? hoy.filter(a => a.modeloEmail === modeloEmail)
    : hoy;

  const pendientesAprobacion = getAgendamientosPendientesAprobacion();

  // Métricas comunes
  const totalHoy       = hoyFuente.length;
  const completadosHoy = hoyFuente.filter(a => a.estado === 'completado').length;
  const canceladosHoy  = hoyFuente.filter(a => a.estado === 'cancelado' || a.estado === 'no_show').length;
  const activosHoy     = hoyFuente.filter(a => a.estado === 'confirmado' || a.estado === 'aprobado').length;

  // Métricas extendidas (admin/owner/supervisor)
  const ingresosPotencialHoy = hoyFuente
    .filter(a => a.estado !== 'cancelado' && a.estado !== 'no_show')
    .reduce((s, a) => s + a.montoPago, 0);
  const ingresosRealizadosHoy = hoyFuente
    .filter(a => a.estado === 'completado')
    .reduce((s, a) => s + a.montoPago, 0);

  const totalMes = fuente.filter(a => {
    const inicioMes = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];
    return a.fecha >= inicioMes;
  }).length;

  const fmt = (n: number) =>
    n >= 1_000_000 ? `$${(n / 1_000_000).toFixed(1)}M` : `$${(n / 1_000).toFixed(0)}k`;

  // ── Tarjetas según rol ────────────────────────────────────────────────────────

  if (rol === 'modelo') {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <MetricCard icon={<Calendar className="w-4 h-4" />} label="Citas hoy" value={totalHoy} color="primary" />
        <MetricCard icon={<CheckCircle className="w-4 h-4" />} label="Completadas" value={completadosHoy} color="green" />
        <MetricCard icon={<Clock className="w-4 h-4" />} label="Confirmadas" value={activosHoy} color="blue" />
        <MetricCard icon={<XCircle className="w-4 h-4" />} label="Canceladas" value={canceladosHoy} color="red" />
      </div>
    );
  }

  if (rol === 'recepcionista') {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <MetricCard icon={<Calendar className="w-4 h-4" />} label="Total hoy" value={totalHoy} color="primary" />
        <MetricCard icon={<Clock className="w-4 h-4" />} label="Activos" value={activosHoy} color="blue" />
        <MetricCard icon={<CheckCircle className="w-4 h-4" />} label="Completados" value={completadosHoy} color="green" />
        <MetricCard icon={<AlertCircle className="w-4 h-4" />} label="Pend. aprob." value={pendientesAprobacion.length} color="amber" />
      </div>
    );
  }

  // supervisor / admin / owner
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
      <MetricCard icon={<Calendar className="w-4 h-4" />} label="Total hoy" value={totalHoy} color="primary" />
      <MetricCard icon={<ThumbsUp className="w-4 h-4" />} label="Pend. aprob." value={pendientesAprobacion.length} color="amber" />
      <MetricCard icon={<Clock className="w-4 h-4" />} label="Activos hoy" value={activosHoy} color="blue" />
      <MetricCard icon={<CheckCircle className="w-4 h-4" />} label="Completados" value={completadosHoy} color="green" />
      <MetricCard icon={<TrendingUp className="w-4 h-4" />} label="Este mes" value={totalMes} color="primary" />
      <MetricCard icon={<DollarSign className="w-4 h-4" />} label="Ingresos hoy" value={fmt(ingresosRealizadosHoy)} color="green" />
    </div>
  );
}

// ── Tarjeta auxiliar ──────────────────────────────────────────────────────────

type MetricColor = 'primary' | 'green' | 'blue' | 'red' | 'amber';

const COLOR_MAP: Record<MetricColor, { border: string; text: string; card: string }> = {
  primary: { border: 'border-white/10',           text: '',                    card: 'bg-black/20' },
  green:   { border: 'border-green-500/20',        text: 'text-green-400',      card: 'bg-green-500/5' },
  blue:    { border: 'border-blue-500/20',         text: 'text-blue-400',       card: 'bg-blue-500/5' },
  red:     { border: 'border-red-500/20',          text: 'text-red-400',        card: 'bg-red-500/5' },
  amber:   { border: 'border-amber-500/20',        text: 'text-amber-400',      card: 'bg-amber-500/5' },
};

function MetricCard({ icon, label, value, color }: {
  icon: React.ReactNode;
  label: string;
  value: number | string;
  color: MetricColor;
}) {
  const c = COLOR_MAP[color];
  return (
    <Card className={`${c.border} ${c.card}`}>
      <CardHeader className="pb-1 pt-4 px-4">
        <CardDescription className="text-xs flex items-center gap-1 text-gray-400">
          {icon}
          {label}
        </CardDescription>
        <CardTitle
          className={`text-3xl ${c.text}`}
          style={color === 'primary' ? { color: COLOR_PRIMARY } : undefined}
        >
          {value}
        </CardTitle>
      </CardHeader>
    </Card>
  );
}
