import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell,
} from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import {
  MessageSquare, Calendar, Users, Clock, Download,
  ChevronLeft, ChevronRight, Activity, TrendingUp,
  TrendingDown, Minus, AlertCircle, BarChart3, RefreshCw,
} from 'lucide-react';
import { supabase } from '../utils/supabase/info';
import { useAgendamientos } from '../app/components/AgendamientosContext';

// ─── Types ────────────────────────────────────────────────────────────────────
interface ProgramadorAnalyticsPanelProps {
  userEmail: string;
  userId: string;
}

interface MensajeRaw {
  id: string;
  created_at: string;
  sender_id: string;
  receiver_id: string | null;
  role: string;
  message: string;
  sender?: { nombre?: string; email?: string } | null;
}

// ─── Module-level helpers ─────────────────────────────────────────────────────
const COLOR_PRIMARY  = '#c9a961';
const COLOR_PEAK     = '#f59e0b';

function getWeekMonday(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function weekMondayNWeeksAgo(n: number): Date {
  const d = getWeekMonday(new Date());
  d.setDate(d.getDate() - n * 7);
  return d;
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function toYMD(date: Date): string {
  return date.toISOString().split('T')[0];
}

function fmtCorto(iso: string) {
  return new Date(iso + 'T00:00:00').toLocaleDateString('es-CO', {
    day: 'numeric', month: 'short',
  });
}

function fmtNum(num: number): string {
  return num.toLocaleString('es-CO');
}

// ─── Component ────────────────────────────────────────────────────────────────
export function ProgramadorAnalyticsPanel({ userEmail, userId }: ProgramadorAnalyticsPanelProps) {
  const [loading, setLoading]             = useState(true);
  const [mensajes, setMensajes]           = useState<MensajeRaw[]>([]);
  const [filtroPeriodo, setFiltroPeriodo] = useState<'hoy' | 'semana' | 'mes'>('semana');
  const [busqueda, setBusqueda]           = useState('');
  const [pagAgs, setPagAgs]               = useState(0);
  const [pagChats, setPagChats]           = useState(0);
  const POR_PAGINA = 10;

  const { agendamientos } = useAgendamientos();

  // ── Fetch ──────────────────────────────────────────────────────────────
  const cargar = useCallback(async () => {
    setLoading(true);
    try {
      const desde = new Date();
      desde.setDate(desde.getDate() - 90);
      const { data, error } = await supabase
        .from('chat_mensajes_publicos')
        .select('id, created_at, sender_id, receiver_id, role, message, sender:sender_id(nombre, email)')
        .gte('created_at', desde.toISOString())
        .order('created_at', { ascending: true });

      if (!error && data) setMensajes(data as MensajeRaw[]);
    } catch (_) {
      // silent — empty state handles it
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  // ── Date anchors ───────────────────────────────────────────────────────
  const hoy          = useMemo(() => toYMD(new Date()), []);
  const inicioSemana = useMemo(() => toYMD(weekMondayNWeeksAgo(0)), []);
  const inicioMes    = useMemo(() => {
    const d = new Date();
    d.setDate(1);
    return toYMD(d);
  }, []);

  // ── Derived collections ────────────────────────────────────────────────
  const misMensajes = useMemo(
    () => mensajes.filter(m => m.role === 'programador'),
    [mensajes],
  );

  const misAgendamientos = useMemo(
    () => agendamientos
      .filter(a => a.creadoPor === userEmail)
      .sort((a, b) => {
        const ta = new Date(`${a.fecha}T${a.hora}`).getTime();
        const tb = new Date(`${b.fecha}T${b.hora}`).getTime();
        return tb - ta;
      }),
    [agendamientos, userEmail],
  );

  // ── KPIs ───────────────────────────────────────────────────────────────
  const kpis = useMemo(() => {
    const msgHoy    = misMensajes.filter(m => m.created_at.startsWith(hoy)).length;
    const msgSemana = misMensajes.filter(m => m.created_at >= inicioSemana).length;
    const msgMes    = misMensajes.filter(m => m.created_at >= inicioMes).length;

    // Previous week for delta
    const inicioSemAnt = toYMD(weekMondayNWeeksAgo(1));
    const msgSemAnt    = misMensajes.filter(m => m.created_at >= inicioSemAnt && m.created_at < inicioSemana).length;

    // Agendamientos
    const agsHoy    = misAgendamientos.filter(a => (a.fechaCreacion ?? a.fecha)?.startsWith(hoy)).length;
    const agsSemana = misAgendamientos.filter(a => (a.fechaCreacion ?? a.fecha) >= inicioSemana).length;
    const agsMes    = misAgendamientos.filter(a => (a.fechaCreacion ?? a.fecha) >= inicioMes).length;

    // Unique clients this week (incoming messages)
    const clientesSemana = new Set(
      mensajes
        .filter(m => m.role !== 'programador' && m.created_at >= inicioSemana)
        .map(m => m.sender_id),
    ).size;

    // Unanswered: clients who wrote in last 2 h with no programador reply after
    const hace2h = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
    const recientes = new Set(
      mensajes.filter(m => m.role !== 'programador' && m.created_at >= hace2h).map(m => m.sender_id),
    );
    const respondidos = new Set(
      mensajes.filter(m => m.role === 'programador' && m.created_at >= hace2h && m.receiver_id)
              .map(m => m.receiver_id as string),
    );
    const sinResponder = [...recientes].filter(id => !respondidos.has(id)).length;

    const cambioSemana = msgSemAnt > 0
      ? Math.round(((msgSemana - msgSemAnt) / msgSemAnt) * 100)
      : msgSemana > 0 ? 100 : 0;

    return { msgHoy, msgSemana, msgMes, agsHoy, agsSemana, agsMes, clientesSemana, sinResponder, cambioSemana };
  }, [misMensajes, mensajes, misAgendamientos, hoy, inicioSemana, inicioMes]);

  // ── Daily activity — last 30 days ──────────────────────────────────────
  const actividadDiaria = useMemo(() => {
    const hace30 = addDays(new Date(), -29);
    const dias: Record<string, number> = {};
    for (let i = 0; i < 30; i++) {
      dias[toYMD(addDays(hace30, i))] = 0;
    }
    misMensajes
      .filter(m => m.created_at >= hace30.toISOString())
      .forEach(m => {
        const d = m.created_at.split('T')[0];
        if (d in dias) dias[d]++;
      });
    return Object.entries(dias)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([fecha, mensajes]) => ({ fecha, label: fmtCorto(fecha), mensajes }));
  }, [misMensajes]);

  // ── Hourly activity ────────────────────────────────────────────────────
  const actividadHoras = useMemo(() => {
    const horas = Array.from({ length: 24 }, (_, i) => ({ hora: i, mensajes: 0 }));
    misMensajes.forEach(m => { horas[new Date(m.created_at).getHours()].mensajes++; });
    const top3 = new Set(
      [...horas].sort((a, b) => b.mensajes - a.mensajes).slice(0, 3).map(h => h.hora),
    );
    return horas.map(h => ({
      ...h,
      label: `${String(h.hora).padStart(2, '0')}:00`,
      esPico: top3.has(h.hora),
    }));
  }, [misMensajes]);

  // ── Agendamientos with search ──────────────────────────────────────────
  const agsFiltrados = useMemo(() => {
    if (!busqueda.trim()) return misAgendamientos;
    const q = busqueda.toLowerCase();
    return misAgendamientos.filter(a =>
      a.clienteNombre.toLowerCase().includes(q) ||
      a.modeloNombre.toLowerCase().includes(q),
    );
  }, [misAgendamientos, busqueda]);

  // ── Chat sessions by period ────────────────────────────────────────────
  const filtroDesde = useMemo(() => {
    if (filtroPeriodo === 'hoy') return hoy;
    if (filtroPeriodo === 'semana') return inicioSemana;
    return inicioMes;
  }, [filtroPeriodo, hoy, inicioSemana, inicioMes]);

  const chatsRecientes = useMemo(() => {
    const enPeriodo = mensajes.filter(m => m.created_at >= filtroDesde);

    // Group client messages by (sender_id + date) → one session per client per day
    const sesiones = new Map<string, {
      clienteId: string;
      clienteNombre: string;
      firstMsg: string;
      lastMsg: string;
      countMsgs: number;
      agendo: boolean;
    }>();

    enPeriodo.forEach(m => {
      if (m.role === 'programador') return;
      const fecha = m.created_at.split('T')[0];
      const key   = `${m.sender_id}_${fecha}`;
      const nombre = (m.sender as any)?.nombre || 'Cliente';
      const existing = sesiones.get(key);
      if (!existing) {
        sesiones.set(key, { clienteId: m.sender_id, clienteNombre: nombre, firstMsg: m.created_at, lastMsg: m.created_at, countMsgs: 1, agendo: false });
      } else {
        existing.lastMsg = m.created_at;
        existing.countMsgs++;
      }
    });

    // Flag sessions that led to an agendamiento (match by clienteNombre + day)
    misAgendamientos.forEach(a => {
      const fechaAg = (a.fechaCreacion ?? a.fecha)?.split('T')[0];
      if (!fechaAg || fechaAg < filtroDesde) return;
      sesiones.forEach(s => {
        if (s.firstMsg.startsWith(fechaAg) &&
            s.clienteNombre.toLowerCase() === a.clienteNombre.toLowerCase()) {
          s.agendo = true;
        }
      });
    });

    return [...sesiones.values()]
      .sort((a, b) => b.firstMsg.localeCompare(a.firstMsg))
      .map(s => ({
        ...s,
        duracionMin: Math.max(0, Math.round(
          (new Date(s.lastMsg).getTime() - new Date(s.firstMsg).getTime()) / 60000,
        )),
      }));
  }, [mensajes, misAgendamientos, filtroDesde]);

  // ── Weekly summary — last 4 weeks ─────────────────────────────────────
  const resumenSemanal = useMemo(() => {
    return [3, 2, 1, 0].map(w => {
      const inicio   = weekMondayNWeeksAgo(w);
      const fin      = addDays(inicio, 6);
      const iStr     = toYMD(inicio);
      const fStr     = toYMD(fin);

      const clientes = new Set(
        mensajes
          .filter(m => m.role !== 'programador' && m.created_at >= iStr && m.created_at <= fStr + 'T23:59:59')
          .map(m => m.sender_id),
      ).size;

      const ags = agendamientos.filter(a => {
        const f = (a.fechaCreacion ?? a.fecha) ?? '';
        return a.creadoPor === userEmail && f >= iStr && f <= fStr;
      }).length;

      const label =
        w === 0 ? 'Esta semana'
        : w === 1 ? 'Semana anterior'
        : `Hace ${w} semanas`;

      return {
        label,
        inicio,
        fin,
        clientes,
        agendamientos: ags,
        conversion: clientes > 0 ? Math.round((ags / clientes) * 100) : 0,
        esActual: w === 0,
      };
    });
  }, [mensajes, agendamientos, userEmail]);

  // ── CSV export ─────────────────────────────────────────────────────────
  const exportarCSV = () => {
    const header = ['Cliente', 'Inicio', 'Duración (min)', 'Mensajes', 'Agendó', 'Programador'];
    const rows = chatsRecientes.map(c => [
      `"${c.clienteNombre}"`,
      c.firstMsg,
      c.duracionMin,
      c.countMsgs,
      c.agendo ? 'Sí' : 'No',
      userEmail,
    ]);
    const csv = [header, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `chats_${hoy}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // ── Pagination slices ──────────────────────────────────────────────────
  const totalAgsPages   = Math.max(1, Math.ceil(agsFiltrados.length / POR_PAGINA));
  const totalChatsPages = Math.max(1, Math.ceil(chatsRecientes.length / POR_PAGINA));
  const agsPage         = agsFiltrados.slice(pagAgs * POR_PAGINA, (pagAgs + 1) * POR_PAGINA);
  const chatsPage       = chatsRecientes.slice(pagChats * POR_PAGINA, (pagChats + 1) * POR_PAGINA);

  // ── Loading skeleton ───────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <Card key={i} className="border-white/10 bg-black/20">
            <CardContent className="p-6">
              <div className="h-32 bg-white/5 rounded-lg animate-pulse" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  // ── Render ─────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">

      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold" style={{ color: COLOR_PRIMARY }}>
            Mis Estadísticas
          </h2>
          <p className="text-xs text-gray-400 mt-0.5">{userEmail}</p>
        </div>
        <Button
          variant="ghost" size="sm"
          onClick={cargar}
          className="text-gray-400 hover:text-white"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Actualizar
        </Button>
      </div>

      {/* ═══════════════════════════════════════════════════════════════
          SECCIÓN 1 — KPIs
      ══════════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Mensajes enviados */}
        <KPICard
          icon={<MessageSquare className="w-4 h-4" />}
          label="Mensajes enviados"
          mainValue={kpis.msgSemana}
          subA={`Hoy: ${fmtNum(kpis.msgHoy)}`}
          subB={`Mes: ${fmtNum(kpis.msgMes)}`}
          cambio={kpis.cambioSemana}
          cambioLabel="vs sem. anterior"
        />
        {/* Agendamientos creados */}
        <KPICard
          icon={<Calendar className="w-4 h-4" />}
          label="Agendamientos creados"
          mainValue={kpis.agsSemana}
          subA={`Hoy: ${fmtNum(kpis.agsHoy)}`}
          subB={`Mes: ${fmtNum(kpis.agsMes)}`}
        />
        {/* Clientes atendidos */}
        <KPICard
          icon={<Users className="w-4 h-4" />}
          label="Clientes (esta semana)"
          mainValue={kpis.clientesSemana}
          singleValue
        />
        {/* Chats sin responder */}
        <KPICard
          icon={<AlertCircle className="w-4 h-4" />}
          label="Sin responder (2 h)"
          mainValue={kpis.sinResponder}
          singleValue
          alert={kpis.sinResponder > 0}
        />
      </div>

      {/* ═══════════════════════════════════════════════════════════════
          SECCIÓN 2 — Actividad diaria (30 días)
      ══════════════════════════════════════════════════════════════════ */}
      <Card className="border-white/10 bg-black/20">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm font-semibold" style={{ color: COLOR_PRIMARY }}>
            <BarChart3 className="w-4 h-4" />
            Actividad de los últimos 30 días
          </CardTitle>
          <CardDescription className="text-xs">Mensajes enviados por día</CardDescription>
        </CardHeader>
        <CardContent>
          {actividadDiaria.every(d => d.mensajes === 0) ? (
            <EmptyState icon={<BarChart3 className="w-10 h-10" />} text="Sin mensajes en los últimos 30 días" />
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={actividadDiaria} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 10, fill: '#6b7280' }}
                  interval={4}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  tick={{ fontSize: 10, fill: '#6b7280' }}
                  tickLine={false}
                  axisLine={false}
                  allowDecimals={false}
                />
                <Tooltip
                  contentStyle={{ background: '#111827', border: '1px solid rgba(201,169,97,0.25)', borderRadius: 8, fontSize: 12 }}
                  labelStyle={{ color: COLOR_PRIMARY }}
                  itemStyle={{ color: '#e8e6e3' }}
                  formatter={(v: number) => [fmtNum(v), 'Mensajes']}
                />
                <Bar dataKey="mensajes" fill={COLOR_PRIMARY} radius={[3, 3, 0, 0]} maxBarSize={28} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* ═══════════════════════════════════════════════════════════════
          SECCIÓN 3 — Horarios pico
      ══════════════════════════════════════════════════════════════════ */}
      <Card className="border-white/10 bg-black/20">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm font-semibold" style={{ color: COLOR_PRIMARY }}>
            <Clock className="w-4 h-4" />
            Horarios de mayor actividad
          </CardTitle>
          <CardDescription className="text-xs">
            Volumen de mensajes por hora del día
            {actividadHoras.some(h => h.esPico && h.mensajes > 0) && (
              <span className="ml-2 text-amber-400">· Top 3 en amarillo</span>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {actividadHoras.every(h => h.mensajes === 0) ? (
            <EmptyState icon={<Clock className="w-10 h-10" />} text="Sin datos de actividad por hora" />
          ) : (
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={actividadHoras} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 9, fill: '#6b7280' }}
                  interval={2}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  tick={{ fontSize: 10, fill: '#6b7280' }}
                  tickLine={false}
                  axisLine={false}
                  allowDecimals={false}
                />
                <Tooltip
                  contentStyle={{ background: '#111827', border: '1px solid rgba(201,169,97,0.25)', borderRadius: 8, fontSize: 12 }}
                  labelStyle={{ color: COLOR_PRIMARY }}
                  itemStyle={{ color: '#e8e6e3' }}
                  formatter={(v: number) => [fmtNum(v), 'Mensajes']}
                />
                <Bar dataKey="mensajes" radius={[3, 3, 0, 0]} maxBarSize={20}>
                  {actividadHoras.map((h, idx) => (
                    <Cell key={idx} fill={h.esPico ? COLOR_PEAK : COLOR_PRIMARY} fillOpacity={h.esPico ? 1 : 0.7} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* ═══════════════════════════════════════════════════════════════
          SECCIÓN 4 — Agendamientos recientes
      ══════════════════════════════════════════════════════════════════ */}
      <Card className="border-white/10 bg-black/20">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <CardTitle className="flex items-center gap-2 text-sm font-semibold" style={{ color: COLOR_PRIMARY }}>
                <Calendar className="w-4 h-4" />
                Mis agendamientos
                <Badge className="bg-white/10 text-gray-300 text-xs border-white/10">
                  {misAgendamientos.length}
                </Badge>
              </CardTitle>
              <CardDescription className="text-xs">Filtrados por: creados por ti</CardDescription>
            </div>
            {/* Search */}
            <div className="relative">
              <svg className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-gray-500 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
              </svg>
              <input
                type="text"
                value={busqueda}
                onChange={e => { setBusqueda(e.target.value); setPagAgs(0); }}
                placeholder="Buscar cliente o modelo…"
                className="pl-8 pr-3 py-1.5 text-xs bg-white/5 border border-white/10 rounded-md text-white placeholder-gray-500 focus:outline-none focus:border-amber-500/50 w-48"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {agsFiltrados.length === 0 ? (
            <EmptyState icon={<Calendar className="w-10 h-10" />} text="No hay agendamientos que mostrar" />
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-white/10 text-left">
                      <th className="pb-2 px-2 text-gray-400 font-medium">Cliente</th>
                      <th className="pb-2 px-2 text-gray-400 font-medium hidden sm:table-cell">Modelo</th>
                      <th className="pb-2 px-2 text-gray-400 font-medium">Fecha</th>
                      <th className="pb-2 px-2 text-gray-400 font-medium hidden md:table-cell">Hora</th>
                      <th className="pb-2 px-2 text-gray-400 font-medium">Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {agsPage.map(ag => (
                      <tr key={ag.id} className="border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors">
                        <td className="py-2.5 px-2 text-white font-medium">{ag.clienteNombre}</td>
                        <td className="py-2.5 px-2 text-gray-300 hidden sm:table-cell">{ag.modeloNombre}</td>
                        <td className="py-2.5 px-2 text-gray-400">{fmtCorto(ag.fecha)}</td>
                        <td className="py-2.5 px-2 text-gray-400 hidden md:table-cell">{ag.hora}</td>
                        <td className="py-2.5 px-2"><EstadoBadge estado={ag.estado} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {totalAgsPages > 1 && (
                <Paginador
                  pagina={pagAgs}
                  total={totalAgsPages}
                  totalItems={agsFiltrados.length}
                  desde={pagAgs * POR_PAGINA + 1}
                  hasta={Math.min((pagAgs + 1) * POR_PAGINA, agsFiltrados.length)}
                  onPrev={() => setPagAgs(p => Math.max(0, p - 1))}
                  onNext={() => setPagAgs(p => Math.min(totalAgsPages - 1, p + 1))}
                />
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* ═══════════════════════════════════════════════════════════════
          SECCIÓN 5 — Chats recientes
      ══════════════════════════════════════════════════════════════════ */}
      <Card className="border-white/10 bg-black/20">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <CardTitle className="flex items-center gap-2 text-sm font-semibold" style={{ color: COLOR_PRIMARY }}>
                <MessageSquare className="w-4 h-4" />
                Chats recientes
                <Badge className="bg-white/10 text-gray-300 text-xs border-white/10">
                  {chatsRecientes.length}
                </Badge>
              </CardTitle>
              <CardDescription className="text-xs">Sesiones agrupadas por cliente y día</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              {/* Period filter */}
              <div className="flex rounded-md overflow-hidden border border-white/10 text-xs">
                {(['hoy', 'semana', 'mes'] as const).map(p => (
                  <button
                    key={p}
                    onClick={() => { setFiltroPeriodo(p); setPagChats(0); }}
                    className="px-3 py-1 transition-colors"
                    style={
                      filtroPeriodo === p
                        ? { background: COLOR_PRIMARY, color: '#000', fontWeight: 600 }
                        : { color: '#9ca3af' }
                    }
                  >
                    {p.charAt(0).toUpperCase() + p.slice(1)}
                  </button>
                ))}
              </div>
              <Button
                variant="outline" size="sm"
                onClick={exportarCSV}
                disabled={chatsRecientes.length === 0}
                className="h-7 text-xs border-white/10 text-gray-400 hover:text-white"
              >
                <Download className="w-3 h-3 mr-1" />
                CSV
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {chatsRecientes.length === 0 ? (
            <EmptyState icon={<MessageSquare className="w-10 h-10" />} text="No hay chats en este período" />
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-white/10 text-left">
                      <th className="pb-2 px-2 text-gray-400 font-medium">Cliente</th>
                      <th className="pb-2 px-2 text-gray-400 font-medium hidden sm:table-cell">Inicio</th>
                      <th className="pb-2 px-2 text-gray-400 font-medium hidden md:table-cell">Duración</th>
                      <th className="pb-2 px-2 text-gray-400 font-medium">Mensajes</th>
                      <th className="pb-2 px-2 text-gray-400 font-medium">¿Agendó?</th>
                    </tr>
                  </thead>
                  <tbody>
                    {chatsPage.map((c, i) => (
                      <tr key={i} className="border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors">
                        <td className="py-2.5 px-2 text-white font-medium">{c.clienteNombre}</td>
                        <td className="py-2.5 px-2 text-gray-400 hidden sm:table-cell">
                          {new Date(c.firstMsg).toLocaleString('es-CO', {
                            day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
                          })}
                        </td>
                        <td className="py-2.5 px-2 text-gray-400 hidden md:table-cell">
                          {c.duracionMin < 1 ? '< 1 min' : `${c.duracionMin} min`}
                        </td>
                        <td className="py-2.5 px-2 text-gray-300">{fmtNum(c.countMsgs)}</td>
                        <td className="py-2.5 px-2">
                          {c.agendo
                            ? <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-[10px]">Sí</Badge>
                            : <Badge className="bg-white/5 text-gray-500 border-white/10 text-[10px]">No</Badge>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {totalChatsPages > 1 && (
                <Paginador
                  pagina={pagChats}
                  total={totalChatsPages}
                  totalItems={chatsRecientes.length}
                  desde={pagChats * POR_PAGINA + 1}
                  hasta={Math.min((pagChats + 1) * POR_PAGINA, chatsRecientes.length)}
                  onPrev={() => setPagChats(p => Math.max(0, p - 1))}
                  onNext={() => setPagChats(p => Math.min(totalChatsPages - 1, p + 1))}
                />
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* ═══════════════════════════════════════════════════════════════
          SECCIÓN 6 — Resumen semanal (últimas 4 semanas)
      ══════════════════════════════════════════════════════════════════ */}
      <Card className="border-white/10 bg-black/20">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm font-semibold" style={{ color: COLOR_PRIMARY }}>
            <Activity className="w-4 h-4" />
            Rendimiento semanal
          </CardTitle>
          <CardDescription className="text-xs">Comparativa de las últimas 4 semanas</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-white/10 text-left">
                  <th className="pb-2 px-3 text-gray-400 font-medium">Semana</th>
                  <th className="pb-2 px-3 text-gray-400 font-medium text-right">Clientes</th>
                  <th className="pb-2 px-3 text-gray-400 font-medium text-right">Agendamientos</th>
                  <th className="pb-2 px-3 text-gray-400 font-medium text-right">Conversión</th>
                </tr>
              </thead>
              <tbody>
                {resumenSemanal.map((s, i) => (
                  <tr
                    key={i}
                    className={`border-b border-white/[0.04] transition-colors ${
                      s.esActual ? 'bg-amber-500/5' : 'hover:bg-white/[0.02]'
                    }`}
                  >
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2">
                        <span
                          className="font-medium"
                          style={s.esActual ? { color: COLOR_PRIMARY } : { color: '#d1d5db' }}
                        >
                          {s.label}
                        </span>
                        {s.esActual && (
                          <Badge
                            className="text-[10px] border"
                            style={{ background: `${COLOR_PRIMARY}20`, color: COLOR_PRIMARY, borderColor: `${COLOR_PRIMARY}40` }}
                          >
                            Actual
                          </Badge>
                        )}
                      </div>
                      <div className="text-[10px] text-gray-500 mt-0.5">
                        {s.inicio.toLocaleDateString('es-CO', { day: 'numeric', month: 'short' })}
                        {' – '}
                        {s.fin.toLocaleDateString('es-CO', { day: 'numeric', month: 'short' })}
                      </div>
                    </td>
                    <td className="py-3 px-3 text-right text-gray-300">{fmtNum(s.clientes)}</td>
                    <td className="py-3 px-3 text-right text-gray-300">{fmtNum(s.agendamientos)}</td>
                    <td className="py-3 px-3 text-right">
                      <span className={`font-semibold ${
                        s.conversion >= 30 ? 'text-green-400'
                        : s.conversion >= 10 ? 'text-yellow-400'
                        : 'text-gray-500'
                      }`}>
                        {s.conversion}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

interface KPICardProps {
  icon: React.ReactNode;
  label: string;
  mainValue: number;
  subA?: string;
  subB?: string;
  cambio?: number;
  cambioLabel?: string;
  singleValue?: boolean;
  alert?: boolean;
}

function KPICard({ icon, label, mainValue, subA, subB, cambio, cambioLabel, singleValue, alert }: KPICardProps) {
  const CambioIcon =
    cambio === undefined || cambio === 0 ? Minus
    : cambio > 0 ? TrendingUp
    : TrendingDown;

  return (
    <Card className={`border-white/10 bg-black/20 ${alert ? 'border-red-500/30' : ''}`}>
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-2">
          <span style={{ color: alert ? '#ef4444' : COLOR_PRIMARY }}>{icon}</span>
          <span className="text-[11px] text-gray-400 leading-tight">{label}</span>
        </div>
        <div className="text-2xl font-bold mb-1" style={{ color: alert ? '#ef4444' : '#fff' }}>
          {fmtNum(mainValue)}
        </div>
        {!singleValue && (subA || subB) && (
          <div className="flex gap-3 text-[10px] text-gray-500 mb-1">
            {subA && <span>{subA}</span>}
            {subB && <span>{subB}</span>}
          </div>
        )}
        {cambio !== undefined && (
          <div className={`flex items-center gap-1 text-[10px] mt-1 ${
            cambio > 0 ? 'text-green-400' : cambio < 0 ? 'text-red-400' : 'text-gray-500'
          }`}>
            <CambioIcon className="w-3 h-3" />
            <span>{cambio > 0 ? '+' : ''}{cambio}% {cambioLabel}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function EstadoBadge({ estado }: { estado: string }) {
  const cfg: Record<string, string> = {
    pendiente:  'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    confirmado: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    completado: 'bg-green-500/20 text-green-400 border-green-500/30',
    cancelado:  'bg-red-500/20 text-red-400 border-red-500/30',
    no_show:    'bg-gray-500/20 text-gray-400 border-gray-500/30',
  };
  const labels: Record<string, string> = {
    pendiente: 'Pendiente', confirmado: 'Confirmado',
    completado: 'Completado', cancelado: 'Cancelado', no_show: 'No Show',
  };
  return (
    <Badge className={`text-[10px] border ${cfg[estado] ?? 'bg-white/10 text-gray-400 border-white/10'}`}>
      {labels[estado] ?? estado}
    </Badge>
  );
}

interface PaginadorProps {
  pagina: number;
  total: number;
  totalItems: number;
  desde: number;
  hasta: number;
  onPrev: () => void;
  onNext: () => void;
}

function Paginador({ pagina, total, totalItems, desde, hasta, onPrev, onNext }: PaginadorProps) {
  return (
    <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/5">
      <span className="text-[11px] text-gray-500">
        {fmtNum(desde)}–{fmtNum(hasta)} de {fmtNum(totalItems)}
      </span>
      <div className="flex items-center gap-1">
        <Button variant="ghost" size="sm" onClick={onPrev} disabled={pagina === 0} className="h-7 w-7 p-0 text-gray-400">
          <ChevronLeft className="w-3.5 h-3.5" />
        </Button>
        <span className="text-[11px] text-gray-400 px-2">{pagina + 1} / {total}</span>
        <Button variant="ghost" size="sm" onClick={onNext} disabled={pagina >= total - 1} className="h-7 w-7 p-0 text-gray-400">
          <ChevronRight className="w-3.5 h-3.5" />
        </Button>
      </div>
    </div>
  );
}

function EmptyState({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-gray-500">
      <span className="mb-3 opacity-20">{icon}</span>
      <p className="text-sm">{text}</p>
    </div>
  );
}
