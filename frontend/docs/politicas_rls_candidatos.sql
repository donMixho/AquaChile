-- Políticas RLS de public.candidatos.
-- Ejecutar en Supabase > SQL Editor. Es idempotente: se puede correr más de una vez.
--
-- ANTES DE EJECUTAR: revisa Authentication > Policies > candidatos. Este script reemplaza las
-- políticas con estos nombres, pero NO borra otras que ya existan (por ejemplo una que dé acceso a
-- `anon`). Si hay una política para `anon`, elimínala: con ella cualquiera que tenga la clave
-- pública podría leer y editar candidatos sin iniciar sesión.

ALTER TABLE public.candidatos ENABLE ROW LEVEL SECURITY;

-- Lectura: la app lista candidatos y UPDATE ... RETURNING también la necesita.
DROP POLICY IF EXISTS "candidatos_select_autenticados" ON public.candidatos;
CREATE POLICY "candidatos_select_autenticados"
  ON public.candidatos FOR SELECT TO authenticated
  USING (true);

-- Alta de candidatos (Nuevo Candidato).
DROP POLICY IF EXISTS "candidatos_insert_autenticados" ON public.candidatos;
CREATE POLICY "candidatos_insert_autenticados"
  ON public.candidatos FOR INSERT TO authenticated
  WITH CHECK (true);

-- Edición y cambio de estado (modal de edición, Solicitar evaluación, Evaluar).
DROP POLICY IF EXISTS "candidatos_update_autenticados" ON public.candidatos;
CREATE POLICY "candidatos_update_autenticados"
  ON public.candidatos FOR UPDATE TO authenticated
  USING (true) WITH CHECK (true);

-- Eliminación: SOLO administradores. Lee el rol de app_metadata (solo el backend lo escribe).
-- Requiere asignar al admin App Metadata {"rol": "admin"} (Authentication > Users > editar).
-- Mientras no lo tenga, la base rechaza el borrado y la app muestra "no se eliminó ningún registro".
DROP POLICY IF EXISTS "candidatos_delete_admin" ON public.candidatos;
CREATE POLICY "candidatos_delete_admin"
  ON public.candidatos FOR DELETE TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'rol') = 'admin');

-- ---------------------------------------------------------------------------------------------
-- Alternativa más estricta: solo admin y reclutador (en vez de cualquier usuario con sesión).
-- Lee el rol de app_metadata, que solo el backend puede escribir. Requiere asignar el rol a cada
-- usuario (Authentication > Users > editar > App Metadata: {"rol": "admin"}); mientras un usuario
-- no lo tenga, la base le rechazará la edición aunque la interfaz lo deje entrar por su correo.
--
-- DROP POLICY IF EXISTS "candidatos_update_autenticados" ON public.candidatos;
-- CREATE POLICY "candidatos_update_rrhh"
--   ON public.candidatos FOR UPDATE TO authenticated
--   USING ((auth.jwt() -> 'app_metadata' ->> 'rol') IN ('admin', 'reclutador'))
--   WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'rol') IN ('admin', 'reclutador'));
-- ---------------------------------------------------------------------------------------------

-- Verificación: debe listar las tres políticas y rowsecurity = true.
-- SELECT policyname, cmd, roles FROM pg_policies WHERE tablename = 'candidatos';
-- SELECT rowsecurity FROM pg_tables WHERE tablename = 'candidatos';
