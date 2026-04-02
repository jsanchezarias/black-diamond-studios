-- ============================================================
-- BLACK DIAMOND STUDIOS - SCHEMA COMPLETO SUPABASE
-- Ejecutar en: Supabase Dashboard → SQL Editor → New query
-- ============================================================

-- ============================================================
-- 1. USUARIOS DEL SISTEMA (Owner, Admin, Programador, Modelo)
-- ============================================================
CREATE TABLE IF NOT EXISTS usuarios (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  role text NOT NULL CHECK (role IN ('owner', 'admin', 'programador', 'modelo')),
  nombre text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "Usuarios: anon select" ON usuarios FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "Usuarios: auth insert" ON usuarios FOR INSERT WITH CHECK (true);
CREATE POLICY IF NOT EXISTS "Usuarios: auth update" ON usuarios FOR UPDATE USING (true);

-- ============================================================
-- 2. CLIENTES (Personas naturales que usan el chat y servicios)
-- ============================================================
CREATE TABLE IF NOT EXISTS clientes (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  auth_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  nombre text NOT NULL,
  nombre_usuario text,
  telefono text,
  email text,
  fecha_nacimiento date,
  ciudad text,
  preferencias text,
  notas text,
  observaciones jsonb DEFAULT '[]'::jsonb,
  rating numeric(3,2),
  historial_servicios jsonb DEFAULT '[]'::jsonb,
  ultima_visita timestamptz,
  total_servicios integer DEFAULT 0,
  total_gastado numeric(12,2) DEFAULT 0,
  bloqueado boolean DEFAULT false,
  motivo_bloqueo text,
  fecha_bloqueo text,
  bloqueado_por text,
  multas_pendientes integer DEFAULT 0,
  total_no_shows integer DEFAULT 0,
  -- Sesión del chat público
  sesion_activa boolean DEFAULT false,
  sesion_token text,
  sesion_ultimo_acceso timestamptz,
  sesion_expires_at timestamptz,
  -- Historial de chat
  ultima_conversacion text,
  ultima_conversacion_fecha timestamptz,
  -- Metadata
  fecha_registro timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "Clientes: anon select" ON clientes FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "Clientes: anon insert" ON clientes FOR INSERT WITH CHECK (true);
CREATE POLICY IF NOT EXISTS "Clientes: anon update" ON clientes FOR UPDATE USING (true);

-- ============================================================
-- 3. MODELOS
-- ============================================================
CREATE TABLE IF NOT EXISTS modelos (
  id serial PRIMARY KEY,
  nombre text NOT NULL,
  nombre_artistico text,
  cedula text,
  telefono text,
  direccion text,
  email text UNIQUE NOT NULL,
  password text,
  foto_perfil text DEFAULT '',
  fotos_adicionales jsonb DEFAULT '[]'::jsonb,
  edad integer,
  altura text,
  medidas text,
  descripcion text,
  sede text,
  activa boolean DEFAULT true,
  disponible boolean DEFAULT false,
  domicilio boolean DEFAULT false,
  politica_tarifa integer,
  servicios integer DEFAULT 0,
  ingresos numeric(12,2) DEFAULT 0,
  fecha_archivado text,
  motivo_archivo text,
  observaciones_rechazo text,
  fecha_rechazo text,
  videos jsonb DEFAULT '[]'::jsonb,
  servicios_disponibles jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE modelos ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "Modelos: anon select" ON modelos FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "Modelos: auth insert" ON modelos FOR INSERT WITH CHECK (true);
CREATE POLICY IF NOT EXISTS "Modelos: auth update" ON modelos FOR UPDATE USING (true);
CREATE POLICY IF NOT EXISTS "Modelos: auth delete" ON modelos FOR DELETE USING (true);

-- ============================================================
-- 4. AGENDAMIENTOS
-- ============================================================
CREATE TABLE IF NOT EXISTS agendamientos (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  modelo_email text NOT NULL,
  modelo_nombre text NOT NULL,
  cliente_id uuid REFERENCES clientes(id) ON DELETE SET NULL,
  cliente_nombre text NOT NULL,
  cliente_telefono text NOT NULL,
  fecha text NOT NULL,
  hora text NOT NULL,
  duracion_minutos integer NOT NULL DEFAULT 60,
  tipo_servicio text NOT NULL DEFAULT 'sede',
  estado text NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('pendiente','confirmado','completado','cancelado','no_show')),
  notas text,
  creado_por text,
  motivo_cancelacion text,
  cancelado_por text,
  fecha_cancelacion text,
  -- Pago
  monto_pago numeric(12,2) DEFAULT 0,
  estado_pago text DEFAULT 'pendiente' CHECK (estado_pago IN ('pendiente','pagado','reembolsado')),
  metodo_pago text,
  transaccion_id text,
  fecha_pago text,
  comprobante_pago text,
  -- Tarifa
  tarifa_nombre text,
  tarifa_descripcion text,
  -- Metadata
  fecha_creacion timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE agendamientos ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "Agendamientos: anon select" ON agendamientos FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "Agendamientos: anon insert" ON agendamientos FOR INSERT WITH CHECK (true);
CREATE POLICY IF NOT EXISTS "Agendamientos: anon update" ON agendamientos FOR UPDATE USING (true);
CREATE POLICY IF NOT EXISTS "Agendamientos: anon delete" ON agendamientos FOR DELETE USING (true);

-- ============================================================
-- 5. SERVICIOS COMPLETADOS
-- ============================================================
CREATE TABLE IF NOT EXISTS servicios (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  fecha text NOT NULL,
  hora text,
  duracion_estimada_minutos integer DEFAULT 60,
  duracion_real_minutos integer,
  -- Cliente
  cliente_id uuid REFERENCES clientes(id) ON DELETE SET NULL,
  cliente_nombre text NOT NULL,
  cliente_telefono text NOT NULL,
  cliente_email text,
  -- Modelo
  modelo_email text NOT NULL,
  modelo_nombre text NOT NULL,
  modelo_id text,
  -- Servicio
  tipo_servicio text DEFAULT 'sede',
  tarifa_nombre text NOT NULL,
  tarifa_descripcion text,
  monto_pactado numeric(12,2) DEFAULT 0,
  -- Pago
  estado_pago text DEFAULT 'pendiente' CHECK (estado_pago IN ('pendiente','pagado','reembolsado')),
  metodo_pago text,
  transaccion_id text,
  fecha_pago text,
  comprobante_pago text,
  -- Adicionales
  costo_adicionales numeric(12,2) DEFAULT 0,
  costo_consumo numeric(12,2) DEFAULT 0,
  costo_tiempos_adicionales numeric(12,2) DEFAULT 0,
  costo_adicionales_extra numeric(12,2) DEFAULT 0,
  costo_consumos_detallados numeric(12,2) DEFAULT 0,
  costo_total numeric(12,2) DEFAULT 0,
  habitacion text,
  adicionales text,
  consumo text,
  notas text,
  notas_servicio text,
  observacion_modelo text,
  estado text DEFAULT 'completado' CHECK (estado IN ('completado','cancelado','no_show')),
  motivo_cancelacion text,
  agendamiento_id uuid REFERENCES agendamientos(id) ON DELETE SET NULL,
  tiempos_adicionales jsonb DEFAULT '[]'::jsonb,
  adicionales_extra jsonb DEFAULT '[]'::jsonb,
  consumos_detallados jsonb DEFAULT '[]'::jsonb,
  -- Metadata
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE servicios ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "Servicios: anon select" ON servicios FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "Servicios: anon insert" ON servicios FOR INSERT WITH CHECK (true);
CREATE POLICY IF NOT EXISTS "Servicios: anon update" ON servicios FOR UPDATE USING (true);
CREATE POLICY IF NOT EXISTS "Servicios: anon delete" ON servicios FOR DELETE USING (true);

-- ============================================================
-- 6. TURNOS DE MODELOS
-- ============================================================
CREATE TABLE IF NOT EXISTS turnos (
  id serial PRIMARY KEY,
  modelo_email text NOT NULL,
  hora_entrada timestamptz,
  hora_salida timestamptz,
  estado text DEFAULT 'disponible',
  tiempo_en_servicio integer DEFAULT 0,
  tiempo_en_alimentacion integer DEFAULT 0,
  tiempo_disponible integer DEFAULT 0,
  registros jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE turnos ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "Turnos: anon select" ON turnos FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "Turnos: anon insert" ON turnos FOR INSERT WITH CHECK (true);
CREATE POLICY IF NOT EXISTS "Turnos: anon update" ON turnos FOR UPDATE USING (true);
CREATE POLICY IF NOT EXISTS "Turnos: anon delete" ON turnos FOR DELETE USING (true);

-- ============================================================
-- 7. MULTAS
-- ============================================================
CREATE TABLE IF NOT EXISTS multas (
  id serial PRIMARY KEY,
  modelo_id integer REFERENCES modelos(id) ON DELETE CASCADE,
  modelo_nombre text NOT NULL,
  modelo_email text,
  concepto text NOT NULL,
  monto numeric(12,2) NOT NULL,
  fecha text NOT NULL,
  estado text DEFAULT 'pendiente' CHECK (estado IN ('pendiente','pagada','cancelada')),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE multas ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "Multas: anon select" ON multas FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "Multas: anon insert" ON multas FOR INSERT WITH CHECK (true);
CREATE POLICY IF NOT EXISTS "Multas: anon update" ON multas FOR UPDATE USING (true);
CREATE POLICY IF NOT EXISTS "Multas: anon delete" ON multas FOR DELETE USING (true);

-- ============================================================
-- 8. PAGOS
-- ============================================================
CREATE TABLE IF NOT EXISTS pagos (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  tipo text NOT NULL,
  monto numeric(12,2) NOT NULL,
  concepto text,
  metodo_pago text,
  estado text DEFAULT 'pendiente' CHECK (estado IN ('pendiente','completado','rechazado','reembolsado')),
  referencia text,
  cliente_id uuid REFERENCES clientes(id) ON DELETE SET NULL,
  modelo_email text,
  agendamiento_id uuid REFERENCES agendamientos(id) ON DELETE SET NULL,
  servicio_id uuid REFERENCES servicios(id) ON DELETE SET NULL,
  comprobante text,
  notas text,
  fecha timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE pagos ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "Pagos: anon select" ON pagos FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "Pagos: anon insert" ON pagos FOR INSERT WITH CHECK (true);
CREATE POLICY IF NOT EXISTS "Pagos: anon update" ON pagos FOR UPDATE USING (true);

-- ============================================================
-- 9. GASTOS OPERATIVOS
-- ============================================================
CREATE TABLE IF NOT EXISTS gastos_operativos (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  fecha timestamptz DEFAULT now(),
  concepto text NOT NULL,
  categoria text NOT NULL CHECK (categoria IN ('nomina','arriendo','servicios','mantenimiento','marketing','insumos','transporte','honorarios','otros')),
  monto numeric(12,2) NOT NULL,
  descripcion text,
  comprobante text,
  responsable text NOT NULL,
  aprobado_por text,
  estado text DEFAULT 'pendiente' CHECK (estado IN ('pendiente','aprobado','rechazado')),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE gastos_operativos ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "Gastos: anon select" ON gastos_operativos FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "Gastos: anon insert" ON gastos_operativos FOR INSERT WITH CHECK (true);
CREATE POLICY IF NOT EXISTS "Gastos: anon update" ON gastos_operativos FOR UPDATE USING (true);
CREATE POLICY IF NOT EXISTS "Gastos: anon delete" ON gastos_operativos FOR DELETE USING (true);

-- ============================================================
-- 10. SERVICIOS PÚBLICOS (agua, luz, gas, etc.)
-- ============================================================
CREATE TABLE IF NOT EXISTS servicios_publicos (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre text NOT NULL,
  tipo text NOT NULL CHECK (tipo IN ('agua','luz','gas','internet','telefono','alarma','aseo','otro')),
  proveedor text NOT NULL,
  numero_cuenta text,
  fecha_limite_pago integer NOT NULL CHECK (fecha_limite_pago BETWEEN 1 AND 31),
  monto_promedio numeric(12,2) DEFAULT 0,
  ultimo_pago jsonb,
  historial_pagos jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE servicios_publicos ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "ServiciosPublicos: anon select" ON servicios_publicos FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "ServiciosPublicos: anon insert" ON servicios_publicos FOR INSERT WITH CHECK (true);
CREATE POLICY IF NOT EXISTS "ServiciosPublicos: anon update" ON servicios_publicos FOR UPDATE USING (true);
CREATE POLICY IF NOT EXISTS "ServiciosPublicos: anon delete" ON servicios_publicos FOR DELETE USING (true);

-- ============================================================
-- 11. POLÍTICA DE TARIFAS DE SERVICIOS
-- ============================================================
CREATE TABLE IF NOT EXISTS servicios_politica (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre text NOT NULL,
  descripcion text,
  tarifas jsonb DEFAULT '[]'::jsonb,
  activa boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE servicios_politica ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "ServiciosPolitica: anon select" ON servicios_politica FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "ServiciosPolitica: anon insert" ON servicios_politica FOR INSERT WITH CHECK (true);
CREATE POLICY IF NOT EXISTS "ServiciosPolitica: anon update" ON servicios_politica FOR UPDATE USING (true);
CREATE POLICY IF NOT EXISTS "ServiciosPolitica: anon delete" ON servicios_politica FOR DELETE USING (true);

-- ============================================================
-- 12. INVENTARIO / PRODUCTOS
-- ============================================================
CREATE TABLE IF NOT EXISTS productos (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre text NOT NULL,
  precio_regular numeric(12,2) NOT NULL DEFAULT 0,
  precio_servicio numeric(12,2) NOT NULL DEFAULT 0,
  stock integer NOT NULL DEFAULT 0,
  categoria text NOT NULL,
  descripcion text,
  imagen text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE productos ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "Productos: anon select" ON productos FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "Productos: anon insert" ON productos FOR INSERT WITH CHECK (true);
CREATE POLICY IF NOT EXISTS "Productos: anon update" ON productos FOR UPDATE USING (true);
CREATE POLICY IF NOT EXISTS "Productos: anon delete" ON productos FOR DELETE USING (true);

-- ============================================================
-- 13. CARRITO DE COMPRAS
-- ============================================================
CREATE TABLE IF NOT EXISTS carrito_items (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id text NOT NULL,
  producto_id uuid REFERENCES productos(id) ON DELETE CASCADE,
  cantidad integer NOT NULL DEFAULT 1,
  precio_unitario numeric(12,2) NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE carrito_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "Carrito: anon select" ON carrito_items FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "Carrito: anon insert" ON carrito_items FOR INSERT WITH CHECK (true);
CREATE POLICY IF NOT EXISTS "Carrito: anon update" ON carrito_items FOR UPDATE USING (true);
CREATE POLICY IF NOT EXISTS "Carrito: anon delete" ON carrito_items FOR DELETE USING (true);

-- ============================================================
-- 14. COMPRAS
-- ============================================================
CREATE TABLE IF NOT EXISTS compras (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  cliente_id uuid REFERENCES clientes(id) ON DELETE SET NULL,
  total numeric(12,2) NOT NULL DEFAULT 0,
  estado text DEFAULT 'pendiente' CHECK (estado IN ('pendiente','completado','cancelado')),
  metodo_pago text,
  notas text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE compras ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "Compras: anon select" ON compras FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "Compras: anon insert" ON compras FOR INSERT WITH CHECK (true);
CREATE POLICY IF NOT EXISTS "Compras: anon update" ON compras FOR UPDATE USING (true);

CREATE TABLE IF NOT EXISTS compras_items (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  compra_id uuid REFERENCES compras(id) ON DELETE CASCADE,
  producto_id uuid REFERENCES productos(id) ON DELETE SET NULL,
  cantidad integer NOT NULL DEFAULT 1,
  precio_unitario numeric(12,2) NOT NULL,
  subtotal numeric(12,2) NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE compras_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "ComprasItems: anon select" ON compras_items FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "ComprasItems: anon insert" ON compras_items FOR INSERT WITH CHECK (true);

-- ============================================================
-- 15. TESTIMONIOS
-- ============================================================
CREATE TABLE IF NOT EXISTS testimonios (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre text NOT NULL,
  email text NOT NULL,
  comentario text NOT NULL,
  calificacion integer NOT NULL CHECK (calificacion BETWEEN 1 AND 5),
  fecha timestamptz DEFAULT now(),
  estado text DEFAULT 'pendiente' CHECK (estado IN ('pendiente','aprobado','rechazado')),
  respuesta_admin text
);

ALTER TABLE testimonios ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "Testimonios: anon select" ON testimonios FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "Testimonios: anon insert" ON testimonios FOR INSERT WITH CHECK (true);
CREATE POLICY IF NOT EXISTS "Testimonios: auth update" ON testimonios FOR UPDATE USING (true);
CREATE POLICY IF NOT EXISTS "Testimonios: auth delete" ON testimonios FOR DELETE USING (true);

-- ============================================================
-- 16. CHAT MENSAJES PÚBLICOS
-- ============================================================
CREATE TABLE IF NOT EXISTS chat_mensajes_publicos (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_id uuid REFERENCES clientes(id) ON DELETE SET NULL,
  receiver_id uuid REFERENCES clientes(id) ON DELETE SET NULL,
  message text NOT NULL,
  is_read boolean DEFAULT false,
  role text DEFAULT 'user',
  color text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE chat_mensajes_publicos ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "Chat: anon select" ON chat_mensajes_publicos FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "Chat: anon insert" ON chat_mensajes_publicos FOR INSERT WITH CHECK (true);
CREATE POLICY IF NOT EXISTS "Chat: anon delete" ON chat_mensajes_publicos FOR DELETE USING (true);

-- ============================================================
-- 17. KV STORE (almacenamiento clave-valor del sistema)
-- ============================================================
CREATE TABLE IF NOT EXISTS kv_store_9dadc017 (
  key text PRIMARY KEY,
  value jsonb,
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE kv_store_9dadc017 ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "KV: anon select" ON kv_store_9dadc017 FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "KV: anon insert" ON kv_store_9dadc017 FOR INSERT WITH CHECK (true);
CREATE POLICY IF NOT EXISTS "KV: anon update" ON kv_store_9dadc017 FOR UPDATE USING (true);
CREATE POLICY IF NOT EXISTS "KV: anon delete" ON kv_store_9dadc017 FOR DELETE USING (true);

-- ============================================================
-- HABILITAR REALTIME EN TABLAS CRÍTICAS
-- ============================================================
ALTER PUBLICATION supabase_realtime ADD TABLE clientes;
ALTER PUBLICATION supabase_realtime ADD TABLE chat_mensajes_publicos;
ALTER PUBLICATION supabase_realtime ADD TABLE agendamientos;
ALTER PUBLICATION supabase_realtime ADD TABLE modelos;

-- ============================================================
-- ÍNDICES PARA PERFORMANCE
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_clientes_auth_user_id ON clientes(auth_user_id);
CREATE INDEX IF NOT EXISTS idx_clientes_telefono ON clientes(telefono);
CREATE INDEX IF NOT EXISTS idx_clientes_sesion_activa ON clientes(sesion_activa) WHERE sesion_activa = true;
CREATE INDEX IF NOT EXISTS idx_agendamientos_modelo_email ON agendamientos(modelo_email);
CREATE INDEX IF NOT EXISTS idx_agendamientos_cliente_id ON agendamientos(cliente_id);
CREATE INDEX IF NOT EXISTS idx_agendamientos_estado ON agendamientos(estado);
CREATE INDEX IF NOT EXISTS idx_servicios_modelo_email ON servicios(modelo_email);
CREATE INDEX IF NOT EXISTS idx_chat_sender_id ON chat_mensajes_publicos(sender_id);
CREATE INDEX IF NOT EXISTS idx_chat_created_at ON chat_mensajes_publicos(created_at);

-- ============================================================
-- IMPORTANTE: DESPUÉS DE EJECUTAR ESTO, VE A:
-- Authentication → Providers → Email → DESACTIVAR "Confirm email"
-- ============================================================
