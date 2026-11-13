-- Migración: texto de los currículums (PDF) para que el Asistente pueda buscar por su contenido.
-- Ejecutar una vez en Supabase > SQL Editor. Es idempotente.
-- El texto lo extrae el navegador al registrar al candidato (máx. 6.000 caracteres).

ALTER TABLE public.candidatos
  ADD COLUMN IF NOT EXISTS cv_texto text;
