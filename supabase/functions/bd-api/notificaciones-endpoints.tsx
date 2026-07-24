import { Hono } from 'npm:hono';
import * as kv from './kv_store.tsx';

const app = new Hono();

// 🔔 TIPOS Y UTILIDADES

interface Notificacion {
  id: string;
  usuarioId: string;
  usuarioEmail: string;
  tipo: string;
  titulo: string;
  mensaje: string;
  icono?: string;
  leida: boolean;
  fechaLectura?: string;
  accion?: {
    tipo: 'navegar' | 'modal' | 'ninguna';
    destino?: string;
    datos?: Record<string, any>;
  };
  urlDestino?: string;
  prioridad: 'baja' | 'media' | 'alta' | 'urgente';
  fechaCreacion: string;
  creadoPor: string;
  expiraEn?: string;
}

interface PreferenciasNotificacion {
  usuarioId: string;
  enApp: boolean;
  push: boolean;
  email: boolean;
  sms: boolean;
  notificarAgendamientos: boolean;
  notificarPagos: boolean;
  notificarMultas: boolean;
  notificarServicios: boolean;
  notificarSistema: boolean;
  notificarMarketing: boolean;
  horaInicioSilencio?: string;
  horaFinSilencio?: string;
  diasSilencio?: string[];
  fechaActualizacion: string;
}

// 📊 GET /notificaciones - Obtener notificaciones de un usuario
app.get('/', async (c) => {
  try {
    const usuarioId = c.req.query('usuarioId');

    if (!usuarioId) {
      return c.json({ error: 'usuarioId es requerido' }, 400);
    }

    console.log('🔄 Obteniendo notificaciones para usuario:', usuarioId);

    // Obtener todas las notificaciones del usuario
    const todasNotificaciones = await kv.getByPrefix(`notificacion:${usuarioId}:`);
    
    // Filtrar notificaciones expiradas
    const notificacionesValidas = todasNotificaciones.filter((n: Notificacion) => {
      if (!n.expiraEn) return true;
      return new Date(n.expiraEn) > new Date();
    });

    // Ordenar por fecha de creación (más recientes primero)
    const notificacionesOrdenadas = notificacionesValidas.sort((a: Notificacion, b: Notificacion) => 
      new Date(b.fechaCreacion).getTime() - new Date(a.fechaCreacion).getTime()
    );

    console.log(`✅ ${notificacionesOrdenadas.length} notificaciones obtenidas`);

    return c.json({
      notificaciones: notificacionesOrdenadas,
      total: notificacionesOrdenadas.length,
      noLeidas: notificacionesOrdenadas.filter((n: Notificacion) => !n.leida).length
    });
  } catch (error) {
    console.error('❌ Error obteniendo notificaciones:', error);
    return c.json({ error: 'Error al obtener notificaciones', detalle: String(error) }, 500);
  }
});

// 📝 POST /notificaciones - Crear nueva notificación
app.post('/', async (c) => {
  try {
    const body = await c.req.json();
    const { usuarioId, usuarioEmail, tipo, titulo, mensaje, icono, accion, urlDestino, prioridad, creadoPor, expiraEn } = body;

    // Validaciones
    if (!usuarioId || !usuarioEmail || !tipo || !titulo || !mensaje) {
      return c.json({ 
        error: 'Faltan campos requeridos',
        requeridos: ['usuarioId', 'usuarioEmail', 'tipo', 'titulo', 'mensaje']
      }, 400);
    }

    console.log('📝 Creando notificación tipo:', tipo, 'para usuario:', usuarioEmail);

    // Generar ID único
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    const id = `notificacion_${timestamp}_${random}`;

    // Crear notificación
    const notificacion: Notificacion = {
      id,
      usuarioId,
      usuarioEmail,
      tipo,
      titulo,
      mensaje,
      icono,
      leida: false,
      accion,
      urlDestino,
      prioridad: prioridad || 'media',
      fechaCreacion: new Date().toISOString(),
      creadoPor: creadoPor || 'sistema',
      expiraEn
    };

    // Guardar en KV Store
    const key = `notificacion:${usuarioId}:${id}`;
    await kv.set(key, notificacion);

    console.log('✅ Notificación creada exitosamente:', id);

    return c.json({
      success: true,
      mensaje: 'Notificación creada exitosamente',
      notificacion
    }, 201);
  } catch (error) {
    console.error('❌ Error creando notificación:', error);
    return c.json({ error: 'Error al crear notificación', detalle: String(error) }, 500);
  }
});

// ✅ PUT /notificaciones/:id/marcar-leida - Marcar notificación como leída
app.put('/:id/marcar-leida', async (c) => {
  try {
    const id = c.req.param('id');

    console.log('✅ Marcando notificación como leída:', id);

    // Buscar la notificación
    const todasNotificaciones = await kv.getByPrefix(`notificacion:`);
    const notificacion = todasNotificaciones.find((n: Notificacion) => n.id === id);

    if (!notificacion) {
      return c.json({ error: 'Notificación no encontrada' }, 404);
    }

    // Actualizar estado
    notificacion.leida = true;
    notificacion.fechaLectura = new Date().toISOString();

    // Guardar cambios
    const key = `notificacion:${notificacion.usuarioId}:${id}`;
    await kv.set(key, notificacion);

    console.log('✅ Notificación marcada como leída');

    return c.json({
      success: true,
      mensaje: 'Notificación marcada como leída',
      notificacion
    });
  } catch (error) {
    console.error('❌ Error marcando notificación como leída:', error);
    return c.json({ error: 'Error al marcar notificación como leída', detalle: String(error) }, 500);
  }
});

// ✅ PUT /notificaciones/marcar-todas-leidas - Marcar todas como leídas
app.put('/marcar-todas-leidas', async (c) => {
  try {
    const body = await c.req.json();
    const { usuarioId } = body;

    if (!usuarioId) {
      return c.json({ error: 'usuarioId es requerido' }, 400);
    }

    console.log('✅ Marcando todas las notificaciones como leídas para:', usuarioId);

    // Obtener todas las notificaciones del usuario
    const notificaciones = await kv.getByPrefix(`notificacion:${usuarioId}:`);
    
    let actualizadas = 0;
    const fechaLectura = new Date().toISOString();

    // Actualizar cada notificación no leída
    for (const notificacion of notificaciones) {
      if (!notificacion.leida) {
        notificacion.leida = true;
        notificacion.fechaLectura = fechaLectura;
        
        const key = `notificacion:${usuarioId}:${notificacion.id}`;
        await kv.set(key, notificacion);
        actualizadas++;
      }
    }

    console.log(`✅ ${actualizadas} notificaciones marcadas como leídas`);

    return c.json({
      success: true,
      mensaje: `${actualizadas} notificaciones marcadas como leídas`,
      actualizadas
    });
  } catch (error) {
    console.error('❌ Error marcando todas como leídas:', error);
    return c.json({ error: 'Error al marcar todas como leídas', detalle: String(error) }, 500);
  }
});

// 🗑️ DELETE /notificaciones/:id - Eliminar notificación
app.delete('/:id', async (c) => {
  try {
    const id = c.req.param('id');

    console.log('🗑️ Eliminando notificación:', id);

    // Buscar la notificación para obtener el usuarioId
    const todasNotificaciones = await kv.getByPrefix(`notificacion:`);
    const notificacion = todasNotificaciones.find((n: Notificacion) => n.id === id);

    if (!notificacion) {
      return c.json({ error: 'Notificación no encontrada' }, 404);
    }

    // Eliminar
    const key = `notificacion:${notificacion.usuarioId}:${id}`;
    await kv.del(key);

    console.log('✅ Notificación eliminada');

    return c.json({
      success: true,
      mensaje: 'Notificación eliminada exitosamente'
    });
  } catch (error) {
    console.error('❌ Error eliminando notificación:', error);
    return c.json({ error: 'Error al eliminar notificación', detalle: String(error) }, 500);
  }
});

// 🧹 DELETE /notificaciones/limpiar-antiguas - Limpiar notificaciones antiguas
app.delete('/limpiar-antiguas', async (c) => {
  try {
    const body = await c.req.json();
    const { usuarioId, diasAntiguedad = 30 } = body;

    if (!usuarioId) {
      return c.json({ error: 'usuarioId es requerido' }, 400);
    }

    console.log(`🧹 Limpiando notificaciones de más de ${diasAntiguedad} días para usuario:`, usuarioId);

    const fechaLimite = new Date();
    fechaLimite.setDate(fechaLimite.getDate() - diasAntiguedad);

    // Obtener todas las notificaciones del usuario
    const notificaciones = await kv.getByPrefix(`notificacion:${usuarioId}:`);
    
    let eliminadas = 0;

    // Eliminar las que son más antiguas que la fecha límite
    for (const notificacion of notificaciones) {
      const fechaCreacion = new Date(notificacion.fechaCreacion);
      
      if (fechaCreacion < fechaLimite) {
        const key = `notificacion:${usuarioId}:${notificacion.id}`;
        await kv.del(key);
        eliminadas++;
      }
    }

    console.log(`✅ ${eliminadas} notificaciones antiguas eliminadas`);

    return c.json({
      success: true,
      mensaje: `${eliminadas} notificaciones antiguas eliminadas`,
      eliminadas
    });
  } catch (error) {
    console.error('❌ Error limpiando notificaciones antiguas:', error);
    return c.json({ error: 'Error al limpiar notificaciones antiguas', detalle: String(error) }, 500);
  }
});

// ⚙️ GET /notificaciones/preferencias - Obtener preferencias de notificación
app.get('/preferencias', async (c) => {
  try {
    const usuarioId = c.req.query('usuarioId');

    if (!usuarioId) {
      return c.json({ error: 'usuarioId es requerido' }, 400);
    }

    console.log('🔄 Obteniendo preferencias de notificación para:', usuarioId);

    const key = `preferencias_notificacion:${usuarioId}`;
    const preferencias = await kv.get(key);

    if (!preferencias) {
      console.log('⚠️ No se encontraron preferencias, devolviendo por defecto');
      return c.json({ 
        preferencias: null,
        mensaje: 'No se encontraron preferencias'
      }, 404);
    }

    console.log('✅ Preferencias obtenidas');

    return c.json({ preferencias });
  } catch (error) {
    console.error('❌ Error obteniendo preferencias:', error);
    return c.json({ error: 'Error al obtener preferencias', detalle: String(error) }, 500);
  }
});

// ⚙️ PUT /notificaciones/preferencias - Actualizar preferencias de notificación
app.put('/preferencias', async (c) => {
  try {
    const body = await c.req.json();
    const { usuarioId } = body;

    if (!usuarioId) {
      return c.json({ error: 'usuarioId es requerido' }, 400);
    }

    console.log('⚙️ Actualizando preferencias de notificación para:', usuarioId);

    // Agregar timestamp de actualización
    const preferencias: PreferenciasNotificacion = {
      ...body,
      fechaActualizacion: new Date().toISOString()
    };

    // Guardar preferencias
    const key = `preferencias_notificacion:${usuarioId}`;
    await kv.set(key, preferencias);

    console.log('✅ Preferencias actualizadas exitosamente');

    return c.json({
      success: true,
      mensaje: 'Preferencias actualizadas exitosamente',
      preferencias
    });
  } catch (error) {
    console.error('❌ Error actualizando preferencias:', error);
    return c.json({ error: 'Error al actualizar preferencias', detalle: String(error) }, 500);
  }
});

// 📊 GET /notificaciones/estadisticas - Obtener estadísticas de notificaciones
app.get('/estadisticas', async (c) => {
  try {
    const usuarioId = c.req.query('usuarioId');

    if (!usuarioId) {
      return c.json({ error: 'usuarioId es requerido' }, 400);
    }

    console.log('📊 Obteniendo estadísticas de notificaciones para:', usuarioId);

    const notificaciones = await kv.getByPrefix(`notificacion:${usuarioId}:`);
    
    const estadisticas = {
      total: notificaciones.length,
      leidas: notificaciones.filter((n: Notificacion) => n.leida).length,
      noLeidas: notificaciones.filter((n: Notificacion) => !n.leida).length,
      porPrioridad: {
        baja: notificaciones.filter((n: Notificacion) => n.prioridad === 'baja').length,
        media: notificaciones.filter((n: Notificacion) => n.prioridad === 'media').length,
        alta: notificaciones.filter((n: Notificacion) => n.prioridad === 'alta').length,
        urgente: notificaciones.filter((n: Notificacion) => n.prioridad === 'urgente').length
      },
      porTipo: {} as Record<string, number>
    };

    // Contar por tipo
    notificaciones.forEach((n: Notificacion) => {
      if (!estadisticas.porTipo[n.tipo]) {
        estadisticas.porTipo[n.tipo] = 0;
      }
      estadisticas.porTipo[n.tipo]++;
    });

    console.log('✅ Estadísticas calculadas');

    return c.json({ estadisticas });
  } catch (error) {
    console.error('❌ Error obteniendo estadísticas:', error);
    return c.json({ error: 'Error al obtener estadísticas', detalle: String(error) }, 500);
  }
});

// 🔴 GET /notificaciones/realtime - Server-Sent Events (SSE) para notificaciones en tiempo real
app.get('/realtime', async (c) => {
  const usuarioId = c.req.query('usuarioId');

  if (!usuarioId) {
    return c.json({ error: 'usuarioId es requerido' }, 400);
  }

  console.log('🔴 Cliente SSE conectado:', usuarioId);

  // Configurar headers para SSE
  c.header('Content-Type', 'text/event-stream');
  c.header('Cache-Control', 'no-cache');
  c.header('Connection', 'keep-alive');

  const stream = c.req.raw.body;
  
  // Enviar heartbeat cada 30 segundos para mantener conexión viva
  const heartbeatInterval = setInterval(() => {
    try {
      c.res = new Response(': heartbeat\n\n');
    } catch (error) {
      clearInterval(heartbeatInterval);
    }
  }, 30000);

  // Nota: En un entorno de producción real, aquí implementarías:
  // 1. Suscripción a Supabase Realtime
  // 2. Escuchar cambios en la tabla de notificaciones
  // 3. Enviar eventos SSE cuando haya nuevas notificaciones
  
  // Por ahora, esto establece la infraestructura básica
  // El polling desde el cliente será el método principal

  return c.text(':connected\n\n');
});

export default app;