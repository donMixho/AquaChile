-- Asigna el rol de cada usuario en App Metadata (solo el backend puede escribirlo).
-- Ejecutar en Supabase > SQL Editor. Es idempotente.
--
-- Por qué existe: la interfaz reconoce al admin por su correo (respaldo para pruebas), pero la
-- política RLS "candidatos_delete_admin" lee auth.jwt() -> app_metadata ->> 'rol'. Si el usuario
-- no tiene el rol en app_metadata, el botón Eliminar aparece y la base igual rechaza el borrado
-- ("No se eliminó ningún registro").
--
-- Después de ejecutarlo, el usuario debe cerrar sesión y volver a entrar para renovar su token.

UPDATE auth.users
SET raw_app_meta_data = COALESCE(raw_app_meta_data, '{}'::jsonb) || '{"rol": "admin"}'::jsonb
WHERE lower(email) = 'admin@aquachile.cl';

UPDATE auth.users
SET raw_app_meta_data = COALESCE(raw_app_meta_data, '{}'::jsonb) || '{"rol": "reclutador"}'::jsonb
WHERE lower(email) = 'reclutador@aquachile.cl';

UPDATE auth.users
SET raw_app_meta_data = COALESCE(raw_app_meta_data, '{}'::jsonb) || '{"rol": "operaciones"}'::jsonb
WHERE lower(email) = 'operaciones@aquachile.cl';

-- Verificación:
-- SELECT email, raw_app_meta_data ->> 'rol' AS rol FROM auth.users ORDER BY email;
