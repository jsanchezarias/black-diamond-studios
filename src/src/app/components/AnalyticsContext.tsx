import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { useServicios } from './ServiciosContext';
import { useClientes } from './ClientesContext';
import { useModelos } from './ModelosContext';
import { useGastos } from './GastosContext';
import { useMultas } from './MultasContext';

// ==================== INTERFACES SEGÚN NOMENCLATURA ====================

interface MetricasGenerales {
  // Ingresos
  ingresosDelDia: number;
  ingresosSemana: number;
  ingresosMes: number;
  ingresosAnio: number;
  
  // Servicios
  serviciosCompletadosHoy: number;
  serviciosCompletadosSemana: number;
  serviciosCompletadosMes: number;
  serviciosPromedioMes: number;
  
  // Clientes
  clientesActivosMes: number;
  clientesNuevosMes: number;
  clientesFrecuentes: number;
  ticketPromedio: number;
  
  // Modelos
  modelosActivas: number;
  modelosMasProductivas: ModeloMetrica[];
  promedioServiciosPorModelo: number;
  
  // Multas y No-Shows
  totalMultasMes: number;
  totalNoShowsMes: number;
  tasaNoShow: number;
  multasPendientes: number;
  
  // Gastos
  gastosOperativosMes: number;
  utilidadNeta: number;
  margenUtilidad: number;
}

interface ModeloMetrica {
  modeloEmail: string;
  modeloNombre: string;
  totalServicios: number;
  serviciosCompletados: number;
  serviciosCancelados: number;
  ingresosTotales: number;
  ingresosPromedioPorServicio: number;
  tasaCompletacion: number;
  tasaCancelacion: number;
  promedioCalificaciones: number;
  totalResenas: number;
  periodoInicio: string;
  periodoFin: string;
}

interface ClienteMetrica {
  clienteId: string;
  clienteNombre: string;
  clienteTelefono: string;
  totalServicios: number;
  primeraVisita: string;
  ultimaVisita: string;
  totalGastado: number;
  gastoPromedioPorServicio: number;
  frecuenciaVisitas: number;
  diasDesdeUltimaVisita: number;
  categoriaCliente: 'nuevo' | 'frecuente' | 'vip' | 'inactivo';
  totalNoShows: number;
  multasPendientes: number;
  bloqueado: boolean;
}

interface ReporteFinanciero {
  periodo: 'diario' | 'semanal' | 'mensual' | 'anual' | 'personalizado';
  fechaInicio: string;
  fechaFin: string;
  
  // Ingresos desglosados
  ingresosPorServicios: number;
  ingresosPorPropinas: number;
  ingresosPorMultas: number;
  ingresosOtros: number;
  ingresosTotal: number;
  
  // Gastos desglosados
  gastosOperativos: number;
  gastosNomina: number;
  gastosMarketing: number;
  gastosOtros: number;
  gastosTotal: number;
  
  // Resultados
  utilidadBruta: number;
  margenBruto: number;
  
  // Proyecciones
  proyeccionMes?: number;
  tendencia: 'subiendo' | 'bajando' | 'estable';
  
  // Desglose por tipo de servicio
  ingresosSede: number;
  ingresosDomicilio: number;
}

interface DatoSerieTemporal {
  fecha: string;
  valor: number;
  tipo: 'ingresos' | 'servicios' | 'clientes' | 'multas';
  metadata?: Record<string, any>;
}

interface DatosGrafica {
  etiquetas: string[];
  series: SerieGrafica[];
}

interface SerieGrafica {
  nombre: string;
  datos: number[];
  color?: string;
}

interface ComparativaPeriodos {
  periodoActual: {
    inicio: string;
    fin: string;
    valor: number;
  };
  periodoAnterior: {
    inicio: string;
    fin: string;
    valor: number;
  };
  diferencia: number;
  porcentajeCambio: number;
  tendencia: 'mejor' | 'peor' | 'igual';
  metrica: string;
}

interface FiltrosAnalytics {
  fechaInicio: string;
  fechaFin: string;
  periodo: 'dia' | 'semana' | 'mes' | 'trimestre' | 'anio' | 'personalizado';
  modeloEmail?: string;
  clienteId?: string;
  tipoServicio?: 'sede' | 'domicilio' | 'todos';
  incluirCancelados?: boolean;
  incluirNoShows?: boolean;
  soloCompletados?: boolean;
}

// ==================== CONTEXT ====================

interface AnalyticsContextValue {
  // Métricas generales
  obtenerMetricasGenerales: (filtros?: FiltrosAnalytics) => MetricasGenerales;
  
  // Métricas por modelo
  obtenerMetricasPorModelo: (modeloEmail: string, filtros?: FiltrosAnalytics) => ModeloMetrica;
  obtenerTopModelos: (cantidad?: number, filtros?: FiltrosAnalytics) => ModeloMetrica[];
  
  // Métricas por cliente
  obtenerMetricasPorCliente: (clienteId: string, filtros?: FiltrosAnalytics) => ClienteMetrica | null;
  obtenerTopClientes: (cantidad?: number, filtros?: FiltrosAnalytics) => ClienteMetrica[];
  
  // Reportes financieros
  obtenerReporteFinanciero: (filtros?: FiltrosAnalytics) => ReporteFinanciero;
  
  // Series temporales para gráficas
  obtenerDatosSerieTemporal: (tipo: 'ingresos' | 'servicios' | 'clientes' | 'multas', filtros?: FiltrosAnalytics) => DatoSerieTemporal[];
  obtenerDatosGrafica: (tipos: string[], filtros?: FiltrosAnalytics) => DatosGrafica;
  
  // Comparativas
  compararPeriodos: (metrica: string, periodoActual: FiltrosAnalytics, periodoAnterior: FiltrosAnalytics) => ComparativaPeriodos;
  
  // Tendencias
  calcularTendencia: (datos: number[]) => 'subiendo' | 'bajando' | 'estable';
  
  // Estado de carga
  cargando: boolean;
}

const AnalyticsContext = createContext<AnalyticsContextValue | undefined>(undefined);

export function useAnalytics() {
  const context = useContext(AnalyticsContext);
  if (!context) {
    throw new Error('useAnalytics debe usarse dentro de AnalyticsProvider');
  }
  return context;
}

// ==================== PROVIDER ====================

interface AnalyticsProviderProps {
  children: ReactNode;
}

export function AnalyticsProvider({ children }: AnalyticsProviderProps) {
  const { servicios } = useServicios();
  const { clientes } = useClientes();
  const { modelos } = useModelos();
  const { gastos } = useGastos();
  const { multas } = useMultas();
  
  const [cargando] = useState(false);

  // ==================== UTILIDADES DE FECHA ====================

  const obtenerFechaHoy = () => {
    return new Date().toISOString().split('T')[0];
  };

  const obtenerFechaInicioDia = () => {
    return obtenerFechaHoy();
  };

  const obtenerFechaInicioSemana = () => {
    const hoy = new Date();
    const dia = hoy.getDay();
    const diff = hoy.getDate() - dia + (dia === 0 ? -6 : 1);
    const lunes = new Date(hoy.setDate(diff));
    return lunes.toISOString().split('T')[0];
  };

  const obtenerFechaInicioMes = () => {
    const hoy = new Date();
    return new Date(hoy.getFullYear(), hoy.getMonth(), 1).toISOString().split('T')[0];
  };

  const obtenerFechaInicioAnio = () => {
    const hoy = new Date();
    return new Date(hoy.getFullYear(), 0, 1).toISOString().split('T')[0];
  };

  const estaEnRango = (fecha: string, inicio: string, fin: string): boolean => {
    return fecha >= inicio && fecha <= fin;
  };

  const obtenerDiasEntreFechas = (fecha1: string, fecha2: string): number => {
    const d1 = new Date(fecha1);
    const d2 = new Date(fecha2);
    const diff = Math.abs(d2.getTime() - d1.getTime());
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  // ==================== FILTRADO DE DATOS ====================

  const aplicarFiltrosServicios = useCallback((filtros?: FiltrosAnalytics) => {
    let serviciosFiltrados = [...servicios];

    if (!filtros) return serviciosFiltrados;

    // Filtro por fechas
    if (filtros.fechaInicio && filtros.fechaFin) {
      serviciosFiltrados = serviciosFiltrados.filter(s =>
        estaEnRango(s.fecha, filtros.fechaInicio, filtros.fechaFin)
      );
    }

    // Filtro por modelo
    if (filtros.modeloEmail) {
      serviciosFiltrados = serviciosFiltrados.filter(s => s.modeloEmail === filtros.modeloEmail);
    }

    // Filtro por cliente
    if (filtros.clienteId) {
      serviciosFiltrados = serviciosFiltrados.filter(s => s.clienteId === filtros.clienteId);
    }

    // Filtro por tipo de servicio
    if (filtros.tipoServicio && filtros.tipoServicio !== 'todos') {
      serviciosFiltrados = serviciosFiltrados.filter(s => s.tipoServicio === filtros.tipoServicio);
    }

    // Filtro por estado
    if (filtros.soloCompletados) {
      serviciosFiltrados = serviciosFiltrados.filter(s => s.estado === 'completado');
    } else {
      if (!filtros.incluirCancelados) {
        serviciosFiltrados = serviciosFiltrados.filter(s => s.estado !== 'cancelado');
      }
      if (!filtros.incluirNoShows) {
        serviciosFiltrados = serviciosFiltrados.filter(s => s.estado !== 'no_show');
      }
    }

    return serviciosFiltrados;
  }, [servicios]);

  // ==================== MÉTRICAS GENERALES ====================

  const obtenerMetricasGenerales = useCallback((filtros?: FiltrosAnalytics): MetricasGenerales => {
    const hoy = obtenerFechaHoy();
    const inicioSemana = obtenerFechaInicioSemana();
    const inicioMes = obtenerFechaInicioMes();
    const inicioAnio = obtenerFechaInicioAnio();

    // Servicios completados por período
    const serviciosHoy = servicios.filter(s => s.fecha === hoy && s.estado === 'completado');
    const serviciosSemana = servicios.filter(s => estaEnRango(s.fecha, inicioSemana, hoy) && s.estado === 'completado');
    const serviciosMes = servicios.filter(s => estaEnRango(s.fecha, inicioMes, hoy) && s.estado === 'completado');
    const serviciosAnio = servicios.filter(s => estaEnRango(s.fecha, inicioAnio, hoy) && s.estado === 'completado');

    // Ingresos por período
    const ingresosDelDia = serviciosHoy.reduce((sum, s) => sum + (s.montoPagado || s.montoPactado || 0) + (s.propina || 0), 0);
    const ingresosSemana = serviciosSemana.reduce((sum, s) => sum + (s.montoPagado || s.montoPactado || 0) + (s.propina || 0), 0);
    const ingresosMes = serviciosMes.reduce((sum, s) => sum + (s.montoPagado || s.montoPactado || 0) + (s.propina || 0), 0);
    const ingresosAnio = serviciosAnio.reduce((sum, s) => sum + (s.montoPagado || s.montoPactado || 0) + (s.propina || 0), 0);

    // Clientes del mes
    const clientesIdsActivosMes = new Set(serviciosMes.map(s => s.clienteId));
    const clientesActivosMes = clientesIdsActivosMes.size;

    // Clientes nuevos del mes (primera visita en el mes)
    const clientesNuevosMes = clientes.filter(c => {
      const fechaRegistro = c.fechaRegistro ? new Date(c.fechaRegistro).toISOString().split('T')[0] : '';
      return estaEnRango(fechaRegistro, inicioMes, hoy);
    }).length;

    // Clientes frecuentes (3+ servicios)
    const clientesFrecuentes = clientes.filter(c => c.totalServicios >= 3).length;

    // Ticket promedio
    const ticketPromedio = serviciosMes.length > 0 ? ingresosMes / serviciosMes.length : 0;

    // Modelos activas
    const modelosActivas = modelos.filter(m => m.activa).length;

    // Top modelos
    const topModelos = obtenerTopModelos(5);

    // Promedio de servicios por modelo
    const promedioServiciosPorModelo = modelosActivas > 0 ? serviciosMes.length / modelosActivas : 0;

    // Multas del mes
    const multasMes = multas.filter(m => {
      const fechaMulta = m.fechaCreacion ? m.fechaCreacion.split('T')[0] : '';
      return estaEnRango(fechaMulta, inicioMes, hoy);
    });
    const totalMultasMes = multasMes.reduce((sum, m) => sum + (m.montoMulta || 0), 0);
    const multasPendientes = multas.filter(m => !m.multaPagada).reduce((sum, m) => sum + (m.montoMulta || 0), 0);

    // No-shows del mes
    const noShowsMes = servicios.filter(s => s.estado === 'no_show' && estaEnRango(s.fecha, inicioMes, hoy));
    const totalNoShowsMes = noShowsMes.length;
    const tasaNoShow = serviciosMes.length > 0 ? (totalNoShowsMes / (serviciosMes.length + totalNoShowsMes)) * 100 : 0;

    // Gastos del mes
    const gastosMes = gastos.filter(g => {
      const fechaGasto = g.fecha ? g.fecha.split('T')[0] : '';
      return estaEnRango(fechaGasto, inicioMes, hoy);
    });
    const gastosOperativosMes = gastosMes.reduce((sum, g) => sum + (g.monto || 0), 0);

    // Utilidad neta y margen
    const utilidadNeta = ingresosMes - gastosOperativosMes;
    const margenUtilidad = ingresosMes > 0 ? (utilidadNeta / ingresosMes) * 100 : 0;

    return {
      // Ingresos
      ingresosDelDia,
      ingresosSemana,
      ingresosMes,
      ingresosAnio,
      
      // Servicios
      serviciosCompletadosHoy: serviciosHoy.length,
      serviciosCompletadosSemana: serviciosSemana.length,
      serviciosCompletadosMes: serviciosMes.length,
      serviciosPromedioMes: promedioServiciosPorModelo,
      
      // Clientes
      clientesActivosMes,
      clientesNuevosMes,
      clientesFrecuentes,
      ticketPromedio,
      
      // Modelos
      modelosActivas,
      modelosMasProductivas: topModelos,
      promedioServiciosPorModelo,
      
      // Multas y No-Shows
      totalMultasMes,
      totalNoShowsMes,
      tasaNoShow,
      multasPendientes,
      
      // Gastos
      gastosOperativosMes,
      utilidadNeta,
      margenUtilidad,
    };
  }, [servicios, clientes, modelos, multas, gastos]);

  // ==================== MÉTRICAS POR MODELO ====================

  const obtenerMetricasPorModelo = useCallback((modeloEmail: string, filtros?: FiltrosAnalytics): ModeloMetrica => {
    const modelo = modelos.find(m => m.email === modeloEmail);
    const nombreModelo = modelo?.nombreArtistico || modelo?.nombre || 'Desconocida';

    const serviciosModelo = aplicarFiltrosServicios({
      ...filtros,
      modeloEmail,
      fechaInicio: filtros?.fechaInicio || obtenerFechaInicioMes(),
      fechaFin: filtros?.fechaFin || obtenerFechaHoy(),
    });

    const serviciosCompletados = serviciosModelo.filter(s => s.estado === 'completado');
    const serviciosCancelados = serviciosModelo.filter(s => s.estado === 'cancelado');

    const ingresosTotales = serviciosCompletados.reduce((sum, s) => sum + (s.montoPagado || s.montoPactado || 0), 0);
    const ingresosPromedioPorServicio = serviciosCompletados.length > 0 ? ingresosTotales / serviciosCompletados.length : 0;

    const tasaCompletacion = serviciosModelo.length > 0 ? (serviciosCompletados.length / serviciosModelo.length) * 100 : 0;
    const tasaCancelacion = serviciosModelo.length > 0 ? (serviciosCancelados.length / serviciosModelo.length) * 100 : 0;

    // Calificaciones
    const serviciosConCalificacion = serviciosCompletados.filter(s => s.calificacionCliente);
    const promedioCalificaciones = serviciosConCalificacion.length > 0
      ? serviciosConCalificacion.reduce((sum, s) => sum + (s.calificacionCliente || 0), 0) / serviciosConCalificacion.length
      : 0;

    return {
      modeloEmail,
      modeloNombre: nombreModelo,
      totalServicios: serviciosModelo.length,
      serviciosCompletados: serviciosCompletados.length,
      serviciosCancelados: serviciosCancelados.length,
      ingresosTotales,
      ingresosPromedioPorServicio,
      tasaCompletacion,
      tasaCancelacion,
      promedioCalificaciones,
      totalResenas: serviciosConCalificacion.length,
      periodoInicio: filtros?.fechaInicio || obtenerFechaInicioMes(),
      periodoFin: filtros?.fechaFin || obtenerFechaHoy(),
    };
  }, [modelos, aplicarFiltrosServicios]);

  const obtenerTopModelos = useCallback((cantidad: number = 5, filtros?: FiltrosAnalytics): ModeloMetrica[] => {
    const modelosActivas = modelos.filter(m => m.activa);
    
    const metricas = modelosActivas.map(m => obtenerMetricasPorModelo(m.email, filtros));
    
    return metricas
      .sort((a, b) => b.ingresosTotales - a.ingresosTotales)
      .slice(0, cantidad);
  }, [modelos, obtenerMetricasPorModelo]);

  // ==================== MÉTRICAS POR CLIENTE ====================

  const obtenerMetricasPorCliente = useCallback((clienteId: string, filtros?: FiltrosAnalytics): ClienteMetrica | null => {
    const cliente = clientes.find(c => c.id === clienteId);
    if (!cliente) return null;

    const serviciosCliente = aplicarFiltrosServicios({
      ...filtros,
      clienteId,
      soloCompletados: true,
    });

    const serviciosOrdenados = [...serviciosCliente].sort((a, b) => a.fecha.localeCompare(b.fecha));
    const primeraVisita = serviciosOrdenados[0]?.fecha || '';
    const ultimaVisita = serviciosOrdenados[serviciosOrdenados.length - 1]?.fecha || '';

    const totalGastado = serviciosCliente.reduce((sum, s) => sum + (s.montoPagado || s.montoPactado || 0), 0);
    const gastoPromedioPorServicio = serviciosCliente.length > 0 ? totalGastado / serviciosCliente.length : 0;

    // Frecuencia de visitas (servicios por mes)
    const diasDesdeInicio = primeraVisita ? obtenerDiasEntreFechas(primeraVisita, obtenerFechaHoy()) : 1;
    const mesesDesdeInicio = Math.max(diasDesdeInicio / 30, 1);
    const frecuenciaVisitas = serviciosCliente.length / mesesDesdeInicio;

    // Días desde última visita
    const diasDesdeUltimaVisita = ultimaVisita ? obtenerDiasEntreFechas(ultimaVisita, obtenerFechaHoy()) : 999;

    // Categoría del cliente
    let categoriaCliente: 'nuevo' | 'frecuente' | 'vip' | 'inactivo' = 'nuevo';
    if (diasDesdeUltimaVisita > 90) {
      categoriaCliente = 'inactivo';
    } else if (cliente.totalServicios >= 10 || totalGastado >= 5000000) {
      categoriaCliente = 'vip';
    } else if (cliente.totalServicios >= 3) {
      categoriaCliente = 'frecuente';
    }

    // No-shows
    const noShows = servicios.filter(s => s.clienteId === clienteId && s.estado === 'no_show');
    const totalNoShows = noShows.length;

    // Multas pendientes
    const multasCliente = multas.filter(m => m.clienteId === clienteId && !m.multaPagada);
    const multasPendientes = multasCliente.reduce((sum, m) => sum + (m.montoMulta || 0), 0);

    return {
      clienteId,
      clienteNombre: cliente.nombre,
      clienteTelefono: cliente.telefono,
      totalServicios: serviciosCliente.length,
      primeraVisita,
      ultimaVisita,
      totalGastado,
      gastoPromedioPorServicio,
      frecuenciaVisitas,
      diasDesdeUltimaVisita,
      categoriaCliente,
      totalNoShows,
      multasPendientes,
      bloqueado: cliente.bloqueado || false,
    };
  }, [clientes, servicios, multas, aplicarFiltrosServicios]);

  const obtenerTopClientes = useCallback((cantidad: number = 10, filtros?: FiltrosAnalytics): ClienteMetrica[] => {
    const metricas = clientes
      .map(c => obtenerMetricasPorCliente(c.id, filtros))
      .filter((m): m is ClienteMetrica => m !== null);
    
    return metricas
      .sort((a, b) => b.totalGastado - a.totalGastado)
      .slice(0, cantidad);
  }, [clientes, obtenerMetricasPorCliente]);

  // ==================== REPORTE FINANCIERO ====================

  const obtenerReporteFinanciero = useCallback((filtros?: FiltrosAnalytics): ReporteFinanciero => {
    const fechaInicio = filtros?.fechaInicio || obtenerFechaInicioMes();
    const fechaFin = filtros?.fechaFin || obtenerFechaHoy();
    const periodo = filtros?.periodo || 'mensual';

    const serviciosPeriodo = aplicarFiltrosServicios({
      ...filtros,
      fechaInicio,
      fechaFin,
      soloCompletados: true,
    });

    // Ingresos desglosados
    const ingresosPorServicios = serviciosPeriodo.reduce((sum, s) => sum + (s.montoPagado || s.montoPactado || 0), 0);
    const ingresosPorPropinas = serviciosPeriodo.reduce((sum, s) => sum + (s.propina || 0), 0);
    
    const multasPeriodo = multas.filter(m => {
      const fechaMulta = m.fechaCreacion ? m.fechaCreacion.split('T')[0] : '';
      return estaEnRango(fechaMulta, fechaInicio, fechaFin) && m.multaPagada;
    });
    const ingresosPorMultas = multasPeriodo.reduce((sum, m) => sum + (m.montoMulta || 0), 0);
    
    const ingresosOtros = 0; // Expandible en el futuro
    const ingresosTotal = ingresosPorServicios + ingresosPorPropinas + ingresosPorMultas + ingresosOtros;

    // Gastos desglosados
    const gastosPeriodo = gastos.filter(g => {
      const fechaGasto = g.fecha ? g.fecha.split('T')[0] : '';
      return estaEnRango(fechaGasto, fechaInicio, fechaFin);
    });
    
    const gastosOperativos = gastosPeriodo.filter(g => g.categoria === 'operativo').reduce((sum, g) => sum + g.monto, 0);
    const gastosNomina = gastosPeriodo.filter(g => g.categoria === 'nomina').reduce((sum, g) => sum + g.monto, 0);
    const gastosMarketing = gastosPeriodo.filter(g => g.categoria === 'marketing').reduce((sum, g) => sum + g.monto, 0);
    const gastosOtros = gastosPeriodo.filter(g => !['operativo', 'nomina', 'marketing'].includes(g.categoria || '')).reduce((sum, g) => sum + g.monto, 0);
    const gastosTotal = gastosPeriodo.reduce((sum, g) => sum + g.monto, 0);

    // Resultados
    const utilidadBruta = ingresosTotal - gastosTotal;
    const margenBruto = ingresosTotal > 0 ? (utilidadBruta / ingresosTotal) * 100 : 0;

    // Desglose por tipo de servicio
    const ingresosSede = serviciosPeriodo
      .filter(s => s.tipoServicio === 'sede')
      .reduce((sum, s) => sum + (s.montoPagado || s.montoPactado || 0), 0);
    const ingresosDomicilio = serviciosPeriodo
      .filter(s => s.tipoServicio === 'domicilio')
      .reduce((sum, s) => sum + (s.montoPagado || s.montoPactado || 0), 0);

    // Tendencia (comparar con período anterior)
    const diasPeriodo = obtenerDiasEntreFechas(fechaInicio, fechaFin);
    const fechaInicioAnterior = new Date(new Date(fechaInicio).getTime() - diasPeriodo * 24 * 60 * 60 * 1000)
      .toISOString().split('T')[0];
    
    const serviciosPeriodoAnterior = aplicarFiltrosServicios({
      ...filtros,
      fechaInicio: fechaInicioAnterior,
      fechaFin: fechaInicio,
      soloCompletados: true,
    });
    const ingresosPeriodoAnterior = serviciosPeriodoAnterior.reduce((sum, s) => sum + (s.montoPagado || s.montoPactado || 0), 0);
    
    let tendencia: 'subiendo' | 'bajando' | 'estable' = 'estable';
    const diferencia = ingresosTotal - ingresosPeriodoAnterior;
    if (diferencia > ingresosTotal * 0.05) tendencia = 'subiendo';
    else if (diferencia < -ingresosTotal * 0.05) tendencia = 'bajando';

    // Proyección del mes (solo si es período mensual parcial)
    let proyeccionMes: number | undefined;
    if (periodo === 'mensual') {
      const diasTranscurridos = obtenerDiasEntreFechas(fechaInicio, fechaFin);
      const diasMes = 30;
      if (diasTranscurridos < diasMes) {
        proyeccionMes = (ingresosTotal / diasTranscurridos) * diasMes;
      }
    }

    return {
      periodo,
      fechaInicio,
      fechaFin,
      ingresosPorServicios,
      ingresosPorPropinas,
      ingresosPorMultas,
      ingresosOtros,
      ingresosTotal,
      gastosOperativos,
      gastosNomina,
      gastosMarketing,
      gastosOtros,
      gastosTotal,
      utilidadBruta,
      margenBruto,
      proyeccionMes,
      tendencia,
      ingresosSede,
      ingresosDomicilio,
    };
  }, [aplicarFiltrosServicios, multas, gastos]);

  // ==================== SERIES TEMPORALES ====================

  const obtenerDatosSerieTemporal = useCallback((
    tipo: 'ingresos' | 'servicios' | 'clientes' | 'multas',
    filtros?: FiltrosAnalytics
  ): DatoSerieTemporal[] => {
    const fechaInicio = filtros?.fechaInicio || obtenerFechaInicioMes();
    const fechaFin = filtros?.fechaFin || obtenerFechaHoy();

    const serviciosFiltrados = aplicarFiltrosServicios({
      ...filtros,
      fechaInicio,
      fechaFin,
    });

    // Agrupar por fecha
    const datosPorFecha = new Map<string, number>();
    
    if (tipo === 'ingresos') {
      serviciosFiltrados
        .filter(s => s.estado === 'completado')
        .forEach(s => {
          const valor = datosPorFecha.get(s.fecha) || 0;
          datosPorFecha.set(s.fecha, valor + (s.montoPagado || s.montoPactado || 0));
        });
    } else if (tipo === 'servicios') {
      serviciosFiltrados
        .filter(s => s.estado === 'completado')
        .forEach(s => {
          const valor = datosPorFecha.get(s.fecha) || 0;
          datosPorFecha.set(s.fecha, valor + 1);
        });
    } else if (tipo === 'clientes') {
      const clientesPorFecha = new Map<string, Set<string>>();
      serviciosFiltrados
        .filter(s => s.estado === 'completado')
        .forEach(s => {
          if (!clientesPorFecha.has(s.fecha)) {
            clientesPorFecha.set(s.fecha, new Set());
          }
          clientesPorFecha.get(s.fecha)?.add(s.clienteId);
        });
      clientesPorFecha.forEach((clientes, fecha) => {
        datosPorFecha.set(fecha, clientes.size);
      });
    } else if (tipo === 'multas') {
      multas
        .filter(m => {
          const fechaMulta = m.fechaCreacion ? m.fechaCreacion.split('T')[0] : '';
          return estaEnRango(fechaMulta, fechaInicio, fechaFin);
        })
        .forEach(m => {
          const fecha = m.fechaCreacion ? m.fechaCreacion.split('T')[0] : '';
          const valor = datosPorFecha.get(fecha) || 0;
          datosPorFecha.set(fecha, valor + (m.montoMulta || 0));
        });
    }

    // Convertir a array y ordenar
    return Array.from(datosPorFecha.entries())
      .map(([fecha, valor]) => ({ fecha, valor, tipo }))
      .sort((a, b) => a.fecha.localeCompare(b.fecha));
  }, [aplicarFiltrosServicios, multas]);

  const obtenerDatosGrafica = useCallback((tipos: string[], filtros?: FiltrosAnalytics): DatosGrafica => {
    const fechaInicio = filtros?.fechaInicio || obtenerFechaInicioMes();
    const fechaFin = filtros?.fechaFin || obtenerFechaHoy();

    // Generar todas las fechas del rango
    const fechas: string[] = [];
    const inicio = new Date(fechaInicio);
    const fin = new Date(fechaFin);
    
    for (let d = new Date(inicio); d <= fin; d.setDate(d.getDate() + 1)) {
      fechas.push(d.toISOString().split('T')[0]);
    }

    // Obtener datos para cada tipo
    const series: SerieGrafica[] = tipos.map(tipo => {
      const datos = obtenerDatosSerieTemporal(tipo as any, filtros);
      const datosPorFecha = new Map(datos.map(d => [d.fecha, d.valor]));
      
      return {
        nombre: tipo.charAt(0).toUpperCase() + tipo.slice(1),
        datos: fechas.map(f => datosPorFecha.get(f) || 0),
        color: tipo === 'ingresos' ? '#D4AF37' : tipo === 'servicios' ? '#C0C0C0' : tipo === 'clientes' ? '#B87333' : '#FF6B6B',
      };
    });

    return {
      etiquetas: fechas,
      series,
    };
  }, [obtenerDatosSerieTemporal]);

  // ==================== COMPARATIVAS ====================

  const compararPeriodos = useCallback((
    metrica: string,
    periodoActual: FiltrosAnalytics,
    periodoAnterior: FiltrosAnalytics
  ): ComparativaPeriodos => {
    const calcularValor = (filtros: FiltrosAnalytics): number => {
      const serviciosPeriodo = aplicarFiltrosServicios({
        ...filtros,
        soloCompletados: true,
      });

      if (metrica === 'ingresos') {
        return serviciosPeriodo.reduce((sum, s) => sum + (s.montoPagado || s.montoPactado || 0), 0);
      } else if (metrica === 'servicios') {
        return serviciosPeriodo.length;
      } else if (metrica === 'clientes') {
        return new Set(serviciosPeriodo.map(s => s.clienteId)).size;
      }
      return 0;
    };

    const valorActual = calcularValor(periodoActual);
    const valorAnterior = calcularValor(periodoAnterior);

    const diferencia = valorActual - valorAnterior;
    const porcentajeCambio = valorAnterior > 0 ? (diferencia / valorAnterior) * 100 : 0;

    let tendencia: 'mejor' | 'peor' | 'igual' = 'igual';
    if (porcentajeCambio > 5) tendencia = 'mejor';
    else if (porcentajeCambio < -5) tendencia = 'peor';

    return {
      periodoActual: {
        inicio: periodoActual.fechaInicio,
        fin: periodoActual.fechaFin,
        valor: valorActual,
      },
      periodoAnterior: {
        inicio: periodoAnterior.fechaInicio,
        fin: periodoAnterior.fechaFin,
        valor: valorAnterior,
      },
      diferencia,
      porcentajeCambio,
      tendencia,
      metrica,
    };
  }, [aplicarFiltrosServicios]);

  // ==================== TENDENCIAS ====================

  const calcularTendencia = useCallback((datos: number[]): 'subiendo' | 'bajando' | 'estable' => {
    if (datos.length < 2) return 'estable';

    const mitad = Math.floor(datos.length / 2);
    const primeraMitad = datos.slice(0, mitad);
    const segundaMitad = datos.slice(mitad);

    const promedioPrimera = primeraMitad.reduce((a, b) => a + b, 0) / primeraMitad.length;
    const promedioSegunda = segundaMitad.reduce((a, b) => a + b, 0) / segundaMitad.length;

    const diferencia = ((promedioSegunda - promedioPrimera) / promedioPrimera) * 100;

    if (diferencia > 10) return 'subiendo';
    if (diferencia < -10) return 'bajando';
    return 'estable';
  }, []);

  // ==================== VALOR DEL CONTEXTO ====================

  const value: AnalyticsContextValue = {
    obtenerMetricasGenerales,
    obtenerMetricasPorModelo,
    obtenerTopModelos,
    obtenerMetricasPorCliente,
    obtenerTopClientes,
    obtenerReporteFinanciero,
    obtenerDatosSerieTemporal,
    obtenerDatosGrafica,
    compararPeriodos,
    calcularTendencia,
    cargando,
  };

  return (
    <AnalyticsContext.Provider value={value}>
      {children}
    </AnalyticsContext.Provider>
  );
}

// ==================== EXPORTS ====================

export type {
  MetricasGenerales,
  ModeloMetrica,
  ClienteMetrica,
  ReporteFinanciero,
  DatoSerieTemporal,
  DatosGrafica,
  SerieGrafica,
  ComparativaPeriodos,
  FiltrosAnalytics,
};
