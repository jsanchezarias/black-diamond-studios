/**
 * useNotificacionesProgramador.ts
 * Hook React para manejar notificaciones en tiempo real del programador
 * 
 * Uso:
 *   const { notificaciones, loading, aceptar, limpiar } = useNotificacionesProgramador(programadorId);
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  NotificacionProgramador,
  NotificacionRaw,
  getNotificacionesProgramador,
  limpiarNotificacionesProgramador,
  limpiarNotificacionesExpiradas,
  aceptarAgendamiento,
  suscribirseNotificacionesProgramador,
  isProgramadorDisponible,
} from './notificationService';

interface UseNotificacionesReturn {
  notificaciones: NotificacionProgramador[];
  loading: boolean;
  disponible: boolean;
  totalNoLeidas: number;
  aceptar: (agendamientoId: string, programadorEmail: string) => Promise<{ success: boolean; error?: string }>;
  limpiar: () => Promise<void>;
  refrescar: () => Promise<void>;
}

export function useNotificacionesProgramador(
  programadorId: string | null
): UseNotificacionesReturn {
  const [notificaciones, setNotificaciones] = useState<NotificacionProgramador[]>([]);
  const [loading, setLoading] = useState(true);
  const [disponible, setDisponible] = useState(true);
  const unsubscribeRef = useRef<(() => void) | null>(null);

  const totalNoLeidas = notificaciones.filter((n) => n.estado === 'activa').length;

  // ── Cargar notificaciones desde la BD ──────────────────────────────────────
  const cargarNotificaciones = useCallback(async () => {
    if (!programadorId) {
      setNotificaciones([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      // Limpieza global de expiradas al cargar
      await limpiarNotificacionesExpiradas();

      const [notifs, disp] = await Promise.all([
        getNotificacionesProgramador(programadorId),
        isProgramadorDisponible(programadorId),
      ]);

      setNotificaciones(notifs);
      setDisponible(disp);
    } catch (err) {
      console.error('[Hook Notificaciones] Error al cargar:', err);
    } finally {
      setLoading(false);
    }
  }, [programadorId]);

  // ── Suscripción en tiempo real ─────────────────────────────────────────────
  useEffect(() => {
    if (!programadorId) return;

    cargarNotificaciones();

    // Suscribirse a cambios en tiempo real
    const unsubscribe = suscribirseNotificacionesProgramador(
      programadorId,
      // Nueva notificación llegó
      (notifRaw: NotificacionRaw) => {
        if (!disponible) return; // Ignorar si estamos ocupados

        const nuevaNotif: NotificacionProgramador = {
          id: notifRaw.id,
          programador_id: notifRaw.para_usuario_id,
          programador_nombre: null,
          titulo: notifRaw.titulo,
          mensaje: notifRaw.mensaje,
          tipo: notifRaw.tipo as NotificacionProgramador['tipo'],
          agendamiento_id: notifRaw.referencia_id,
          created_at: notifRaw.created_at,
          expires_at: notifRaw.expires_at,
          estado: 'activa',
          datos: notifRaw.datos,
          minutos_restantes: notifRaw.expires_at
            ? (new Date(notifRaw.expires_at).getTime() - Date.now()) / 60000
            : null,
        };

        setNotificaciones((prev) => [nuevaNotif, ...prev]);
      },
      // Notificación eliminada
      (notifId: string) => {
        setNotificaciones((prev) => prev.filter((n) => n.id !== notifId));
      }
    );

    unsubscribeRef.current = unsubscribe;

    // Limpieza periódica cada 5 minutos de notificaciones expiradas en UI
    const cleanupInterval = setInterval(() => {
      setNotificaciones((prev) =>
        prev.filter((n) => {
          if (!n.expires_at) return true;
          return new Date(n.expires_at) > new Date();
        })
      );
    }, 60000); // cada 1 minuto

    return () => {
      unsubscribeRef.current?.();
      clearInterval(cleanupInterval);
    };
  }, [programadorId]);

  // ── Aceptar agendamiento ───────────────────────────────────────────────────
  const aceptar = useCallback(
    async (agendamientoId: string, programadorEmail: string) => {
      if (!programadorId) return { success: false, error: 'No hay programador activo' };

      const result = await aceptarAgendamiento(agendamientoId, programadorId, programadorEmail);

      if (result.success) {
        // Limpiar todas las notificaciones del estado local
        setNotificaciones([]);
        setDisponible(false);
      }

      return result;
    },
    [programadorId]
  );

  // ── Limpiar manualmente ────────────────────────────────────────────────────
  const limpiar = useCallback(async () => {
    if (!programadorId) return;
    await limpiarNotificacionesProgramador(programadorId);
    setNotificaciones([]);
  }, [programadorId]);

  return {
    notificaciones,
    loading,
    disponible,
    totalNoLeidas,
    aceptar,
    limpiar,
    refrescar: cargarNotificaciones,
  };
}
