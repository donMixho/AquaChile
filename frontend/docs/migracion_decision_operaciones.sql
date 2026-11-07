-- Decisión de Operaciones sobre los candidatos que R&S dejó como Apto: Seleccionado o Descartado.
-- Ejecutar en Supabase > SQL Editor DESPUÉS de docs/migracion_perfiles.sql. Es idempotente.
--
-- Esta decisión es independiente del estado de la entrevista: `estado` (Apto / No apto) lo fija el
-- reclutador; `decision_operaciones` lo fija Operaciones solo sobre los Apto.
--   decision_operaciones : 'Seleccionado' | 'Descartado' | NULL (aún sin decidir)
--   motivo_decision      : obligatorio al descartar
--   decidido_por/_en     : los pone la base, no se pueden falsificar desde la app

DO $$
BEGIN
  IF to_regclass('public.perfiles') IS NULL THEN
    RAISE EXCEPTION 'No existe la tabla public.perfiles. Ejecuta primero docs/migracion_perfiles.sql.';
  END IF;
END
$$;

ALTER TABLE public.candidatos
  ADD COLUMN IF NOT EXISTS decision_operaciones text CHECK (decision_operaciones IN ('Seleccionado', 'Descartado')),
  ADD COLUMN IF NOT EXISTS motivo_decision      text,
  ADD COLUMN IF NOT EXISTS decidido_por         uuid REFERENCES public.perfiles (id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS decidido_en          timestamptz;

-- Operaciones puede modificar solo candidatos que ya son Apto.
DROP POLICY IF EXISTS "candidatos_update_operaciones" ON public.candidatos;
CREATE POLICY "candidatos_update_operaciones"
  ON public.candidatos FOR UPDATE TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'rol') = 'operaciones' AND public.usuario_activo() AND estado = 'Apto')
  WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'rol') = 'operaciones' AND public.usuario_activo() AND estado = 'Apto');

-- La política de arriba no limita columnas, así que este trigger lo hace:
--  * Operaciones solo puede cambiar las columnas de decisión, nada más del candidato.
--  * Reclutador no puede tocar la decisión (solo admin y Operaciones).
--  * Descartar exige motivo, y quién decidió y cuándo los pone la base.
-- Sin sesión de usuario (por ejemplo, mantenimiento desde el SQL Editor) no se restringe nada.
CREATE OR REPLACE FUNCTION public.proteger_decision()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  rol text := auth.jwt() -> 'app_metadata' ->> 'rol';
BEGIN
  IF rol = 'operaciones' THEN
    IF (to_jsonb(NEW) - 'decision_operaciones' - 'motivo_decision' - 'decidido_por' - 'decidido_en')
       IS DISTINCT FROM
       (to_jsonb(OLD) - 'decision_operaciones' - 'motivo_decision' - 'decidido_por' - 'decidido_en') THEN
      RAISE EXCEPTION 'Operaciones solo puede registrar su decisión sobre un candidato apto.' USING ERRCODE = '42501';
    END IF;
  ELSIF rol IS NOT NULL AND rol <> 'admin' AND (
    NEW.decision_operaciones IS DISTINCT FROM OLD.decision_operaciones
    OR NEW.motivo_decision   IS DISTINCT FROM OLD.motivo_decision
    OR NEW.decidido_por      IS DISTINCT FROM OLD.decidido_por
    OR NEW.decidido_en       IS DISTINCT FROM OLD.decidido_en
  ) THEN
    RAISE EXCEPTION 'Solo Operaciones puede decidir sobre los candidatos aptos.' USING ERRCODE = '42501';
  END IF;

  IF NEW.decision_operaciones IS DISTINCT FROM OLD.decision_operaciones THEN
    IF NEW.decision_operaciones = 'Descartado' AND COALESCE(btrim(NEW.motivo_decision), '') = '' THEN
      RAISE EXCEPTION 'Indica el motivo del descarte.' USING ERRCODE = '23514';
    END IF;
    IF NEW.decision_operaciones IS NULL THEN
      NEW.decidido_por := NULL;
      NEW.decidido_en  := NULL;
      NEW.motivo_decision := NULL;
    ELSE
      NEW.decidido_por := auth.uid();
      NEW.decidido_en  := now();
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS candidatos_proteger_decision ON public.candidatos;
CREATE TRIGGER candidatos_proteger_decision
  BEFORE UPDATE ON public.candidatos
  FOR EACH ROW EXECUTE FUNCTION public.proteger_decision();

NOTIFY pgrst, 'reload schema';

-- Verificación:
-- SELECT nombre_completo, estado, decision_operaciones, motivo_decision, decidido_en FROM public.candidatos;
