import { useState, useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  Download, 
  Calendar,
  PieChart,
  BarChart3,
  FileText,
  ShoppingBag,
  Users,
  AlertCircle,
  ArrowUp,
  ArrowDown
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  BarChart, 
  Bar, 
  PieChart as RechartsPieChart, 
  Pie, 
  Cell, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  Area,
  AreaChart,
  ComposedChart
} from 'recharts';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}

interface FinanzasPanelProps {
  serviciosFinalizados?: any[];
  ventasBoutique?: any[];
  adelantos?: any[];
  multas?: any[];
}

export function FinanzasPanel({ 
  serviciosFinalizados = [], 
  ventasBoutique = [],
  adelantos = [],
  multas = []
}: FinanzasPanelProps) {
  const [periodoComparativo, setPeriodoComparativo] = useState<'semana' | 'mes' | 'trimestre'>('mes');

  // Colores del tema
  const COLORS = {
    primary: '#d4af37',
    secondary: '#1a1a24',
    success: '#10b981',
    danger: '#ef4444',
    warning: '#f59e0b',
    info: '#3b82f6',
    servicios: '#d4af37',
    boutique: '#8b7355',
    adicionales: '#a78bfa',
    multas: '#ef4444',
  };

  // Calcular datos financieros
  const datosFinancieros = useMemo(() => {
    const ahora = new Date();
    const inicioMesActual = new Date(ahora.getFullYear(), ahora.getMonth(), 1);
    const inicioMesAnterior = new Date(ahora.getFullYear(), ahora.getMonth() - 1, 1);
    const finMesAnterior = new Date(ahora.getFullYear(), ahora.getMonth(), 0);
    const inicioSemanaActual = new Date(ahora);
    inicioSemanaActual.setDate(ahora.getDate() - ahora.getDay());
    const inicioSemanaAnterior = new Date(inicioSemanaActual);
    inicioSemanaAnterior.setDate(inicioSemanaActual.getDate() - 7);

    // Función auxiliar para calcular ingresos de servicios
    const calcularIngresosServicios = (servicios: any[], inicio: Date, fin: Date) => {
      return servicios
        .filter((s) => {
          const fecha = new Date(s.horaInicio);
          return fecha >= inicio && fecha <= fin;
        })
        .reduce((total, s) => {
          const costoBase = s.costoServicio || 0;
          const costoAdicionales = s.costoAdicionales || 0;
          const costoConsumo = s.costoConsumo || 0;
          const tiemposAdicionales = (s.tiemposAdicionales || []).reduce((sum: number, t: any) => sum + (t.costo || 0), 0);
          const adicionalesExtra = (s.adicionalesExtra || []).reduce((sum: number, a: any) => sum + (a.costo || 0), 0);
          return total + costoBase + costoAdicionales + costoConsumo + tiemposAdicionales + adicionalesExtra;
        }, 0);
    };

    // Ingresos mes actual
    const ingresosMesActual = calcularIngresosServicios(serviciosFinalizados, inicioMesActual, ahora);
    const ingresosMesAnterior = calcularIngresosServicios(serviciosFinalizados, inicioMesAnterior, finMesAnterior);
    const ingresosSemanaActual = calcularIngresosServicios(serviciosFinalizados, inicioSemanaActual, ahora);
    const ingresosSemanaAnterior = calcularIngresosServicios(serviciosFinalizados, inicioSemanaAnterior, inicioSemanaActual);

    // Calcular variaciones porcentuales
    const variacionMes = ingresosMesAnterior > 0 
      ? ((ingresosMesActual - ingresosMesAnterior) / ingresosMesAnterior) * 100 
      : 0;
    const variacionSemana = ingresosSemanaAnterior > 0 
      ? ((ingresosSemanaActual - ingresosSemanaAnterior) / ingresosSemanaAnterior) * 100 
      : 0;

    // Servicios por tipo
    const serviciosMesActual = serviciosFinalizados.filter((s) => {
      const fecha = new Date(s.horaInicio);
      return fecha >= inicioMesActual && fecha <= ahora;
    });

    // Distribución de ingresos por fuente
    const ingresosPorFuente = {
      servicios: serviciosMesActual.reduce((total, s) => total + (s.costoServicio || 0), 0),
      adicionales: serviciosMesActual.reduce((total, s) => total + (s.costoAdicionales || 0), 0),
      consumo: serviciosMesActual.reduce((total, s) => total + (s.costoConsumo || 0), 0),
      extensiones: serviciosMesActual.reduce((total, s) => {
        const tiemposAdicionales = (s.tiemposAdicionales || []).reduce((sum: number, t: any) => sum + (t.costo || 0), 0);
        const adicionalesExtra = (s.adicionalesExtra || []).reduce((sum: number, a: any) => sum + (a.costo || 0), 0);
        return total + tiemposAdicionales + adicionalesExtra;
      }, 0),
    };

    // Egresos estimados (60% de ingresos para las modelos + costos operacionales estimados)
    const egresosMesActual = ingresosMesActual * 0.60 + (serviciosMesActual.length * 50000); // 50k por servicio de costos operacionales
    const egresosMesAnterior = ingresosMesAnterior * 0.60 + (serviciosFinalizados.filter((s) => {
      const fecha = new Date(s.horaInicio);
      return fecha >= inicioMesAnterior && fecha <= finMesAnterior;
    }).length * 50000);

    const netoMesActual = ingresosMesActual - egresosMesActual;
    const netoMesAnterior = ingresosMesAnterior - egresosMesAnterior;

    // Datos para gráfico de tendencia (últimos 30 días)
    const tendenciaDiaria = Array.from({ length: 30 }, (_, i) => {
      const fecha = new Date();
      fecha.setDate(fecha.getDate() - (29 - i));
      const inicioDia = new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate());
      const finDia = new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate(), 23, 59, 59);
      
      const ingresos = calcularIngresosServicios(serviciosFinalizados, inicioDia, finDia);
      const egresos = ingresos * 0.60;
      
      return {
        fecha: `${fecha.getDate()}/${fecha.getMonth() + 1}`,
        ingresos: Math.round(ingresos / 1000), // en miles
        egresos: Math.round(egresos / 1000),
        neto: Math.round((ingresos - egresos) / 1000),
      };
    });

    // Datos para gráfico semanal comparativo (últimas 8 semanas)
    const tendenciaSemanal = Array.from({ length: 8 }, (_, i) => {
      const inicioSemana = new Date();
      inicioSemana.setDate(inicioSemana.getDate() - (inicioSemana.getDay() + (7 * (7 - i))));
      const finSemana = new Date(inicioSemana);
      finSemana.setDate(inicioSemana.getDate() + 6);
      
      const ingresos = calcularIngresosServicios(serviciosFinalizados, inicioSemana, finSemana);
      const numServicios = serviciosFinalizados.filter((s) => {
        const fecha = new Date(s.horaInicio);
        return fecha >= inicioSemana && fecha <= finSemana;
      }).length;
      
      return {
        semana: `S${8 - i}`,
        ingresos: Math.round(ingresos / 1000000 * 10) / 10, // en millones con 1 decimal
        servicios: numServicios,
      };
    });

    // Datos para gráfico de distribución por fuente
    const distribucionIngresos = [
      { name: 'Servicios Base', value: ingresosPorFuente.servicios, color: COLORS.servicios },
      { name: 'Adicionales', value: ingresosPorFuente.adicionales, color: COLORS.adicionales },
      { name: 'Consumo', value: ingresosPorFuente.consumo, color: COLORS.boutique },
      { name: 'Extensiones', value: ingresosPorFuente.extensiones, color: COLORS.info },
    ].filter(item => item.value > 0);

    // Top modelos por ingresos
    const ingresosPorModelo: { [key: string]: number } = {};
    serviciosMesActual.forEach((s) => {
      const nombre = s.modeloNombre || 'Sin nombre';
      const total = (s.costoServicio || 0) + (s.costoAdicionales || 0) + (s.costoConsumo || 0);
      ingresosPorModelo[nombre] = (ingresosPorModelo[nombre] || 0) + total;
    });

    const topModelos = Object.entries(ingresosPorModelo)
      .map(([nombre, ingresos]) => ({ nombre, ingresos }))
      .sort((a, b) => b.ingresos - a.ingresos)
      .slice(0, 5);

    return {
      ingresosMesActual,
      ingresosMesAnterior,
      ingresosSemanaActual,
      ingresosSemanaAnterior,
      variacionMes,
      variacionSemana,
      egresosMesActual,
      egresosMesAnterior,
      netoMesActual,
      netoMesAnterior,
      serviciosMesActual: serviciosMesActual.length,
      serviciosMesAnterior: serviciosFinalizados.filter((s) => {
        const fecha = new Date(s.horaInicio);
        return fecha >= inicioMesAnterior && fecha <= finMesAnterior;
      }).length,
      tendenciaDiaria,
      tendenciaSemanal,
      distribucionIngresos,
      topModelos,
      ingresosPorFuente,
    };
  }, [serviciosFinalizados]);

  // Función para exportar reporte PDF
  const exportarReportePDF = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    // Header
    doc.setFillColor(10, 10, 15);
    doc.rect(0, 0, pageWidth, 40, 'F');
    
    doc.setTextColor(212, 175, 55);
    doc.setFontSize(24);
    doc.text('Black Diamond Studios', pageWidth / 2, 20, { align: 'center' });
    
    doc.setFontSize(14);
    doc.setTextColor(255, 255, 255);
    doc.text('Reporte Financiero', pageWidth / 2, 32, { align: 'center' });

    // Fecha del reporte
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(10);
    doc.text(`Generado: ${new Date().toLocaleDateString('es-CO')}`, 14, 50);
    doc.text(`Período: ${periodoComparativo === 'mes' ? 'Mensual' : periodoComparativo === 'semana' ? 'Semanal' : 'Trimestral'}`, 14, 56);

    let yPos = 70;

    // KPIs Principales
    doc.setFontSize(16);
    doc.setTextColor(212, 175, 55);
    doc.text('Indicadores Clave', 14, yPos);
    yPos += 10;

    doc.autoTable({
      startY: yPos,
      head: [['Métrica', 'Período Actual', 'Período Anterior', 'Variación']],
      body: [
        [
          'Ingresos Totales',
          `$${(datosFinancieros.ingresosMesActual / 1000000).toFixed(2)}M`,
          `$${(datosFinancieros.ingresosMesAnterior / 1000000).toFixed(2)}M`,
          `${datosFinancieros.variacionMes > 0 ? '+' : ''}${datosFinancieros.variacionMes.toFixed(1)}%`
        ],
        [
          'Egresos Totales',
          `$${(datosFinancieros.egresosMesActual / 1000000).toFixed(2)}M`,
          `$${(datosFinancieros.egresosMesAnterior / 1000000).toFixed(2)}M`,
          '-'
        ],
        [
          'Utilidad Neta',
          `$${(datosFinancieros.netoMesActual / 1000000).toFixed(2)}M`,
          `$${(datosFinancieros.netoMesAnterior / 1000000).toFixed(2)}M`,
          `${((datosFinancieros.netoMesActual - datosFinancieros.netoMesAnterior) / datosFinancieros.netoMesAnterior * 100).toFixed(1)}%`
        ],
        [
          'Servicios Realizados',
          `${datosFinancieros.serviciosMesActual}`,
          `${datosFinancieros.serviciosMesAnterior}`,
          `${datosFinancieros.serviciosMesActual - datosFinancieros.serviciosMesAnterior}`
        ],
      ],
      theme: 'grid',
      headStyles: { fillColor: [212, 175, 55], textColor: [0, 0, 0] },
      styles: { fontSize: 9 },
    });

    yPos = (doc as any).lastAutoTable.finalY + 15;

    // Distribución de Ingresos
    doc.setFontSize(16);
    doc.setTextColor(212, 175, 55);
    doc.text('Distribución de Ingresos', 14, yPos);
    yPos += 10;

    doc.autoTable({
      startY: yPos,
      head: [['Fuente', 'Monto', 'Porcentaje']],
      body: datosFinancieros.distribucionIngresos.map(item => [
        item.name,
        `$${(item.value / 1000000).toFixed(2)}M`,
        `${((item.value / datosFinancieros.ingresosMesActual) * 100).toFixed(1)}%`
      ]),
      theme: 'grid',
      headStyles: { fillColor: [212, 175, 55], textColor: [0, 0, 0] },
      styles: { fontSize: 9 },
    });

    yPos = (doc as any).lastAutoTable.finalY + 15;

    // Top Modelos
    if (yPos > 250) {
      doc.addPage();
      yPos = 20;
    }

    doc.setFontSize(16);
    doc.setTextColor(212, 175, 55);
    doc.text('Top 5 Modelos', 14, yPos);
    yPos += 10;

    doc.autoTable({
      startY: yPos,
      head: [['Posición', 'Modelo', 'Ingresos Generados']],
      body: datosFinancieros.topModelos.map((modelo, index) => [
        `#${index + 1}`,
        modelo.nombre,
        `$${(modelo.ingresos / 1000000).toFixed(2)}M`
      ]),
      theme: 'grid',
      headStyles: { fillColor: [212, 175, 55], textColor: [0, 0, 0] },
      styles: { fontSize: 9 },
    });

    // Footer
    const totalPages = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(128, 128, 128);
      doc.text(
        `Página ${i} de ${totalPages}`,
        pageWidth / 2,
        doc.internal.pageSize.getHeight() - 10,
        { align: 'center' }
      );
    }

    doc.save(`reporte-financiero-${new Date().toISOString().split('T')[0]}.pdf`);
  };

  // Función para exportar CSV
  const exportarCSV = () => {
    const csvContent = [
      ['Black Diamond Studios - Reporte Financiero'],
      ['Generado', new Date().toLocaleDateString('es-CO')],
      [''],
      ['INDICADORES CLAVE'],
      ['Métrica', 'Período Actual', 'Período Anterior', 'Variación'],
      ['Ingresos Totales', datosFinancieros.ingresosMesActual, datosFinancieros.ingresosMesAnterior, `${datosFinancieros.variacionMes.toFixed(1)}%`],
      ['Egresos Totales', datosFinancieros.egresosMesActual, datosFinancieros.egresosMesAnterior, '-'],
      ['Utilidad Neta', datosFinancieros.netoMesActual, datosFinancieros.netoMesAnterior, '-'],
      ['Servicios', datosFinancieros.serviciosMesActual, datosFinancieros.serviciosMesAnterior, datosFinancieros.serviciosMesActual - datosFinancieros.serviciosMesAnterior],
      [''],
      ['DISTRIBUCIÓN DE INGRESOS'],
      ['Fuente', 'Monto', 'Porcentaje'],
      ...datosFinancieros.distribucionIngresos.map(item => [
        item.name,
        item.value,
        `${((item.value / datosFinancieros.ingresosMesActual) * 100).toFixed(1)}%`
      ]),
      [''],
      ['TOP MODELOS'],
      ['Posición', 'Modelo', 'Ingresos'],
      ...datosFinancieros.topModelos.map((modelo, index) => [
        index + 1,
        modelo.nombre,
        modelo.ingresos
      ])
    ]
      .map(row => row.join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `reporte-financiero-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  return (
    <div className="space-y-6">
      {/* KPIs Principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-primary/30 bg-gradient-to-br from-primary/10 to-transparent">
          <CardHeader className="pb-3">
            <CardDescription className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <DollarSign className="w-4 h-4" />
                Ingresos del Mes
              </span>
              {datosFinancieros.variacionMes > 0 ? (
                <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                  <ArrowUp className="w-3 h-3 mr-1" />
                  {datosFinancieros.variacionMes.toFixed(1)}%
                </Badge>
              ) : (
                <Badge className="bg-red-500/20 text-red-400 border-red-500/30">
                  <ArrowDown className="w-3 h-3 mr-1" />
                  {Math.abs(datosFinancieros.variacionMes).toFixed(1)}%
                </Badge>
              )}
            </CardDescription>
            <CardTitle className="text-3xl text-primary">
              ${(datosFinancieros.ingresosMesActual / 1000000).toFixed(1)}M
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-1">
              vs ${(datosFinancieros.ingresosMesAnterior / 1000000).toFixed(1)}M mes anterior
            </p>
          </CardHeader>
        </Card>

        <Card className="border-green-500/30 bg-gradient-to-br from-green-500/10 to-transparent">
          <CardHeader className="pb-3">
            <CardDescription className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Utilidad Neta
            </CardDescription>
            <CardTitle className="text-3xl text-green-400">
              ${(datosFinancieros.netoMesActual / 1000000).toFixed(1)}M
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-1">
              Margen: {((datosFinancieros.netoMesActual / datosFinancieros.ingresosMesActual) * 100).toFixed(1)}%
            </p>
          </CardHeader>
        </Card>

        <Card className="border-blue-500/30 bg-gradient-to-br from-blue-500/10 to-transparent">
          <CardHeader className="pb-3">
            <CardDescription className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Servicios Realizados
            </CardDescription>
            <CardTitle className="text-3xl text-blue-400">
              {datosFinancieros.serviciosMesActual}
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-1">
              {datosFinancieros.serviciosMesActual - datosFinancieros.serviciosMesAnterior > 0 ? '+' : ''}
              {datosFinancieros.serviciosMesActual - datosFinancieros.serviciosMesAnterior} vs mes anterior
            </p>
          </CardHeader>
        </Card>

        <Card className="border-purple-500/30 bg-gradient-to-br from-purple-500/10 to-transparent">
          <CardHeader className="pb-3">
            <CardDescription className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Ticket Promedio
            </CardDescription>
            <CardTitle className="text-3xl text-purple-400">
              ${Math.round((datosFinancieros.ingresosMesActual / datosFinancieros.serviciosMesActual) / 1000)}K
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-1">
              Por servicio realizado
            </p>
          </CardHeader>
        </Card>
      </div>

      {/* Botones de Exportación */}
      <Card className="border-primary/30">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Reportes y Exportación</CardTitle>
              <CardDescription>Descarga reportes financieros en diferentes formatos</CardDescription>
            </div>
            <div className="flex gap-2">
              <Button 
                onClick={exportarReportePDF}
                className="bg-primary text-primary-foreground hover:bg-primary/90"
              >
                <FileText className="w-4 h-4 mr-2" />
                Exportar PDF
              </Button>
              <Button 
                onClick={exportarCSV}
                variant="outline"
                className="border-primary/30"
              >
                <Download className="w-4 h-4 mr-2" />
                Exportar CSV
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Tabs de Visualizaciones */}
      <Tabs defaultValue="tendencias" className="w-full">
        <TabsList className="grid w-full grid-cols-4 bg-secondary">
          <TabsTrigger value="tendencias">
            <TrendingUp className="w-4 h-4 mr-2" />
            Tendencias
          </TabsTrigger>
          <TabsTrigger value="distribucion">
            <PieChart className="w-4 h-4 mr-2" />
            Distribución
          </TabsTrigger>
          <TabsTrigger value="comparativas">
            <BarChart3 className="w-4 h-4 mr-2" />
            Comparativas
          </TabsTrigger>
          <TabsTrigger value="modelos">
            <Users className="w-4 h-4 mr-2" />
            Por Modelo
          </TabsTrigger>
        </TabsList>

        {/* Tab: Tendencias */}
        <TabsContent value="tendencias" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Tendencia Diaria - Últimos 30 Días</CardTitle>
              <CardDescription>Ingresos, egresos y utilidad neta por día</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <ComposedChart data={datosFinancieros.tendenciaDiaria}>
                  <defs>
                    <linearGradient id="colorIngresos" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={COLORS.primary} stopOpacity={0.3}/>
                      <stop offset="95%" stopColor={COLORS.primary} stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                  <XAxis 
                    dataKey="fecha" 
                    stroke="#888"
                    style={{ fontSize: '12px' }}
                  />
                  <YAxis 
                    stroke="#888"
                    style={{ fontSize: '12px' }}
                    label={{ value: 'Miles (K)', angle: -90, position: 'insideLeft', fill: '#888' }}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1a1a24', 
                      border: '1px solid #d4af37',
                      borderRadius: '8px'
                    }}
                    labelStyle={{ color: '#d4af37' }}
                  />
                  <Legend />
                  <Area 
                    type="monotone" 
                    dataKey="ingresos" 
                    stroke={COLORS.primary}
                    fill="url(#colorIngresos)"
                    name="Ingresos"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="egresos" 
                    stroke={COLORS.danger}
                    strokeWidth={2}
                    name="Egresos"
                    dot={{ fill: COLORS.danger }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="neto" 
                    stroke={COLORS.success}
                    strokeWidth={2}
                    name="Neto"
                    dot={{ fill: COLORS.success }}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Evolución Semanal - Últimas 8 Semanas</CardTitle>
              <CardDescription>Ingresos y cantidad de servicios por semana</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <ComposedChart data={datosFinancieros.tendenciaSemanal}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                  <XAxis dataKey="semana" stroke="#888" />
                  <YAxis 
                    yAxisId="left"
                    stroke="#888"
                    label={{ value: 'Millones (M)', angle: -90, position: 'insideLeft', fill: '#888' }}
                  />
                  <YAxis 
                    yAxisId="right"
                    orientation="right"
                    stroke="#888"
                    label={{ value: 'Servicios', angle: 90, position: 'insideRight', fill: '#888' }}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1a1a24', 
                      border: '1px solid #d4af37',
                      borderRadius: '8px'
                    }}
                  />
                  <Legend />
                  <Bar 
                    yAxisId="left"
                    dataKey="ingresos" 
                    fill={COLORS.primary}
                    name="Ingresos (M)"
                    radius={[8, 8, 0, 0]}
                  />
                  <Line 
                    yAxisId="right"
                    type="monotone" 
                    dataKey="servicios" 
                    stroke={COLORS.info}
                    strokeWidth={3}
                    name="Servicios"
                    dot={{ fill: COLORS.info, r: 5 }}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Distribución */}
        <TabsContent value="distribucion" className="space-y-4 mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Distribución de Ingresos por Fuente</CardTitle>
                <CardDescription>Composición de ingresos del mes actual</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <RechartsPieChart>
                    <Pie
                      data={datosFinancieros.distribucionIngresos}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {datosFinancieros.distribucionIngresos.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value: number) => `$${(value / 1000000).toFixed(2)}M`}
                      contentStyle={{ 
                        backgroundColor: '#1a1a24', 
                        border: '1px solid #d4af37',
                        borderRadius: '8px'
                      }}
                    />
                  </RechartsPieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Desglose Detallado</CardTitle>
                <CardDescription>Montos por fuente de ingreso</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {datosFinancieros.distribucionIngresos.map((item, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-3 h-3 rounded-full" 
                            style={{ backgroundColor: item.color }}
                          />
                          <span className="font-medium text-sm">{item.name}</span>
                        </div>
                        <span className="text-primary font-bold">
                          ${(item.value / 1000000).toFixed(2)}M
                        </span>
                      </div>
                      <div className="w-full bg-secondary rounded-full h-2">
                        <div 
                          className="h-2 rounded-full transition-all"
                          style={{ 
                            width: `${(item.value / datosFinancieros.ingresosMesActual) * 100}%`,
                            backgroundColor: item.color
                          }}
                        />
                      </div>
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>
                          {((item.value / datosFinancieros.ingresosMesActual) * 100).toFixed(1)}% del total
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Tab: Comparativas */}
        <TabsContent value="comparativas" className="space-y-4 mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Comparativa Mensual</CardTitle>
                <CardDescription>Mes actual vs mes anterior</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart
                    data={[
                      {
                        name: 'Mes Anterior',
                        Ingresos: Math.round(datosFinancieros.ingresosMesAnterior / 1000000 * 10) / 10,
                        Egresos: Math.round(datosFinancieros.egresosMesAnterior / 1000000 * 10) / 10,
                        Neto: Math.round(datosFinancieros.netoMesAnterior / 1000000 * 10) / 10,
                      },
                      {
                        name: 'Mes Actual',
                        Ingresos: Math.round(datosFinancieros.ingresosMesActual / 1000000 * 10) / 10,
                        Egresos: Math.round(datosFinancieros.egresosMesActual / 1000000 * 10) / 10,
                        Neto: Math.round(datosFinancieros.netoMesActual / 1000000 * 10) / 10,
                      },
                    ]}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                    <XAxis dataKey="name" stroke="#888" />
                    <YAxis 
                      stroke="#888"
                      label={{ value: 'Millones (M)', angle: -90, position: 'insideLeft', fill: '#888' }}
                    />
                    <Tooltip 
                      formatter={(value) => `$${value}M`}
                      contentStyle={{ 
                        backgroundColor: '#1a1a24', 
                        border: '1px solid #d4af37',
                        borderRadius: '8px'
                      }}
                    />
                    <Legend />
                    <Bar dataKey="Ingresos" fill={COLORS.primary} radius={[8, 8, 0, 0]} />
                    <Bar dataKey="Egresos" fill={COLORS.danger} radius={[8, 8, 0, 0]} />
                    <Bar dataKey="Neto" fill={COLORS.success} radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Comparativa Semanal</CardTitle>
                <CardDescription>Semana actual vs semana anterior</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart
                    data={[
                      {
                        name: 'Semana Anterior',
                        Ingresos: Math.round(datosFinancieros.ingresosSemanaAnterior / 1000000 * 10) / 10,
                      },
                      {
                        name: 'Semana Actual',
                        Ingresos: Math.round(datosFinancieros.ingresosSemanaActual / 1000000 * 10) / 10,
                      },
                    ]}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                    <XAxis dataKey="name" stroke="#888" />
                    <YAxis 
                      stroke="#888"
                      label={{ value: 'Millones (M)', angle: -90, position: 'insideLeft', fill: '#888' }}
                    />
                    <Tooltip 
                      formatter={(value) => `$${value}M`}
                      contentStyle={{ 
                        backgroundColor: '#1a1a24', 
                        border: '1px solid #d4af37',
                        borderRadius: '8px'
                      }}
                    />
                    <Legend />
                    <Bar dataKey="Ingresos" fill={COLORS.primary} radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
                <div className="mt-4 p-4 bg-secondary rounded-lg border border-border">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Variación Semanal:</span>
                    <div className="flex items-center gap-2">
                      {datosFinancieros.variacionSemana > 0 ? (
                        <>
                          <TrendingUp className="w-4 h-4 text-green-400" />
                          <span className="text-green-400 font-bold">
                            +{datosFinancieros.variacionSemana.toFixed(1)}%
                          </span>
                        </>
                      ) : (
                        <>
                          <TrendingDown className="w-4 h-4 text-red-400" />
                          <span className="text-red-400 font-bold">
                            {datosFinancieros.variacionSemana.toFixed(1)}%
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Métricas de Comparación */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="border-primary/30">
              <CardHeader className="pb-3">
                <CardDescription>Variación Mensual</CardDescription>
                <CardTitle className={`text-2xl ${datosFinancieros.variacionMes > 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {datosFinancieros.variacionMes > 0 ? '+' : ''}{datosFinancieros.variacionMes.toFixed(1)}%
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Diferencia: ${((datosFinancieros.ingresosMesActual - datosFinancieros.ingresosMesAnterior) / 1000000).toFixed(2)}M
                </p>
              </CardContent>
            </Card>

            <Card className="border-primary/30">
              <CardHeader className="pb-3">
                <CardDescription>Servicios Adicionales</CardDescription>
                <CardTitle className="text-2xl text-primary">
                  {datosFinancieros.serviciosMesActual - datosFinancieros.serviciosMesAnterior > 0 ? '+' : ''}
                  {datosFinancieros.serviciosMesActual - datosFinancieros.serviciosMesAnterior}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  vs mes anterior ({datosFinancieros.serviciosMesAnterior} servicios)
                </p>
              </CardContent>
            </Card>

            <Card className="border-primary/30">
              <CardHeader className="pb-3">
                <CardDescription>Margen de Utilidad</CardDescription>
                <CardTitle className="text-2xl text-primary">
                  {((datosFinancieros.netoMesActual / datosFinancieros.ingresosMesActual) * 100).toFixed(1)}%
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Del total de ingresos del mes
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Tab: Por Modelo */}
        <TabsContent value="modelos" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Top 5 Modelos por Ingresos</CardTitle>
              <CardDescription>Ranking del mes actual</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart 
                  data={datosFinancieros.topModelos}
                  layout="vertical"
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                  <XAxis 
                    type="number"
                    stroke="#888"
                    label={{ value: 'Millones (M)', position: 'insideBottom', fill: '#888' }}
                    tickFormatter={(value) => `$${(value / 1000000).toFixed(1)}M`}
                  />
                  <YAxis 
                    type="category"
                    dataKey="nombre" 
                    stroke="#888"
                    width={120}
                  />
                  <Tooltip 
                    formatter={(value: number) => `$${(value / 1000000).toFixed(2)}M`}
                    contentStyle={{ 
                      backgroundColor: '#1a1a24', 
                      border: '1px solid #d4af37',
                      borderRadius: '8px'
                    }}
                  />
                  <Bar dataKey="ingresos" fill={COLORS.primary} radius={[0, 8, 8, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {datosFinancieros.topModelos.map((modelo, index) => (
              <Card key={index} className="border-primary/30">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{modelo.nombreArtistico || modelo.nombre}</CardTitle>
                    <Badge className="bg-primary text-primary-foreground">
                      #{index + 1}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Ingresos Generados:</span>
                      <span className="text-lg font-bold text-primary">
                        ${(modelo.ingresos / 1000000).toFixed(2)}M
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Participación:</span>
                      <span className="text-sm font-medium">
                        {((modelo.ingresos / datosFinancieros.ingresosMesActual) * 100).toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Alertas y Recomendaciones */}
      <Card className="border-yellow-500/30 bg-gradient-to-br from-yellow-500/10 to-transparent">
        <CardHeader>
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-yellow-500" />
            <CardTitle>Insights y Recomendaciones</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {datosFinancieros.variacionMes > 10 && (
              <div className="flex items-start gap-3 p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
                <TrendingUp className="w-5 h-5 text-green-400 mt-0.5" />
                <div>
                  <p className="font-medium text-green-400">Crecimiento Excepcional</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Los ingresos han aumentado un {datosFinancieros.variacionMes.toFixed(1)}% respecto al mes anterior. 
                    Considera expandir la operación o aumentar precios estratégicamente.
                  </p>
                </div>
              </div>
            )}
            
            {datosFinancieros.variacionMes < -5 && (
              <div className="flex items-start gap-3 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                <TrendingDown className="w-5 h-5 text-red-400 mt-0.5" />
                <div>
                  <p className="font-medium text-red-400">Alerta de Disminución</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Los ingresos han disminuido un {Math.abs(datosFinancieros.variacionMes).toFixed(1)}%. 
                    Revisa las estrategias de marketing y considera promociones especiales.
                  </p>
                </div>
              </div>
            )}

            <div className="flex items-start gap-3 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
              <ShoppingBag className="w-5 h-5 text-blue-400 mt-0.5" />
              <div>
                <p className="font-medium text-blue-400">Diversificación de Ingresos</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Los servicios base representan el {((datosFinancieros.ingresosPorFuente.servicios / datosFinancieros.ingresosMesActual) * 100).toFixed(0)}% de los ingresos. 
                  Considera promover adicionales y extensiones para aumentar el ticket promedio.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}