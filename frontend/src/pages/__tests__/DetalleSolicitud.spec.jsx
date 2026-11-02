import { cleanup, screen } from '@testing-library/react';
import { Route, Routes } from 'react-router-dom';
import DetalleSolicitud from '../DetalleSolicitud';
import { conRol, renderConRouter } from '../../test/helpers';
import { supabase } from '../../services/supabaseClient';

const simular = (resultado) =>
  spyOn(supabase, 'from').and.returnValue({
    select: () => ({ eq: () => ({ maybeSingle: () => Promise.resolve(resultado) }) })
  });

const vista = () => renderConRouter(
  <Routes><Route path="/solicitudes/:id" element={<DetalleSolicitud />} /></Routes>,
  { ruta: '/solicitudes/1' }
);

describe('DetalleSolicitud', () => {
  afterEach(cleanup);

  it('70. Muestra "Cargando solicitud..." y luego los datos desde Supabase.', async () => {
    simular({
      data: {
        id: 1, titulo: 'Turno noche', cargo: 'Operario', familia_cargo: 'Operaciones',
        vacantes: 3, estado: 'Abierta', descripcion: 'Tres operarios'
      },
      error: null
    });
    vista();

    expect(screen.getByText('Cargando solicitud...')).toBeTruthy();
    expect(await screen.findByRole('heading', { name: 'Turno noche' })).toBeTruthy();
    expect(screen.getByText('Tres operarios')).toBeTruthy();
    expect(screen.queryByText('Cargando solicitud...')).toBeNull();
  });

  it('73. Muestra botones con texto claro; Evaluar candidatos solo si el rol puede evaluar.', async () => {
    simular({ data: { id: 1, titulo: 'Turno noche' }, error: null });
    renderConRouter(conRol(
      <Routes><Route path="/solicitudes/:id" element={<DetalleSolicitud />} /></Routes>, 'operaciones'
    ), { ruta: '/solicitudes/1' });
    await screen.findByRole('heading', { name: 'Turno noche' });

    expect(screen.getByRole('link', { name: /Volver al listado/ }).getAttribute('href')).toBe('/solicitudes');
    expect(screen.queryByRole('link', { name: /Evaluar candidatos/ })).toBeNull();
  });

  it('73b. El reclutador ve el botón Evaluar candidatos.', async () => {
    simular({ data: { id: 1, titulo: 'Turno noche' }, error: null });
    renderConRouter(conRol(
      <Routes><Route path="/solicitudes/:id" element={<DetalleSolicitud />} /></Routes>, 'reclutador'
    ), { ruta: '/solicitudes/1' });
    expect(await screen.findByRole('link', { name: /Evaluar candidatos/ })).toBeTruthy();
  });

  it('71. Informa cuando la solicitud no existe.', async () => {
    simular({ data: null, error: null });
    vista();

    expect((await screen.findByRole('status')).textContent).toContain('no existe');
  });

  it('72. Muestra el error si falla la consulta.', async () => {
    simular({ data: null, error: { message: 'sin red' } });
    vista();

    expect((await screen.findByRole('alert')).textContent).toContain('sin red');
  });
});
