import { useState, useEffect } from 'react';
import {
  ConciergeBell, DoorOpen, UserCheck, Calendar, Bell, LogOut,
  Clock, CheckCircle, XCircle, AlertCircle, Users,
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { LogoIsotipo } from './LogoIsotipo';
import { AsistenciaPanel } from './AsistenciaPanel';
import { SolicitudesEntradaPanel } from '../../components/SolicitudesEntradaPanel';
import { HabitacionesPanel } from '../../components/HabitacionesPanel';
import { HistorialClientesPanel } from '../../components/HistorialClientesPanel';
import { NotificacionesPanel } from './NotificacionesPanel';
import { useAgendamientos, Agendamiento, formatearFecha, formatearHora } from './AgendamientosContext';
import { supabase } from '../../utils/supabase/info';
import { AgendamientosPanel } from './AgendamientosPanel';
import { AgendamientosMetrics } from './AgendamientosMetrics';

interface RecepcionistaDashboardProps {
  userId: string;
  userEmail: string;
  onLogout?: () => void;
}

const COLOR_PRIMARY = '#c9a961';

const ESTADO_CONFIG: Record<Agendamiento['estado'], { label: string; color: string; icon: React.ReactNode }> = {
  pendiente:  { label: 'Pendiente',  color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30', icon: <Clock className="w-3 h-3" /> },
  confirmado: { label: 'Confirmado', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30',       icon: <CheckCircle className="w-3 h-3" /> },
  completado: { label: 'Completado', color: 'bg-green-500/20 text-green-400 border-green-500/30',    icon: <CheckCircle className="w-3 h-3" /> },
  cancelado:  { label: 'Cancelado',  color: 'bg-red-500/20 text-red-400 border-red-500/30',          icon: <XCircle className="w-3 h-3" /> },
  no_show:    { label: 'No Show',    color: 'bg-gray-500/20 text-gray-400 border-gray-500/30',       icon: <AlertCircle className="w-3 h-3" /> },
};

// ── Agenda del día ────────────────────────────────────────────────────────────
function AgendaDiaPanel() {
  let agendamientos: Agendamiento[] = [];
  try { const ctx = useAgendamientos(); agendamientos = ctx.agendamientos ?? []; } catch (_) {}

  const hoy = new Date().toISOString().split('T')[0];
  const agendamientosHoy = agendamientos
    .filter(a => a.fecha === hoy)
    .sort((a, b) => a.hora.localeCompare(b.hora));

  const pendientes  = agendamientosHoy.filter(a => a.estado === 'pendiente' || a.estado === 'confirmado').length;
  const completados = agendamientosHoy.filter(a => a.estado === 'completado').length;
  const cancelados  = agendamientosHoy.filter(a => a.estado === 'cancelado'  || a.estado === 'no_show').length;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        <Card className="border-yellow-500/20 bg-yellow-500/5">
          <CardHeader className="pb-1 pt-4 px-4">
            <CardDescription className="text-xs">Pendientes</CardDescription>
            <CardTitle className="text-3xl text-yellow-400">{pendientes}</CardTitle>
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
            <CardDescription className="text-xs">Cancelados</CardDescription>
            <CardTitle className="text-3xl text-red-400">{cancelados}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Card className="border-white/10 bg-black/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base" style={{ color: COLOR_PRIMARY }}>
            <Calendar className="w-4 h-4" />
            Citas de Hoy
            <Badge className="ml-2 bg-white/10 text-gray-300 text-xs border-white/10">{agendamientosHoy.length}</Badge>
          </CardTitle>
          <CardDescription>
            {new Date().toLocaleDateString('es-CO', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {agendamientosHoy.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Calendar className="w-12 h-12 mx-auto mb-3 opacity-20" />
              <p className="text-sm">No hay citas agendadas para hoy</p>
            </div>
          ) : (
            <div className="space-y-2">
              {agendamientosHoy.map(ag => {
                const cfg = ESTADO_CONFIG[ag.estado];
                return (
                  <div
                    key={ag.id}
                    className="flex items-center gap-3 p-3 rounded-lg border border-white/5 bg-white/[0.02] hover:bg-white/[0.04] transition-colors"
                  >
                    <div className="flex-shrink-0 w-20 text-center">
                      <span className="text-base font-bold" style={{ color: COLOR_PRIMARY }}>{formatearHora(ag.hora)}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">{ag.clienteNombre}</p>
                      <p className="text-xs text-gray-400 truncate">
                        con <span className="text-gray-300">{ag.modeloNombre}</span>
                        {ag.tipoServicio && <span className="ml-2 text-gray-500">· {ag.tipoServicio}</span>}
                      </p>
                    </div>
                    <div className="flex-shrink-0 text-xs text-gray-500 hidden sm:block">
                      {ag.duracionMinutos} min
                    </div>
                    <Badge className={`flex-shrink-0 flex items-center gap-1 text-xs border ${cfg.color}`}>
                      {cfg.icon}
                      {cfg.label}
                    </Badge>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ── Main Dashboard ────────────────────────────────────────────────────────────
export function RecepcionistaDashboard({ userId, userEmail, onLogout }: RecepcionistaDashboardProps) {
  const [tab, setTab]                                        = useState('solicitudes');
  const [horaActual, setHoraActual]                          = useState('');
  const [fechaActual, setFechaActual]                        = useState('');
  const [habitacionesDisponibles, setHabitacionesDisponibles] = useState<number | null>(null);
  const [solicitudesPendientes, setSolicitudesPendientes]     = useState(0);

  // ── Reloj en tiempo real ──────────────────────────────────────────────
  useEffect(() => {
    const actualizar = () => {
      const ahora = new Date();
      setHoraActual(ahora.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' }));
      setFechaActual(ahora.toLocaleDateString('es-CO', { weekday: 'short', day: 'numeric', month: 'short' }));
    };
    actualizar();
    const interval = setInterval(actualizar, 60_000);
    return () => clearInterval(interval);
  }, []);

  // ── Habitaciones disponibles (Realtime) ──────────────────────────────
  useEffect(() => {
    let mounted = true;
    const cargar = async () => {
      try {
        const { count } = await supabase
          .from('habitaciones')
          .select('*', { count: 'exact', head: true })
          .eq('estado', 'disponible');
        if (mounted && count !== null) setHabitacionesDisponibles(count);
      } catch (_) {}
    };
    cargar();

    // ✅ REALTIME: actualizar habitaciones disponibles sin polling
    const channel = supabase
      .channel('recep_habitaciones_rt')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'habitaciones' }, cargar)
      .subscribe();

    return () => { mounted = false; supabase.removeChannel(channel); };
  }, []);

  // ── Solicitudes pendientes ────────────────────────────────────────────
  useEffect(() => {
    let mounted = true;
    const cargar = async () => {
      try {
        const { count } = await supabase
          .from('solicitudes_entrada')
          .select('*', { count: 'exact', head: true })
          .eq('estado', 'pendiente');
        if (mounted && count !== null) setSolicitudesPendientes(count);
      } catch (_) {}
    };
    cargar();
    const channel = supabase
      .channel('recep_solicitudes_rt')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'solicitudes_entrada' }, cargar)
      .subscribe();
    return () => { mounted = false; supabase.removeChannel(channel); };
  }, []);

  return (
    <div className="min-h-screen w-full bg-background" style={{ fontFamily: 'Montserrat, sans-serif' }}>

      {/* ── Header Premium Fijo ── */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-card/98 backdrop-blur-premium border-b border-primary/15 shadow-premium">
        <div className="flex items-center justify-between px-3 sm:px-6 py-3 max-w-7xl mx-auto">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <LogoIsotipo size="sm" />
            <div>
              <div className="flex items-center gap-2">
                <ConciergeBell className="w-4 h-4 text-primary" />
                <h1 className="text-base sm:text-lg font-bold text-primary uppercase tracking-wide truncate" style={{ fontFamily: 'Playfair Display, serif' }}>
                  Panel Recepción
                </h1>
              </div>
              <p className="text-xs text-muted-foreground hidden sm:block truncate max-w-[200px]">{userEmail}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Reloj y Hab. */}
            <div className="hidden lg:flex items-center gap-4 border-l border-primary/10 ml-2 pl-4">
              {horaActual && (
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Clock className="w-3.5 h-3.5 text-primary" />
                  <span className="capitalize">{fechaActual}</span>
                  <span className="font-bold text-primary">{horaActual}</span>
                </div>
              )}

              {habitacionesDisponibles !== null && (
                <div
                  className="flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-medium"
                  style={{
                    background: habitacionesDisponibles > 0 ? 'rgba(34,197,94,0.08)' : 'rgba(239,68,68,0.08)',
                    borderColor: habitacionesDisponibles > 0 ? 'rgba(34,197,94,0.25)' : 'rgba(239,68,68,0.25)',
                    color: habitacionesDisponibles > 0 ? '#4ade80' : '#f87171',
                  }}
                >
                  <DoorOpen className="w-3 h-3" />
                  <span>{habitacionesDisponibles} hab. libres</span>
                </div>
              )}
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

      {/* ── Content ── */}
      <main className="pt-24 px-4 pb-12 max-w-7xl mx-auto">
        <Tabs value={tab} onValueChange={setTab} className="space-y-6">
          <TabsList className="bg-card/40 border border-primary/10 flex-wrap h-auto gap-1 p-1">
            <TabsTrigger value="solicitudes" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <ConciergeBell className="w-4 h-4 mr-2" />
              Solicitudes
              {solicitudesPendientes > 0 && (
                <Badge className="ml-2 h-4 px-1.5 text-[10px] bg-amber-500 text-black border-none">{solicitudesPendientes}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="habitaciones" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <DoorOpen className="w-4 h-4 mr-2" />
              Habitaciones
            </TabsTrigger>
            <TabsTrigger value="agenda" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Calendar className="w-4 h-4 mr-2" />
              Agenda del día
            </TabsTrigger>
            <TabsTrigger value="agendamientos" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Calendar className="w-4 h-4 mr-2" />
              Agendamientos
            </TabsTrigger>
            <TabsTrigger value="asistencia" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <UserCheck className="w-4 h-4 mr-2" />
              Asistencia
            </TabsTrigger>
            <TabsTrigger value="clientes" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Users className="w-4 h-4 mr-2" />
              Clientes
            </TabsTrigger>
            <TabsTrigger value="notificaciones" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Bell className="w-4 h-4 mr-2" />
              Notificaciones
            </TabsTrigger>
          </TabsList>

          <TabsContent value="solicitudes" className="mt-0">
            <SolicitudesEntradaPanel userEmail={userEmail} />
          </TabsContent>

          <TabsContent value="habitaciones" className="mt-0">
            <HabitacionesPanel />
          </TabsContent>

          <TabsContent value="agenda" className="mt-0">
            <AgendaDiaPanel />
          </TabsContent>

          <TabsContent value="agendamientos" className="mt-0">
            <div className="space-y-4">
              <AgendamientosMetrics rol="recepcionista" />
              <AgendamientosPanel rol="recepcionista" userEmail={userEmail} />
            </div>
          </TabsContent>

          <TabsContent value="asistencia" className="mt-0">
            <AsistenciaPanel userRole="admin" userEmail={userEmail} />
          </TabsContent>

          <TabsContent value="clientes" className="mt-0">
            <HistorialClientesPanel />
          </TabsContent>

          <TabsContent value="notificaciones" className="mt-0">
            <NotificacionesPanel />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
