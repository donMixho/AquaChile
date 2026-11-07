import { supabase } from '../supabaseClient';
import { traducirFaltaDeMigracion } from '../erroresBase';
import { obtenerEvaluacion } from '../evaluacionesService';
import { obtenerEquipo } from '../equipoService';

const migracion = { tabla: 'evaluaciones', archivo: 'migracion_evaluaciones.sql' };

describe('traducirFaltaDeMigracion', () => {
  it('traduce una tabla ausente a la instrucción de qué archivo ejecutar.', () => {
    const original = { code: 'PGRST205', message: "Could not find the table 'public.evaluaciones' in the schema cache" };

    const traducido = traducirFaltaDeMigracion(original, migracion);

    expect(traducido.message).toBe('Falta crear la tabla «evaluaciones». Ejecuta docs/migracion_evaluaciones.sql en Supabase (SQL Editor).');
    expect(traducido.cause).toBe(original);
  });

  it('reconoce el mensaje aunque no traiga código.', () => {
    const traducido = traducirFaltaDeMigracion(
      new Error("Could not find the table 'public.evaluaciones' in the schema cache"),
      migracion
    );

    expect(traducido.message).toContain('Falta crear la tabla');
  });

  it('traduce una columna ausente a "desactualizada".', () => {
    const traducido = traducirFaltaDeMigracion(
      { code: 'PGRST204', message: "Could not find the 'modalidad' column of 'evaluaciones' in the schema cache" },
      migracion
    );

    expect(traducido.message).toContain('desactualizada');
    expect(traducido.message).toContain('Vuelve a ejecutar docs/migracion_evaluaciones.sql');
  });

  it('deja intacto cualquier otro error.', () => {
    const otro = new Error('sin conexión');

    expect(traducirFaltaDeMigracion(otro, migracion)).toBe(otro);
  });
});

describe('servicios con migración pendiente', () => {
  it('obtenerEvaluacion avisa qué archivo ejecutar.', async () => {
    spyOn(supabase, 'from').and.returnValue({
      select: () => ({
        eq: () => ({
          maybeSingle: () => Promise.resolve({
            data: null,
            error: { code: 'PGRST205', message: "Could not find the table 'public.evaluaciones' in the schema cache" }
          })
        })
      })
    });

    await expectAsync(obtenerEvaluacion(1)).toBeRejectedWithError(/docs\/migracion_evaluaciones\.sql/);
  });

  it('obtenerEquipo avisa qué archivo ejecutar.', async () => {
    spyOn(supabase, 'from').and.returnValue({
      select: () => ({
        order: () => Promise.resolve({
          data: null,
          error: { code: 'PGRST205', message: "Could not find the table 'public.perfiles' in the schema cache" }
        })
      })
    });

    await expectAsync(obtenerEquipo()).toBeRejectedWithError(/docs\/migracion_perfiles\.sql/);
  });
});
