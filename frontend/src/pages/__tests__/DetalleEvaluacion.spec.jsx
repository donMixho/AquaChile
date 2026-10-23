import { cleanup, fireEvent, screen } from '@testing-library/react';
import DetalleEvaluacion from '../DetalleEvaluacion';
import { renderConRouter } from '../../test/helpers';

describe('DetalleEvaluacion', () => {
  beforeEach(() => {
    spyOn(console, 'log'); // evita ruido del console.log del componente
    renderConRouter(<DetalleEvaluacion />, { ruta: '/solicitudes/1/evaluar' });
  });
  afterEach(cleanup);

  const llenarFormulario = () => {
    fireEvent.change(screen.getByLabelText('Fecha de Evaluación:'), { target: { value: '2026-10-01' } });
    fireEvent.change(screen.getByLabelText('Observaciones y Conclusiones:'), {
      target: { value: 'Buen desempeño en la prueba.' }
    });
  };

  it('13. Renderiza los datos del candidato y el formulario.', () => {
    expect(screen.getByText('Detalle de Evaluación Psicolaboral')).toBeTruthy();
    expect(screen.getByText('Juan Pérez González', { exact: false })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Guardar Evaluación' })).toBeTruthy();
  });

  it('14. Valida los campos requeridos antes de guardar.', () => {
    fireEvent.click(screen.getByRole('button', { name: 'Guardar Evaluación' }));

    expect(screen.getByRole('alert').textContent).toContain('selecciona una fecha');
    expect(screen.queryByText('¡Evaluación guardada exitosamente!')).toBeNull();
  });

  it('15. Rechaza observaciones compuestas solo por espacios.', () => {
    fireEvent.change(screen.getByLabelText('Fecha de Evaluación:'), { target: { value: '2026-10-01' } });
    fireEvent.change(screen.getByLabelText('Observaciones y Conclusiones:'), { target: { value: '   ' } });
    fireEvent.click(screen.getByRole('button', { name: 'Guardar Evaluación' }));

    expect(screen.getByRole('alert')).toBeTruthy();
  });

  it('16. Muestra el mensaje de éxito al completar el formulario.', () => {
    llenarFormulario();
    fireEvent.click(screen.getByRole('button', { name: 'Guardar Evaluación' }));

    expect(screen.getByRole('status').textContent).toContain('guardada exitosamente');
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('17. Permite alternar el estado entre En proceso y Finalizada.', () => {
    const select = screen.getByLabelText('Estado de la Evaluación:');
    expect(select.value).toBe('En proceso');

    fireEvent.change(select, { target: { value: 'Finalizada' } });

    expect(select.value).toBe('Finalizada');
  });

  it('18. El botón Volver al listado redirige a /solicitudes.', () => {
    fireEvent.click(screen.getByRole('button', { name: 'Volver al listado' }));

    expect(screen.getByTestId('ruta').textContent).toBe('/solicitudes');
  });
});
