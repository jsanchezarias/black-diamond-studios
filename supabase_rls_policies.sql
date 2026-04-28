-- =============================================
-- RLS COMPLETO - Black Diamond Studios
-- Versión corregida con columnas reales verificadas
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
-- TABLAS PÚBLICAS (landing page, sin auth)
-- ================================================

-- chat_mensajes_publicos: lectura/escritura pública (chat del landing)
ALTER TABLE chat_mensajes_publicos ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "publico lee chat" ON chat_mensajes_publicos;
DROP POLICY IF EXISTS "publico escribe chat" ON chat_mensajes_publicos;
DROP POLICY IF EXISTS "admin modera chat" ON chat_mensajes_publicos;
CREATE POLICY "publico lee chat"
  ON chat_mensajes_publicos FOR SELECT USING (true);
CREATE POLICY "publico escribe chat"
  ON chat_mensajes_publicos FOR INSERT WITH CHECK (true);
CREATE POLICY "admin modera chat"
  ON chat_mensajes_publicos FOR UPDATE
  USING (get_user_role() IN ('admin','owner','moderador'));

-- servicios_publicos: catálogo público
ALTER TABLE servicios_publicos ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "publico ve servicios" ON servicios_publicos;
DROP POLICY IF EXISTS "admin edita servicios publicos" ON servicios_publicos;
CREATE POLICY "publico ve servicios"
  ON servicios_publicos FOR SELECT USING (true);
CREATE POLICY "admin edita servicios publicos"
  ON servicios_publicos FOR ALL
  USING (get_user_role() IN ('admin','owner'));

-- servicios_politica: tarifas públicas
ALTER TABLE servicios_politica ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "publico ve politicas" ON servicios_politica;
DROP POLICY IF EXISTS "admin edita politicas" ON servicios_politica;
CREATE POLICY "publico ve politicas"
  ON servicios_politica FOR SELECT USING (true);
CREATE POLICY "admin edita politicas"
  ON servicios_politica FOR ALL
  USING (get_user_role() IN ('admin','owner'));

-- testimonios: lectura pública
ALTER TABLE testimonios ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "publico ve testimonios" ON testimonios;
DROP POLICY IF EXISTS "admin gestiona testimonios" ON testimonios;
CREATE POLICY "publico ve testimonios"
  ON testimonios FOR SELECT USING (true);
CREATE POLICY "admin gestiona testimonios"
  ON testimonios FOR ALL
  USING (get_user_role() IN ('admin','owner','moderador'));

-- productos: catálogo público (boutique)
ALTER TABLE productos ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "publico ve productos" ON productos;
DROP POLICY IF EXISTS "admin edita productos" ON productos;
CREATE POLICY "publico ve productos"
  ON productos FOR SELECT USING (true);
CREATE POLICY "admin edita productos"
  ON productos FOR ALL
  USING (get_user_role() IN ('admin','owner'));

-- ================================================
-- TABLA: usuarios
-- Columnas relevantes: id (uuid), role (text)
-- admin/owner/staff: ven todos
-- modelo y cualquier auth: ve solo el suyo
-- ================================================
ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "staff ve todos usuarios" ON usuarios;
DROP POLICY IF EXISTS "usuario ve su perfil" ON usuarios;
DROP POLICY IF EXISTS "usuario actualiza su perfil" ON usuarios;
DROP POLICY IF EXISTS "admin gestiona usuarios" ON usuarios;
CREATE POLICY "staff ve todos usuarios"
  ON usuarios FOR SELECT
  USING (get_user_role() IN ('admin','owner','supervisor','contador','recepcionista','programador','moderador'));
CREATE POLICY "usuario ve su perfil"
  ON usuarios FOR SELECT
  USING (id = auth.uid());
CREATE POLICY "usuario actualiza su perfil"
  ON usuarios FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());
CREATE POLICY "admin gestiona usuarios"
  ON usuarios FOR ALL
  USING (get_user_role() IN ('admin','owner'));

-- ================================================
-- TABLA: clientes
-- Columnas: id, nombre, email, user_id, ...
-- ================================================
ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "staff ve clientes" ON clientes;
DROP POLICY IF EXISTS "admin modifica clientes" ON clientes;
CREATE POLICY "staff ve clientes"
  ON clientes FOR SELECT
  USING (get_user_role() IN ('admin','owner','supervisor','recepcionista','programador','contador','moderador'));
CREATE POLICY "admin modifica clientes"
  ON clientes FOR ALL
  USING (get_user_role() IN ('admin','owner','recepcionista','programador'));

-- ================================================
-- TABLA: agendamientos
-- Columnas relevantes: modelo_id (uuid), modelo_email (text), creado_por (text)
-- AMBAS columnas existen — usamos modelo_id para modelos
-- ================================================
ALTER TABLE agendamientos ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "staff ve todos agendamientos" ON agendamientos;
DROP POLICY IF EXISTS "modelo ve sus agendamientos" ON agendamientos;
DROP POLICY IF EXISTS "programador ve sus agendamientos" ON agendamientos;
DROP POLICY IF EXISTS "admin modifica agendamientos" ON agendamientos;
DROP POLICY IF EXISTS "recepcionista modifica agendamientos" ON agendamientos;
DROP POLICY IF EXISTS "programador crea agendamientos" ON agendamientos;
CREATE POLICY "staff ve todos agendamientos"
  ON agendamientos FOR SELECT
  USING (get_user_role() IN ('admin','owner','supervisor','recepcionista','contador'));
CREATE POLICY "modelo ve sus agendamientos"
  ON agendamientos FOR SELECT
  USING (
    get_user_role() = 'modelo'
    AND modelo_id = auth.uid()
  );
CREATE POLICY "programador ve sus agendamientos"
  ON agendamientos FOR SELECT
  USING (
    get_user_role() = 'programador'
    AND creado_por = (auth.jwt()->>'email')
  );
CREATE POLICY "admin modifica agendamientos"
  ON agendamientos FOR ALL
  USING (get_user_role() IN ('admin','owner'));
CREATE POLICY "recepcionista modifica agendamientos"
  ON agendamientos FOR UPDATE
  USING (get_user_role() = 'recepcionista');
CREATE POLICY "programador crea agendamientos"
  ON agendamientos FOR INSERT
  WITH CHECK (get_user_role() IN ('programador','admin','owner'));

-- ================================================
-- TABLA: pagos
-- Columnas: id, agendamiento_id, monto, estado, ...
-- NO tiene columna de modelo directa
-- modelo ve pagos de sus agendamientos (subquery)
-- ================================================
ALTER TABLE pagos ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "staff ve todos pagos" ON pagos;
DROP POLICY IF EXISTS "modelo ve sus pagos" ON pagos;
DROP POLICY IF EXISTS "admin modifica pagos" ON pagos;
CREATE POLICY "staff ve todos pagos"
  ON pagos FOR SELECT
  USING (get_user_role() IN ('admin','owner','contador','supervisor'));
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
  USING (get_user_role() IN ('admin','owner','contador'));

-- ================================================
-- TABLA: liquidaciones
-- Columnas: id, modelo_id (uuid), ...
-- ================================================
ALTER TABLE liquidaciones ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "staff ve liquidaciones" ON liquidaciones;
DROP POLICY IF EXISTS "modelo ve sus liquidaciones" ON liquidaciones;
DROP POLICY IF EXISTS "admin modifica liquidaciones" ON liquidaciones;
CREATE POLICY "staff ve liquidaciones"
  ON liquidaciones FOR SELECT
  USING (get_user_role() IN ('admin','owner','contador','supervisor'));
CREATE POLICY "modelo ve sus liquidaciones"
  ON liquidaciones FOR SELECT
  USING (
    get_user_role() = 'modelo'
    AND modelo_id = auth.uid()
  );
CREATE POLICY "admin modifica liquidaciones"
  ON liquidaciones FOR ALL
  USING (get_user_role() IN ('admin','owner','contador'));

-- ================================================
-- TABLA: multas
-- Columnas: id, usuario_id (uuid), agendamiento_id, ...
-- usa usuario_id NO modelo_email/modelo_id
-- ================================================
ALTER TABLE multas ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "staff ve multas" ON multas;
DROP POLICY IF EXISTS "modelo ve sus multas" ON multas;
DROP POLICY IF EXISTS "admin modifica multas" ON multas;
CREATE POLICY "staff ve multas"
  ON multas FOR SELECT
  USING (get_user_role() IN ('admin','owner','supervisor','contador','recepcionista'));
CREATE POLICY "modelo ve sus multas"
  ON multas FOR SELECT
  USING (
    get_user_role() = 'modelo'
    AND usuario_id = auth.uid()
  );
CREATE POLICY "admin modifica multas"
  ON multas FOR ALL
  USING (get_user_role() IN ('admin','owner','supervisor'));

-- ================================================
-- TABLA: adelantos
-- Columnas: id, modelo_id (uuid), ...
-- ================================================
ALTER TABLE adelantos ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "staff ve adelantos" ON adelantos;
DROP POLICY IF EXISTS "modelo ve sus adelantos" ON adelantos;
DROP POLICY IF EXISTS "modelo solicita adelanto" ON adelantos;
DROP POLICY IF EXISTS "admin modifica adelantos" ON adelantos;
CREATE POLICY "staff ve adelantos"
  ON adelantos FOR SELECT
  USING (get_user_role() IN ('admin','owner','contador','supervisor'));
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
  USING (get_user_role() IN ('admin','owner','contador'));

-- ================================================
-- TABLA: habitaciones
-- Todos los autenticados ven; solo staff modifica
-- ================================================
ALTER TABLE habitaciones ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "autenticados ven habitaciones" ON habitaciones;
DROP POLICY IF EXISTS "staff modifica habitaciones" ON habitaciones;
CREATE POLICY "autenticados ven habitaciones"
  ON habitaciones FOR SELECT
  USING (auth.uid() IS NOT NULL);
CREATE POLICY "staff modifica habitaciones"
  ON habitaciones FOR ALL
  USING (get_user_role() IN ('admin','owner','recepcionista','supervisor'));

-- ================================================
-- TABLA: eventos
-- ================================================
ALTER TABLE eventos ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "staff ve eventos" ON eventos;
DROP POLICY IF EXISTS "admin modifica eventos" ON eventos;
CREATE POLICY "staff ve eventos"
  ON eventos FOR SELECT
  USING (get_user_role() IN ('admin','owner','supervisor','contador','programador','recepcionista'));
CREATE POLICY "admin modifica eventos"
  ON eventos FOR ALL
  USING (get_user_role() IN ('admin','owner','programador'));

-- ================================================
-- TABLA: servicios_modelo
-- Columnas: id, modelo_email (text), nombre, ...
-- modelo_email EXISTE en esta tabla
-- ================================================
ALTER TABLE servicios_modelo ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "staff ve servicios modelo" ON servicios_modelo;
DROP POLICY IF EXISTS "modelo ve sus servicios tipo" ON servicios_modelo;
DROP POLICY IF EXISTS "admin modifica servicios modelo" ON servicios_modelo;
CREATE POLICY "staff ve servicios modelo"
  ON servicios_modelo FOR SELECT
  USING (get_user_role() IN ('admin','owner','supervisor','recepcionista','programador','contador'));
CREATE POLICY "modelo ve sus servicios tipo"
  ON servicios_modelo FOR SELECT
  USING (
    get_user_role() = 'modelo'
    AND modelo_email = (auth.jwt()->>'email')
  );
CREATE POLICY "admin modifica servicios modelo"
  ON servicios_modelo FOR ALL
  USING (get_user_role() IN ('admin','owner'));

-- ================================================
-- TABLA: gastos_operativos
-- Solo staff financiero
-- ================================================
ALTER TABLE gastos_operativos ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "staff ve gastos" ON gastos_operativos;
DROP POLICY IF EXISTS "admin modifica gastos" ON gastos_operativos;
CREATE POLICY "staff ve gastos"
  ON gastos_operativos FOR SELECT
  USING (get_user_role() IN ('admin','owner','contador','supervisor'));
CREATE POLICY "admin modifica gastos"
  ON gastos_operativos FOR ALL
  USING (get_user_role() IN ('admin','owner','contador'));

-- TABLA: gastos (alias/variante)
ALTER TABLE gastos ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "staff ve gastos gen" ON gastos;
DROP POLICY IF EXISTS "admin modifica gastos gen" ON gastos;
CREATE POLICY "staff ve gastos gen"
  ON gastos FOR SELECT
  USING (get_user_role() IN ('admin','owner','contador','supervisor'));
CREATE POLICY "admin modifica gastos gen"
  ON gastos FOR ALL
  USING (get_user_role() IN ('admin','owner','contador'));

-- ================================================
-- TABLA: inventario_boutique
-- ================================================
ALTER TABLE inventario_boutique ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "autenticados ven inventario" ON inventario_boutique;
DROP POLICY IF EXISTS "admin modifica inventario" ON inventario_boutique;
CREATE POLICY "autenticados ven inventario"
  ON inventario_boutique FOR SELECT
  USING (auth.uid() IS NOT NULL);
CREATE POLICY "admin modifica inventario"
  ON inventario_boutique FOR ALL
  USING (get_user_role() IN ('admin','owner'));

-- ================================================
-- TABLA: ventas_boutique
-- Columnas: producto_id, cantidad, precio_unitario, ...
-- NO tiene columna de modelo
-- ================================================
ALTER TABLE ventas_boutique ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "staff ve ventas boutique" ON ventas_boutique;
DROP POLICY IF EXISTS "admin modifica ventas boutique" ON ventas_boutique;
CREATE POLICY "staff ve ventas boutique"
  ON ventas_boutique FOR SELECT
  USING (get_user_role() IN ('admin','owner','contador','supervisor'));
CREATE POLICY "admin modifica ventas boutique"
  ON ventas_boutique FOR ALL
  USING (get_user_role() IN ('admin','owner'));

-- ================================================
-- TABLA: boutique_solicitudes
-- Columnas: modelo_email (text), modelo_id (uuid)
-- AMBAS existen — usamos modelo_id
-- ================================================
ALTER TABLE boutique_solicitudes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "staff ve solicitudes boutique" ON boutique_solicitudes;
DROP POLICY IF EXISTS "modelo ve sus solicitudes boutique" ON boutique_solicitudes;
DROP POLICY IF EXISTS "modelo crea solicitud boutique" ON boutique_solicitudes;
DROP POLICY IF EXISTS "admin modifica solicitudes boutique" ON boutique_solicitudes;
CREATE POLICY "staff ve solicitudes boutique"
  ON boutique_solicitudes FOR SELECT
  USING (get_user_role() IN ('admin','owner','supervisor'));
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
  USING (get_user_role() IN ('admin','owner'));

-- ================================================
-- TABLA: asistencias
-- Columnas: modelo_id (uuid), fecha, hora_entrada, ...
-- ================================================
ALTER TABLE asistencias ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "staff ve asistencias" ON asistencias;
DROP POLICY IF EXISTS "modelo ve su asistencia" ON asistencias;
DROP POLICY IF EXISTS "admin modifica asistencias" ON asistencias;
CREATE POLICY "staff ve asistencias"
  ON asistencias FOR SELECT
  USING (get_user_role() IN ('admin','owner','supervisor','recepcionista'));
CREATE POLICY "modelo ve su asistencia"
  ON asistencias FOR SELECT
  USING (
    get_user_role() = 'modelo'
    AND modelo_id = auth.uid()
  );
CREATE POLICY "admin modifica asistencias"
  ON asistencias FOR ALL
  USING (get_user_role() IN ('admin','owner','supervisor','recepcionista'));

-- ================================================
-- TABLA: stream_configs
-- ================================================
ALTER TABLE stream_configs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tech ve stream config" ON stream_configs;
DROP POLICY IF EXISTS "admin modifica stream" ON stream_configs;
CREATE POLICY "tech ve stream config"
  ON stream_configs FOR SELECT
  USING (get_user_role() IN ('admin','owner','programador','moderador','supervisor'));
CREATE POLICY "admin modifica stream"
  ON stream_configs FOR ALL
  USING (get_user_role() IN ('admin','owner','programador'));

-- ================================================
-- VERIFICACIÓN FINAL
-- Debe mostrar rowsecurity=true para todas las tablas
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
