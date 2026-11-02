import { supabase } from '../supabaseClient';
import { crearSolicitud, obtenerSolicitudPorId, obtenerSolicitudes } from '../solicitudesService';

const fila = { id: 1, titulo: 'Turno noche', cargo: 'Operario', familia_cargo: 'Operaciones', vacantes: 3 };

describe('solicitudesService', () => {
  it('61. obtenerSolicitudes lee la tabla solicitudes ordenada por fecha descendente.', async () => {
    const order = jasmine.createSpy('order').and.resolveTo({ data: [fila], error: null });
    const from = spyOn(supabase, 'from').and.returnValue({ select: () => ({ order }) });

    expect(await obtenerSolicitudes()).toEqual([fila]);
    expect(from).toHaveBeenCalledWith('solicitudes');
    expect(order).toHaveBeenCalledWith('created_at', { ascending: false });
  });

  it('62. obtenerSolicitudes traduce un error de la base a un Error legible.', async () => {
    spyOn(supabase, 'from').and.returnValue({
      select: () => ({ order: () => Promise.resolve({ data: null, error: { message: 'permiso denegado' } }) })
    });

    await expectAsync(obtenerSolicitudes()).toBeRejectedWithError(/No se pudieron obtener las solicitudes: permiso denegado/);
  });

  it('63. obtenerSolicitudes captura fallos de red lanzados por el cliente.', async () => {
    spyOn(supabase, 'from').and.throwError('Failed to fetch');

    await expectAsync(obtenerSolicitudes()).toBeRejectedWithError(/Failed to fetch/);
  });

  it('64. obtenerSolicitudPorId consulta por id y devuelve null si no existe.', async () => {
    const eq = jasmine.createSpy('eq').and.returnValue({ maybeSingle: () => Promise.resolve({ data: null, error: null }) });
    spyOn(supabase, 'from').and.returnValue({ select: () => ({ eq }) });

    expect(await obtenerSolicitudPorId('7')).toBeNull();
    expect(eq).toHaveBeenCalledWith('id', '7');
  });

  it('65. obtenerSolicitudPorId devuelve la fila y propaga errores.', async () => {
    const maybeSingle = jasmine.createSpy('maybeSingle');
    spyOn(supabase, 'from').and.returnValue({ select: () => ({ eq: () => ({ maybeSingle }) }) });

    maybeSingle.and.resolveTo({ data: fila, error: null });
    expect(await obtenerSolicitudPorId(1)).toEqual(fila);

    maybeSingle.and.resolveTo({ data: null, error: { message: 'caído' } });
    await expectAsync(obtenerSolicitudPorId(1)).toBeRejectedWithError(/No se pudo obtener la solicitud: caído/);
  });

  it('66. crearSolicitud inserta los campos de la tabla y devuelve la fila creada.', async () => {
    const insert = jasmine.createSpy('insert').and.returnValue({
      select: () => ({ single: () => Promise.resolve({ data: { ...fila, id: 9 }, error: null }) })
    });
    spyOn(supabase, 'from').and.returnValue({ insert });

    const creada = await crearSolicitud({
      titulo: 'Turno noche', cargo: 'Operario', familiaCargo: 'Operaciones', vacantes: '3', descripcion: ''
    });

    expect(creada.id).toBe(9);
    expect(insert).toHaveBeenCalledWith({
      titulo: 'Turno noche', cargo: 'Operario', familia_cargo: 'Operaciones',
      vacantes: 3, estado: 'Abierta', descripcion: null
    });
  });

  it('67. crearSolicitud falla con un mensaje claro si la base rechaza el INSERT.', async () => {
    spyOn(supabase, 'from').and.returnValue({
      insert: () => ({ select: () => ({ single: () => Promise.resolve({ data: null, error: { message: 'RLS' } }) }) })
    });

    await expectAsync(crearSolicitud({ titulo: 'x', cargo: 'y', familiaCargo: 'z' }))
      .toBeRejectedWithError(/No se pudo crear la solicitud: RLS/);
  });
});
