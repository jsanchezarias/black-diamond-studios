import { Hono } from "npm:hono";
import * as kv from "./kv_store.tsx";

/**
 * 🎥 ENDPOINTS DE GESTIÓN DE STREAMS
 * 
 * Sistema de configuración de streaming en vivo para sedes.
 * Permite configurar URLs HLS, RTMP y estado en vivo de cada sede.
 * 
 * Endpoints:
 * - GET  /streams         : Obtener configuración de todos los streams
 * - PUT  /streams/:sedeId : Actualizar URL del stream de una sede
 * - PUT  /streams/:sedeId/live : Toggle estado en vivo
 */

const app = new Hono();

// Configuración inicial para Sede Norte
const SEDE_NORTE_CONFIG = {
  sedeId: "sede-norte",
  sedeName: "Sede Norte",
  streamUrl: "", // Se configurará desde el panel de admin
  streamKey: "", // Se configurará desde el panel de admin
  rtmpUrl: "", // Se configurará desde el panel de admin
  isLive: false,
  lastUpdated: new Date().toISOString()
};

/**
 * 🔄 Inicializar configuración de streaming para Sede Norte
 */
async function ensureSedeNorteStream() {
  try {
    const existing = await kv.get("stream:config:sede-norte");
    
    if (!existing) {
      console.log("🎥 Inicializando configuración de stream para Sede Norte...");
      await kv.set("stream:config:sede-norte", SEDE_NORTE_CONFIG);
      console.log("✅ Configuración de Sede Norte inicializada");
    }
  } catch (error) {
    console.error("❌ Error al inicializar configuración de streaming:", error);
  }
}

// Inicializar al cargar el módulo
ensureSedeNorteStream();

/**
 * GET /streams
 * Obtener configuración de todos los streams
 */
app.get("/make-server-9dadc017/streams", async (c) => {
  try {
    console.log("📥 GET /streams - Obteniendo configuración de streams...");
    
    // Asegurar que existe la configuración
    await ensureSedeNorteStream();
    
    // Obtener configuración de Sede Norte
    const sedeNorte = await kv.get("stream:config:sede-norte");
    
    // Validar estructura
    const validStream = sedeNorte && 
                        typeof sedeNorte.sedeId === 'string' && 
                        typeof sedeNorte.sedeName === 'string' &&
                        typeof sedeNorte.isLive === 'boolean';
    
    if (!validStream) {
      console.warn("⚠️ Configuración de stream inválida, usando defaults");
      await kv.set("stream:config:sede-norte", SEDE_NORTE_CONFIG);
      return c.json({ 
        streams: [SEDE_NORTE_CONFIG],
        message: "Configuración inicializada con valores por defecto"
      });
    }
    
    console.log("✅ Configuración de streams obtenida exitosamente");
    return c.json({ 
      streams: [sedeNorte],
      message: "Streams obtenidos exitosamente"
    });
    
  } catch (error) {
    console.error("❌ Error al obtener streams:", error);
    return c.json({ 
      error: "Error al cargar configuración de streams",
      message: error.message,
      streams: [SEDE_NORTE_CONFIG] // Fallback
    }, 500);
  }
});

/**
 * PUT /streams/:sedeId
 * Actualizar URL del stream de una sede
 */
app.put("/make-server-9dadc017/streams/:sedeId", async (c) => {
  try {
    const sedeId = c.req.param("sedeId");
    const body = await c.req.json();
    const { streamUrl } = body;
    
    console.log(`📥 PUT /streams/${sedeId} - Actualizando URL del stream...`);
    
    // Validar que sea Sede Norte
    if (sedeId !== "sede-norte") {
      console.warn(`⚠️ Intento de actualizar sede no soportada: ${sedeId}`);
      return c.json({ 
        error: "Solo está disponible la configuración para Sede Norte",
        message: "Actualmente solo se soporta sede-norte"
      }, 400);
    }
    
    // Validar URL
    if (streamUrl && typeof streamUrl !== 'string') {
      return c.json({ 
        error: "URL de stream inválida",
        message: "streamUrl debe ser una cadena de texto"
      }, 400);
    }
    
    // Obtener configuración actual
    const currentConfig = await kv.get("stream:config:sede-norte") || SEDE_NORTE_CONFIG;
    
    // Actualizar configuración
    const updatedConfig = {
      ...currentConfig,
      streamUrl: streamUrl || "",
      lastUpdated: new Date().toISOString()
    };
    
    await kv.set("stream:config:sede-norte", updatedConfig);
    
    console.log(`✅ Stream URL actualizada para Sede Norte: ${streamUrl ? 'configurada' : 'limpiada'}`);
    return c.json({ 
      success: true,
      stream: updatedConfig,
      message: "URL del stream actualizada exitosamente"
    });
    
  } catch (error) {
    console.error("❌ Error al actualizar stream URL:", error);
    return c.json({ 
      error: "Error al actualizar URL del stream",
      message: error.message
    }, 500);
  }
});

/**
 * PUT /streams/:sedeId/live
 * Toggle estado en vivo de un stream
 */
app.put("/make-server-9dadc017/streams/:sedeId/live", async (c) => {
  try {
    const sedeId = c.req.param("sedeId");
    const body = await c.req.json();
    const { isLive } = body;
    
    console.log(`📥 PUT /streams/${sedeId}/live - Actualizando estado en vivo...`);
    
    // Validar que sea Sede Norte
    if (sedeId !== "sede-norte") {
      console.warn(`⚠️ Intento de actualizar estado de sede no soportada: ${sedeId}`);
      return c.json({ 
        error: "Solo está disponible la configuración para Sede Norte",
        message: "Actualmente solo se soporta sede-norte"
      }, 400);
    }
    
    // Validar isLive
    if (typeof isLive !== 'boolean') {
      return c.json({ 
        error: "Estado inválido",
        message: "isLive debe ser un valor booleano (true/false)"
      }, 400);
    }
    
    // Obtener configuración actual
    const currentConfig = await kv.get("stream:config:sede-norte") || SEDE_NORTE_CONFIG;
    
    // Actualizar estado
    const updatedConfig = {
      ...currentConfig,
      isLive,
      lastUpdated: new Date().toISOString()
    };
    
    await kv.set("stream:config:sede-norte", updatedConfig);
    
    console.log(`✅ Estado actualizado para Sede Norte: ${isLive ? 'EN VIVO' : 'OFFLINE'}`);
    return c.json({ 
      success: true,
      stream: updatedConfig,
      message: `Stream marcado como ${isLive ? 'EN VIVO' : 'OFFLINE'}`
    });
    
  } catch (error) {
    console.error("❌ Error al actualizar estado en vivo:", error);
    return c.json({ 
      error: "Error al actualizar estado del stream",
      message: error.message
    }, 500);
  }
});

export default app;
