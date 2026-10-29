import { cleanup, fireEvent, screen } from '@testing-library/react';
import Candidatos from '../Candidatos';
import { candidatosFixture, renderConRouter, simularConsulta } from '../../test/helpers';

describe('Candidatos', () => {
  afterEach(cleanup);

  it('19. Renderiza el listado completo de candidatos sin errores.', async () => {
    simularConsulta({ data: candidatosFixture });
    const { container } = renderConRouter(<Candidatos />);

    await screen.findByText('Carlos Valenzuela');
    expect(container.querySelectorAll('tbody tr').length).toBe(3);
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('20. Muestra el enlace al CV solo si el candidato lo tiene.', async () => {
    simularConsulta({ data: candidatosFixture });
    const { container } = renderConRouter(<Candidatos />);

    await screen.findByText('Carlos Valenzuela');
    expect(container.querySelectorAll('a[href="https://example.com/cv-juan.pdf"]').length).toBe(1);
  });

  it('21. Muestra el error cuando el servicio de datos no responde.', async () => {
    simularConsulta({ error: new Error('servicio caído') });
    renderConRouter(<Candidatos />);

    expect((await screen.findByRole('alert')).textContent).toContain('servicio caído');
  });

  const abrirEdicion = async () => {
    simularConsulta({ data: candidatosFixture });
    const vista = renderConRouter(<Candidatos />);
    await screen.findByText('Carlos Valenzuela');
    fireEvent.click(screen.getAllByRole('button', { name: /^Editar candidato/ })[0]);
    return vista;
  };

  it('33. Rechaza un correo con formato inválido al editar un candidato.', async () => {
    const { container } = await abrirEdicion();

    fireEvent.change(container.querySelector('input[type="email"]'), { target: { value: 'sin-arroba' } });
    fireEvent.submit(screen.getByRole('button', { name: 'Guardar Cambios' }).closest('form'));

    expect(screen.getByText(/formato de correo válido/)).toBeTruthy();
  });

  it('34. El campo de correo elimina automáticamente los espacios en blanco.', async () => {
    const { container } = await abrirEdicion();
    const correo = container.querySelector('input[type="email"]');

    fireEvent.change(correo, { target: { value: 'a b@c.cl' } });

    expect(correo.value).toBe('ab@c.cl');
  });

  it('35. Guarda la edición con un correo válido y avisa al usuario.', async () => {
    const { container } = await abrirEdicion();

    fireEvent.change(container.querySelector('input[type="email"]'), { target: { value: 'nuevo@aquachile.cl' } });
    fireEvent.submit(screen.getByRole('button', { name: 'Guardar Cambios' }).closest('form'));

    expect(screen.getByText(/actualizados con éxito/)).toBeTruthy();
    expect(screen.getByText('nuevo@aquachile.cl')).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Guardar Cambios' })).toBeNull();
  });

  it('36. Cancelar cierra el modal de edición sin cambios.', async () => {
    await abrirEdicion();

    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }));

    expect(screen.queryByRole('button', { name: 'Guardar Cambios' })).toBeNull();
  });
});
