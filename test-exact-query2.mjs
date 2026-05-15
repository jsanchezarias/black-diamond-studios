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
const supabase = createClient(config.VITE_SUPABASE_URL, config.VITE_SUPABASE_ANON_KEY);

async function main() {
  const { data, error } = await supabase
    .from('usuarios')
    .select(`
      id,
      nombre_artistico,
      estado,
      descripcion,
      modelo_fotos!modelo_fotos_modelo_id_fkey (
        id, url, es_principal
      ),
      servicios_modelo!servicios_modelo_modelo_id_fkey (
        id, nombre,
        precio_sede, precio_domicilio,
        activo
      )
    `)
    .eq('role', 'modelo')
    .eq('estado', 'activo')
    .order('nombre_artistico')
    .limit(1);

  console.log(JSON.stringify(data, null, 2));
}

main();
