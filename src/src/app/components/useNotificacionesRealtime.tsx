import { useEffect, useRef } from 'react';
import { supabase } from '../../utils/supabase/info';

/**
 * Hook para recibir notificaciones en tiempo real usando Supabase Realtime
 */
export function useNotificacionesRealtime(
  usuarioId: string | null,
  onNuevaNotificacion: (notificacion: any) => void,
  habilitado: boolean = true
) {
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  useEffect(() => {
    if (!usuarioId || !habilitado) return;

    // Remove any previous channel
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }

    const channel = supabase
      .channel(`notificaciones_realtime_${usuarioId}_${Date.now()}`)
      .on(
        'postgres_changes' as any,
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notificaciones',
          filter: `usuario_id=eq.${usuarioId}`,
        },
        (payload: any) => {
          const row = payload.new;
          onNuevaNotificacion({
            id: row.id,
            usuarioId: row.usuario_id,
            usuarioEmail: row.usuario_email,
            tipo: row.tipo,
            titulo: row.titulo,
            mensaje: row.mensaje,
            icono: row.icono,
            leida: row.leida ?? false,
            prioridad: row.prioridad ?? 'media',
            fechaCreacion: row.fecha_creacion ?? row.created_at,
            creadoPor: row.creado_por ?? 'sistema',
          });
        }
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [usuarioId, habilitado]);

  const reconectar = () => {
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }
  };

  return { reconectar };
}

/**
 * Hook alternativo usando polling con Supabase (fallback)
 */
export function useNotificacionesPolling(
  usuarioId: string | null,
  onNuevasNotificaciones: (notificaciones: any[]) => void,
  intervalo: number = 10000,
  habilitado: boolean = true
) {
  const ultimaFechaRef = useRef<string>(new Date().toISOString());
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!usuarioId || !habilitado) return;

    const fetchNuevasNotificaciones = async () => {
      try {
        const { data, error } = await (supabase as any)
          .from('notificaciones')
          .select('*')
          .or(`usuario_id.eq.${usuarioId},usuario_email.eq.${usuarioId}`)
          .gt('fecha_creacion', ultimaFechaRef.current)
          .order('fecha_creacion', { ascending: true });

        if (error || !data || data.length === 0) return;

        onNuevasNotificaciones(data);

        const fechas = data.map((n: any) => new Date(n.fecha_creacion).getTime());
        ultimaFechaRef.current = new Date(Math.max(...fechas)).toISOString();
      } catch {
        // Silently ignore polling errors
      }
    };

    fetchNuevasNotificaciones();
    pollingIntervalRef.current = setInterval(fetchNuevasNotificaciones, intervalo);

    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
    };
  }, [usuarioId, intervalo, habilitado]);
}

/**
 * Hook que detecta cuando hay nuevas notificaciones y muestra notificación del navegador
 */
export function useNotificacionesBrowser(habilitado: boolean = false) {
  const permisoSolicitado = useRef(false);

  useEffect(() => {
    if (!habilitado || permisoSolicitado.current) return;
    if (!('Notification' in window)) return;

    if (Notification.permission === 'default') {
      Notification.requestPermission();
      permisoSolicitado.current = true;
    }
  }, [habilitado]);

  const mostrarNotificacionBrowser = (titulo: string, opciones?: NotificationOptions) => {
    if (Notification.permission === 'granted') {
      try {
        const notification = new Notification(titulo, {
          icon: '/favicon.ico',
          badge: '/favicon.ico',
          ...opciones
        });
        setTimeout(() => notification.close(), 5000);
        return notification;
      } catch {
        return null;
      }
    }
    return null;
  };

  return {
    permisoNotificaciones: Notification.permission,
    mostrarNotificacionBrowser,
    soportaNotificaciones: 'Notification' in window
  };
}
