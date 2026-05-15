-- =============================================
-- RLS COMPLETO - Black Diamond Studios
-- Versión mejorada: fusiona helper get_user_role() + políticas completas
-- Roles válidos: programador | owner | administrador | modelo | cliente
--                contador | recepcionista | supervisor | moderador
-- Ejecutar completo en Supabase SQL Editor
-- =============================================

-- ================================================
-- PASO 0: FUNCIÓN HELPER get_user_role()
-- SECURITY DEFINER = bypasea RLS al leer usuarios
-- STABLE = Postgres cachea el resultado por query
-- ================================================
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS text AS $$
  SELECT COALESCE(role, '') FROM public.usuarios WHERE id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ================================================
-- HABILITAR RLS EN TODAS LAS TABLAS PRINCIPALES
-- ================================================
ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE modelos ENABLE ROW LEVEL SECURITY;
ALTER TABLE agendamientos ENABLE ROW LEVEL SECURITY;
ALTER TABLE pagos ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_mensajes_publicos ENABLE ROW LEVEL SECURITY;
ALTER TABLE notificaciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE multas ENABLE ROW LEVEL SECURITY;
ALTER TABLE liquidaciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE habitaciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventario_boutique ENABLE ROW LEVEL SECURITY;
ALTER TABLE compras ENABLE ROW LEVEL SECURITY;
ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE modelo_fotos ENABLE ROW LEVEL SECURITY;
ALTER TABLE balance_financiero ENABLE ROW LEVEL SECURITY;
ALTER TABLE gastos_operativos ENABLE ROW LEVEL SECURITY;
ALTER TABLE gastos ENABLE ROW LEVEL SECURITY;
ALTER TABLE adelantos ENABLE ROW LEVEL SECURITY;
ALTER TABLE asistencias ENABLE ROW LEVEL SECURITY;
ALTER TABLE stream_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE ventas_boutique ENABLE ROW LEVEL SECURITY;
ALTER TABLE boutique_solicitudes ENABLE ROW LEVEL SECURITY;
ALTER TABLE eventos ENABLE ROW LEVEL SECURITY;
ALTER TABLE servicios_modelo ENABLE ROW LEVEL SECURITY;
ALTER TABLE servicios_publicos ENABLE ROW LEVEL SECURITY;
ALTER TABLE servicios_politica ENABLE ROW LEVEL SECURITY;
ALTER TABLE testimonios ENABLE ROW LEVEL SECURITY;
ALTER TABLE productos ENABLE ROW LEVEL SECURITY;
ALTER TABLE error_logs ENABLE ROW LEVEL SECURITY;

-- ================================================
-- TABLAS PÚBLICAS (landing page, sin auth)
-- ================================================

-- chat_mensajes_publicos
DROP POLICY IF EXISTS "publico lee chat" ON chat_mensajes_publicos;
DROP POLICY IF EXISTS "publico escribe chat" ON chat_mensajes_publicos;
DROP POLICY IF EXISTS "admin modera chat" ON chat_mensajes_publicos;
DROP POLICY IF EXISTS "chat_read_public" ON chat_mensajes_publicos;
DROP POLICY IF EXISTS "chat_write_authenticated" ON chat_mensajes_publicos;
DROP POLICY IF EXISTS "chat_delete_moderator" ON chat_mensajes_publicos;
CREATE POLICY "chat_read_public"
  ON chat_mensajes_publicos FOR SELECT USING (true);
CREATE POLICY "chat_write_authenticated"
  ON chat_mensajes_publicos FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "chat_delete_moderator"
  ON chat_mensajes_publicos FOR DELETE
  USING (get_user_role() IN ('administrador','owner','moderador'));
CREATE POLICY "admin modera chat"
  ON chat_mensajes_publicos FOR UPDATE
  USING (get_user_role() IN ('administrador','owner','moderador','supervisor'));

-- servicios_publicos
DROP POLICY IF EXISTS "publico ve servicios" ON servicios_publicos;
DROP POLICY IF EXISTS "admin edita servicios publicos" ON servicios_publicos;
CREATE POLICY "publico ve servicios"
  ON servicios_publicos FOR SELECT USING (true);
CREATE POLICY "admin edita servicios publicos"
  ON servicios_publicos FOR ALL
  USING (get_user_role() IN ('administrador','owner'));

-- servicios_politica
DROP POLICY IF EXISTS "publico ve politicas" ON servicios_politica;
DROP POLICY IF EXISTS "admin edita politicas" ON servicios_politica;
CREATE POLICY "publico ve politicas"
  ON servicios_politica FOR SELECT USING (true);
CREATE POLICY "admin edita politicas"
  ON servicios_politica FOR ALL
  USING (get_user_role() IN ('administrador','owner'));

-- testimonios
DROP POLICY IF EXISTS "publico ve testimonios" ON testimonios;
DROP POLICY IF EXISTS "admin gestiona testimonios" ON testimonios;
CREATE POLICY "publico ve testimonios"
  ON testimonios FOR SELECT USING (true);
CREATE POLICY "admin gestiona testimonios"
  ON testimonios FOR ALL
  USING (get_user_role() IN ('administrador','owner','moderador'));

-- productos (boutique)
DROP POLICY IF EXISTS "publico ve productos" ON productos;
DROP POLICY IF EXISTS "autenticados ven productos" ON productos;
DROP POLICY IF EXISTS "admin edita productos" ON productos;
CREATE POLICY "publico ve productos"
  ON productos FOR SELECT USING (true);
CREATE POLICY "admin edita productos"
  ON productos FOR ALL
  USING (get_user_role() IN ('administrador','owner','supervisor'));

-- ================================================
-- TABLA: usuarios
-- ================================================
DROP POLICY IF EXISTS "staff ve todos usuarios" ON usuarios;
DROP POLICY IF EXISTS "usuario ve su perfil" ON usuarios;
DROP POLICY IF EXISTS "usuario actualiza su perfil" ON usuarios;
DROP POLICY IF EXISTS "admin gestiona usuarios" ON usuarios;
DROP POLICY IF EXISTS "usuarios_self" ON usuarios;
DROP POLICY IF EXISTS "usuarios_admin" ON usuarios;
CREATE POLICY "usuario ve su perfil"
  ON usuarios FOR SELECT
  USING (id = auth.uid());
CREATE POLICY "usuario actualiza su perfil"
  ON usuarios FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());
CREATE POLICY "staff ve todos usuarios"
  ON usuarios FOR SELECT
  USING (get_user_role() IN ('administrador','owner','supervisor','contador','recepcionista','programador','moderador'));
CREATE POLICY "admin gestiona usuarios"
  ON usuarios FOR ALL
  USING (get_user_role() IN ('administrador','owner','programador'));

-- ================================================
-- TABLA: modelos
-- ================================================
DROP POLICY IF EXISTS "modelos_read_public" ON modelos;
DROP POLICY IF EXISTS "modelos_write_own" ON modelos;
DROP POLICY IF EXISTS "publico ve modelos" ON modelos;
DROP POLICY IF EXISTS "modelo edita su perfil" ON modelos;
DROP POLICY IF EXISTS "admin gestiona modelos" ON modelos;
CREATE POLICY "modelos_read_public"
  ON modelos FOR SELECT USING (true);
CREATE POLICY "modelo edita su perfil"
  ON modelos FOR UPDATE
  USING (
    email = (auth.jwt()->>'email')
    OR get_user_role() IN ('administrador','owner','programador')
  );
CREATE POLICY "admin gestiona modelos"
  ON modelos FOR ALL
  USING (get_user_role() IN ('administrador','owner','programador'));

-- ================================================
-- TABLA: clientes
-- ================================================
DROP POLICY IF EXISTS "staff ve clientes" ON clientes;
DROP POLICY IF EXISTS "admin modifica clientes" ON clientes;
DROP POLICY IF EXISTS "cliente ve su perfil" ON clientes;
DROP POLICY IF EXISTS "cliente crea su perfil" ON clientes;
CREATE POLICY "staff ve clientes"
  ON clientes FOR SELECT
  USING (get_user_role() IN ('administrador','owner','supervisor','recepcionista','programador','contador','moderador'));
CREATE POLICY "admin modifica clientes"
  ON clientes FOR ALL
  USING (get_user_role() IN ('administrador','owner','recepcionista','programador'));
CREATE POLICY "cliente ve su perfil"
  ON clientes FOR SELECT
  USING (
    auth.uid() IS NOT NULL
    AND (user_id = auth.uid() OR email = (auth.jwt()->>'email'))
  );
CREATE POLICY "cliente crea su perfil"
  ON clientes FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- ================================================
-- TABLA: agendamientos
-- ================================================
DROP POLICY IF EXISTS "staff ve todos agendamientos" ON agendamientos;
DROP POLICY IF EXISTS "modelo ve sus agendamientos" ON agendamientos;
DROP POLICY IF EXISTS "programador ve sus agendamientos" ON agendamientos;
DROP POLICY IF EXISTS "admin modifica agendamientos" ON agendamientos;
DROP POLICY IF EXISTS "recepcionista modifica agendamientos" ON agendamientos;
DROP POLICY IF EXISTS "programador crea agendamientos" ON agendamientos;
DROP POLICY IF EXISTS "cliente ve sus agendamientos" ON agendamientos;
DROP POLICY IF EXISTS "cliente crea agendamiento" ON agendamientos;
DROP POLICY IF EXISTS "cliente cancela su agendamiento" ON agendamientos;
DROP POLICY IF EXISTS "agendamientos_own" ON agendamientos;
CREATE POLICY "staff ve todos agendamientos"
  ON agendamientos FOR SELECT
  USING (get_user_role() IN ('administrador','owner','supervisor','recepcionista','contador','programador','moderador'));
CREATE POLICY "modelo ve sus agendamientos"
  ON agendamientos FOR SELECT
  USING (
    get_user_role() = 'modelo'
    AND modelo_id = auth.uid()
  );
CREATE POLICY "cliente ve sus agendamientos"
  ON agendamientos FOR SELECT
  USING (
    auth.uid() IS NOT NULL
    AND get_user_role() = 'cliente'
    AND (cliente_id = auth.uid() OR creado_por = (auth.jwt()->>'email'))
  );
CREATE POLICY "cliente crea agendamiento"
  ON agendamientos FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND get_user_role() = 'cliente'
  );
CREATE POLICY "cliente cancela su agendamiento"
  ON agendamientos FOR UPDATE
  USING (
    get_user_role() = 'cliente'
    AND (cliente_id = auth.uid() OR creado_por = (auth.jwt()->>'email'))
  );
CREATE POLICY "admin modifica agendamientos"
  ON agendamientos FOR ALL
  USING (get_user_role() IN ('administrador','owner','programador'));
CREATE POLICY "recepcionista modifica agendamientos"
  ON agendamientos FOR UPDATE
  USING (get_user_role() = 'recepcionista');

-- ================================================
-- TABLA: pagos
-- ================================================
DROP POLICY IF EXISTS "staff ve todos pagos" ON pagos;
DROP POLICY IF EXISTS "modelo ve sus pagos" ON pagos;
DROP POLICY IF EXISTS "admin modifica pagos" ON pagos;
DROP POLICY IF EXISTS "pagos_own_or_finance" ON pagos;
CREATE POLICY "staff ve todos pagos"
  ON pagos FOR SELECT
  USING (get_user_role() IN ('administrador','owner','contador','supervisor','programador'));
CREATE POLICY "modelo ve sus pagos"
  ON pagos FOR SELECT
  USING (
    get_user_role() = 'modelo'
    AND agendamiento_id IN (
      SELECT id FROM agendamientos WHERE modelo_id = auth.uid()
    )
  );
CREATE POLICY "admin modifica pagos"
  ON pagos FOR ALL
  USING (get_user_role() IN ('administrador','owner','contador','programador'));

-- ================================================
-- TABLA: liquidaciones
-- ================================================
DROP POLICY IF EXISTS "staff ve liquidaciones" ON liquidaciones;
DROP POLICY IF EXISTS "modelo ve sus liquidaciones" ON liquidaciones;
DROP POLICY IF EXISTS "admin modifica liquidaciones" ON liquidaciones;
DROP POLICY IF EXISTS "liquidaciones_own" ON liquidaciones;
DROP POLICY IF EXISTS "liquidaciones_manage" ON liquidaciones;
CREATE POLICY "staff ve liquidaciones"
  ON liquidaciones FOR SELECT
  USING (get_user_role() IN ('administrador','owner','contador','supervisor'));
CREATE POLICY "modelo ve sus liquidaciones"
  ON liquidaciones FOR SELECT
  USING (
    get_user_role() = 'modelo'
    AND modelo_id = auth.uid()
  );
CREATE POLICY "admin modifica liquidaciones"
  ON liquidaciones FOR ALL
  USING (get_user_role() IN ('administrador','owner','contador'));

-- ================================================
-- TABLA: multas
-- ================================================
DROP POLICY IF EXISTS "staff ve multas" ON multas;
DROP POLICY IF EXISTS "modelo ve sus multas" ON multas;
DROP POLICY IF EXISTS "admin modifica multas" ON multas;
DROP POLICY IF EXISTS "sistema crea multas" ON multas;
DROP POLICY IF EXISTS "multas_own" ON multas;
DROP POLICY IF EXISTS "multas_manage" ON multas;
CREATE POLICY "staff ve multas"
  ON multas FOR SELECT
  USING (get_user_role() IN ('administrador','owner','supervisor','contador','recepcionista','programador'));
CREATE POLICY "modelo ve sus multas"
  ON multas FOR SELECT
  USING (
    get_user_role() = 'modelo'
    AND usuario_id = auth.uid()
  );
CREATE POLICY "admin modifica multas"
  ON multas FOR ALL
  USING (get_user_role() IN ('administrador','owner','supervisor','programador'));
CREATE POLICY "sistema crea multas"
  ON multas FOR INSERT
  WITH CHECK (
    get_user_role() IN ('administrador','owner','supervisor','programador','modelo')
  );

-- ================================================
-- TABLA: notificaciones
-- ================================================
DROP POLICY IF EXISTS "usuario ve sus notificaciones" ON notificaciones;
DROP POLICY IF EXISTS "sistema crea notificaciones" ON notificaciones;
DROP POLICY IF EXISTS "usuario actualiza sus notificaciones" ON notificaciones;
DROP POLICY IF EXISTS "notificaciones_own" ON notificaciones;
CREATE POLICY "usuario ve sus notificaciones"
  ON notificaciones FOR SELECT
  USING (
    auth.uid() IS NOT NULL
    AND (
      para_usuario_id = auth.uid()
      OR para_rol = get_user_role()
      OR get_user_role() IN ('administrador','owner','supervisor')
    )
  );
CREATE POLICY "sistema crea notificaciones"
  ON notificaciones FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "usuario actualiza sus notificaciones"
  ON notificaciones FOR UPDATE
  USING (
    para_usuario_id = auth.uid()
    OR get_user_role() IN ('administrador','owner')
  );

-- ================================================
-- TABLA: habitaciones
-- ================================================
DROP POLICY IF EXISTS "autenticados ven habitaciones" ON habitaciones;
DROP POLICY IF EXISTS "staff modifica habitaciones" ON habitaciones;
DROP POLICY IF EXISTS "habitaciones_read" ON habitaciones;
DROP POLICY IF EXISTS "habitaciones_write" ON habitaciones;
CREATE POLICY "habitaciones_read"
  ON habitaciones FOR SELECT
  USING (auth.uid() IS NOT NULL);
CREATE POLICY "habitaciones_write"
  ON habitaciones FOR ALL
  USING (get_user_role() IN ('administrador','owner','recepcionista','supervisor','programador'));

-- ================================================
-- TABLA: inventario_boutique
-- ================================================
DROP POLICY IF EXISTS "autenticados ven inventario" ON inventario_boutique;
DROP POLICY IF EXISTS "admin modifica inventario" ON inventario_boutique;
DROP POLICY IF EXISTS "inventario_read" ON inventario_boutique;
DROP POLICY IF EXISTS "inventario_write" ON inventario_boutique;
CREATE POLICY "inventario_read"
  ON inventario_boutique FOR SELECT
  USING (auth.uid() IS NOT NULL);
CREATE POLICY "inventario_write"
  ON inventario_boutique FOR ALL
  USING (get_user_role() IN ('administrador','owner','supervisor'));

-- ================================================
-- TABLA: compras
-- ================================================
DROP POLICY IF EXISTS "compras_own" ON compras;
DROP POLICY IF EXISTS "staff ve compras" ON compras;
DROP POLICY IF EXISTS "admin modifica compras" ON compras;
CREATE POLICY "compras_own"
  ON compras FOR SELECT
  USING (
    auth.uid() IS NOT NULL
    AND (
      cliente_email = (auth.jwt()->>'email')
      OR get_user_role() IN ('administrador','owner','contador')
    )
  );
CREATE POLICY "admin modifica compras"
  ON compras FOR ALL
  USING (get_user_role() IN ('administrador','owner','contador'));

-- ================================================
-- TABLA: adelantos
-- ================================================
DROP POLICY IF EXISTS "staff ve adelantos" ON adelantos;
DROP POLICY IF EXISTS "modelo ve sus adelantos" ON adelantos;
DROP POLICY IF EXISTS "modelo solicita adelanto" ON adelantos;
DROP POLICY IF EXISTS "admin modifica adelantos" ON adelantos;
CREATE POLICY "staff ve adelantos"
  ON adelantos FOR SELECT
  USING (get_user_role() IN ('administrador','owner','contador','supervisor'));
CREATE POLICY "modelo ve sus adelantos"
  ON adelantos FOR SELECT
  USING (
    get_user_role() = 'modelo'
    AND modelo_id = auth.uid()
  );
CREATE POLICY "modelo solicita adelanto"
  ON adelantos FOR INSERT
  WITH CHECK (
    get_user_role() = 'modelo'
    AND modelo_id = auth.uid()
  );
CREATE POLICY "admin modifica adelantos"
  ON adelantos FOR ALL
  USING (get_user_role() IN ('administrador','owner','contador'));

-- ================================================
-- TABLA: asistencias
-- ================================================
DROP POLICY IF EXISTS "staff ve asistencias" ON asistencias;
DROP POLICY IF EXISTS "modelo ve su asistencia" ON asistencias;
DROP POLICY IF EXISTS "admin modifica asistencias" ON asistencias;
CREATE POLICY "staff ve asistencias"
  ON asistencias FOR SELECT
  USING (get_user_role() IN ('administrador','owner','supervisor','recepcionista','programador','contador'));
CREATE POLICY "modelo ve su asistencia"
  ON asistencias FOR SELECT
  USING (
    get_user_role() = 'modelo'
    AND modelo_id = auth.uid()
  );
CREATE POLICY "admin modifica asistencias"
  ON asistencias FOR ALL
  USING (get_user_role() IN ('administrador','owner','supervisor','recepcionista','programador'));

-- ================================================
-- TABLA: eventos
-- ================================================
DROP POLICY IF EXISTS "staff ve eventos" ON eventos;
DROP POLICY IF EXISTS "admin modifica eventos" ON eventos;
CREATE POLICY "staff ve eventos"
  ON eventos FOR SELECT
  USING (get_user_role() IN ('administrador','owner','supervisor','contador','programador','recepcionista'));
CREATE POLICY "admin modifica eventos"
  ON eventos FOR ALL
  USING (get_user_role() IN ('administrador','owner','programador'));

-- ================================================
-- TABLA: servicios_modelo
-- ================================================
DROP POLICY IF EXISTS "publico ve servicios modelo" ON servicios_modelo;
DROP POLICY IF EXISTS "staff ve servicios modelo" ON servicios_modelo;
DROP POLICY IF EXISTS "modelo ve sus servicios tipo" ON servicios_modelo;
DROP POLICY IF EXISTS "admin modifica servicios modelo" ON servicios_modelo;
CREATE POLICY "publico ve servicios modelo"
  ON servicios_modelo FOR SELECT USING (true);
CREATE POLICY "modelo ve sus servicios tipo"
  ON servicios_modelo FOR SELECT
  USING (
    get_user_role() = 'modelo'
    AND modelo_email = (auth.jwt()->>'email')
  );
CREATE POLICY "admin modifica servicios modelo"
  ON servicios_modelo FOR ALL
  USING (get_user_role() IN ('administrador','owner','programador'));

-- ================================================
-- TABLA: gastos_operativos
-- ================================================
DROP POLICY IF EXISTS "staff ve gastos" ON gastos_operativos;
DROP POLICY IF EXISTS "admin modifica gastos" ON gastos_operativos;
CREATE POLICY "staff ve gastos"
  ON gastos_operativos FOR SELECT
  USING (get_user_role() IN ('administrador','owner','contador','supervisor'));
CREATE POLICY "admin modifica gastos"
  ON gastos_operativos FOR ALL
  USING (get_user_role() IN ('administrador','owner','contador'));

-- TABLA: gastos
DROP POLICY IF EXISTS "staff ve gastos gen" ON gastos;
DROP POLICY IF EXISTS "admin modifica gastos gen" ON gastos;
CREATE POLICY "staff ve gastos gen"
  ON gastos FOR SELECT
  USING (get_user_role() IN ('administrador','owner','contador','supervisor'));
CREATE POLICY "admin modifica gastos gen"
  ON gastos FOR ALL
  USING (get_user_role() IN ('administrador','owner','contador'));

-- ================================================
-- TABLA: ventas_boutique
-- ================================================
DROP POLICY IF EXISTS "staff ve ventas boutique" ON ventas_boutique;
DROP POLICY IF EXISTS "admin modifica ventas boutique" ON ventas_boutique;
DROP POLICY IF EXISTS "modelo registra ventas boutique" ON ventas_boutique;
CREATE POLICY "staff ve ventas boutique"
  ON ventas_boutique FOR SELECT
  USING (get_user_role() IN ('administrador','owner','contador','supervisor','programador'));
CREATE POLICY "admin modifica ventas boutique"
  ON ventas_boutique FOR ALL
  USING (get_user_role() IN ('administrador','owner','contador'));
CREATE POLICY "modelo registra ventas boutique"
  ON ventas_boutique FOR INSERT
  WITH CHECK (get_user_role() = 'modelo');

-- ================================================
-- TABLA: boutique_solicitudes
-- ================================================
DROP POLICY IF EXISTS "staff ve solicitudes boutique" ON boutique_solicitudes;
DROP POLICY IF EXISTS "modelo ve sus solicitudes boutique" ON boutique_solicitudes;
DROP POLICY IF EXISTS "modelo crea solicitud boutique" ON boutique_solicitudes;
DROP POLICY IF EXISTS "admin modifica solicitudes boutique" ON boutique_solicitudes;
CREATE POLICY "staff ve solicitudes boutique"
  ON boutique_solicitudes FOR SELECT
  USING (get_user_role() IN ('administrador','owner','supervisor','programador'));
CREATE POLICY "modelo ve sus solicitudes boutique"
  ON boutique_solicitudes FOR SELECT
  USING (
    get_user_role() = 'modelo'
    AND modelo_id = auth.uid()
  );
CREATE POLICY "modelo crea solicitud boutique"
  ON boutique_solicitudes FOR INSERT
  WITH CHECK (
    get_user_role() = 'modelo'
    AND modelo_id = auth.uid()
  );
CREATE POLICY "admin modifica solicitudes boutique"
  ON boutique_solicitudes FOR ALL
  USING (get_user_role() IN ('administrador','owner','programador'));

-- ================================================
-- TABLA: stream_configs
-- ================================================
DROP POLICY IF EXISTS "tech ve stream config" ON stream_configs;
DROP POLICY IF EXISTS "admin modifica stream" ON stream_configs;
CREATE POLICY "tech ve stream config"
  ON stream_configs FOR SELECT
  USING (get_user_role() IN ('administrador','owner','programador','moderador','supervisor'));
CREATE POLICY "admin modifica stream"
  ON stream_configs FOR ALL
  USING (get_user_role() IN ('administrador','owner','programador'));

-- ================================================
-- TABLA: modelo_fotos
-- ================================================
DROP POLICY IF EXISTS "publico ve fotos modelo" ON modelo_fotos;
DROP POLICY IF EXISTS "modelo gestiona sus fotos" ON modelo_fotos;
DROP POLICY IF EXISTS "admin gestiona fotos" ON modelo_fotos;
CREATE POLICY "publico ve fotos modelo"
  ON modelo_fotos FOR SELECT USING (true);
CREATE POLICY "modelo gestiona sus fotos"
  ON modelo_fotos FOR ALL
  USING (
    get_user_role() = 'modelo'
    AND modelo_id = auth.uid()
  );
CREATE POLICY "admin gestiona fotos"
  ON modelo_fotos FOR ALL
  USING (get_user_role() IN ('administrador','owner'));

-- ================================================
-- TABLA: balance_financiero
-- ================================================
DROP POLICY IF EXISTS "staff ve balance" ON balance_financiero;
DROP POLICY IF EXISTS "admin modifica balance" ON balance_financiero;
CREATE POLICY "staff ve balance"
  ON balance_financiero FOR SELECT
  USING (get_user_role() IN ('administrador','owner','contador','supervisor'));
CREATE POLICY "admin modifica balance"
  ON balance_financiero FOR ALL
  USING (get_user_role() IN ('administrador','owner','contador','programador','supervisor','modelo'));

-- ================================================
-- TABLA: error_logs
-- ================================================
DROP POLICY IF EXISTS "admin ve error logs" ON error_logs;
DROP POLICY IF EXISTS "sistema inserta error logs" ON error_logs;
CREATE POLICY "admin ve error logs"
  ON error_logs FOR SELECT
  USING (get_user_role() IN ('administrador','owner','programador'));
CREATE POLICY "sistema inserta error logs"
  ON error_logs FOR INSERT
  WITH CHECK (true);

-- ================================================
-- VERIFICACIÓN FINAL
-- ================================================
SELECT
  tablename,
  rowsecurity,
  (SELECT COUNT(*)
   FROM pg_policies
   WHERE pg_policies.tablename = pg_tables.tablename
     AND schemaname = 'public') AS politicas
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;
