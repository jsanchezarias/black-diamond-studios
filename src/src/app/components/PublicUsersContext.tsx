import { createContext, useContext, useState, useEffect, ReactNode, useRef, useCallback } from 'react';
import { flushSync } from 'react-dom';
import { supabase, projectId, publicAnonKey } from '../../utils/supabase/info'; // ✅ Corregido: ruta correcta

// ============================================
// CONTEXTO PARA USUARIOS PÚBLICOS DEL CHAT
// ============================================
// 🔥 ÚNICA FUENTE DE VERDAD: Supabase (tabla clientes)
// ✅ NO usa localStorage para lógica de negocio
// ✅ Usa Realtime para detectar cambios de sesión
// ✅ Sesión almacenada en columnas de la tabla clientes
// ============================================

interface PublicUser {
  id: string; // UUID de Supabase
  username: string;
  telefono: string; // Teléfono como identificador principal
  registeredAt: Date;
  avatar?: string;
  isVIP?: boolean;
  role?: 'user' | 'programador'; // Rol del usuario
}

interface ChatMessage {
  id: string;
  username: string;
  message: string;
  timestamp: Date;
  isVIP?: boolean;
  color?: string;
  userId?: string; // ID del usuario que envió el mensaje
  receiverId?: string; // ID del usuario que recibe el mensaje (para conversaciones privadas)
  role?: 'user' | 'programador' | 'system'; // Rol del usuario
}

interface PublicUsersContextType {
  currentUser: PublicUser | null;
  logout: () => Promise<void>; // ✅ Cambiar a async
  sendMessage: (message: string, receiverId?: string) => Promise<void>;
  messages: ChatMessage[];
  onlineUsers?: number;
  getVisibleMessages?: () => ChatMessage[]; // Obtiene mensajes según permisos
  logoutRef?: React.MutableRefObject<(() => Promise<void>) | undefined>; // ✅ Exportar ref
}

const PublicUsersContext = createContext<PublicUsersContextType | undefined>(undefined);

const PROGRAMADOR_EMAIL = 'programador@app.com'; // Email del usuario programador del chat

export function PublicUsersProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<PublicUser | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [onlineUsers, setOnlineUsers] = useState(0);

  // ============================================
  // 🆕 TIMER DE INACTIVIDAD (10 MINUTOS)
  // ============================================
  const TIMEOUT_INACTIVIDAD = 10 * 60 * 1000; // 10 minutos en milisegundos
  const inactivityTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastActivityRef = useRef<number>(Date.now());
  const currentUserRef = useRef<PublicUser | null>(null);
  const logoutRef = useRef<() => Promise<void>>();
  const isLoggingOutRef = useRef<boolean>(false); // 🆕 Bandera para evitar doble logout

  // Mantener refs sincronizadas
  useEffect(() => {
    currentUserRef.current = currentUser;
  }, [currentUser]);

  // Efecto para detectar actividad del usuario
  useEffect(() => {
    if (!currentUser) {
      // Limpiar timer si no hay usuario
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current);
        inactivityTimerRef.current = null;
      }
      return;
    }

    // Función para resetear el timer de inactividad
    const resetInactivityTimer = () => {
      lastActivityRef.current = Date.now();
      
      // Limpiar timer existente
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current);
      }

      // Solo crear nuevo timer si hay usuario logueado
      if (currentUserRef.current) {
        console.log('⏱️ Timer de inactividad reseteado');
        
        inactivityTimerRef.current = setTimeout(() => {
          console.log('⏰ 10 minutos de inactividad, cerrando sesión automáticamente...');
          // Usar la función logout actual
          if (logoutRef.current) {
            logoutRef.current();
          }
        }, TIMEOUT_INACTIVIDAD);
      }
    };

    // Iniciar timer cuando el usuario se loguea
    resetInactivityTimer();

    // Eventos que cuentan como "actividad"
    const activityEvents = [
      'mousedown',
      'mousemove',
      'keypress',
      'scroll',
      'touchstart',
      'click'
    ];

    // Throttle para evitar resetear el timer demasiado frecuentemente
    let throttleTimeout: NodeJS.Timeout | null = null;
    
    const handleActivity = () => {
      if (!throttleTimeout) {
        throttleTimeout = setTimeout(() => {
          resetInactivityTimer();
          throttleTimeout = null;
        }, 1000); // Solo resetear cada 1 segundo máximo
      }
    };

    // Agregar listeners de actividad
    activityEvents.forEach(event => {
      window.addEventListener(event, handleActivity, { passive: true });
    });

    // Cleanup
    return () => {
      activityEvents.forEach(event => {
        window.removeEventListener(event, handleActivity);
      });
      
      if (throttleTimeout) {
        clearTimeout(throttleTimeout);
      }
      
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current);
      }
    };
  }, [currentUser]); // Dependencia en currentUser

  // ============================================
  // CARGAR SESIÓN ACTIVA DESDE TABLA CLIENTES
  // ============================================
  const loadActiveSession = async (isMounted: () => boolean) => {
    try {
      console.log('🔍 Buscando sesión activa en tabla clientes...');
      
      // Buscar cliente con sesión activa y no expirada
      const { data: clientes, error } = await supabase
        .from('clientes')
        .select('id, nombre, telefono, email, created_at, sesion_activa, sesion_expires_at')
        .eq('sesion_activa', true)
        .gt('sesion_expires_at', new Date().toISOString())
        .order('sesion_ultimo_acceso', { ascending: false })
        .limit(1);

      if (!isMounted()) {
        return null;
      }

      if (error) {
        // ✅ Ignorar TODOS los errores silenciosamente (incluyendo errores de red)
        // No hacer setState ni loggear nada que pueda causar loops
        return null;
      }

      if (!clientes || clientes.length === 0) {
        console.log('ℹ️ No hay sesión activa');
        return null;
      }

      const cliente = clientes[0];

      console.log('✅ Sesión activa encontrada para:', cliente.nombre);

      const publicUser: PublicUser = {
        id: cliente.id,
        username: cliente.nombre,
        telefono: cliente.telefono,
        registeredAt: new Date(cliente.created_at),
        avatar: undefined,
        isVIP: false,
        role: cliente.email === PROGRAMADOR_EMAIL ? 'programador' : 'user'
      };

      if (isMounted()) {
        setCurrentUser(publicUser);
      }

      // ✅ CORREGIDO: NO actualizar sesion_ultimo_acceso aquí para evitar loop infinito
      // Solo se debe actualizar cuando el usuario hace una acción real (login, enviar mensaje, etc.)
      // Si se necesita actualizar, hacerlo desde el componente que maneja la acción

      return publicUser;
    } catch (error) {
      // ✅ CRÍTICO: Ignorar TODOS los errores sin hacer setState ni logs
      // Esto previene loops infinitos cuando hay problemas de red
      return null;
    }
  };

  // ============================================
  // CARGAR MENSAJES DESDE SUPABASE
  // ============================================
  const loadMessages = async (isMounted: () => boolean) => {
    try {
      // Cargar mensajes CON JOIN para obtener nombres de clientes
      const { data, error } = await supabase
        .from('chat_mensajes_publicos')
        .select(`
          *,
          sender:sender_id(nombre, email),
          receiver:receiver_id(nombre)
        `)
        .order('created_at', { ascending: true });

      if (!isMounted()) {
        return;
      }

      if (error) {
        // Ignorar errores de red silenciosamente
        if (error.message && (
          error.message.includes('AbortError') ||
          error.message.includes('Failed to fetch') ||
          error.message.includes('fetch') ||
          error.message.includes('NetworkError')
        )) {
          // Mensaje de bienvenida por defecto (sin log de error)
          if (isMounted()) {
            setMessages([{
              id: '1',
              username: 'Sistema',
              message: '¡Bienvenidos al chat de Black Diamond! 💬 Regístrate para conversar',
              timestamp: new Date(),
              color: '#d4af37',
              role: 'system'
            }]);
          }
          return;
        }
        
        // Log solo para errores inesperados
        console.error('❌ Error cargando mensajes:', error);
        
        // Mensaje de bienvenida por defecto
        if (isMounted()) {
          setMessages([{
            id: '1',
            username: 'Sistema',
            message: '¡Bienvenidos al chat de Black Diamond! 💬 Regístrate para conversar',
            timestamp: new Date(),
            color: '#d4af37',
            role: 'system'
          }]);
        }
        return;
      }

      if (data && data.length > 0) {
        const formattedMessages = data.map(msg => ({
          id: msg.id,
          username: msg.sender?.nombre || 'Sistema',
          message: msg.message,
          timestamp: new Date(msg.created_at),
          isVIP: false,
          color: msg.color,
          userId: msg.sender_id,
          receiverId: msg.receiver_id,
          role: msg.role || (msg.sender?.email === PROGRAMADOR_EMAIL ? 'programador' : 'user')
        }));
        
        if (isMounted()) {
          setMessages(formattedMessages);
        }
      } else {
        // Mensaje de bienvenida por defecto
        if (isMounted()) {
          setMessages([{
            id: '1',
            username: 'Sistema',
            message: '¡Bienvenidos al chat de Black Diamond! 💬 Regístrate para conversar',
            timestamp: new Date(),
            color: '#d4af37',
            role: 'system'
          }]);
        }
      }
    } catch (error) {
      // Silencioso para errores de red
      const errorMessage = error instanceof Error ? error.message : '';
      if (errorMessage.includes('Failed to fetch') || 
          errorMessage.includes('fetch') ||
          errorMessage.includes('NetworkError')) {
        // No loggear nada
        return;
      }
      
      // Log solo para errores inesperados
      console.log('⚠️ Error inesperado cargando mensajes');
    }
  };

  // ============================================
  // ACTUALIZAR CONTADOR DE USUARIOS ONLINE
  // ============================================
  const updateOnlineCount = async (isMounted: () => boolean) => {
    try {
      const { data, error } = await supabase
        .from('clientes')
        .select('id', { count: 'exact' })
        .eq('sesion_activa', true)
        .gt('sesion_expires_at', new Date().toISOString())
        .gt('sesion_ultimo_acceso', new Date(Date.now() - 5 * 60 * 1000).toISOString());

      if (!isMounted()) return;

      if (!error && data) {
        setOnlineUsers(data.length);
      }
    } catch (error) {
      // Ignorar errores
    }
  };

  // ============================================
  // SUSCRIPCIÓN A CAMBIOS EN TIEMPO REAL
  // ============================================
  useEffect(() => {
    let mounted = true;
    const isMounted = () => mounted;
    
    // 🔥 Usar ref para acceder a currentUser sin causar loops
    let currentUserRef: PublicUser | null = null;

    const init = async () => {
      console.log('🚀 Inicializando PublicUsersContext...');
      
      // Cargar sesión activa
      const user = await loadActiveSession(isMounted);
      currentUserRef = user;
      
      // Cargar mensajes
      await loadMessages(isMounted);
      
      // Actualizar contador
      updateOnlineCount(isMounted);
    };

    init();

    // ✅ REALTIME: Suscripción a cambios en tabla clientes (sesiones)
    const clientesChannel = supabase
      .channel('clientes_sesiones_changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'clientes'
        },
        async (payload) => {
          // 🔍 DEBUG: Loggear el payload completo
          console.log('🔔 Payload recibido:', {
            newData: payload.new,
            oldData: payload.old,
            eventType: payload.eventType
          });
          
          // ✅ Solo procesar si sesion_activa es true
          if (!payload.new || payload.new.sesion_activa !== true) {
            console.log('⏭️ Ignorando: sesion_activa no es true');
            return;
          }
          
          // ✅ Detectar si es SOLO actualización de sesion_ultimo_acceso
          // Comparar old vs new para ver qué cambió
          if (payload.old && payload.new) {
            const oldData = payload.old as any;
            const newData = payload.new as any;
            
            // Obtener campos que cambiaron
            const changedFields = Object.keys(newData).filter(key => {
              return JSON.stringify(oldData[key]) !== JSON.stringify(newData[key]);
            });
            
            console.log('🔍 Campos que cambiaron:', changedFields);
            
            // Si SOLO cambió sesion_ultimo_acceso, ignorar
            if (changedFields.length === 1 && changedFields[0] === 'sesion_ultimo_acceso') {
              console.log('⏭️ Ignorando: solo cambió sesion_ultimo_acceso');
              return;
            }
            
            // Si solo cambiaron campos de tiempo, ignorar
            const timeFields = ['sesion_ultimo_acceso', 'updated_at'];
            const nonTimeChanges = changedFields.filter(f => !timeFields.includes(f));
            
            if (nonTimeChanges.length === 0) {
              console.log('⏭️ Ignorando: solo cambiaron campos de tiempo');
              return;
            }
          }
          
          console.log('✅ Recargando sesión activa...');
          // Recargar sesión
          const user = await loadActiveSession(isMounted);
          currentUserRef = user;
          
          // ✅ También recargar mensajes y contador cuando detectamos un login
          if (user) {
            console.log('🔄 Login detectado, recargando mensajes y contador...');
            await loadMessages(isMounted);
            await updateOnlineCount(isMounted);
          }
        }
      )
      .subscribe();

    // ✅ REALTIME: Suscripción a nuevos mensajes
    const mensajesChannel = supabase
      .channel('chat_mensajes_publicos_changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_mensajes_publicos'
        },
        () => {
          console.log('💬 Nuevo mensaje recibido, recargando mensajes...');
          loadMessages(isMounted);
        }
      )
      .subscribe();

    // Actualizar contador de usuarios online cada 30 segundos
    const interval = setInterval(() => updateOnlineCount(isMounted), 30000);

    // ============================================
    // 🆕 CIERRE DE SESIÓN AUTOMÁTICO AL SALIR
    // ============================================
    const handleBeforeUnload = async () => {
      // Usar ref en lugar del estado para evitar dependencias
      if (currentUserRef) {
        console.log('🚪 Usuario abandonando la página, cerrando sesión...');
        
        // 🆕 Archivar conversación antes de cerrar
        try {
          // Obtener mensajes para archivar (síncrono con fetch porque sendBeacon no soporta esto)
          const response = await fetch(
            `${supabase.supabaseUrl}/rest/v1/chat_mensajes_publicos?or=(sender_id.eq.${currentUserRef.id},receiver_id.eq.${currentUserRef.id})&select=*,sender:sender_id(nombre),receiver:receiver_id(nombre)&order=created_at.asc`,
            {
              headers: {
                'apikey': supabase.supabaseKey,
                'Authorization': `Bearer ${supabase.supabaseKey}`
              }
            }
          );
          
          const mensajes = await response.json();
          
          if (mensajes && mensajes.length > 0) {
            // Formatear conversación
            const conversacionTexto = mensajes.map((msg: any) => {
              const fecha = new Date(msg.created_at).toLocaleString('es-CO');
              const remitente = msg.sender?.nombre || 'Usuario';
              return `[${fecha}] ${remitente}: ${msg.message}`;
            }).join('\n');
            
            // Guardar historial usando sendBeacon
            const historialPayload = new FormData();
            historialPayload.append('ultima_conversacion', conversacionTexto);
            historialPayload.append('ultima_conversacion_fecha', new Date().toISOString());
            
            navigator.sendBeacon(
              `${supabase.supabaseUrl}/rest/v1/clientes?id=eq.${currentUserRef.id}`,
              new Blob([JSON.stringify({
                ultima_conversacion: conversacionTexto,
                ultima_conversacion_fecha: new Date().toISOString()
              })], { type: 'application/json' })
            );
            
            // Eliminar mensajes del chat activo
            navigator.sendBeacon(
              `${supabase.supabaseUrl}/rest/v1/chat_mensajes_publicos?or=(sender_id.eq.${currentUserRef.id},receiver_id.eq.${currentUserRef.id})`,
              new Blob([JSON.stringify({})], { type: 'application/json' })
            );
          }
        } catch (error) {
          console.error('Error archivando al cerrar:', error);
        }
        
        // Marcar sesión como inactiva
        navigator.sendBeacon(
          `${supabase.supabaseUrl}/rest/v1/clientes?id=eq.${currentUserRef.id}`,
          new Blob([JSON.stringify({
            sesion_activa: false,
            sesion_token: null,
            sesion_expires_at: null
          })], { type: 'application/json' })
        );
      }
    };

    // Eventos para detectar cuando el usuario abandona la página
    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('unload', handleBeforeUnload);

    return () => {
      console.log('🧹 Limpiando suscripciones...');
      mounted = false;
      supabase.removeChannel(clientesChannel);
      supabase.removeChannel(mensajesChannel);
      clearInterval(interval);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('unload', handleBeforeUnload);
    };
  }, []); // 🔥 Sin dependencias para evitar loops

  // ============================================
  // LOGOUT
  // ============================================
  const logout = useCallback(async () => {
    // 🆕 Verificar si ya se está ejecutando logout
    if (isLoggingOutRef.current) {
      console.log('⏭️ Logout ya en progreso, ignorando...');
      return;
    }
    
    // ✅ USAR REF en lugar del estado para evitar stale closures
    const user = currentUserRef.current;
    
    console.log('🚪 Logout llamado, usuario actual:', user);
    
    if (!user) {
      console.log('⚠️ No hay sesión activa para cerrar');
      return;
    }

    // 🆕 Marcar que logout está en progreso INMEDIATAMENTE
    isLoggingOutRef.current = true;

    const userId = user.id; // Guardar ID antes de limpiar estado
    console.log('🚪 Iniciando logout para cliente:', userId);
    
    // ✅ PASO 1: Limpiar estado local INMEDIATAMENTE CON flushSync
    console.log('🧹 Limpiando estado local...');
    
    // Limpiar PRIMERO el ref
    currentUserRef.current = null;
    
    // 🆕 Usar flushSync para forzar actualización sincrónica del estado
    flushSync(() => {
      setCurrentUser(null);
      setOnlineUsers(0);
      setMessages([{
        id: '1',
        username: 'Sistema',
        message: '¡Bienvenidos al chat de Black Diamond! 💬 Regístrate para conversar',
        timestamp: new Date(),
        color: '#d4af37',
        role: 'system'
      }]);
    });
    
    // 🆕 El estado ya está actualizado SINCRÓNICAMENTE, resetear bandera
    isLoggingOutRef.current = false;
    console.log('✅ Sesión cerrada localmente y bandera reseteada');

    // ✅ PASO 2: Actualizar BD en background (NO BLOQUEAR)
    // Usar Promise.allSettled para ejecutar ambas operaciones sin esperar
    Promise.allSettled([
      // Operación 1: Marcar sesión como inactiva
      fetch(
        `https://${projectId}.supabase.co/rest/v1/clientes?id=eq.${userId}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'apikey': publicAnonKey,
            'Authorization': `Bearer ${publicAnonKey}`,
            'Prefer': 'return=minimal'
          },
          body: JSON.stringify({
            sesion_activa: false,
            sesion_token: null,
            sesion_expires_at: new Date(Date.now() - 1000).toISOString(),
            sesion_ultimo_acceso: new Date(Date.now() - 1000).toISOString()
          })
        }
      ).then(res => {
        if (res.ok) {
          console.log('✅ Sesión marcada como inactiva en BD');
        } else {
          console.log('⚠️ No se pudo actualizar sesión en BD');
        }
      }),
      
      // Operación 2: Archivar conversación
      archivarConversacion(userId).catch(() => {
        console.log('⚠️ No se pudo archivar conversación');
      })
    ]).catch(() => {
      // Ignorar errores silenciosamente
      console.log('⚠️ Operaciones de BD completadas con errores (ignorando)');
    });
  }, []); // ✅ Sin dependencias para evitar recreación

  // ✅ Actualizar el ref cada vez que la función logout cambie
  useEffect(() => {
    logoutRef.current = logout;
  }, [logout]);

  // ============================================
  // 🆕 ARCHIVAR CONVERSACIÓN EN HISTORIAL DEL CLIENTE
  // ============================================
  const archivarConversacion = async (clienteId: string) => {
    try {
      console.log('📦 Archivando conversación del cliente:', clienteId);

      // 1. Obtener todos los mensajes del cliente
      const { data: mensajes, error: mensajesError } = await supabase
        .from('chat_mensajes_publicos')
        .select(`
          id,
          message,
          created_at,
          sender_id,
          receiver_id,
          role,
          sender:sender_id(nombre),
          receiver:receiver_id(nombre)
        `)
        .or(`sender_id.eq.${clienteId},receiver_id.eq.${clienteId}`)
        .order('created_at', { ascending: true });

      if (mensajesError) {
        console.error('❌ Error obteniendo mensajes para archivar:', {
          message: mensajesError.message,
          details: mensajesError.details || 'Sin detalles adicionales',
          hint: mensajesError.hint || 'Verificar conexión y permisos',
          code: mensajesError.code || ''
        });
        return;
      }

      if (!mensajes || mensajes.length === 0) {
        console.log('ℹ️ No hay mensajes para archivar');
        return;
      }

      // 2. Formatear conversación para el historial
      const conversacionTexto = mensajes.map(msg => {
        const fecha = new Date(msg.created_at).toLocaleString('es-CO');
        const remitente = msg.sender?.nombre || 'Usuario';
        return `[${fecha}] ${remitente}: ${msg.message}`;
      }).join('\\n');

      // 3. Guardar en el historial del cliente
      const { error: historialError } = await supabase
        .from('clientes')
        .update({
          ultima_conversacion: conversacionTexto,
          ultima_conversacion_fecha: new Date().toISOString()
        })
        .eq('id', clienteId);

      if (historialError) {
        // ✅ Manejo silencioso de errores de red (desarrollo/testing)
        if (historialError.message?.includes('Failed to fetch') || historialError.message?.includes('NetworkError')) {
          console.warn('⚠️ Error de conexión guardando historial (modo desarrollo) - ignorando');
          return;
        }
        console.error('❌ Error guardando historial:', historialError);
        return;
      }

      console.log('✅ Conversación archivada exitosamente');

      // 4. Eliminar mensajes de la tabla activa (limpiar chat)
      const { error: deleteError } = await supabase
        .from('chat_mensajes_publicos')
        .delete()
        .or(`sender_id.eq.${clienteId},receiver_id.eq.${clienteId}`);

      if (deleteError) {
        console.error('❌ Error eliminando mensajes:', deleteError);
        return;
      }

      console.log('✅ Mensajes eliminados de chat activo');
    } catch (error: any) {
      console.error('❌ Error en proceso de archivo:', error);
    }
  };

  // ============================================
  // ENVIAR MENSAJE
  // ============================================
  const sendMessage = async (message: string, receiverId?: string) => {
    if (!currentUser || !message.trim()) return;

    // 🆕 OPTIMISTIC UPDATE: Agregar mensaje localmente de inmediato
    const tempMessage: ChatMessage = {
      id: `temp-${Date.now()}`,
      username: currentUser.username,
      message: message.trim(),
      timestamp: new Date(),
      isVIP: currentUser.isVIP,
      color: currentUser.role === 'programador' ? '#d4af37' : '#ffffff',
      userId: currentUser.id,
      receiverId: receiverId,
      role: currentUser.role || 'user'
    };

    // Agregar mensaje temporalmente al estado
    setMessages(prev => [...prev, tempMessage]);

    try {
      console.log('📤 Enviando mensaje...', { userId: currentUser.id, message, receiverId });
      
      // Determinar receiverId
      let finalReceiverId = receiverId;

      // Si es usuario normal, siempre envía a la programadora
      if (currentUser.role === 'user' && !receiverId) {
        // ✅ NO usar abortSignal aquí
        const { data: programador, error: programadorError } = await supabase
          .from('clientes')
          .select('id')
          .eq('email', PROGRAMADOR_EMAIL)
          .maybeSingle(); // ✅ Usar maybeSingle en lugar de single

        if (programadorError) {
          console.warn('⚠️ Error buscando programador:', programadorError);
        } else if (programador) {
          finalReceiverId = programador.id;
          console.log('📩 Mensaje dirigido a programador:', programador.id);
        }
      }

      // Actualizar el receiverId del mensaje temporal
      setMessages(prev => prev.map(m => 
        m.id === tempMessage.id 
          ? { ...m, receiverId: finalReceiverId }
          : m
      ));

      const newMessage = {
        sender_id: currentUser.id,
        receiver_id: finalReceiverId || null,
        message: message.trim(),
        is_read: false,
        role: currentUser.role || 'user',
        color: currentUser.role === 'programador' ? '#d4af37' : '#ffffff'
      };

      console.log('📝 Insertando mensaje en BD:', newMessage);

      // ✅ Simplificar: solo hacer el insert sin race/timeout
      const { error, data } = await supabase
        .from('chat_mensajes_publicos')
        .insert(newMessage)
        .select();

      if (error) {
        console.error('❌ Error enviando mensaje:', error);
        // Remover mensaje temporal en caso de error
        setMessages(prev => prev.filter(m => m.id !== tempMessage.id));
        alert(`Error al enviar mensaje: ${error.message}`);
        return;
      }

      console.log('✅ Mensaje insertado en BD:', data);
      
      // Actualizar el ID temporal con el ID real
      if (data && data[0]) {
        setMessages(prev => prev.map(m => 
          m.id === tempMessage.id 
            ? { ...m, id: data[0].id }
            : m
        ));
      }

    } catch (error: any) {
      console.error('❌ Error enviando mensaje:', error);
      
      // Remover mensaje temporal
      setMessages(prev => prev.filter(m => m.id !== tempMessage.id));
      
      alert(`❌ Error: ${error.message || 'Error desconocido'}\n\n💡 Intenta de nuevo.`);
    }
  };

  // ============================================
  // FUNCIÓN PARA OBTENER MENSAJES VISIBLES
  // ============================================
  const getVisibleMessages = (): ChatMessage[] => {
    if (!currentUser) {
      // Usuario no autenticado: solo ve mensajes del sistema
      return messages.filter(msg => msg.role === 'system');
    }

    if (currentUser.role === 'programador') {
      // Programadora ve TODOS los mensajes
      return messages;
    }

    // Usuario normal: ve solo mensajes del sistema y su conversación privada
    return messages.filter(msg => 
      msg.role === 'system' ||
      msg.userId === currentUser.id ||
      msg.receiverId === currentUser.id
    );
  };

  return (
    <PublicUsersContext.Provider
      value={{
        currentUser,
        logout,
        sendMessage,
        messages,
        onlineUsers,
        getVisibleMessages,
        logoutRef
      }}
    >
      {children}
    </PublicUsersContext.Provider>
  );
}

export function usePublicUsers() {
  const context = useContext(PublicUsersContext);
  
  if (context === undefined) {
    console.warn('usePublicUsers debe usarse dentro de PublicUsersProvider');
    // Retornar un contexto vacío seguro en lugar de lanzar error
    return {
      users: [],
      loading: false,
      error: null,
      adminUsers: [],
      programadorUsers: [],
      ownerUsers: [],
      modeloUsers: [],
      addUser: async () => {},
      updateUser: async () => {},
      deleteUser: async () => {},
      refreshUsers: async () => {},
    } as PublicUsersContextType;
  }
  
  return context;
}