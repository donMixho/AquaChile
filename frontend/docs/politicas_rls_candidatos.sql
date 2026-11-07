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

-- Alta de candidatos (Nuevo Candidato): solo admin y reclutador. El rol se lee de app_metadata,
-- que únicamente el backend puede escribir (el usuario no puede modificarlo). Operaciones queda
-- como solo lectura también en la base de datos, no solo en la interfaz.
-- Requiere haber ejecutado docs/asignar_roles_usuarios.sql: un usuario sin rol es rechazado.
DROP POLICY IF EXISTS "candidatos_insert_autenticados" ON public.candidatos;
DROP POLICY IF EXISTS "candidatos_insert_rrhh" ON public.candidatos;
CREATE POLICY "candidatos_insert_rrhh"
  ON public.candidatos FOR INSERT TO authenticated
  WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'rol') IN ('admin', 'reclutador'));

-- Edición y cambio de estado (modal de edición, Solicitar evaluación, Evaluar, y el enlace de
-- Drive): solo admin y reclutador.
DROP POLICY IF EXISTS "candidatos_update_autenticados" ON public.candidatos;
DROP POLICY IF EXISTS "candidatos_update_rrhh" ON public.candidatos;
CREATE POLICY "candidatos_update_rrhh"
  ON public.candidatos FOR UPDATE TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'rol') IN ('admin', 'reclutador'))
  WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'rol') IN ('admin', 'reclutador'));

-- Eliminación: SOLO administradores. Lee el rol de app_metadata (solo el backend lo escribe).
-- Requiere asignar al admin App Metadata {"rol": "admin"} (Authentication > Users > editar).
-- Mientras no lo tenga, la base rechaza el borrado y la app muestra "no se eliminó ningún registro".
DROP POLICY IF EXISTS "candidatos_delete_admin" ON public.candidatos;
CREATE POLICY "candidatos_delete_admin"
  ON public.candidatos FOR DELETE TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'rol') = 'admin');

-- Verificación: debe listar las cuatro políticas y rowsecurity = true.
-- SELECT policyname, cmd, roles FROM pg_policies WHERE tablename = 'candidatos';
-- SELECT rowsecurity FROM pg_tables WHERE tablename = 'candidatos';
