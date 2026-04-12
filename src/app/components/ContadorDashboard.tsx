import { useState, useMemo } from 'react';
import {
  DollarSign, BarChart3, CreditCard, LogOut, Calculator,
  Receipt, Zap, PieChart, TrendingUp, TrendingDown,
  Download, Minus,
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, LineChart, Line, Legend,
} from 'recharts';
import { LogoIsotipo } from './LogoIsotipo';
import { AnalyticsPanel } from './AnalyticsPanel';
import { LiquidacionPanel } from '../../components/LiquidacionPanel';
import { GestionAdelantosPanel } from '../../components/GestionAdelantosPanel';
import { FinanzasPanel } from '../../components/FinanzasPanel';
import { GastosOperativosPanel } from '../../components/GastosOperativosPanel';
import { ServiciosPublicosPanel } from '../../components/ServiciosPublicosPanel';
import { useServicios } from './ServiciosContext';
import { useGastos } from './GastosContext';
import { usePagos } from './PagosContext';

interface ContadorDashboardProps {
  userEmail: string;
  onLogout?: () => void;
}

const COLOR_PRIMARY  = '#c9a961';
const COLOR_INGRESO  = '#22c55e';
const COLOR_EGRESO   = '#ef4444';
const COLOR_BALANCE  = '#3b82f6';

function toYMD(d: Date) { return d.toISOString().split('T')[0]; }
function addDays(d: Date, n: number) { const r = new Date(d); r.setDate(r.getDate() + n); return r; }
function fmtCOP(n: number) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)     return `$${(n / 1_000).toFixed(0)}k`;
  return `$${n.toFixed(0)}`;
}
function fmtNum(n: number) { return n.toLocaleString('es-CO'); }

export function ContadorDashboard({ userEmail, onLogout }: ContadorDashboardProps) {
  const [tab, setTab] = useState('resumen');

  // ── Context hooks ─────────────────────────────────────────────────────
  let serviciosFinalizados: any[] = [];
  let gastosOperativos: any[]     = [];
  let adelantosPendientes         = 0;

  try { const { servicios = [] } = useServicios(); serviciosFinalizados = servicios.filter((s: any) => s.estado === 'completado'); } catch (_) {}
  try { const { gastosOperativos: g = [] } = useGastos() as any; gastosOperativos = g; } catch (_) {}
  try { const p = usePagos(); adelantosPendientes = p.obtenerAdelantosPendientes().length; } catch (_) {}

  // ── Date anchors ──────────────────────────────────────────────────────
  const hoy          = toYMD(new Date());
  const inicioMes    = (() => { const d = new Date(); d.setDate(1); return toYMD(d); })();
  const inicioMesAnt = (() => { const d = new Date(); d.setDate(1); d.setMonth(d.getMonth() - 1); return toYMD(d); })();
  const finMesAnt    = (() => { const d = new Date(); d.setDate(0); return toYMD(d); })();

  const mesLabel = new Date().toLocaleDateString('es-CO', { month: 'long', year: 'numeric' });

  // ── KPIs ──────────────────────────────────────────────────────────────
  const kpis = useMemo(() => {
    const ing   = (arr: any[]) => arr.reduce((s, x) => s + (x.montoPagado ?? x.montoPactado ?? x.monto ?? 0), 0);
    const egr   = (arr: any[]) => arr.reduce((s, x) => s + (x.monto ?? 0), 0);

    const svMes    = serviciosFinalizados.filter(s => s.fecha >= inicioMes);
    const svMesAnt = serviciosFinalizados.filter(s => s.fecha >= inicioMesAnt && s.fecha <= finMesAnt);
    const gsMes    = gastosOperativos.filter((g: any) => (g.fecha || '').startsWith(inicioMes.slice(0, 7)));
    const gsMesAnt = gastosOperativos.filter((g: any) => (g.fecha || '').startsWith(inicioMesAnt.slice(0, 7)));

    const ingresosMes    = ing(svMes);
    const ingresosMesAnt = ing(svMesAnt);
    const egresosMes     = egr(gsMes);
    const egresosMesAnt  = egr(gsMesAnt);
    const balanceMes     = ingresosMes - egresosMes;

    const pctIng = ingresosMesAnt > 0 ? Math.round(((ingresosMes - ingresosMesAnt) / ingresosMesAnt) * 100) : (ingresosMes > 0 ? 100 : 0);
    const pctEgr = egresosMesAnt > 0 ? Math.round(((egresosMes - egresosMesAnt) / egresosMesAnt) * 100) : (egresosMes > 0 ? 100 : 0);

    return { ingresosMes, egresosMes, balanceMes, adelantosPendientes, pctIng, pctEgr };
  }, [serviciosFinalizados, gastosOperativos, adelantosPendientes, inicioMes, inicioMesAnt, finMesAnt]);

  // ── Weekly bar chart (last 8 weeks) ───────────────────────────────────
  const dataSemanal = useMemo(() => {
    return Array.from({ length: 8 }, (_, i) => {
      const lunes = addDays(new Date(), -(7 - i) * 7 + 1 - new Date().getDay());
      lunes.setHours(0, 0, 0, 0);
      const viernes = addDays(lunes, 6);
      const iStr = toYMD(lunes), fStr = toYMD(viernes);
      const label = lunes.toLocaleDateString('es-CO', { day: 'numeric', month: 'short' });
      const ingresos = serviciosFinalizados
        .filter(s => s.fecha >= iStr && s.fecha <= fStr)
        .reduce((s, x) => s + (x.montoPagado ?? x.montoPactado ?? 0), 0);
      const egresos = gastosOperativos
        .filter((g: any) => (g.fecha || '') >= iStr && (g.fecha || '') <= fStr)
        .reduce((s: number, g: any) => s + (g.monto ?? 0), 0);
      return { label, ingresos: Math.round(ingresos / 1000), egresos: Math.round(egresos / 1000) };
    });
  }, [serviciosFinalizados, gastosOperativos]);

  // ── Balance acumulado del mes (line chart) ────────────────────────────
  const dataBalance = useMemo(() => {
    const diasMes = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();
    let acum = 0;
    return Array.from({ length: diasMes }, (_, i) => {
      const dia = `${inicioMes.slice(0, 8)}${String(i + 1).padStart(2, '0')}`;
      if (dia > hoy) return { dia: String(i + 1), balance: null };
      const ing = serviciosFinalizados.filter(s => s.fecha === dia).reduce((s, x) => s + (x.montoPagado ?? x.montoPactado ?? 0), 0);
      const egr = gastosOperativos.filter((g: any) => (g.fecha || '') === dia).reduce((s: number, g: any) => s + (g.monto ?? 0), 0);
      acum += ing - egr;
      return { dia: String(i + 1), balance: Math.round(acum / 1000) };
    });
  }, [serviciosFinalizados, gastosOperativos, inicioMes, hoy]);

  // ── Export ────────────────────────────────────────────────────────────
  const exportarReporte = () => {
    const lineas = [
      `Reporte Financiero — ${mesLabel}`,
      ``,
      `Ingresos del mes:     $${fmtNum(Math.round(kpis.ingresosMes))}`,
      `Egresos del mes:      $${fmtNum(Math.round(kpis.egresosMes))}`,
      `Balance:              $${fmtNum(Math.round(kpis.balanceMes))}`,
      `Adelantos pendientes: ${kpis.adelantosPendientes}`,
    ];
    const blob = new Blob([lineas.join('\n')], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url;
    a.download = `reporte_${inicioMes}.txt`; a.click();
    URL.revokeObjectURL(url);
  };

  // ── Tooltip personalized ──────────────────────────────────────────────
  const tooltipStyle = {
    contentStyle: { background: '#111827', border: '1px solid rgba(201,169,97,0.25)', borderRadius: 8, fontSize: 12 },
    labelStyle: { color: COLOR_PRIMARY },
    itemStyle: { color: '#e8e6e3' },
  };

  return (
    <div className="min-h-screen w-full bg-background" style={{ fontFamily: 'Montserrat, sans-serif' }}>

      {/* ── Header Premium Fijo ── */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-card/98 backdrop-blur-premium border-b border-primary/15 shadow-premium">
        <div className="flex items-center justify-between px-3 sm:px-6 py-3 max-w-7xl mx-auto">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <LogoIsotipo size="sm" />
            <div>
              <div className="flex items-center gap-2">
                <Calculator className="w-4 h-4 text-primary" />
                <h1 className="text-base sm:text-lg font-bold text-primary uppercase tracking-wide truncate" style={{ fontFamily: 'Playfair Display, serif' }}>
                  Panel Contabilidad
                </h1>
                <Badge
                  className="hidden sm:flex text-[10px] border ml-2 h-5 bg-primary/10 text-primary border-primary/20"
                >
                  {mesLabel.charAt(0).toUpperCase() + mesLabel.slice(1)}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground hidden sm:block truncate max-w-[200px]">{userEmail}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline" size="sm"
              onClick={exportarReporte}
              className="hidden sm:flex h-9 text-xs border-primary/20 hover:bg-primary/10 text-muted-foreground hover:text-primary transition-all overflow-hidden"
            >
              <Download className="w-3.5 h-3.5 mr-1.5" />
              Exportar
            </Button>
            
            {onLogout && (
              <Button 
                onClick={onLogout}
                variant="ghost" 
                size="sm"
                className="hidden sm:flex border-primary/20 hover:bg-primary/10 text-red-400 hover:text-red-500 h-9"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Salir
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* ── Tabs ── */}
      <main className="pt-24 px-4 pb-12 max-w-7xl mx-auto">
        <Tabs value={tab} onValueChange={setTab} className="space-y-6">
          <TabsList className="bg-card/40 border border-primary/10 flex-wrap h-auto gap-1 p-1">
            <TabsTrigger value="resumen" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <BarChart3 className="w-4 h-4 mr-2" />
              Resumen
            </TabsTrigger>
            <TabsTrigger value="liquidaciones" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Receipt className="w-4 h-4 mr-2" />
              Liquidaciones
            </TabsTrigger>
            <TabsTrigger value="adelantos" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <CreditCard className="w-4 h-4 mr-2" />
              Adelantos
              {kpis.adelantosPendientes > 0 && (
                <Badge className="ml-2 h-4 px-1.5 text-[10px] bg-amber-500 text-black border-none">{kpis.adelantosPendientes}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="finanzas" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <DollarSign className="w-4 h-4 mr-2" />
              Pagos
            </TabsTrigger>
            <TabsTrigger value="gastos" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <TrendingDown className="w-4 h-4 mr-2" />
              Gastos
            </TabsTrigger>
            <TabsTrigger value="servicios-publicos" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Zap className="w-4 h-4 mr-2" />
              Serv. Públicos
            </TabsTrigger>
            <TabsTrigger value="analytics" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <PieChart className="w-4 h-4 mr-2" />
              Analytics
            </TabsTrigger>
          </TabsList>

          {/* ════════════════════ RESUMEN FINANCIERO ════════════════════ */}
          <TabsContent value="resumen" className="space-y-6">

            {/* KPI cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <KPICard
                icon={<TrendingUp className="w-4 h-4" />}
                label="Ingresos del mes"
                value={fmtCOP(kpis.ingresosMes)}
                raw={kpis.ingresosMes}
                cambio={kpis.pctIng}
                colorIcon={COLOR_INGRESO}
              />
              <KPICard
                icon={<TrendingDown className="w-4 h-4" />}
                label="Egresos del mes"
                value={fmtCOP(kpis.egresosMes)}
                raw={kpis.egresosMes}
                cambio={kpis.pctEgr}
                cambioInverted
                colorIcon={COLOR_EGRESO}
              />
              <KPICard
                icon={<DollarSign className="w-4 h-4" />}
                label="Balance neto"
                value={fmtCOP(kpis.balanceMes)}
                raw={kpis.balanceMes}
                colorIcon={kpis.balanceMes >= 0 ? COLOR_INGRESO : COLOR_EGRESO}
              />
              <KPICard
                icon={<CreditCard className="w-4 h-4" />}
                label="Adelantos pendientes"
                value={String(kpis.adelantosPendientes)}
                raw={kpis.adelantosPendientes}
                colorIcon={kpis.adelantosPendientes > 0 ? '#f59e0b' : '#6b7280'}
              />
            </div>

            {/* Bar chart: ingresos vs egresos por semana */}
            <Card className="border-white/10 bg-black/20">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold flex items-center gap-2" style={{ color: COLOR_PRIMARY }}>
                  <BarChart3 className="w-4 h-4" />
                  Ingresos vs Egresos — Últimas 8 semanas
                </CardTitle>
                <CardDescription className="text-xs">Valores en miles (COP)</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={dataSemanal} margin={{ top: 5, right: 5, left: -15, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#6b7280' }} tickLine={false} axisLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: '#6b7280' }} tickLine={false} axisLine={false} />
                    <Tooltip {...tooltipStyle} formatter={(v: number) => [`$${fmtNum(v)}k`]} />
                    <Legend wrapperStyle={{ fontSize: 11, color: '#9ca3af' }} />
                    <Bar dataKey="ingresos" name="Ingresos" fill={COLOR_INGRESO} fillOpacity={0.8} radius={[3, 3, 0, 0]} maxBarSize={24} />
                    <Bar dataKey="egresos"  name="Egresos"  fill={COLOR_EGRESO}  fillOpacity={0.8} radius={[3, 3, 0, 0]} maxBarSize={24} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Line chart: balance acumulado del mes */}
            <Card className="border-white/10 bg-black/20">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold flex items-center gap-2" style={{ color: COLOR_PRIMARY }}>
                  <TrendingUp className="w-4 h-4" />
                  Balance acumulado — {mesLabel.charAt(0).toUpperCase() + mesLabel.slice(1)}
                </CardTitle>
                <CardDescription className="text-xs">Valores en miles (COP)</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={180}>
                  <LineChart data={dataBalance} margin={{ top: 5, right: 10, left: -15, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="dia" tick={{ fontSize: 10, fill: '#6b7280' }} tickLine={false} axisLine={false} interval={4} />
                    <YAxis tick={{ fontSize: 10, fill: '#6b7280' }} tickLine={false} axisLine={false} />
                    <Tooltip {...tooltipStyle} formatter={(v: number) => [`$${fmtNum(v)}k`, 'Balance']} />
                    <Line
                      type="monotone" dataKey="balance"
                      stroke={COLOR_BALANCE} strokeWidth={2} dot={false}
                      connectNulls={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ══════════════ LIQUIDACIONES ══════════════ */}
          <TabsContent value="liquidaciones">
            <LiquidacionPanel userEmail={userEmail} />
          </TabsContent>

          {/* ══════════════ ADELANTOS ══════════════ */}
          <TabsContent value="adelantos">
            <GestionAdelantosPanel userEmail={userEmail} />
          </TabsContent>

          {/* ══════════════ PAGOS / FINANZAS ══════════════ */}
          <TabsContent value="finanzas">
            <FinanzasPanel serviciosFinalizados={serviciosFinalizados} />
          </TabsContent>

          {/* ══════════════ GASTOS ══════════════ */}
          <TabsContent value="gastos">
            <GastosOperativosPanel userEmail={userEmail} />
          </TabsContent>

          {/* ══════════════ SERVICIOS PÚBLICOS ══════════════ */}
          <TabsContent value="servicios-publicos">
            <ServiciosPublicosPanel />
          </TabsContent>

          {/* ══════════════ ANALYTICS ══════════════ */}
          <TabsContent value="analytics">
            <AnalyticsPanel rol="admin" />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

// ─── KPICard ─────────────────────────────────────────────────────────────────
interface KPICardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  raw: number;
  cambio?: number;
  cambioInverted?: boolean;
  colorIcon?: string;
}

function KPICard({ icon, label, value, raw, cambio, cambioInverted, colorIcon = COLOR_PRIMARY }: KPICardProps) {
  const isPositive = cambio !== undefined && (cambioInverted ? cambio < 0 : cambio > 0);
  const isNegative = cambio !== undefined && (cambioInverted ? cambio > 0 : cambio < 0);
  const Icon = cambio === undefined || cambio === 0 ? Minus : isPositive ? TrendingUp : TrendingDown;
  const textColor = raw < 0 ? '#ef4444' : raw > 0 ? '#e8e6e3' : '#6b7280';

  return (
    <Card className="border-white/10 bg-black/20">
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-2">
          <span style={{ color: colorIcon }}>{icon}</span>
          <span className="text-[11px] text-gray-400 leading-tight">{label}</span>
        </div>
        <div className="text-2xl font-bold mb-1" style={{ color: textColor }}>{value}</div>
        {cambio !== undefined && (
          <div className={`flex items-center gap-1 text-[10px] mt-1 ${isPositive ? 'text-green-400' : isNegative ? 'text-red-400' : 'text-gray-500'}`}>
            <Icon className="w-3 h-3" />
            <span>{cambio > 0 ? '+' : ''}{cambio}% vs mes anterior</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
