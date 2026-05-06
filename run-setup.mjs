/**
 * Black Diamond Studios — Setup completo automático
 * Ejecutar: $env:SUPABASE_ACCESS_TOKEN="sbp_..." ; node run-setup.mjs
 */

import { execSync } from 'child_process';
import { cpSync, mkdirSync, rmSync, renameSync, existsSync, readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dir = dirname(fileURLToPath(import.meta.url));

const PROJECT_REF  = 'kzdjravwcjummegxxrkd';
const SUPABASE_URL = 'https://kzdjravwcjummegxxrkd.supabase.co';
const ANON_KEY     = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt6ZGpyYXZ3Y2p1bW1lZ3h4cmtkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc3NzY4ODIsImV4cCI6MjA4MzM1Mjg4Mn0.xC2QDsAzhYRRg8yakyRTChzHL_bleIT-u9mtKlNeBpc';
const SETUP_SECRET = 'bds-setup-2026-nore';
const MGMT_API     = `https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`;

const ok   = (m) => console.log('  ✅ ' + m);
const fail = (m) => console.log('  ❌ ' + m);
const skip = (m) => console.log('  ⏭️  ' + m);
const log  = (m) => console.log('\n' + m);

const ACCESS_TOKEN = process.env.SUPABASE_ACCESS_TOKEN;
if (!ACCESS_TOKEN) {
  console.log('\n  Falta SUPABASE_ACCESS_TOKEN. Obtén uno en https://app.supabase.com/account/tokens\n  $env:SUPABASE_ACCESS_TOKEN="sbp_..." ; node run-setup.mjs\n');
  process.exit(1);
}

// ─── Preparar directorio supabase/functions desde src/supabase/functions ─────
function prepareSupabaseFunctions() {
  const src  = join(__dir, 'src', 'supabase', 'functions');
  const dest = join(__dir, 'supabase', 'functions');

  if (existsSync(join(__dir, 'supabase'))) {
    rmSync(join(__dir, 'supabase'), { recursive: true, force: true });
  }

  mkdirSync(dest, { recursive: true });
  cpSync(src, dest, { recursive: true });

  // Renombrar index.tsx → index.ts en cada función (Supabase CLI busca index.ts)
  const renameTsx = (dir) => {
    const tsx = join(dir, 'index.tsx');
    const ts  = join(dir, 'index.ts');
    if (existsSync(tsx) && !existsSync(ts)) renameSync(tsx, ts);
  };

  for (const fn of ['server', 'admin-update-user', 'update-credentials', '_shared']) {
    renameTsx(join(dest, fn));
  }

  ok('Funciones copiadas a supabase/functions/');
}

// ─── Limpiar directorio temporal ──────────────────────────────────────────────
function cleanupSupabaseFunctions() {
  const dir = join(__dir, 'supabase');
  if (existsSync(dir)) rmSync(dir, { recursive: true, force: true });
}

// ─── Deploy ───────────────────────────────────────────────────────────────────
async function deployFunction(name) {
  log(`📦 Deployando Edge Function: ${name}`);
  execSync(
    `npx supabase functions deploy ${name} --project-ref ${PROJECT_REF}`,
    {
      stdio: 'inherit',
      cwd: __dir,
      env: { ...process.env, SUPABASE_ACCESS_TOKEN: ACCESS_TOKEN },
    }
  );
  ok(`${name} deployada`);
}

// ─── Management API — SQL ─────────────────────────────────────────────────────
async function runSQL(description, sql) {
  const res = await fetch(MGMT_API, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${ACCESS_TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: sql }),
  });
  const data = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
  if (!res.ok || data.error) {
    fail(`${description}: ${JSON.stringify(data.error ?? data.message ?? data)}`);
    return false;
  }
  ok(description);
  return true;
}

// ─── Migration endpoint ───────────────────────────────────────────────────────
async function callSetup() {
  log('🔧 Ejecutando fixes de datos...');
  const url = `${SUPABASE_URL}/functions/v1/server/make-server-9dadc017/admin/run-setup`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${ANON_KEY}`, 'apikey': ANON_KEY },
    body: JSON.stringify({ secret: SETUP_SECRET }),
  }).catch(e => { fail('No se pudo conectar: ' + e.message); return null; });

  if (!res) return;
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data.error) {
    fail('Setup endpoint: ' + (data.error ?? `HTTP ${res.status}`));
    console.log('  Detalle:', JSON.stringify(data));
    return;
  }
  for (const [key, val] of Object.entries(data.results ?? {})) {
    const s = String(val);
    if (s.startsWith('ERROR')) fail(`${key}: ${val}`);
    else if (s.startsWith('SKIP')) skip(`${key}: ${val}`);
    else ok(`${key}: ${val}`);
  }
}

// ─── SQL migrations ───────────────────────────────────────────────────────────
const SQL_ADMIN_RLS = `
DROP POLICY IF EXISTS "update_usuario_policy" ON usuarios;
CREATE POLICY "update_usuario_policy"
  ON usuarios FOR UPDATE TO authenticated
  USING (id = auth.uid() OR get_user_role() IN ('admin','administrador'))
  WITH CHECK (id = auth.uid() OR get_user_role() IN ('admin','administrador'));
DROP POLICY IF EXISTS "admin lee todos los usuarios" ON usuarios;
CREATE POLICY "admin lee todos los usuarios"
  ON usuarios FOR SELECT TO authenticated
  USING (get_user_role() IN ('admin','administrador','owner','supervisor','programador'));
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS porcentaje_comision NUMERIC(5,2) DEFAULT 50;
`;

const SQL_DELETE_RLS = `
DROP POLICY IF EXISTS "admin elimina agendamientos" ON agendamientos;
CREATE POLICY "admin elimina agendamientos"
  ON agendamientos FOR DELETE
  USING (get_user_role() IN ('admin','owner'));
ALTER TABLE IF EXISTS notificaciones ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "admin gestiona notificaciones" ON notificaciones;
CREATE POLICY "admin gestiona notificaciones"
  ON notificaciones FOR ALL
  USING (get_user_role() IN ('admin','owner'));
DROP POLICY IF EXISTS "admin elimina notificaciones" ON notificaciones;
CREATE POLICY "admin elimina notificaciones"
  ON notificaciones FOR DELETE
  USING (get_user_role() IN ('admin','owner','supervisor','programador'));
DO $$ DECLARE con text;
BEGIN
  SELECT conname INTO con FROM pg_constraint
  WHERE conrelid='public.notificaciones'::regclass AND contype='f'
    AND pg_get_constraintdef(oid) ILIKE '%agendamientos%' LIMIT 1;
  IF con IS NOT NULL THEN EXECUTE format('ALTER TABLE notificaciones DROP CONSTRAINT %I',con); END IF;
EXCEPTION WHEN undefined_table THEN NULL; END $$;
ALTER TABLE IF EXISTS notificaciones
  ADD CONSTRAINT notificaciones_agendamiento_id_fkey
  FOREIGN KEY (agendamiento_id) REFERENCES agendamientos(id) ON DELETE CASCADE;
`;

const SQL_CLIENTES_RLS = `
DROP POLICY IF EXISTS "clientes ven modelos activas" ON usuarios;
CREATE POLICY "clientes ven modelos activas"
  ON usuarios FOR SELECT
  USING (role='modelo' AND (estado IS NULL OR estado='' OR estado ILIKE 'activo') AND fecha_archivado IS NULL);
DROP POLICY IF EXISTS "cliente ve sus agendamientos" ON agendamientos;
CREATE POLICY "cliente ve sus agendamientos"
  ON agendamientos FOR SELECT USING (cliente_id=auth.uid());
DROP POLICY IF EXISTS "cliente crea agendamiento" ON agendamientos;
CREATE POLICY "cliente crea agendamiento"
  ON agendamientos FOR INSERT WITH CHECK (cliente_id=auth.uid());
DROP POLICY IF EXISTS "cliente ve su propio perfil" ON clientes;
CREATE POLICY "cliente ve su propio perfil"
  ON clientes FOR SELECT
  USING (user_id=auth.uid() OR email=(auth.jwt()->>'email'));
ALTER TABLE IF EXISTS notificaciones ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "cliente ve sus notificaciones" ON notificaciones;
CREATE POLICY "cliente ve sus notificaciones"
  ON notificaciones FOR SELECT USING (usuario_id=auth.uid());
`;

const SQL_ASISTENCIAS = `
CREATE TABLE IF NOT EXISTS asistencias (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  modelo_id UUID REFERENCES usuarios(id) ON DELETE CASCADE,
  modelo_email TEXT NOT NULL,
  modelo_nombre TEXT NOT NULL,
  fecha DATE NOT NULL DEFAULT CURRENT_DATE,
  hora_llegada TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  hora_salida TIMESTAMPTZ,
  horas_trabajadas NUMERIC(5,2),
  estado TEXT NOT NULL DEFAULT 'En Turno',
  observaciones TEXT,
  solicitud_entrada_id UUID,
  selfie_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE asistencias ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "modelo ve sus asistencias" ON asistencias;
CREATE POLICY "modelo ve sus asistencias" ON asistencias FOR SELECT TO authenticated
  USING (modelo_id = auth.uid() OR get_user_role() IN ('admin','administrador','owner','programador'));
DROP POLICY IF EXISTS "modelo registra llegada" ON asistencias;
CREATE POLICY "modelo registra llegada" ON asistencias FOR INSERT TO authenticated
  WITH CHECK (modelo_id = auth.uid() OR get_user_role() IN ('admin','administrador','owner'));
DROP POLICY IF EXISTS "modelo actualiza asistencia" ON asistencias;
CREATE POLICY "modelo actualiza asistencia" ON asistencias FOR UPDATE TO authenticated
  USING (modelo_id = auth.uid() OR get_user_role() IN ('admin','administrador','owner'));
CREATE TABLE IF NOT EXISTS solicitudes_entrada (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  modelo_id UUID REFERENCES usuarios(id) ON DELETE CASCADE,
  selfie_url TEXT NOT NULL,
  estado TEXT NOT NULL DEFAULT 'pendiente',
  fecha DATE NOT NULL DEFAULT CURRENT_DATE,
  hora_solicitud TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  hora_respuesta TIMESTAMPTZ,
  respondida_por UUID REFERENCES usuarios(id),
  motivo_rechazo TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE solicitudes_entrada ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "modelo inserta solicitud entrada" ON solicitudes_entrada;
CREATE POLICY "modelo inserta solicitud entrada" ON solicitudes_entrada FOR INSERT TO authenticated
  WITH CHECK (modelo_id = auth.uid());
DROP POLICY IF EXISTS "ve solicitudes entrada" ON solicitudes_entrada;
CREATE POLICY "ve solicitudes entrada" ON solicitudes_entrada FOR SELECT TO authenticated
  USING (modelo_id = auth.uid() OR get_user_role() IN ('admin','administrador','owner','programador'));
DROP POLICY IF EXISTS "admin gestiona solicitudes entrada" ON solicitudes_entrada;
CREATE POLICY "admin gestiona solicitudes entrada" ON solicitudes_entrada FOR UPDATE TO authenticated
  USING (get_user_role() IN ('admin','administrador','owner'));
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('asistencia', 'asistencia', true, 5242880)
ON CONFLICT (id) DO UPDATE SET public = true, file_size_limit = 5242880;
DROP POLICY IF EXISTS "authenticated upload asistencia" ON storage.objects;
CREATE POLICY "authenticated upload asistencia" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'asistencia');
DROP POLICY IF EXISTS "public read asistencia" ON storage.objects;
CREATE POLICY "public read asistencia" ON storage.objects FOR SELECT TO public
  USING (bucket_id = 'asistencia');
`;

// ─── MAIN ─────────────────────────────────────────────────────────────────────
async function main() {
  console.log('\n═══════════════════════════════════════════════════');
  console.log('  Black Diamond Studios — Setup automático total');
  console.log('═══════════════════════════════════════════════════');
  console.log(`  Token: ${ACCESS_TOKEN.substring(0, 12)}...`);

  // PASO 1: Preparar y deployar Edge Functions
  log('═══ PASO 1: Edge Functions ═══════════════════════════');
  prepareSupabaseFunctions();

  let deployOk = false;
  try {
    await deployFunction('server');
    await deployFunction('admin-update-user');
    deployOk = true;
  } finally {
    cleanupSupabaseFunctions();
    ok('Directorio temporal supabase/ limpiado');
  }

  // PASO 2: Data fixes
  if (deployOk) {
    log('═══ PASO 2: Fixes de datos ═══════════════════════════');
    log('⏳ Esperando 5s para que el deploy propague...');
    await new Promise(r => setTimeout(r, 5000));
    await callSetup();
  }

  // PASO 3: SQL
  log('═══ PASO 3: SQL Migrations ═══════════════════════════');
  await runSQL('RLS UPDATE para admin + columna porcentaje_comision', SQL_ADMIN_RLS);
  await runSQL('RLS DELETE agendamientos + FK CASCADE',               SQL_DELETE_RLS);
  await runSQL('RLS para clientes',                                   SQL_CLIENTES_RLS);
  await runSQL('Tablas asistencias + solicitudes_entrada + bucket',   SQL_ASISTENCIAS);

  log('═══════════════════════════════════════════════════════');
  log('🎉 Setup completado. Black Diamond Studios listo.\n');
}

main().catch((e) => {
  cleanupSupabaseFunctions();
  console.error('\n💥 Error fatal:', e.message);
  process.exit(1);
});
