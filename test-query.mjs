import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

let env = '';
try { env = fs.readFileSync('.env', 'utf8'); } catch {}
if (!env) {
  try { env = fs.readFileSync('.env.local', 'utf8'); } catch {}
}

const parseEnv = (str) => {
  return str.split('\n').reduce((acc, line) => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) acc[match[1].trim()] = match[2].trim().replace(/^['"](.*)['"]$/, '$1');
    return acc;
  }, {});
};

const config = parseEnv(env);
const supabaseUrl = config.VITE_SUPABASE_URL;
const supabaseKey = config.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  const { data, error } = await supabase
    .from('usuarios')
    .select('*, servicios_modelo!servicios_modelo_modelo_id_fkey(id, nombre, precio_sede, precio_domicilio, activo, duracion)')
    .eq('role', 'modelo')
    .limit(2);
    
  console.log('Data length:', data ? data.length : 0);
  if (data && data.length > 0) {
    console.log('Sample model services:', data[0].servicios_modelo);
  }
  console.log('Error:', error);
}

main();
