import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-invoke-path',
};

// Tablas que pueden tener datos ligados a una modelo (por id de usuario y/o email).
// Se intenta borrar en todas; si una tabla o columna no existe, se ignora ese error puntual.
const TABLAS_POR_MODELO_ID = [
  'modelo_fotos',
  'servicios_modelo',
  'periodos_modelo',
];

const TABLAS_POR_ID_Y_EMAIL = [
  { tabla: 'multas', colId: 'modelo_id', colEmail: 'modelo_email' },
  { tabla: 'servicios', colId: 'modelo_id', colEmail: 'modelo_email' },
  { tabla: 'agendamientos', colId: 'modelo_id', colEmail: null },
];

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'No autorizado: falta token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    const token = authHeader.split(' ').pop();
    if (!token) {
      return new Response(
        JSON.stringify({ error: 'No autorizado: formato de token inválido' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { data: callerAuth, error: callerError } = await supabaseAdmin.auth.getUser(token);
    if (callerError || !callerAuth?.user) {
      return new Response(
        JSON.stringify({ error: 'No autorizado: token invalido o expirado', details: callerError?.message }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { data: callerProfile } = await supabaseAdmin
      .from('usuarios')
      .select('role')
      .eq('id', callerAuth.user.id)
      .single();

    const rolesPermitidos = ['admin', 'administrador', 'owner'];
    const currentRole = callerProfile?.role;

    if (!currentRole || !rolesPermitidos.includes(currentRole)) {
      return new Response(
        JSON.stringify({ error: 'No autorizado: privilegios insuficientes', role: currentRole }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const body = await req.json();
    const { targetUserId } = body;

    if (!targetUserId) {
      return new Response(
        JSON.stringify({ error: 'targetUserId es requerido' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Solo se permite eliminar permanentemente modelos, nunca admins/owners, ni siquiera al propio caller.
    const { data: targetProfile, error: targetError } = await supabaseAdmin
      .from('usuarios')
      .select('id, email, role')
      .eq('id', targetUserId)
      .single();

    if (targetError || !targetProfile) {
      return new Response(
        JSON.stringify({ error: 'Usuario objetivo no encontrado' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (targetProfile.role !== 'modelo') {
      return new Response(
        JSON.stringify({ error: 'Esta operación solo permite eliminar cuentas con rol "modelo"' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const targetEmail = targetProfile.email;
    const borrados: Record<string, number | string> = {};

    for (const tabla of TABLAS_POR_MODELO_ID) {
      try {
        const { error, count } = await supabaseAdmin
          .from(tabla)
          .delete({ count: 'exact' })
          .eq('modelo_id', targetUserId);
        borrados[tabla] = error ? `error: ${error.message}` : (count ?? 0);
      } catch (e) {
        borrados[tabla] = `excepción: ${(e as Error).message}`;
      }
    }

    for (const { tabla, colId, colEmail } of TABLAS_POR_ID_Y_EMAIL) {
      try {
        let query = supabaseAdmin.from(tabla).delete({ count: 'exact' }).eq(colId, targetUserId);
        const { error, count } = await query;
        let totalBorrado = error ? 0 : (count ?? 0);
        let mensaje = error ? `error(${colId}): ${error.message}` : `${totalBorrado}`;

        if (colEmail && targetEmail) {
          const { error: error2, count: count2 } = await supabaseAdmin
            .from(tabla)
            .delete({ count: 'exact' })
            .eq(colEmail, targetEmail);
          if (!error2) totalBorrado += count2 ?? 0;
          mensaje = error2 ? `${mensaje}; error(${colEmail}): ${error2.message}` : `${totalBorrado}`;
        }

        borrados[tabla] = mensaje;
      } catch (e) {
        borrados[tabla] = `excepción: ${(e as Error).message}`;
      }
    }

    // Eliminar el registro público (por si no hubiera CASCADE configurado desde auth.users)
    const { error: dbDeleteError } = await supabaseAdmin
      .from('usuarios')
      .delete()
      .eq('id', targetUserId);

    if (dbDeleteError) {
      return new Response(
        JSON.stringify({ error: 'Error eliminando registro de usuario: ' + dbDeleteError.message, borrados }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Eliminar la cuenta de autenticación (Supabase Auth)
    const { error: authDeleteError } = await supabaseAdmin.auth.admin.deleteUser(targetUserId);

    if (authDeleteError) {
      return new Response(
        JSON.stringify({ error: 'Perfil eliminado, pero falló borrar la cuenta de auth: ' + authDeleteError.message, borrados }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, message: 'Modelo eliminada permanentemente de la base de datos', borrados }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    return new Response(
      JSON.stringify({ error: (error as Error).message || 'Error inesperado' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
