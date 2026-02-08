import { useEffect, useRef } from 'react';
import { projectId, publicAnonKey } from '../../utils/supabase/info';

/**
 * Hook para recibir notificaciones en tiempo real usando Server-Sent Events (SSE)
 * Implementa reconexión automática y gestión de errores
 */
export function useNotificacionesRealtime(
  usuarioId: string | null,
  onNuevaNotificacion: (notificacion: any) => void,
  habilitado: boolean = true
) {
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectDelay = 30000; // 30 segundos máximo
  const baseReconnectDelay = 1000; // 1 segundo inicial

  useEffect(() => {
    // Si no hay usuario o no está habilitado, no hacer nada
    if (!usuarioId || !habilitado) {
      console.log('⏸️ Notificaciones en tiempo real deshabilitadas o sin usuario');
      return;
    }

    console.log('🔔 Iniciando suscripción a notificaciones en tiempo real para:', usuarioId);

    const conectar = () => {
      try {
        // Limpiar conexión anterior si existe
        if (eventSourceRef.current) {
          eventSourceRef.current.close();
        }

        // Crear URL del endpoint de SSE
        const API_URL = `https://${projectId}.supabase.co/functions/v1/make-server-9dadc017`;
        const sseUrl = `${API_URL}/notificaciones/realtime?usuarioId=${encodeURIComponent(usuarioId)}`;

        console.log('🔌 Conectando a:', sseUrl);

        // Crear nueva conexión SSE
        const eventSource = new EventSource(sseUrl);
        eventSourceRef.current = eventSource;

        // Evento: Conexión abierta
        eventSource.onopen = () => {
          console.log('✅ Conexión SSE establecida');
          reconnectAttempts.current = 0; // Reset intentos al conectar exitosamente
        };

        // Evento: Nueva notificación
        eventSource.addEventListener('notification', (event) => {
          try {
            const notificacion = JSON.parse(event.data);
            console.log('📬 Nueva notificación recibida:', notificacion);
            onNuevaNotificacion(notificacion);
          } catch (error) {
            console.error('❌ Error parseando notificación:', error);
          }
        });

        // Evento: Heartbeat (mantener conexión viva)
        eventSource.addEventListener('heartbeat', () => {
          // Silencioso, solo para mantener la conexión
        });

        // Evento: Error
        eventSource.onerror = (error) => {
          console.error('❌ Error en conexión SSE:', error);
          eventSource.close();
          
          // Intentar reconectar con backoff exponencial
          reconnectAttempts.current++;
          const delay = Math.min(
            baseReconnectDelay * Math.pow(2, reconnectAttempts.current),
            maxReconnectDelay
          );
          
          console.log(`🔄 Reintentando conexión en ${delay/1000}s... (intento ${reconnectAttempts.current})`);
          
          reconnectTimeoutRef.current = setTimeout(() => {
            conectar();
          }, delay);
        };

      } catch (error) {
        console.error('❌ Error creando conexión SSE:', error);
      }
    };

    // Iniciar conexión
    conectar();

    // Cleanup al desmontar
    return () => {
      console.log('🔌 Cerrando conexión SSE');
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
    };
  }, [usuarioId, habilitado, onNuevaNotificacion]);

  // Retornar función para forzar reconexión manual
  const reconectar = () => {
    if (eventSourceRef.current) {
      console.log('🔄 Forzando reconexión manual');
      eventSourceRef.current.close();
      reconnectAttempts.current = 0;
    }
  };

  return { reconectar };
}

/**
 * Hook alternativo usando Long Polling (fallback si SSE no funciona)
 * Hace polling cada X segundos para obtener nuevas notificaciones
 */
export function useNotificacionesPolling(
  usuarioId: string | null,
  onNuevasNotificaciones: (notificaciones: any[]) => void,
  intervalo: number = 10000, // 10 segundos por defecto
  habilitado: boolean = true
) {
  const ultimaFechaRef = useRef<string>(new Date().toISOString());
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!usuarioId || !habilitado) {
      console.log('⏸️ Polling de notificaciones deshabilitado');
      return;
    }

    console.log(`🔄 Iniciando polling de notificaciones cada ${intervalo/1000}s`);

    const fetchNuevasNotificaciones = async () => {
      try {
        const API_URL = `https://${projectId}.supabase.co/functions/v1/make-server-9dadc017`;
        const url = `${API_URL}/notificaciones?usuarioId=${encodeURIComponent(usuarioId)}&desde=${encodeURIComponent(ultimaFechaRef.current)}`;

        const response = await fetch(url, {
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`
          }
        });

        if (!response.ok) {
          console.error('❌ Error en polling de notificaciones:', response.statusText);
          return;
        }

        const data = await response.json();
        
        if (data.notificaciones && data.notificaciones.length > 0) {
          console.log(`📬 ${data.notificaciones.length} nuevas notificaciones en polling`);
          onNuevasNotificaciones(data.notificaciones);
          
          // Actualizar última fecha
          const fechas = data.notificaciones.map((n: any) => new Date(n.fechaCreacion).getTime());
          const ultimaFecha = new Date(Math.max(...fechas)).toISOString();
          ultimaFechaRef.current = ultimaFecha;
        }
      } catch (error) {
        console.error('❌ Error en fetchNuevasNotificaciones:', error);
      }
    };

    // Hacer primer fetch inmediatamente
    fetchNuevasNotificaciones();

    // Configurar intervalo
    pollingIntervalRef.current = setInterval(fetchNuevasNotificaciones, intervalo);

    // Cleanup
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
    };
  }, [usuarioId, intervalo, habilitado, onNuevasNotificaciones]);
}

/**
 * Hook que detecta cuando hay nuevas notificaciones y muestra notificación del navegador
 * Requiere permiso del usuario para notificaciones del navegador
 */
export function useNotificacionesBrowser(habilitado: boolean = false) {
  const permisoSolicitado = useRef(false);

  useEffect(() => {
    if (!habilitado || permisoSolicitado.current) return;

    // Verificar si el navegador soporta notificaciones
    if (!('Notification' in window)) {
      console.log('⚠️ Este navegador no soporta notificaciones');
      return;
    }

    // Solicitar permiso si no lo tenemos
    if (Notification.permission === 'default') {
      console.log('🔔 Solicitando permiso para notificaciones del navegador');
      Notification.requestPermission().then(permission => {
        if (permission === 'granted') {
          console.log('✅ Permiso de notificaciones concedido');
        } else {
          console.log('❌ Permiso de notificaciones denegado');
        }
      });
      permisoSolicitado.current = true;
    }
  }, [habilitado]);

  // Función para mostrar notificación del navegador
  const mostrarNotificacionBrowser = (titulo: string, opciones?: NotificationOptions) => {
    if (Notification.permission === 'granted') {
      try {
        const notification = new Notification(titulo, {
          icon: '/favicon.ico', // Ícono de la app
          badge: '/favicon.ico',
          ...opciones
        });

        // Auto-cerrar después de 5 segundos
        setTimeout(() => notification.close(), 5000);

        return notification;
      } catch (error) {
        console.error('❌ Error mostrando notificación del navegador:', error);
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
