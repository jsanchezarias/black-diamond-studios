import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { projectId, publicAnonKey } from '../../utils/supabase/info';

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

  const API_URL = `https://${projectId}.supabase.co/functions/v1/make-server-9dadc017`;

  // 🔄 Cargar notificaciones del usuario actual
  const cargarNotificaciones = useCallback(async (usuarioId: string) => {
    if (!usuarioId) return;
    
    try {
      console.log('🔄 Cargando notificaciones del usuario:', usuarioId);
      
      const response = await fetch(`${API_URL}/notificaciones?usuarioId=${usuarioId}`, {
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`
        }
      });

      if (!response.ok) {
        throw new Error('Error al cargar notificaciones');
      }

      const data = await response.json();
      setNotificaciones(data.notificaciones || []);
      console.log(`✅ ${data.notificaciones?.length || 0} notificaciones cargadas`);
    } catch (error) {
      console.error('❌ Error cargando notificaciones:', error);
    } finally {
      setCargando(false);
    }
  }, [API_URL, publicAnonKey]);

  // 🔄 Cargar preferencias del usuario
  const obtenerPreferencias = useCallback(async (usuarioId: string): Promise<PreferenciasNotificacion | null> => {
    if (!usuarioId) return null;
    
    try {
      console.log('🔄 Cargando preferencias de notificación:', usuarioId);
      
      const response = await fetch(`${API_URL}/notificaciones/preferencias?usuarioId=${usuarioId}`, {
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`
        }
      });

      if (!response.ok) {
        // Si no existen preferencias, crear las por defecto
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
          fechaActualizacion: new Date().toISOString()
        };
        
        await actualizarPreferencias(preferenciasPorDefecto);
        return preferenciasPorDefecto;
      }

      const data = await response.json();
      setPreferencias(data.preferencias);
      console.log('✅ Preferencias cargadas');
      return data.preferencias;
    } catch (error) {
      console.error('❌ Error cargando preferencias:', error);
      return null;
    }
  }, [API_URL, publicAnonKey]);

  // 📝 Crear nueva notificación
  const crearNotificacion = async (notificacion: Omit<Notificacion, 'id' | 'fechaCreacion'>) => {
    try {
      console.log('📝 Creando notificación:', notificacion.tipo);

      // Verificar preferencias del usuario
      if (preferencias) {
        const debeNotificar = verificarDebeNotificar(notificacion.tipo, preferencias);
        if (!debeNotificar) {
          console.log('⏭️ Notificación omitida por preferencias del usuario');
          return;
        }
      }

      const response = await fetch(`${API_URL}/notificaciones`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${publicAnonKey}`
        },
        body: JSON.stringify(notificacion)
      });

      if (!response.ok) {
        throw new Error('Error al crear notificación');
      }

      const data = await response.json();
      
      // Agregar a la lista local
      setNotificaciones(prev => [data.notificacion, ...prev]);
      console.log('✅ Notificación creada exitosamente');
    } catch (error) {
      console.error('❌ Error creando notificación:', error);
    }
  };

  // ✅ Marcar notificación como leída
  const marcarComoLeida = async (id: string) => {
    try {
      console.log('✅ Marcando notificación como leída:', id);

      const response = await fetch(`${API_URL}/notificaciones/${id}/marcar-leida`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`
        }
      });

      if (!response.ok) {
        throw new Error('Error al marcar notificación como leída');
      }

      // Actualizar en lista local
      setNotificaciones(prev => prev.map(n => 
        n.id === id 
          ? { ...n, leida: true, fechaLectura: new Date().toISOString() }
          : n
      ));
      console.log('✅ Notificación marcada como leída');
    } catch (error) {
      console.error('❌ Error marcando notificación como leída:', error);
    }
  };

  // ✅ Marcar todas como leídas
  const marcarTodasComoLeidas = async () => {
    if (!usuarioActual) return;
    
    try {
      console.log('✅ Marcando todas las notificaciones como leídas');

      const response = await fetch(`${API_URL}/notificaciones/marcar-todas-leidas`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${publicAnonKey}`
        },
        body: JSON.stringify({ usuarioId: usuarioActual })
      });

      if (!response.ok) {
        throw new Error('Error al marcar todas como leídas');
      }

      // Actualizar en lista local
      setNotificaciones(prev => prev.map(n => ({
        ...n,
        leida: true,
        fechaLectura: new Date().toISOString()
      })));
      console.log('✅ Todas las notificaciones marcadas como leídas');
    } catch (error) {
      console.error('❌ Error marcando todas como leídas:', error);
    }
  };

  // 🗑️ Eliminar notificación
  const eliminarNotificacion = async (id: string) => {
    try {
      console.log('🗑️ Eliminando notificación:', id);

      const response = await fetch(`${API_URL}/notificaciones/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`
        }
      });

      if (!response.ok) {
        throw new Error('Error al eliminar notificación');
      }

      // Remover de lista local
      setNotificaciones(prev => prev.filter(n => n.id !== id));
      console.log('✅ Notificación eliminada');
    } catch (error) {
      console.error('❌ Error eliminando notificación:', error);
    }
  };

  // 🧹 Limpiar notificaciones antiguas (más de 30 días)
  const limpiarNotificacionesAntiguas = async () => {
    if (!usuarioActual) return;
    
    try {
      console.log('🧹 Limpiando notificaciones antiguas');

      const response = await fetch(`${API_URL}/notificaciones/limpiar-antiguas`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${publicAnonKey}`
        },
        body: JSON.stringify({ usuarioId: usuarioActual, diasAntiguedad: 30 })
      });

      if (!response.ok) {
        throw new Error('Error al limpiar notificaciones antiguas');
      }

      const data = await response.json();
      console.log(`✅ ${data.eliminadas} notificaciones antiguas eliminadas`);
      
      // Recargar notificaciones
      await cargarNotificaciones(usuarioActual);
    } catch (error) {
      console.error('❌ Error limpiando notificaciones antiguas:', error);
    }
  };

  // ⚙️ Actualizar preferencias
  const actualizarPreferencias = async (nuevasPreferencias: Partial<PreferenciasNotificacion>) => {
    if (!usuarioActual) return;
    
    try {
      console.log('⚙️ Actualizando preferencias de notificación');

      const preferenciasFinal = {
        ...preferencias,
        ...nuevasPreferencias,
        usuarioId: usuarioActual,
        fechaActualizacion: new Date().toISOString()
      };

      const response = await fetch(`${API_URL}/notificaciones/preferencias`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${publicAnonKey}`
        },
        body: JSON.stringify(preferenciasFinal)
      });

      if (!response.ok) {
        throw new Error('Error al actualizar preferencias');
      }

      setPreferencias(preferenciasFinal);
      console.log('✅ Preferencias actualizadas');
    } catch (error) {
      console.error('❌ Error actualizando preferencias:', error);
    }
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
