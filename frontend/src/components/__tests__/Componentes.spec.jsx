import { cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import MetricCard from '../MetricCard';
import Alerta from '../Alerta';

describe('Componentes reutilizables (props)', () => {
  afterEach(cleanup);

  it('26. MetricCard muestra título, valor y enlace recibidos por props.', () => {
    render(
      <MemoryRouter>
        <MetricCard titulo="TOTAL" valor={7} to="/solicitudes" detalle="candidatos" />
      </MemoryRouter>
    );

    expect(screen.getByText('TOTAL')).toBeTruthy();
    expect(screen.getByRole('heading', { name: '7' })).toBeTruthy();
    expect(screen.getByText('candidatos')).toBeTruthy();
    expect(screen.getByRole('link').getAttribute('href')).toBe('/solicitudes');
  });

  it('27. MetricCard omite el detalle cuando no se entrega.', () => {
    const { container } = render(
      <MemoryRouter>
        <MetricCard titulo="X" valor={1} to="/" />
      </MemoryRouter>
    );

    expect(container.querySelectorAll('p').length).toBe(1);
  });

  it('28. Alerta usa role alert para errores y status para éxito.', () => {
    const { rerender } = render(<Alerta tipo="error">Falló</Alerta>);
    expect(screen.getByRole('alert').textContent).toBe('Falló');

    rerender(<Alerta tipo="exito">Listo</Alerta>);
    expect(screen.getByRole('status').textContent).toBe('Listo');
  });
});
