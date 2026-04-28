import { useState, useEffect, useCallback } from 'react';
import { DoorOpen, Timer, Users, CheckCircle, Clock, AlertTriangle, X, Loader2, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { supabase } from '../utils/supabase/info';
import { useModelos } from '../app/components/ModelosContext';
import { toast } from 'sonner';

interface Habitacion {
  id: string;
  numero: number;
  nombre: string | null;
  estado: 'disponible' | 'ocupada' | 'limpieza';
  modelo_email: string | null;
  modelo_nombre: string | null;
  hora_inicio: string | null;
  duracion_minutos: number | null;
  hora_fin_estimada: string | null;
  precio_hora: number | null;
  observaciones: string | null;
}

function calcularTiempoRestante(horaFin: string | null): string {
  if (!horaFin) return 'Sin tiempo definido';
  const fin = new Date(horaFin);
  const ahora = new Date();
  const diff = fin.getTime() - ahora.getTime();
  if (diff <= 0) return 'Tiempo cumplido';
  const mins = Math.floor(diff / 60000);
  const hrs = Math.floor(mins / 60);
  const minsRest = mins % 60;
  return hrs > 0 ? `${hrs}h ${minsRest}m restantes` : `${minsRest}m restantes`;
}

function tiempoRestanteMinutos(horaFin: string | null): number {
  if (!horaFin) return 999;
  const fin = new Date(horaFin);
  const ahora = new Date();
  return Math.floor((fin.getTime() - ahora.getTime()) / 60000);
}

export function HabitacionesPanel() {
  const [habitaciones, setHabitaciones] = useState<Habitacion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  // Modal asignar
  const [modalAsignar, setModalAsignar] = useState<Habitacion | null>(null);
  const [modeloSeleccionada, setModeloSeleccionada] = useState('');
  const [duracion, setDuracion] = useState(60);
  const [guardando, setGuardando] = useState(false);

  // Modal liberar
  const [modalLiberar, setModalLiberar] = useState<Habitacion | null>(null);

  const { modelos } = useModelos();
  const modelosActivos = modelos.filter(m => m.activa);

  const cargarHabitaciones = useCallback(async () => {
    const { data, error: err } = await supabase
      .from('habitaciones')
      .select('*')
      .order('numero', { ascending: true })
      .limit(50);

    if (err) {
      setError(err.message);
    } else {
      setHabitaciones((data as Habitacion[]) || []);
      setError(null);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    cargarHabitaciones();

    const channel = supabase
      .channel('habitaciones-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'habitaciones' }, () => {
        cargarHabitaciones();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [cargarHabitaciones]);

  // Tick cada minuto para cuentas regresivas
  useEffect(() => {
    const interval = setInterval(() => setTick(t => t + 1), 60000);
    return () => clearInterval(interval);
  }, []);

  const handleAsignar = async () => {
    if (!modalAsignar || !modeloSeleccionada) return;
    const modelo = modelosActivos.find(m => m.email === modeloSeleccionada);
    if (!modelo) return;

    setGuardando(true);
    const { error: err } = await supabase
      .from('habitaciones')
      .update({
        estado: 'ocupada',
        modelo_email: modelo.email,
        modelo_nombre: modelo.nombreArtistico || modelo.nombre,
        hora_inicio: new Date().toISOString(),
        duracion_minutos: duracion,
        hora_fin_estimada: new Date(Date.now() + duracion * 60000).toISOString(),
      })
      .eq('id', modalAsignar.id);

    if (err) {
      toast.error('Error al asignar: ' + err.message);
    } else {
      toast.success(`Habitación ${modalAsignar.numero} asignada a ${modelo.nombreArtistico || modelo.nombre}`);
      setModalAsignar(null);
      setModeloSeleccionada('');
      setDuracion(60);
    }
    setGuardando(false);
  };

  const handleLiberar = async () => {
    if (!modalLiberar) return;
    setGuardando(true);
    const { error: err } = await supabase
      .from('habitaciones')
      .update({
        estado: 'limpieza',
        modelo_email: null,
        modelo_nombre: null,
        hora_inicio: null,
        hora_fin_estimada: null,
        duracion_minutos: null,
      })
      .eq('id', modalLiberar.id);

    if (err) {
      toast.error('Error al liberar: ' + err.message);
    } else {
      toast.success(`Habitación ${modalLiberar.numero} en limpieza`);
      setModalLiberar(null);
    }
    setGuardando(false);
  };

  const handleMarcarDisponible = async (hab: Habitacion) => {
    const { error: err } = await supabase
      .from('habitaciones')
      .update({ estado: 'disponible' })
      .eq('id', hab.id);

    if (err) {
      toast.error('Error: ' + err.message);
    } else {
      toast.success(`Habitación ${hab.numero} disponible`);
    }
  };

  // Conteos
  const disponibles = habitaciones.filter(h => h.estado === 'disponible').length;
  const ocupadas = habitaciones.filter(h => h.estado === 'ocupada').length;
  const limpieza = habitaciones.filter(h => h.estado === 'limpieza').length;
  const pct = habitaciones.length > 0 ? Math.round((ocupadas / habitaciones.length) * 100) : 0;

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[1,2,3,4].map(i => <div key={i} className="h-20 rounded-lg bg-secondary/50 animate-pulse" />)}
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {[1,2,3,4,5,6,7,8].map(i => <div key={i} className="h-48 rounded-lg bg-secondary/50 animate-pulse" />)}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border-destructive/50">
        <CardContent className="p-8 text-center">
          <AlertTriangle className="w-12 h-12 mx-auto text-destructive mb-4" />
          <h3 className="text-lg font-semibold text-destructive mb-2">Error cargando habitaciones</h3>
          <p className="text-muted-foreground text-sm mb-2">{error}</p>
          {error.includes('schema cache') && (
            <p className="text-xs text-muted-foreground bg-secondary/50 rounded p-3 mt-3 text-left">
              La tabla <code>habitaciones</code> no existe en Supabase.{'\n'}
              Ejecuta el archivo <strong>supabase_habitaciones.sql</strong> en el SQL Editor de Supabase.
            </p>
          )}
          <Button onClick={cargarHabitaciones} variant="outline" className="mt-4">
            <RefreshCw className="w-4 h-4 mr-2" /> Reintentar
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4" key={tick}>
      {/* Header con estadísticas */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="border-border/50">
          <CardContent className="p-4 flex items-center gap-3">
            <DoorOpen className="w-8 h-8 text-muted-foreground flex-shrink-0" />
            <div>
              <p className="text-2xl font-bold">{habitaciones.length}</p>
              <p className="text-xs text-muted-foreground">Total</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-green-500/30 bg-green-950/10">
          <CardContent className="p-4 flex items-center gap-3">
            <CheckCircle className="w-8 h-8 text-green-400 flex-shrink-0" />
            <div>
              <p className="text-2xl font-bold text-green-400">{disponibles}</p>
              <p className="text-xs text-muted-foreground">Disponibles</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-red-500/30 bg-red-950/10">
          <CardContent className="p-4 flex items-center gap-3">
            <Users className="w-8 h-8 text-red-400 flex-shrink-0" />
            <div>
              <p className="text-2xl font-bold text-red-400">{ocupadas}</p>
              <p className="text-xs text-muted-foreground">Ocupadas</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-yellow-500/30 bg-yellow-950/10">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center">
              <div className="w-6 h-6 rounded-full border-2 border-yellow-400 border-t-transparent animate-spin" />
            </div>
            <div>
              <p className="text-2xl font-bold text-yellow-400">{limpieza}</p>
              <p className="text-xs text-muted-foreground">Limpieza</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Barra de ocupación */}
      <div className="flex items-center gap-3 px-1">
        <span className="text-sm text-muted-foreground flex-shrink-0">Ocupación {pct}%</span>
        <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-green-500 to-red-500 rounded-full transition-all duration-500"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      {/* Grid de habitaciones */}
      {habitaciones.length === 0 ? (
        <Card className="border-dashed border-2 border-border/50">
          <CardContent className="p-12 text-center">
            <DoorOpen className="w-16 h-16 mx-auto text-muted-foreground/30 mb-4" />
            <p className="text-muted-foreground">No hay habitaciones registradas</p>
            <p className="text-xs text-muted-foreground mt-1">
              Ejecuta <strong>supabase_habitaciones.sql</strong> para crear las habitaciones
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {habitaciones.map((hab) => {
            const minsRestantes = hab.estado === 'ocupada' ? tiempoRestanteMinutos(hab.hora_fin_estimada) : 999;
            const advertencia = hab.estado === 'ocupada' && minsRestantes <= 15 && minsRestantes > 0;
            const tiempoCumplido = hab.estado === 'ocupada' && minsRestantes <= 0;

            let borderColor = 'border-green-500/60';
            let bgGradient = 'from-green-950/50 to-green-950/20';
            let headerBg = 'bg-green-950/40 border-green-500/30';
            let badgeClass = 'bg-green-500 text-white';
            let badgeLabel = 'DISPONIBLE';
            let iconColor = 'text-green-400';

            if (hab.estado === 'ocupada') {
              if (tiempoCumplido) {
                borderColor = 'border-red-500 animate-pulse';
              } else if (advertencia) {
                borderColor = 'border-yellow-400 shadow-yellow-400/30 shadow-lg';
              } else {
                borderColor = 'border-red-500/60';
              }
              bgGradient = 'from-red-950/50 to-red-950/20';
              headerBg = 'bg-red-950/40 border-red-500/30';
              badgeClass = 'bg-red-500 text-white';
              badgeLabel = 'OCUPADA';
              iconColor = 'text-red-400';
            } else if (hab.estado === 'limpieza') {
              borderColor = 'border-yellow-500/60';
              bgGradient = 'from-yellow-950/50 to-yellow-950/20';
              headerBg = 'bg-yellow-950/40 border-yellow-500/30';
              badgeClass = 'bg-yellow-500 text-black';
              badgeLabel = 'LIMPIEZA';
              iconColor = 'text-yellow-400';
            }

            return (
              <div
                key={hab.id}
                className={`relative rounded-xl border-2 bg-gradient-to-br ${bgGradient} ${borderColor} overflow-hidden transition-all duration-300`}
              >
                {/* Header */}
                <div className={`px-4 py-3 border-b ${headerBg} flex items-center justify-between`}>
                  <div className="flex items-center gap-2">
                    <DoorOpen className={`w-4 h-4 ${iconColor}`} />
                    <span className="text-3xl font-bold tabular-nums" style={{ fontFamily: 'monospace' }}>
                      {String(hab.numero).padStart(2, '0')}
                    </span>
                  </div>
                  <Badge className={`text-xs font-bold px-2 py-0.5 ${badgeClass}`}>
                    {badgeLabel}
                  </Badge>
                </div>

                {/* Contenido */}
                <div className="p-4 space-y-3">
                  {hab.estado === 'disponible' && (
                    <>
                      <div className="text-center py-3">
                        <CheckCircle className="w-10 h-10 mx-auto text-green-400/70 mb-2" />
                        <p className="text-sm font-medium text-green-300">Lista para usar</p>
                      </div>
                      <Button
                        size="sm"
                        className="w-full bg-green-600 hover:bg-green-700 text-white text-xs"
                        onClick={() => { setModalAsignar(hab); setModeloSeleccionada(''); setDuracion(60); }}
                      >
                        Asignar modelo
                      </Button>
                    </>
                  )}

                  {hab.estado === 'ocupada' && (
                    <>
                      {/* Modelo */}
                      <div>
                        <p className="font-bold text-sm text-white truncate">{hab.modelo_nombre || 'Sin nombre'}</p>
                        {hab.hora_inicio && (
                          <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                            <Clock className="w-3 h-3" />
                            Inicio: {new Date(hab.hora_inicio).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        )}
                      </div>

                      {/* Tiempo restante */}
                      <div className={`rounded-lg p-2.5 border text-center ${
                        tiempoCumplido
                          ? 'bg-red-900/50 border-red-400/50'
                          : advertencia
                          ? 'bg-yellow-900/50 border-yellow-400/50'
                          : 'bg-black/30 border-white/10'
                      }`}>
                        <div className="flex items-center justify-center gap-1 mb-0.5">
                          <Timer className={`w-3 h-3 ${tiempoCumplido ? 'text-red-400 animate-pulse' : advertencia ? 'text-yellow-400 animate-pulse' : 'text-primary'}`} />
                          <span className="text-xs text-muted-foreground">
                            {tiempoCumplido ? 'Tiempo cumplido' : advertencia ? '¡Próximo a terminar!' : 'Tiempo restante'}
                          </span>
                        </div>
                        <p className={`text-xl font-bold font-mono tabular-nums ${
                          tiempoCumplido ? 'text-red-400 animate-pulse' : advertencia ? 'text-yellow-400' : 'text-primary'
                        }`}>
                          {calcularTiempoRestante(hab.hora_fin_estimada)}
                        </p>
                      </div>

                      <Button
                        size="sm"
                        variant="outline"
                        className="w-full border-red-500/50 text-red-400 hover:bg-red-950/50 text-xs"
                        onClick={() => setModalLiberar(hab)}
                      >
                        Liberar habitación
                      </Button>
                    </>
                  )}

                  {hab.estado === 'limpieza' && (
                    <>
                      <div className="text-center py-3">
                        <div className="w-10 h-10 mx-auto mb-2 flex items-center justify-center">
                          <div className="w-8 h-8 rounded-full border-2 border-yellow-400 border-t-transparent animate-spin" />
                        </div>
                        <p className="text-sm font-medium text-yellow-300">En limpieza</p>
                      </div>
                      <Button
                        size="sm"
                        className="w-full bg-yellow-600 hover:bg-yellow-700 text-black font-semibold text-xs"
                        onClick={() => handleMarcarDisponible(hab)}
                      >
                        Marcar disponible
                      </Button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal: Asignar modelo */}
      {modalAsignar && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-primary/30 rounded-xl w-full max-w-sm p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-primary">
                Asignar — Hab. {String(modalAsignar.numero).padStart(2, '0')}
              </h3>
              <Button variant="ghost" size="icon" onClick={() => setModalAsignar(null)}>
                <X className="w-4 h-4" />
              </Button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs text-muted-foreground block mb-1">Modelo</label>
                <select
                  className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary"
                  value={modeloSeleccionada}
                  onChange={e => setModeloSeleccionada(e.target.value)}
                >
                  <option value="">— Seleccionar modelo —</option>
                  {modelosActivos.map(m => (
                    <option key={m.id} value={m.email}>
                      {m.nombreArtistico || m.nombre}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs text-muted-foreground block mb-1">Duración (minutos)</label>
                <input
                  type="number"
                  min={15}
                  max={480}
                  step={15}
                  className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary"
                  value={duracion}
                  onChange={e => setDuracion(Number(e.target.value))}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Fin estimado: {new Date(Date.now() + duracion * 60000).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <Button variant="outline" className="flex-1" onClick={() => setModalAsignar(null)}>
                Cancelar
              </Button>
              <Button
                className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                disabled={!modeloSeleccionada || guardando}
                onClick={handleAsignar}
              >
                {guardando ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Confirmar
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Liberar habitación */}
      {modalLiberar && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-red-500/30 rounded-xl w-full max-w-sm p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-red-400">
                Liberar — Hab. {String(modalLiberar.numero).padStart(2, '0')}
              </h3>
              <Button variant="ghost" size="icon" onClick={() => setModalLiberar(null)}>
                <X className="w-4 h-4" />
              </Button>
            </div>

            <p className="text-sm text-muted-foreground">
              ¿Confirmas liberar la habitación <strong className="text-white">{modalLiberar.numero}</strong>{' '}
              actualmente ocupada por{' '}
              <strong className="text-primary">{modalLiberar.modelo_nombre}</strong>?
            </p>
            <p className="text-xs text-yellow-400 flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" />
              La habitación pasará a estado <strong>En limpieza</strong>
            </p>

            <div className="flex gap-2 pt-2">
              <Button variant="outline" className="flex-1" onClick={() => setModalLiberar(null)}>
                Cancelar
              </Button>
              <Button
                className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                disabled={guardando}
                onClick={handleLiberar}
              >
                {guardando ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Liberar
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
