import React, { useState, useMemo } from 'react';
import { useAnalytics, FiltrosAnalytics } from './AnalyticsContext';
import { 
  exportarReporteHTML, 
  exportarReporteFinanciero,
  exportarTopModelos,
  exportarTopClientes,
  exportarMetricasGenerales,
  imprimirReporte
} from './AnalyticsExportHelper';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Button } from '../../components/ui/button';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Users, 
  Calendar,
  Award,
  AlertTriangle,
  Download,
  BarChart3,
  PieChart,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  FileText,
  Printer
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  AreaChart,
  Area
} from 'recharts';
import { toast } from 'sonner';

interface AnalyticsPanelProps {
  rol?: 'owner' | 'admin' | 'programador' | 'modelo';
}

export function AnalyticsPanel({ rol = 'owner' }: AnalyticsPanelProps) {
  const {
    obtenerMetricasGenerales,
    obtenerTopModelos,
    obtenerTopClientes,
    obtenerReporteFinanciero,
    obtenerDatosGrafica,
    compararPeriodos,
    cargando
  } = useAnalytics();

  // ==================== ESTADO ====================
  
  const [periodoSeleccionado, setPeriodoSeleccionado] = useState<'dia' | 'semana' | 'mes' | 'trimestre' | 'anio'>('mes');
  const [vistaActiva, setVistaActiva] = useState<'resumen' | 'ingresos' | 'servicios' | 'modelos' | 'clientes'>('resumen');

  // ==================== FILTROS DINÁMICOS ====================

  const filtrosActuales = useMemo((): FiltrosAnalytics => {
    const hoy = new Date();
    let fechaInicio: string;
    let fechaFin = hoy.toISOString().split('T')[0];

    switch (periodoSeleccionado) {
      case 'dia':
        fechaInicio = fechaFin;
        break;
      case 'semana':
        const inicioSemana = new Date(hoy);
        inicioSemana.setDate(hoy.getDate() - hoy.getDay() + 1);
        fechaInicio = inicioSemana.toISOString().split('T')[0];
        break;
      case 'mes':
        fechaInicio = new Date(hoy.getFullYear(), hoy.getMonth(), 1).toISOString().split('T')[0];
        break;
      case 'trimestre':
        const mesActual = hoy.getMonth();
        const mesInicioTrimestre = Math.floor(mesActual / 3) * 3;
        fechaInicio = new Date(hoy.getFullYear(), mesInicioTrimestre, 1).toISOString().split('T')[0];
        break;
      case 'anio':
        fechaInicio = new Date(hoy.getFullYear(), 0, 1).toISOString().split('T')[0];
        break;
      default:
        fechaInicio = new Date(hoy.getFullYear(), hoy.getMonth(), 1).toISOString().split('T')[0];
    }

    return {
      fechaInicio,
      fechaFin,
      periodo: periodoSeleccionado,
      soloCompletados: true,
    };
  }, [periodoSeleccionado]);

  // ==================== DATOS ====================

  const metricas = useMemo(() => obtenerMetricasGenerales(filtrosActuales), [obtenerMetricasGenerales, filtrosActuales]);
  const topModelos = useMemo(() => obtenerTopModelos(5, filtrosActuales), [obtenerTopModelos, filtrosActuales]);
  const topClientes = useMemo(() => obtenerTopClientes(10, filtrosActuales), [obtenerTopClientes, filtrosActuales]);
  const reporteFinanciero = useMemo(() => obtenerReporteFinanciero(filtrosActuales), [obtenerReporteFinanciero, filtrosActuales]);

  // Datos para gráficas
  const datosGraficaIngresos = useMemo(() => {
    const datos = obtenerDatosGrafica(['ingresos'], filtrosActuales);
    return datos.etiquetas.map((fecha, i) => ({
      fecha: new Date(fecha).toLocaleDateString('es-CO', { day: '2-digit', month: 'short' }),
      ingresos: datos.series[0]?.datos[i] || 0,
    }));
  }, [obtenerDatosGrafica, filtrosActuales]);

  const datosGraficaServicios = useMemo(() => {
    const datos = obtenerDatosGrafica(['servicios'], filtrosActuales);
    return datos.etiquetas.map((fecha, i) => ({
      fecha: new Date(fecha).toLocaleDateString('es-CO', { day: '2-digit', month: 'short' }),
      servicios: datos.series[0]?.datos[i] || 0,
    }));
  }, [obtenerDatosGrafica, filtrosActuales]);

  const datosGraficaComparativa = useMemo(() => {
    const datos = obtenerDatosGrafica(['ingresos', 'servicios'], filtrosActuales);
    return datos.etiquetas.map((fecha, i) => ({
      fecha: new Date(fecha).toLocaleDateString('es-CO', { day: '2-digit', month: 'short' }),
      ingresos: datos.series[0]?.datos[i] || 0,
      servicios: (datos.series[1]?.datos[i] || 0) * 50000, // Escalar para visualización
    }));
  }, [obtenerDatosGrafica, filtrosActuales]);

  // ==================== UTILIDADES ====================

  const formatearMoneda = (monto: number): string => {
    if (monto >= 1000000) {
      return `$${(monto / 1000000).toFixed(1)}M`;
    } else if (monto >= 1000) {
      return `$${(monto / 1000).toFixed(0)}k`;
    }
    return `$${monto.toLocaleString('es-CO')}`;
  };

  const formatearPorcentaje = (porcentaje: number): string => {
    return `${porcentaje.toFixed(1)}%`;
  };

  const obtenerIconoTendencia = (tendencia: 'subiendo' | 'bajando' | 'estable' | 'mejor' | 'peor' | 'igual') => {
    if (tendencia === 'subiendo' || tendencia === 'mejor') {
      return <ArrowUpRight className="w-4 h-4 text-green-500" />;
    } else if (tendencia === 'bajando' || tendencia === 'peor') {
      return <ArrowDownRight className="w-4 h-4 text-red-500" />;
    }
    return <Minus className="w-4 h-4 text-gray-400" />;
  };

  const obtenerColorTendencia = (tendencia: 'subiendo' | 'bajando' | 'estable' | 'mejor' | 'peor' | 'igual'): string => {
    if (tendencia === 'subiendo' || tendencia === 'mejor') return 'text-green-500';
    if (tendencia === 'bajando' || tendencia === 'peor') return 'text-red-500';
    return 'text-gray-400';
  };

  // ==================== COLORES TEMA BLACK DIAMOND ====================

  const COLORES = {
    dorado: '#D4AF37',
    doradoLight: '#f1d592',
    platino: '#C0C0C0',
    cobre: '#B87333',
    negro: '#0a0a0a',
    gris: '#1a1a1a',
    texto: '#ffffff',
    bgCard: 'rgba(15, 15, 15, 0.8)',
  };

  const COLORES_GRAFICAS = [COLORES.dorado, COLORES.platino, COLORES.cobre, '#8B7355', '#A0826D'];

  // ==================== COMPONENTE: TARJETA DE KPI ====================

  interface TarjetaKPIProps {
    titulo: string;
    valor: string | number;
    icono: React.ReactNode;
    tendencia?: {
      valor: number;
      direccion: 'subiendo' | 'bajando' | 'estable';
    };
    descripcion?: string;
  }

  const TarjetaKPI = ({ titulo, valor, icono, tendencia, descripcion }: TarjetaKPIProps) => (
    <Card className="relative overflow-hidden bg-zinc-950 border-zinc-800 transition-all hover:border-gold-500/50 group">
      <div className="absolute top-0 left-0 w-1 h-full bg-gold-500 opacity-0 group-hover:opacity-100 transition-opacity" />
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium text-gray-400">{titulo}</CardTitle>
          <div className="p-2 rounded-lg bg-gold-500/10 text-gold-500 group-hover:scale-110 transition-transform">
            {icono}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold text-white mb-1 tracking-tight">{valor}</div>
        <div className="flex items-center gap-2">
          {tendencia && (
            <div className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-zinc-900 border border-zinc-800">
              {obtenerIconoTendencia(tendencia.direccion)}
              <span className={obtenerColorTendencia(tendencia.direccion)}>
                {formatearPorcentaje(Math.abs(tendencia.valor))}
              </span>
            </div>
          )}
          {descripcion && (
            <p className="text-xs text-gray-500 truncate">{descripcion}</p>
          )}
        </div>
      </CardContent>
    </Card>
  );

  // ==================== VISTA: RESUMEN ====================

  const VistaResumen = () => (
    <div className="space-y-6">
      {/* KPIs Principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <TarjetaKPI
          titulo="Ingresos del Período"
          valor={formatearMoneda(
            periodoSeleccionado === 'dia' ? metricas.ingresosDelDia :
            periodoSeleccionado === 'semana' ? metricas.ingresosSemana :
            periodoSeleccionado === 'mes' ? metricas.ingresosMes :
            metricas.ingresosAnio
          )}
          icono={<DollarSign className="w-5 h-5" />}
          tendencia={{
            valor: 12.5,
            direccion: reporteFinanciero.tendencia === 'subiendo' ? 'subiendo' : reporteFinanciero.tendencia === 'bajando' ? 'bajando' : 'estable',
          }}
          descripcion={`Utilidad: ${formatearMoneda(metricas.utilidadNeta)}`}
        />

        <TarjetaKPI
          titulo="Servicios Completados"
          valor={
            periodoSeleccionado === 'dia' ? metricas.serviciosCompletadosHoy :
            periodoSeleccionado === 'semana' ? metricas.serviciosCompletadosSemana :
            metricas.serviciosCompletadosMes
          }
          icono={<Calendar className="w-5 h-5" />}
          descripcion={`Promedio: ${metricas.serviciosPromedioMes.toFixed(1)} por modelo`}
        />

        <TarjetaKPI
          titulo="Clientes Activos"
          valor={metricas.clientesActivosMes}
          icono={<Users className="w-5 h-5" />}
          descripcion={`${metricas.clientesNuevosMes} nuevos este mes`}
        />

        <TarjetaKPI
          titulo="Ticket Promedio"
          valor={formatearMoneda(metricas.ticketPromedio)}
          icono={<Activity className="w-5 h-5" />}
          descripcion={`${metricas.clientesFrecuentes} clientes frecuentes`}
        />
      </div>

      {/* Gráfica Principal e Invitado Especial (Boutique) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 bg-zinc-950 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-white flex items-center justify-between">
              <span>Ingresos en el Tiempo</span>
              <Activity className="w-4 h-4 text-gold-500" />
            </CardTitle>
            <CardDescription className="text-gray-400">
              Crecimiento de ingresos del período seleccionado
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={320}>
              <AreaChart data={datosGraficaIngresos}>
                <defs>
                  <linearGradient id="colorIngresos" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={COLORES.dorado} stopOpacity={0.3}/>
                    <stop offset="95%" stopColor={COLORES.dorado} stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#262626" vertical={false} />
                <XAxis dataKey="fecha" stroke="#525252" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#525252" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => formatearMoneda(value)} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#09090b', border: '1px solid #27272a', borderRadius: '12px', color: '#fff' }}
                  itemStyle={{ color: COLORES.dorado }}
                  formatter={(value: number) => [formatearMoneda(value), 'Ingresos']}
                />
                <Area 
                  type="monotone" 
                  dataKey="ingresos" 
                  stroke={COLORES.dorado} 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#colorIngresos)" 
                  animationDuration={1500}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="bg-zinc-950 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <PieChart className="w-4 h-4 text-gold-500" />
              Mix de Negocio
            </CardTitle>
            <CardDescription className="text-gray-400">Servicios vs Boutique</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center pt-4">
            <ResponsiveContainer width="100%" height={200}>
              <RechartsPieChart>
                <Pie
                  data={[
                    { name: 'Servicios', value: reporteFinanciero.ingresosPorServicios },
                    { name: 'Boutique', value: reporteFinanciero.ingresosOtros },
                    { name: 'Multas', value: reporteFinanciero.ingresosPorMultas }
                  ].filter(d => d.value > 0)}
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  <Cell fill={COLORES.dorado} />
                  <Cell fill={COLORES.platino} />
                  <Cell fill={COLORES.cobre} />
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#09090b', border: '1px solid #27272a', borderRadius: '8px' }}
                  formatter={(value: number) => formatearMoneda(value)}
                />
              </RechartsPieChart>
            </ResponsiveContainer>
            <div className="grid grid-cols-2 gap-4 mt-6 w-full">
               <div className="flex flex-col">
                  <span className="text-xs text-gray-500 uppercase">Servicios</span>
                  <span className="text-sm font-bold text-white">{formatearPorcentaje((reporteFinanciero.ingresosPorServicios / reporteFinanciero.ingresosTotal) * 100)}</span>
               </div>
               <div className="flex flex-col">
                  <span className="text-xs text-gray-500 uppercase">Boutique</span>
                  <span className="text-sm font-bold text-white">{formatearPorcentaje((reporteFinanciero.ingresosOtros / reporteFinanciero.ingresosTotal) * 100)}</span>
               </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Grid de 2 columnas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Top Modelos */}
        <Card className="bg-zinc-950 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Award className="w-5 h-5 text-gold-500" />
              Rendimiento de Modelos
            </CardTitle>
            <CardDescription className="text-gray-400">
              Las 5 modelos más productivas del periodo
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topModelos.map((modelo, idx) => (
                <div key={modelo.modeloEmail} className="group relative flex items-center justify-between p-4 bg-zinc-900/50 border border-transparent hover:border-gold-500/30 rounded-xl transition-all">
                  <div className="flex items-center gap-4">
                    <div className="relative">
                       <div className={`w-12 h-12 rounded-full border-2 flex items-center justify-center text-lg font-bold ${
                          idx === 0 ? 'border-gold-500 bg-gold-500/10 text-gold-500' :
                          idx === 1 ? 'border-zinc-400 bg-zinc-400/10 text-zinc-400' :
                          idx === 2 ? 'border-amber-700 bg-amber-700/10 text-amber-700' :
                          'border-zinc-800 bg-zinc-800 text-zinc-500'
                       }`}>
                          {idx + 1}
                       </div>
                       {idx === 0 && (
                         <div className="absolute -top-1 -right-1 bg-gold-500 text-black p-0.5 rounded-full">
                            <Award className="w-3 h-3" />
                         </div>
                       )}
                    </div>
                    <div>
                      <p className="text-white font-bold group-hover:text-gold-500 transition-colors">{modelo.modeloNombre}</p>
                      <div className="flex items-center gap-2 text-xs text-gray-400">
                        <Activity className="w-3 h-3" />
                        <span>{modelo.serviciosCompletados} servicios</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-gold-500 font-bold">{formatearMoneda(modelo.ingresosTotales)}</p>
                    <div className="text-[10px] text-gray-500 uppercase tracking-widest font-semibold">Ingresos</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Alertas y Métricas Críticas */}
        <Card className="bg-gradient-to-br from-gray-900 to-black border-gray-800">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-orange-500" />
              Alertas y Métricas Críticas
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Tasa de No-Show */}
            <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-white font-medium">Tasa de No-Show</span>
                <span className={`text-lg font-bold ${
                  metricas.tasaNoShow > 15 ? 'text-red-500' :
                  metricas.tasaNoShow > 10 ? 'text-orange-500' :
                  'text-green-500'
                }`}>
                  {formatearPorcentaje(metricas.tasaNoShow)}
                </span>
              </div>
              <p className="text-sm text-gray-400">
                {metricas.totalNoShowsMes} no-shows este mes
              </p>
            </div>

            {/* Multas Pendientes */}
            <div className="p-4 bg-orange-500/10 border border-orange-500/30 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-white font-medium">Multas Pendientes</span>
                <span className="text-lg font-bold text-orange-500">
                  {formatearMoneda(metricas.multasPendientes)}
                </span>
              </div>
              <p className="text-sm text-gray-400">
                Total multas del mes: {formatearMoneda(metricas.totalMultasMes)}
              </p>
            </div>

            {/* Margen de Utilidad */}
            <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-white font-medium">Margen de Utilidad</span>
                <span className={`text-lg font-bold ${
                  metricas.margenUtilidad > 50 ? 'text-green-500' :
                  metricas.margenUtilidad > 30 ? 'text-yellow-500' :
                  'text-red-500'
                }`}>
                  {formatearPorcentaje(metricas.margenUtilidad)}
                </span>
              </div>
              <p className="text-sm text-gray-400">
                Utilidad neta: {formatearMoneda(metricas.utilidadNeta)}
              </p>
            </div>

            {/* Modelos Activas */}
            <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-white font-medium">Modelos Activas</span>
                <span className="text-lg font-bold text-blue-500">
                  {metricas.modelosActivas}
                </span>
              </div>
              <p className="text-sm text-gray-400">
                Promedio: {metricas.promedioServiciosPorModelo.toFixed(1)} servicios/modelo
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  // ==================== VISTA: INGRESOS ====================

  const VistaIngresos = () => (
    <div className="space-y-6">
      {/* Resumen Financiero */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <TarjetaKPI
          titulo="Ingresos Totales"
          valor={formatearMoneda(reporteFinanciero.ingresosTotal)}
          icono={<DollarSign className="w-5 h-5" />}
          tendencia={{
            valor: 8.3,
            direccion: reporteFinanciero.tendencia === 'subiendo' ? 'subiendo' : reporteFinanciero.tendencia === 'bajando' ? 'bajando' : 'estable',
          }}
        />

        <TarjetaKPI
          titulo="Gastos Totales"
          valor={formatearMoneda(reporteFinanciero.gastosTotal)}
          icono={<TrendingDown className="w-5 h-5" />}
        />

        <TarjetaKPI
          titulo="Utilidad Bruta"
          valor={formatearMoneda(reporteFinanciero.utilidadBruta)}
          icono={<TrendingUp className="w-5 h-5" />}
          descripcion={`Margen: ${formatearPorcentaje(reporteFinanciero.margenBruto)}`}
        />
      </div>

      {/* Desglose de Ingresos */}
      <Card className="bg-zinc-950 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-white">Desglose de Ingresos</CardTitle>
          <CardDescription className="text-gray-400">Distribución por categoría de origen</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={[
              { categoria: 'Servicios', monto: reporteFinanciero.ingresosPorServicios },
              { categoria: 'Boutique', monto: reporteFinanciero.ingresosOtros },
              { categoria: 'Propinas', monto: reporteFinanciero.ingresosPorPropinas },
              { categoria: 'Multas', monto: reporteFinanciero.ingresosPorMultas },
            ]}>
              <CartesianGrid strokeDasharray="3 3" stroke="#262626" vertical={false} />
              <XAxis dataKey="categoria" stroke="#525252" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="#525252" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => formatearMoneda(value)} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#09090b', border: '1px solid #27272a', borderRadius: '12px', color: '#fff' }}
                cursor={{ fill: '#18181b' }}
                formatter={(value: number) => [formatearMoneda(value), 'Monto']}
              />
              <Bar dataKey="monto" fill={COLORES.dorado} radius={[6, 6, 0, 0]} barSize={50} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Ingresos por Tipo de Servicio */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="bg-gradient-to-br from-gray-900 to-black border-gray-800">
          <CardHeader>
            <CardTitle className="text-white">Ingresos por Tipo de Servicio</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-gray-400">Sede</span>
                  <span className="text-white font-bold">{formatearMoneda(reporteFinanciero.ingresosSede)}</span>
                </div>
                <div className="w-full bg-gray-800 rounded-full h-2">
                  <div 
                    className="bg-gold-500 h-2 rounded-full" 
                    style={{ width: `${(reporteFinanciero.ingresosSede / reporteFinanciero.ingresosTotal) * 100}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-gray-400">Domicilio</span>
                  <span className="text-white font-bold">{formatearMoneda(reporteFinanciero.ingresosDomicilio)}</span>
                </div>
                <div className="w-full bg-gray-800 rounded-full h-2">
                  <div 
                    className="bg-platinum-500 h-2 rounded-full" 
                    style={{ width: `${(reporteFinanciero.ingresosDomicilio / reporteFinanciero.ingresosTotal) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-gray-900 to-black border-gray-800">
          <CardHeader>
            <CardTitle className="text-white">Desglose de Gastos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { nombre: 'Operativos', monto: reporteFinanciero.gastosOperativos },
                { nombre: 'Nómina', monto: reporteFinanciero.gastosNomina },
                { nombre: 'Marketing', monto: reporteFinanciero.gastosMarketing },
                { nombre: 'Otros', monto: reporteFinanciero.gastosOtros },
              ].map((gasto, idx) => (
                <div key={gasto.nombre} className="flex items-center justify-between p-2">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORES_GRAFICAS[idx] }} />
                    <span className="text-gray-400">{gasto.nombre}</span>
                  </div>
                  <span className="text-white font-medium">{formatearMoneda(gasto.monto)}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  // ==================== VISTA: SERVICIOS ====================

  const VistaServicios = () => (
    <div className="space-y-6">
      <Card className="bg-gradient-to-br from-gray-900 to-black border-gray-800">
        <CardHeader>
          <CardTitle className="text-white">Servicios por Día</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={datosGraficaServicios}>
              <CartesianGrid strokeDasharray="3 3" stroke="#333" />
              <XAxis dataKey="fecha" stroke="#888" />
              <YAxis stroke="#888" />
              <Tooltip 
                contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333', borderRadius: '8px' }}
                labelStyle={{ color: '#fff' }}
              />
              <Line 
                type="monotone" 
                dataKey="servicios" 
                stroke={COLORES.platino} 
                strokeWidth={2}
                dot={{ fill: COLORES.platino, r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );

  // ==================== VISTA: MODELOS ====================

  const VistaModelos = () => (
    <div className="space-y-6">
      <Card className="bg-zinc-950 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-white flex items-center justify-between">
            <span>Rendimiento Detallado de Modelos</span>
            <Award className="w-5 h-5 text-gold-500" />
          </CardTitle>
          <CardDescription className="text-gray-400">Análisis comparativo de ingresos y efectividad</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {topModelos.map((modelo, idx) => (
              <div key={modelo.modeloEmail} className="p-5 bg-zinc-900/40 border border-zinc-800 rounded-2xl hover:border-gold-500/20 transition-all group">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gold-500/10 flex items-center justify-center border border-gold-500/30 text-gold-500 font-bold">
                      {idx + 1}
                    </div>
                    <div>
                      <h4 className="text-white font-bold group-hover:text-gold-500 transition-colors">{modelo.modeloNombre}</h4>
                      <p className="text-[10px] text-gray-500 uppercase tracking-wider font-medium">{modelo.modeloEmail}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-black text-white">{formatearMoneda(modelo.ingresosTotales)}</p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 py-3 border-t border-zinc-800/50">
                  <div className="text-center">
                    <p className="text-[10px] text-gray-500 uppercase font-semibold mb-1">Servicios</p>
                    <p className="text-sm font-bold text-zinc-300">{modelo.serviciosCompletados}</p>
                  </div>
                  <div className="text-center px-2 border-x border-zinc-800/50">
                    <p className="text-[10px] text-gray-500 uppercase font-semibold mb-1">Efectividad</p>
                    <p className="text-sm font-bold text-green-500">{formatearPorcentaje(modelo.tasaCompletacion)}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-[10px] text-gray-500 uppercase font-semibold mb-1">Calificación</p>
                    <p className="text-sm font-bold text-gold-500">⭐ {modelo.promedioCalificaciones.toFixed(1)}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  // ==================== VISTA: CLIENTES ====================

  const VistaClientes = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <TarjetaKPI
          titulo="Clientes Activos"
          valor={metricas.clientesActivosMes}
          icono={<Users className="w-5 h-5" />}
        />
        <TarjetaKPI
          titulo="Clientes Nuevos"
          valor={metricas.clientesNuevosMes}
          icono={<Users className="w-5 h-5" />}
        />
        <TarjetaKPI
          titulo="Clientes Frecuentes"
          valor={metricas.clientesFrecuentes}
          icono={<Award className="w-5 h-5" />}
        />
        <TarjetaKPI
          titulo="Ticket Promedio"
          valor={formatearMoneda(metricas.ticketPromedio)}
          icono={<DollarSign className="w-5 h-5" />}
        />
      </div>

      <Card className="bg-gradient-to-br from-gray-900 to-black border-gray-800">
        <CardHeader>
          <CardTitle className="text-white">Top 10 Clientes por Gasto</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {topClientes.map((cliente, idx) => (
              <div key={cliente.clienteId} className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg hover:bg-gray-800 transition-colors">
                <div className="flex items-center gap-3">
                  <span className="text-gray-500 font-bold w-6">{idx + 1}</span>
                  <div>
                    <p className="text-white font-medium">{cliente.clienteNombre}</p>
                    <p className="text-xs text-gray-400">{cliente.clienteTelefono}</p>
                  </div>
                  <div className={`px-2 py-1 rounded text-xs font-medium ${
                    cliente.categoriaCliente === 'vip' ? 'bg-gold-500/20 text-gold-500' :
                    cliente.categoriaCliente === 'frecuente' ? 'bg-platinum-500/20 text-platinum-500' :
                    cliente.categoriaCliente === 'nuevo' ? 'bg-green-500/20 text-green-500' :
                    'bg-gray-700 text-gray-400'
                  }`}>
                    {cliente.categoriaCliente.toUpperCase()}
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-gold-500 font-bold">{formatearMoneda(cliente.totalGastado)}</p>
                  <p className="text-xs text-gray-400">{cliente.totalServicios} servicios</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  // ==================== PANTALLA DE CARGA ====================
  
  if (cargando || !metricas) {
    return (
      <div className="p-6 space-y-6 bg-black min-h-screen flex flex-col items-center justify-center">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-transparent border-t-gold-500 rounded-full animate-spin" />
        </div>
        <div className="text-center">
          <p className="text-gold-500 font-medium animate-pulse">Sincronizando métricas de rendimiento...</p>
          <p className="text-xs text-gray-500 mt-2">Esto puede tomar unos segundos</p>
        </div>
      </div>
    );
  }

  // ==================== RENDER PRINCIPAL ====================

  return (
    <div className="p-6 space-y-6 bg-black min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">📊 Analytics</h1>
          <p className="text-gray-400">
            Métricas y reportes detallados del negocio
          </p>
        </div>

        <div className="flex items-center gap-4">
          {/* Selector de Período */}
          <Select value={periodoSeleccionado} onValueChange={(v: any) => setPeriodoSeleccionado(v)}>
            <SelectTrigger className="w-40 bg-gray-900 border-gray-800 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-gray-900 border-gray-800">
              <SelectItem value="dia" className="text-white">Hoy</SelectItem>
              <SelectItem value="semana" className="text-white">Esta Semana</SelectItem>
              <SelectItem value="mes" className="text-white">Este Mes</SelectItem>
              <SelectItem value="trimestre" className="text-white">Este Trimestre</SelectItem>
              <SelectItem value="anio" className="text-white">Este Año</SelectItem>
            </SelectContent>
          </Select>

          {/* Botón de Exportar */}
          <Button 
            variant="outline" 
            className="bg-gray-900 border-gray-800 text-white hover:bg-gray-800"
            onClick={() => {
              try {
                exportarReporteHTML(metricas, reporteFinanciero, topModelos, topClientes);
                toast.success('✅ Reporte exportado exitosamente');
              } catch (error) {
                if (process.env.NODE_ENV === 'development') console.error('Error exportando:', error);
                toast.error('❌ Error al exportar reporte');
              }
            }}
          >
            <Download className="w-4 h-4 mr-2" />
            Exportar Reporte
          </Button>
        </div>
      </div>

      {/* Tabs de Vistas */}
      <Tabs value={vistaActiva} onValueChange={(v: any) => setVistaActiva(v)} className="w-full">
        <TabsList className="bg-gray-900 border-gray-800 mb-6">
          <TabsTrigger value="resumen" className="data-[state=active]:bg-gold-500 data-[state=active]:text-black">
            <BarChart3 className="w-4 h-4 mr-2" />
            Resumen
          </TabsTrigger>
          <TabsTrigger value="ingresos" className="data-[state=active]:bg-gold-500 data-[state=active]:text-black">
            <DollarSign className="w-4 h-4 mr-2" />
            Ingresos
          </TabsTrigger>
          <TabsTrigger value="servicios" className="data-[state=active]:bg-gold-500 data-[state=active]:text-black">
            <Calendar className="w-4 h-4 mr-2" />
            Servicios
          </TabsTrigger>
          <TabsTrigger value="modelos" className="data-[state=active]:bg-gold-500 data-[state=active]:text-black">
            <Award className="w-4 h-4 mr-2" />
            Modelos
          </TabsTrigger>
          <TabsTrigger value="clientes" className="data-[state=active]:bg-gold-500 data-[state=active]:text-black">
            <Users className="w-4 h-4 mr-2" />
            Clientes
          </TabsTrigger>
        </TabsList>

        <TabsContent value="resumen">
          <VistaResumen />
        </TabsContent>

        <TabsContent value="ingresos">
          <VistaIngresos />
        </TabsContent>

        <TabsContent value="servicios">
          <VistaServicios />
        </TabsContent>

        <TabsContent value="modelos">
          <VistaModelos />
        </TabsContent>

        <TabsContent value="clientes">
          <VistaClientes />
        </TabsContent>
      </Tabs>
    </div>
  );
}
