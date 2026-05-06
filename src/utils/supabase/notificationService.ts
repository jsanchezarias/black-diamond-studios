/**
 * notificationService.ts
 * Servicio de notificaciones para Black Diamond Studios
 * 
 * Lógica:
 * - Programador con tarea activa → NO recibe nuevas notificaciones
 * - Notificaciones expiradas o de tareas ya tomadas → se eliminan automáticamente
 * - Al aceptar → se limpian todas las pendientes propias + del mismo agendamiento para otros
 * - Al cancelar → se eliminan las notifs del agendamiento cancelado
 */

import { supabase } from '../../supabase/functions/supabase';

// ─── Tipos ────────────────────────────────────────────────────────────────────

export type TipoNotificacion =
  | 'agendamiento_nuevo'
  | 'agendamiento_pendiente'
  | 'solicitud_cliente'
  | 'servicio_asignado'
  | 'agendamiento_confirmado'
  | 'agendamiento_cancelado'
  | 'servicio_completado';

export interface NotificacionProgramador {
  id: string;
  programador_id: string | null;
  programador_nombre: string | null;
  titulo: string;
  mensaje: string;
  tipo: TipoNotificacion;
  agendamiento_id: string | null;
  created_at: string;
  expires_at: string | null;
  estado: 'activa' | 'expirada' | 'cancelada' | 'aceptada';
  datos: Record<string, unknown> | null;
  minutos_restantes: number | null;
}

export interface NotificacionRaw {
  id: string;
  usuario_id: string | null;
  para_usuario_id: string | null;
  para_rol: string | null;
  titulo: string;
  mensaje: string;
  tipo: string;
  referencia_id: string | null;
  leida: boolean;
  created_at: string;
  expires_at: string | null;
  estado: string | null;
  datos: Record<string, unknown> | null;
  agendamiento_id: string | null;
}

// ─── Tipos de solicitudes accionables para programador ───────────────────────
const TIPOS_ACCIONABLES: TipoNotificacion[] = [
  'agendamiento_nuevo',
  'agendamiento_pendiente',
  'solicitud_cliente',
  'servicio_asignado',
];

// ─── Funciones principales ───────────────────────────────────────────────────

/**
 * Obtener notificaciones accionables del programador actual.
 * Usa la vista v_notificaciones_programador que ya filtra las expiradas/inválidas.
 */
export async function getNotificacionesProgramador(
  programadorId: string
): Promise<NotificacionProgramador[]> {
  const { data, error } = await supabase
    .from('v_notificaciones_programador')
    .select('*')
    .eq('programador_id', programadorId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[Notificaciones] Error al obtener:', error.message);
    return [];
  }

  return (data as NotificacionProgramador[]) || [];
}

/**
 * Limpiar notificaciones del programador invocando la función SQL.
 * Retorna el número de notificaciones eliminadas.
 */
export async function limpiarNotificacionesProgramador(
  programadorId: string
): Promise<number> {
  const { data, error } = await supabase.rpc(
    'limpiar_notificaciones_programador',
    { p_programador_id: programadorId }
  );

  if (error) {
    console.error('[Notificaciones] Error limpiando:', error.message);
    return 0;
  }

  return (data as number) || 0;
}

/**
 * Ejecutar al aceptar un agendamiento.
 * 1. Cambia el estado del agendamiento → dispara trigger SQL automáticamente
 * 2. Limpia notificaciones del mismo agendamiento para otros programadores
 */
export async function aceptarAgendamiento(
  agendamientoId: string,
  programadorId: string,
  programadorEmail: string
): Promise<{ success: boolean; error?: string }> {
  // 1. Verificar que el programador esté disponible
  const { data: userData, error: userError } = await supabase
    .from('usuarios')
    .select('disponible, estado')
    .eq('id', programadorId)
    .single();

  if (userError || !userData) {
    return { success: false, error: 'No se pudo verificar disponibilidad del programador' };
  }

  if (!userData.disponible) {
    return { success: false, error: 'Ya tienes una tarea activa. Termínala antes de aceptar otra.' };
  }

  // 2. Actualizar el agendamiento — el trigger SQL se encarga del resto
  const { error: updateError } = await supabase
    .from('agendamientos')
    .update({
      estado: 'aceptado_programador',
      aceptado_por: programadorEmail,
      fecha_aceptacion: new Date().toISOString(),
    })
    .eq('id', agendamientoId)
    .eq('estado', 'pendiente'); // Solo si sigue pendiente (evita race conditions)

  if (updateError) {
    return { success: false, error: 'El agendamiento ya fue tomado por otro programador' };
  }

  // 3. Limpieza adicional en cliente (el trigger ya lo hace en BD, esto es redundante pero seguro)
  await limpiarNotificacionesProgramador(programadorId);

  return { success: true };
}

/**
 * Marcar una notificación como leída.
 */
export async function marcarNotificacionLeida(notificacionId: string): Promise<void> {
  await supabase
    .from('notificaciones')
    .update({ leida: true })
    .eq('id', notificacionId);
}

/**
 * Eliminar una notificación específica.
 */
export async function eliminarNotificacion(notificacionId: string): Promise<void> {
  await supabase
    .from('notificaciones')
    .delete()
    .eq('id', notificacionId);
}

/**
 * Limpiar TODAS las notificaciones expiradas globalmente.
 * Útil para llamar al iniciar sesión o periódicamente.
 */
export async function limpiarNotificacionesExpiradas(): Promise<number> {
  const { data, error } = await supabase.rpc('limpiar_notificaciones_expiradas');

  if (error) {
    console.error('[Notificaciones] Error en limpieza global:', error.message);
    return 0;
  }

  return (data as number) || 0;
}

/**
 * Verificar si el programador puede recibir notificaciones.
 * Retorna true si está disponible (sin tarea activa).
 */
export async function isProgramadorDisponible(programadorId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('usuarios')
    .select('disponible')
    .eq('id', programadorId)
    .single();

  if (error || !data) return false;
  return data.disponible === true;
}

/**
 * Suscripción en tiempo real a notificaciones del programador.
 * Se auto-filtra para ignorar notificaciones no accionables.
 */
export function suscribirseNotificacionesProgramador(
  programadorId: string,
  onNuevaNotificacion: (notif: NotificacionRaw) => void,
  onNotificacionEliminada: (notifId: string) => void
) {
  const channel = supabase
    .channel(`notificaciones_programador_${programadorId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'notificaciones',
        filter: `para_usuario_id=eq.${programadorId}`,
      },
      (payload) => {
        const notif = payload.new as NotificacionRaw;
        // Solo procesar tipos accionables
        if (TIPOS_ACCIONABLES.includes(notif.tipo as TipoNotificacion)) {
          onNuevaNotificacion(notif);
        }
      }
    )
    .on(
      'postgres_changes',
      {
        event: 'DELETE',
        schema: 'public',
        table: 'notificaciones',
        filter: `para_usuario_id=eq.${programadorId}`,
      },
      (payload) => {
        if (payload.old?.id) {
          onNotificacionEliminada(payload.old.id as string);
        }
      }
    )
    .subscribe();

  // Retornar función para desuscribirse
  return () => {
    supabase.removeChannel(channel);
  };
}

/**
 * Enviar notificación a todos los programadores disponibles.
 * Usado cuando llega una nueva solicitud de cliente.
 */
export async function notificarProgramadoresDisponibles(params: {
  titulo: string;
  mensaje: string;
  tipo: TipoNotificacion;
  agendamientoId: string;
  datos?: Record<string, unknown>;
  expirarEnMinutos?: number;
}): Promise<{ notificados: number }> {
  const {
    titulo,
    mensaje,
    tipo,
    agendamientoId,
    datos = {},
    expirarEnMinutos = 120,
  } = params;

  // Obtener programadores disponibles
  const { data: programadores, error } = await supabase
    .from('usuarios')
    .select('id, email')
    .eq('role', 'programador')
    .eq('disponible', true)
    .eq('estado', 'activo');

  if (error || !programadores?.length) {
    console.warn('[Notificaciones] No hay programadores disponibles');
    return { notificados: 0 };
  }

  const expiresAt = new Date(Date.now() + expirarEnMinutos * 60 * 1000).toISOString();

  // Insertar notificación para cada programador disponible
  const notificaciones = programadores.map((p) => ({
    para_usuario_id: p.id,
    usuario_id: p.id,
    usuario_email: p.email,
    titulo,
    mensaje,
    tipo,
    referencia_id: agendamientoId,
    agendamiento_id: agendamientoId,
    estado: 'activa',
    expires_at: expiresAt,
    leida: false,
    datos: {
      ...datos,
      agendamiento_id: agendamientoId,
      enviada_en: new Date().toISOString(),
    },
  }));

  const { error: insertError } = await supabase
    .from('notificaciones')
    .insert(notificaciones);

  if (insertError) {
    console.error('[Notificaciones] Error al notificar programadores:', insertError.message);
    return { notificados: 0 };
  }

  return { notificados: programadores.length };
}
