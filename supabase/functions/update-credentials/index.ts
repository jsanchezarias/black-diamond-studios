import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";
import { corsHeaders } from "../_shared/cors.ts";

console.log("update-credentials function initialized");

serve(async (req: Request) => {
  // Handle CORS preflight request
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'No autorizado: Falta el token de autenticación' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { userId, email, password } = await req.json();

    if (!userId) {
      return new Response(
        JSON.stringify({ error: 'El ID del usuario es requerido' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Crear cliente de Supabase con Service Role Key
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // Verificar que el caller es un administrador, programador o owner
    const token = authHeader.replace('Bearer ', '');
    const { data: caller, error: callerError } = await supabaseAdmin.auth.getUser(token);
    
    if (callerError || !caller?.user) {
      return new Response(
        JSON.stringify({ error: 'No autorizado: Token inválido' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { data: callerData, error: roleError } = await supabaseAdmin
      .from('usuarios')
      .select('role')
      .eq('id', caller.user.id)
      .single();

    if (roleError || !['administrador', 'owner', 'programador'].includes(callerData?.role)) {
      return new Response(
        JSON.stringify({ error: 'No autorizado: Solo los administradores pueden cambiar credenciales' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const updateAuthData: any = {};
    if (email) updateAuthData.email = email;
    if (password) updateAuthData.password = password;
    if (email) updateAuthData.user_metadata = { email };

    // 1. Update Auth
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.updateUserById(
      userId,
      updateAuthData
    );

    if (authError) {
      console.error('❌ Error actualizando credenciales en Auth:', authError);
      return new Response(
        JSON.stringify({ error: `Error Auth: ${authError.message}` }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 2. Update DB (usuarios)
    if (email) {
      const { error: dbError } = await supabaseAdmin
        .from('usuarios')
        .update({ email: email })
        .eq('id', userId);

      if (dbError) {
        console.error('❌ Error actualizando email en BD:', dbError);
        return new Response(
          JSON.stringify({ error: `Error BD: ${dbError.message}` }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    return new Response(
      JSON.stringify({ success: true, message: 'Credenciales actualizadas correctamente' }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('❌ Error inesperado actualizando credenciales:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Error inesperado' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
