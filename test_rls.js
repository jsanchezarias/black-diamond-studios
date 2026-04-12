import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing config");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: 'modelo.test@blackdiamond.com',
    password: '123456'
  });

  if (error) {
    console.error("Login failed:", error);
    return;
  }

  console.log("Logged in as:", data.user?.email);

  const { data: agendamientos, error: rlsError } = await supabase.from('agendamientos').select('*');
  console.log("RLS Check (Agendamientos):", rlsError ? rlsError.message : `Got ${agendamientos.length} records`);

  const { data: usuarios, error: uError } = await supabase.from('usuarios').select('*');
  console.log("RLS Check (Usuarios):", uError ? uError.message : `Got ${usuarios.length} records`);
}

run();
