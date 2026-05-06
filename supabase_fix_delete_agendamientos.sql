-- =====================================================================
-- FIX: Nore (admin) no puede eliminar agendamientos
-- Causas: RLS sin política DELETE en notificaciones, FK sin CASCADE
-- Ejecutar completo en Supabase SQL Editor
-- =====================================================================

-- ──────────────────��───────────────────────────────���──────────────────
-- DIAGNÓSTICO PREVIO — Ejecuta esto primero para ver el estado actual
-- ─────────────────────────────────────────────────────────────────────
/*
-- ¿Qué rol tiene Nore exactamente?
SELECT id, email, role FROM usuarios WHERE email ILIKE '%nore%';

-- ¿Qué políticas DELETE existen en agendamientos?
SELECT policyname, cmd, qual
FROM pg_policies
WHERE tablename = 'agendamientos' AND cmd IN ('DELETE','ALL');

-- ¿Qué FK apuntan a agendamientos?
SELECT
  tc.table_name   AS tabla_hija,
  kcu.column_name AS columna_fk,
  rc.delete_rule
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.referential_constraints rc
  ON tc.constraint_name = rc.constraint_name
WHERE rc.unique_constraint_name IN (
  SELECT constraint_name
  FROM information_schema.table_constraints
  WHERE table_name = 'agendamientos' AND constraint_type = 'PRIMARY KEY'
);

-- ¿Qué políticas tiene notificaciones?
SELECT policyname, cmd, qual
FROM pg_policies WHERE tablename = 'notificaciones';
*/

-- ───────────────────────────────────────────���────────────────────���────
-- FIX 1: Política DELETE explícita en agendamientos para admin/owner
-- (belt-and-suspenders: FOR ALL ya cubre DELETE, pero lo hacemos
--  explícito para evitar conflictos con otras políticas)
-- ─────────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "admin elimina agendamientos" ON agendamientos;
CREATE POLICY "admin elimina agendamientos"
  ON agendamientos FOR DELETE
  USING (get_user_role() IN ('admin', 'owner'));

-- ─────────────────────────────────────────────────────────────────────
-- FIX 2: Admin puede eliminar notificaciones
-- Sin esta política, el paso 1 del delete falla silenciosamente
-- y la FK notificaciones→agendamientos bloquea el delete final
-- ─────────────────────────────────────────────────────────────────────
ALTER TABLE IF EXISTS notificaciones ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin elimina notificaciones" ON notificaciones;
CREATE POLICY "admin elimina notificaciones"
  ON notificaciones FOR DELETE
  USING (get_user_role() IN ('admin', 'owner', 'supervisor', 'programador'));

DROP POLICY IF EXISTS "admin gestiona notificaciones" ON notificaciones;
CREATE POLICY "admin gestiona notificaciones"
  ON notificaciones FOR ALL
  USING (get_user_role() IN ('admin', 'owner'));

-- ─────────────────────────────────────────────────────────────────────
-- FIX 3: Admin puede eliminar multas y pagos relacionados
-- ─────────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "admin elimina multas" ON multas;
CREATE POLICY "admin elimina multas"
  ON multas FOR DELETE
  USING (get_user_role() IN ('admin', 'owner', 'supervisor'));

DROP POLICY IF EXISTS "admin elimina pagos" ON pagos;
CREATE POLICY "admin elimina pagos"
  ON pagos FOR DELETE
  USING (get_user_role() IN ('admin', 'owner', 'contador'));

-- ─────────────────────────────────────────────────────────────────────
-- FIX 4: FK con ON DELETE CASCADE
-- Si hay FKs de otras tablas → agendamientos sin CASCADE, el DELETE
-- falla con error 23503 (foreign key violation).
-- El nombre del constraint varía — intentamos los nombres comunes.
-- ─────────────────────────────────────────────────────────────────────

-- notificaciones.agendamiento_id → agendamientos.id
DO $$
DECLARE con text;
BEGIN
  SELECT conname INTO con
  FROM pg_constraint
  WHERE conrelid = 'public.notificaciones'::regclass
    AND contype = 'f'
    AND pg_get_constraintdef(oid) ILIKE '%agendamientos%'
  LIMIT 1;

  IF con IS NOT NULL THEN
    EXECUTE format('ALTER TABLE notificaciones DROP CONSTRAINT %I', con);
  END IF;
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

ALTER TABLE IF EXISTS notificaciones
  ADD CONSTRAINT notificaciones_agendamiento_id_fkey
  FOREIGN KEY (agendamiento_id)
  REFERENCES agendamientos(id)
  ON DELETE CASCADE;

-- multas.agendamiento_id → agendamientos.id
DO $$
DECLARE con text;
BEGIN
  SELECT conname INTO con
  FROM pg_constraint
  WHERE conrelid = 'public.multas'::regclass
    AND contype = 'f'
    AND pg_get_constraintdef(oid) ILIKE '%agendamientos%'
  LIMIT 1;

  IF con IS NOT NULL THEN
    EXECUTE format('ALTER TABLE multas DROP CONSTRAINT %I', con);
  END IF;
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

ALTER TABLE IF EXISTS multas
  ADD CONSTRAINT multas_agendamiento_id_fkey
  FOREIGN KEY (agendamiento_id)
  REFERENCES agendamientos(id)
  ON DELETE CASCADE;

-- pagos.agendamiento_id → agendamientos.id
DO $$
DECLARE con text;
BEGIN
  SELECT conname INTO con
  FROM pg_constraint
  WHERE conrelid = 'public.pagos'::regclass
    AND contype = 'f'
    AND pg_get_constraintdef(oid) ILIKE '%agendamientos%'
  LIMIT 1;

  IF con IS NOT NULL THEN
    EXECUTE format('ALTER TABLE pagos DROP CONSTRAINT %I', con);
  END IF;
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

ALTER TABLE IF EXISTS pagos
  ADD CONSTRAINT pagos_agendamiento_id_fkey
  FOREIGN KEY (agendamiento_id)
  REFERENCES agendamientos(id)
  ON DELETE CASCADE;

-- ─────────────────────────────────────────────────────────────────────
-- VERIFICACIÓN FINAL
-- ─────────────────────────────────────────────────────────────────────
SELECT tablename, policyname, cmd, qual
FROM pg_policies
WHERE tablename IN ('agendamientos','notificaciones','multas','pagos')
  AND cmd IN ('DELETE','ALL')
ORDER BY tablename, cmd;
