import { useState } from 'react';
import {
  Calendar, Clock, CheckCircle, XCircle, AlertCircle,
  User, Phone, ThumbsUp, ThumbsDown, Edit3, Filter,
  ChevronDown, RefreshCw,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { useAgendamientos, Agendamiento, formatearFecha, formatearHora } from './AgendamientosContext';
import { toast } from 'sonner';

// ── Constantes de estilo ──────────────────────────────────────────────────────

const COLOR_PRIMARY = '#c9a961';

export const ESTADO_CONFIG: Record<Agendamiento['estado'], { label: string; color: string; icon: React.ReactNode }> = {
  pendiente:  { label: 'Pendiente',  color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30', icon: <Clock className="w-3 h-3" /> },
  confirmado: { label: 'Confirmado', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30',       icon: <CheckCircle className="w-3 h-3" /> },
  aprobado:   { label: 'Aprobado',   color: 'bg-blue-500/20 text-blue-400 border-blue-500/30',       icon: <CheckCircle className="w-3 h-3" /> },
  completado: { label: 'Completado', color: 'bg-green-500/20 text-green-400 border-green-500/30',    icon: <CheckCircle className="w-3 h-3" /> },
  cancelado:  { label: 'Cancelado',  color: 'bg-red-500/20 text-red-400 border-red-500/30',          icon: <XCircle className="w-3 h-3" /> },
  no_show:    { label: 'No Show',    color: 'bg-gray-500/20 text-gray-400 border-gray-500/30',       icon: <AlertCircle className="w-3 h-3" /> },
};

// ── Props ─────────────────────────────────────────────────────────────────────

interface AgendamientosPanelProps {
  rol: 'owner' | 'admin' | 'supervisor' | 'recepcionista' | 'modelo';
  userEmail?: string;
  /** Sólo para rol='modelo': filtra por este email */
  modeloEmail?: string;
}

// ── Fila de agendamiento ──────────────────────────────────────────────────────

function AgendamientoRow({
  ag,
  rol,
  userEmail = '',
  onAprobar,
  onRechazar,
  onCompletar,
  onNoShow,
  onCancelar,
}: {
  ag: Agendamiento;
  rol: AgendamientosPanelProps['rol'];
  userEmail?: string;
  onAprobar: (id: string) => void;
  onRechazar: (id: string) => void;
  onCompletar: (id: string) => void;
  onNoShow: (id: string) => void;
  onCancelar: (id: string) => void;
}) {
  const cfg = ESTADO_CONFIG[ag.estado] ?? ESTADO_CONFIG.pendiente;
  const puedeAprobar    = (rol === 'supervisor' || rol === 'admin' || rol === 'owner') && ag.estado === 'pendiente';
  const puedeCompletar  = (rol !== 'modelo') && (ag.estado === 'confirmado' || ag.estado === 'aprobado');
  const puedeNoShow     = (rol !== 'modelo') && (ag.estado === 'confirmado' || ag.estado === 'aprobado');
  const puedeCancelar   = (rol !== 'modelo') && (ag.estado === 'pendiente' || ag.estado === 'confirmado' || ag.estado === 'aprobado');

  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-3 p-3 rounded-lg border border-white/5 bg-white/[0.02] hover:bg-white/[0.04] transition-colors">
      {/* Hora */}
      <div className="flex-shrink-0 w-24 text-center hidden sm:block">
        <span className="text-sm font-bold" style={{ color: COLOR_PRIMARY }}>{formatearHora(ag.hora)}</span>
        <p className="text-[10px] text-gray-500 capitalize">{formatearFecha(ag.fecha).split(',')[0]}</p>
      </div>

      {/* Info principal */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-medium text-white truncate">{ag.clienteNombre}</span>
          <Badge className={`text-[10px] border ${cfg.color} flex items-center gap-1`}>
            {cfg.icon}
            {cfg.label}
          </Badge>
        </div>
        <div className="flex items-center gap-3 mt-0.5 flex-wrap">
          <span className="text-xs text-gray-400 flex items-center gap-1">
            <User className="w-3 h-3" />{ag.modeloNombre}
          </span>
          {ag.clienteTelefono && (
            <span className="text-xs text-gray-500 flex items-center gap-1">
              <Phone className="w-3 h-3" />{ag.clienteTelefono}
            </span>
          )}
          <span className="text-xs text-gray-500 sm:hidden">{formatearHora(ag.hora)} · <span className="capitalize">{formatearFecha(ag.fecha)}</span></span>
        </div>
        {ag.tipoServicio && (
          <span className="text-[10px] text-gray-500 mt-0.5 block">{ag.tipoServicio} · {ag.duracionMinutos}min · ${(ag.montoPago / 1000).toFixed(0)}k</span>
        )}
      </div>

      {/* Acciones */}
      <div className="flex items-center gap-1.5 flex-wrap flex-shrink-0">
        {puedeAprobar && (
          <>
            <Button size="sm" onClick={() => onAprobar(ag.id)}
              className="h-7 px-2 text-xs bg-blue-500/20 text-blue-400 border border-blue-500/30 hover:bg-blue-500/30">
              <ThumbsUp className="w-3 h-3 mr-1" />Aprobar
            </Button>
            <Button size="sm" onClick={() => onRechazar(ag.id)}
              className="h-7 px-2 text-xs bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20">
              <ThumbsDown className="w-3 h-3 mr-1" />Rechazar
            </Button>
          </>
        )}
        {puedeCompletar && (
          <Button size="sm" onClick={() => onCompletar(ag.id)}
            className="h-7 px-2 text-xs bg-green-500/20 text-green-400 border border-green-500/30 hover:bg-green-500/30">
            <CheckCircle className="w-3 h-3 mr-1" />Completar
          </Button>
        )}
        {puedeNoShow && (
          <Button size="sm" onClick={() => onNoShow(ag.id)}
            className="h-7 px-2 text-xs bg-gray-500/10 text-gray-400 border border-gray-500/20 hover:bg-gray-500/20">
            <AlertCircle className="w-3 h-3 mr-1" />No Show
          </Button>
        )}
        {puedeCancelar && (
          <Button size="sm" onClick={() => onCancelar(ag.id)}
            className="h-7 px-2 text-xs bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20">
            <XCircle className="w-3 h-3 mr-1" />Cancelar
          </Button>
        )}
      </div>
    </div>
  );
}

// ── Componente principal ──────────────────────────────────────────────────────

export function AgendamientosPanel({ rol, userEmail = '', modeloEmail }: AgendamientosPanelProps) {
  const {
    agendamientos,
    aprobarAgendamiento,
    rechazarAgendamiento,
    cancelarAgendamiento,
    marcarComoCompletado,
    marcarComoNoShow,
    recargarAgendamientos,
    getAgendamientosHoy,
    getAgendamientosPendientesAprobacion,
  } = useAgendamientos();

  const [filtroEstado, setFiltroEstado] = useState<string>('todos');
  const [filtroVista, setFiltroVista]   = useState<'todos' | 'pendientes'>('todos');
  const [cargando, setCargando]         = useState(false);
  const [paginaHistorial, setPaginaHistorial] = useState(1);

  // ── Selección y Ordenamiento ─────────────────────────────────────
  let rawList = [...agendamientos];
  
  if (rol === 'modelo' && modeloEmail) {
    rawList = rawList.filter(a => a.modeloEmail === modeloEmail);
  }
  
  if (filtroVista === 'pendientes') {
    rawList = rawList.filter(a => a.estado === 'pendiente');
  }

  if (filtroEstado !== 'todos') {
    rawList = rawList.filter(a => a.estado === filtroEstado);
  }

  // Ordenamiento defensivo ASC
  rawList.sort((a, b) => {
    const msA = new Date(a.fecha + 'T' + (a.hora || '00:00')).getTime();
    const msB = new Date(b.fecha + 'T' + (b.hora || '00:00')).getTime();
    return msA - msB;
  });

  const hoyISO = new Date().toISOString().split('T')[0];

  // Separar en 3 secciones
  const hoyList = rawList.filter(a => a.fecha === hoyISO);
  const proximosList = rawList.filter(a => a.fecha > hoyISO);
  
  // Historial ordenado DESC
  const historialList = rawList.filter(a => a.fecha < hoyISO).sort((a, b) => {
    const msA = new Date(a.fecha + 'T' + (a.hora || '00:00')).getTime();
    const msB = new Date(b.fecha + 'T' + (b.hora || '00:00')).getTime();
    return msB - msA;
  });

  const historialPaginado = historialList.slice((paginaHistorial - 1) * 10, paginaHistorial * 10);
  const totalPaginasHistorial = Math.ceil(historialList.length / 10);

  // Agrupar 'Próximos'
  const proximosAgrupados = proximosList.reduce((acc, ag) => {
    if (!acc[ag.fecha]) acc[ag.fecha] = [];
    acc[ag.fecha].push(ag);
    return acc;
  }, {} as Record<string, Agendamiento[]>);


  // ── Handlers ─────────────────────────────────────────────────────────────────
  const handleAprobar = async (id: string) => {
    try {
      await aprobarAgendamiento(id, userEmail || 'staff');
      toast.success('Agendamiento aprobado');
    } catch { toast.error('Error al aprobar'); }
  };

  const handleRechazar = async (id: string) => {
    try {
      await rechazarAgendamiento(id, 'Rechazado por staff', userEmail || 'staff');
      toast.success('Agendamiento rechazado');
    } catch { toast.error('Error al rechazar'); }
  };

  const handleCompletar = async (id: string) => {
    try {
      await marcarComoCompletado(id);
      toast.success('Marcado como completado');
    } catch { toast.error('Error al completar'); }
  };

  const handleNoShow = async (id: string) => {
    try {
      await marcarComoNoShow(id, 'Cliente no se presentó', userEmail || 'staff');
      toast.success('Marcado como No Show');
    } catch { toast.error('Error'); }
  };

  const handleCancelar = async (id: string) => {
    try {
      await cancelarAgendamiento(id, 'Cancelado por staff', userEmail || 'staff');
      toast.success('Agendamiento cancelado');
    } catch { toast.error('Error al cancelar'); }
  };

  const handleRecargar = async () => {
    setCargando(true);
    await recargarAgendamientos();
    setCargando(false);
  };

  const pendientesAprobacion = getAgendamientosPendientesAprobacion().length;

  // ── Render ────────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Header con controles */}
      <Card className="border-white/10 bg-black/20">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <CardTitle className="flex items-center gap-2 text-base" style={{ color: COLOR_PRIMARY }}>
                <Calendar className="w-4 h-4" />
                Agendamientos
                {pendientesAprobacion > 0 && rol !== 'modelo' && (
                  <Badge className="ml-1 bg-amber-500 text-black text-[10px] border-none">
                    {pendientesAprobacion} pendientes
                  </Badge>
                )}
              </CardTitle>
              <CardDescription className="text-xs mt-0.5">
                {rawList.length} registro{rawList.length !== 1 ? 's' : ''} encontrado{rawList.length !== 1 ? 's' : ''}
              </CardDescription>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {/* Vista (no para modelo) */}
              {rol !== 'modelo' && (
                <Select value={filtroVista} onValueChange={(v) => setFiltroVista(v as any)}>
                  <SelectTrigger className="h-8 text-xs w-36 bg-black/30 border-white/10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Vista General</SelectItem>
                    <SelectItem value="pendientes">
                      Pendientes aprobación
                      {pendientesAprobacion > 0 && ` (${pendientesAprobacion})`}
                    </SelectItem>
                  </SelectContent>
                </Select>
              )}

              {/* Filtro estado */}
              <Select value={filtroEstado} onValueChange={setFiltroEstado}>
                <SelectTrigger className="h-8 text-xs w-32 bg-black/30 border-white/10">
                  <Filter className="w-3 h-3 mr-1" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="pendiente">Pendiente</SelectItem>
                  <SelectItem value="confirmado">Confirmado</SelectItem>
                  <SelectItem value="aprobado">Aprobado</SelectItem>
                  <SelectItem value="completado">Completado</SelectItem>
                  <SelectItem value="cancelado">Cancelado</SelectItem>
                  <SelectItem value="no_show">No Show</SelectItem>
                </SelectContent>
              </Select>

              <Button size="sm" variant="ghost" onClick={handleRecargar} disabled={cargando}
                className="h-8 w-8 p-0 border border-white/10 hover:bg-white/5">
                <RefreshCw className={`w-3.5 h-3.5 ${cargando ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {rawList.length === 0 ? (
        <Card className="border-white/10 bg-black/20">
          <CardContent className="pt-12 pb-12">
            <div className="text-center text-gray-500">
              <Calendar className="w-10 h-10 mx-auto mb-3 opacity-20" />
              <p className="text-sm">No hay agendamientos para mostrar</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          
          {/* SECCIÓN HOY */}
          {hoyList.length > 0 && (
            <Card className="border-primary/20 bg-primary/5">
              <CardHeader className="pb-3 pt-4 px-4 bg-primary/10 rounded-t-lg">
                <CardTitle className="text-sm font-semibold flex items-center justify-between">
                  <div className="flex items-center gap-2 text-primary">
                    <Clock className="w-4 h-4" />
                    Hoy — <span className="capitalize">{formatearFecha(hoyISO)}</span>
                  </div>
                  <Badge className="bg-primary/20 text-primary border-none">
                    {hoyList.length}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-2">
                {hoyList.map(ag => (
                  <AgendamientoRow key={ag.id} ag={ag} rol={rol} userEmail={userEmail} onAprobar={handleAprobar} onRechazar={handleRechazar} onCompletar={handleCompletar} onNoShow={handleNoShow} onCancelar={handleCancelar} />
                ))}
              </CardContent>
            </Card>
          )}

          {/* SECCIÓN PRÓXIMOS */}
          {proximosList.length > 0 && (
            <Card className="border-white/10 bg-black/20">
              <CardHeader className="pb-3 pt-4 px-4 border-b border-white/5">
                <CardTitle className="text-sm font-semibold flex items-center justify-between text-white">
                  <span>Próximos</span>
                  <Badge className="bg-white/10 text-gray-300 border-none">
                    {proximosList.length}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-6">
                {Object.entries(proximosAgrupados).map(([fecha, ags]) => (
                  <div key={fecha} className="space-y-2">
                    <h4 className="text-xs font-semibold text-primary uppercase tracking-wider mb-2 flex items-center gap-2">
                      <Calendar className="w-3 h-3" />
                      <span className="capitalize">{formatearFecha(fecha)}</span>
                    </h4>
                    <div className="pl-2 border-l border-white/5 space-y-2 relative before:absolute before:left-[-1px] before:top-4 before:bottom-4 before:w-[2px] before:bg-white/5">
                      {ags.map(ag => (
                        <AgendamientoRow key={ag.id} ag={ag} rol={rol} userEmail={userEmail} onAprobar={handleAprobar} onRechazar={handleRechazar} onCompletar={handleCompletar} onNoShow={handleNoShow} onCancelar={handleCancelar} />
                      ))}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* SECCIÓN HISTORIAL */}
          {historialList.length > 0 && (
            <Card className="border-white/10 bg-black/20">
              <CardHeader className="pb-3 pt-4 px-4 border-b border-white/5">
                <CardTitle className="text-sm font-semibold flex items-center justify-between text-gray-400">
                  <span>Historial</span>
                  <Badge className="bg-white/5 text-gray-500 border-none">
                    {historialList.length}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-2">
                {historialPaginado.map(ag => (
                  <div key={ag.id} className="opacity-80 grayscale-[30%]">
                    <AgendamientoRow ag={ag} rol={rol} userEmail={userEmail} onAprobar={handleAprobar} onRechazar={handleRechazar} onCompletar={handleCompletar} onNoShow={handleNoShow} onCancelar={handleCancelar} />
                  </div>
                ))}

                {/* PAGINACIÓN HISTORIAL */}
                {totalPaginasHistorial > 1 && (
                  <div className="flex items-center justify-between pt-4 mt-4 border-t border-white/5">
                    <Button 
                      variant="outline" 
                      onClick={() => setPaginaHistorial(p => Math.max(1, p - 1))}
                      disabled={paginaHistorial === 1}
                      className="h-8 text-xs bg-black/30 border-white/10"
                    >
                      Anterior
                    </Button>
                    <span className="text-xs text-gray-500">
                      Página {paginaHistorial} de {totalPaginasHistorial}
                    </span>
                    <Button 
                      variant="outline" 
                      onClick={() => setPaginaHistorial(p => Math.min(totalPaginasHistorial, p + 1))}
                      disabled={paginaHistorial === totalPaginasHistorial}
                      className="h-8 text-xs bg-black/30 border-white/10"
                    >
                      Siguiente
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

        </div>
      )}
    </div>
  );
}
