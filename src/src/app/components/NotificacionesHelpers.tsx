import { projectId, publicAnonKey } from '../../utils/supabase/info';
import { TipoNotificacion } from './NotificacionesContext';

// 🔔 HELPER PARA CREAR NOTIFICACIONES AUTOMÁTICAS

interface CrearNotificacionParams {
  usuarioEmail: string;
  tipo: TipoNotificacion;
  titulo: string;
  mensaje: string;
  icono?: string;
  prioridad?: 'baja' | 'media' | 'alta' | 'urgente';
  accion?: {
    tipo: 'navegar' | 'modal' | 'ninguna';
    destino?: string;
    datos?: Record<string, any>;
  };
  urlDestino?: string;
  creadoPor?: string;
}

/**
 * Crea una notificación automáticamente desde cualquier contexto
 * No requiere el contexto de notificaciones
 */
export async function crearNotificacionAutomatica(params: CrearNotificacionParams): Promise<boolean> {
  try {
    const {
      usuarioEmail,
      tipo,
      titulo,
      mensaje,
      icono,
      prioridad = 'media',
      accion,
      urlDestino,
      creadoPor = 'sistema'
    } = params;

    console.log('🔔 Creando notificación automática:', tipo, 'para', usuarioEmail);

    const API_URL = `https://${projectId}.supabase.co/functions/v1/make-server-9dadc017`;

    const notificacion = {
      usuarioId: usuarioEmail,
      usuarioEmail,
      tipo,
      titulo,
      mensaje,
      icono,
      leida: false,
      prioridad,
      accion,
      urlDestino,
      creadoPor
    };

    const response = await fetch(`${API_URL}/notificaciones`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${publicAnonKey}`
      },
      body: JSON.stringify(notificacion)
    });

    if (!response.ok) {
      console.error('❌ Error creando notificación automática:', await response.text());
      return false;
    }

    console.log('✅ Notificación automática creada');
    return true;
  } catch (error) {
    console.error('❌ Error en crearNotificacionAutomatica:', error);
    return false;
  }
}

// 🎯 HELPERS ESPECÍFICOS PARA CADA TIPO DE EVENTO

/**
 * Notificar cuando se crea un nuevo agendamiento
 */
export async function notificarNuevoAgendamiento(params: {
  modeloEmail: string;
  modeloNombre: string;
  clienteNombre: string;
  fecha: string;
  hora: string;
  duracion: number;
  tipoServicio: string;
  agendamientoId: string;
}) {
  const duracionTexto = params.duracion >= 60 
    ? `${params.duracion / 60}h` 
    : `${params.duracion}min`;

  await crearNotificacionAutomatica({
    usuarioEmail: params.modeloEmail,
    tipo: 'agendamiento_nuevo',
    titulo: '📅 Nuevo Agendamiento',
    mensaje: `${params.clienteNombre} - ${params.fecha} a las ${params.hora} (${duracionTexto}, ${params.tipoServicio})`,
    icono: '📅',
    prioridad: 'alta',
    accion: {
      tipo: 'navegar',
      destino: '/agendamientos',
      datos: { agendamientoId: params.agendamientoId }
    }
  });
}

/**
 * Notificar cuando se confirma un agendamiento
 */
export async function notificarAgendamientoConfirmado(params: {
  modeloEmail: string;
  clienteNombre: string;
  fecha: string;
  hora: string;
}) {
  await crearNotificacionAutomatica({
    usuarioEmail: params.modeloEmail,
    tipo: 'agendamiento_confirmado',
    titulo: '✅ Agendamiento Confirmado',
    mensaje: `Tu cita con ${params.clienteNombre} el ${params.fecha} a las ${params.hora} ha sido confirmada`,
    icono: '✅',
    prioridad: 'media'
  });
}

/**
 * Notificar cuando se cancela un agendamiento
 */
export async function notificarAgendamientoCancelado(params: {
  modeloEmail: string;
  clienteNombre: string;
  fecha: string;
  hora: string;
  motivo?: string;
}) {
  await crearNotificacionAutomatica({
    usuarioEmail: params.modeloEmail,
    tipo: 'agendamiento_cancelado',
    titulo: '❌ Agendamiento Cancelado',
    mensaje: `La cita con ${params.clienteNombre} el ${params.fecha} a las ${params.hora} fue cancelada${params.motivo ? `: ${params.motivo}` : ''}`,
    icono: '❌',
    prioridad: 'alta'
  });
}

/**
 * Notificar recordatorio de cita próxima (24h antes)
 */
export async function notificarAgendamientoProximo(params: {
  modeloEmail: string;
  clienteNombre: string;
  fecha: string;
  hora: string;
  tipoServicio: string;
}) {
  await crearNotificacionAutomatica({
    usuarioEmail: params.modeloEmail,
    tipo: 'agendamiento_proximo',
    titulo: '⏰ Recordatorio: Cita Mañana',
    mensaje: `Mañana tienes cita con ${params.clienteNombre} a las ${params.hora} (${params.tipoServicio})`,
    icono: '⏰',
    prioridad: 'alta'
  });
}

/**
 * Notificar cuando se completa un servicio
 */
export async function notificarServicioCompletado(params: {
  modeloEmail: string;
  clienteNombre: string;
  monto: number;
  duracion: number;
}) {
  await crearNotificacionAutomatica({
    usuarioEmail: params.modeloEmail,
    tipo: 'servicio_completado',
    titulo: '🎉 Servicio Completado',
    mensaje: `Servicio con ${params.clienteNombre} completado exitosamente. Monto: $${params.monto.toLocaleString()}`,
    icono: '🎉',
    prioridad: 'media'
  });
}

/**
 * Notificar cuando un cliente califica un servicio
 */
export async function notificarServicioCalificado(params: {
  modeloEmail: string;
  clienteNombre: string;
  calificacion: number;
  comentario?: string;
}) {
  const estrellas = '⭐'.repeat(params.calificacion);
  
  await crearNotificacionAutomatica({
    usuarioEmail: params.modeloEmail,
    tipo: 'servicio_calificado',
    titulo: '⭐ Nueva Calificación',
    mensaje: `${params.clienteNombre} te calificó: ${estrellas}${params.comentario ? ` - "${params.comentario}"` : ''}`,
    icono: '⭐',
    prioridad: 'baja'
  });
}

/**
 * Notificar cuando se recibe un pago
 */
export async function notificarPagoRecibido(params: {
  modeloEmail: string;
  monto: number;
  concepto: string;
  metodoPago?: string;
}) {
  await crearNotificacionAutomatica({
    usuarioEmail: params.modeloEmail,
    tipo: 'pago_recibido',
    titulo: '💰 Pago Recibido',
    mensaje: `Has recibido $${params.monto.toLocaleString()} por ${params.concepto}${params.metodoPago ? ` (${params.metodoPago})` : ''}`,
    icono: '💰',
    prioridad: 'alta'
  });
}

/**
 * Notificar pago pendiente
 */
export async function notificarPagoPendiente(params: {
  modeloEmail: string;
  monto: number;
  concepto: string;
  fechaVencimiento?: string;
}) {
  await crearNotificacionAutomatica({
    usuarioEmail: params.modeloEmail,
    tipo: 'pago_pendiente',
    titulo: '⏳ Pago Pendiente',
    mensaje: `Tienes un pago pendiente de $${params.monto.toLocaleString()} por ${params.concepto}${params.fechaVencimiento ? ` - Vence: ${params.fechaVencimiento}` : ''}`,
    icono: '⏳',
    prioridad: 'alta'
  });
}

/**
 * Notificar cuando se aplica una multa
 */
export async function notificarMultaAplicada(params: {
  clienteEmail: string;
  clienteNombre: string;
  monto: number;
  motivo: string;
}) {
  // Notificar al cliente
  await crearNotificacionAutomatica({
    usuarioEmail: params.clienteEmail,
    tipo: 'multa_aplicada',
    titulo: '💸 Multa Aplicada',
    mensaje: `Se ha aplicado una multa de $${params.monto.toLocaleString()} por ${params.motivo}`,
    icono: '💸',
    prioridad: 'urgente'
  });
}

/**
 * Notificar cuando se paga una multa
 */
export async function notificarMultaPagada(params: {
  clienteEmail: string;
  monto: number;
}) {
  await crearNotificacionAutomatica({
    usuarioEmail: params.clienteEmail,
    tipo: 'multa_pagada',
    titulo: '✅ Multa Pagada',
    mensaje: `Tu multa de $${params.monto.toLocaleString()} ha sido pagada exitosamente`,
    icono: '✅',
    prioridad: 'media'
  });
}

/**
 * Notificar cuando un cliente es bloqueado
 */
export async function notificarClienteBloqueado(params: {
  clienteEmail: string;
  motivo: string;
}) {
  await crearNotificacionAutomatica({
    usuarioEmail: params.clienteEmail,
    tipo: 'cliente_bloqueado',
    titulo: '🚫 Cuenta Bloqueada',
    mensaje: `Tu cuenta ha sido bloqueada: ${params.motivo}. Contacta al administrador para más información.`,
    icono: '🚫',
    prioridad: 'urgente'
  });
}

/**
 * Notificar a admins cuando una modelo se marca como disponible
 */
export async function notificarModeloDisponible(params: {
  adminEmails: string[];
  modeloNombre: string;
  modeloEmail: string;
}) {
  for (const adminEmail of params.adminEmails) {
    await crearNotificacionAutomatica({
      usuarioEmail: adminEmail,
      tipo: 'modelo_disponible',
      titulo: '💃 Modelo Disponible',
      mensaje: `${params.modeloNombre} se ha marcado como disponible`,
      icono: '💃',
      prioridad: 'baja'
    });
  }
}

/**
 * Notificar cuando se aprueba un adelanto
 */
export async function notificarAdelantoAprobado(params: {
  modeloEmail: string;
  monto: number;
  fechaPago: string;
}) {
  await crearNotificacionAutomatica({
    usuarioEmail: params.modeloEmail,
    tipo: 'adelanto_aprobado',
    titulo: '✅ Adelanto Aprobado',
    mensaje: `Tu solicitud de adelanto de $${params.monto.toLocaleString()} ha sido aprobada. Recibirás el pago el ${params.fechaPago}`,
    icono: '✅',
    prioridad: 'alta'
  });
}

/**
 * Notificar cuando se rechaza un adelanto
 */
export async function notificarAdelantoRechazado(params: {
  modeloEmail: string;
  monto: number;
  motivo?: string;
}) {
  await crearNotificacionAutomatica({
    usuarioEmail: params.modeloEmail,
    tipo: 'adelanto_rechazado',
    titulo: '❌ Adelanto Rechazado',
    mensaje: `Tu solicitud de adelanto de $${params.monto.toLocaleString()} ha sido rechazada${params.motivo ? `: ${params.motivo}` : ''}`,
    icono: '❌',
    prioridad: 'alta'
  });
}

/**
 * Notificar mensaje del sistema
 */
export async function notificarSistema(params: {
  usuarioEmail: string;
  titulo: string;
  mensaje: string;
  prioridad?: 'baja' | 'media' | 'alta' | 'urgente';
}) {
  await crearNotificacionAutomatica({
    usuarioEmail: params.usuarioEmail,
    tipo: 'sistema',
    titulo: params.titulo,
    mensaje: params.mensaje,
    icono: '⚙️',
    prioridad: params.prioridad || 'media'
  });
}

/**
 * Notificar mensaje de marketing
 */
export async function notificarMarketing(params: {
  usuarioEmail: string;
  titulo: string;
  mensaje: string;
  urlDestino?: string;
}) {
  await crearNotificacionAutomatica({
    usuarioEmail: params.usuarioEmail,
    tipo: 'marketing',
    titulo: params.titulo,
    mensaje: params.mensaje,
    icono: '📢',
    prioridad: 'baja',
    urlDestino: params.urlDestino
  });
}
