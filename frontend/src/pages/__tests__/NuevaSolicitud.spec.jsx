import { cleanup, fireEvent, screen, waitFor } from '@testing-library/react';
import NuevaSolicitud from '../NuevaSolicitud';
import { conRol, renderConRouter } from '../../test/helpers';
import { supabase } from '../../services/supabaseClient';

const llenar = () => {
  fireEvent.change(screen.getByLabelText('Título'), { target: { value: 'Turno noche' } });
  fireEvent.change(screen.getByLabelText('Cargo'), { target: { value: 'Operario' } });
  fireEvent.change(screen.getByLabelText('Familia de Cargo'), { target: { value: 'Operaciones' } });
};
const enviar = () =>
  fireEvent.submit(screen.getByRole('button', { name: /Crear Solicitud|Guardando/ }).closest('form'));

describe('NuevaSolicitud', () => {
  afterEach(cleanup);

  it('68. Guarda en Supabase, muestra "Guardando..." y vuelve al listado.', async () => {
    let resolver;
    const insert = jasmine.createSpy('insert').and.returnValue({
      select: () => ({ single: () => new Promise((r) => { resolver = r; }) })
    });
    spyOn(supabase, 'from').and.returnValue({ insert });
    renderConRouter(conRol(<NuevaSolicitud />, 'reclutador'), { ruta: '/solicitudes/nueva' });

    llenar();
    enviar();

    const boton = await screen.findByRole('button', { name: 'Guardando...' });
    expect(boton.disabled).toBe(true);
    resolver({ data: { id: 5 }, error: null });
    expect((await screen.findByRole('status')).textContent).toContain('creada exitosamente');
    expect(screen.getByRole('button', { name: /Crear Solicitud|Guardando/ }).disabled).toBe(true);
    await waitFor(() => {
      if (screen.getByTestId('ruta').textContent !== '/solicitudes') throw new Error('aún no redirige');
    }, { timeout: 3000 });
    expect(insert).toHaveBeenCalledTimes(1);
  });

  it('69. Si la base falla muestra el error y permite reintentar sin salir.', async () => {
    spyOn(supabase, 'from').and.returnValue({
      insert: () => ({ select: () => ({ single: () => Promise.resolve({ data: null, error: { message: 'RLS' } }) }) })
    });
    renderConRouter(conRol(<NuevaSolicitud />, 'reclutador'), { ruta: '/solicitudes/nueva' });

    llenar();
    enviar();

    expect((await screen.findByRole('alert')).textContent).toContain('No se pudo crear la solicitud: RLS');
    expect(screen.getByTestId('ruta').textContent).toBe('/solicitudes/nueva');
    expect(screen.getByRole('button', { name: 'Crear Solicitud' }).disabled).toBe(false);
  });
});
