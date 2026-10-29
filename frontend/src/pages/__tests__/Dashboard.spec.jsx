import { cleanup, screen, waitFor, waitForElementToBeRemoved } from '@testing-library/react';
import Dashboard from '../Dashboard';
import { candidatosFixture, renderConRouter, simularConsulta } from '../../test/helpers';

describe('Dashboard', () => {
  afterEach(cleanup);

  it('1. Renderiza el título del panel de control.', async () => {
    simularConsulta({ data: [] });
    renderConRouter(<Dashboard />);

    expect(
      screen.getByRole('heading', { name: 'Resumen de Reclutamiento' })
    ).toBeTruthy();
    await waitFor(() => screen.getByText('Total de Solicitudes'));
  });

  it('2. Muestra "..." en el total mientras se consulta el servicio.', async () => {
    simularConsulta({ data: candidatosFixture });
    renderConRouter(<Dashboard />);

    expect(screen.getAllByRole('heading', { level: 2, name: '...' }).length).toBe(3);
    await waitForElementToBeRemoved(() => screen.queryAllByRole('heading', { level: 2, name: '...' })[0]);
  });

  it('3. Calcula el total y grafica los postulantes por familia de cargo.', async () => {
    simularConsulta({ data: candidatosFixture });
    renderConRouter(<Dashboard />);

    // Total de solicitudes y Pendientes (ningún candidato trae estado) valen 3.
    expect((await screen.findAllByRole('heading', { level: 2, name: '3' })).length).toBe(2);
    const valor = (nombre) => screen.getByRole('progressbar', { name: nombre }).getAttribute('aria-valuenow');
    expect(valor('Operaciones')).toBe('2');
    expect(valor('Producción')).toBe('1');
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

  it('7. Clasifica los registros por estado en el gráfico.', async () => {
    simularConsulta({
      data: [
        { ...candidatosFixture[0], estado: 'Finalizada', estado_resultado: 'Apto' },
        { ...candidatosFixture[1], estado: 'En proceso' },
        { ...candidatosFixture[2], estado_resultado: 'No apto' }
      ]
    });
    renderConRouter(<Dashboard />);

    await screen.findByRole('progressbar', { name: 'Apto' });
    const valor = (nombre) => screen.getByRole('progressbar', { name: nombre }).getAttribute('aria-valuenow');
    expect(valor('Apto')).toBe('1');
    expect(valor('En proceso')).toBe('1');
    expect(valor('No apto')).toBe('1');
    expect(valor('Pendiente')).toBe('0');
  });

  it('8. Sin candidatos muestra el mensaje vacío en ambos gráficos.', async () => {
    simularConsulta({ data: [] });
    renderConRouter(<Dashboard />);

    expect((await screen.findAllByText('Aún no hay candidatos registrados.')).length).toBe(2);
  });
});
