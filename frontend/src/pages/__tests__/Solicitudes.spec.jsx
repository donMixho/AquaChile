import { cleanup, fireEvent, screen } from '@testing-library/react';
import Solicitudes from '../Solicitudes';
import { candidatosFixture, renderConRouter, simularConsulta } from '../../test/helpers';

describe('Solicitudes', () => {
  afterEach(cleanup);

  it('7. Renderiza una fila por cada candidato recibido del servicio.', async () => {
    simularConsulta({ data: candidatosFixture });
    const { container } = renderConRouter(<Solicitudes />);

    await screen.findByText('María José Silva');
    expect(container.querySelectorAll('tbody tr').length).toBe(3);
  });

  it('8. Filtra las solicitudes por familia de cargo.', async () => {
    simularConsulta({ data: candidatosFixture });
    const { container } = renderConRouter(<Solicitudes />);
    await screen.findByText('María José Silva');

    fireEvent.change(screen.getByLabelText('Filtrar por familia de cargo'), {
      target: { value: 'Producción' }
    });

    expect(container.querySelectorAll('tbody tr').length).toBe(1);
    expect(screen.getByText('María José Silva')).toBeTruthy();
    expect(screen.queryByText('Juan Pérez González')).toBeNull();
  });

  it('9. Filtra por rango de fechas y el botón Limpiar restablece el listado.', async () => {
    simularConsulta({ data: candidatosFixture });
    const { container } = renderConRouter(<Solicitudes />);
    await screen.findByText('María José Silva');

    fireEvent.change(screen.getByLabelText('Desde'), { target: { value: '2026-09-24' } });
    expect(container.querySelectorAll('tbody tr').length).toBe(1);
    expect(screen.getByText('Carlos Valenzuela')).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'Limpiar' }));
    expect(container.querySelectorAll('tbody tr').length).toBe(3);
  });

  it('10. Informa cuando ningún candidato coincide con los filtros.', async () => {
    simularConsulta({ data: candidatosFixture });
    renderConRouter(<Solicitudes />);
    await screen.findByText('María José Silva');

    fireEvent.change(screen.getByLabelText('Desde'), { target: { value: '2027-01-01' } });

    expect(screen.getByText('Ninguna solicitud coincide con los filtros.')).toBeTruthy();
  });

  it('11. El botón Nueva Solicitud navega a /solicitudes/nueva.', async () => {
    simularConsulta({ data: [] });
    renderConRouter(<Solicitudes />, { ruta: '/solicitudes' });

    fireEvent.click(screen.getByRole('button', { name: '+ Nueva Solicitud' }));

    expect(screen.getByTestId('ruta').textContent).toBe('/solicitudes/nueva');
  });

  it('12. Muestra el error cuando falla la carga de candidatos.', async () => {
    simularConsulta({ error: new Error('timeout') });
    renderConRouter(<Solicitudes />);

    expect((await screen.findByRole('alert')).textContent).toContain('timeout');
  });
});
