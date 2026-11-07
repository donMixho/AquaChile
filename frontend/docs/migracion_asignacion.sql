-- Asignación de candidatos: quién es el responsable de cada uno y a qué solicitud de cargo pertenece.
-- Ejecutar en Supabase > SQL Editor DESPUÉS de docs/migracion_perfiles.sql y docs/migracion_solicitudes.sql.
-- Es idempotente.
--
-- reclutador_id : responsable del candidato (un reclutador). NULL = sin asignar.
-- solicitud_id  : solicitud de cargo a la que postula. NULL = sin vincular.
--
-- Con esto el Resumen del admin puede mostrar "N de M vacantes cubiertas" (candidatos Apto de la
-- solicitud) y la pantalla Equipo puede mostrar los casos abiertos de cada reclutador.

-- solicitud_id copia el tipo real de solicitudes.id para que la clave foránea no falle.
DO $$
DECLARE
  tipo_solicitud text;
BEGIN
  IF to_regclass('public.perfiles') IS NULL THEN
    RAISE EXCEPTION 'No existe la tabla public.perfiles. Ejecuta primero docs/migracion_perfiles.sql.';
  END IF;
  IF to_regclass('public.solicitudes') IS NULL THEN
    RAISE EXCEPTION 'No existe la tabla public.solicitudes. Ejecuta primero docs/migracion_solicitudes.sql.';
  END IF;

  SELECT format_type(a.atttypid, a.atttypmod) INTO tipo_solicitud
  FROM pg_attribute a
  WHERE a.attrelid = 'public.solicitudes'::regclass AND a.attname = 'id' AND NOT a.attisdropped;

  ALTER TABLE public.candidatos
    ADD COLUMN IF NOT EXISTS reclutador_id uuid REFERENCES public.perfiles (id) ON DELETE SET NULL;
  EXECUTE format(
    'ALTER TABLE public.candidatos ADD COLUMN IF NOT EXISTS solicitud_id %s REFERENCES public.solicitudes (id) ON DELETE SET NULL',
    tipo_solicitud
  );
END
$$;

CREATE INDEX IF NOT EXISTS candidatos_reclutador_id_idx ON public.candidatos (reclutador_id);
CREATE INDEX IF NOT EXISTS candidatos_solicitud_id_idx  ON public.candidatos (solicitud_id);

-- Solo un administrador activo puede asignar o reasignar. Las políticas de UPDATE de `candidatos`
-- dejan editar cualquier columna a admin y reclutador; este trigger protege estas dos.
CREATE OR REPLACE FUNCTION public.proteger_asignacion()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF (NEW.reclutador_id IS DISTINCT FROM OLD.reclutador_id
      OR NEW.solicitud_id IS DISTINCT FROM OLD.solicitud_id)
     AND NOT public.es_admin_activo() THEN
    RAISE EXCEPTION 'Solo un administrador puede asignar candidatos.' USING ERRCODE = '42501';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS candidatos_proteger_asignacion ON public.candidatos;
CREATE TRIGGER candidatos_proteger_asignacion
  BEFORE UPDATE ON public.candidatos
  FOR EACH ROW EXECUTE FUNCTION public.proteger_asignacion();

NOTIFY pgrst, 'reload schema';

-- Verificación:
-- SELECT nombre_completo, reclutador_id, solicitud_id FROM public.candidatos;
