// ==================== SERVICIOS ENDPOINTS ====================
// Este archivo contiene los endpoints para manejar servicios

import { Hono } from "npm:hono";
import { createClient } from "npm:@supabase/supabase-js@2";

export function setupServiciosEndpoints(app: Hono) {

// 📋 Obtener todos los servicios
app.get("/make-server-9dadc017/servicios", async (c) => {
  try {
    console.log('📥 Recibiendo solicitud GET /servicios');
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    const { data: kvData, error: kvError } = await supabase
      .from('kv_store_9dadc017')
      .select('key, value')
      .like('key', 'servicio:%');

    if (kvError) {
      console.error('❌ Error cargando servicios:', kvError);
      return c.json({ error: kvError.message }, 500);
    }

    if (!kvData || kvData.length === 0) {
      return c.json({ success: true, data: [] });
    }

    const servicios = kvData
      .map(item => {
        try {
          return JSON.parse(item.value);
        } catch (e) {
          console.error('❌ Error parseando servicio:', e);
          return null;
        }
      })
      .filter(s => s !== null);

    console.log(`✅ ${servicios.length} servicios cargados`);
    return c.json({ success: true, data: servicios });

  } catch (error) {
    console.error('❌ Error en GET /servicios:', error);
    return c.json({ error: error.message }, 500);
  }
});

// ➕ Crear un nuevo servicio
app.post("/make-server-9dadc017/servicios", async (c) => {
  try {
    const body = await c.req.json();
    console.log('📥 Recibiendo solicitud POST /servicios:', body);
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    const id = `servicio_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const fechaCreacion = new Date().toISOString();
    
    const servicioCompleto = {
      id,
      ...body,
      fechaCreacion,
      creadoPor: body.creadoPor || 'sistema',
    };

    console.log('📦 Guardando servicio en KV Store:', servicioCompleto);

    const { error } = await supabase
      .from('kv_store_9dadc017')
      .insert({
        key: `servicio:${id}`,
        value: JSON.stringify(servicioCompleto)
      });

    if (error) {
      console.error('❌ Error guardando servicio:', error);
      return c.json({ success: false, error: error.message }, 500);
    }

    console.log('✅ Servicio creado exitosamente');
    return c.json({ success: true, data: servicioCompleto });

  } catch (error) {
    console.error('❌ Error en POST /servicios:', error);
    return c.json({ error: error.message }, 500);
  }
});

// 🔄 Actualizar un servicio
app.put("/make-server-9dadc017/servicios/:id", async (c) => {
  try {
    const id = c.req.param('id');
    const body = await c.req.json();
    console.log(`📥 Recibiendo solicitud PUT /servicios/${id}:`, body);
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    const { data: currentData, error: fetchError } = await supabase
      .from('kv_store_9dadc017')
      .select('value')
      .eq('key', `servicio:${id}`)
      .single();

    if (fetchError || !currentData) {
      console.error('❌ Servicio no encontrado:', fetchError);
      return c.json({ error: 'Servicio no encontrado' }, 404);
    }

    const currentServicio = JSON.parse(currentData.value);
    const updatedServicio = {
      ...currentServicio,
      ...body,
    };

    const { error } = await supabase
      .from('kv_store_9dadc017')
      .update({
        value: JSON.stringify(updatedServicio)
      })
      .eq('key', `servicio:${id}`);

    if (error) {
      console.error('❌ Error actualizando servicio:', error);
      return c.json({ success: false, error: error.message }, 500);
    }

    console.log('✅ Servicio actualizado exitosamente');
    return c.json({ success: true, data: updatedServicio });

  } catch (error) {
    console.error('❌ Error en PUT /servicios:', error);
    return c.json({ error: error.message }, 500);
  }
});

// 🔄 Crear servicio desde agendamiento
app.post("/make-server-9dadc017/servicios/desde-agendamiento", async (c) => {
  try {
    const body = await c.req.json();
    const { agendamientoId, estado, ...datosAdicionales } = body;
    
    console.log(`📥 Creando servicio desde agendamiento ${agendamientoId} con estado ${estado}`);
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    // 1. Obtener el agendamiento
    const { data: agendamientoData, error: agendamientoError } = await supabase
      .from('kv_store_9dadc017')
      .select('value')
      .eq('key', `agendamiento:${agendamientoId}`)
      .single();

    if (agendamientoError || !agendamientoData) {
      console.error('❌ Agendamiento no encontrado:', agendamientoError);
      return c.json({ error: 'Agendamiento no encontrado' }, 404);
    }

    const agendamiento = JSON.parse(agendamientoData.value);

    // 2. Crear el servicio basado en el agendamiento
    const servicioId = `servicio_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const fechaCreacion = new Date().toISOString();

    const servicio = {
      id: servicioId,
      agendamientoId: agendamiento.id,
      fecha: agendamiento.fecha,
      hora: agendamiento.hora,
      duracionEstimadaMinutos: agendamiento.duracionMinutos,
      clienteId: agendamiento.clienteId,
      clienteNombre: agendamiento.clienteNombre,
      clienteTelefono: agendamiento.clienteTelefono,
      modeloEmail: agendamiento.modeloEmail,
      modeloNombre: agendamiento.modeloNombre,
      tipoServicio: agendamiento.tipoServicio,
      tarifaNombre: agendamiento.tarifaNombre || '',
      tarifaDescripcion: agendamiento.tarifaDescripcion,
      montoPactado: agendamiento.montoPago,
      estadoPago: agendamiento.estadoPago || 'pendiente',
      metodoPago: agendamiento.metodoPago,
      transaccionId: agendamiento.transaccionId,
      fechaPago: agendamiento.fechaPago,
      comprobantePago: agendamiento.comprobantePago,
      estado,
      notasPreServicio: agendamiento.notas,
      motivoCancelacion: agendamiento.motivoCancelacion,
      canceladoPor: agendamiento.canceladoPor,
      fechaCancelacion: agendamiento.fechaCancelacion,
      fechaCreacion,
      creadoPor: 'sistema',
      ...datosAdicionales,
    };

    // 3. Guardar el servicio
    const { error: insertError } = await supabase
      .from('kv_store_9dadc017')
      .insert({
        key: `servicio:${servicioId}`,
        value: JSON.stringify(servicio)
      });

    if (insertError) {
      console.error('❌ Error guardando servicio:', insertError);
      return c.json({ success: false, error: insertError.message }, 500);
    }

    // 4. Si es no_show y tiene política de multas, verificar si aplicar multa automática
    if (estado === 'no_show') {
      console.log(`⚠️ No-show detectado para cliente ${agendamiento.clienteId}`);
      
      // Contar no_shows del cliente
      const { data: serviciosCliente } = await supabase
        .from('kv_store_9dadc017')
        .select('value')
        .like('key', 'servicio:%');
      
      const noShows = serviciosCliente
        ?.map(item => JSON.parse(item.value))
        .filter(s => s.clienteId === agendamiento.clienteId && s.estado === 'no_show') || [];
      
      const totalNoShows = noShows.length;
      console.log(`📊 Cliente tiene ${totalNoShows} no-shows totales`);

      // Política de multas: al 2do no_show se aplica multa automática
      if (totalNoShows >= 2) {
        const montoMulta = Math.max(50000, agendamiento.montoPago * 0.3);
        
        servicio.multaAplicada = true;
        servicio.montoMulta = montoMulta;
        servicio.motivoMulta = `Multa automática por ${totalNoShows}° no-show. 30% de la tarifa o mínimo $50.000`;
        servicio.multaPagada = false;

        // Actualizar el servicio con la multa
        await supabase
          .from('kv_store_9dadc017')
          .update({
            value: JSON.stringify(servicio)
          })
          .eq('key', `servicio:${servicioId}`);

        console.log(`💸 Multa automática de $${montoMulta.toLocaleString()} aplicada`);
      }
    }

    console.log('✅ Servicio creado desde agendamiento exitosamente');
    return c.json({ success: true, data: servicio });

  } catch (error) {
    console.error('❌ Error en POST /servicios/desde-agendamiento:', error);
    return c.json({ error: error.message }, 500);
  }
});

}
