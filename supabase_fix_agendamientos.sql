-- ============================================================
-- BLACK DIAMOND - FIX COLUMNAS FALTANTES EN AGENDAMIENTOS
-- Error: Could not find the 'cliente_nombre' column of 'agendamientos'
--
-- CAUSA: La tabla fue creada con una versión anterior del schema
--        que no incluía todas estas columnas.
--
-- SOLUCIÓN: Ejecutar este script en:
--   Supabase Dashboard → SQL Editor → New query → Run
-- ============================================================

-- Columnas de cliente
ALTER TABLE agendamientos ADD COLUMN IF NOT EXISTS cliente_nombre text NOT NULL DEFAULT '';
ALTER TABLE agendamientos ADD COLUMN IF NOT EXISTS cliente_telefono text NOT NULL DEFAULT '';

-- Columnas de modelo
ALTER TABLE agendamientos ADD COLUMN IF NOT EXISTS modelo_nombre text NOT NULL DEFAULT '';

-- Columnas de duración y tipo
ALTER TABLE agendamientos ADD COLUMN IF NOT EXISTS duracion_minutos integer NOT NULL DEFAULT 60;
ALTER TABLE agendamientos ADD COLUMN IF NOT EXISTS tipo_servicio text NOT NULL DEFAULT 'sede';

-- Columnas de gestión
ALTER TABLE agendamientos ADD COLUMN IF NOT EXISTS creado_por text;
ALTER TABLE agendamientos ADD COLUMN IF NOT EXISTS motivo_cancelacion text;
ALTER TABLE agendamientos ADD COLUMN IF NOT EXISTS cancelado_por text;
ALTER TABLE agendamientos ADD COLUMN IF NOT EXISTS fecha_cancelacion text;

-- Columnas de pago
ALTER TABLE agendamientos ADD COLUMN IF NOT EXISTS monto_pago numeric(12,2) DEFAULT 0;
ALTER TABLE agendamientos ADD COLUMN IF NOT EXISTS estado_pago text DEFAULT 'pendiente'
  CHECK (estado_pago IN ('pendiente','pagado','reembolsado'));
ALTER TABLE agendamientos ADD COLUMN IF NOT EXISTS metodo_pago text;
ALTER TABLE agendamientos ADD COLUMN IF NOT EXISTS transaccion_id text;
ALTER TABLE agendamientos ADD COLUMN IF NOT EXISTS fecha_pago text;
ALTER TABLE agendamientos ADD COLUMN IF NOT EXISTS comprobante_pago text;

-- Columnas de tarifa
ALTER TABLE agendamientos ADD COLUMN IF NOT EXISTS tarifa_nombre text;
ALTER TABLE agendamientos ADD COLUMN IF NOT EXISTS tarifa_descripcion text;

-- Columnas de metadata (en caso de estar ausentes)
ALTER TABLE agendamientos ADD COLUMN IF NOT EXISTS fecha_creacion timestamptz DEFAULT now();
ALTER TABLE agendamientos ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- ============================================================
-- VERIFICACIÓN: muestra las columnas actuales de agendamientos
-- Si el fix fue exitoso verás todas las columnas listadas abajo
-- ============================================================
SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'agendamientos'
  AND table_schema = 'public'
ORDER BY ordinal_position;
