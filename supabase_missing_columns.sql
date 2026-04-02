-- ============================================================
-- BLACK DIAMOND - COLUMNAS FALTANTES EN CLIENTES
-- Ejecutar en: Supabase Dashboard → SQL Editor → New query
-- ============================================================

-- Agregar columnas que faltan en clientes
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS bloqueado boolean DEFAULT false;
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS motivo_bloqueo text;
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS fecha_bloqueo text;
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS bloqueado_por text;
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS multas_pendientes integer DEFAULT 0;
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS total_no_shows integer DEFAULT 0;
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS observaciones jsonb DEFAULT '[]'::jsonb;
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS fecha_registro timestamptz DEFAULT now();

-- Agregar índice para user_id (para búsqueda en login)
CREATE INDEX IF NOT EXISTS idx_clientes_user_id ON clientes(user_id);

-- Desactivar confirmación de email para Supabase Auth
-- (Hacer esto manual en: Authentication → Providers → Email → Confirm email OFF)

-- Crear tablas faltantes
CREATE TABLE IF NOT EXISTS carrito_items (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id text NOT NULL,
  producto_id uuid REFERENCES productos(id) ON DELETE CASCADE,
  cantidad integer NOT NULL DEFAULT 1,
  precio_unitario numeric(12,2) NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE carrito_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "Carrito: anon all" ON carrito_items USING (true) WITH CHECK (true);

CREATE TABLE IF NOT EXISTS compras (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  cliente_id uuid REFERENCES clientes(id) ON DELETE SET NULL,
  total numeric(12,2) NOT NULL DEFAULT 0,
  estado text DEFAULT 'pendiente',
  metodo_pago text,
  notas text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE compras ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "Compras: anon all" ON compras USING (true) WITH CHECK (true);

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
CREATE POLICY IF NOT EXISTS "ComprasItems: anon all" ON compras_items USING (true) WITH CHECK (true);

-- Habilitar Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE clientes;
ALTER PUBLICATION supabase_realtime ADD TABLE chat_mensajes_publicos;

-- Verificar columnas de clientes después del fix
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'clientes' AND table_schema = 'public'
ORDER BY ordinal_position;
