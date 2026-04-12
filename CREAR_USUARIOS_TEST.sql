-- ============================================================
-- BLACK DIAMOND STUDIOS — SCRIPT DE USUARIOS DE PRUEBA v2
-- Ejecutar en: Supabase Dashboard → SQL Editor
-- Contraseña para todos: 123456
-- ============================================================
-- FIXES en v2:
--   1. Amplía la CHECK constraint de usuarios.role para incluir
--      los 4 roles nuevos: moderador, contador, recepcionista, supervisor
--   2. Elimina columnas inexistentes del INSERT (activo, fecha_creacion)
--   3. Comentarios actualizados — todos los roles tienen dashboard propio
-- ============================================================

DO $$
DECLARE
  uid_admin          UUID := gen_random_uuid();
  uid_owner          UUID := gen_random_uuid();
  uid_modelo         UUID := gen_random_uuid();
  uid_programador    UUID := gen_random_uuid();
  uid_moderador      UUID := gen_random_uuid();
  uid_contador       UUID := gen_random_uuid();
  uid_recepcionista  UUID := gen_random_uuid();
  uid_supervisor     UUID := gen_random_uuid();

  hashed_pass        TEXT := crypt('123456', gen_salt('bf', 10));
  instance_id_val    UUID := '00000000-0000-0000-0000-000000000000';
  constraint_name    TEXT;
BEGIN

  -- ════════════════════════════════════════════════════════
  -- FIX: Ampliar CHECK constraint de role en public.usuarios
  -- Elimina la constraint existente (cualquiera que sea su nombre)
  -- y la reemplaza con una que incluye los 8 roles
  -- ════════════════════════════════════════════════════════
  SELECT conname INTO constraint_name
  FROM pg_constraint
  WHERE conrelid = 'public.usuarios'::regclass
    AND contype = 'c'
    AND pg_get_constraintdef(oid) LIKE '%role%'
  LIMIT 1;

  IF constraint_name IS NOT NULL THEN
    EXECUTE format('ALTER TABLE public.usuarios DROP CONSTRAINT %I', constraint_name);
  END IF;

  ALTER TABLE public.usuarios
    ADD CONSTRAINT usuarios_role_check
    CHECK (role IN (
      'owner', 'admin', 'programador', 'modelo',
      'moderador', 'contador', 'recepcionista', 'supervisor'
    ));

  RAISE NOTICE '✅ CHECK constraint de role actualizada para incluir los 8 roles';

  -- ════════════════════════════════════════════════════════
  -- LIMPIAR USUARIOS DE PRUEBA PREVIOS (idempotente)
  -- ════════════════════════════════════════════════════════
  -- Borra auth.users primero — el CASCADE elimina auth.identities y public.usuarios automáticamente
  DELETE FROM auth.users
  WHERE email IN (
    'admin.test@blackdiamond.com',
    'owner.test@blackdiamond.com',
    'modelo.test@blackdiamond.com',
    'programador.test@blackdiamond.com',
    'moderador.test@blackdiamond.com',
    'contador.test@blackdiamond.com',
    'recepcionista.test@blackdiamond.com',
    'supervisor.test@blackdiamond.com'
  );

  -- ════════════════════════════════════════════════════════
  -- 1. ROL: ADMIN → AdminDashboard
  -- ════════════════════════════════════════════════════════
  INSERT INTO auth.users (
    id, instance_id, aud, role,
    email, encrypted_password,
    email_confirmed_at, created_at, updated_at,
    raw_app_meta_data, raw_user_meta_data,
    is_super_admin, confirmation_token,
    email_change, email_change_token_new, recovery_token
  ) VALUES (
    uid_admin, instance_id_val, 'authenticated', 'authenticated',
    'admin.test@blackdiamond.com', hashed_pass,
    NOW(), NOW(), NOW(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"nombre":"Admin Test","role":"admin"}'::jsonb,
    FALSE, '', '', '', ''
  );
  INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
  VALUES (
    gen_random_uuid(), uid_admin,
    format('{"sub":"%s","email":"admin.test@blackdiamond.com"}', uid_admin::text)::jsonb,
    'email', 'admin.test@blackdiamond.com', NOW(), NOW(), NOW()
  );
  INSERT INTO public.usuarios (id, email, nombre, role)
  VALUES (uid_admin, 'admin.test@blackdiamond.com', 'Admin Test', 'admin')
  ON CONFLICT (id) DO NOTHING;


  -- ════════════════════════════════════════════════════════
  -- 2. ROL: OWNER → OwnerDashboard
  -- ════════════════════════════════════════════════════════
  INSERT INTO auth.users (
    id, instance_id, aud, role,
    email, encrypted_password,
    email_confirmed_at, created_at, updated_at,
    raw_app_meta_data, raw_user_meta_data,
    is_super_admin, confirmation_token,
    email_change, email_change_token_new, recovery_token
  ) VALUES (
    uid_owner, instance_id_val, 'authenticated', 'authenticated',
    'owner.test@blackdiamond.com', hashed_pass,
    NOW(), NOW(), NOW(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"nombre":"Owner Test","role":"owner"}'::jsonb,
    FALSE, '', '', '', ''
  );
  INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
  VALUES (
    gen_random_uuid(), uid_owner,
    format('{"sub":"%s","email":"owner.test@blackdiamond.com"}', uid_owner::text)::jsonb,
    'email', 'owner.test@blackdiamond.com', NOW(), NOW(), NOW()
  );
  INSERT INTO public.usuarios (id, email, nombre, role)
  VALUES (uid_owner, 'owner.test@blackdiamond.com', 'Owner Test', 'owner')
  ON CONFLICT (id) DO NOTHING;


  -- ════════════════════════════════════════════════════════
  -- 3. ROL: MODELO → ModeloDashboard
  -- ════════════════════════════════════════════════════════
  INSERT INTO auth.users (
    id, instance_id, aud, role,
    email, encrypted_password,
    email_confirmed_at, created_at, updated_at,
    raw_app_meta_data, raw_user_meta_data,
    is_super_admin, confirmation_token,
    email_change, email_change_token_new, recovery_token
  ) VALUES (
    uid_modelo, instance_id_val, 'authenticated', 'authenticated',
    'modelo.test@blackdiamond.com', hashed_pass,
    NOW(), NOW(), NOW(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"nombre":"Modelo Test","role":"modelo"}'::jsonb,
    FALSE, '', '', '', ''
  );
  INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
  VALUES (
    gen_random_uuid(), uid_modelo,
    format('{"sub":"%s","email":"modelo.test@blackdiamond.com"}', uid_modelo::text)::jsonb,
    'email', 'modelo.test@blackdiamond.com', NOW(), NOW(), NOW()
  );
  INSERT INTO public.usuarios (id, email, nombre, role)
  VALUES (uid_modelo, 'modelo.test@blackdiamond.com', 'Modelo Test', 'modelo')
  ON CONFLICT (id) DO NOTHING;


  -- ════════════════════════════════════════════════════════
  -- 4. ROL: PROGRAMADOR → ProgramadorDashboard
  -- ════════════════════════════════════════════════════════
  INSERT INTO auth.users (
    id, instance_id, aud, role,
    email, encrypted_password,
    email_confirmed_at, created_at, updated_at,
    raw_app_meta_data, raw_user_meta_data,
    is_super_admin, confirmation_token,
    email_change, email_change_token_new, recovery_token
  ) VALUES (
    uid_programador, instance_id_val, 'authenticated', 'authenticated',
    'programador.test@blackdiamond.com', hashed_pass,
    NOW(), NOW(), NOW(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"nombre":"Programador Test","role":"programador"}'::jsonb,
    FALSE, '', '', '', ''
  );
  INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
  VALUES (
    gen_random_uuid(), uid_programador,
    format('{"sub":"%s","email":"programador.test@blackdiamond.com"}', uid_programador::text)::jsonb,
    'email', 'programador.test@blackdiamond.com', NOW(), NOW(), NOW()
  );
  INSERT INTO public.usuarios (id, email, nombre, role)
  VALUES (uid_programador, 'programador.test@blackdiamond.com', 'Programador Test', 'programador')
  ON CONFLICT (id) DO NOTHING;


  -- ════════════════════════════════════════════════════════
  -- 5. ROL: MODERADOR → ModeradorDashboard
  -- ════════════════════════════════════════════════════════
  INSERT INTO auth.users (
    id, instance_id, aud, role,
    email, encrypted_password,
    email_confirmed_at, created_at, updated_at,
    raw_app_meta_data, raw_user_meta_data,
    is_super_admin, confirmation_token,
    email_change, email_change_token_new, recovery_token
  ) VALUES (
    uid_moderador, instance_id_val, 'authenticated', 'authenticated',
    'moderador.test@blackdiamond.com', hashed_pass,
    NOW(), NOW(), NOW(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"nombre":"Moderador Test","role":"moderador"}'::jsonb,
    FALSE, '', '', '', ''
  );
  INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
  VALUES (
    gen_random_uuid(), uid_moderador,
    format('{"sub":"%s","email":"moderador.test@blackdiamond.com"}', uid_moderador::text)::jsonb,
    'email', 'moderador.test@blackdiamond.com', NOW(), NOW(), NOW()
  );
  INSERT INTO public.usuarios (id, email, nombre, role)
  VALUES (uid_moderador, 'moderador.test@blackdiamond.com', 'Moderador Test', 'moderador')
  ON CONFLICT (id) DO NOTHING;


  -- ════════════════════════════════════════════════════════
  -- 6. ROL: CONTADOR → ContadorDashboard
  -- ════════════════════════════════════════════════════════
  INSERT INTO auth.users (
    id, instance_id, aud, role,
    email, encrypted_password,
    email_confirmed_at, created_at, updated_at,
    raw_app_meta_data, raw_user_meta_data,
    is_super_admin, confirmation_token,
    email_change, email_change_token_new, recovery_token
  ) VALUES (
    uid_contador, instance_id_val, 'authenticated', 'authenticated',
    'contador.test@blackdiamond.com', hashed_pass,
    NOW(), NOW(), NOW(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"nombre":"Contador Test","role":"contador"}'::jsonb,
    FALSE, '', '', '', ''
  );
  INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
  VALUES (
    gen_random_uuid(), uid_contador,
    format('{"sub":"%s","email":"contador.test@blackdiamond.com"}', uid_contador::text)::jsonb,
    'email', 'contador.test@blackdiamond.com', NOW(), NOW(), NOW()
  );
  INSERT INTO public.usuarios (id, email, nombre, role)
  VALUES (uid_contador, 'contador.test@blackdiamond.com', 'Contador Test', 'contador')
  ON CONFLICT (id) DO NOTHING;


  -- ════════════════════════════════════════════════════════
  -- 7. ROL: RECEPCIONISTA → RecepcionistaDashboard
  -- ════════════════════════════════════════════════════════
  INSERT INTO auth.users (
    id, instance_id, aud, role,
    email, encrypted_password,
    email_confirmed_at, created_at, updated_at,
    raw_app_meta_data, raw_user_meta_data,
    is_super_admin, confirmation_token,
    email_change, email_change_token_new, recovery_token
  ) VALUES (
    uid_recepcionista, instance_id_val, 'authenticated', 'authenticated',
    'recepcionista.test@blackdiamond.com', hashed_pass,
    NOW(), NOW(), NOW(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"nombre":"Recepcionista Test","role":"recepcionista"}'::jsonb,
    FALSE, '', '', '', ''
  );
  INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
  VALUES (
    gen_random_uuid(), uid_recepcionista,
    format('{"sub":"%s","email":"recepcionista.test@blackdiamond.com"}', uid_recepcionista::text)::jsonb,
    'email', 'recepcionista.test@blackdiamond.com', NOW(), NOW(), NOW()
  );
  INSERT INTO public.usuarios (id, email, nombre, role)
  VALUES (uid_recepcionista, 'recepcionista.test@blackdiamond.com', 'Recepcionista Test', 'recepcionista')
  ON CONFLICT (id) DO NOTHING;


  -- ══════════════════════════════��═════════════════════════
  -- 8. ROL: SUPERVISOR → SupervisorDashboard
  -- ════════════════════════════════════════════════════════
  INSERT INTO auth.users (
    id, instance_id, aud, role,
    email, encrypted_password,
    email_confirmed_at, created_at, updated_at,
    raw_app_meta_data, raw_user_meta_data,
    is_super_admin, confirmation_token,
    email_change, email_change_token_new, recovery_token
  ) VALUES (
    uid_supervisor, instance_id_val, 'authenticated', 'authenticated',
    'supervisor.test@blackdiamond.com', hashed_pass,
    NOW(), NOW(), NOW(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"nombre":"Supervisor Test","role":"supervisor"}'::jsonb,
    FALSE, '', '', '', ''
  );
  INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
  VALUES (
    gen_random_uuid(), uid_supervisor,
    format('{"sub":"%s","email":"supervisor.test@blackdiamond.com"}', uid_supervisor::text)::jsonb,
    'email', 'supervisor.test@blackdiamond.com', NOW(), NOW(), NOW()
  );
  INSERT INTO public.usuarios (id, email, nombre, role)
  VALUES (uid_supervisor, 'supervisor.test@blackdiamond.com', 'Supervisor Test', 'supervisor')
  ON CONFLICT (id) DO NOTHING;


  RAISE NOTICE '✅ 8 usuarios de prueba creados correctamente (v2)';
  RAISE NOTICE '   admin.test@blackdiamond.com        / 123456 → AdminDashboard';
  RAISE NOTICE '   owner.test@blackdiamond.com        / 123456 → OwnerDashboard';
  RAISE NOTICE '   modelo.test@blackdiamond.com       / 123456 → ModeloDashboard';
  RAISE NOTICE '   programador.test@blackdiamond.com  / 123456 → ProgramadorDashboard';
  RAISE NOTICE '   moderador.test@blackdiamond.com    / 123456 → ModeradorDashboard';
  RAISE NOTICE '   contador.test@blackdiamond.com     / 123456 → ContadorDashboard';
  RAISE NOTICE '   recepcionista.test@blackdiamond.com/ 123456 → RecepcionistaDashboard';
  RAISE NOTICE '   supervisor.test@blackdiamond.com   / 123456 → SupervisorDashboard';

END $$;


-- ════════════════════════════════════════════════════════════
-- VERIFICACIÓN: confirmar ligado correcto de los 8 usuarios
-- ════════════════════════════════════════════════════════════
SELECT
  u.email,
  u.email_confirmed_at IS NOT NULL        AS "auth_confirmado",
  pu.role                                 AS "rol_en_usuarios",
  (u.id = pu.id)                          AS "uuid_ligado_ok",
  i.provider                              AS "identity_provider"
FROM auth.users u
LEFT JOIN public.usuarios pu ON pu.id = u.id
LEFT JOIN auth.identities i  ON i.user_id = u.id
WHERE u.email LIKE '%.test@blackdiamond.com'
ORDER BY u.email;
