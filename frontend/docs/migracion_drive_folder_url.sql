-- Migración: enlace a la carpeta de Google Drive de cada candidato.
-- Ejecutar una vez en Supabase > SQL Editor. Es idempotente.

ALTER TABLE public.candidatos
  ADD COLUMN IF NOT EXISTS drive_folder_url text;
