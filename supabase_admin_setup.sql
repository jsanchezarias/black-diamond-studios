-- ============================================================
-- BLACK DIAMOND - Configuración Admin
-- Ejecutar en: Supabase Dashboard → SQL Editor → New query → Run
-- ============================================================

-- 1. Asignar rol administrador a noreidysotto@gmail.com
UPDATE usuarios
SET role = 'administrador'
WHERE email = 'noreidysotto@gmail.com';

-- 2. Verificar
SELECT id, email, role, estado
FROM usuarios
WHERE email = 'noreidysotto@gmail.com';
