import { MetricasGenerales, ReporteFinanciero, ModeloMetrica, ClienteMetrica } from './AnalyticsContext';

// ==================== EXPORTACIÓN A CSV/EXCEL ====================

export function exportarCSV(datos: any[], nombreArchivo: string) {
  try {
    if (!datos || datos.length === 0) {
      console.warn('⚠️ No hay datos para exportar');
      return;
    }

    // Obtener headers de las claves del primer objeto
    const headers = Object.keys(datos[0]);
    
    // Crear filas CSV
    const csvRows = [
      headers.join(','), // Header row
      ...datos.map(row => 
        headers.map(header => {
          const value = row[header];
          // Escapar comillas y envolver en comillas si contiene comas
          const stringValue = String(value || '');
          return stringValue.includes(',') ? `"${stringValue.replace(/"/g, '""')}"` : stringValue;
        }).join(',')
      )
    ];

    // Crear blob y descargar
    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `${nombreArchivo}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    console.log(`✅ CSV exportado: ${nombreArchivo}.csv`);
  } catch (error) {
    console.error('❌ Error exportando CSV:', error);
  }
}

// ==================== EXPORTACIÓN A JSON ====================

export function exportarJSON(datos: any, nombreArchivo: string) {
  try {
    const jsonString = JSON.stringify(datos, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `${nombreArchivo}.json`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    console.log(`✅ JSON exportado: ${nombreArchivo}.json`);
  } catch (error) {
    console.error('❌ Error exportando JSON:', error);
  }
}

// ==================== EXPORTACIÓN DE REPORTES ESPECÍFICOS ====================

export function exportarReporteFinanciero(reporte: ReporteFinanciero) {
  const datos = [
    {
      periodo: reporte.periodo,
      fechaInicio: reporte.fechaInicio,
      fechaFin: reporte.fechaFin,
      
      // Ingresos
      ingresosPorServicios: reporte.ingresosPorServicios,
      ingresosPorPropinas: reporte.ingresosPorPropinas,
      ingresosPorMultas: reporte.ingresosPorMultas,
      ingresosOtros: reporte.ingresosOtros,
      ingresosTotal: reporte.ingresosTotal,
      
      // Gastos
      gastosOperativos: reporte.gastosOperativos,
      gastosNomina: reporte.gastosNomina,
      gastosMarketing: reporte.gastosMarketing,
      gastosOtros: reporte.gastosOtros,
      gastosTotal: reporte.gastosTotal,
      
      // Resultados
      utilidadBruta: reporte.utilidadBruta,
      margenBruto: `${reporte.margenBruto.toFixed(2)}%`,
      
      // Desglose
      ingresosSede: reporte.ingresosSede,
      ingresosDomicilio: reporte.ingresosDomicilio,
      
      tendencia: reporte.tendencia,
    }
  ];

  const nombreArchivo = `reporte_financiero_${reporte.fechaInicio}_${reporte.fechaFin}`;
  exportarCSV(datos, nombreArchivo);
}

export function exportarMetricasGenerales(metricas: MetricasGenerales) {
  const datos = [
    {
      // Ingresos
      ingresosDelDia: metricas.ingresosDelDia,
      ingresosSemana: metricas.ingresosSemana,
      ingresosMes: metricas.ingresosMes,
      ingresosAnio: metricas.ingresosAnio,
      
      // Servicios
      serviciosCompletadosHoy: metricas.serviciosCompletadosHoy,
      serviciosCompletadosSemana: metricas.serviciosCompletadosSemana,
      serviciosCompletadosMes: metricas.serviciosCompletadosMes,
      serviciosPromedioMes: metricas.serviciosPromedioMes.toFixed(2),
      
      // Clientes
      clientesActivosMes: metricas.clientesActivosMes,
      clientesNuevosMes: metricas.clientesNuevosMes,
      clientesFrecuentes: metricas.clientesFrecuentes,
      ticketPromedio: metricas.ticketPromedio.toFixed(2),
      
      // Modelos
      modelosActivas: metricas.modelosActivas,
      promedioServiciosPorModelo: metricas.promedioServiciosPorModelo.toFixed(2),
      
      // Multas y No-Shows
      totalMultasMes: metricas.totalMultasMes,
      totalNoShowsMes: metricas.totalNoShowsMes,
      tasaNoShow: `${metricas.tasaNoShow.toFixed(2)}%`,
      multasPendientes: metricas.multasPendientes,
      
      // Gastos
      gastosOperativosMes: metricas.gastosOperativosMes,
      utilidadNeta: metricas.utilidadNeta,
      margenUtilidad: `${metricas.margenUtilidad.toFixed(2)}%`,
    }
  ];

  const fechaActual = new Date().toISOString().split('T')[0];
  exportarCSV(datos, `metricas_generales_${fechaActual}`);
}

export function exportarTopModelos(modelos: ModeloMetrica[]) {
  const datos = modelos.map(m => ({
    nombre: m.modeloNombre,
    email: m.modeloEmail,
    totalServicios: m.totalServicios,
    serviciosCompletados: m.serviciosCompletados,
    serviciosCancelados: m.serviciosCancelados,
    ingresosTotales: m.ingresosTotales,
    ingresosPromedio: m.ingresosPromedioPorServicio.toFixed(2),
    tasaCompletacion: `${m.tasaCompletacion.toFixed(2)}%`,
    tasaCancelacion: `${m.tasaCancelacion.toFixed(2)}%`,
    calificacionPromedio: m.promedioCalificaciones.toFixed(2),
    totalResenas: m.totalResenas,
    periodoInicio: m.periodoInicio,
    periodoFin: m.periodoFin,
  }));

  const fechaActual = new Date().toISOString().split('T')[0];
  exportarCSV(datos, `top_modelos_${fechaActual}`);
}

export function exportarTopClientes(clientes: ClienteMetrica[]) {
  const datos = clientes.map(c => ({
    nombre: c.clienteNombre,
    telefono: c.clienteTelefono,
    categoria: c.categoriaCliente,
    totalServicios: c.totalServicios,
    totalGastado: c.totalGastado,
    gastoPromedio: c.gastoPromedioPorServicio.toFixed(2),
    primeraVisita: c.primeraVisita,
    ultimaVisita: c.ultimaVisita,
    diasDesdeUltima: c.diasDesdeUltimaVisita,
    frecuenciaVisitas: c.frecuenciaVisitas.toFixed(2),
    noShows: c.totalNoShows,
    multasPendientes: c.multasPendientes,
    bloqueado: c.bloqueado ? 'Sí' : 'No',
  }));

  const fechaActual = new Date().toISOString().split('T')[0];
  exportarCSV(datos, `top_clientes_${fechaActual}`);
}

// ==================== GENERACIÓN DE REPORTE HTML ====================

export function generarReporteHTML(
  metricas: MetricasGenerales,
  reporte: ReporteFinanciero,
  topModelos: ModeloMetrica[],
  topClientes: ClienteMetrica[]
): string {
  const fechaGeneracion = new Date().toLocaleString('es-CO');

  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reporte Black Diamond - ${reporte.fechaInicio} a ${reporte.fechaFin}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      background: linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%);
      color: #e8e6e3;
      padding: 40px 20px;
    }
    
    .container {
      max-width: 1200px;
      margin: 0 auto;
      background: #1a1a1a;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
    }
    
    .header {
      background: linear-gradient(135deg, #D4AF37 0%, #C0C0C0 100%);
      color: #0a0a0a;
      padding: 40px;
      text-align: center;
    }
    
    .header h1 {
      font-size: 36px;
      font-weight: 700;
      margin-bottom: 10px;
    }
    
    .header p {
      font-size: 16px;
      opacity: 0.8;
    }
    
    .section {
      padding: 30px 40px;
      border-bottom: 1px solid #333;
    }
    
    .section:last-child {
      border-bottom: none;
    }
    
    .section h2 {
      color: #D4AF37;
      font-size: 24px;
      margin-bottom: 20px;
      border-bottom: 2px solid #D4AF37;
      padding-bottom: 10px;
    }
    
    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 20px;
      margin-top: 20px;
    }
    
    .card {
      background: #2a2a2a;
      border-radius: 12px;
      padding: 20px;
      border: 1px solid #3a3a3a;
    }
    
    .card h3 {
      color: #C0C0C0;
      font-size: 14px;
      text-transform: uppercase;
      letter-spacing: 1px;
      margin-bottom: 10px;
    }
    
    .card .value {
      color: #D4AF37;
      font-size: 32px;
      font-weight: 700;
      margin-bottom: 5px;
    }
    
    .card .label {
      color: #888;
      font-size: 12px;
    }
    
    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 20px;
    }
    
    th {
      background: #2a2a2a;
      color: #D4AF37;
      text-align: left;
      padding: 12px;
      font-size: 14px;
      border-bottom: 2px solid #D4AF37;
    }
    
    td {
      padding: 12px;
      border-bottom: 1px solid #333;
      font-size: 14px;
    }
    
    tr:hover {
      background: #2a2a2a;
    }
    
    .footer {
      padding: 30px 40px;
      text-align: center;
      color: #666;
      font-size: 12px;
    }
    
    .badge {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 600;
    }
    
    .badge-success {
      background: rgba(34, 197, 94, 0.2);
      color: #22c55e;
      border: 1px solid #22c55e;
    }
    
    .badge-warning {
      background: rgba(251, 191, 36, 0.2);
      color: #fbbf24;
      border: 1px solid #fbbf24;
    }
    
    .badge-danger {
      background: rgba(239, 68, 68, 0.2);
      color: #ef4444;
      border: 1px solid #ef4444;
    }
    
    @media print {
      body {
        background: white;
        color: black;
      }
      
      .container {
        box-shadow: none;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <!-- Header -->
    <div class="header">
      <h1>💎 Black Diamond App</h1>
      <p>Reporte de Analytics | ${reporte.fechaInicio} - ${reporte.fechaFin}</p>
      <p style="margin-top: 10px; font-size: 14px;">Generado: ${fechaGeneracion}</p>
    </div>

    <!-- Resumen Financiero -->
    <div class="section">
      <h2>📊 Resumen Financiero</h2>
      <div class="grid">
        <div class="card">
          <h3>Ingresos Totales</h3>
          <div class="value">$${(reporte.ingresosTotal / 1000000).toFixed(2)}M</div>
          <div class="label">Ingresos del período</div>
        </div>
        <div class="card">
          <h3>Gastos Totales</h3>
          <div class="value">$${(reporte.gastosTotal / 1000000).toFixed(2)}M</div>
          <div class="label">Gastos del período</div>
        </div>
        <div class="card">
          <h3>Utilidad Bruta</h3>
          <div class="value">$${(reporte.utilidadBruta / 1000000).toFixed(2)}M</div>
          <div class="label">Ingresos - Gastos</div>
        </div>
        <div class="card">
          <h3>Margen de Utilidad</h3>
          <div class="value">${reporte.margenBruto.toFixed(1)}%</div>
          <div class="label">Porcentaje de utilidad</div>
        </div>
      </div>
    </div>

    <!-- Métricas Generales -->
    <div class="section">
      <h2>📈 Métricas Generales</h2>
      <div class="grid">
        <div class="card">
          <h3>Servicios Mes</h3>
          <div class="value">${metricas.serviciosCompletadosMes}</div>
          <div class="label">Servicios completados</div>
        </div>
        <div class="card">
          <h3>Clientes Activos</h3>
          <div class="value">${metricas.clientesActivosMes}</div>
          <div class="label">Este mes</div>
        </div>
        <div class="card">
          <h3>Ticket Promedio</h3>
          <div class="value">$${(metricas.ticketPromedio / 1000).toFixed(0)}k</div>
          <div class="label">Por servicio</div>
        </div>
        <div class="card">
          <h3>Tasa No-Show</h3>
          <div class="value">${metricas.tasaNoShow.toFixed(1)}%</div>
          <div class="label">${metricas.totalNoShowsMes} no-shows</div>
        </div>
      </div>
    </div>

    <!-- Top Modelos -->
    <div class="section">
      <h2>👑 Top 10 Modelos por Ingresos</h2>
      <table>
        <thead>
          <tr>
            <th>#</th>
            <th>Nombre</th>
            <th>Servicios</th>
            <th>Ingresos Totales</th>
            <th>Promedio/Servicio</th>
            <th>Tasa Completación</th>
            <th>Calificación</th>
          </tr>
        </thead>
        <tbody>
          ${topModelos.slice(0, 10).map((modelo, idx) => `
            <tr>
              <td><strong>${idx + 1}</strong></td>
              <td>${modelo.modeloNombre}</td>
              <td>${modelo.serviciosCompletados}</td>
              <td style="color: #D4AF37;">$${(modelo.ingresosTotales / 1000000).toFixed(2)}M</td>
              <td>$${(modelo.ingresosPromedioPorServicio / 1000).toFixed(0)}k</td>
              <td><span class="badge badge-success">${modelo.tasaCompletacion.toFixed(1)}%</span></td>
              <td>⭐ ${modelo.promedioCalificaciones.toFixed(1)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>

    <!-- Top Clientes -->
    <div class="section">
      <h2>💰 Top 10 Clientes por Gasto</h2>
      <table>
        <thead>
          <tr>
            <th>#</th>
            <th>Nombre</th>
            <th>Categoría</th>
            <th>Servicios</th>
            <th>Total Gastado</th>
            <th>Gasto Promedio</th>
            <th>Última Visita</th>
          </tr>
        </thead>
        <tbody>
          ${topClientes.slice(0, 10).map((cliente, idx) => `
            <tr>
              <td><strong>${idx + 1}</strong></td>
              <td>${cliente.clienteNombre}</td>
              <td>
                <span class="badge ${
                  cliente.categoriaCliente === 'vip' ? 'badge-success' :
                  cliente.categoriaCliente === 'frecuente' ? 'badge-warning' :
                  'badge-danger'
                }">
                  ${cliente.categoriaCliente.toUpperCase()}
                </span>
              </td>
              <td>${cliente.totalServicios}</td>
              <td style="color: #D4AF37;">$${(cliente.totalGastado / 1000000).toFixed(2)}M</td>
              <td>$${(cliente.gastoPromedioPorServicio / 1000).toFixed(0)}k</td>
              <td>${cliente.ultimaVisita}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>

    <!-- Footer -->
    <div class="footer">
      <p>© ${new Date().getFullYear()} Black Diamond App - Sistema de Gestión Premium</p>
      <p style="margin-top: 5px;">Reporte generado automáticamente - Confidencial</p>
    </div>
  </div>
</body>
</html>
  `;
}

export function exportarReporteHTML(
  metricas: MetricasGenerales,
  reporte: ReporteFinanciero,
  topModelos: ModeloMetrica[],
  topClientes: ClienteMetrica[]
) {
  try {
    const html = generarReporteHTML(metricas, reporte, topModelos, topClientes);
    const blob = new Blob([html], { type: 'text/html' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    const nombreArchivo = `reporte_analytics_${reporte.fechaInicio}_${reporte.fechaFin}.html`;
    link.setAttribute('href', url);
    link.setAttribute('download', nombreArchivo);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    console.log(`✅ Reporte HTML exportado: ${nombreArchivo}`);
  } catch (error) {
    console.error('❌ Error exportando reporte HTML:', error);
  }
}

// ==================== IMPRIMIR REPORTE ====================

export function imprimirReporte(
  metricas: MetricasGenerales,
  reporte: ReporteFinanciero,
  topModelos: ModeloMetrica[],
  topClientes: ClienteMetrica[]
) {
  try {
    const html = generarReporteHTML(metricas, reporte, topModelos, topClientes);
    const ventanaImpresion = window.open('', '_blank');
    
    if (ventanaImpresion) {
      ventanaImpresion.document.write(html);
      ventanaImpresion.document.close();
      
      // Esperar a que cargue antes de imprimir
      ventanaImpresion.onload = () => {
        ventanaImpresion.print();
      };
      
      console.log('✅ Ventana de impresión abierta');
    } else {
      console.error('❌ No se pudo abrir la ventana de impresión');
    }
  } catch (error) {
    console.error('❌ Error imprimiendo reporte:', error);
  }
}
