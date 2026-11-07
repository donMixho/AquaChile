import { supabase } from '../supabaseClient';
import { crearCarpetaDrive } from '../driveService';
import { obtenerCandidatos, crearCandidato, normalizarEstado, actualizarEstadoCandidato, obtenerCandidatoPorId, actualizarCandidato, eliminarCandidato, asignarCandidato } from '../candidatosService';

describe('candidatosService (supabase simulado)', () => {
  it('29. obtenerCandidatos devuelve los datos de la consulta.', async () => {
    const datos = [{ id: 1 }];
    spyOn(supabase, 'from').and.returnValue({
      select: () => ({ order: () => Promise.resolve({ data: datos, error: null }) })
    });

    expect(await obtenerCandidatos()).toEqual(datos);
    expect(supabase.from).toHaveBeenCalledWith('candidatos');
  });

  it('30. obtenerCandidatos lanza el error cuando el servicio no responde.', async () => {
    const fallo = new Error('sin respuesta');
    spyOn(supabase, 'from').and.returnValue({
      select: () => ({ order: () => Promise.resolve({ data: null, error: fallo }) })
    });

    await expectAsync(obtenerCandidatos()).toBeRejectedWith(fallo);
  });

  it('31. crearCandidato mapea los campos del formulario a columnas de la tabla.', async () => {
    spyOn(window, 'fetch').and.callFake(() => Promise.reject(new Error('sin red')));
    const insert = jasmine.createSpy('insert').and.returnValue({
      select: () => ({ single: () => Promise.resolve({ data: { id: 9 }, error: null }) })
    });
    spyOn(supabase, 'from').and.returnValue({ insert });

    const creado = await crearCandidato({
      nombreCompleto: 'Ana Soto',
      rut: '1-9',
      cargo: 'Operaria',
      familiaCargo: 'Producción',
      email: 'ana@aquachile.cl'
    });

    expect(creado).toEqual({ id: 9 });
    expect(insert).toHaveBeenCalledWith({
      nombre_completo: 'Ana Soto',
      rut: '1-9',
      cargo: 'Operaria',
      familia_cargo: 'Producción',
      email: 'ana@aquachile.cl',
      telefono: null,
      cv_url: null
    });
  });

  it('32. crearCandidato elimina el CV subido si falla el insert.', async () => {
    const remove = jasmine.createSpy('remove').and.returnValue(Promise.resolve({}));
    const bucket = {
      upload: () => Promise.resolve({ error: null }),
      getPublicUrl: () => ({ data: { publicUrl: 'https://x/cv.pdf' } }),
      remove
    };
    spyOn(supabase.storage, 'from').and.returnValue(bucket);
    spyOn(supabase, 'from').and.returnValue({
      insert: () => ({
        select: () => ({ single: () => Promise.resolve({ data: null, error: new Error('duplicado') }) })
      })
    });
    const archivo = new File(['x'], 'cv.pdf', { type: 'application/pdf' });

    await expectAsync(crearCandidato({ rut: '1-9' }, archivo)).toBeRejected();
    expect(remove).toHaveBeenCalledTimes(1);
  });

  it('33. normalizarEstado clasifica el estado y usa Pendiente por defecto.', () => {
    expect(normalizarEstado({})).toBe('Pendiente');
    expect(normalizarEstado({ estado: 'Pendiente' })).toBe('Pendiente');
    expect(normalizarEstado({ estado: 'En proceso' })).toBe('En proceso');
    expect(normalizarEstado({ estado: 'Apto' })).toBe('Apto');
    expect(normalizarEstado({ estado: 'No apto' })).toBe('No apto');
    expect(normalizarEstado({ estado: 'Finalizada', estado_resultado: 'No apto' })).toBe('No apto');
    expect(normalizarEstado({ estado: 'algo raro' })).toBe('Pendiente');
  });

  it('34. actualizarEstadoCandidato hace UPDATE de estado sobre el candidato indicado.', async () => {
    const eq = jasmine.createSpy('eq').and.returnValue({
      select: () => ({ single: () => Promise.resolve({ data: { id: 7, estado: 'Apto' }, error: null }) })
    });
    const update = jasmine.createSpy('update').and.returnValue({ eq });
    spyOn(supabase, 'from').and.returnValue({ update });

    expect(await actualizarEstadoCandidato(7, 'Apto')).toEqual({ id: 7, estado: 'Apto' });
    expect(supabase.from).toHaveBeenCalledWith('candidatos');
    expect(update).toHaveBeenCalledWith({ estado: 'Apto' });
    expect(eq).toHaveBeenCalledWith('id', 7);
  });

  it('35. actualizarEstadoCandidato rechaza estados inválidos sin llamar a Supabase.', async () => {
    spyOn(supabase, 'from');

    await expectAsync(actualizarEstadoCandidato(7, 'Finalizada')).toBeRejectedWithError(/Estado no válido/);
    expect(supabase.from).not.toHaveBeenCalled();
  });

  it('36. actualizarEstadoCandidato y obtenerCandidatoPorId propagan el error del servicio.', async () => {
    const fallo = { data: null, error: new Error('rls') };
    spyOn(supabase, 'from').and.returnValue({
      update: () => ({ eq: () => ({ select: () => ({ single: () => Promise.resolve(fallo) }) }) }),
      select: () => ({ eq: () => ({ single: () => Promise.resolve(fallo) }) })
    });

    await expectAsync(actualizarEstadoCandidato(1, 'Apto')).toBeRejectedWithError('rls');
    await expectAsync(obtenerCandidatoPorId(1)).toBeRejectedWithError('rls');
  });

  const simularUpdateCandidato = (resultado) => {
    const eq = jasmine.createSpy('eq').and.returnValue({
      select: () => ({ single: () => Promise.resolve(resultado) })
    });
    const update = jasmine.createSpy('update').and.returnValue({ eq });
    spyOn(supabase, 'from').and.returnValue({ update });
    return { update, eq };
  };

  it('45. actualizarCandidato hace UPDATE por id solo con las columnas editables.', async () => {
    const { update, eq } = simularUpdateCandidato({ data: { id: 3, cargo: 'Jefe' }, error: null });

    const fila = await actualizarCandidato(3, {
      nombre: 'Ana Soto',
      cargo: 'Jefe',
      email: 'ana@aquachile.cl',
      familia: 'Calidad',
      id: 99,
      estado: 'Apto',
      cv_url: 'x'
    });

    expect(fila).toEqual({ id: 3, cargo: 'Jefe' });
    expect(supabase.from).toHaveBeenCalledWith('candidatos');
    expect(update).toHaveBeenCalledWith({
      nombre_completo: 'Ana Soto',
      cargo: 'Jefe',
      email: 'ana@aquachile.cl',
      familia_cargo: 'Calidad'
    });
    expect(eq).toHaveBeenCalledWith('id', 3);
  });

  it('46. actualizarCandidato rechaza si no hay campos editables, sin llamar a Supabase.', async () => {
    spyOn(supabase, 'from');

    await expectAsync(actualizarCandidato(1, { id: 5, estado: 'Apto' })).toBeRejectedWithError('No hay datos para actualizar.');
    await expectAsync(actualizarCandidato(1)).toBeRejectedWithError('No hay datos para actualizar.');
    expect(supabase.from).not.toHaveBeenCalled();
  });

  it('47. actualizarCandidato propaga el error de Supabase (red, RLS, etc.).', async () => {
    simularUpdateCandidato({ data: null, error: new Error('Failed to fetch') });

    await expectAsync(actualizarCandidato(1, { cargo: 'X' })).toBeRejectedWithError('Failed to fetch');
  });

  it('48. Si el UPDATE no afecta filas (RLS o id inexistente) lanza un error explicativo.', async () => {
    simularUpdateCandidato({ data: null, error: { code: 'PGRST116', message: 'JSON object requested, multiple (or no) rows returned' } });

    await expectAsync(actualizarCandidato(1, { cargo: 'X' })).toBeRejectedWithError(/No se modificó ningún registro/);
  });

  it('49. Un rechazo por RLS (42501) se traduce a un mensaje de permisos en ambas funciones.', async () => {
    simularUpdateCandidato({ data: null, error: { code: '42501', message: 'new row violates row-level security policy' } });

    await expectAsync(actualizarCandidato(1, { cargo: 'X' })).toBeRejectedWithError(/no tiene permiso para modificar candidatos/);
    await expectAsync(actualizarEstadoCandidato(1, 'Apto')).toBeRejectedWithError(/no tiene permiso para modificar candidatos/);
  });

  it('50. Ambas funciones avisan cuando el UPDATE no afecta ninguna fila (PGRST116).', async () => {
    simularUpdateCandidato({ data: null, error: { code: 'PGRST116', message: 'no rows' } });

    await expectAsync(actualizarCandidato(1, { cargo: 'X' })).toBeRejectedWithError(/No se modificó ningún registro/);
    await expectAsync(actualizarEstadoCandidato(1, 'En proceso')).toBeRejectedWithError(/No se modificó ningún registro/);
  });

  it('51. actualizarEstadoCandidato propaga errores de red sin traducirlos.', async () => {
    simularUpdateCandidato({ data: null, error: new Error('Failed to fetch') });

    await expectAsync(actualizarEstadoCandidato(1, 'Apto')).toBeRejectedWithError('Failed to fetch');
  });

  const simularDeleteCandidato = (resultado) => {
    const eq = jasmine.createSpy('eq').and.returnValue({ select: () => Promise.resolve(resultado) });
    const borrar = jasmine.createSpy('delete').and.returnValue({ eq });
    spyOn(supabase, 'from').and.returnValue({ delete: borrar });
    return { borrar, eq };
  };

  it('52. eliminarCandidato hace DELETE por id y devuelve la fila eliminada.', async () => {
    const { borrar, eq } = simularDeleteCandidato({ data: [{ id: 4 }], error: null });

    expect(await eliminarCandidato(4)).toEqual({ id: 4 });
    expect(supabase.from).toHaveBeenCalledWith('candidatos');
    expect(borrar).toHaveBeenCalledTimes(1);
    expect(eq).toHaveBeenCalledWith('id', 4);
  });

  it('53. Un DELETE que no borra filas (RLS sin permiso) falla en vez de parecer exitoso.', async () => {
    simularDeleteCandidato({ data: [], error: null });

    await expectAsync(eliminarCandidato(4)).toBeRejectedWithError(/No se eliminó ningún registro/);
  });

  it('54. Traduce permisos (42501) y registros asociados (23503); propaga errores de red.', async () => {
    simularDeleteCandidato({ data: null, error: { code: '42501', message: 'denied' } });
    await expectAsync(eliminarCandidato(1)).toBeRejectedWithError(/no tiene permiso para eliminar/);

    supabase.from.and.returnValue({
      delete: () => ({ eq: () => ({ select: () => Promise.resolve({ data: null, error: { code: '23503', message: 'fk' } }) }) })
    });
    await expectAsync(eliminarCandidato(1)).toBeRejectedWithError(/registros asociados/);

    supabase.from.and.returnValue({
      delete: () => ({ eq: () => ({ select: () => Promise.resolve({ data: null, error: new Error('Failed to fetch') }) }) })
    });
    await expectAsync(eliminarCandidato(1)).toBeRejectedWithError('Failed to fetch');
  });
});

// Deja correr la tarea en segundo plano de Drive (crearCandidato ya no la espera).
const esperarSegundoPlano = () => new Promise((resolver) => setTimeout(resolver, 20));

const respuestaJson = (cuerpo, ok = true) => Promise.resolve({ ok, json: () => Promise.resolve(cuerpo) });

describe('Integración con Google Drive', () => {
  const datos = { nombre: 'Ana Soto', rut: '1-9', cargo: 'Operaria', familia: 'Calidad', email: 'a@b.cl' };
  const filaCreada = { id: 9, rut: '1-9', nombre_completo: 'Ana Soto' };
  const simularInsert = () => ({
    insert: () => ({ select: () => ({ single: () => Promise.resolve({ data: filaCreada, error: null }) }) })
  });

  it('70. crearCarpetaDrive envía rut y nombre por POST y devuelve folderUrl.', async () => {
    spyOn(window, 'fetch').and.returnValue(respuestaJson({ success: true, folderUrl: 'https://drive/f1' }));

    expect(await crearCarpetaDrive({ rut: '1-9', nombre: 'Ana Soto' })).toBe('https://drive/f1');
    const [url, opciones] = window.fetch.calls.mostRecent().args;
    expect(url).toBe('https://webhook.test/drive');
    expect(opciones.method).toBe('POST');
    expect(JSON.parse(opciones.body)).toEqual({ rut: '1-9', nombre: 'Ana Soto' });
  });

  it('71. crearCarpetaDrive devuelve null si falla la red, el HTTP o success es false.', async () => {
    spyOn(window, 'fetch').and.returnValues(
      Promise.reject(new Error('sin red')),
      respuestaJson({}, false),
      respuestaJson({ success: false, error: 'x' }),
      Promise.resolve({ ok: true, json: () => Promise.reject(new Error('no es JSON')) })
    );

    for (let i = 0; i < 4; i += 1) {
      expect(await crearCarpetaDrive({ rut: '1-9', nombre: 'Ana' })).toBeNull();
    }
  });

  it('72. Si Drive falla, crearCandidato igual devuelve el candidato registrado.', async () => {
    spyOn(window, 'fetch').and.callFake(() => Promise.reject(new Error('timeout')));
    spyOn(supabase, 'from').and.returnValue(simularInsert());

    expect(await crearCandidato(datos)).toEqual(filaCreada);
    await esperarSegundoPlano();
  });

  it('73. Con carpeta creada, guarda drive_folder_url en segundo plano sin bloquear el registro.', async () => {
    spyOn(window, 'fetch').and.returnValue(respuestaJson({ success: true, folderUrl: 'https://drive/f1' }));
    const actualizado = { ...filaCreada, drive_folder_url: 'https://drive/f1' };
    const update = jasmine.createSpy('update').and.returnValue({
      eq: () => ({ select: () => ({ single: () => Promise.resolve({ data: actualizado, error: null }) }) })
    });
    spyOn(supabase, 'from').and.returnValue({ ...simularInsert(), update });

    // Retorna el candidato recién insertado sin esperar al webhook ni al UPDATE.
    expect(await crearCandidato(datos)).toEqual(filaCreada);
    expect(update).not.toHaveBeenCalled();

    await esperarSegundoPlano();
    expect(update).toHaveBeenCalledWith({ drive_folder_url: 'https://drive/f1' });
  });

  it('74. Si falla guardar el enlace, el candidato se devuelve sin error.', async () => {
    spyOn(window, 'fetch').and.returnValue(respuestaJson({ success: true, folderUrl: 'https://drive/f1' }));
    const update = () => ({
      eq: () => ({ select: () => ({ single: () => Promise.resolve({ data: null, error: new Error('columna inexistente') }) }) })
    });
    spyOn(supabase, 'from').and.returnValue({ ...simularInsert(), update });

    expect(await crearCandidato(datos)).toEqual(filaCreada);
    await esperarSegundoPlano();
  });
});

describe('asignarCandidato', () => {
  const simularUpdate = () => {
    const update = jasmine.createSpy('update').and.callFake((valores) => ({
      eq: () => ({ select: () => ({ single: () => Promise.resolve({ data: { id: 1, ...valores }, error: null }) }) })
    }));
    spyOn(supabase, 'from').and.returnValue({ update });
    return update;
  };

  it('envía solo la clave pedida y convierte la solicitud a número.', async () => {
    const update = simularUpdate();

    await asignarCandidato(1, { solicitudId: '7' });
    expect(update).toHaveBeenCalledWith({ solicitud_id: 7 });

    await asignarCandidato(1, { reclutadorId: 'r1' });
    expect(update).toHaveBeenCalledWith({ reclutador_id: 'r1' });
  });

  it('un valor vacío deja al candidato sin asignar.', async () => {
    const update = simularUpdate();

    await asignarCandidato(1, { reclutadorId: '', solicitudId: '' });

    expect(update).toHaveBeenCalledWith({ reclutador_id: null, solicitud_id: null });
  });

  it('rechaza una llamada sin datos.', async () => {
    simularUpdate();

    await expectAsync(asignarCandidato(1, {})).toBeRejectedWithError('No hay datos para actualizar.');
  });
});

describe('crearCandidato: responsable', () => {
  const datos = { nombre: 'Ana Soto', rut: '1-9', cargo: 'Operaria', familia: 'Producción', email: 'ana@aquachile.cl' };

  it('el reclutador que registra queda como responsable del candidato.', async () => {
    spyOn(window, 'fetch').and.callFake(() => Promise.reject(new Error('sin red')));
    const insert = jasmine.createSpy('insert').and.returnValue({
      select: () => ({ single: () => Promise.resolve({ data: { id: 9 }, error: null }) })
    });
    spyOn(supabase, 'from').and.returnValue({ insert });

    await crearCandidato(datos, null, { reclutadorId: 'r1' });

    expect(insert.calls.mostRecent().args[0].reclutador_id).toBe('r1');
  });

  it('sin responsable no envía la columna.', async () => {
    spyOn(window, 'fetch').and.callFake(() => Promise.reject(new Error('sin red')));
    const insert = jasmine.createSpy('insert').and.returnValue({
      select: () => ({ single: () => Promise.resolve({ data: { id: 9 }, error: null }) })
    });
    spyOn(supabase, 'from').and.returnValue({ insert });

    await crearCandidato(datos);

    expect('reclutador_id' in insert.calls.mostRecent().args[0]).toBe(false);
  });

  it('si la columna aún no existe, reintenta sin ella y registra igual.', async () => {
    spyOn(window, 'fetch').and.callFake(() => Promise.reject(new Error('sin red')));
    const insert = jasmine.createSpy('insert').and.callFake((valores) => ({
      select: () => ({
        single: () => Promise.resolve(
          'reclutador_id' in valores
            ? { data: null, error: { code: 'PGRST204', message: "Could not find the 'reclutador_id' column of 'candidatos' in the schema cache" } }
            : { data: { id: 9 }, error: null }
        )
      })
    }));
    spyOn(supabase, 'from').and.returnValue({ insert });

    expect(await crearCandidato(datos, null, { reclutadorId: 'r1' })).toEqual({ id: 9 });
    expect(insert).toHaveBeenCalledTimes(2);
  });
});
