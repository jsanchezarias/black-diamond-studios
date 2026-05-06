-- =====================================================================
-- FIX CRÍTICO: Políticas RLS para usuarios con role='cliente'
-- Problema: clientes no podían ver modelos, sus citas ni su perfil
-- Ejecutar completo en Supabase SQL Editor
-- =====================================================================

-- ──────────────────────────────────────────────────────────────────
-- 1. TABLA usuarios: clientes deben poder ver modelos activas
--    Sin esta política, ModelosContext devuelve [] para clientes
-- ──────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "clientes ven modelos activas" ON usuarios;
CREATE POLICY "clientes ven modelos activas"
  ON usuarios FOR SELECT
  USING (
    role = 'modelo'
    AND (
      estado IS NULL
      OR estado = ''
      OR estado = 'activo'
      OR estado = 'Activo'
      OR estado = 'ACTIVO'
      OR estado = 'active'
    )
    AND (fecha_archivado IS NULL)
  );

-- ──────────────────────────────────────────────────────────────────
-- 2. TABLA agendamientos: clientes deben poder ver sus propias citas
-- ──────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "cliente ve sus agendamientos" ON agendamientos;
CREATE POLICY "cliente ve sus agendamientos"
  ON agendamientos FOR SELECT
  USING (
    cliente_id = auth.uid()
    OR cliente_email = (auth.jwt() ->> 'email')
  );

-- ──────────────────────────────────────────────────────────────────
-- 3. TABLA agendamientos: clientes deben poder CREAR agendamientos
-- ──────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "cliente crea agendamiento" ON agendamientos;
CREATE POLICY "cliente crea agendamiento"
  ON agendamientos FOR INSERT
  WITH CHECK (
    cliente_id = auth.uid()
    OR cliente_email = (auth.jwt() ->> 'email')
  );

-- ──────────────────────────────────────────────────────────────────
-- 4. TABLA agendamientos: clientes pueden CANCELAR sus propias citas
--    (solo si no están completadas/finalizadas)
-- ──────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "cliente cancela su agendamiento" ON agendamientos;
CREATE POLICY "cliente cancela su agendamiento"
  ON agendamientos FOR UPDATE
  USING (
    (cliente_id = auth.uid() OR cliente_email = (auth.jwt() ->> 'email'))
    AND estado NOT IN ('completado', 'finalizado', 'archivado')
  )
  WITH CHECK (
    estado = 'cancelado'
  );

-- ──────────────────────────────────────────────────────────────────
-- 5. TABLA clientes: cada cliente ve su propio perfil
-- ──────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "cliente ve su propio perfil" ON clientes;
CREATE POLICY "cliente ve su propio perfil"
  ON clientes FOR SELECT
  USING (
    user_id = auth.uid()
    OR email = (auth.jwt() ->> 'email')
  );

-- ──────────────────────────────────────────────────────────────────
-- 6. TABLA modelo_fotos: clientes (y cualquier auth) ven fotos de
--    modelos activas. Si la tabla no tiene RLS activo, esto es
--    preventivo; si lo tiene, es necesario.
-- ──────────────────────────────────────────────────────────────────
ALTER TABLE IF EXISTS modelo_fotos ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "autenticados ven fotos modelos activas" ON modelo_fotos;
CREATE POLICY "autenticados ven fotos modelos activas"
  ON modelo_fotos FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM usuarios
      WHERE id = modelo_fotos.modelo_id
        AND role = 'modelo'
        AND (estado IS NULL OR estado = '' OR estado = 'activo')
        AND fecha_archivado IS NULL
    )
  );

-- ──────────────────────────────────────────────────────────────────
-- 7. TABLA notificaciones: cliente ve sus propias notificaciones
-- ──────────────────────────────────────────────────────────────────
ALTER TABLE IF EXISTS notificaciones ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "cliente ve sus notificaciones" ON notificaciones;
CREATE POLICY "cliente ve sus notificaciones"
  ON notificaciones FOR SELECT
  USING (usuario_id = auth.uid());

DROP POLICY IF EXISTS "cliente actualiza sus notificaciones" ON notificaciones;
CREATE POLICY "cliente actualiza sus notificaciones"
  ON notificaciones FOR UPDATE
  USING (usuario_id = auth.uid())
  WITH CHECK (usuario_id = auth.uid());

-- ──────────────────────────────────────────────────────────────────
-- VERIFICACIÓN: Ejecutar esto después para confirmar las políticas
-- ──────────────────────────────────────────────────────────────────
SELECT
  tablename,
  policyname,
  cmd,
  qual
FROM pg_policies
WHERE tablename IN ('usuarios', 'agendamientos', 'clientes', 'modelo_fotos', 'notificaciones')
  AND policyname ILIKE '%cliente%'
ORDER BY tablename, policyname;
