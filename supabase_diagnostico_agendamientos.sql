-- ============================================================
-- BLACK DIAMOND - Diagnóstico agendamientos POST 400
-- Ejecutar en: Supabase Dashboard → SQL Editor → New query → Run
-- Esto revela qué constraint está rechazando el INSERT
-- ============================================================

-- 1. Ver todas las columnas y sus constraints
SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'agendamientos'
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2. Ver todos los constraints (CHECK, NOT NULL, FK, UNIQUE)
SELECT
  conname AS constraint_name,
  contype AS type,
  pg_get_constraintdef(oid) AS definition
FROM pg_constraint
WHERE conrelid = 'agendamientos'::regclass
ORDER BY contype;

-- 3. Ver políticas RLS activas
SELECT policyname, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'agendamientos';

-- 4. Test INSERT directo (como service_role — bypasea RLS)
-- Cambia los valores según el error que estás viendo
-- INSERT INTO agendamientos (
--   cliente_id, modelo_id, modelo_email, modelo_nombre,
--   cliente_nombre, fecha, hora, estado, tipo_servicio,
--   monto_pago, estado_pago, servicio
-- ) VALUES (
--   gen_random_uuid(), gen_random_uuid(), 'test@test.com', 'Test Modelo',
--   'Test Cliente', CURRENT_DATE + 1, '10:00', 'pendiente', 'sede',
--   100000, 'pendiente', 'Servicio Test'
-- );
