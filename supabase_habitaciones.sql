-- =============================================
-- TABLA HABITACIONES - Black Diamond Studios
-- Ejecutar en Supabase SQL Editor
-- =============================================

CREATE TABLE IF NOT EXISTS habitaciones (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  numero integer NOT NULL UNIQUE,
  nombre text,
  estado text DEFAULT 'disponible' CHECK (estado IN ('disponible', 'ocupada', 'limpieza')),
  modelo_email text,
  modelo_nombre text,
  hora_inicio timestamptz,
  duracion_minutos integer DEFAULT 60,
  hora_fin_estimada timestamptz,
  precio_hora numeric DEFAULT 0,
  observaciones text,
  created_at timestamptz DEFAULT NOW(),
  updated_at timestamptz DEFAULT NOW()
);

-- Habitaciones de prueba (8 habitaciones)
INSERT INTO habitaciones (numero, nombre, estado) VALUES
  (1, 'Habitación 1', 'disponible'),
  (2, 'Habitación 2', 'disponible'),
  (3, 'Habitación 3', 'disponible'),
  (4, 'Habitación 4', 'disponible'),
  (5, 'Habitación 5', 'disponible'),
  (6, 'Habitación 6', 'disponible'),
  (7, 'Habitación 7', 'disponible'),
  (8, 'Habitación 8', 'disponible')
ON CONFLICT (numero) DO NOTHING;

-- Habilitar Row Level Security
ALTER TABLE habitaciones ENABLE ROW LEVEL SECURITY;

-- Política: todos pueden leer
DROP POLICY IF EXISTS "todos pueden ver habitaciones" ON habitaciones;
CREATE POLICY "todos pueden ver habitaciones"
  ON habitaciones FOR SELECT
  USING (true);

-- Política: todos pueden modificar (ajustar según necesidades)
DROP POLICY IF EXISTS "todos pueden modificar habitaciones" ON habitaciones;
CREATE POLICY "todos pueden modificar habitaciones"
  ON habitaciones FOR ALL
  USING (true)
  WITH CHECK (true);

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_habitaciones_updated_at ON habitaciones;
CREATE TRIGGER update_habitaciones_updated_at
  BEFORE UPDATE ON habitaciones
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Recargar schema
NOTIFY pgrst, 'reload schema';
