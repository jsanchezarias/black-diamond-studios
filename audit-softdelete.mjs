/**
 * Black Diamond Studios — Auditoría + Soft Delete
 * Uso: $env:SUPABASE_ACCESS_TOKEN="sbp_..." ; node audit-softdelete.mjs
 */

const PROJECT_REF = 'kzdjravwcjummegxxrkd';
const MGMT_API    = `https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`;
const TOKEN       = process.env.SUPABASE_ACCESS_TOKEN;

if (!TOKEN) {
  console.error('\n  Falta SUPABASE_ACCESS_TOKEN\n  $env:SUPABASE_ACCESS_TOKEN="sbp_..." ; node audit-softdelete.mjs\n');
  process.exit(1);
}

const ok   = (m) => console.log('  ✅ ' + m);
const fail = (m) => console.log('  ❌ ' + m);
const info = (m) => console.log('  ℹ️  ' + m);
const log  = (m) => console.log('\n' + m);

async function sql(description, query) {
  const res = await fetch(MGMT_API, {
    method: 'POST',
    headers: { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ query }),
  });
  const data = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
  if (!res.ok || data.error) {
    fail(`${description}: ${JSON.stringify(data.error ?? data.message ?? data)}`);
    return null;
  }
  ok(description);
  return data;
}

// ──────────────────────────────────────────────────────────────────────────────
// FASE 1 — AUDITORÍA
// ──────────────────────────────────────────────────────────────────────────────
async function fase1() {
  log('════════════════════════════════════════════');
  log('  FASE 1 — AUDITORÍA DE RETENCIÓN DE DATOS');
  log('════════════════════════════════════════════');

  // 1a. Tablas con conteo de registros
  log('📊 Tablas y registros activos:');
  const tablas = await sql('Conteo de tablas', `
    SELECT tablename, n_live_tup AS activos, n_dead_tup AS eliminados
    FROM pg_stat_user_tables
    ORDER BY n_live_tup DESC;
  `);
  if (tablas) {
    for (const r of tablas) {
      console.log(`     ${r.tablename.padEnd(35)} activos=${r.activos}  eliminados=${r.eliminados}`);
    }
  }

  // 1b. Triggers DELETE
  log('🔍 Triggers de DELETE:');
  const triggers = await sql('Triggers DELETE', `
    SELECT trigger_name, event_object_table, action_statement
    FROM information_schema.triggers
    WHERE event_manipulation = 'DELETE'
    ORDER BY event_object_table;
  `);
  if (triggers && triggers.length === 0) info('No hay triggers de DELETE');
  else if (triggers) {
    for (const t of triggers) {
      console.log(`     ⚠️  [${t.event_object_table}] ${t.trigger_name}`);
    }
  }

  // 1c. Políticas que permiten DELETE
  log('🔐 Políticas RLS que permiten DELETE:');
  const policies = await sql('Políticas DELETE', `
    SELECT tablename, policyname, roles
    FROM pg_policies
    WHERE cmd = 'DELETE'
    ORDER BY tablename;
  `);
  if (policies && policies.length === 0) info('No hay políticas DELETE activas');
  else if (policies) {
    for (const p of policies) {
      console.log(`     ⚠️  [${p.tablename}] "${p.policyname}"  roles=${JSON.stringify(p.roles)}`);
    }
  }

  // 1d. ¿Qué tablas críticas existen?
  log('📋 Existencia de tablas críticas:');
  const criticas = [
    'agendamientos','pagos','liquidaciones','multas','asistencias',
    'adelantos','ventas_boutique','gastos','gastos_operativos','notificaciones',
    'solicitudes_entrada','usuarios','clientes',
  ];
  const existe = await sql('Lista de tablas públicas', `
    SELECT tablename FROM pg_tables WHERE schemaname='public';
  `);
  const setTablas = new Set((existe ?? []).map(r => r.tablename));
  const presentes  = criticas.filter(t => setTablas.has(t));
  const ausentes   = criticas.filter(t => !setTablas.has(t));
  presentes.forEach(t => console.log(`     ✅ ${t}`));
  ausentes.forEach(t  => console.log(`     ⚠️  ${t}  ← NO EXISTE todavía`));

  return { presentes, ausentes };
}

// ──────────────────────────────────────────────────────────────────────────────
// FASE 2 — SOFT DELETE
// ──────────────────────────────────────────────────────────────────────────────

// Tablas con full audit trail (eliminado + eliminado_en + eliminado_por)
const FULL_AUDIT = [
  'agendamientos',
  'pagos',
  'liquidaciones',
  'adelantos',
  'gastos',
  'gastos_operativos',
];

// Tablas con solo eliminado
const SIMPLE_FLAG = [
  'multas',
  'asistencias',
  'ventas_boutique',
  'notificaciones',
  'solicitudes_entrada',
];

async function addSoftDeleteColumns(tablas, existentes) {
  for (const t of tablas) {
    if (!existentes.includes(t)) {
      info(`Saltando ${t} — tabla no existe`);
      continue;
    }
    const isFullAudit = FULL_AUDIT.includes(t);
    const extra = isFullAudit
      ? `, ADD COLUMN IF NOT EXISTS eliminado_en TIMESTAMPTZ, ADD COLUMN IF NOT EXISTS eliminado_por UUID`
      : '';
    await sql(`Soft delete en ${t}`, `
      ALTER TABLE ${t}
        ADD COLUMN IF NOT EXISTS eliminado BOOLEAN NOT NULL DEFAULT FALSE
        ${extra};
    `);
  }
}

async function createViews(existentes) {
  const todas = [...FULL_AUDIT, ...SIMPLE_FLAG];
  for (const t of todas) {
    if (!existentes.includes(t)) continue;
    await sql(`Vista v_${t}`, `
      CREATE OR REPLACE VIEW v_${t} AS
        SELECT * FROM ${t} WHERE eliminado IS NOT TRUE;
    `);
  }
}

async function updateSelectPolicies(existentes) {
  // Añade filtro eliminado IS NOT TRUE a las SELECT policies de tablas críticas
  // Estrategia: recrear la policy existente con el filtro extra inyectado vía RLS check en la tabla
  // La forma más limpia es crear un trigger BEFORE DELETE que bloquee borrados físicos

  log('🛡️  Creando triggers que bloquean DELETE físico en tablas críticas...');

  const criticas = [...FULL_AUDIT, ...SIMPLE_FLAG].filter(t => existentes.includes(t));

  // Función genérica que convierte DELETE en soft-delete update
  await sql('Función block_physical_delete()', `
    CREATE OR REPLACE FUNCTION block_physical_delete()
    RETURNS TRIGGER LANGUAGE plpgsql AS $$
    BEGIN
      RAISE EXCEPTION 'Borrado físico no permitido en esta tabla. Usa eliminado=true.';
      RETURN NULL;
    END;
    $$;
  `);

  for (const t of criticas) {
    const triggerName = `trg_no_delete_${t}`;
    await sql(`Trigger anti-delete en ${t}`, `
      DROP TRIGGER IF EXISTS ${triggerName} ON ${t};
      CREATE TRIGGER ${triggerName}
        BEFORE DELETE ON ${t}
        FOR EACH ROW EXECUTE FUNCTION block_physical_delete();
    `);
  }
}

async function createSoftDeleteHelpers() {
  log('⚙️  Creando función soft_delete() helper...');

  // Función helper: soft_delete('tabla', 'uuid')
  await sql('Función soft_delete()', `
    CREATE OR REPLACE FUNCTION soft_delete(p_tabla TEXT, p_id UUID)
    RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER AS $$
    BEGIN
      EXECUTE format(
        'UPDATE %I SET eliminado = TRUE, eliminado_en = NOW(), eliminado_por = auth.uid() WHERE id = $1',
        p_tabla
      ) USING p_id;
    END;
    $$;
  `);

  // Versión sin audit trail
  await sql('Función soft_delete_simple()', `
    CREATE OR REPLACE FUNCTION soft_delete_simple(p_tabla TEXT, p_id UUID)
    RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER AS $$
    BEGIN
      EXECUTE format(
        'UPDATE %I SET eliminado = TRUE WHERE id = $1',
        p_tabla
      ) USING p_id;
    END;
    $$;
  `);
}

async function updateDeletePolicies(existentes) {
  log('🔐 Convirtiendo políticas DELETE → UPDATE (soft delete)...');

  // Tablas donde admin puede "eliminar" = marcar eliminado=true
  const permisos = {
    agendamientos:      `get_user_role() IN ('admin','owner')`,
    pagos:              `get_user_role() IN ('admin','owner')`,
    liquidaciones:      `get_user_role() IN ('admin','owner')`,
    multas:             `get_user_role() IN ('admin','owner','administrador')`,
    asistencias:        `get_user_role() IN ('admin','owner','administrador')`,
    adelantos:          `get_user_role() IN ('admin','owner')`,
    ventas_boutique:    `get_user_role() IN ('admin','owner')`,
    gastos:             `get_user_role() IN ('admin','owner')`,
    gastos_operativos:  `get_user_role() IN ('admin','owner')`,
    notificaciones:     `get_user_role() IN ('admin','owner','supervisor','programador')`,
    solicitudes_entrada:`get_user_role() IN ('admin','owner','administrador')`,
  };

  for (const [tabla, cond] of Object.entries(permisos)) {
    if (!existentes.includes(tabla)) continue;
    await sql(`UPDATE policy soft-delete en ${tabla}`, `
      DROP POLICY IF EXISTS "admin soft delete ${tabla}" ON ${tabla};
      CREATE POLICY "admin soft delete ${tabla}"
        ON ${tabla} FOR UPDATE TO authenticated
        USING (${cond})
        WITH CHECK (${cond});
    `);
  }
}

// ──────────────────────────────────────────────────────────────────────────────
// FASE 3 — HISTORIAL DE CAMBIOS (audit log table)
// ──────────────────────────────────────────────────────────────────────────────
async function fase3() {
  log('════════════════════════════════════════════');
  log('  FASE 3 — TABLA HISTORIAL DE CAMBIOS');
  log('════════════════════════════════════════════');

  await sql('Tabla audit_log', `
    CREATE TABLE IF NOT EXISTS audit_log (
      id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      tabla       TEXT NOT NULL,
      registro_id UUID,
      accion      TEXT NOT NULL CHECK (accion IN ('INSERT','UPDATE','DELETE','SOFT_DELETE')),
      usuario_id  UUID REFERENCES usuarios(id) ON DELETE SET NULL,
      antes       JSONB,
      despues     JSONB,
      ip          TEXT,
      created_at  TIMESTAMPTZ DEFAULT NOW()
    );
    ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "solo admins leen audit_log" ON audit_log;
    CREATE POLICY "solo admins leen audit_log"
      ON audit_log FOR SELECT TO authenticated
      USING (get_user_role() IN ('admin','owner','programador'));
    DROP POLICY IF EXISTS "system inserta audit_log" ON audit_log;
    CREATE POLICY "system inserta audit_log"
      ON audit_log FOR INSERT TO authenticated
      WITH CHECK (TRUE);
  `);

  // Función genérica de auditoría
  await sql('Función audit_trigger_fn()', `
    CREATE OR REPLACE FUNCTION audit_trigger_fn()
    RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
    BEGIN
      INSERT INTO audit_log(tabla, registro_id, accion, antes, despues, usuario_id)
      VALUES (
        TG_TABLE_NAME,
        COALESCE(NEW.id, OLD.id),
        TG_OP,
        CASE WHEN TG_OP IN ('UPDATE','DELETE') THEN to_jsonb(OLD) ELSE NULL END,
        CASE WHEN TG_OP IN ('INSERT','UPDATE') THEN to_jsonb(NEW) ELSE NULL END,
        auth.uid()
      );
      RETURN COALESCE(NEW, OLD);
    END;
    $$;
  `);

  // Trigger en tablas financieras críticas
  for (const tabla of ['agendamientos','pagos','liquidaciones','adelantos','multas']) {
    await sql(`Audit trigger en ${tabla}`, `
      DROP TRIGGER IF EXISTS trg_audit_${tabla} ON ${tabla};
      CREATE TRIGGER trg_audit_${tabla}
        AFTER INSERT OR UPDATE ON ${tabla}
        FOR EACH ROW EXECUTE FUNCTION audit_trigger_fn();
    `);
  }
}

// ──────────────────────────────────────────────────────────────────────────────
// MAIN
// ──────────────────────────────────────────────────────────────────────────────
async function main() {
  console.log('\n══════════════════════════════════════════════════════');
  console.log('  Black Diamond Studios — Auditoría + Soft Delete');
  console.log('══════════════════════════════════════════════════════');

  const { presentes } = await fase1();

  log('════════════════════════════════════════════');
  log('  FASE 2 — IMPLEMENTANDO SOFT DELETE');
  log('════════════════════════════════════════════');

  log('A) Agregando columnas soft delete...');
  await addSoftDeleteColumns([...FULL_AUDIT, ...SIMPLE_FLAG], presentes);

  log('\nB) Creando vistas v_<tabla> (sin eliminados)...');
  await createViews(presentes);

  log('\nC) Triggers que bloquean DELETE físico...');
  await updateSelectPolicies(presentes);

  log('\nD) Funciones helper soft_delete()...');
  await createSoftDeleteHelpers();

  log('\nE) Policies UPDATE para soft delete...');
  await updateDeletePolicies(presentes);

  await fase3();

  log('══════════════════════════════════════════════════════');
  log('  ✅  Auditoría e integridad completadas.');
  log('══════════════════════════════════════════════════════\n');
}

main().catch(e => { console.error('💥 Fatal:', e.message); process.exit(1); });
