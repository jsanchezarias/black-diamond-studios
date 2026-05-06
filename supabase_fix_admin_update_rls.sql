-- =====================================================================
-- FIX: RLS para que admin pueda UPDATE cualquier usuario
-- La Edge Function admin-update-user usa service_role (bypass RLS),
-- pero esta política permite también UPDATEs directos del admin.
-- Ejecutar en Supabase SQL Editor
-- =====================================================================

-- ─────────────────────────────────────────────────────────────────────
-- 1. Política UPDATE en tabla usuarios
-- ─────────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "update_usuario_policy" ON usuarios;
CREATE POLICY "update_usuario_policy"
  ON usuarios FOR UPDATE
  TO authenticated
  USING (
    id = auth.uid()
    OR get_user_role() IN ('admin', 'administrador')
  )
  WITH CHECK (
    id = auth.uid()
    OR get_user_role() IN ('admin', 'administrador')
  );

-- ─────────────────────────────────────────────────────────────────────
-- 2. Política SELECT ampliada para que admin vea todos los usuarios
-- ─────────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "admin lee todos los usuarios" ON usuarios;
CREATE POLICY "admin lee todos los usuarios"
  ON usuarios FOR SELECT
  TO authenticated
  USING (
    get_user_role() IN ('admin', 'administrador', 'owner', 'supervisor', 'programador')
  );

-- ─────────────────────────────────────────────────────────────────────
-- 3. Agregar columna porcentaje_comision si no existe
-- ─────────────────────────────────────────────────────────────────────
ALTER TABLE usuarios
  ADD COLUMN IF NOT EXISTS porcentaje_comision NUMERIC(5,2) DEFAULT 50;

-- ─────────────────────────────────────────────────────────────────────
-- VERIFICACIÓN
-- ─────────────────────────────────────────────────────────────────────
SELECT tablename, policyname, cmd, roles
FROM pg_policies
WHERE tablename = 'usuarios'
ORDER BY cmd, policyname;
