import { Servicio } from '../app/components/ServiciosContext';
import { Jornada } from '../app/components/AsistenciaContext';

// Configuración de frecuencia para confirmación de actividad
export const FRECUENCIA_CONFIRMACION_MINUTOS = 90; // Cada 90 minutos (1.5 horas)
export const FRECUENCIA_CONFIRMACION_MS = FRECUENCIA_CONFIRMACION_MINUTOS * 60 * 1000;

export const VENTANA_RESPUESTA_MINUTOS = 15; // 15 minutos para responder
export const VENTANA_RESPUESTA_MS = VENTANA_RESPUESTA_MINUTOS * 60 * 1000;

export interface CalculoComisionServicio {
  porcentajeModelo: number; // 50% o 60%
  porcentajeCasa: number;   // 50% o 40%
  montoModelo: number;
  montoCasa: number;
  esHoraExtra: boolean;     // True si fue después de las 8 horas de turno
  horasDesdeInicioTurno: number | null;
  jornadaId?: string;
}

/**
 * Determina la comisión de un servicio según si se realizó
 * dentro de las primeras 8 horas de turno (50% / 50%) o pasado las 8 horas (60% modelo / 40% casa).
 */
export function determinarComisionServicio(
  servicio: Servicio,
  jornadas: Jornada[] = []
): CalculoComisionServicio {
  const monto = servicio.montoPagado ?? servicio.montoPactado ?? 0;

  // Obtener timestamp del servicio
  let timestampServicio: number = Date.now();
  if (servicio.horaInicio) {
    timestampServicio = new Date(servicio.horaInicio).getTime();
  } else if (servicio.fechaCreacion) {
    timestampServicio = new Date(servicio.fechaCreacion).getTime();
  } else if (servicio.fecha && servicio.hora) {
    const d = new Date(`${servicio.fecha}T${servicio.hora}`);
    if (!isNaN(d.getTime())) timestampServicio = d.getTime();
  }

  // Buscar jornada correspondiente a la modelo en la fecha o momento del servicio
  const modeloEmail = (servicio.modeloEmail || '').toLowerCase().trim();
  const fechaServicioStr = servicio.fecha || (servicio.fechaCreacion ? servicio.fechaCreacion.split('T')[0] : '');

  const jornadaCoincidente = jornadas.find(j => {
    if ((j.modeloEmail || '').toLowerCase().trim() !== modeloEmail) return false;
    
    // Coincidencia por fecha de inicio de jornada
    if (j.fecha && fechaServicioStr && j.fecha === fechaServicioStr) {
      return true;
    }

    // Coincidencia por ventana de tiempo (si el servicio ocurrió entre horaInicio y horaFin o +16h)
    const inicioMs = new Date(j.horaInicio).getTime();
    const finMs = j.horaFin ? new Date(j.horaFin).getTime() : inicioMs + 18 * 3600000;
    return timestampServicio >= inicioMs - 3600000 && timestampServicio <= finMs;
  });

  let esHoraExtra = false;
  let horasDesdeInicioTurno: number | null = null;

  if (jornadaCoincidente) {
    const inicioMs = new Date(jornadaCoincidente.horaInicio).getTime();
    const diffMs = Math.max(0, timestampServicio - inicioMs);
    horasDesdeInicioTurno = Math.round((diffMs / (1000 * 60 * 60)) * 100) / 100;
    
    // Si pasaron más de 8 horas desde que inició el turno
    if (horasDesdeInicioTurno > 8) {
      esHoraExtra = true;
    }
  }

  const porcentajeModelo = esHoraExtra ? 60 : 50;
  const porcentajeCasa = esHoraExtra ? 40 : 50;

  const montoModelo = Math.round(monto * (porcentajeModelo / 100));
  const montoCasa = Math.round(monto * (porcentajeCasa / 100));

  return {
    porcentajeModelo,
    porcentajeCasa,
    montoModelo,
    montoCasa,
    esHoraExtra,
    horasDesdeInicioTurno,
    jornadaId: jornadaCoincidente?.id
  };
}

export interface ResumenLiquidacionServicios {
  totalServicios: number;
  valorTotal: number;
  totalModelo: number;
  totalCasa: number;
  serviciosNormales: {
    cantidad: number;
    valorTotal: number;
    porcentaje: number;
    liquidacion: number;
    porcentajeCasa: number;
    liquidacionCasa: number;
  };
  serviciosHorasExtra: {
    cantidad: number;
    valorTotal: number;
    porcentaje: number;
    liquidacion: number;
    porcentajeCasa: number;
    liquidacionCasa: number;
  };
}

/**
 * Calcula la liquidación agrupada de una lista de servicios
 * dividiendo entre los hechos dentro de 8h (50/50) y pasadas 8h (60/40).
 */
export function liquidarServiciosConHorasExtra(
  servicios: Servicio[],
  jornadas: Jornada[] = []
): ResumenLiquidacionServicios {
  let valNormal = 0;
  let cantNormal = 0;
  let liqNormalModelo = 0;
  let liqNormalCasa = 0;

  let valExtra = 0;
  let cantExtra = 0;
  let liqExtraModelo = 0;
  let liqExtraCasa = 0;

  for (const s of servicios) {
    const monto = s.montoPagado ?? s.montoPactado ?? 0;
    const calc = determinarComisionServicio(s, jornadas);

    if (calc.esHoraExtra) {
      cantExtra += 1;
      valExtra += monto;
      liqExtraModelo += calc.montoModelo;
      liqExtraCasa += calc.montoCasa;
    } else {
      cantNormal += 1;
      valNormal += monto;
      liqNormalModelo += calc.montoModelo;
      liqNormalCasa += calc.montoCasa;
    }
  }

  return {
    totalServicios: servicios.length,
    valorTotal: valNormal + valExtra,
    totalModelo: liqNormalModelo + liqExtraModelo,
    totalCasa: liqNormalCasa + liqExtraCasa,
    serviciosNormales: {
      cantidad: cantNormal,
      valorTotal: valNormal,
      porcentaje: 50,
      liquidacion: liqNormalModelo,
      porcentajeCasa: 50,
      liquidacionCasa: liqNormalCasa,
    },
    serviciosHorasExtra: {
      cantidad: cantExtra,
      valorTotal: valExtra,
      porcentaje: 60,
      liquidacion: liqExtraModelo,
      porcentajeCasa: 40,
      liquidacionCasa: liqExtraCasa,
    }
  };
}
