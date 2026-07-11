-- ============================================================
-- BLACK DIAMOND - FIX v2: Columnas faltantes en agendamientos
-- + Ampliar CHECK constraint de estado
--
-- Ejecutar en: Supabase Dashboard → SQL Editor → New query → Run
-- ============================================================

-- ── Columnas de referencia ─────────────────────────────────────────────────────
ALTER TABLE agendamientos ADD COLUMN IF NOT EXISTS modelo_id uuid;
ALTER TABLE agendamientos ADD COLUMN IF NOT EXISTS cliente_ref_id uuid;
ALTER TABLE agendamientos ADD COLUMN IF NOT EXISTS creado_por_rol text;

-- ── Columnas de legacy (alias) ─────────────────────────────────────────────────
ALTER TABLE agendamientos ADD COLUMN IF NOT EXISTS precio numeric(12,2) DEFAULT 0;
ALTER TABLE agendamientos ADD COLUMN IF NOT EXISTS servicio text;

-- ── Columnas de ubicación ──────────────────────────────────────────────────────
ALTER TABLE agendamientos ADD COLUMN IF NOT EXISTS ubicacion text;
ALTER TABLE agendamientos ADD COLUMN IF NOT EXISTS habitacion text;

-- ── Columnas de control ────────────────────────────────────────────────────────
ALTER TABLE agendamientos ADD COLUMN IF NOT EXISTS archivado boolean DEFAULT false;
ALTER TABLE agendamientos ADD COLUMN IF NOT EXISTS fecha_archivado timestamptz;
ALTER TABLE agendamientos ADD COLUMN IF NOT EXISTS archivado_por text;

-- ── Columnas de tiempo real del servicio ──────────────────────────────────────
ALTER TABLE agendamientos ADD COLUMN IF NOT EXISTS hora_fin_real timestamptz;

-- ── Columnas de flujo de aprobación ───────────────────────────────────────────
ALTER TABLE agendamientos ADD COLUMN IF NOT EXISTS aceptado_por text;
ALTER TABLE agendamientos ADD COLUMN IF NOT EXISTS fecha_aceptacion timestamptz;

-- ── Ampliar CHECK constraint de estado ────────────────────────────────────────
-- El constraint actual solo permite 5 valores. El sistema usa más de 10.
ALTER TABLE agendamientos DROP CONSTRAINT IF EXISTS agendamientos_estado_check;
ALTER TABLE agendamientos ADD CONSTRAINT agendamientos_estado_check
  CHECK (estado IN (
    'pendiente',
    'confirmado',
    'aprobado',
    'en_curso',
    'activo',
    'completado',
    'cancelado',
    'no_show',
    'aceptado_programador',
    'solicitud_cliente',
    'creado_por_modelo',
    'rechazado',
    'archivado'
  ));

-- ── VERIFICACIÓN ──────────────────────────────────────────────────────────────
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'agendamientos'
  AND table_schema = 'public'
ORDER BY ordinal_position;
