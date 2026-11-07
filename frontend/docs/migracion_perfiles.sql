-- Perfiles de usuario: lista de personas del equipo con su rol y estado de acceso.
-- Ejecutar en Supabase > SQL Editor DESPUÉS de docs/asignar_roles_usuarios.sql. Es idempotente.
--
-- Estados:
--   activo   -> acceso normal.
--   ausente  -> vacaciones o licencia. Conserva el acceso; el admin puede reasignar sus casos.
--   inactivo -> desvinculado. Sin acceso (la Edge Function además bloquea la cuenta en Auth).
-- Nunca se borra a una persona: se desactiva, para conservar el historial de quién evaluó a quién.
--
-- Los cambios de estado, rol e invitaciones los hace la Edge Function `admin-usuarios`
-- (supabase/functions/admin-usuarios), que usa la clave service_role. El frontend solo LEE esta tabla.

DO $$
BEGIN
  IF to_regclass('public.candidatos') IS NULL THEN
    RAISE EXCEPTION 'No existe la tabla public.candidatos. Ejecuta primero docs/schema.sql.';
  END IF;
END
$$;

CREATE TABLE IF NOT EXISTS public.perfiles (
  id             uuid PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  nombre         text,
  email          text NOT NULL,
  rol            text NOT NULL CHECK (rol IN ('admin', 'reclutador', 'operaciones')),
  estado         text NOT NULL DEFAULT 'activo' CHECK (estado IN ('activo', 'ausente', 'inactivo')),
  created_at     timestamptz NOT NULL DEFAULT now(),
  actualizado_en timestamptz NOT NULL DEFAULT now()
);

-- Perfiles de los usuarios que ya existen. El rol sale de app_metadata; si falta, se usa el mismo
-- respaldo por correo que tiene la app (AuthContext.jsx) para los tres usuarios de demostración.
-- Además deja el rol escrito en app_metadata, que es lo que leen las políticas RLS.
UPDATE auth.users
SET raw_app_meta_data = COALESCE(raw_app_meta_data, '{}'::jsonb) ||
  jsonb_build_object('rol', CASE lower(email)
    WHEN 'admin@aquachile.cl' THEN 'admin'
    WHEN 'reclutador@aquachile.cl' THEN 'reclutador'
    WHEN 'operaciones@aquachile.cl' THEN 'operaciones'
  END)
WHERE raw_app_meta_data ->> 'rol' IS NULL
  AND lower(email) IN ('admin@aquachile.cl', 'reclutador@aquachile.cl', 'operaciones@aquachile.cl');

INSERT INTO public.perfiles (id, nombre, email, rol)
SELECT
  u.id,
  COALESCE(u.raw_user_meta_data ->> 'nombre', split_part(u.email, '@', 1)),
  u.email,
  u.raw_app_meta_data ->> 'rol'
FROM auth.users u
WHERE u.raw_app_meta_data ->> 'rol' IN ('admin', 'reclutador', 'operaciones')
ON CONFLICT (id) DO NOTHING;

-- Funciones auxiliares para las políticas. SECURITY DEFINER evita que la política de `perfiles`
-- se consulte a sí misma de forma recursiva.
CREATE OR REPLACE FUNCTION public.usuario_activo()
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.perfiles p WHERE p.id = auth.uid() AND p.estado <> 'inactivo'
  );
$$;

CREATE OR REPLACE FUNCTION public.es_admin_activo()
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.perfiles p
    WHERE p.id = auth.uid() AND p.rol = 'admin' AND p.estado <> 'inactivo'
  );
$$;

ALTER TABLE public.perfiles ENABLE ROW LEVEL SECURITY;

-- Cada persona ve su propio perfil; el admin ve a todo el equipo. Sin políticas de INSERT, UPDATE
-- ni DELETE: solo la Edge Function (service_role, que omite RLS) puede modificar perfiles.
DROP POLICY IF EXISTS "perfiles_select" ON public.perfiles;
CREATE POLICY "perfiles_select"
  ON public.perfiles FOR SELECT TO authenticated
  USING (id = auth.uid() OR public.es_admin_activo());

-- Un token sigue siendo válido hasta que expira, aunque la cuenta se bloquee. Por eso las políticas
-- de candidatos también comprueban que el perfil no esté inactivo.
-- Reemplaza las políticas de docs/politicas_rls_candidatos.sql por las mismas con esa comprobación.
DROP POLICY IF EXISTS "candidatos_select_autenticados" ON public.candidatos;
CREATE POLICY "candidatos_select_autenticados"
  ON public.candidatos FOR SELECT TO authenticated
  USING (public.usuario_activo());

DROP POLICY IF EXISTS "candidatos_insert_rrhh" ON public.candidatos;
CREATE POLICY "candidatos_insert_rrhh"
  ON public.candidatos FOR INSERT TO authenticated
  WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'rol') IN ('admin', 'reclutador') AND public.usuario_activo());

DROP POLICY IF EXISTS "candidatos_update_rrhh" ON public.candidatos;
CREATE POLICY "candidatos_update_rrhh"
  ON public.candidatos FOR UPDATE TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'rol') IN ('admin', 'reclutador') AND public.usuario_activo())
  WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'rol') IN ('admin', 'reclutador') AND public.usuario_activo());

DROP POLICY IF EXISTS "candidatos_delete_admin" ON public.candidatos;
CREATE POLICY "candidatos_delete_admin"
  ON public.candidatos FOR DELETE TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'rol') = 'admin' AND public.usuario_activo());

NOTIFY pgrst, 'reload schema';

-- Verificación:
-- SELECT email, rol, estado FROM public.perfiles ORDER BY rol, email;
-- Cada usuario con acceso debe aparecer aquí: quien no tenga perfil queda sin acceso a candidatos.
