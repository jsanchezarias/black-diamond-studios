import { useState } from 'react';
import { Clock, LogIn, LogOut, Calendar, TrendingUp, Users, ChevronDown, ChevronUp, ChevronLeft, ChevronRight, User, FileDown } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { useAsistencia } from './AsistenciaContext';
import { useModelos } from './ModelosContext';
import { Logo } from './Logo';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface AsistenciaPanelProps {
  userRole: 'owner' | 'admin' | 'programador' | 'modelo';
  userEmail?: string;
}

export function AsistenciaPanel({ userRole, userEmail }: AsistenciaPanelProps) {
  const { registros, obtenerRegistrosDelDia, obtenerEstadisticas, obtenerRegistrosPorModelo } = useAsistencia();
  const { modelos } = useModelos();
  const [expandido, setExpandido] = useState(true);
  const [vistaActual, setVistaActual] = useState<'diaria' | 'semanal' | 'mensual'>('diaria');
  const [fechaSeleccionada, setFechaSeleccionada] = useState(new Date());

  // Funciones para navegación de fechas
  const avanzarPeriodo = () => {
    const nuevaFecha = new Date(fechaSeleccionada);
    if (vistaActual === 'diaria') {
      nuevaFecha.setDate(nuevaFecha.getDate() + 1);
    } else if (vistaActual === 'semanal') {
      nuevaFecha.setDate(nuevaFecha.getDate() + 7);
    } else {
      nuevaFecha.setMonth(nuevaFecha.getMonth() + 1);
    }
    setFechaSeleccionada(nuevaFecha);
  };

  const retrocederPeriodo = () => {
    const nuevaFecha = new Date(fechaSeleccionada);
    if (vistaActual === 'diaria') {
      nuevaFecha.setDate(nuevaFecha.getDate() - 1);
    } else if (vistaActual === 'semanal') {
      nuevaFecha.setDate(nuevaFecha.getDate() - 7);
    } else {
      nuevaFecha.setMonth(nuevaFecha.getMonth() - 1);
    }
    setFechaSeleccionada(nuevaFecha);
  };

  const irAHoy = () => {
    setFechaSeleccionada(new Date());
  };

  // Obtener registros según el periodo
  const obtenerRegistrosPorPeriodo = () => {
    if (vistaActual === 'diaria') {
      return registros.filter(r => {
        const fechaRegistro = new Date(r.fecha);
        return (
          fechaRegistro.getDate() === fechaSeleccionada.getDate() &&
          fechaRegistro.getMonth() === fechaSeleccionada.getMonth() &&
          fechaRegistro.getFullYear() === fechaSeleccionada.getFullYear()
        );
      });
    } else if (vistaActual === 'semanal') {
      const inicioSemana = new Date(fechaSeleccionada);
      inicioSemana.setDate(inicioSemana.getDate() - inicioSemana.getDay());
      inicioSemana.setHours(0, 0, 0, 0);
      
      const finSemana = new Date(inicioSemana);
      finSemana.setDate(finSemana.getDate() + 6);
      finSemana.setHours(23, 59, 59, 999);

      return registros.filter(r => {
        const fechaRegistro = new Date(r.fecha);
        return fechaRegistro >= inicioSemana && fechaRegistro <= finSemana;
      });
    } else {
      return registros.filter(r => {
        const fechaRegistro = new Date(r.fecha);
        return (
          fechaRegistro.getMonth() === fechaSeleccionada.getMonth() &&
          fechaRegistro.getFullYear() === fechaSeleccionada.getFullYear()
        );
      });
    }
  };

  const registrosPeriodo = obtenerRegistrosPorPeriodo();
  const modelosEnTurno = registrosPeriodo.filter(r => r.estado === 'En Turno');

  // Calcular estadísticas del periodo
  const calcularEstadisticasPeriodo = () => {
    const registrosFinalizados = registrosPeriodo.filter(r => r.estado === 'Finalizado');
    const totalHoras = registrosFinalizados.reduce((sum, r) => sum + (r.horasTrabajadas || 0), 0);
    
    // Agrupar por modelo
    const porModelo = registrosFinalizados.reduce((acc, r) => {
      if (!acc[r.modeloEmail]) {
        acc[r.modeloEmail] = {
          nombre: r.modeloNombre,
          dias: 0,
          horas: 0,
        };
      }
      acc[r.modeloEmail].dias++;
      acc[r.modeloEmail].horas += r.horasTrabajadas || 0;
      return acc;
    }, {} as Record<string, { nombre: string; dias: number; horas: number }>);

    return {
      totalRegistros: registrosPeriodo.length,
      registrosFinalizados: registrosFinalizados.length,
      totalHoras,
      modelosActivas: Object.keys(porModelo).length,
      porModelo,
    };
  };

  const estadisticas = calcularEstadisticasPeriodo();

  // Función para exportar a PDF
  const exportarPDF = () => {
    const doc = new jsPDF();
    
    // Configuración de colores
    const primaryColor: [number, number, number] = [212, 175, 55]; // Dorado #d4af37
    const darkColor: [number, number, number] = [10, 10, 15]; // Oscuro #0a0a0f
    const textColor: [number, number, number] = [200, 200, 200]; // Texto claro
    
    // Encabezado con branding mejorado
    doc.setFillColor(...darkColor);
    doc.rect(0, 0, 210, 50, 'F');
    
    // Título principal con tipografía elegante
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.setFontSize(28);
    doc.setFont('helvetica', 'bold');
    doc.text('BLACK DIAMOND STUDIOS', 105, 18, { align: 'center' });
    
    // Línea decorativa dorada
    doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.setLineWidth(0.5);
    doc.line(60, 23, 150, 23);
    
    // Subtítulo
    doc.setFontSize(16);
    doc.setFont('helvetica', 'normal');
    doc.text('Reporte de Asistencia', 105, 32, { align: 'center' });
    
    doc.setFontSize(11);
    doc.setTextColor(200, 200, 200);
    doc.text(obtenerTextoPeriodo(), 105, 40, { align: 'center' });
    
    // Pequeño diamante decorativo (simulado con caracteres)
    doc.setFontSize(8);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text('◆', 105, 46, { align: 'center' });
    
    // Información del periodo
    let yPos = 60;
    doc.setTextColor(textColor[0], textColor[1], textColor[2]);
    doc.setFontSize(9);
    doc.text(`Generado: ${new Date().toLocaleString('es-CO')}`, 14, yPos);
    yPos += 5;
    doc.text(`Vista: ${vistaActual.charAt(0).toUpperCase() + vistaActual.slice(1)}`, 14, yPos);
    
    // Estadísticas generales
    yPos += 15;
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...primaryColor);
    doc.text('Estadísticas del Periodo', 14, yPos);
    
    yPos += 10;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(textColor[0], textColor[1], textColor[2]);
    
    const stats = [
      ['Modelos Activas', estadisticas.modelosActivas.toString()],
      ['Total Registros', estadisticas.totalRegistros.toString()],
      ['Registros Finalizados', estadisticas.registrosFinalizados.toString()],
      ['Total Horas Trabajadas', estadisticas.totalHoras.toFixed(1) + 'h'],
    ];
    
    autoTable(doc, {
      startY: yPos,
      head: [['Métrica', 'Valor']],
      body: stats,
      theme: 'grid',
      headStyles: {
        fillColor: primaryColor,
        textColor: darkColor,
        fontStyle: 'bold',
        fontSize: 11,
      },
      alternateRowStyles: {
        fillColor: [245, 245, 245],
      },
      styles: {
        fontSize: 10,
      },
      margin: { left: 14, right: 14 },
    });
    
    // Resumen por modelo
    yPos = (doc as any).lastAutoTable.finalY + 15;
    
    if (Object.keys(estadisticas.porModelo).length > 0) {
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...primaryColor);
      doc.text('Resumen por Modelo', 14, yPos);
      
      yPos += 10;
      
      const modeloData = Object.entries(estadisticas.porModelo)
        .sort((a, b) => b[1].horas - a[1].horas)
        .map(([email, data]) => [
          data.nombre,
          data.dias.toString(),
          data.horas.toFixed(1) + 'h',
          (data.horas / data.dias).toFixed(1) + 'h',
        ]);
      
      autoTable(doc, {
        startY: yPos,
        head: [['Modelo', 'Días', 'Total Horas', 'Promedio/Día']],
        body: modeloData,
        theme: 'grid',
        headStyles: {
          fillColor: primaryColor,
          textColor: darkColor,
          fontStyle: 'bold',
        },
        alternateRowStyles: {
          fillColor: [245, 245, 245],
        },
        margin: { left: 14, right: 14 },
      });
    }
    
    // Registros detallados (solo para vista diaria)
    if (vistaActual === 'diaria' && registrosPeriodo.filter(r => r.estado === 'Finalizado').length > 0) {
      yPos = (doc as any).lastAutoTable.finalY + 15;
      
      // Verificar si necesitamos una nueva página
      if (yPos > 240) {
        doc.addPage();
        yPos = 20;
      }
      
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...primaryColor);
      doc.text('Registros Detallados', 14, yPos);
      
      yPos += 10;
      
      const registrosData = registrosPeriodo
        .filter(r => r.estado === 'Finalizado')
        .map((registro) => [
          registro.modeloNombre,
          registro.horaLlegada.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' }),
          registro.horaSalida?.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' }) || '-',
          registro.horasTrabajadas?.toFixed(1) + 'h' || '-',
        ]);
      
      autoTable(doc, {
        startY: yPos,
        head: [['Modelo', 'Hora Llegada', 'Hora Salida', 'Horas Trabajadas']],
        body: registrosData,
        theme: 'grid',
        headStyles: {
          fillColor: primaryColor,
          textColor: darkColor,
          fontStyle: 'bold',
        },
        alternateRowStyles: {
          fillColor: [245, 245, 245],
        },
        margin: { left: 14, right: 14 },
      });
    }
    
    // Pie de página en todas las páginas
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text(
        `Página ${i} de ${pageCount}`,
        doc.internal.pageSize.width / 2,
        doc.internal.pageSize.height - 10,
        { align: 'center' }
      );
    }
    
    // Guardar el PDF
    const nombreArchivo = `asistencia_${vistaActual}_${fechaSeleccionada.toLocaleDateString('es-CO').replace(/\//g, '-')}.pdf`;
    doc.save(nombreArchivo);
  };

  // Obtener texto del periodo
  const obtenerTextoPeriodo = () => {
    if (vistaActual === 'diaria') {
      return fechaSeleccionada.toLocaleDateString('es-CO', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
    } else if (vistaActual === 'semanal') {
      const inicioSemana = new Date(fechaSeleccionada);
      inicioSemana.setDate(inicioSemana.getDate() - inicioSemana.getDay());
      
      const finSemana = new Date(inicioSemana);
      finSemana.setDate(finSemana.getDate() + 6);

      return `${inicioSemana.toLocaleDateString('es-CO', { day: 'numeric', month: 'short' })} - ${finSemana.toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' })}`;
    } else {
      return fechaSeleccionada.toLocaleDateString('es-CO', { 
        year: 'numeric', 
        month: 'long' 
      });
    }
  };

  // Vista para modelo individual
  if (userRole === 'modelo' && userEmail) {
    const misRegistros = obtenerRegistrosPorModelo(userEmail);
    const stats = obtenerEstadisticas(userEmail);
    const registroActual = misRegistros.find(r => r.estado === 'En Turno');

    return (
      <Card className="border-primary/30 bg-gradient-to-br from-card to-card/50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-primary">
                <Clock className="w-5 h-5" />
                Mi Asistencia
              </CardTitle>
              <CardDescription>Registro de entrada y salida</CardDescription>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setExpandido(!expandido)}
            >
              {expandido ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </Button>
          </div>
        </CardHeader>
        {expandido && (
          <CardContent className="space-y-4">
            {/* Estado Actual */}
            {registroActual && (
              <div className="p-4 bg-green-950/30 border-2 border-green-500/30 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <Badge className="bg-green-500/80 text-white">
                    <LogIn className="w-3 h-3 mr-1" />
                    En Turno
                  </Badge>
                  <span className="text-sm text-muted-foreground">Hoy</span>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-muted-foreground">Llegada:</span>
                    <p className="font-bold text-green-400">
                      {registroActual.horaLlegada.toLocaleTimeString('es-CO', { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Tiempo:</span>
                    <p className="font-bold text-primary">
                      {Math.floor((new Date().getTime() - registroActual.horaLlegada.getTime()) / (1000 * 60 * 60))}h{' '}
                      {Math.floor(((new Date().getTime() - registroActual.horaLlegada.getTime()) % (1000 * 60 * 60)) / (1000 * 60))}m
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Estadísticas */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="p-3 bg-secondary rounded-lg border border-border">
                <p className="text-xs text-muted-foreground mb-1">Días Trabajados</p>
                <p className="text-xl font-bold text-primary">{stats.totalDias}</p>
              </div>
              <div className="p-3 bg-secondary rounded-lg border border-border">
                <p className="text-xs text-muted-foreground mb-1">Total Horas</p>
                <p className="text-xl font-bold text-primary">{stats.totalHoras.toFixed(1)}h</p>
              </div>
              <div className="p-3 bg-secondary rounded-lg border border-border">
                <p className="text-xs text-muted-foreground mb-1">Promedio/Día</p>
                <p className="text-xl font-bold text-primary">{stats.promedioHorasPorDia.toFixed(1)}h</p>
              </div>
              <div className="p-3 bg-secondary rounded-lg border border-border">
                <p className="text-xs text-muted-foreground mb-1">Este Mes</p>
                <p className="text-xl font-bold text-primary">{stats.diasEsteMes}</p>
              </div>
            </div>

            {/* Historial Reciente */}
            <div>
              <h4 className="text-sm font-semibold mb-3">Historial Reciente</h4>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {misRegistros.slice(0, 5).map((registro) => (
                  <div
                    key={registro.id}
                    className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg border border-border/50"
                  >
                    <div className="flex items-center gap-3">
                      <div className="text-center">
                        <div className="text-lg font-bold text-primary">
                          {new Date(registro.fecha).getDate()}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {new Date(registro.fecha).toLocaleDateString('es', { month: 'short' })}
                        </div>
                      </div>
                      <div className="text-sm">
                        <div className="flex items-center gap-2 mb-1">
                          <LogIn className="w-3 h-3 text-green-500" />
                          <span>{registro.horaLlegada.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                        {registro.horaSalida && (
                          <div className="flex items-center gap-2">
                            <LogOut className="w-3 h-3 text-red-500" />
                            <span>{registro.horaSalida.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      {registro.horasTrabajadas ? (
                        <p className="font-bold text-primary">{registro.horasTrabajadas.toFixed(1)}h</p>
                      ) : (
                        <Badge variant="outline" className="border-green-500/50 text-green-400">Activo</Badge>
                      )}
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

  // Vista para admin, programador y owner CON VISTAS DIARIA/SEMANAL/MENSUAL
  return (
    <Card className="border-primary/30 bg-gradient-to-br from-card to-card/50">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-primary">
              <Users className="w-5 h-5" />
              Control de Asistencia
            </CardTitle>
            <CardDescription>Registro completo de llegadas y salidas</CardDescription>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setExpandido(!expandido)}
          >
            {expandido ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </Button>
        </div>
      </CardHeader>
      {expandido && (
        <CardContent className="space-y-4">
          {/* Tabs para Diaria/Semanal/Mensual */}
          <Tabs value={vistaActual} onValueChange={(v) => setVistaActual(v as any)}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="diaria">Diaria</TabsTrigger>
              <TabsTrigger value="semanal">Semanal</TabsTrigger>
              <TabsTrigger value="mensual">Mensual</TabsTrigger>
            </TabsList>

            {/* Navegación de Periodo */}
            <div className="flex items-center justify-between mt-4 p-3 bg-secondary/50 rounded-lg border border-border">
              <Button variant="outline" size="sm" onClick={retrocederPeriodo}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <div className="text-center flex-1">
                <p className="font-semibold text-primary">{obtenerTextoPeriodo()}</p>
              </div>
              <Button variant="outline" size="sm" onClick={avanzarPeriodo}>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>

            <div className="flex justify-center gap-2">
              <Button variant="ghost" size="sm" onClick={irAHoy}>
                <Calendar className="w-3 h-3 mr-1" />
                Ir a Hoy
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={exportarPDF}
                className="border-primary/30 hover:bg-primary/20 hover:text-primary"
              >
                <FileDown className="w-3 h-3 mr-1" />
                Exportar PDF
              </Button>
            </div>

            {/* Estadísticas del Periodo */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="p-4 bg-green-950/30 border-2 border-green-500/30 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Users className="w-4 h-4 text-green-500" />
                  <span className="text-xs text-muted-foreground">Modelos Activas</span>
                </div>
                <p className="text-3xl font-bold text-green-400">{estadisticas.modelosActivas}</p>
              </div>
              <div className="p-4 bg-secondary rounded-lg border border-border">
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">Registros</span>
                </div>
                <p className="text-3xl font-bold text-primary">{estadisticas.totalRegistros}</p>
              </div>
              <div className="p-4 bg-secondary rounded-lg border border-border">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">Total Horas</span>
                </div>
                <p className="text-3xl font-bold text-primary">{estadisticas.totalHoras.toFixed(1)}h</p>
              </div>
              <div className="p-4 bg-secondary rounded-lg border border-border">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="w-4 h-4 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">Finalizados</span>
                </div>
                <p className="text-3xl font-bold text-primary">{estadisticas.registrosFinalizados}</p>
              </div>
            </div>

            <TabsContent value="diaria" className="space-y-4 mt-4">
              {/* Modelos en Turno */}
              {modelosEnTurno.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                    <Badge className="bg-green-500/80 text-white">
                      <User className="w-3 h-3 mr-1" />
                      Activas Ahora ({modelosEnTurno.length})
                    </Badge>
                  </h4>
                  <div className="space-y-2">
                    {modelosEnTurno.map((registro) => {
                      const tiempoTranscurrido = new Date().getTime() - registro.horaLlegada.getTime();
                      const horas = Math.floor(tiempoTranscurrido / (1000 * 60 * 60));
                      const minutos = Math.floor((tiempoTranscurrido % (1000 * 60 * 60)) / (1000 * 60));

                      return (
                        <div
                          key={registro.id}
                          className="flex items-center justify-between p-4 bg-green-950/20 rounded-lg border-2 border-green-500/30"
                        >
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-full bg-green-500/20 border-2 border-green-500 flex items-center justify-center">
                              <span className="text-lg font-bold text-green-400">
                                {registro.modeloNombre.charAt(0)}
                              </span>
                            </div>
                            <div>
                              <p className="font-semibold">{registro.modeloNombre}</p>
                              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                <div className="flex items-center gap-1">
                                  <LogIn className="w-3 h-3 text-green-500" />
                                  <span>{registro.horaLlegada.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <Clock className="w-3 h-3 text-primary" />
                                  <span>{horas}h {minutos}m</span>
                                </div>
                              </div>
                            </div>
                          </div>
                          <Badge className="bg-green-500/80 text-white">
                            Activa
                          </Badge>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Registros Finalizados */}
              {registrosPeriodo.filter(r => r.estado === 'Finalizado').length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold mb-3">Registros Finalizados</h4>
                  <div className="space-y-2 max-h-80 overflow-y-auto">
                    {registrosPeriodo
                      .filter(r => r.estado === 'Finalizado')
                      .map((registro) => (
                        <div
                          key={registro.id}
                          className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg border border-border/50"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
                              <span className="text-sm font-bold text-primary">
                                {registro.modeloNombre.charAt(0)}
                              </span>
                            </div>
                            <div>
                              <p className="font-medium text-sm">{registro.modeloNombre}</p>
                              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                <div className="flex items-center gap-1">
                                  <LogIn className="w-3 h-3 text-green-500" />
                                  {registro.horaLlegada.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}
                                </div>
                                <div className="flex items-center gap-1">
                                  <LogOut className="w-3 h-3 text-red-500" />
                                  {registro.horaSalida?.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-primary">{registro.horasTrabajadas?.toFixed(1)}h</p>
                            <p className="text-xs text-muted-foreground">trabajadas</p>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {registrosPeriodo.length === 0 && (
                <div className="text-center p-8 bg-secondary/50 rounded-lg border-2 border-dashed border-border">
                  <Calendar className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">
                    No hay registros de asistencia para este día
                  </p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="semanal" className="space-y-4 mt-4">
              {/* Resumen por Modelo */}
              {Object.keys(estadisticas.porModelo).length > 0 ? (
                <div>
                  <h4 className="text-sm font-semibold mb-3">Resumen por Modelo</h4>
                  <div className="space-y-2">
                    {Object.entries(estadisticas.porModelo)
                      .sort((a, b) => b[1].horas - a[1].horas)
                      .map(([email, data]) => (
                        <div
                          key={email}
                          className="flex items-center justify-between p-4 bg-secondary/50 rounded-lg border border-border"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-full bg-primary/20 border-2 border-primary flex items-center justify-center">
                              <span className="text-lg font-bold text-primary">
                                {data.nombre.charAt(0)}
                              </span>
                            </div>
                            <div>
                              <p className="font-semibold">{data.nombre}</p>
                              <p className="text-sm text-muted-foreground">{data.dias} días trabajados</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-2xl font-bold text-primary">{data.horas.toFixed(1)}h</p>
                            <p className="text-xs text-muted-foreground">
                              {(data.horas / data.dias).toFixed(1)}h promedio/día
                            </p>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              ) : (
                <div className="text-center p-8 bg-secondary/50 rounded-lg border-2 border-dashed border-border">
                  <Calendar className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">
                    No hay registros de asistencia para esta semana
                  </p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="mensual" className="space-y-4 mt-4">
              {/* Resumen por Modelo */}
              {Object.keys(estadisticas.porModelo).length > 0 ? (
                <div>
                  <h4 className="text-sm font-semibold mb-3">Resumen Mensual por Modelo</h4>
                  <div className="space-y-3">
                    {Object.entries(estadisticas.porModelo)
                      .sort((a, b) => b[1].horas - a[1].horas)
                      .map(([email, data]) => (
                        <div
                          key={email}
                          className="p-4 bg-gradient-to-r from-secondary/50 to-secondary/30 rounded-lg border border-border"
                        >
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-3">
                              <div className="w-12 h-12 rounded-full bg-primary/20 border-2 border-primary flex items-center justify-center">
                                <span className="text-lg font-bold text-primary">
                                  {data.nombre.charAt(0)}
                                </span>
                              </div>
                              <div>
                                <p className="font-semibold text-lg">{data.nombre}</p>
                                <p className="text-sm text-muted-foreground">{email}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-3xl font-bold text-primary">{data.horas.toFixed(1)}h</p>
                            </div>
                          </div>
                          <div className="grid grid-cols-3 gap-3 text-sm">
                            <div className="p-2 bg-background/50 rounded border border-border/50">
                              <p className="text-xs text-muted-foreground mb-1">Días Trabajados</p>
                              <p className="font-bold text-primary">{data.dias}</p>
                            </div>
                            <div className="p-2 bg-background/50 rounded border border-border/50">
                              <p className="text-xs text-muted-foreground mb-1">Promedio/Día</p>
                              <p className="font-bold text-primary">{(data.horas / data.dias).toFixed(1)}h</p>
                            </div>
                            <div className="p-2 bg-background/50 rounded border border-border/50">
                              <p className="text-xs text-muted-foreground mb-1">Total Horas</p>
                              <p className="font-bold text-primary">{data.horas.toFixed(1)}h</p>
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              ) : (
                <div className="text-center p-8 bg-secondary/50 rounded-lg border-2 border-dashed border-border">
                  <Calendar className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">
                    No hay registros de asistencia para este mes
                  </p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      )}
    </Card>
  );
}
