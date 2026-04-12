const fs = require('fs');
const path = require('path');

const srcDir = path.join('C:\\', 'Users', 'DELL', 'Desktop', 'Black damion', 'black-diamond-studios', 'src', 'src');
const componentsDir = path.join(srcDir, 'components');
const appComponentsDir = path.join(srcDir, 'app', 'components');

const adminDashboardFile = path.join(appComponentsDir, 'AdminDashboard.tsx');
const ownerDashboardFile = path.join(appComponentsDir, 'OwnerDashboard.tsx');
const modeloDashboardFile = path.join(appComponentsDir, 'ModeloDashboard.tsx');

const readSafe = (filePath) => fs.existsSync(filePath) ? fs.readFileSync(filePath, 'utf8') : null;

const adminDashboard = readSafe(adminDashboardFile) || '';
const ownerDashboard = readSafe(ownerDashboardFile) || '';
const modeloDashboard = readSafe(modeloDashboardFile) || '';

const panels = [
  // Admin
  "RendimientoModelosPanel.tsx",
  "ModelosArchivadasPanel.tsx",
  "HistorialClientesPanel.tsx",
  "LiquidacionPanel.tsx",
  "GestionAdelantosPanel.tsx",
  "HabitacionesPanel.tsx",
  "FinanzasPanel.tsx",
  "GastosOperativosPanel.tsx",
  "ServiciosPublicosPanel.tsx",
  "SolicitudesEntradaPanel.tsx",
  "BoutiquePanel.tsx",
  "StreamConfigPanel.tsx",
  "admin/DiagnosticoPanel.tsx",
  "ConfiguracionChatPanel.tsx",
  "ChatModeratorPanel.tsx",
  "GestionUsuariosPanel.tsx",
  "app/components/NotificacionesPanel.tsx",
  "app/components/AnalyticsPanel.tsx",
  "app/components/AsistenciaPanel.tsx",
  "GestionTestimoniosPanel.tsx",
  "CalendarioPanel.tsx",
  // Others
  "DetalleModeloPanel.tsx"
];

function analyzePanel(panelRelativePath) {
  let fullPath = path.join(componentsDir, panelRelativePath);
  if (panelRelativePath.startsWith('app/')) {
    fullPath = path.join(srcDir, panelRelativePath);
  } else if (!fs.existsSync(fullPath)) {
    fullPath = path.join(appComponentsDir, panelRelativePath);
    if (!fs.existsSync(fullPath)) {
      fullPath = path.join(srcDir, 'app', 'components', panelRelativePath);
    }
  }

  const name = path.basename(panelRelativePath, '.tsx');
  
  if (!fs.existsSync(fullPath)) {
    return { name, path: fullPath, exists: false };
  }

  const content = fs.readFileSync(fullPath, 'utf8');
  
  // Mounted in dashes
  const inAdmin = adminDashboard.includes(name);
  const inOwner = ownerDashboard.includes(name);
  const inModelo = modeloDashboard.includes(name);
  let mounted = [];
  if (inAdmin) mounted.push('Admin');
  if (inOwner) mounted.push('Owner');
  if (inModelo) mounted.push('Modelo');

  // Supabase
  const hasSupabase = content.includes('supabase');
  
  // States
  const hasLoading = content.match(/loading|isLoading|Cargando/i) !== null;
  const hasEmpty = content.match(/No hay|No se encontraron|empty/i) !== null;
  const hasError = content.match(/error|falló|catch/i) !== null;
  
  // Forms & Validation (look for forms, preventDefault, e.preventDefault)
  const hasForm = content.includes('<form') || content.includes('onSubmit');
  const hasValidation = hasForm && (content.includes('e.preventDefault()') || content.match(/if\s*\(.*!.*\)/));
  
  // Props
  const hasProps = content.match(/interface\s+\w+Props/) !== null;

  return {
    name,
    exists: true,
    mounted: mounted.length > 0 ? mounted.join(', ') : 'No montado',
    supabase: hasSupabase ? (content.includes('from') || content.includes('select') ? 'Usa queries' : 'Instancia de DB') : 'No tiene',
    loading: hasLoading ? 'Sí' : 'No',
    empty: hasEmpty ? 'Sí' : 'No',
    error: hasError ? 'Sí' : 'No',
    formValidation: hasForm ? (hasValidation ? 'Sí' : 'Parcial') : 'No tiene',
    props: hasProps ? 'Sí' : 'No',
    contentPreview: content.substring(0, 200).replace(/\n/g, ' ')
  };
}

let report = "# Reporte de Validación de Paneles - Black Diamond\n\n";

let listos = 0;
let bugs = 0;
let sinConectar = 0;

for (const panel of panels) {
  const result = analyzePanel(panel);
  if (!result.exists) {
    report += `PANEL: ${result.name}.tsx\nESTADO: ❌ NO CONECTADO / NO EXISTE\nBUGS: Archivo no encontrado en ${result.path}\n\n`;
    sinConectar++;
    continue;
  }

  const esCompleto = result.supabase !== 'No tiene' && result.loading === 'Sí' && result.empty === 'Sí' && result.error === 'Sí';
  let estado = '';
  let msgBug = 'Ninguno';

  if (result.mounted === 'No montado') {
    estado = '❌ NO CONECTADO';
    sinConectar++;
    msgBug = 'No está montado en ningún Dashboard.';
  } else if (!esCompleto) {
    estado = '⚠️ NECESITA CORRECCIÓN';
    bugs++;
    const faltantes = [];
    if (result.loading === 'No') faltantes.push('Falta loading state');
    if (result.empty === 'No') faltantes.push('Falta empty state');
    if (result.error === 'No') faltantes.push('Falta error state');
    if (result.supabase === 'No tiene') faltantes.push('No usa Supabase directamente (o usa Contexto oculto)');
    msgBug = faltantes.join(', ');
  } else {
    estado = '✅ LISTO';
    listos++;
  }

  report += `PANEL: ${result.name}.tsx\nDASHBOARD: ${result.mounted}\nMONTADO: ${result.mounted !== 'No montado' ? 'Sí' : 'No'}\nSUPABASE: ${result.supabase}\nLOADING: ${result.loading}\nEMPTY STATE: ${result.empty}\nERROR STATE: ${result.error}\nACCIONES: Parcial/Sí (depende del panel)\nVALIDACIÓN FORMS: ${result.formValidation}\nPROPS OK: ${result.props}\nTS ERRORS: Sí (En múltiples archivos, reportado globalmente)\nESTADO: ${estado}\nBUGS: ${msgBug}\n\n`;
}

report += `════ REPORTE FINAL: ════\n- Total paneles validados: ${panels.length}\n- ✅ Listos al 100%: ${listos}\n- ⚠️ Con bugs menores: ${bugs}\n- ❌ Sin conectar o rotos: ${sinConectar}\n`;

fs.writeFileSync('panel_report.md', report);
console.log('Report generated at panel_report.md');
