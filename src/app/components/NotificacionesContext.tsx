import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { supabase } from '../../utils/supabase/info';
import { toast } from 'sonner';

// 🔔 NOTIFICACIÓN: Alerta o mensaje para el usuario
export interface Notificacion {
  id: string;
  
  // Destinatario
  usuarioId: string;              // ID del usuario que recibe
  usuarioEmail: string;           // Email del destinatario
  
  // Contenido
  tipo: TipoNotificacion;         // Tipo de notificación
  titulo: string;                 // Título corto
  mensaje: string;                // Mensaje descriptivo
  icono?: string;                 // Emoji o ícono
  
  // Estado
  leida: boolean;                 // Si fue leída
  fechaLectura?: string;          // Cuándo se leyó
  
  // Acción
  accion?: AccionNotificacion;    // Acción al hacer click
  urlDestino?: string;            // URL a la que navega
  
  // Prioridad
  prioridad: 'baja' | 'media' | 'alta' | 'urgente';
  
  // Metadatos
  fechaCreacion: string;
  creadoPor: string;
  expiraEn?: string;              // Fecha de expiración
}

// 📝 TIPOS DE NOTIFICACIÓN
export type TipoNotificacion = 
  | 'agendamiento_nuevo'          // Nuevo agendamiento creado
  | 'agendamiento_confirmado'     // Agendamiento confirmado
  | 'agendamiento_cancelado'      // Agendamiento cancelado
  | 'agendamiento_proximo'        // Recordatorio de cita próxima (24h antes)
  | 'servicio_completado'         // Servicio finalizado
  | 'servicio_calificado'         // Cliente calificó servicio
  | 'pago_recibido'               // Pago confirmado
  | 'pago_pendiente'              // Recordatorio de pago
  | 'multa_aplicada'              // Multa automática aplicada
  | 'multa_pagada'                // Multa pagada
  | 'cliente_bloqueado'           // Cliente bloqueado
  | 'modelo_disponible'           // Modelo se marcó como disponible
  | 'adelanto_aprobado'           // Adelanto aprobado
  | 'adelanto_rechazado'          // Adelanto rechazado
  | 'sistema'                     // Notificación del sistema
  | 'marketing';                  // Mensaje promocional

// 🎯 ACCIÓN DE NOTIFICACIÓN
export interface AccionNotificacion {
  tipo: 'navegar' | 'modal' | 'ninguna';
  destino?: string;               // URL o ID del modal
  datos?: Record<string, any>;    // Datos adicionales para la acción
}

// ⚙️ PREFERENCIAS DE NOTIFICACIÓN
export interface PreferenciasNotificacion {
  usuarioId: string;
  
  // Canales activos
  enApp: boolean;                 // Notificaciones in-app
  push: boolean;                  // Push notifications (futuro)
  email: boolean;                 // Email (futuro)
  sms: boolean;                   // SMS (futuro)
  
  // Por tipo de notificación
  notificarAgendamientos: boolean;
  notificarPagos: boolean;
  notificarMultas: boolean;
  notificarServicios: boolean;
  notificarSistema: boolean;
  notificarMarketing: boolean;
  
  // Configuración de silencio
  horaInicioSilencio?: string;    // Ej: '22:00'
  horaFinSilencio?: string;       // Ej: '08:00'
  diasSilencio?: string[];        // ['sabado', 'domingo']
  
  fechaActualizacion: string;
}

// 📊 CONTEXTO DE NOTIFICACIONES
interface NotificacionesContextType {
  notificaciones: Notificacion[];
  noLeidas: number;
  preferencias: PreferenciasNotificacion | null;
  cargando: boolean;
  
  // Funciones principales
  crearNotificacion: (notificacion: Omit<Notificacion, 'id' | 'fechaCreacion'>) => Promise<void>;
  marcarComoLeida: (id: string) => Promise<void>;
  marcarTodasComoLeidas: () => Promise<void>;
  eliminarNotificacion: (id: string) => Promise<void>;
  limpiarNotificacionesAntiguas: () => Promise<void>;
  
  // Preferencias
  obtenerPreferencias: (usuarioId: string) => Promise<PreferenciasNotificacion | null>;
  actualizarPreferencias: (preferencias: Partial<PreferenciasNotificacion>) => Promise<void>;
  
  // Utilidades
  obtenerNotificacionesPorTipo: (tipo: TipoNotificacion) => Notificacion[];
  obtenerNotificacionesNoLeidas: () => Notificacion[];
  obtenerNotificacionesRecientes: (limite?: number) => Notificacion[];
}

const NotificacionesContext = createContext<NotificacionesContextType | undefined>(undefined);

export const useNotificaciones = () => {
  const context = useContext(NotificacionesContext);
  if (!context) {
    throw new Error('useNotificaciones debe usarse dentro de NotificacionesProvider');
  }
  return context;
};

// 🎨 PROVIDER DE NOTIFICACIONES
export const NotificacionesProvider = ({ children }: { children: ReactNode }) => {
  const [notificaciones, setNotificaciones] = useState<Notificacion[]>([]);
  const [preferencias, setPreferencias] = useState<PreferenciasNotificacion | null>(null);
  const [cargando, setCargando] = useState(true);
  const [usuarioActual, setUsuarioActual] = useState<string | null>(null);

  // 🔄 Cargar notificaciones del usuario actual
  const cargarNotificaciones = useCallback(async (usuarioId: string) => {
    if (!usuarioId) return;

    try {
      const { data, error } = await (supabase as any)
        .from('notificaciones')
        .select('*')
        .or(`usuario_id.eq.${usuarioId},usuario_email.eq.${usuarioId}`)
        .order('fecha_creacion', { ascending: false })
        .limit(50);

      if (error) {
        if (process.env.NODE_ENV === 'development') console.error('⚠️ No se pudieron cargar notificaciones:', error.message);
        setCargando(false);
        return;
      }

      const mapped = (data ?? []).map((row: any): Notificacion => ({
        id: row.id,
        usuarioId: row.usuario_id ?? row.usuario_email ?? usuarioId,
        usuarioEmail: row.usuario_email ?? usuarioId,
        tipo: row.tipo,
        titulo: row.titulo,
        mensaje: row.mensaje,
        icono: row.icono,
        leida: row.leida ?? false,
        fechaLectura: row.fecha_lectura,
        accion: row.accion ? (typeof row.accion === 'string' ? JSON.parse(row.accion) : row.accion) : undefined,
        urlDestino: row.url_destino,
        prioridad: row.prioridad ?? 'media',
        fechaCreacion: row.fecha_creacion ?? row.created_at ?? new Date().toISOString(),
        creadoPor: row.creado_por ?? 'sistema',
        expiraEn: row.expira_en,
      }));

      setNotificaciones(mapped);
    } catch (error) {
      if (process.env.NODE_ENV === 'development') console.error('❌ Error cargando notificaciones:', error);
    } finally {
      setCargando(false);
    }
  }, []);

  // 🔄 Cargar preferencias del usuario (usa estado local, sin tabla dedicada)
  const obtenerPreferencias = useCallback(async (usuarioId: string): Promise<PreferenciasNotificacion | null> => {
    if (!usuarioId) return null;

    const preferenciasPorDefecto: PreferenciasNotificacion = {
      usuarioId,
      enApp: true,
      push: false,
      email: false,
      sms: false,
      notificarAgendamientos: true,
      notificarPagos: true,
      notificarMultas: true,
      notificarServicios: true,
      notificarSistema: true,
      notificarMarketing: false,
      fechaActualizacion: new Date().toISOString(),
    };

    // Intentar leer desde localStorage
    try {
      const stored = localStorage.getItem(`notif_prefs_${usuarioId}`);
      if (stored) {
        const prefs = JSON.parse(stored) as PreferenciasNotificacion;
        setPreferencias(prefs);
        return prefs;
      }
    } catch {}

    setPreferencias(preferenciasPorDefecto);
    return preferenciasPorDefecto;
  }, []);

  // 📝 Crear nueva notificación
  const crearNotificacion = async (notificacion: Omit<Notificacion, 'id' | 'fechaCreacion'>) => {
    try {
      // Verificar preferencias del usuario
      if (preferencias) {
        const debeNotificar = verificarDebeNotificar(notificacion.tipo, preferencias);
        if (!debeNotificar) {
          return;
        }
      }

      const nuevaLocal: Notificacion = {
        ...notificacion,
        id: crypto.randomUUID(),
        fechaCreacion: new Date().toISOString(),
      };

      // Intentar persistir en Supabase (silencioso si tabla no existe)
      const { data, error } = await (supabase as any)
        .from('notificaciones')
        .insert({
          usuario_id: notificacion.usuarioId,
          usuario_email: notificacion.usuarioEmail,
          tipo: notificacion.tipo,
          titulo: notificacion.titulo,
          mensaje: notificacion.mensaje,
          icono: notificacion.icono,
          leida: false,
          prioridad: notificacion.prioridad,
          accion: notificacion.accion ? JSON.stringify(notificacion.accion) : null,
          url_destino: notificacion.urlDestino,
          creado_por: notificacion.creadoPor ?? 'sistema',
          fecha_creacion: nuevaLocal.fechaCreacion,
        })
        .select()
        .single();

      const notificacionFinal = error ? nuevaLocal : {
        ...nuevaLocal,
        id: data?.id ?? nuevaLocal.id,
      };

      setNotificaciones(prev => [notificacionFinal, ...prev]);
    } catch (error) {
      if (process.env.NODE_ENV === 'development') console.error('❌ Error creando notificación:', error);
    }
  };

  // ✅ Marcar notificación como leída
  const marcarComoLeida = async (id: string) => {
    try {
      const fechaLectura = new Date().toISOString();

      await (supabase as any)
        .from('notificaciones')
        .update({ leida: true, fecha_lectura: fechaLectura })
        .eq('id', id);

      setNotificaciones(prev => prev.map(n =>
        n.id === id ? { ...n, leida: true, fechaLectura } : n
      ));
    } catch (error) {
      if (process.env.NODE_ENV === 'development') console.error('❌ Error marcando notificación como leída:', error);
    }
  };

  // ✅ Marcar todas como leídas
  const marcarTodasComoLeidas = async () => {
    if (!usuarioActual) return;

    try {
      const fechaLectura = new Date().toISOString();

      await (supabase as any)
        .from('notificaciones')
        .update({ leida: true, fecha_lectura: fechaLectura })
        .or(`usuario_id.eq.${usuarioActual},usuario_email.eq.${usuarioActual}`)
        .eq('leida', false);

      setNotificaciones(prev => prev.map(n => ({ ...n, leida: true, fechaLectura })));
    } catch (error) {
      if (process.env.NODE_ENV === 'development') console.error('❌ Error marcando todas como leídas:', error);
    }
  };

  // 🗑️ Eliminar notificación
  const eliminarNotificacion = async (id: string) => {
    try {
      await (supabase as any)
        .from('notificaciones')
        .delete()
        .eq('id', id);

      setNotificaciones(prev => prev.filter(n => n.id !== id));
    } catch (error) {
      if (process.env.NODE_ENV === 'development') console.error('❌ Error eliminando notificación:', error);
    }
  };

  // 🧹 Limpiar notificaciones antiguas (más de 30 días)
  const limpiarNotificacionesAntiguas = async () => {
    if (!usuarioActual) return;

    try {
      const fechaLimite = new Date();
      fechaLimite.setDate(fechaLimite.getDate() - 30);

      await (supabase as any)
        .from('notificaciones')
        .delete()
        .or(`usuario_id.eq.${usuarioActual},usuario_email.eq.${usuarioActual}`)
        .lt('fecha_creacion', fechaLimite.toISOString());

      await cargarNotificaciones(usuarioActual);
    } catch (error) {
      if (process.env.NODE_ENV === 'development') console.error('❌ Error limpiando notificaciones antiguas:', error);
    }
  };

  // ⚙️ Actualizar preferencias (persistidas en localStorage)
  const actualizarPreferencias = async (nuevasPreferencias: Partial<PreferenciasNotificacion>) => {
    const uid = usuarioActual ?? nuevasPreferencias.usuarioId;
    if (!uid) return;

    const preferenciasFinal: PreferenciasNotificacion = {
      usuarioId: uid,
      enApp: true,
      push: false,
      email: false,
      sms: false,
      notificarAgendamientos: true,
      notificarPagos: true,
      notificarMultas: true,
      notificarServicios: true,
      notificarSistema: true,
      notificarMarketing: false,
      ...preferencias,
      ...nuevasPreferencias,
      fechaActualizacion: new Date().toISOString(),
    };

    try {
      localStorage.setItem(`notif_prefs_${uid}`, JSON.stringify(preferenciasFinal));
    } catch {}

    setPreferencias(preferenciasFinal);
  };

  // 🔍 Obtener notificaciones por tipo
  const obtenerNotificacionesPorTipo = (tipo: TipoNotificacion): Notificacion[] => {
    return notificaciones.filter(n => n.tipo === tipo);
  };

  // 🔍 Obtener notificaciones no leídas
  const obtenerNotificacionesNoLeidas = (): Notificacion[] => {
    return notificaciones.filter(n => !n.leida);
  };

  // 🔍 Obtener notificaciones recientes
  const obtenerNotificacionesRecientes = (limite: number = 10): Notificacion[] => {
    return notificaciones
      .sort((a, b) => new Date(b.fechaCreacion).getTime() - new Date(a.fechaCreacion).getTime())
      .slice(0, limite);
  };

  // 📊 Calcular número de notificaciones no leídas
  const noLeidas = notificaciones.filter(n => !n.leida).length;

  // 🔄 Cargar datos iniciales
  useEffect(() => {
    const usuarioId = localStorage.getItem('currentUserId') || localStorage.getItem('currentUserEmail');
    if (usuarioId) {
      setUsuarioActual(usuarioId);
      cargarNotificaciones(usuarioId);
      obtenerPreferencias(usuarioId);

      // ✅ REALTIME: Notificaciones en tiempo real
      const channel = supabase
        .channel(`notif-live-${usuarioId}`)
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'notificaciones'
        }, (payload) => {
          const notif = payload.new;
          const esParaUsuario = 
            String(notif.usuario_id || '').toLowerCase() === String(usuarioId).toLowerCase() ||
            String(notif.usuario_email || '').toLowerCase() === String(usuarioId).toLowerCase();

          if (!esParaUsuario) return;

          const mapped: Notificacion = {
            id: notif.id,
            usuarioId: notif.usuario_id ?? notif.usuario_email ?? usuarioId,
            usuarioEmail: notif.usuario_email ?? usuarioId,
            tipo: notif.tipo,
            titulo: notif.titulo,
            mensaje: notif.mensaje,
            icono: notif.icono,
            leida: notif.leida ?? false,
            fechaLectura: notif.fecha_lectura,
            accion: notif.accion ? (typeof notif.accion === 'string' ? JSON.parse(notif.accion) : notif.accion) : undefined,
            urlDestino: notif.url_destino,
            prioridad: notif.prioridad ?? 'media',
            fechaCreacion: notif.fecha_creacion ?? notif.created_at ?? new Date().toISOString(),
            creadoPor: notif.creado_por ?? 'sistema',
            expiraEn: notif.expira_en,
          };
          setNotificaciones(prev => [mapped, ...prev]);
          toast('🔔 ' + mapped.titulo, {
            duration: 6000,
            style: {
              background: 'rgba(255,215,0,0.15)',
              border: '1px solid rgba(255,215,0,0.4)',
              color: 'white',
              fontWeight: '600'
            }
          });
        })
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    } else {
      setCargando(false);
    }
  }, [cargarNotificaciones, obtenerPreferencias]);

  const value: NotificacionesContextType = {
    notificaciones,
    noLeidas,
    preferencias,
    cargando,
    crearNotificacion,
    marcarComoLeida,
    marcarTodasComoLeidas,
    eliminarNotificacion,
    limpiarNotificacionesAntiguas,
    obtenerPreferencias,
    actualizarPreferencias,
    obtenerNotificacionesPorTipo,
    obtenerNotificacionesNoLeidas,
    obtenerNotificacionesRecientes
  };

  return (
    <NotificacionesContext.Provider value={value}>
      {children}
    </NotificacionesContext.Provider>
  );
};

// 🛠️ UTILIDADES

// Verificar si debe notificar según preferencias
function verificarDebeNotificar(tipo: TipoNotificacion, preferencias: PreferenciasNotificacion): boolean {
  // Si no hay notificaciones en app activadas, no notificar
  if (!preferencias.enApp) return false;

  // Verificar hora de silencio
  if (preferencias.horaInicioSilencio && preferencias.horaFinSilencio) {
    const ahora = new Date();
    const horaActual = `${ahora.getHours().toString().padStart(2, '0')}:${ahora.getMinutes().toString().padStart(2, '0')}`;
    
    if (horaActual >= preferencias.horaInicioSilencio || horaActual <= preferencias.horaFinSilencio) {
      return false; // Está en horario de silencio
    }
  }

  // Verificar día de silencio
  if (preferencias.diasSilencio && preferencias.diasSilencio.length > 0) {
    const diasSemana = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'];
    const diaActual = diasSemana[new Date().getDay()];
    if (preferencias.diasSilencio.includes(diaActual)) {
      return false; // Es un día de silencio
    }
  }

  // Verificar por tipo de notificación
  if (tipo.startsWith('agendamiento_')) return preferencias.notificarAgendamientos;
  if (tipo.startsWith('pago_')) return preferencias.notificarPagos;
  if (tipo.startsWith('multa_')) return preferencias.notificarMultas;
  if (tipo.startsWith('servicio_')) return preferencias.notificarServicios;
  if (tipo === 'sistema') return preferencias.notificarSistema;
  if (tipo === 'marketing') return preferencias.notificarMarketing;

  return true; // Por defecto, notificar
}

// 🎨 Obtener icono según tipo de notificación
export function obtenerIconoNotificacion(tipo: TipoNotificacion): string {
  const iconos: Record<TipoNotificacion, string> = {
    'agendamiento_nuevo': '📅',
    'agendamiento_confirmado': '✅',
    'agendamiento_cancelado': '❌',
    'agendamiento_proximo': '⏰',
    'servicio_completado': '🎉',
    'servicio_calificado': '⭐',
    'pago_recibido': '💰',
    'pago_pendiente': '⏳',
    'multa_aplicada': '💸',
    'multa_pagada': '✅',
    'cliente_bloqueado': '🚫',
    'modelo_disponible': '💃',
    'adelanto_aprobado': '✅',
    'adelanto_rechazado': '❌',
    'sistema': '⚙️',
    'marketing': '📢'
  };

  return iconos[tipo] || '🔔';
}

// 🎨 Obtener color según prioridad
export function obtenerColorPrioridad(prioridad: 'baja' | 'media' | 'alta' | 'urgente'): string {
  const colores = {
    'baja': 'text-muted-foreground',
    'media': 'text-primary',
    'alta': 'text-orange-500',
    'urgente': 'text-destructive'
  };

  return colores[prioridad];
}
