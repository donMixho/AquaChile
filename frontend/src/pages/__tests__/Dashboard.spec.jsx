import { cleanup, screen, waitFor, waitForElementToBeRemoved } from '@testing-library/react';
import Dashboard from '../Dashboard';
import { candidatosFixture, renderConRouter, simularConsulta } from '../../test/helpers';

describe('Dashboard', () => {
  afterEach(cleanup);

  it('1. Renderiza el título del panel de control.', async () => {
    simularConsulta({ data: [] });
    renderConRouter(<Dashboard />);

    expect(
      screen.getByRole('heading', { name: 'Panel de Control - Reclutamiento & Selección' })
    ).toBeTruthy();
    await waitFor(() => screen.getByText('Total de Solicitudes'));
  });

  it('2. Muestra "..." en el total mientras se consulta el servicio.', async () => {
    simularConsulta({ data: candidatosFixture });
    renderConRouter(<Dashboard />);

    expect(screen.getByRole('heading', { level: 2, name: '...' })).toBeTruthy();
    await waitForElementToBeRemoved(() => screen.queryByRole('heading', { level: 2, name: '...' }));
  });

  it('3. Calcula el total de solicitudes y las métricas por familia desde el mock.', async () => {
    simularConsulta({ data: candidatosFixture });
    renderConRouter(<Dashboard />);

    expect(await screen.findByRole('heading', { level: 2, name: '3' })).toBeTruthy();
    expect(screen.getByRole('heading', { level: 2, name: '2' })).toBeTruthy(); // Operaciones
    expect(screen.getByText('Producción', { selector: 'p' })).toBeTruthy();
    expect(screen.getByText('candidato')).toBeTruthy(); // singular para Producción
  });

  it('4. No muestra la tabla de candidatos recientes.', async () => {
    simularConsulta({ data: candidatosFixture });
    const { container } = renderConRouter(<Dashboard />);

    await screen.findByText('Total de Solicitudes');
    expect(container.querySelector('table')).toBeNull();
  });

  it('5. Muestra un mensaje de error cuando el servicio falla.', async () => {
    simularConsulta({ error: new Error('sin conexión') });
    renderConRouter(<Dashboard />);

    const alerta = await screen.findByRole('alert');
    expect(alerta.textContent).toContain('No se pudieron cargar los candidatos: sin conexión');
  });

  it('6. Las tarjetas de métricas enlazan a Solicitudes.', async () => {
    simularConsulta({ data: candidatosFixture });
    renderConRouter(<Dashboard />);

    const enlace = (await screen.findByText('Total de Solicitudes')).closest('a');
    expect(enlace.getAttribute('href')).toBe('/solicitudes');
  });
});
