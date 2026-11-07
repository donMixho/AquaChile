import { supabase } from '../supabaseClient';
import { finalizarEvaluacion, guardarBorrador, obtenerEvaluacion } from '../evaluacionesService';

const simular = () => {
  const upsert = jasmine.createSpy('upsert').and.callFake((fila) => ({
    select: () => ({ single: () => Promise.resolve({ data: fila, error: null }) })
  }));
  const update = jasmine.createSpy('update').and.callFake((valores) => ({
    eq: () => ({ select: () => ({ single: () => Promise.resolve({ data: valores, error: null }) }) })
  }));
  spyOn(supabase, 'from').and.callFake((tabla) => (tabla === 'evaluaciones' ? { upsert } : { update }));
  return { upsert, update };
};

const datos = { respuestas: { estudios: 'Técnico' }, observaciones: 'Buen perfil', enlaceReunion: 'https://meet.google.com/x', fechaEntrevista: '2026-11-07' };

describe('evaluacionesService', () => {
  it('obtenerEvaluacion devuelve null cuando el candidato aún no tiene entrevista.', async () => {
    spyOn(supabase, 'from').and.returnValue({
      select: () => ({ eq: () => ({ maybeSingle: () => Promise.resolve({ data: null, error: null }) }) })
    });

    expect(await obtenerEvaluacion(5)).toBeNull();
    expect(supabase.from).toHaveBeenCalledWith('evaluaciones');
  });

  it('el primer borrador se guarda por candidato y pasa a En proceso.', async () => {
    const { upsert, update } = simular();

    await guardarBorrador({ id: 3, estado: 'Pendiente' }, 'u1', datos);

    const [fila, opciones] = upsert.calls.mostRecent().args;
    expect(fila).toEqual(jasmine.objectContaining({ candidato_id: 3, evaluador_id: 'u1', estado: 'borrador', observaciones: 'Buen perfil' }));
    expect(opciones).toEqual({ onConflict: 'candidato_id' });
    expect(update).toHaveBeenCalledWith({ estado: 'En proceso' });
  });

  it('guarda la modalidad y el lugar; cualquier valor desconocido cae en Videollamada.', async () => {
    const { upsert } = simular();

    await guardarBorrador({ id: 3, estado: 'En proceso' }, 'u1', { ...datos, modalidad: 'Presencial', lugar: 'Sala 2' });
    expect(upsert.calls.mostRecent().args[0]).toEqual(jasmine.objectContaining({ modalidad: 'Presencial', lugar: 'Sala 2' }));

    await guardarBorrador({ id: 3, estado: 'En proceso' }, 'u1', { ...datos, modalidad: 'Telefónica' });
    expect(upsert.calls.mostRecent().args[0]).toEqual(jasmine.objectContaining({ modalidad: 'Videollamada', lugar: null }));
  });

  it('un borrador posterior no vuelve a cambiar el estado.', async () => {
    const { update } = simular();

    await guardarBorrador({ id: 3, estado: 'En proceso' }, 'u1', datos);

    expect(update).not.toHaveBeenCalled();
  });

  it('finalizar guarda el resultado y actualiza el estado del candidato.', async () => {
    const { upsert, update } = simular();

    await finalizarEvaluacion({ id: 3, estado: 'En proceso' }, 'u1', datos, 'No apto');

    expect(upsert.calls.mostRecent().args[0]).toEqual(jasmine.objectContaining({ estado: 'finalizada', resultado: 'No apto' }));
    expect(update).toHaveBeenCalledWith({ estado: 'No apto' });
  });

  it('finalizar rechaza un resultado inválido o sin observaciones, sin tocar la base.', async () => {
    const { upsert } = simular();

    await expectAsync(finalizarEvaluacion({ id: 3 }, 'u1', datos, 'Quizás')).toBeRejectedWithError(/Apto o No apto/);
    await expectAsync(finalizarEvaluacion({ id: 3 }, 'u1', { ...datos, observaciones: '  ' }, 'Apto')).toBeRejectedWithError(/observaciones/);
    expect(upsert).not.toHaveBeenCalled();
  });

  it('propaga el error de la base al guardar.', async () => {
    spyOn(supabase, 'from').and.returnValue({
      upsert: () => ({ select: () => ({ single: () => Promise.resolve({ data: null, error: new Error('sin permiso') }) }) })
    });

    await expectAsync(guardarBorrador({ id: 3, estado: 'Pendiente' }, 'u1', datos)).toBeRejectedWithError('sin permiso');
  });
});
