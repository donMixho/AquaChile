import { supabase } from '../supabaseClient';
import { cambiarEstadoUsuario, invitarUsuario, obtenerEquipo } from '../equipoService';

const perfil = { id: 'u1', nombre: 'Ana Rojas', email: 'ana@aquachile.cl', rol: 'reclutador', estado: 'activo' };

describe('equipoService', () => {
  it('lista el equipo ordenado por nombre desde la tabla perfiles.', async () => {
    const order = jasmine.createSpy('order').and.resolveTo({ data: [perfil], error: null });
    const from = spyOn(supabase, 'from').and.returnValue({ select: () => ({ order }) });

    expect(await obtenerEquipo()).toEqual([perfil]);
    expect(from).toHaveBeenCalledWith('perfiles');
    expect(order).toHaveBeenCalledWith('nombre', { ascending: true });
  });

  it('propaga el error de la base al listar.', async () => {
    spyOn(supabase, 'from').and.returnValue({
      select: () => ({ order: () => Promise.resolve({ data: null, error: new Error('sin permiso') }) })
    });

    await expectAsync(obtenerEquipo()).toBeRejectedWithError('sin permiso');
  });

  it('rechaza una invitación con correo, nombre o rol inválidos sin llamar a la función.', async () => {
    const invoke = spyOn(supabase.functions, 'invoke');

    await expectAsync(invitarUsuario({ email: 'no-es-correo', nombre: 'Ana', rol: 'reclutador' })).toBeRejectedWithError(/correo válido/);
    await expectAsync(invitarUsuario({ email: 'ana@aquachile.cl', nombre: '  ', rol: 'reclutador' })).toBeRejectedWithError(/nombre/);
    await expectAsync(invitarUsuario({ email: 'ana@aquachile.cl', nombre: 'Ana', rol: 'admin' })).toBeRejectedWithError(/reclutador u operaciones/);
    expect(invoke).not.toHaveBeenCalled();
  });

  it('invita enviando los datos limpios a la Edge Function y devuelve el perfil.', async () => {
    const invoke = spyOn(supabase.functions, 'invoke').and.resolveTo({ data: { ok: true, perfil }, error: null });

    const resultado = await invitarUsuario({ email: ' ana@aquachile.cl ', nombre: ' Ana Rojas ', rol: 'reclutador' });

    expect(resultado).toEqual(perfil);
    expect(invoke).toHaveBeenCalledWith('admin-usuarios', {
      body: { accion: 'invitar', email: 'ana@aquachile.cl', nombre: 'Ana Rojas', rol: 'reclutador' }
    });
  });

  it('muestra el mensaje que entrega la función cuando responde con error HTTP.', async () => {
    const error = { message: 'Edge Function returned a non-2xx status code', context: { json: () => Promise.resolve({ error: 'Debe quedar al menos un administrador activo.' }) } };
    spyOn(supabase.functions, 'invoke').and.resolveTo({ data: null, error });

    await expectAsync(cambiarEstadoUsuario('u1', 'inactivo')).toBeRejectedWithError('Debe quedar al menos un administrador activo.');
  });

  it('cambia el estado con la acción cambiar_estado y rechaza estados desconocidos.', async () => {
    const invoke = spyOn(supabase.functions, 'invoke').and.resolveTo({ data: { ok: true, perfil: { ...perfil, estado: 'ausente' } }, error: null });

    const resultado = await cambiarEstadoUsuario('u1', 'ausente');

    expect(resultado.estado).toBe('ausente');
    expect(invoke).toHaveBeenCalledWith('admin-usuarios', { body: { accion: 'cambiar_estado', id: 'u1', estado: 'ausente' } });
    await expectAsync(cambiarEstadoUsuario('u1', 'borrado')).toBeRejectedWithError(/Estado no válido/);
  });
});
