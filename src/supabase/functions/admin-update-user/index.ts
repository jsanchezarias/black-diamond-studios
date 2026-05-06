import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req: Request) => {
  console.log(`🚀 Request received: ${req.method} ${req.url}`);

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    console.log(`🔑 Auth Header: ${authHeader ? 'Present (' + authHeader.substring(0, 15) + '...)' : 'Missing'}`);

    if (!authHeader) {
      console.error('❌ Missing Authorization header');
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

    // Resilient token extraction
    const token = authHeader.split(' ').pop();
    if (!token) {
      console.error('❌ Could not extract token from header');
      return new Response(
        JSON.stringify({ error: 'No autorizado: formato de token inválido' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`🎫 Verifying token with getUser...`);
    const { data: callerAuth, error: callerError } = await supabaseAdmin.auth.getUser(token);

    if (callerError || !callerAuth?.user) {
      console.error('❌ Token verification failed:', callerError?.message || 'No user found');
      return new Response(
        JSON.stringify({ error: 'No autorizado: token invalido o expirado', details: callerError?.message }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`👤 Caller: ${callerAuth.user.id} | Email: ${callerAuth.user.email}`);

    const { data: callerProfile, error: profileError } = await supabaseAdmin
      .from('usuarios')
      .select('role')
      .eq('id', callerAuth.user.id)
      .single();

    if (profileError) {
      console.error('❌ Error fetching caller profile:', profileError.message);
    }

    const rolesPermitidos = ['admin', 'administrador', 'owner'];
    const currentRole = callerProfile?.role;
    console.log(`🎭 Caller role: ${currentRole}`);

    if (!currentRole || !rolesPermitidos.includes(currentRole)) {
      console.error(`❌ Unauthorized role: ${currentRole || 'unknown'}`);
      return new Response(
        JSON.stringify({ error: 'No autorizado: privilegios insuficientes', role: currentRole }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const body = await req.json();
    const { targetUserId, authData, publicData } = body;
    console.log(`🎯 Target User ID: ${targetUserId}`);

    if (!targetUserId) {
      console.error('❌ targetUserId missing in body');
      return new Response(
        JSON.stringify({ error: 'targetUserId es requerido' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Actualizar auth.users
    if (authData && (authData.email || authData.password)) {
      console.log(`🔐 Updating auth for ${targetUserId} with:`, Object.keys(authData));
      const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(
        targetUserId,
        authData
      );
      if (authError) {
        console.error('❌ Auth update failed:', authError.message);
        return new Response(
          JSON.stringify({ error: 'Error Auth: ' + authError.message }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      console.log('✅ Auth credentials updated');
    }

    // Actualizar tabla usuarios
    if (publicData && Object.keys(publicData).length > 0) {
      if (authData && authData.email) {
        publicData.email = authData.email;
      }
      console.log(`📝 Updating public table 'usuarios' for ${targetUserId}...`);
      const { error: dbError } = await supabaseAdmin
        .from('usuarios')
        .update(publicData)
        .eq('id', targetUserId);

      if (dbError) {
        console.error('❌ DB update failed:', dbError.message);
        return new Response(
          JSON.stringify({ error: 'Error BD: ' + dbError.message, code: dbError.code }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      console.log('✅ Public table updated');
    }

    return new Response(
      JSON.stringify({ success: true, message: 'Usuario actualizado correctamente' }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('🔥 CRITICAL ERROR:', error.message);
    return new Response(
      JSON.stringify({ error: error.message || 'Error inesperado' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
