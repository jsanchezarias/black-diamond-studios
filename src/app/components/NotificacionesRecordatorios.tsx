import { notificarAgendamientoProximo } from './NotificacionesHelpers';

/**
 * 🔔 SISTEMA DE RECORDATORIOS AUTOMÁTICOS
 * 
 * Este módulo gestiona el envío automático de notificaciones de recordatorio
 * para agendamientos próximos (24 horas antes).
 */

export interface AgendamientoParaRecordatorio {
  id: string;
  modeloEmail: string;
  modeloNombre: string;
  clienteNombre: string;
  fecha: string; // formato ISO
  hora: string;
  tipoServicio: string;
  estado: string;
}

/**
 * Verifica si un agendamiento está próximo (dentro de las próximas 24-48 horas)
 * y envía una notificación de recordatorio si corresponde
 */
export function verificarYEnviarRecordatorio(agendamiento: AgendamientoParaRecordatorio): boolean {
  try {
    // Parsear la fecha del agendamiento
    const fechaAgendamiento = new Date(agendamiento.fecha);
    const ahora = new Date();
    
    // Calcular diferencia en horas
    const diferenciaMs = fechaAgendamiento.getTime() - ahora.getTime();
    const diferenciaHoras = diferenciaMs / (1000 * 60 * 60);
    
    // Solo enviar recordatorio si está entre 20 y 28 horas antes
    // (esto da una ventana de 8 horas para evitar duplicados)
    if (diferenciaHoras >= 20 && diferenciaHoras <= 28) {
      // Verificar que el agendamiento esté confirmado
      if (agendamiento.estado !== 'confirmado' && agendamiento.estado !== 'pendiente') {
        return false;
      }
      
      notificarAgendamientoProximo({
        modeloEmail: agendamiento.modeloEmail,
        clienteNombre: agendamiento.clienteNombre,
        fecha: new Date(agendamiento.fecha).toLocaleDateString('es-CO', {
          weekday: 'long',
          day: 'numeric',
          month: 'long'
        }),
        hora: agendamiento.hora,
        tipoServicio: agendamiento.tipoServicio
      }).catch(err => { if (process.env.NODE_ENV === 'development') console.error('Error enviando recordatorio:', err); });
      
      return true;
    }
    
    return false;
  } catch (error) {
    if (process.env.NODE_ENV === 'development') console.error('Error verificando recordatorio:', error);
    return false;
  }
}

/**
 * Procesa una lista de agendamientos y envía recordatorios para los que corresponda
 */
export function procesarRecordatoriosAgendamientos(agendamientos: AgendamientoParaRecordatorio[]): number {
  let recordatoriosEnviados = 0;
  
  agendamientos.forEach(agendamiento => {
    const enviado = verificarYEnviarRecordatorio(agendamiento);
    if (enviado) {
      recordatoriosEnviados++;
    }
  });
  
  return recordatoriosEnviados;
}

/**
 * Hook para configurar verificación periódica de recordatorios
 * Llama esta función desde el AgendamientosContext con useEffect
 * 
 * @param agendamientos - Lista de agendamientos a verificar
 * @param intervaloMinutos - Intervalo de verificación en minutos (por defecto 60)
 */
export function configurarVerificacionPeriodica(
  agendamientos: AgendamientoParaRecordatorio[],
  intervaloMinutos: number = 60
): () => void {
  // Ejecutar verificación inmediatamente
  procesarRecordatoriosAgendamientos(agendamientos);
  
  // Configurar intervalo
  const intervalId = setInterval(() => {
    procesarRecordatoriosAgendamientos(agendamientos);
  }, intervaloMinutos * 60 * 1000);
  
  // Retornar función de limpieza
  return () => {
    clearInterval(intervalId);
  };
}
