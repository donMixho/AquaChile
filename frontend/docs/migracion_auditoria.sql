-- Registro de auditoría (audit trail): quién hizo qué y cuándo sobre los datos sensibles.
-- Ejecutar en Supabase > SQL Editor DESPUÉS de docs/migracion_perfiles.sql. Es idempotente.
--
-- Cada INSERT, UPDATE o DELETE en candidatos, solicitudes, evaluaciones y perfiles deja una fila en
-- public.log_auditoria con el usuario, su rol, la acción y los datos antes/después del cambio.
-- El registro es inalterable: nadie (ni siquiera un admin) puede editar o borrar filas desde la app.
-- Solo un admin activo puede leerlo.

CREATE TABLE IF NOT EXISTS public.log_auditoria (
  id            bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  creado_en     timestamptz NOT NULL DEFAULT now(),
  usuario_id    uuid,
  usuario_email text,
  rol           text,
  accion        text NOT NULL CHECK (accion IN ('CREAR', 'ACTUALIZAR', 'ELIMINAR')),
  tabla         text NOT NULL,
  registro_id   text,
  datos_antes   jsonb,
  datos_despues jsonb
);

CREATE INDEX IF NOT EXISTS log_auditoria_creado_en_idx ON public.log_auditoria (creado_en DESC);
CREATE INDEX IF NOT EXISTS log_auditoria_tabla_idx ON public.log_auditoria (tabla);

-- Función disparadora. SECURITY DEFINER para poder escribir aunque el usuario no tenga permiso
-- de INSERT sobre log_auditoria (que no tiene: solo se escribe desde aquí).
CREATE OR REPLACE FUNCTION public.registrar_auditoria()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_antes   jsonb := CASE WHEN TG_OP = 'INSERT' THEN NULL ELSE to_jsonb(OLD) END;
  v_despues jsonb := CASE WHEN TG_OP = 'DELETE' THEN NULL ELSE to_jsonb(NEW) END;
  v_fila    jsonb := COALESCE(v_despues, v_antes);
BEGIN
  INSERT INTO public.log_auditoria
    (usuario_id, usuario_email, rol, accion, tabla, registro_id, datos_antes, datos_despues)
  VALUES (
    auth.uid(),
    auth.jwt() ->> 'email',
    auth.jwt() -> 'app_metadata' ->> 'rol',
    CASE TG_OP WHEN 'INSERT' THEN 'CREAR' WHEN 'UPDATE' THEN 'ACTUALIZAR' ELSE 'ELIMINAR' END,
    TG_TABLE_NAME,
    v_fila ->> 'id',
    v_antes,
    v_despues
  );
  RETURN NULL; -- trigger AFTER: el valor de retorno se ignora
END;
$$;

-- Inalterable: RLS activo, solo lectura para el admin y sin políticas de escritura.
ALTER TABLE public.log_auditoria ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "log_auditoria_select_admin" ON public.log_auditoria;
CREATE POLICY "log_auditoria_select_admin"
  ON public.log_auditoria FOR SELECT TO authenticated
  USING (public.es_admin_activo());

REVOKE ALL ON public.log_auditoria FROM anon, authenticated;
GRANT SELECT ON public.log_auditoria TO authenticated;

-- Triggers sobre las tablas sensibles (solo las que existan en esta base).
DO $$
DECLARE
  t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['candidatos', 'solicitudes', 'evaluaciones', 'perfiles'] LOOP
    IF to_regclass('public.' || t) IS NOT NULL THEN
      EXECUTE format('DROP TRIGGER IF EXISTS auditoria_%1$s ON public.%1$I', t);
      EXECUTE format(
        'CREATE TRIGGER auditoria_%1$s AFTER INSERT OR UPDATE OR DELETE ON public.%1$I
         FOR EACH ROW EXECUTE FUNCTION public.registrar_auditoria()', t);
    END IF;
  END LOOP;
END
$$;

-- Verificación:
-- SELECT tgname, tgrelid::regclass FROM pg_trigger WHERE tgname LIKE 'auditoria_%';
-- SELECT * FROM public.log_auditoria ORDER BY creado_en DESC LIMIT 20;
