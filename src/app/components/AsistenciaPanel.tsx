import { useState } from 'react';
import {
  Clock, Calendar, ChevronUp, ChevronDown, LogIn, LogOut, Users, TrendingUp,
  ChevronLeft, ChevronRight, FileDown, User, CheckCircle, XCircle, Camera,
  AlertCircle,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import { useAsistencia } from './AsistenciaContext';
import { useMultas } from './MultasContext';
import { toast } from 'sonner';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const GOLD = '#c9a961';
const BG   = '#16181c';
const BDR  = '#2a2a2a';

interface AsistenciaPanelProps {
  userRole: 'owner' | 'administrador' | 'programador' | 'modelo';
  userEmail?: string;
}

export function AsistenciaPanel({ userRole, userEmail }: AsistenciaPanelProps) {
  const {
    registros,
    solicitudesEntrada,
    obtenerEstadisticas,
    obtenerRegistrosPorModelo,
    obtenerSolicitudesPendientes,
    aprobarSolicitudEntrada,
    rechazarSolicitudEntrada,
  } = useAsistencia();

  const { multas } = useMultas();

  const [expandido, setExpandido]       = useState(false);
  const [vistaActual, setVistaActual]   = useState<'diaria' | 'semanal' | 'mensual'>('diaria');
  const [fechaSel, setFechaSel]         = useState(new Date());
  const [rechazarModal, setRechazarModal] = useState<{ id: string; nombre: string } | null>(null);
  const [motivoRechazo, setMotivoRechazo] = useState('');
  const [procesando, setProcesando]     = useState<string | null>(null);

  const solicitudesPendientes = obtenerSolicitudesPendientes();

  /* ── period navigation ── */
  const navPeriodo = (dir: 1 | -1) => {
    const f = new Date(fechaSel);
    if (vistaActual === 'diaria')   f.setDate(f.getDate() + dir);
    else if (vistaActual === 'semanal') f.setDate(f.getDate() + dir * 7);
    else f.setMonth(f.getMonth() + dir);
    setFechaSel(f);
  };

  const textoPeriodo = () => {
    if (vistaActual === 'diaria')
      return fechaSel.toLocaleDateString('es-CO', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    if (vistaActual === 'semanal') {
      const ini = new Date(fechaSel);
      ini.setDate(ini.getDate() - ini.getDay());
      const fin = new Date(ini); fin.setDate(fin.getDate() + 6);
      return `${ini.toLocaleDateString('es-CO', { day: 'numeric', month: 'short' })} – ${fin.toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' })}`;
    }
    return fechaSel.toLocaleDateString('es-CO', { year: 'numeric', month: 'long' });
  };

  /* ── period records ── */
  const registrosPeriodo = (() => {
    if (vistaActual === 'diaria') {
      return registros.filter(r => {
        const f = new Date(r.fecha);
        return f.getDate() === fechaSel.getDate()
          && f.getMonth() === fechaSel.getMonth()
          && f.getFullYear() === fechaSel.getFullYear();
      });
    }
    if (vistaActual === 'semanal') {
      const ini = new Date(fechaSel); ini.setDate(ini.getDate() - ini.getDay()); ini.setHours(0,0,0,0);
      const fin = new Date(ini); fin.setDate(fin.getDate() + 6); fin.setHours(23,59,59,999);
      return registros.filter(r => { const f = new Date(r.fecha); return f >= ini && f <= fin; });
    }
    return registros.filter(r => {
      const f = new Date(r.fecha);
      return f.getMonth() === fechaSel.getMonth() && f.getFullYear() === fechaSel.getFullYear();
    });
  })();

  const modelosEnTurno = registrosPeriodo.filter(r => r.estado === 'En Turno');

  const stats = (() => {
    const fin = registrosPeriodo.filter(r => r.estado === 'Finalizado');
    const totalHoras = fin.reduce((s, r) => s + (r.horasTrabajadas ?? 0), 0);
    const porModelo = fin.reduce((acc, r) => {
      if (!acc[r.modeloEmail]) acc[r.modeloEmail] = { nombre: r.modeloNombre, dias: 0, horas: 0 };
      acc[r.modeloEmail].dias++;
      acc[r.modeloEmail].horas += r.horasTrabajadas ?? 0;
      return acc;
    }, {} as Record<string, { nombre: string; dias: number; horas: number }>);
    return { totalRegistros: registrosPeriodo.length, registrosFinalizados: fin.length, totalHoras, modelosActivas: Object.keys(porModelo).length, porModelo };
  })();

  /* ── approve / reject ── */
  const handleAprobar = async (id: string, nombre: string) => {
    setProcesando(id);
    try {
      await aprobarSolicitudEntrada(id, 'admin');
      toast.success(`Entrada de ${nombre} aprobada`);
    } catch (e: any) {
      toast.error('Error al aprobar: ' + e.message);
    } finally { setProcesando(null); }
  };

  const handleRechazar = async () => {
    if (!rechazarModal || !motivoRechazo.trim()) return;
    setProcesando(rechazarModal.id);
    try {
      await rechazarSolicitudEntrada(rechazarModal.id, 'admin', motivoRechazo.trim());
      toast.success(`Solicitud de ${rechazarModal.nombre} rechazada`);
      setRechazarModal(null); setMotivoRechazo('');
    } catch (e: any) {
      toast.error('Error al rechazar: ' + e.message);
    } finally { setProcesando(null); }
  };

  /* ── export PDF ── */
  const exportarPDF = () => {
    const doc = new jsPDF();
    const gold: [number,number,number] = [212,175,55];
    const dark: [number,number,number] = [10,10,15];
    doc.setFillColor(...dark); doc.rect(0,0,210,50,'F');
    doc.setTextColor(...gold); doc.setFontSize(28); doc.setFont('helvetica','bold');
    doc.text('BLACK DIAMOND STUDIOS',105,18,{align:'center'});
    doc.setDrawColor(...gold); doc.setLineWidth(0.5); doc.line(60,23,150,23);
    doc.setFontSize(16); doc.setFont('helvetica','normal');
    doc.text('Reporte de Asistencia',105,32,{align:'center'});
    doc.setFontSize(11); doc.setTextColor(200,200,200);
    doc.text(textoPeriodo(),105,40,{align:'center'});
    let y = 60;
    doc.setTextColor(200,200,200); doc.setFontSize(9);
    doc.text(`Generado: ${new Date().toLocaleString('es-CO')}`,14,y); y+=15;
    autoTable(doc,{
      startY:y,
      head:[['Métrica','Valor']],
      body:[
        ['Modelos Activas',stats.modelosActivas.toString()],
        ['Total Registros',stats.totalRegistros.toString()],
        ['Registros Finalizados',stats.registrosFinalizados.toString()],
        ['Total Horas',stats.totalHoras.toFixed(1)+'h'],
      ],
      theme:'grid',
      headStyles:{fillColor:gold,textColor:dark,fontStyle:'bold',fontSize:11},
      alternateRowStyles:{fillColor:[245,245,245]},
      styles:{fontSize:10},
      margin:{left:14,right:14},
    });
    doc.save(`asistencia_${vistaActual}_${fechaSel.toLocaleDateString('es-CO').replace(/\//g,'-')}.pdf`);
  };

  /* ══════════════════════════════════════════════════════
     Vista MODELO
  ══════════════════════════════════════════════════════ */
  if (userRole === 'modelo' && userEmail) {
    const misRegistros = obtenerRegistrosPorModelo(userEmail);
    const misStats     = obtenerEstadisticas(userEmail);
    const registroActual = misRegistros.find(r => r.estado === 'En Turno');

    return (
      <Card className="border-primary/30 bg-gradient-to-br from-card to-card/50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-primary">
                <Clock className="w-5 h-5" /> Mi Asistencia
              </CardTitle>
              <CardDescription>Registro de entrada y salida</CardDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setExpandido(!expandido)}>
              {expandido ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </Button>
          </div>
        </CardHeader>
        {expandido && (
          <CardContent className="space-y-4">
            {registroActual && (
              <div className="p-4 bg-green-950/30 border-2 border-green-500/30 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <Badge className="bg-green-500/80 text-white">
                    <LogIn className="w-3 h-3 mr-1" /> En Turno
                  </Badge>
                  <span className="text-sm text-muted-foreground">Hoy</span>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-muted-foreground">Llegada:</span>
                    <p className="font-bold text-green-400">
                      {registroActual.horaLlegada.toLocaleTimeString('es-CO',{hour:'2-digit',minute:'2-digit'})}
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Tiempo:</span>
                    <p className="font-bold text-primary">
                      {Math.floor((Date.now()-registroActual.horaLlegada.getTime())/3600000)}h{' '}
                      {Math.floor(((Date.now()-registroActual.horaLlegada.getTime())%3600000)/60000)}m
                    </p>
                  </div>
                </div>
              </div>
            )}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { label: 'Días Trabajados', val: misStats.totalDias },
                { label: 'Total Horas',     val: misStats.totalHoras.toFixed(1)+'h' },
                { label: 'Promedio/Día',    val: misStats.promedioHorasPorDia.toFixed(1)+'h' },
                { label: 'Este Mes',        val: misStats.diasEsteMes },
              ].map(({ label, val }) => (
                <div key={label} className="p-3 bg-secondary rounded-lg border border-border">
                  <p className="text-xs text-muted-foreground mb-1">{label}</p>
                  <p className="text-xl font-bold text-primary">{val}</p>
                </div>
              ))}
            </div>
            <div>
              <h4 className="text-sm font-semibold mb-3">Historial Reciente</h4>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {misRegistros.slice(0,5).map(r => (
                  <div key={r.id} className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg border border-border/50">
                    <div className="flex items-center gap-3">
                      <div className="text-center">
                        <div className="text-lg font-bold text-primary">{new Date(r.fecha).getDate()}</div>
                        <div className="text-xs text-muted-foreground">{new Date(r.fecha).toLocaleDateString('es',{month:'short'})}</div>
                      </div>
                      <div className="text-sm">
                        <div className="flex items-center gap-2 mb-1">
                          <LogIn className="w-3 h-3 text-green-500" />
                          <span>{r.horaLlegada.toLocaleTimeString('es-CO',{hour:'2-digit',minute:'2-digit'})}</span>
                        </div>
                        {r.horaSalida && (
                          <div className="flex items-center gap-2">
                            <LogOut className="w-3 h-3 text-red-500" />
                            <span>{r.horaSalida.toLocaleTimeString('es-CO',{hour:'2-digit',minute:'2-digit'})}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      {r.horasTrabajadas
                        ? <p className="font-bold text-primary">{r.horasTrabajadas.toFixed(1)}h</p>
                        : <Badge variant="outline" className="border-green-500/50 text-green-400">Activo</Badge>
                      }
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        )}
      </Card>
    );
  }

  /* ══════════════════════════════════════════════════════
     Vista ADMIN / OWNER / PROGRAMADOR
  ══════════════════════════════════════════════════════ */
  return (
    <>
      {/* ── Modal rechazo ── */}
      <Dialog open={!!rechazarModal} onOpenChange={() => { setRechazarModal(null); setMotivoRechazo(''); }}>
        <DialogContent className="max-w-sm" style={{ background: BG, border: `1px solid #7f1d1d` }}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-400">
              <XCircle className="w-5 h-5" /> Rechazar entrada
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              ¿Por qué rechazas la entrada de{' '}
              <span className="font-semibold text-white">{rechazarModal?.nombre}</span>?
            </p>
            <textarea
              className="w-full rounded-md px-3 py-2 text-sm resize-none focus:outline-none"
              style={{ background: '#0d0f12', border: `1px solid ${BDR}`, color: '#fff' }}
              rows={3}
              placeholder="Motivo del rechazo..."
              value={motivoRechazo}
              onChange={e => setMotivoRechazo(e.target.value)}
            />
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => { setRechazarModal(null); setMotivoRechazo(''); }}
              >
                Cancelar
              </Button>
              <Button
                className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                disabled={!motivoRechazo.trim() || !!procesando}
                onClick={handleRechazar}
              >
                Rechazar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Panel principal ── */}
      <div style={{ background: BG, border: `1px solid ${BDR}`, borderRadius: '0.75rem', overflow: 'hidden' }}>

        {/* Cabecera siempre visible */}
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2 flex-wrap">
            <Users className="w-4 h-4 flex-shrink-0" style={{ color: GOLD }} />
            <span className="font-semibold text-sm" style={{ color: GOLD }}>Control de Asistencia</span>
            {solicitudesPendientes.length > 0 ? (
              <Badge className="bg-yellow-500 text-black font-bold text-xs">
                {solicitudesPendientes.length} pendiente{solicitudesPendientes.length > 1 ? 's' : ''}
              </Badge>
            ) : (
              <span className="text-xs text-green-400 flex items-center gap-1">
                <CheckCircle className="w-3 h-3" /> Sin solicitudes pendientes
              </span>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0"
            style={{ color: GOLD }}
            onClick={() => setExpandido(!expandido)}
          >
            {expandido ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </Button>
        </div>

        {/* Solicitudes pendientes — siempre visibles cuando existen */}
        {solicitudesPendientes.length > 0 && (
          <div className="px-4 pb-3 space-y-2" style={{ borderTop: `1px solid ${BDR}` }}>
            <p className="text-xs font-semibold flex items-center gap-1 pt-3" style={{ color: GOLD }}>
              <Camera className="w-3 h-3" /> Solicitudes de entrada
            </p>
            {solicitudesPendientes.map(sol => (
              <div
                key={sol.id}
                className="flex items-center gap-3 p-3 rounded-lg"
                style={{ background: 'rgba(201,169,97,0.07)', border: `1px solid rgba(201,169,97,0.25)` }}
              >
                {/* Foto */}
                {sol.selfieUrl ? (
                  <img
                    src={sol.selfieUrl}
                    alt={sol.modeloNombre}
                    className="w-14 h-14 rounded-full object-cover flex-shrink-0"
                    style={{ border: `2px solid ${GOLD}` }}
                  />
                ) : (
                  <div
                    className="w-14 h-14 rounded-full flex-shrink-0 flex items-center justify-center"
                    style={{ border: `2px solid ${GOLD}`, background: 'rgba(201,169,97,0.1)' }}
                  >
                    <User className="w-6 h-6" style={{ color: GOLD }} />
                  </div>
                )}

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-white text-sm truncate">{sol.modeloNombre}</p>
                  <p className="text-xs" style={{ color: 'rgba(255,255,255,0.45)' }}>
                    {sol.fecha.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}
                    {' · '}
                    {sol.fecha.toLocaleDateString('es-CO', { day: 'numeric', month: 'short' })}
                  </p>
                </div>

                {/* Acciones */}
                <div className="flex gap-2 flex-shrink-0">
                  <Button
                    size="sm"
                    className="bg-green-600 hover:bg-green-700 text-white h-8 px-3 text-xs gap-1"
                    disabled={procesando === sol.id}
                    onClick={() => handleAprobar(sol.id, sol.modeloNombre)}
                  >
                    <CheckCircle className="w-3 h-3" /> Aprobar
                  </Button>
                  <Button
                    size="sm"
                    className="bg-red-600 hover:bg-red-700 text-white h-8 px-3 text-xs gap-1"
                    disabled={procesando === sol.id}
                    onClick={() => setRechazarModal({ id: sol.id, nombre: sol.modeloNombre })}
                  >
                    <XCircle className="w-3 h-3" /> Rechazar
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Contenido expandible — histórico y estadísticas */}
        {expandido && (
          <div className="px-4 pb-4 space-y-4" style={{ borderTop: `1px solid ${BDR}` }}>
            <Tabs value={vistaActual} onValueChange={v => setVistaActual(v as any)}>
              <div className="flex items-center justify-between gap-2 pt-3">
                <TabsList className="grid grid-cols-4 flex-1">
                  <TabsTrigger value="diaria">Diaria</TabsTrigger>
                  <TabsTrigger value="semanal">Semanal</TabsTrigger>
                  <TabsTrigger value="mensual">Mensual</TabsTrigger>
                  <TabsTrigger value="multas">Multas</TabsTrigger>
                </TabsList>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={exportarPDF}
                  className="border-primary/30 hover:bg-primary/20 hover:text-primary shrink-0"
                >
                  <FileDown className="w-3 h-3 mr-1" /> PDF
                </Button>
              </div>

              {/* Navegación de período */}
              <div
                className="flex items-center justify-between p-2 rounded-lg"
                style={{ background: 'rgba(255,255,255,0.04)', border: `1px solid ${BDR}` }}
              >
                <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => navPeriodo(-1)}>
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <div className="flex items-center gap-2">
                  <p className="font-medium text-sm text-center" style={{ color: GOLD }}>{textoPeriodo()}</p>
                  <Button variant="ghost" size="sm" className="h-6 px-2 text-xs" onClick={() => setFechaSel(new Date())}>
                    Hoy
                  </Button>
                </div>
                <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => navPeriodo(1)}>
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>

              {/* Estadísticas mini */}
              <div className="grid grid-cols-4 gap-2">
                {[
                  { icon: <Users className="w-3 h-3" />, label: 'Activas',     val: stats.modelosActivas,              color: '#22c55e' },
                  { icon: <Calendar className="w-3 h-3" />, label: 'Registros', val: stats.totalRegistros,              color: GOLD },
                  { icon: <AlertCircle className="w-3 h-3" />, label: 'Multas', val: multas.filter(m => m.estado === 'activa').length, color: '#ef4444' },
                  { icon: <TrendingUp className="w-3 h-3" />, label: 'Finalizados', val: stats.registrosFinalizados,    color: GOLD },
                ].map(({ icon, label, val, color }) => (
                  <div key={label} className="p-2 rounded-lg text-center" style={{ background: 'rgba(255,255,255,0.04)', border: `1px solid ${BDR}` }}>
                    <div className="flex items-center justify-center gap-1 mb-1" style={{ color }}>
                      {icon}
                      <span className="text-xs">{label}</span>
                    </div>
                    <p className="text-lg font-bold" style={{ color }}>{val}</p>
                  </div>
                ))}
              </div>

              {/* ── TAB DIARIA ── */}
              <TabsContent value="diaria" className="space-y-3 mt-0">
                {modelosEnTurno.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold mb-2 flex items-center gap-1 text-green-400">
                      <Badge className="bg-green-500/80 text-white text-xs">
                        Activas ahora · {modelosEnTurno.length}
                      </Badge>
                    </p>
                    <div className="space-y-2">
                      {modelosEnTurno.map(r => {
                        const start = r.horaLlegada;
                        const elapsed = Date.now() - start.getTime();
                        const horas   = Math.floor(elapsed / 3600000);
                        const mins    = Math.floor((elapsed % 3600000) / 60000);
                        const totalReqSecs = 8 * 3600;
                        const elapsedSecs = Math.floor(elapsed / 1000);
                        const progreso = Math.min(100, (elapsedSecs / totalReqSecs) * 100);
                        
                        const solSelfie = solicitudesEntrada.find(s => s.id === r.solicitudEntradaId);
                        const foto = solSelfie?.selfieUrl ?? r.selfieUrl;

                        return (
                          <div
                            key={r.id}
                            className="p-4 rounded-xl space-y-3"
                            style={{ background: 'rgba(34,197,94,0.04)', border: '1px solid rgba(34,197,94,0.15)' }}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                {foto ? (
                                  <img
                                    src={foto}
                                    alt={r.modeloNombre}
                                    className="w-12 h-12 rounded-full object-cover flex-shrink-0"
                                    style={{ border: `2px solid ${GOLD}` }}
                                  />
                                ) : (
                                  <div
                                    className="w-12 h-12 rounded-full flex-shrink-0 flex items-center justify-center"
                                    style={{ border: `2px solid ${GOLD}`, background: 'rgba(201,169,97,0.1)' }}
                                  >
                                    <span className="text-sm font-bold" style={{ color: GOLD }}>{r.modeloNombre.charAt(0)}</span>
                                  </div>
                                )}
                                <div>
                                  <p className="font-bold text-white leading-tight">{r.modeloNombre}</p>
                                  <p className="text-[10px] uppercase tracking-wider font-bold" style={{ color: GOLD }}>
                                    Turno Estándar 8h
                                  </p>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="text-lg font-black text-white tabular-nums leading-none">
                                  {horas}h {mins}m
                                </p>
                                <p className="text-[10px] text-muted-foreground uppercase">Tiempo Transcurrido</p>
                              </div>
                            </div>

                            <div className="space-y-1.5">
                              <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                                <span>Progreso</span>
                                <span style={{ color: progreso >= 100 ? '#22c55e' : GOLD }}>{Math.floor(progreso)}%</span>
                              </div>
                              <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                                <div 
                                  className="h-full transition-all duration-1000" 
                                  style={{ 
                                    width: `${progreso}%`, 
                                    background: progreso >= 100 ? '#22c55e' : GOLD,
                                    boxShadow: `0 0 10px ${progreso >= 100 ? 'rgba(34,197,94,0.4)' : 'rgba(201,168,76,0.4)'}`
                                  }} 
                                />
                              </div>
                              <div className="flex justify-between items-center">
                                <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                                  <LogIn className="w-3 h-3 text-green-500" />
                                  Entrada: {start.toLocaleTimeString('es-CO',{hour:'2-digit',minute:'2-digit'})}
                                </div>
                                {progreso < 100 && (
                                  <Badge variant="outline" className="text-[9px] border-yellow-500/30 text-yellow-500">
                                    Multa si sale ahora
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {registrosPeriodo.filter(r => r.estado === 'Finalizado').length > 0 && (
                  <div>
                    <p className="text-xs font-semibold mb-2" style={{ color: 'rgba(255,255,255,0.5)' }}>Finalizados</p>
                    <div className="space-y-1 max-h-56 overflow-y-auto">
                      {registrosPeriodo.filter(r => r.estado === 'Finalizado').map(r => (
                        <div
                          key={r.id}
                          className="flex items-center justify-between px-3 py-2 rounded-lg"
                          style={{ background: 'rgba(255,255,255,0.03)', border: `1px solid ${BDR}` }}
                        >
                          <div className="flex items-center gap-2">
                            {r.selfieUrl ? (
                              <img
                                src={r.selfieUrl}
                                alt={r.modeloNombre}
                                className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                                style={{ border: `1.5px solid ${GOLD}` }}
                              />
                            ) : (
                              <div
                                className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center"
                                style={{ border: `1.5px solid ${BDR}`, background: 'rgba(255,255,255,0.06)' }}
                              >
                                <span className="text-xs font-bold" style={{ color: GOLD }}>{r.modeloNombre.charAt(0)}</span>
                              </div>
                            )}
                            <div>
                              <p className="text-sm font-medium text-white">{r.modeloNombre}</p>
                              <div className="flex items-center gap-2 text-xs" style={{ color: 'rgba(255,255,255,0.45)' }}>
                                <span className="flex items-center gap-1"><LogIn className="w-3 h-3 text-green-500" />{r.horaLlegada.toLocaleTimeString('es-CO',{hour:'2-digit',minute:'2-digit'})}</span>
                                {r.horaSalida && <span className="flex items-center gap-1"><LogOut className="w-3 h-3 text-red-400" />{r.horaSalida.toLocaleTimeString('es-CO',{hour:'2-digit',minute:'2-digit'})}</span>}
                              </div>
                            </div>
                          </div>
                          <p className="font-bold text-sm" style={{ color: GOLD }}>{r.horasTrabajadas?.toFixed(1)}h</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {registrosPeriodo.length === 0 && (
                  <p className="text-center text-xs py-4" style={{ color: 'rgba(255,255,255,0.35)' }}>
                    Sin registros para este día
                  </p>
                )}
              </TabsContent>

              {/* ── TAB SEMANAL ── */}
              <TabsContent value="semanal" className="space-y-2 mt-0">
                {Object.keys(stats.porModelo).length > 0 ? (
                  Object.entries(stats.porModelo)
                    .sort((a,b) => b[1].horas - a[1].horas)
                    .map(([email, data]) => (
                      <div
                        key={email}
                        className="flex items-center justify-between p-3 rounded-lg"
                        style={{ background: 'rgba(255,255,255,0.04)', border: `1px solid ${BDR}` }}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                            style={{ border: `2px solid ${GOLD}`, background: 'rgba(201,169,97,0.1)' }}
                          >
                            <span className="font-bold text-sm" style={{ color: GOLD }}>{data.nombre.charAt(0)}</span>
                          </div>
                          <div>
                            <p className="font-semibold text-sm text-white">{data.nombre}</p>
                            <p className="text-xs" style={{ color: 'rgba(255,255,255,0.45)' }}>{data.dias} días</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-xl font-bold" style={{ color: GOLD }}>{data.horas.toFixed(1)}h</p>
                          <p className="text-xs" style={{ color: 'rgba(255,255,255,0.45)' }}>{(data.horas/data.dias).toFixed(1)}h/día</p>
                        </div>
                      </div>
                    ))
                ) : (
                  <p className="text-center text-xs py-4" style={{ color: 'rgba(255,255,255,0.35)' }}>Sin registros esta semana</p>
                )}
              </TabsContent>

              {/* ── TAB MENSUAL ── */}
              <TabsContent value="mensual" className="space-y-2 mt-0">
                {Object.keys(stats.porModelo).length > 0 ? (
                  Object.entries(stats.porModelo)
                    .sort((a,b) => b[1].horas - a[1].horas)
                    .map(([email, data]) => (
                      <div
                        key={email}
                        className="p-3 rounded-lg"
                        style={{ background: 'rgba(255,255,255,0.04)', border: `1px solid ${BDR}` }}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-3">
                            <div
                              className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                              style={{ border: `2px solid ${GOLD}`, background: 'rgba(201,169,97,0.1)' }}
                            >
                              <span className="font-bold text-sm" style={{ color: GOLD }}>{data.nombre.charAt(0)}</span>
                            </div>
                            <div>
                              <p className="font-semibold text-white">{data.nombre}</p>
                              <p className="text-xs" style={{ color: 'rgba(255,255,255,0.45)' }}>{email}</p>
                            </div>
                          </div>
                          <p className="text-2xl font-bold" style={{ color: GOLD }}>{data.horas.toFixed(1)}h</p>
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-xs">
                          {[
                            { label: 'Días',       val: data.dias },
                            { label: 'Prom/día',   val: (data.horas/data.dias).toFixed(1)+'h' },
                            { label: 'Total',      val: data.horas.toFixed(1)+'h' },
                          ].map(({ label, val }) => (
                            <div
                              key={label}
                              className="p-2 rounded text-center"
                              style={{ background: 'rgba(255,255,255,0.04)', border: `1px solid ${BDR}` }}
                            >
                              <p style={{ color: 'rgba(255,255,255,0.45)' }} className="mb-1">{label}</p>
                              <p className="font-bold" style={{ color: GOLD }}>{val}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))
                ) : (
                  <p className="text-center text-xs py-4" style={{ color: 'rgba(255,255,255,0.35)' }}>Sin registros este mes</p>
                )}
              </TabsContent>
              {/* ── TAB MULTAS ── */}
              <TabsContent value="multas" className="space-y-3 mt-0">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-semibold px-1">
                    <span className="text-muted-foreground">Últimas Penalizaciones</span>
                    <span className="text-red-400">Total: ${multas.reduce((s,m) => s + (m.estado === 'activa' ? m.monto : 0), 0).toLocaleString()}</span>
                  </div>
                  <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
                    {multas.length === 0 ? (
                      <p className="text-center text-xs py-12 text-muted-foreground">No hay multas registradas</p>
                    ) : (
                      multas.map(m => (
                        <div 
                          key={m.id}
                          className="p-3 rounded-xl border border-red-500/20 bg-red-500/5 space-y-2"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center border border-red-500/30">
                                <AlertCircle className="w-4 h-4 text-red-400" />
                              </div>
                              <div>
                                <p className="text-sm font-bold text-white leading-none">{m.modeloNombre}</p>
                                <p className="text-[10px] text-muted-foreground mt-1">
                                  {new Date(m.fecha).toLocaleDateString('es-CO', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-black text-red-400">${m.monto.toLocaleString()}</p>
                              <Badge variant="outline" className={`text-[9px] px-1 h-4 border-red-500/30 text-red-400 ${m.estado !== 'activa' && 'opacity-50'}`}>
                                {m.estado === 'activa' ? 'Pendiente' : m.estado.toUpperCase()}
                              </Badge>
                            </div>
                          </div>
                          <div className="text-[11px] text-muted-foreground bg-black/20 p-2 rounded-lg border border-white/5">
                            <span className="font-bold text-white uppercase text-[9px] block mb-0.5">Motivo:</span>
                            {m.motivo}
                          </div>
                          {m.jornadaId && (
                            <div className="flex items-center justify-between text-[10px]">
                              <span className="text-muted-foreground">Horas trabajadas: <b className="text-white">{m.horasTrabajadas}h</b> / {m.horasRequeridas}h</span>
                              <span className="text-red-400 font-bold">-{m.horasFaltantes}h</span>
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        )}
      </div>
    </>
  );
}
