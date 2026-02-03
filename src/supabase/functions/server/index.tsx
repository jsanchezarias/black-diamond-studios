import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import { createClient } from "npm:@supabase/supabase-js@2";
import * as kv from "./kv_store.tsx";
import * as uploadModelos from "./upload-modelos-fotos.tsx";
const app = new Hono();

// Enable logger
app.use('*', logger(console.log));

// Enable CORS for all routes and methods
app.use(
  "/*",
  cors({
    origin: "*",
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
  }),
);

// Health check endpoint
app.get("/make-server-9dadc017/health", (c) => {
  return c.json({ status: "ok" });
});

// ==================== STREAMING ENDPOINTS ====================

// Crear una nueva sesión de streaming
app.post("/make-server-9dadc017/streaming/create", async (c) => {
  try {
    const body = await c.req.json();
    const { modelId, modelName, streamKey } = body;

    if (!modelId || !modelName) {
      return c.json({ error: "modelId y modelName son requeridos" }, 400);
    }

    const sessionId = `stream_${Date.now()}_${modelId}`;
    const streamData = {
      id: sessionId,
      modelId,
      modelName,
      streamKey: streamKey || `key_${Math.random().toString(36).substring(7)}`,
      status: "active",
      startedAt: new Date().toISOString(),
      viewers: 0,
      streamUrl: "", // Se actualizará cuando se integre el servicio real
    };

    await kv.set(`streaming:session:${sessionId}`, streamData);
    await kv.set(`streaming:active:${modelId}`, sessionId);

    console.log(`✅ Sesión de streaming creada: ${sessionId} para modelo ${modelName}`);
    return c.json({ success: true, session: streamData });
  } catch (error) {
    console.error(`❌ Error al crear sesión de streaming: ${error}`);
    return c.json({ error: error.message }, 500);
  }
});

// Obtener sesión de streaming activa de un modelo
app.get("/make-server-9dadc017/streaming/active/:modelId", async (c) => {
  try {
    const modelId = c.req.param("modelId");
    const sessionId = await kv.get(`streaming:active:${modelId}`);
    
    if (!sessionId) {
      return c.json({ active: false, session: null });
    }

    const session = await kv.get(`streaming:session:${sessionId}`);
    return c.json({ active: true, session });
  } catch (error) {
    console.error(`❌ Error al obtener sesión activa: ${error}`);
    return c.json({ error: error.message }, 500);
  }
});

// Obtener todas las sesiones activas
app.get("/make-server-9dadc017/streaming/active", async (c) => {
  try {
    const activeSessions = await kv.getByPrefix("streaming:active:");
    const sessions = [];
    
    for (const sessionId of activeSessions) {
      if (sessionId) {
        const session = await kv.get(`streaming:session:${sessionId}`);
        if (session) {
          sessions.push(session);
        }
      }
    }

    return c.json({ sessions });
  } catch (error) {
    console.error(`❌ Error al obtener sesiones activas: ${error}`);
    return c.json({ error: error.message }, 500);
  }
});

// Finalizar sesión de streaming
app.post("/make-server-9dadc017/streaming/end/:sessionId", async (c) => {
  try {
    const sessionId = c.req.param("sessionId");
    const session = await kv.get(`streaming:session:${sessionId}`);
    
    if (!session) {
      return c.json({ error: "Sesión no encontrada" }, 404);
    }

    session.status = "ended";
    session.endedAt = new Date().toISOString();
    
    await kv.set(`streaming:session:${sessionId}`, session);
    await kv.del(`streaming:active:${session.modelId}`);

    console.log(`✅ Sesión de streaming finalizada: ${sessionId}`);
    return c.json({ success: true, session });
  } catch (error) {
    console.error(`❌ Error al finalizar sesión: ${error}`);
    return c.json({ error: error.message }, 500);
  }
});

// Actualizar conteo de viewers
app.post("/make-server-9dadc017/streaming/viewers/:sessionId", async (c) => {
  try {
    const sessionId = c.req.param("sessionId");
    const body = await c.req.json();
    const { viewers } = body;

    const session = await kv.get(`streaming:session:${sessionId}`);
    if (!session) {
      return c.json({ error: "Sesión no encontrada" }, 404);
    }

    session.viewers = viewers;
    await kv.set(`streaming:session:${sessionId}`, session);

    return c.json({ success: true, viewers });
  } catch (error) {
    console.error(`❌ Error al actualizar viewers: ${error}`);
    return c.json({ error: error.message }, 500);
  }
});

// Actualizar URL del stream (para cuando se integre servicio externo)
app.post("/make-server-9dadc017/streaming/update-url/:sessionId", async (c) => {
  try {
    const sessionId = c.req.param("sessionId");
    const body = await c.req.json();
    const { streamUrl } = body;

    const session = await kv.get(`streaming:session:${sessionId}`);
    if (!session) {
      return c.json({ error: "Sesión no encontrada" }, 404);
    }

    session.streamUrl = streamUrl;
    await kv.set(`streaming:session:${sessionId}`, session);

    return c.json({ success: true, session });
  } catch (error) {
    console.error(`❌ Error al actualizar URL del stream: ${error}`);
    return c.json({ error: error.message }, 500);
  }
});

// ==================== CLIENTES ENDPOINTS ====================

// Obtener todos los clientes
app.get("/make-server-9dadc017/clientes", async (c) => {
  try {
    console.log('📥 Recibiendo solicitud GET /clientes');
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    console.log('🔍 Consultando tabla clientes en Supabase...');

    const { data: clientes, error } = await supabase
      .from('clientes')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error(`❌ Error al obtener clientes de Supabase:`, error);
      console.error(`📋 Código de error:`, error.code);
      console.error(`📋 Mensaje:`, error.message);
      
      // Si la tabla no existe, devolver array vacío con advertencia
      if (error.code === 'PGRST116' || error.message.includes('relation') || error.message.includes('does not exist')) {
        console.warn('⚠️ La tabla "clientes" no existe en Supabase.');
        console.warn('📝 Por favor ejecuta el archivo: /SQL_CREAR_TABLA_CLIENTES.sql');
        console.warn('📍 Supabase Dashboard → SQL Editor → Pega el contenido → RUN');
        
        // Devolver array vacío para no romper el frontend
        return c.json([]);
      }
      
      return c.json({ error: error.message }, 500);
    }

    // Si no hay clientes aún
    if (!clientes || clientes.length === 0) {
      console.log('ℹ️ Tabla clientes existe pero está vacía. No hay clientes registrados aún.');
      return c.json([]);
    }

    // Transformar formato de Supabase a formato del frontend
    const clientesFormateados = clientes.map(cliente => ({
      id: cliente.id,
      telefono: cliente.telefono,
      nombre: cliente.nombre,
      nombreUsuario: cliente.nombre_usuario,
      email: cliente.email,
      fechaNacimiento: cliente.fecha_nacimiento,
      ciudad: cliente.ciudad,
      preferencias: cliente.preferencias,
      notas: cliente.notas,
      rating: cliente.rating ? parseFloat(cliente.rating) : undefined,
      totalServicios: cliente.total_servicios,
      totalGastado: cliente.total_gastado ? parseFloat(cliente.total_gastado) : 0,
      fechaRegistro: cliente.created_at,
      ultimaVisita: cliente.ultima_visita,
      observaciones: [],
      historialServicios: []
    }));

    console.log(`📊 Encontrados ${clientes.length} clientes en la base de datos`);
    console.log(`✅ Enviando ${clientesFormateados.length} clientes al frontend`);
    return c.json(clientesFormateados);
  } catch (error) {
    console.error(`❌ Error inesperado al obtener clientes:`, error);
    console.error(`📋 Detalles del error:`, error.message);
    console.error(`📋 Stack trace:`, error.stack);
    
    // Devolver array vacío para no romper el frontend
    return c.json([]);
  }
});

// Crear nuevo cliente (con contraseña)
app.post("/make-server-9dadc017/clientes", async (c) => {
  try {
    const body = await c.req.json();
    
    console.log(`📥 Recibiendo solicitud para crear cliente: ${body.nombre} (${body.telefono})`);
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    // Verificar si ya existe un cliente con ese teléfono
    const { data: clienteExistente } = await supabase
      .from('clientes')
      .select('telefono')
      .eq('telefono', body.telefono)
      .single();

    if (clienteExistente) {
      console.log(`⚠️ Cliente con teléfono ${body.telefono} ya existe`);
      return c.json({ error: 'Ya existe un cliente con ese teléfono' }, 400);
    }

    // Hash de contraseña: usar contraseña enviada o generar una por defecto basada en el teléfono
    const passwordToHash = body.password || `BD${body.telefono.slice(-4)}!`;
    const passwordHash = btoa(passwordToHash);
    
    console.log(`🔐 Generando contraseña hash para cliente ${body.nombre}`);
    
    const nuevoCliente = {
      telefono: body.telefono,
      nombre: body.nombre,
      nombre_usuario: body.nombreUsuario || body.nombre.toLowerCase().replace(/\s+/g, ''),
      password_hash: passwordHash,
      email: body.email || null,
      fecha_nacimiento: body.fechaNacimiento || null,
      ciudad: body.ciudad || null,
      preferencias: body.preferencias || null,
      notas: body.notas || null,
      rating: body.rating || null,
      total_servicios: 0,
      total_gastado: 0,
    };

    console.log(`💾 Insertando cliente en Supabase:`, {
      telefono: nuevoCliente.telefono,
      nombre: nuevoCliente.nombre,
      email: nuevoCliente.email,
    });

    const { data, error } = await supabase
      .from('clientes')
      .insert(nuevoCliente)
      .select()
      .single();

    if (error) {
      console.error(`❌ Error de Supabase al crear cliente:`, error);
      console.error(`📋 Detalles:`, error.message, error.code, error.hint);
      return c.json({ error: error.message }, 500);
    }

    if (!data) {
      console.error(`❌ Cliente no retornado después de inserción`);
      return c.json({ error: 'Cliente no creado correctamente' }, 500);
    }

    console.log(`✅ Cliente creado exitosamente en BD: ID ${data.id}`);

    // 📧 CREAR USUARIO EN SUPABASE AUTH Y ENVIAR EMAIL
    let authUserId = null;
    if (body.email) {
      try {
        console.log(`📧 Verificando si usuario ya existe en Auth...`);
        
        // Verificar si el usuario ya existe en Auth (método más eficiente)
        // Primero intentamos crear, si falla por duplicado, buscamos el existente
        const { data: authData, error: authError } = await supabase.auth.admin.createUser({
          email: body.email,
          password: passwordToHash,
          email_confirm: true,
          user_metadata: {
            nombre: body.nombre,
            telefono: body.telefono,
            role: 'cliente',
            nombre_usuario: body.nombreUsuario || body.nombre.toLowerCase().replace(/\s+/g, ''),
          }
        });

        if (authError && authError.message.includes('already been registered')) {
          console.log(`ℹ️ Usuario ya existe en Auth, buscando ID...`);
          
          // Buscar el usuario existente
          const { data: existingAuthUser } = await supabase.auth.admin.listUsers();
          const userExists = existingAuthUser?.users?.find(u => u.email === body.email);
          
          if (userExists) {
            console.log(`ℹ️ Usuario encontrado en Auth: ${userExists.id}`);
            authUserId = userExists.id;
            
            // Actualizar cliente con el userId de Auth existente
            await supabase
              .from('clientes')
              .update({ user_id: authUserId })
              .eq('id', data.id);
              
            console.log(`✅ Cliente vinculado con Auth userId existente: ${authUserId}`);
          }
        } else if (authError) {
          console.error(`⚠️ Error al crear usuario en Auth:`, authError.message);
          // No fallar, el cliente ya está creado en la BD
        } else {
          // Usuario creado exitosamente
          authUserId = authData.user?.id;
          console.log(`✅ Usuario nuevo creado en Auth: ${authUserId}`);
          console.log(`📧 Supabase enviará automáticamente un email de bienvenida a ${body.email}`);
          
          // Actualizar cliente con el userId de Auth - usando 'id' como PRIMARY KEY
          await supabase
            .from('clientes')
            .update({ user_id: authUserId })
            .eq('id', data.id);
            
          console.log(`✅ Cliente vinculado con Auth userId: ${authUserId}`);
        }
      } catch (emailError) {
        console.error(`⚠️ Error en proceso de Auth (cliente creado correctamente):`, emailError);
        // No fallar, el cliente principal está creado
      }
    } else {
      console.log(`ℹ️ Cliente sin email, no se envió notificación de credenciales`);
    }

    // Transformar al formato del frontend (mapear nombres de BD a nombres del frontend)
    const clienteFormateado = {
      id: data.id,  // Usar 'id' que es el PRIMARY KEY en Supabase
      telefono: data.telefono,
      nombre: data.nombre,
      nombreUsuario: data.nombre_usuario,
      email: data.email,
      userId: authUserId,
      fechaNacimiento: data.fecha_nacimiento,
      ciudad: data.ciudad,
      direccion: data.direccion,
      preferencias: data.preferencias,
      notas: data.notas,
      rating: data.rating ? parseFloat(data.rating) : undefined,
      totalServicios: data.total_servicios || 0,
      totalGastado: data.total_gastado ? parseFloat(data.total_gastado) : 0,
      fechaRegistro: data.created_at,  // 'created_at' ya existe en Supabase
      ultimaVisita: data.ultima_visita,
      observaciones: [],
      historialServicios: data.historial_servicios || []
    };

    console.log(`✅ Cliente formateado y listo para enviar al frontend`);
    return c.json(clienteFormateado);
  } catch (error) {
    console.error(`❌ Error inesperado al crear cliente:`, error);
    console.error(`📋 Stack trace:`, error.stack);
    return c.json({ error: error.message || 'Error interno del servidor' }, 500);
  }
});

// Login de cliente (validar contraseña)
app.post("/make-server-9dadc017/clientes/login", async (c) => {
  try {
    const body = await c.req.json();
    const { telefono, password } = body;
    
    if (!telefono || !password) {
      return c.json({ error: 'Teléfono y contraseña son requeridos' }, 400);
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    // Buscar cliente por teléfono
    const { data: cliente, error } = await supabase
      .from('clientes')
      .select('*')
      .eq('telefono', telefono)
      .single();

    if (error || !cliente) {
      return c.json({ error: 'Cliente no encontrado' }, 404);
    }

    // Verificar contraseña
    const passwordHash = btoa(password);
    if (cliente.password_hash !== passwordHash) {
      return c.json({ error: 'Contraseña incorrecta' }, 401);
    }

    // Transformar al formato del frontend (sin password_hash, mapear nombres de BD)
    const clienteFormateado = {
      id: cliente.id,  // Usar 'id' que es el PRIMARY KEY en Supabase
      telefono: cliente.telefono,
      nombre: cliente.nombre,
      nombreUsuario: cliente.nombre_usuario,
      email: cliente.email,
      fechaNacimiento: cliente.fecha_nacimiento,
      ciudad: cliente.ciudad,
      direccion: cliente.direccion,
      preferencias: cliente.preferencias,
      notas: cliente.notas,
      rating: cliente.rating ? parseFloat(cliente.rating) : undefined,
      totalServicios: cliente.total_servicios || 0,
      totalGastado: cliente.total_gastado ? parseFloat(cliente.total_gastado) : 0,
      fechaRegistro: cliente.created_at,  // 'created_at' ya existe en Supabase
      ultimaVisita: cliente.ultima_visita,
      observaciones: [],
      historialServicios: cliente.historial_servicios || []
    };

    console.log(`✅ Cliente autenticado: ${cliente.telefono}`);
    return c.json({ success: true, cliente: clienteFormateado });
  } catch (error) {
    console.error(`❌ Error en login de cliente: ${error}`);
    return c.json({ error: error.message }, 500);
  }
});

// Actualizar cliente
app.put("/make-server-9dadc017/clientes/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const body = await c.req.json();
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    const updateData: any = {};
    if (body.nombre) updateData.nombre = body.nombre;
    if (body.nombreUsuario) updateData.nombre_usuario = body.nombreUsuario;
    if (body.email !== undefined) updateData.email = body.email;
    if (body.fechaNacimiento !== undefined) updateData.fecha_nacimiento = body.fechaNacimiento;
    if (body.ciudad !== undefined) updateData.ciudad = body.ciudad;
    if (body.preferencias !== undefined) updateData.preferencias = body.preferencias;
    if (body.notas !== undefined) updateData.notas = body.notas;
    if (body.rating !== undefined) updateData.rating = body.rating;

    const { data, error } = await supabase
      .from('clientes')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error(`❌ Error al actualizar cliente:`, error);
      return c.json({ error: error.message }, 500);
    }

    console.log(`✅ Cliente actualizado: ${id}`);
    return c.json(data);
  } catch (error) {
    console.error(`❌ Error al actualizar cliente: ${error}`);
    return c.json({ error: error.message }, 500);
  }
});

// Obtener cliente por ID
app.get("/make-server-9dadc017/clientes/:id", async (c) => {
  try {
    const id = c.req.param("id");
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    const { data: cliente, error } = await supabase
      .from('clientes')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      console.error(`❌ Error al obtener cliente:`, error);
      return c.json({ error: "Cliente no encontrado" }, 404);
    }

    return c.json(cliente);
  } catch (error) {
    console.error(`❌ Error al obtener cliente: ${error}`);
    return c.json({ error: error.message }, 500);
  }
});

// ==================== DIAGNÓSTICO Y LIMPIEZA ====================

// 🔍 Ver usuarios huérfanos (existen en Auth pero no en tabla usuarios)
app.get("/make-server-9dadc017/diagnostico/usuarios-huerfanos", async (c) => {
  try {
    console.log('🔍 Buscando usuarios huérfanos...');
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    // 1. Obtener todos los usuarios de Auth
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
    
    if (authError) {
      console.error('❌ Error obteniendo usuarios de Auth:', authError);
      return c.json({ error: authError.message }, 500);
    }

    // 2. Obtener todos los usuarios de la tabla
    const { data: dbUsers, error: dbError } = await supabase
      .from('usuarios')
      .select('id, email, nombre, role');
    
    if (dbError) {
      console.error('❌ Error obteniendo usuarios de BD:', dbError);
      return c.json({ error: dbError.message }, 500);
    }

    // 3. Encontrar huérfanos (en Auth pero no en BD)
    const dbIds = new Set(dbUsers?.map(u => u.id) || []);
    const huerfanos = authUsers.users.filter(authUser => !dbIds.has(authUser.id));

    console.log(`📊 Total en Auth: ${authUsers.users.length}`);
    console.log(`📊 Total en BD: ${dbUsers?.length || 0}`);
    console.log(`⚠️ Huérfanos encontrados: ${huerfanos.length}`);

    return c.json({
      success: true,
      totalAuth: authUsers.users.length,
      totalBD: dbUsers?.length || 0,
      totalHuerfanos: huerfanos.length,
      huerfanos: huerfanos.map(u => ({
        id: u.id,
        email: u.email,
        created_at: u.created_at,
        metadata: u.user_metadata
      }))
    });

  } catch (error) {
    console.error('❌ Error en diagnóstico:', error);
    return c.json({ error: error.message }, 500);
  }
});

// 🧹 Limpiar usuarios huérfanos (eliminar de Auth)
app.post("/make-server-9dadc017/diagnostico/limpiar-huerfanos", async (c) => {
  try {
    console.log('🧹 Limpiando usuarios huérfanos...');
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    // 1. Obtener usuarios huérfanos
    const { data: authUsers } = await supabase.auth.admin.listUsers();
    const { data: dbUsers } = await supabase
      .from('usuarios')
      .select('id');
    
    const dbIds = new Set(dbUsers?.map(u => u.id) || []);
    const huerfanos = authUsers?.users.filter(authUser => !dbIds.has(authUser.id)) || [];

    if (huerfanos.length === 0) {
      return c.json({ success: true, mensaje: 'No hay usuarios huérfanos', eliminados: 0 });
    }

    // 2. Eliminar cada huérfano de Auth
    const resultados = [];
    let eliminados = 0;

    for (const huerfano of huerfanos) {
      try {
        const { error } = await supabase.auth.admin.deleteUser(huerfano.id);
        
        if (error) {
          console.error(`❌ Error eliminando ${huerfano.email}:`, error);
          resultados.push(`❌ ${huerfano.email}: ${error.message}`);
        } else {
          eliminados++;
          resultados.push(`✅ ${huerfano.email} eliminado de Auth`);
          console.log(`✅ Huérfano eliminado: ${huerfano.email}`);
        }
      } catch (error) {
        console.error(`❌ Error con ${huerfano.email}:`, error);
        resultados.push(`❌ ${huerfano.email}: ${error.message}`);
      }
    }

    console.log(`✅ Limpieza completada: ${eliminados}/${huerfanos.length} eliminados`);

    return c.json({
      success: true,
      totalHuerfanos: huerfanos.length,
      eliminados,
      resultados
    });

  } catch (error) {
    console.error('❌ Error limpiando huérfanos:', error);
    return c.json({ error: error.message }, 500);
  }
});

// 🔍 Ver estado completo de Supabase (Auth + BD + Storage)
app.get("/make-server-9dadc017/diagnostico/estado-completo", async (c) => {
  try {
    console.log('🔍 Obteniendo estado completo de Supabase...');
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    // 1. Auth
    const { data: authUsers } = await supabase.auth.admin.listUsers();
    
    // 2. Tabla usuarios
    const { data: dbUsers } = await supabase
      .from('usuarios')
      .select('id, email, nombre, role, estado, disponible');
    
    // 3. Storage buckets
    const { data: buckets } = await supabase.storage.listBuckets();
    
    // 4. Archivos en bucket modelos-fotos
    let archivosStorage = 0;
    try {
      const { data: files } = await supabase.storage
        .from('modelos-fotos')
        .list();
      archivosStorage = files?.length || 0;
    } catch (e) {
      console.log('ℹ️ No se pudo contar archivos en storage');
    }

    // Análisis
    const dbIds = new Set(dbUsers?.map(u => u.id) || []);
    const authIds = new Set(authUsers?.users.map(u => u.id) || []);
    
    const huerfanos = authUsers?.users.filter(u => !dbIds.has(u.id)) || [];
    const sinAuth = dbUsers?.filter(u => !authIds.has(u.id)) || [];
    
    const porRole = {
      owner: dbUsers?.filter(u => u.role === 'owner').length || 0,
      admin: dbUsers?.filter(u => u.role === 'admin').length || 0,
      programador: dbUsers?.filter(u => u.role === 'programador').length || 0,
      modelo: dbUsers?.filter(u => u.role === 'modelo').length || 0,
    };

    return c.json({
      success: true,
      auth: {
        total: authUsers?.users.length || 0,
        huerfanos: huerfanos.length,
        listaHuerfanos: huerfanos.map(h => ({ email: h.email, id: h.id }))
      },
      baseDatos: {
        total: dbUsers?.length || 0,
        sinAuth: sinAuth.length,
        listaSinAuth: sinAuth.map(u => ({ email: u.email, id: u.id, nombre: u.nombre, role: u.role })),
        porRole
      },
      storage: {
        buckets: buckets?.length || 0,
        archivos: archivosStorage
      }
    });

  } catch (error) {
    console.error('❌ Error obteniendo estado:', error);
    return c.json({ error: error.message }, 500);
  }
});

// 🔄 Recrear usuarios de Auth basándose en BD (RECUPERACIÓN DE DESASTRES)
app.post("/make-server-9dadc017/diagnostico/recrear-auth-desde-bd", async (c) => {
  try {
    console.log('🔄 Recreando usuarios de Auth desde BD...');
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    // 1. Obtener usuarios de BD que NO tienen Auth
    const { data: authUsers } = await supabase.auth.admin.listUsers();
    const { data: dbUsers } = await supabase
      .from('usuarios')
      .select('id, email, nombre, role');
    
    const authIds = new Set(authUsers?.users.map(u => u.id) || []);
    const sinAuth = dbUsers?.filter(u => !authIds.has(u.id)) || [];

    if (sinAuth.length === 0) {
      return c.json({ 
        success: true, 
        mensaje: 'Todos los usuarios de BD ya tienen Auth', 
        recreados: 0 
      });
    }

    console.log(`⚠️ Se encontraron ${sinAuth.length} usuarios en BD sin Auth`);
    console.log('⚠️ PELIGRO: Esto eliminará los IDs actuales y recreará con nuevos IDs');

    const resultados = [];
    let recreados = 0;
    const passwordTemporal = 'BlackDiamond2024!';

    for (const usuario of sinAuth) {
      try {
        // Crear usuario en Auth (obtendrá un NUEVO ID)
        const { data, error } = await supabase.auth.admin.createUser({
          email: usuario.email,
          password: passwordTemporal,
          email_confirm: true,
          user_metadata: { 
            nombre: usuario.nombre,
            role: usuario.role,
            recuperado: true 
          }
        });
        
        if (error) {
          console.error(`❌ Error recreando ${usuario.email}:`, error);
          resultados.push(`❌ ${usuario.email}: ${error.message}`);
        } else {
          // CRÍTICO: Eliminar registro viejo y crear uno nuevo con el ID de Auth
          const oldId = usuario.id;
          const newId = data.user.id;

          // Obtener todos los datos del usuario viejo
          const { data: userData, error: fetchError } = await supabase
            .from('usuarios')
            .select('*')
            .eq('id', oldId)
            .single();

          if (fetchError) {
            console.error(`❌ Error obteniendo datos de ${usuario.email}:`, fetchError);
            resultados.push(`❌ ${usuario.email}: Error obteniendo datos`);
            continue;
          }

          // Eliminar registro viejo
          const { error: deleteError } = await supabase
            .from('usuarios')
            .delete()
            .eq('id', oldId);

          if (deleteError) {
            console.error(`❌ Error eliminando registro viejo de ${usuario.email}:`, deleteError);
            resultados.push(`❌ ${usuario.email}: Error eliminando registro viejo`);
            // Eliminar el Auth que acabamos de crear para mantener consistencia
            await supabase.auth.admin.deleteUser(newId);
            continue;
          }

          // Crear registro nuevo con el nuevo ID
          const { error: insertError } = await supabase
            .from('usuarios')
            .insert({
              ...userData,
              id: newId  // Usar el nuevo ID de Auth
            });

          if (insertError) {
            console.error(`❌ Error insertando nuevo registro de ${usuario.email}:`, insertError);
            resultados.push(`❌ ${usuario.email}: Error insertando nuevo registro`);
            // Intentar restaurar el viejo (rollback manual)
            await supabase.from('usuarios').insert(userData);
            await supabase.auth.admin.deleteUser(newId);
            continue;
          }

          recreados++;
          resultados.push(`✅ ${usuario.email} recreado (ID: ${oldId} → ${newId})`);
          console.log(`✅ Usuario recreado: ${usuario.email} con nuevo ID`);
        }
      } catch (error) {
        console.error(`❌ Error con ${usuario.email}:`, error);
        resultados.push(`❌ ${usuario.email}: ${error.message}`);
      }
    }

    console.log(`✅ Recreación completada: ${recreados}/${sinAuth.length} recreados`);

    return c.json({
      success: true,
      totalSinAuth: sinAuth.length,
      recreados,
      passwordTemporal,
      advertencia: 'Los IDs de los usuarios han cambiado. Debes cerrar sesión y volver a iniciar.',
      resultados
    });

  } catch (error) {
    console.error('❌ Error recreando usuarios:', error);
    return c.json({ error: error.message }, 500);
  }
});

// ==================== MIGRACIÓN DE MODELOS ====================

// Datos de las modelos reales
const modelosReales = [
  {
    id: 'annie-001',
    nombre: 'Annie',
    nombreArtistico: 'Annie',
    edad: 21,
    altura: '165 cm',
    medidas: '90-65-96',
    descripcion: 'Belleza colombo-venezolana con una mezcla única de elegancia y pasión. Annie combina experiencia, carisma y una conexión auténtica que transforma cada encuentro en una experiencia inolvidable.',
    sede: 'Sede Zona Norte',
    fotoPerfil: 'https://lh3.googleusercontent.com/d/1qYdBfWfotlCxuJKD4TXTp3aHotIJ9Ep1',
    fotosAdicionales: [
      'https://lh3.googleusercontent.com/d/16D6qOymlckS5rtccdc7IeDYKBkYFzAQF',
      'https://lh3.googleusercontent.com/d/11junC_y6lS_m47E9ZxGCRQ5tNxDwZB17',
      'https://lh3.googleusercontent.com/d/1n4SuCIxkCwIGpJlYlsyIaebFnltkVL4P',
      'https://lh3.googleusercontent.com/d/1hehY0KO3yk_mxts5yg6Yp9Xc6F80TEI3',
      'https://lh3.googleusercontent.com/d/19GKxQUtUQJ8xtl6XM6WTke1zdFnFsmdt',
      'https://lh3.googleusercontent.com/d/1X07C9pEUMuIKSLvdeLfc9TfBjpi-uTgQ',
      'https://lh3.googleusercontent.com/d/1YXBrLxWImMapvI8CIbxKDoqPYpKEA93h',
      'https://lh3.googleusercontent.com/d/1WgTtV_YWVHSVwD_iZZA8w-P_xuswXQnb',
      'https://lh3.googleusercontent.com/d/1U7j-jnbz7USdYOWSeJhcbR5nx7XoahX0',
      'https://lh3.googleusercontent.com/d/_fhcC5bZFv7RQA00SjhqlswGUFcLwKs7',
      'https://lh3.googleusercontent.com/d/1_tv7acKOYcsdd3ufJUbc8toi645aiH5l',
      'https://lh3.googleusercontent.com/d/170pFPNeRVsNru5F-hHk8OYE0fnCyzpF0'
    ],
    email: 'annie@blackdiamond.com',
    telefono: '+57 300 123 4567',
    cedula: '1000000001',
    direccion: 'Sede Norte',
    password: 'Annie2024!',
    disponible: true
  },
  {
    id: 'luci-002',
    nombre: 'Luci',
    nombreArtistico: 'Luci',
    edad: 21,
    altura: '150 cm',
    medidas: '85-58-87',
    descripcion: 'Joven y radiante, Luci destaca por su estética petite, rasgos delicados y una armonía natural que transmite frescura y ternura. Atlética, ágil y entregada, combina una energía alegre con una presencia cuidada y segura en cada detalle.',
    sede: 'Sede Zona Norte',
    fotoPerfil: 'https://lh3.googleusercontent.com/d/1b1P4V-apOjcNgqE_MgqO_2Q2o6dTCy2B',
    fotosAdicionales: [
      'https://lh3.googleusercontent.com/d/1mE05TwSBhv2WSyvZ8FZ6EXHO8u9Z1OEQ',
      'https://lh3.googleusercontent.com/d/1ZT7mQLbE5RrWQluv3Ba55dJO6Gg_BSCY',
      'https://lh3.googleusercontent.com/d/1MXoSJMygn-NxE8hvsckaIJ08tWj-FV0D',
      'https://lh3.googleusercontent.com/d/1IcTOObazXz3FNf9vbsRYnqO3MsJlHvSu',
      'https://lh3.googleusercontent.com/d/1zwtKmiT_G_qaMj38iy72heA25oabVEFU'
    ],
    email: 'luci@blackdiamond.com',
    telefono: '+57 301 234 5678',
    cedula: '1000000002',
    direccion: 'Sede Norte',
    password: 'Luci2024!',
    disponible: true
  },
  {
    id: 'isabella-003',
    nombre: 'Isabella',
    nombreArtistico: 'Isabella',
    edad: 21,
    altura: '170 cm',
    medidas: '90-63-94',
    descripcion: 'Elegancia y sofisticación en cada detalle. Isabella combina una presencia magnética con una personalidad cautivadora, creando experiencias memorables que van más allá de lo ordinario.',
    sede: 'Sede Zona Norte',
    fotoPerfil: 'https://lh3.googleusercontent.com/d/1Wg94Vmh9nrYE60NNrA6-QHTxldsFhkLk',
    fotosAdicionales: [
      'https://lh3.googleusercontent.com/d/1HwNiobsK53Xy8ILFc9Ff_cY5DSLDuTSO',
      'https://lh3.googleusercontent.com/d/1lvGfWC1q70ci0zJmrLrLGLQMm_QYYYBn',
      'https://lh3.googleusercontent.com/d/1v2lJI1GamCbCAkWXc9IuQyddhOFt8tpe',
      'https://lh3.googleusercontent.com/d/1Na5_w-cGBAbkPrjq7Fxt7qsWWdEjvovQ',
      'https://lh3.googleusercontent.com/d/1aElSnJzS8IsHOc5YMXI0hYG-NBfrxOLF',
      'https://lh3.googleusercontent.com/d/1wFPiBng8qV08wwU3Qh3X-_sEiW_iQAha',
      'https://lh3.googleusercontent.com/d/1VPSQhxw9SSuTq1O2zewUSNegDUUAEzbb',
      'https://lh3.googleusercontent.com/d/1frMHOaMDNlGIPecyBv-gI-BwFll4g-MY',
      'https://lh3.googleusercontent.com/d/1QPxGUJJ75kRrY0__VB2BH3qOShAgtZ1i',
      'https://lh3.googleusercontent.com/d/1fCr3kjDj9yEdZr-mRbvDCOJok3M0Rw4a',
      'https://lh3.googleusercontent.com/d/15YHAdLWymP9chWgMJvgar4FOAWytBlTw',
      'https://lh3.googleusercontent.com/d/12TZibn3yo4BAAYsx98NC1A4Y8y-aPWTk',
      'https://lh3.googleusercontent.com/d/1rCbsjtQk85Wx8eNUfqx7clM4ZrgneL8V',
      'https://lh3.googleusercontent.com/d/1TZUgr_VAKOHsWd85PqYBdXjfzMrP1EAh',
      'https://lh3.googleusercontent.com/d/1lB__Fniv21Q-Xrzf014ysIQwMP7v_BZl',
      'https://lh3.googleusercontent.com/d/1_dVGDIyUfo_d4gNbRVJBtpCBqkTvsKTA',
      'https://lh3.googleusercontent.com/d/1gTIwb_TiVZG8Ku39zPhCSikGwzKw2TzH',
      'https://lh3.googleusercontent.com/d/1n0K892PV3gF-hk6l3y9X2kFBroQ6X-57',
      'https://lh3.googleusercontent.com/d/1Uk0EXlW9Fps5iI8deI3p25VtdzoKjQMd'
    ],
    email: 'isabella@blackdiamond.com',
    telefono: '+57 302 345 6789',
    cedula: '1000000003',
    direccion: 'Sede Norte',
    password: 'Isabella2024!',
    disponible: true
  },
  {
    id: 'natalia-004',
    nombre: 'Natalia',
    nombreArtistico: 'Natalia',
    edad: 21,
    altura: '154 cm',
    medidas: '88-56-87',
    descripcion: 'Dulzura y pasión en perfecta armonía. Natalia ofrece una experiencia única llena de ternura y conexión genuina, con una personalidad encantadora que deja huella.',
    sede: 'Sede Zona Norte',
    fotoPerfil: 'https://lh3.googleusercontent.com/d/1WtMylIcZS_q3v9EabMtc2XHJVOa-Z9zd',
    fotosAdicionales: [
      'https://lh3.googleusercontent.com/d/1a2MGs-SNBbHeIDKMFazY0bhRB8mexZmX',
      'https://lh3.googleusercontent.com/d/1nsy9-a0GzfkSGqmelENocWvLJIUpk4nW',
      'https://lh3.googleusercontent.com/d/1muyZ8hUHBjAnWwzFkBH5b-32UyNW6m2S',
      'https://lh3.googleusercontent.com/d/1DzwJ_CMDJIVfzAU5pcQuzK7atCAPuT_M',
      'https://lh3.googleusercontent.com/d/1XASRRRPDcZKqCW9qEJkU3Aa44hiEsO0T',
      'https://lh3.googleusercontent.com/d/1HT901QbCwPZSFpeP2In6vzROx9yOVG8v',
      'https://lh3.googleusercontent.com/d/1alKhvIhxt12aAXgnx9RtLHq5aiIIFzux',
      'https://lh3.googleusercontent.com/d/1fJ15q8UNTmN9M4wUsUa0QSGWSrNSn_Lk',
      'https://lh3.googleusercontent.com/d/1Wn9nIdiJyGQm06tB-QOGkf4y8oJuErT2',
      'https://lh3.googleusercontent.com/d/138XpIttRtqpEYEjWClbnPTnZTkjvGT6f',
      'https://lh3.googleusercontent.com/d/138qzkh2q0p6yvUsS8d0RAGHg58cF6kN4'
    ],
    email: 'natalia@blackdiamond.com',
    telefono: '+57 303 456 7890',
    cedula: '1000000004',
    direccion: 'Sede Norte',
    password: 'Natalia2024!',
    disponible: true
  },
  {
    id: 'ximena-005',
    nombre: 'Ximena',
    nombreArtistico: 'Ximena',
    edad: 21,
    altura: '148 cm',
    medidas: '92-73-96',
    descripcion: 'Exuberancia natural y carisma desbordante. Ximena es la combinación perfecta de sensualidad y autenticidad, ofreciendo encuentros llenos de energía y conexión real.',
    sede: 'Sede Zona Norte',
    fotoPerfil: 'https://lh3.googleusercontent.com/d/15VwEzcm6jre_JugzQVF73LPnug1uKdtK',
    fotosAdicionales: [
      'https://lh3.googleusercontent.com/d/1o4hVclJUNY-3oK1odRhGkEdPahR8SQGa',
      'https://lh3.googleusercontent.com/d/1dIDy6glfXmf7ZeLE0sG8Ez0NLUZvax7c',
      'https://lh3.googleusercontent.com/d/1OQMkE_xi7-tmDzaUgmGaa4bG8g4Jmtw8',
      'https://lh3.googleusercontent.com/d/1ih65oHBeDHehh6QgARSKhGDfouu5p7N6',
      'https://lh3.googleusercontent.com/d/1e67Tj3RVy617VE6fRqW2WRX2wvhwMbbN',
      'https://lh3.googleusercontent.com/d/1G8vxZNk2KdOJJlZXeKrDBqm2RnrFgdRR',
      'https://lh3.googleusercontent.com/d/1lmHSNBo_6yphyAlHfw5JklXc7e8FSZR5',
      'https://lh3.googleusercontent.com/d/1-PwM1-WkDg7VIGpbTBMa-QrIZWnO6pA0',
      'https://lh3.googleusercontent.com/d/1kQB5jcCqY6FBFE16nj9IhnIsMgz0mqo5',
      'https://lh3.googleusercontent.com/d/1VDcJHeM22SmngYoRuWRQ-BIZIxcfpWXi',
      'https://lh3.googleusercontent.com/d/1RLGMyaRNnE7nV5mdWnIm5r9EXBm8IqRN'
    ],
    email: 'ximena@blackdiamond.com',
    telefono: '+57 304 567 8901',
    cedula: '1000000005',
    direccion: 'Sede Norte',
    password: 'Ximena2024!',
    disponible: false // ❌ NO DISPONIBLE
  },
  {
    id: 'xiomara-006',
    nombre: 'Xiomara',
    nombreArtistico: 'Xiomara',
    edad: 21,
    altura: '167 cm',
    medidas: '97-73-99',
    descripcion: 'Alta y voluptuosa, Xiomara irradia una presencia segura y vibrante, con una energía alegre y apasionada que se siente desde el primer encuentro. Con formación en enfermería, aporta conocimiento, cuidado y técnica.',
    sede: 'Sede Zona Norte',
    fotoPerfil: 'https://lh3.googleusercontent.com/d/1fwmNRPyveOpDITUrekP9yJi-VjXjzx0p',
    fotosAdicionales: [
      'https://lh3.googleusercontent.com/d/1iPOewuzz0-thoNcMO78paE3ObbjPtqFS',
      'https://lh3.googleusercontent.com/d/1rUt1gLC39a4VsbInrQbT0i-RbBjQ9pLj',
      'https://lh3.googleusercontent.com/d/1xTFIJBvc7T2ZINocxn29G0_3iiTDtYxK',
      'https://lh3.googleusercontent.com/d/18PGP1od1LkegXHyx3r94iiKg78Wx75G8',
      'https://lh3.googleusercontent.com/d/1GKAAgGVDM7hBLjzrMPe3j_r582O2cwep',
      'https://lh3.googleusercontent.com/d/1MG1IhsIUhCKqAufzUpLBS5fT9LHJhSdC',
      'https://lh3.googleusercontent.com/d/1vAynh1FZiAkYrjAkgQ3QjB6ObS9pAKl5',
      'https://lh3.googleusercontent.com/d/1Q8QSyS8rpT2Fpfw41iMv8d3ZzO9NnSYI'
    ],
    email: 'xiomara@blackdiamond.com',
    telefono: '+57 305 678 9012',
    cedula: '1000000006',
    direccion: 'Sede Norte',
    password: 'Xiomara2024!',
    disponible: true
  },
  {
    id: 'roxxy-007',
    nombre: 'Roxxy',
    nombreArtistico: 'Roxxy',
    edad: 23,
    altura: '154 cm',
    medidas: '88-68-92',
    descripcion: 'Belleza serena, Roxxy destaca por su trato suave y delicado, con una piel cuidada y naturalmente luminosa. Gentil, positiva y generosa, transmite una actitud cercana y receptiva que invita a la confianza.',
    sede: 'Sede Zona Norte',
    fotoPerfil: 'https://lh3.googleusercontent.com/d/1R0TH4ErmsQEuduY0kevq7WZgP6c19fFB',
    fotosAdicionales: [
      'https://lh3.googleusercontent.com/d/1nWDWPCAPB2EGJjNOoK64w7fjDbhsoVXQ',
      'https://lh3.googleusercontent.com/d/1SF0jtn8mNpX2P7Tos1ZTt6cnTf224juz',
      'https://lh3.googleusercontent.com/d/1fp9EZ5LuC_BYJSJx725AVdjYJMxo-gkY',
      'https://lh3.googleusercontent.com/d/1n4tMpVr7w4RrevoRu6MzxM4xe9YFDpJa',
      'https://lh3.googleusercontent.com/d/1gE6I-4_3RlEUs4BBWil3SRO56z7TnprJ',
      'https://lh3.googleusercontent.com/d/1KX3Ep_xFszxJsdIPPp8qcXSySV5tiMOD',
      'https://lh3.googleusercontent.com/d/1JIEOzCMtKDx4y81CFbwrdAu_3i98_3ac',
      'https://lh3.googleusercontent.com/d/1g16jYtd4bkzi05YGNlfI5XHF3RZDEgIR',
      'https://lh3.googleusercontent.com/d/1HLlo4eDy6mZdT9JhfjaveWxWLer0jvn4'
    ],
    email: 'roxxy@blackdiamond.com',
    telefono: '+57 306 789 0123',
    cedula: '1000000007',
    direccion: 'Sede Norte',
    password: 'Roxxy2024!',
    disponible: false // ❌ NO DISPONIBLE
  }
];

// Limpiar todos los perfiles de modelo
app.post("/make-server-9dadc017/migration/limpiar-modelos", async (c) => {
  try {
    console.log('🧹 Iniciando limpieza de modelos...');
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    // 1. Obtener todos los usuarios con role='modelo'
    const { data: modelos, error: fetchError } = await supabase
      .from('usuarios')
      .select('id, email, nombre')
      .eq('role', 'modelo');

    if (fetchError) {
      console.error('❌ Error al obtener modelos:', fetchError);
      throw fetchError;
    }

    if (!modelos || modelos.length === 0) {
      console.log('ℹ️ No hay modelos para limpiar');
      return c.json({ success: true, eliminados: 0, detalles: [] });
    }

    console.log(`📋 Encontrados ${modelos.length} modelos para eliminar`);

    // 2. Eliminar cada modelo
    const detalles = [];
    let eliminados = 0;

    for (const modelo of modelos) {
      try {
        // Eliminar de Auth
        const { error: authError } = await supabase.auth.admin.deleteUser(modelo.id);
        if (authError) {
          console.error(`❌ Error eliminando usuario ${modelo.email} de Auth:`, authError);
          detalles.push(`❌ ${modelo.nombre}: Error en Auth - ${authError.message}`);
          continue;
        }

        // Eliminar de tabla usuarios
        const { error: dbError } = await supabase
          .from('usuarios')
          .delete()
          .eq('id', modelo.id);

        if (dbError) {
          console.error(`❌ Error eliminando usuario ${modelo.email} de DB:`, dbError);
          detalles.push(`❌ ${modelo.nombre}: Error en DB - ${dbError.message}`);
          continue;
        }

        eliminados++;
        detalles.push(`✅ ${modelo.nombre} eliminada correctamente`);
        console.log(`✅ Modelo eliminada: ${modelo.nombre} (${modelo.email})`);
      } catch (error) {
        console.error(`❌ Error eliminando modelo ${modelo.email}:`, error);
        detalles.push(`❌ ${modelo.nombre}: ${error.message}`);
      }
    }

    console.log(`✅ Limpieza completada: ${eliminados}/${modelos.length} eliminadas`);

    return c.json({ 
      success: true, 
      eliminados,
      total: modelos.length,
      detalles 
    });
  } catch (error) {
    console.error('❌ Error en limpieza de modelos:', error);
    return c.json({ 
      success: false, 
      error: error.message,
      eliminados: 0,
      detalles: [`❌ Error general: ${error.message}`]
    }, 500);
  }
});

// Migrar modelos reales a Supabase
app.post("/make-server-9dadc017/migration/migrar-modelos", async (c) => {
  try {
    console.log('🚀 Iniciando migración de modelos reales...');
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    const resultado = {
      exitosas: 0,
      fallidas: 0,
      detalles: []
    };

    for (const modelo of modelosReales) {
      try {
        console.log(`📝 Migrando: ${modelo.nombre}...`);

        // Verificar si el usuario ya existe en Auth
        const { data: existingUsers } = await supabase.auth.admin.listUsers();
        const existingUser = existingUsers?.users?.find(u => u.email === modelo.email);

        let userId;
        
        if (existingUser) {
          // Usuario ya existe, solo actualizamos metadata
          console.log(`ℹ️ Usuario ${modelo.nombre} ya existe, actualizando...`);
          userId = existingUser.id;
          
          const { error: updateError } = await supabase.auth.admin.updateUserById(
            userId,
            {
              user_metadata: {
                nombre: modelo.nombre,
                role: 'modelo'
              }
            }
          );
          
          if (updateError) {
            console.error(`❌ Error actualizando metadata para ${modelo.nombre}:`, updateError);
          }
        } else {
          // Usuario no existe, lo creamos
          const { data: authData, error: authError } = await supabase.auth.admin.createUser({
            email: modelo.email,
            password: modelo.password,
            email_confirm: true,
            user_metadata: {
              nombre: modelo.nombre,
              role: 'modelo'
            }
          });

          if (authError) {
            console.error(`❌ Error Auth para ${modelo.nombre}:`, authError);
            resultado.fallidas++;
            resultado.detalles.push(`❌ ${modelo.nombre}: ${authError.message}`);
            continue;
          }
          
          userId = authData.user.id;
        }

        // Crear registro en tabla usuarios con TODOS LOS CAMPOS
        const { error: dbError } = await supabase
          .from('usuarios')
          .upsert({
            id: userId,
            email: modelo.email,
            nombre: modelo.nombre,
            nombreArtistico: modelo.nombreArtistico,
            role: 'modelo',
            telefono: modelo.telefono,
            cedula: modelo.cedula,
            direccion: modelo.direccion,
            edad: modelo.edad,
            altura: modelo.altura,
            medidas: modelo.medidas,
            descripcion: modelo.descripcion,
            fotoPerfil: modelo.fotoPerfil,
            fotosAdicionales: modelo.fotosAdicionales,
            sede: modelo.sede,
            estado: 'activo',
            disponible: modelo.disponible, // ✅ Usar el campo disponible de cada modelo
            fechaIngreso: new Date().toISOString()
          }, {
            onConflict: 'id'
          });

        if (dbError) {
          console.error(`❌ Error DB para ${modelo.nombre}:`, dbError);
          await supabase.auth.admin.deleteUser(userId);
          resultado.fallidas++;
          resultado.detalles.push(`❌ ${modelo.nombre}: ${dbError.message}`);
          continue;
        }

        console.log(`✅ ${modelo.nombre} migrada exitosamente`);
        resultado.exitosas++;
        resultado.detalles.push(`✅ ${modelo.nombre} migrada correctamente`);
      } catch (error) {
        console.error(`❌ Error migrando ${modelo.nombre}:`, error);
        resultado.fallidas++;
        resultado.detalles.push(`❌ ${modelo.nombre}: ${error.message}`);
      }
    }

    console.log(`✅ Migración completada: ${resultado.exitosas} exitosas, ${resultado.fallidas} fallidas`);

    return c.json({ 
      success: resultado.exitosas > 0, 
      resultado 
    });
  } catch (error) {
    console.error('❌ Error en migración:', error);
    return c.json({ 
      success: false, 
      error: error.message,
      resultado: {
        exitosas: 0,
        fallidas: modelosReales.length,
        detalles: [`❌ Error general: ${error.message}`]
      }
    }, 500);
  }
});

// Endpoint todo-en-uno: limpiar + migrar
app.post("/make-server-9dadc017/migration/migrar-todo", async (c) => {
  try {
    console.log('🚀 Iniciando migración NO DESTRUCTIVA (solo actualizar/crear)...');
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    const resultado = {
      exitosas: 0,
      actualizadas: 0,
      fallidas: 0,
      detalles: []
    };

    for (const modelo of modelosReales) {
      try {
        console.log(`📝 Procesando: ${modelo.nombre}...`);

        // Verificar si el usuario ya existe en Auth
        const { data: existingUsers } = await supabase.auth.admin.listUsers();
        const existingUser = existingUsers?.users?.find(u => u.email === modelo.email);

        let userId;
        let esActualizacion = false;
        
        if (existingUser) {
          // Usuario ya existe, solo actualizamos
          console.log(`ℹ️ Usuario ${modelo.nombre} ya existe, actualizando...`);
          userId = existingUser.id;
          esActualizacion = true;
          
          const { error: updateError } = await supabase.auth.admin.updateUserById(
            userId,
            {
              user_metadata: {
                nombre: modelo.nombre,
                role: 'modelo'
              }
            }
          );
          
          if (updateError) {
            console.error(`❌ Error actualizando metadata para ${modelo.nombre}:`, updateError);
          }
        } else {
          // Usuario no existe, lo creamos
          console.log(`✨ Creando nuevo usuario: ${modelo.nombre}`);
          const { data: authData, error: authError } = await supabase.auth.admin.createUser({
            email: modelo.email,
            password: modelo.password,
            email_confirm: true,
            user_metadata: {
              nombre: modelo.nombre,
              role: 'modelo'
            }
          });

          if (authError) {
            console.error(`❌ Error Auth para ${modelo.nombre}:`, authError);
            resultado.fallidas++;
            resultado.detalles.push(`❌ ${modelo.nombre}: ${authError.message}`);
            continue;
          }
          
          userId = authData.user.id;
        }

        // Actualizar o crear registro en tabla usuarios con TODOS LOS CAMPOS
        const { error: dbError } = await supabase
          .from('usuarios')
          .upsert({
            id: userId,
            email: modelo.email,
            nombre: modelo.nombre,
            nombreArtistico: modelo.nombreArtistico,
            role: 'modelo',
            telefono: modelo.telefono,
            cedula: modelo.cedula,
            direccion: modelo.direccion,
            edad: modelo.edad,
            altura: modelo.altura,
            medidas: modelo.medidas,
            descripcion: modelo.descripcion,
            fotoPerfil: modelo.fotoPerfil,
            fotosAdicionales: modelo.fotosAdicionales,
            sede: modelo.sede,
            estado: 'activo',
            disponible: modelo.disponible,
            fechaIngreso: new Date().toISOString()
          }, {
            onConflict: 'id'
          });

        if (dbError) {
          console.error(`❌ Error DB para ${modelo.nombre}:`, dbError);
          if (!esActualizacion) {
            await supabase.auth.admin.deleteUser(userId);
          }
          resultado.fallidas++;
          resultado.detalles.push(`❌ ${modelo.nombre}: ${dbError.message}`);
          continue;
        }

        if (esActualizacion) {
          console.log(`✅ ${modelo.nombre} actualizada exitosamente`);
          resultado.actualizadas++;
          resultado.detalles.push(`🔄 ${modelo.nombre} actualizada correctamente`);
        } else {
          console.log(`✅ ${modelo.nombre} creada exitosamente`);
          resultado.exitosas++;
          resultado.detalles.push(`✨ ${modelo.nombre} creada correctamente`);
        }
      } catch (error) {
        console.error(`❌ Error procesando ${modelo.nombre}:`, error);
        resultado.fallidas++;
        resultado.detalles.push(`❌ ${modelo.nombre}: ${error.message}`);
      }
    }

    console.log(`✅ Migración completada: ${resultado.exitosas} creadas, ${resultado.actualizadas} actualizadas, ${resultado.fallidas} fallidas`);

    return c.json({ 
      success: (resultado.exitosas + resultado.actualizadas) > 0, 
      resultado 
    });
  } catch (error) {
    console.error('❌ Error en migración:', error);
    return c.json({ 
      success: false, 
      error: error.message,
      resultado: {
        exitosas: 0,
        actualizadas: 0,
        fallidas: modelosReales.length,
        detalles: [`❌ Error general: ${error.message}`]
      }
    }, 500);
  }
});

// 🔍 Endpoint de DEBUG: Ver datos de modelos en Supabase
app.get("/make-server-9dadc017/migration/debug-modelos", async (c) => {
  try {
    console.log('🔍 Consultando modelos en Supabase...');
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    const { data: modelos, error } = await supabase
      .from('usuarios')
      .select('id, nombre, nombreArtistico, email, fotoPerfil, fotosAdicionales, edad, altura, medidas, descripcion, sede, estado, disponible, role')
      .eq('role', 'modelo')
      .order('nombre', { ascending: true });

    if (error) {
      console.error('❌ Error consultando:', error);
      return c.json({ success: false, error: error.message });
    }

    // Agrupar por estado
    const porEstado = {
      activo: modelos?.filter(m => m.estado === 'activo') || [],
      inactivo: modelos?.filter(m => m.estado === 'inactivo') || [],
      archivado: modelos?.filter(m => m.estado === 'archivado') || [],
      sinEstado: modelos?.filter(m => !m.estado) || [],
    };

    console.log(`✅ Encontradas ${modelos?.length || 0} modelos:`);
    console.log(`   - Activas: ${porEstado.activo.length}`);
    console.log(`   - Inactivas: ${porEstado.inactivo.length}`);
    console.log(`   - Archivadas: ${porEstado.archivado.length}`);
    console.log(`   - Sin estado: ${porEstado.sinEstado.length}`);

    return c.json({ 
      success: true, 
      total: modelos?.length || 0,
      porEstado: {
        activo: porEstado.activo.length,
        inactivo: porEstado.inactivo.length,
        archivado: porEstado.archivado.length,
        sinEstado: porEstado.sinEstado.length,
      },
      modelos: modelos || []
    });
  } catch (error) {
    console.error('❌ Error en debug:', error);
    return c.json({ success: false, error: error.message });
  }
});

// 🔧 Endpoint para actualizar disponibilidad de Ximena
app.post("/make-server-9dadc017/migration/actualizar-ximena", async (c) => {
  try {
    console.log('🔧 Actualizando disponibilidad de Ximena...');
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    // Actualizar Ximena para que esté no disponible
    const { data, error } = await supabase
      .from('usuarios')
      .update({
        disponible: false,
        estado: 'activo', // Estado activo pero no disponible temporalmente
      })
      .eq('email', 'ximena@blackdiamond.com')
      .eq('role', 'modelo')
      .select();

    if (error) {
      console.error('❌ Error actualizando Ximena:', error);
      return c.json({ success: false, error: error.message });
    }

    if (!data || data.length === 0) {
      return c.json({ 
        success: false, 
        error: 'Ximena no encontrada en la base de datos',
        mensaje: 'Es posible que no haya sido migrada aún'
      });
    }

    console.log(`✅ Ximena actualizada: disponible=false`);
    return c.json({ 
      success: true, 
      mensaje: 'Ximena actualizada correctamente',
      modelo: data[0]
    });
  } catch (error) {
    console.error('❌ Error actualizando Ximena:', error);
    return c.json({ success: false, error: error.message });
  }
});

// ==================== UPLOAD FOTOS MODELOS ====================

// Crear bucket si no existe
app.post("/make-server-9dadc017/upload/ensure-bucket", async (c) => {
  try {
    await uploadModelos.ensureBucketExists();
    return c.json({ success: true });
  } catch (error) {
    console.error('❌ Error en ensure-bucket:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// Subir foto (base64)
app.post("/make-server-9dadc017/upload/foto", async (c) => {
  try {
    const body = await c.req.json();
    const { fileName, fileData, contentType } = body;

    if (!fileName || !fileData || !contentType) {
      return c.json({ error: 'Faltan parámetros requeridos' }, 400);
    }

    // Convertir base64 a Uint8Array
    const binaryData = Uint8Array.from(atob(fileData), c => c.charCodeAt(0));
    
    const url = await uploadModelos.uploadFile(fileName, binaryData, contentType);
    
    return c.json({ success: true, url });
  } catch (error) {
    console.error('❌ Error subiendo foto:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// Actualizar URLs de modelo en BD
app.post("/make-server-9dadc017/upload/update-modelo", async (c) => {
  try {
    const body = await c.req.json();
    const { email, fotoPerfil, fotosAdicionales } = body;

    if (!email) {
      return c.json({ error: 'Email es requerido' }, 400);
    }

    await uploadModelos.updateModeloFotos(email, fotoPerfil, fotosAdicionales);
    
    return c.json({ success: true });
  } catch (error) {
    console.error('❌ Error actualizando modelo:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// Crear nueva modelo (sin afectar sesión del admin)
// Alias del endpoint usado por el panel CrearModelosRealesPanel
app.post("/make-server-9dadc017/modelos/crear", async (c) => {
  try {
    const body = await c.req.json();
    const { 
      email, 
      password, 
      nombre, 
      nombreArtistico,
      telefono,
      cedula,
      edad,
      direccion,
      fotoPerfil,
      fotosAdicionales,
      descripcion,
      altura,
      medidas,
      sede,
      activa, // ✅ NUEVO
      disponible, // ✅ NUEVO
      domicilio, // ✅ NUEVO
      politicaTarifa, // ✅ NUEVO: Política tarifaria (1=Económica, 2=Estándar, 3=Premium)
      documentoFrente, // ✅ NUEVO: URL del documento de identidad (frente)
      documentoReverso // ✅ NUEVO: URL del documento de identidad (reverso)
    } = body;

    console.log('🔐 Creando modelo vía /modelos/crear:', email);

    // Validar campos requeridos
    if (!email || !password || !nombre) {
      return c.json({ 
        error: 'Email, contraseña y nombre son requeridos' 
      }, 400);
    }

    // Crear cliente de Supabase con Service Role Key
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // Verificar que no exista el usuario
    const { data: existingUser, error: checkError } = await supabase
      .from('usuarios')
      .select('email, role')
      .eq('email', email)
      .maybeSingle();

    // Ignorar error si simplemente no encuentra el usuario
    if (checkError && !checkError.message.includes('multiple') && !checkError.message.includes('0 rows')) {
      console.error('Error verificando usuario existente:', checkError);
    }

    if (existingUser) {
      return c.json({ 
        error: `El email ${email} ya está registrado como ${existingUser.role}` 
      }, 400);
    }

    // Crear usuario con Admin API (NO afecta sesión actual)
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: email,
      password: password,
      email_confirm: true,
      user_metadata: {
        nombre: nombre,
        role: 'modelo'
      }
    });

    if (authError || !authData.user) {
      console.error('❌ Error creando usuario:', authError);
      return c.json({ 
        error: `Error al crear usuario: ${authError?.message}` 
      }, 500);
    }

    const userId = authData.user.id;
    console.log('✅ Usuario Auth creado con ID:', userId);

    // Crear registro en tabla usuarios (usar UPSERT para evitar errores si ya existe)
    const { error: dbError } = await supabase
      .from('usuarios')
      .upsert({
        id: userId,
        email: email,
        nombre: nombre,
        nombreArtistico: nombreArtistico || nombre,
        role: 'modelo',
        telefono: telefono || null,
        cedula: cedula || null,
        edad: edad || 21,
        direccion: direccion || null,
        fotoPerfil: fotoPerfil || null,
        fotosAdicionales: fotosAdicionales || [],
        descripcion: descripcion || null,
        altura: altura || null,
        medidas: medidas || null,
        sede: sede || null,
        estado: 'activo', // ✅ Estado del usuario (activo, inactivo, archivado)
        disponible: disponible !== undefined ? disponible : true, // ✅ Disponibilidad actual
        domicilio: domicilio !== undefined ? domicilio : true, // ✅ Presta servicio a domicilio
        politica_tarifa: politicaTarifa || 2, // ✅ Política tarifaria (1=Económica, 2=Estándar, 3=Premium)
        documento_frente: documentoFrente || null, // ✅ Documento de identidad (frente)
        documento_reverso: documentoReverso || null // ✅ Documento de identidad (reverso)
      }, {
        onConflict: 'id' // ✅ Si el ID ya existe, actualizar en lugar de fallar
      });

    if (dbError) {
      console.error('❌ Error creando registro en BD:', dbError);
      // Intentar eliminar el usuario de Auth si falla la BD
      await supabase.auth.admin.deleteUser(userId);
      return c.json({ 
        error: `Error al crear perfil: ${dbError.message}` 
      }, 500);
    }

    console.log('✅ Modelo creada exitosamente:', email);

    return c.json({ 
      success: true,
      userId: userId,
      email: email,
      nombre: nombre,
      nombreArtistico: nombreArtistico || nombre
    });

  } catch (error) {
    console.error('❌ Error inesperado:', error);
    return c.json({ 
      success: false, 
      error: error.message || 'Error inesperado al crear modelo',
      errorDetails: error.toString()
    }, 500);
  }
});

// Crear nueva modelo vía panel de admin (sin afectar sesión del admin)
app.post("/make-server-9dadc017/admin/crear-modelo", async (c) => {
  try {
    const body = await c.req.json();
    const { 
      email, 
      password, 
      nombre, 
      nombreArtistico,
      telefono,
      cedula,
      edad,
      direccion,
      fotoPerfil,
      fotosAdicionales,
      descripcion,
      altura,
      medidas,
      sede,
      activa, // ✅ NUEVO
      disponible, // ✅ NUEVO
      domicilio, // ✅ NUEVO
      politicaTarifa, // ✅ NUEVO: Política tarifaria (1=Económica, 2=Estándar, 3=Premium)
      documentoFrente, // ✅ NUEVO: URL del documento de identidad (frente)
      documentoReverso // ✅ NUEVO: URL del documento de identidad (reverso)
    } = body;

    console.log('🔐 Creando modelo vía Admin API:', email);

    // Validar campos requeridos
    if (!email || !password || !nombre) {
      return c.json({ 
        error: 'Email, contraseña y nombre son requeridos' 
      }, 400);
    }

    // Crear cliente de Supabase con Service Role Key
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // Verificar que no exista el usuario
    const { data: existingUser, error: checkError } = await supabase
      .from('usuarios')
      .select('email, role')
      .eq('email', email)
      .maybeSingle();

    // Ignorar error si simplemente no encuentra el usuario
    if (checkError && !checkError.message.includes('multiple') && !checkError.message.includes('0 rows')) {
      console.error('Error verificando usuario existente:', checkError);
    }

    if (existingUser) {
      return c.json({ 
        error: `El email ${email} ya está registrado como ${existingUser.role}` 
      }, 400);
    }

    // Crear usuario con Admin API (NO afecta sesión actual)
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: email,
      password: password,
      email_confirm: true,
      user_metadata: {
        nombre: nombre,
        role: 'modelo'
      }
    });

    if (authError || !authData.user) {
      console.error('❌ Error creando usuario:', authError);
      return c.json({ 
        error: `Error al crear usuario: ${authError?.message}` 
      }, 500);
    }

    const userId = authData.user.id;
    console.log('✅ Usuario Auth creado con ID:', userId);

    // Crear registro en tabla usuarios (usar UPSERT para evitar errores si ya existe)
    const { error: dbError } = await supabase
      .from('usuarios')
      .upsert({
        id: userId,
        email: email,
        nombre: nombre,
        nombreArtistico: nombreArtistico || nombre,
        role: 'modelo',
        telefono: telefono || null,
        cedula: cedula || null,
        edad: edad || 21,
        direccion: direccion || null,
        fotoPerfil: fotoPerfil || null,
        fotosAdicionales: fotosAdicionales || [],
        descripcion: descripcion || null,
        altura: altura || null,
        medidas: medidas || null,
        sede: sede || null,
        estado: 'activo', // ✅ Estado del usuario (activo, inactivo, archivado)
        disponible: disponible !== undefined ? disponible : true, // ✅ Disponibilidad actual
        domicilio: domicilio !== undefined ? domicilio : true, // ✅ Presta servicio a domicilio
        politica_tarifa: politicaTarifa || 2, // ✅ Política tarifaria (1=Económica, 2=Estándar, 3=Premium)
        documento_frente: documentoFrente || null, // ✅ Documento de identidad (frente)
        documento_reverso: documentoReverso || null // ✅ Documento de identidad (reverso)
      }, {
        onConflict: 'id' // ✅ Si el ID ya existe, actualizar en lugar de fallar
      });

    if (dbError) {
      console.error('❌ Error creando registro en BD:', dbError);
      // Intentar eliminar el usuario de Auth si falla la BD
      await supabase.auth.admin.deleteUser(userId);
      return c.json({ 
        error: `Error al crear perfil: ${dbError.message}` 
      }, 500);
    }

    console.log('✅ Modelo creada exitosamente:', email);

    return c.json({ 
      success: true,
      userId: userId,
      email: email,
      nombre: nombre,
      nombreArtistico: nombreArtistico || nombre
    });

  } catch (error) {
    console.error('❌ Error inesperado:', error);
    return c.json({ 
      success: false, 
      error: error.message || 'Error inesperado al crear modelo',
      errorDetails: error.toString()
    }, 500);
  }
});

Deno.serve(app.fetch);