import { supabase } from '../supabaseClient';
import { obtenerCandidatos, crearCandidato } from '../candidatosService';

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
});
