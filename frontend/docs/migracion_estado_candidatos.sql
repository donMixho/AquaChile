-- Migración: estado del proceso de cada candidato.
-- Ejecutar una vez en Supabase > SQL Editor. Es idempotente.
-- El Dashboard (gráfico "Registros por estado") lee esta columna mediante select('*').

ALTER TABLE public.candidatos
  ADD COLUMN IF NOT EXISTS estado text NOT NULL DEFAULT 'Pendiente';

-- Valores admitidos por la aplicación.
ALTER TABLE public.candidatos
  DROP CONSTRAINT IF EXISTS candidatos_estado_check;
ALTER TABLE public.candidatos
  ADD CONSTRAINT candidatos_estado_check
  CHECK (estado IN ('Pendiente', 'En proceso', 'Apto', 'No apto'));

-- Opcional: datos de ejemplo para ver el gráfico con variedad (ajusta los ids).
-- UPDATE public.candidatos SET estado = 'Apto'       WHERE id = 1;
-- UPDATE public.candidatos SET estado = 'En proceso' WHERE id = 2;
