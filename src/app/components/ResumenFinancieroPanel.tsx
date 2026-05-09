import { useState, useEffect } from 'react';
import { supabase } from '../../utils/supabase/info';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { DollarSign, TrendingUp, Activity, Clock, RefreshCw } from 'lucide-react';

type Periodo = 'hoy' | 'semana' | 'mes' | 'todo';

interface ResumenData {
  facturado_hoy: number;
  pagado_modelos_hoy: number;
  servicios_hoy: number;
  facturado_semana: number;
  facturado_mes: number;
  pagado_modelos_mes: number;
  servicios_mes: number;
  facturado_total_historico: number;
  pagado_modelos_historico: number;
  servicios_total_historico: number;
  por_pagar_modelos: number;
}

interface HistorialModelo {
  modelo_id: string;
  nombre_artistico: string;
  email: string;
  total_servicios: number;
  servicios_completados: number;
  servicios_este_mes: number;
  total_ganado_historico: number;
  ganado_este_mes: number;
  pendiente_cobrar: number;
  total_facturado_historico: number;
  total_multado: number;
  multas_activas: number;
  total_adelantos: number;
  dias_trabajados_total: number;
  dias_trabajados_mes: number;
}

const fmt = (n: number) => {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n.toLocaleString('es-CO')}`;
};

export function ResumenFinancieroPanel() {
  const [periodo, setPeriodo] = useState<Periodo>('mes');
  const [data, setData] = useState<ResumenData | null>(null);
  const [modelos, setModelos] = useState<HistorialModelo[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingModelos, setLoadingModelos] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const cargarResumen = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data: rows, error: err } = await supabase
        .from('resumen_financiero_negocio')
        .select('*')
        .single();
      if (err) throw err;
      setData(rows);
    } catch (e: any) {
      setError('No se pudo cargar el resumen financiero.');
    } finally {
      setLoading(false);
    }
  };

  const cargarHistorialModelos = async () => {
    setLoadingModelos(true);
    try {
      const { data: rows } = await supabase
        .from('historial_financiero_modelo')
        .select('*')
        .order('total_ganado_historico', { ascending: false });
      setModelos(rows || []);
    } finally {
      setLoadingModelos(false);
    }
  };

  useEffect(() => {
    cargarResumen();
    cargarHistorialModelos();
  }, []);

  const getValores = () => {
    if (!data) return { facturado: 0, pagadoModelos: 0, servicios: 0 };
    switch (periodo) {
      case 'hoy':    return { facturado: data.facturado_hoy,              pagadoModelos: data.pagado_modelos_hoy,       servicios: data.servicios_hoy };
      case 'semana': return { facturado: data.facturado_semana,           pagadoModelos: 0,                             servicios: 0 };
      case 'mes':    return { facturado: data.facturado_mes,              pagadoModelos: data.pagado_modelos_mes,       servicios: data.servicios_mes };
      case 'todo':   return { facturado: data.facturado_total_historico,  pagadoModelos: data.pagado_modelos_historico, servicios: data.servicios_total_historico };
    }
  };

  const { facturado, pagadoModelos, servicios } = getValores();

  const periodos: { key: Periodo; label: string }[] = [
    { key: 'hoy',    label: 'Hoy' },
    { key: 'semana', label: 'Semana' },
    { key: 'mes',    label: 'Mes' },
    { key: 'todo',   label: 'Todo' },
  ];

  return (
    <div className="space-y-6">
      {/* ── Resumen con filtro de período ── */}
      <Card className="border-primary/20 bg-gradient-to-br from-card to-card/50">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-primary" />
                Resumen Financiero
              </CardTitle>
              <CardDescription>Datos históricos del negocio</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex gap-1 bg-secondary rounded-lg p-1">
                {periodos.map(p => (
                  <button
                    key={p.key}
                    onClick={() => setPeriodo(p.key)}
                    className={`px-3 py-1 rounded-md text-sm font-medium transition-all ${
                      periodo === p.key
                        ? 'bg-primary text-primary-foreground shadow-sm'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
              <Button
                size="icon"
                variant="ghost"
                className="w-8 h-8"
                onClick={() => { cargarResumen(); cargarHistorialModelos(); }}
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {error ? (
            <p className="text-sm text-destructive text-center py-4">{error}</p>
          ) : loading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[1,2,3].map(i => (
                <div key={i} className="h-20 bg-secondary/50 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-lg border border-primary/20 bg-primary/5">
                  <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                    <TrendingUp className="w-3 h-3" /> Facturado
                  </p>
                  <p className="text-2xl font-bold text-primary">{fmt(facturado)}</p>
                </div>
                <div className="p-4 rounded-lg border border-primary/20 bg-primary/5">
                  <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                    <DollarSign className="w-3 h-3" /> Pagado a Modelos
                  </p>
                  <p className="text-2xl font-bold text-primary">{fmt(pagadoModelos)}</p>
                </div>
                <div className="p-4 rounded-lg border border-primary/20 bg-primary/5">
                  <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                    <Activity className="w-3 h-3" /> Servicios
                  </p>
                  <p className="text-2xl font-bold text-primary">{servicios}</p>
                </div>
              </div>

              {data && data.por_pagar_modelos > 0 && (
                <div className="mt-4 p-3 rounded-lg border border-yellow-500/30 bg-yellow-500/5 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-yellow-400 shrink-0" />
                  <p className="text-sm text-yellow-300">
                    Por pagar a modelos: <span className="font-bold">{fmt(data.por_pagar_modelos)}</span>
                  </p>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* ── Historial por modelo ── */}
      <Card className="border-primary/20 bg-gradient-to-br from-card to-card/50">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <TrendingUp className="w-4 h-4 text-primary" />
            Historial Financiero por Modelo
          </CardTitle>
          <CardDescription>Acumulado total desde el primer servicio</CardDescription>
        </CardHeader>
        <CardContent>
          {loadingModelos ? (
            <div className="space-y-3">
              {[1,2,3].map(i => (
                <div key={i} className="h-16 bg-secondary/50 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : modelos.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">
              Sin datos históricos aún — aparecerán con el primer servicio completado.
            </p>
          ) : (
            <div className="space-y-3">
              {modelos.map(m => (
                <div
                  key={m.modelo_id}
                  className="p-4 rounded-lg border border-border/50 bg-secondary/20 space-y-3"
                >
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div>
                      <p className="font-semibold text-foreground">
                        {m.nombre_artistico || m.email}
                      </p>
                      <p className="text-xs text-muted-foreground">{m.email}</p>
                    </div>
                    {m.multas_activas > 0 && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 border border-red-500/30">
                        {m.multas_activas} multa{m.multas_activas > 1 ? 's' : ''}
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                    <div>
                      <p className="text-xs text-muted-foreground">Servicios total</p>
                      <p className="font-bold text-foreground">{m.servicios_completados}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Este mes</p>
                      <p className="font-bold text-foreground">{m.servicios_este_mes}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Ganado total</p>
                      <p className="font-bold text-primary">{fmt(m.total_ganado_historico)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Este mes</p>
                      <p className="font-bold text-primary">{fmt(m.ganado_este_mes)}</p>
                    </div>
                  </div>

                  {(m.pendiente_cobrar > 0 || m.total_multado > 0 || m.total_adelantos > 0) && (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm pt-2 border-t border-border/30">
                      {m.pendiente_cobrar > 0 && (
                        <div>
                          <p className="text-xs text-muted-foreground">Pendiente cobrar</p>
                          <p className="font-semibold text-yellow-400">{fmt(m.pendiente_cobrar)}</p>
                        </div>
                      )}
                      {m.total_multado > 0 && (
                        <div>
                          <p className="text-xs text-muted-foreground">Total multado</p>
                          <p className="font-semibold text-red-400">{fmt(m.total_multado)}</p>
                        </div>
                      )}
                      {m.total_adelantos > 0 && (
                        <div>
                          <p className="text-xs text-muted-foreground">Adelantos</p>
                          <p className="font-semibold text-blue-400">{fmt(m.total_adelantos)}</p>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="text-xs text-muted-foreground flex gap-4 pt-1">
                    <span>Días trabajados: <strong className="text-foreground">{m.dias_trabajados_total}</strong></span>
                    <span>Este mes: <strong className="text-foreground">{m.dias_trabajados_mes}</strong></span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
