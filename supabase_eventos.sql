-- =============================================
-- TABLA EVENTOS - Black Diamond Studios
-- Ejecutar en Supabase SQL Editor (opcional)
-- Si no existe, los eventos se guardan solo como agendamientos individuales
-- =============================================

CREATE TABLE IF NOT EXISTS eventos (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre text NOT NULL,
  tipo text,
  descripcion text,
  modelos_ids jsonb,
  modelos_nombres jsonb,
  ubicacion_tipo text,
  direccion text,
  habitaciones_ids jsonb,
  servicios jsonb,
  fecha_evento date,
  hora_inicio time,
  hora_fin time,
  duracion_minutos integer,
  costo_modelos numeric DEFAULT 0,
  costo_servicios numeric DEFAULT 0,
  subtotal numeric DEFAULT 0,
  iva numeric DEFAULT 0,
  total numeric DEFAULT 0,
  estado text DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'confirmado', 'completado', 'cancelado')),
  creado_por text,
  created_at timestamptz DEFAULT NOW()
);

ALTER TABLE eventos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "todos pueden ver eventos" ON eventos;
CREATE POLICY "todos pueden ver eventos"
  ON eventos FOR SELECT USING (true);

DROP POLICY IF EXISTS "todos pueden modificar eventos" ON eventos;
CREATE POLICY "todos pueden modificar eventos"
  ON eventos FOR ALL USING (true) WITH CHECK (true);

NOTIFY pgrst, 'reload schema';
