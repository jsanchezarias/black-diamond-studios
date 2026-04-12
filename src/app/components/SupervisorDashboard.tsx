import { useState, useEffect } from 'react';
import {
  Eye, UserCheck, Bell, LogOut, Activity, Clock,
  DollarSign, Users, ClipboardList, PieChart, TrendingUp,
  CheckCircle,
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { LogoIsotipo } from './LogoIsotipo';
import { AnalyticsPanel } from './AnalyticsPanel';
import { AsistenciaPanel } from './AsistenciaPanel';
import { RendimientoModelosPanel } from '../../components/RendimientoModelosPanel';
import { SolicitudesEntradaPanel } from '../../components/SolicitudesEntradaPanel';
import { NotificacionesPanel } from './NotificacionesPanel';
import { useAgendamientos, Agendamiento } from './AgendamientosContext';
import { useServicios, Servicio } from './ServiciosContext';
import { useModelos } from './ModelosContext';
import { supabase } from '../../utils/supabase/info';

interface SupervisorDashboardProps {
  userEmail: string;
  onLogout?: () => void;
}

const COLOR_PRIMARY = '#c9a961';

const TIPO_COLOR: Record<string, string> = {
  sede:      'bg-blue-500/20 text-blue-400 border-blue-500/30',
  domicilio: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
};

const ESTADO_COLOR: Record<string, string> = {
  completado: 'bg-green-500/20 text-green-400 border-green-500/30',
  cancelado:  'bg-red-500/20 text-red-400 border-red-500/30',
  no_show:    'bg-gray-500/20 text-gray-400 border-gray-500/30',
  pendiente:  'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  confirmado: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
};

// ─── Vista General ────────────────────────────────────────────────────────────
function VistaGeneralPanel() {
  let agendamientos: Agendamiento[] = [];
  let servicios: Servicio[]         = [];
  let modelosActivasCtx             = 0;

  try { agendamientos   = useAgendamientos().agendamientos ?? []; } catch (_) {}
  try { servicios       = useServicios().servicios ?? []; } catch (_) {}
  try { modelosActivasCtx = useModelos().modelos?.filter(m => m.activa).length ?? 0; } catch (_) {}

  const hoy = new Date().toISOString().split('T')[0];

  const agendamientosHoy = agendamientos.filter(a => a.fecha === hoy);
  const completadosHoy   = agendamientosHoy.filter(a => a.estado === 'completado').length;
  const ingresosHoy      = servicios
    .filter(s => s.estado === 'completado' && s.fecha === hoy)
    .reduce((sum, s) => sum + (s.montoPagado ?? s.montoPactado ?? 0), 0);

  const recentActivity = agendamientos
    .slice()
    .sort((a, b) => (b.fechaCreacion ?? b.fecha ?? '').localeCompare(a.fechaCreacion ?? a.fecha ?? ''))
    .slice(0, 8);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="border-white/10 bg-black/20">
          <CardHeader className="pb-1 pt-4 px-4">
            <CardDescription className="text-xs flex items-center gap-1"><Users className="w-3 h-3" /> Modelos activas</CardDescription>
            <CardTitle className="text-3xl" style={{ color: COLOR_PRIMARY }}>{modelosActivasCtx}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-white/10 bg-black/20">
          <CardHeader className="pb-1 pt-4 px-4">
            <CardDescription className="text-xs flex items-center gap-1"><Clock className="w-3 h-3" /> Citas hoy</CardDescription>
            <CardTitle className="text-3xl" style={{ color: COLOR_PRIMARY }}>{agendamientosHoy.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-green-500/20 bg-green-500/5">
          <CardHeader className="pb-1 pt-4 px-4">
            <CardDescription className="text-xs flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Completados</CardDescription>
            <CardTitle className="text-3xl text-green-400">{completadosHoy}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-white/10 bg-black/20">
          <CardHeader className="pb-1 pt-4 px-4">
            <CardDescription className="text-xs flex items-center gap-1"><DollarSign className="w-3 h-3" /> Ingresos hoy</CardDescription>
            <CardTitle className="text-2xl" style={{ color: COLOR_PRIMARY }}>
              ${ingresosHoy >= 1_000_000
                ? `${(ingresosHoy / 1_000_000).toFixed(1)}M`
                : `${(ingresosHoy / 1_000).toFixed(0)}k`}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Card className="border-white/10 bg-black/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base" style={{ color: COLOR_PRIMARY }}>
            <Activity className="w-4 h-4" />
            Actividad reciente
          </CardTitle>
          <CardDescription className="text-xs">Últimos agendamientos registrados</CardDescription>
        </CardHeader>
        <CardContent>
          {recentActivity.length === 0 ? (
            <div className="text-center py-10 text-gray-500">
              <Activity className="w-10 h-10 mx-auto mb-2 opacity-20" />
              <p className="text-sm">Sin actividad reciente</p>
            </div>
          ) : (
            <div className="space-y-2">
              {recentActivity.map(a => (
                <div key={a.id} className="flex items-center gap-3 p-2.5 rounded-lg border border-white/5 bg-white/[0.02]">
                  <div className="flex-shrink-0 w-14 text-center">
                    <span className="text-xs font-bold" style={{ color: COLOR_PRIMARY }}>{a.hora}</span>
                    <div className="text-[10px] text-gray-500">
                      {new Date(a.fecha + 'T00:00:00').toLocaleDateString('es-CO', { day: 'numeric', month: 'short' })}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white truncate">{a.clienteNombre}</p>
                    <p className="text-xs text-gray-400 truncate">con {a.modeloNombre}</p>
                  </div>
                  <Badge className={`flex-shrink-0 text-xs border ${ESTADO_COLOR[a.estado] ?? 'bg-white/10 text-gray-400 border-white/10'}`}>
                    {a.estado === 'no_show' ? 'No Show' : a.estado.charAt(0).toUpperCase() + a.estado.slice(1)}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Servicios activos (agendamientos confirmados/pendientes de HOY) ──────────
function ServiciosActivosPanel() {
  let agendamientos: Agendamiento[] = [];
  try { agendamientos = useAgendamientos().agendamientos ?? []; } catch (_) {}

  const hoy     = new Date().toISOString().split('T')[0];
  const activos = agendamientos
    .filter(a => a.fecha === hoy && (a.estado === 'confirmado' || a.estado === 'pendiente'))
    .sort((a, b) => a.hora.localeCompare(b.hora));

  return (
    <Card className="border-white/10 bg-black/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base" style={{ color: COLOR_PRIMARY }}>
          <Activity className="w-4 h-4" />
          Citas activas hoy
          <Badge className="ml-2 bg-white/10 text-gray-300 text-xs border-white/10">{activos.length}</Badge>
        </CardTitle>
        <CardDescription className="text-xs">
          Pendientes y confirmadas de hoy en tiempo real
        </CardDescription>
      </CardHeader>
      <CardContent>
        {activos.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <Activity className="w-12 h-12 mx-auto mb-3 opacity-20" />
            <p className="text-sm">No hay citas activas en este momento</p>
          </div>
        ) : (
          <div className="space-y-2">
            {activos.map(a => (
              <div key={a.id} className="flex items-center gap-3 p-3 rounded-lg border border-white/5 bg-white/[0.02] hover:bg-white/[0.04] transition-colors">
                <div className="flex-shrink-0 w-14 text-center">
                  <span className="text-base font-bold" style={{ color: COLOR_PRIMARY }}>{a.hora}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{a.clienteNombre}</p>
                  <p className="text-xs text-gray-400 truncate">
                    con <span className="text-gray-300">{a.modeloNombre}</span>
                    {a.tipoServicio && (
                      <Badge className={`ml-2 text-[10px] border hidden sm:inline-flex ${TIPO_COLOR[a.tipoServicio] ?? 'bg-white/10 text-gray-400 border-white/10'}`}>
                        {a.tipoServicio}
                      </Badge>
                    )}
                  </p>
                </div>
                <div className="flex-shrink-0 text-xs text-gray-500 hidden sm:block">{a.duracionMinutos} min</div>
                <Badge className={`flex-shrink-0 text-xs border ${ESTADO_COLOR[a.estado] ?? 'bg-white/10 text-gray-400 border-white/10'}`}>
                  {a.estado.charAt(0).toUpperCase() + a.estado.slice(1)}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Servicios del día (completados/finalizados) ──────────────────────────────
function ServiciosHoyPanel() {
  let servicios: Servicio[] = [];
  try { servicios = useServicios().servicios ?? []; } catch (_) {}

  const hoy          = new Date().toISOString().split('T')[0];
  const serviciosHoy = servicios
    .filter(s => s.fecha === hoy)
    .sort((a, b) => (a.hora ?? '').localeCompare(b.hora ?? ''));

  const completados = serviciosHoy.filter(s => s.estado === 'completado').length;
  const cancelados  = serviciosHoy.filter(s => s.estado === 'cancelado' || s.estado === 'no_show').length;
  const ingresosDia = serviciosHoy
    .filter(s => s.estado === 'completado')
    .reduce((sum, s) => sum + (s.montoPagado ?? s.montoPactado ?? 0), 0);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="border-white/10 bg-black/20">
          <CardHeader className="pb-1 pt-4 px-4">
            <CardDescription className="text-xs">Total hoy</CardDescription>
            <CardTitle className="text-3xl" style={{ color: COLOR_PRIMARY }}>{serviciosHoy.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-green-500/20 bg-green-500/5">
          <CardHeader className="pb-1 pt-4 px-4">
            <CardDescription className="text-xs">Completados</CardDescription>
            <CardTitle className="text-3xl text-green-400">{completados}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-red-500/20 bg-red-500/5">
          <CardHeader className="pb-1 pt-4 px-4">
            <CardDescription className="text-xs">Cancelados / No Show</CardDescription>
            <CardTitle className="text-3xl text-red-400">{cancelados}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-white/10 bg-black/20">
          <CardHeader className="pb-1 pt-4 px-4">
            <CardDescription className="text-xs flex items-center gap-1"><DollarSign className="w-3 h-3" /> Ingresos</CardDescription>
            <CardTitle className="text-2xl" style={{ color: COLOR_PRIMARY }}>
              ${ingresosDia >= 1_000_000 ? `${(ingresosDia / 1_000_000).toFixed(1)}M` : `${(ingresosDia / 1_000).toFixed(0)}k`}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Card className="border-white/10 bg-black/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base" style={{ color: COLOR_PRIMARY }}>
            <Clock className="w-4 h-4" />
            Servicios del Día
            <Badge className="ml-2 bg-white/10 text-gray-300 text-xs border-white/10">{serviciosHoy.length}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {serviciosHoy.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Activity className="w-12 h-12 mx-auto mb-3 opacity-20" />
              <p className="text-sm">No hay servicios registrados hoy</p>
            </div>
          ) : (
            <div className="space-y-2">
              {serviciosHoy.map(s => (
                <div key={s.id} className="flex items-center gap-3 p-3 rounded-lg border border-white/5 bg-white/[0.02] hover:bg-white/[0.04] transition-colors">
                  <div className="flex-shrink-0 w-14 text-center">
                    <span className="text-base font-bold" style={{ color: COLOR_PRIMARY }}>{s.hora ?? '--:--'}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{s.clienteNombre}</p>
                    <p className="text-xs text-gray-400 truncate">con <span className="text-gray-300">{s.modeloNombre}</span></p>
                  </div>
                  <div className="flex-shrink-0 text-sm font-medium hidden sm:block" style={{ color: COLOR_PRIMARY }}>
                    ${((s.montoPagado ?? s.montoPactado ?? 0) / 1000).toFixed(0)}k
                  </div>
                  {s.tipoServicio && (
                    <Badge className={`flex-shrink-0 text-xs border hidden md:flex ${TIPO_COLOR[s.tipoServicio] ?? 'bg-white/10 text-gray-400 border-white/10'}`}>
                      {s.tipoServicio}
                    </Badge>
                  )}
                  <Badge className={`flex-shrink-0 text-xs border ${ESTADO_COLOR[s.estado] ?? 'bg-white/10 text-gray-400 border-white/10'}`}>
                    {s.estado === 'no_show' ? 'No Show' : s.estado.charAt(0).toUpperCase() + s.estado.slice(1)}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────
export function SupervisorDashboard({ userEmail, onLogout }: SupervisorDashboardProps) {
  const [tab, setTab]                       = useState('general');
  const [modelosActivas, setModelosActivas]   = useState<number | null>(null);
  const [estadoOps, setEstadoOps]             = useState<'ok' | 'alerta' | 'cargando'>('cargando');

  // ── Estado operacional ────────────────────────────────────────────────
  useEffect(() => {
    let mounted = true;
    const verificar = async () => {
      try {
        const { count } = await supabase
          .from('solicitudes_entrada')
          .select('*', { count: 'exact', head: true })
          .eq('estado', 'pendiente');
        if (!mounted) return;
        setEstadoOps(count !== null && count > 5 ? 'alerta' : 'ok');
      } catch (_) {
        if (mounted) setEstadoOps('ok');
      }
    };
    verificar();
    const interval = setInterval(verificar, 60_000);
    return () => { mounted = false; clearInterval(interval); };
  }, []);

  // ── Modelos activas ───────────────────────────────────────────────────
  useEffect(() => {
    let mounted = true;
    supabase
      .from('modelos')
      .select('*', { count: 'exact', head: true })
      .eq('activa', true)
      .then(({ count }) => { if (mounted && count !== null) setModelosActivas(count); });
    return () => { mounted = false; };
  }, []);

  const estadoStyle =
    estadoOps === 'ok'      ? { bg: 'rgba(34,197,94,0.08)',   border: 'rgba(34,197,94,0.25)',   text: '#4ade80',  label: 'Operaciones normales', dot: 'bg-green-400' }
    : estadoOps === 'alerta' ? { bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.25)', text: '#fbbf24', label: 'Atención requerida',  dot: 'bg-amber-400 animate-pulse' }
    :                          { bg: 'rgba(107,114,128,0.08)', border: 'rgba(107,114,128,0.25)', text: '#9ca3af', label: 'Verificando…',        dot: 'bg-gray-400' };

  return (
    <div className="min-h-screen w-full bg-background" style={{ fontFamily: 'Montserrat, sans-serif' }}>

      {/* ── Header Premium Fijo ── */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-card/98 backdrop-blur-premium border-b border-primary/15 shadow-premium">
        <div className="flex items-center justify-between px-3 sm:px-6 py-3 max-w-7xl mx-auto">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <LogoIsotipo size="sm" />
            <div>
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-primary" />
                <h1 className="text-base sm:text-lg font-bold text-primary uppercase tracking-wide truncate" style={{ fontFamily: 'Playfair Display, serif' }}>
                  Panel Supervisión
                </h1>
              </div>
              <p className="text-xs text-muted-foreground hidden sm:block truncate max-w-[200px]">{userEmail}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Status Indicators */}
            <div className="hidden lg:flex items-center gap-4 border-l border-primary/10 ml-2 pl-4">
              {modelosActivas !== null && (
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Users className="w-3.5 h-3.5 text-primary" />
                  <span>{modelosActivas} modelos activas</span>
                </div>
              )}

              <div
                className="flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-medium"
                style={{ background: estadoStyle.bg, borderColor: estadoStyle.border, color: estadoStyle.text }}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${estadoStyle.dot}`} />
                <span>{estadoStyle.label}</span>
              </div>
            </div>

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
            <TabsTrigger value="general" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <TrendingUp className="w-4 h-4 mr-2" />
              Vista General
            </TabsTrigger>
            <TabsTrigger value="activos" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Activity className="w-4 h-4 mr-2" />
              En Curso
            </TabsTrigger>
            <TabsTrigger value="servicios" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Clock className="w-4 h-4 mr-2" />
              Servicios del Día
            </TabsTrigger>
            <TabsTrigger value="modelos" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Users className="w-4 h-4 mr-2" />
              Modelos
            </TabsTrigger>
            <TabsTrigger value="asistencia" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <UserCheck className="w-4 h-4 mr-2" />
              Asistencia
            </TabsTrigger>
            <TabsTrigger value="operaciones" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <ClipboardList className="w-4 h-4 mr-2" />
              Operaciones
            </TabsTrigger>
            <TabsTrigger value="analytics" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <PieChart className="w-4 h-4 mr-2" />
              Analytics
            </TabsTrigger>
            <TabsTrigger value="notificaciones" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Bell className="w-4 h-4 mr-2" />
              Notificaciones
            </TabsTrigger>
          </TabsList>

          <TabsContent value="general">
            <VistaGeneralPanel />
          </TabsContent>
          <TabsContent value="activos">
            <ServiciosActivosPanel />
          </TabsContent>
          <TabsContent value="servicios">
            <ServiciosHoyPanel />
          </TabsContent>
          <TabsContent value="modelos">
            <RendimientoModelosPanel />
          </TabsContent>
          <TabsContent value="asistencia">
            <AsistenciaPanel userRole="admin" userEmail={userEmail} />
          </TabsContent>
          <TabsContent value="operaciones">
            <SolicitudesEntradaPanel userEmail={userEmail} />
          </TabsContent>
          <TabsContent value="analytics">
            <AnalyticsPanel rol="admin" />
          </TabsContent>
          <TabsContent value="notificaciones">
            <NotificacionesPanel />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
