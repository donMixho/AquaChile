import { cleanup, fireEvent, screen } from '@testing-library/react';
import Candidatos from '../Candidatos';
import {
  candidatosFixture, conRol, renderConRouter, simularConsulta, simularDelete, simularUpdate
} from '../../test/helpers';

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

  const abrirEdicion = async (opcionesUpdate) => {
    const update = simularUpdate(opcionesUpdate);
    simularConsulta({ data: candidatosFixture, update });
    const vista = renderConRouter(<Candidatos />);
    await screen.findByText('Carlos Valenzuela');
    fireEvent.click(screen.getAllByRole('button', { name: /^Editar candidato/ })[0]);
    return { ...vista, update };
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

  it('35. Guarda la edición en Supabase, actualiza la lista y avisa al usuario.', async () => {
    const { container, update } = await abrirEdicion();

    fireEvent.change(container.querySelector('input[type="email"]'), { target: { value: 'nuevo@aquachile.cl' } });
    fireEvent.submit(screen.getByRole('button', { name: 'Guardar Cambios' }).closest('form'));

    expect(await screen.findByText(/actualizados con éxito/)).toBeTruthy();
    expect(update).toHaveBeenCalledWith({
      nombre_completo: 'Juan Pérez González',
      cargo: 'Analista de Reclutamiento',
      email: 'nuevo@aquachile.cl'
    });
    expect(screen.getByText('nuevo@aquachile.cl')).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Guardar Cambios' })).toBeNull();
  });

  it('37. Si Supabase rechaza el cambio muestra el error, deja abierto el modal y no toca la lista.', async () => {
    const { container } = await abrirEdicion({ error: new Error('permission denied for table candidatos') });

    fireEvent.change(container.querySelector('input[type="email"]'), { target: { value: 'nuevo@aquachile.cl' } });
    fireEvent.submit(screen.getByRole('button', { name: 'Guardar Cambios' }).closest('form'));

    const alerta = await screen.findByRole('alert');
    expect(alerta.textContent).toContain('No se pudieron guardar los cambios: permission denied');
    expect(screen.queryByText(/actualizados con éxito/)).toBeNull();
    expect(screen.getByRole('button', { name: 'Guardar Cambios' })).toBeTruthy();
    expect(screen.queryByText('nuevo@aquachile.cl', { selector: 'td' })).toBeNull();
    expect(screen.getByText('juan@aquachile.cl')).toBeTruthy();
  });

  it('38. Mientras guarda muestra "Guardando..." y bloquea los botones.', async () => {
    await abrirEdicion({ pendiente: true });

    fireEvent.submit(screen.getByRole('button', { name: 'Guardar Cambios' }).closest('form'));

    const guardando = await screen.findByRole('button', { name: 'Guardando...' });
    expect(guardando.disabled).toBe(true);
    expect(screen.getByRole('button', { name: 'Cancelar' }).disabled).toBe(true);
  });

  it('36. Cancelar cierra el modal de edición sin cambios.', async () => {
    await abrirEdicion();

    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }));

    expect(screen.queryByRole('button', { name: 'Guardar Cambios' })).toBeNull();
  });
});

describe('Candidatos: solicitar evaluación', () => {
  afterEach(cleanup);

  const abrirSolicitud = async (opcionesUpdate, data = candidatosFixture) => {
    const update = simularUpdate(opcionesUpdate);
    simularConsulta({ data, update });
    renderConRouter(<Candidatos />);
    await screen.findByText('Carlos Valenzuela');
    fireEvent.click(screen.getByRole('button', { name: 'Solicitar evaluación de Juan Pérez González' }));
    return update;
  };

  it('63. Confirmar guarda el estado En proceso en Supabase y actualiza la insignia.', async () => {
    const update = await abrirSolicitud();
    expect(screen.queryByText('En proceso', { selector: 'span' })).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: 'Confirmar y Derivar' }));

    expect(await screen.findByText(/Evaluación solicitada para Juan Pérez González/)).toBeTruthy();
    expect(update).toHaveBeenCalledWith({ estado: 'En proceso' });
    expect(screen.getByText('En proceso', { selector: 'span' })).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Confirmar y Derivar' })).toBeNull();
    // Ya no se puede volver a solicitar para el mismo candidato.
    const boton = screen.getByRole('button', { name: 'Evaluación ya solicitada (En proceso)' });
    expect(boton.disabled).toBe(true);
  });

  it('64. Si Supabase falla muestra el error, mantiene el modal y no cambia la insignia.', async () => {
    await abrirSolicitud({ error: new Error('permission denied') });

    fireEvent.click(screen.getByRole('button', { name: 'Confirmar y Derivar' }));

    const alerta = await screen.findByRole('alert');
    expect(alerta.textContent).toContain('No se pudo solicitar la evaluación: permission denied');
    expect(screen.queryByText(/Evaluación solicitada para/)).toBeNull();
    expect(screen.getByRole('button', { name: 'Confirmar y Derivar' })).toBeTruthy();
    expect(screen.queryByText('En proceso', { selector: 'span' })).toBeNull();
  });

  it('65. Mientras guarda muestra "Solicitando..." y bloquea los botones.', async () => {
    await abrirSolicitud({ pendiente: true });

    fireEvent.click(screen.getByRole('button', { name: 'Confirmar y Derivar' }));

    const solicitando = await screen.findByRole('button', { name: 'Solicitando...' });
    expect(solicitando.disabled).toBe(true);
    expect(screen.getByRole('button', { name: 'Cancelar' }).disabled).toBe(true);
  });

  it('66. No permite solicitar la evaluación de quien ya está en proceso o evaluado.', async () => {
    simularConsulta({
      data: [
        { ...candidatosFixture[0], estado: 'En proceso' },
        { ...candidatosFixture[1], estado: 'Apto' },
        candidatosFixture[2]
      ]
    });
    renderConRouter(<Candidatos />);
    await screen.findByText('Carlos Valenzuela');

    expect(screen.getByRole('button', { name: 'Evaluación ya solicitada (En proceso)' }).disabled).toBe(true);
    expect(screen.getByRole('button', { name: 'Evaluación ya solicitada (Apto)' }).disabled).toBe(true);
    expect(screen.getByRole('button', { name: 'Solicitar evaluación de Carlos Valenzuela' }).disabled).toBe(false);
  });
});

describe('Candidatos: eliminar (solo admin)', () => {
  afterEach(cleanup);

  const abrirEliminar = async (opcionesDelete, rol = 'admin') => {
    const borrar = simularDelete(opcionesDelete);
    simularConsulta({ data: candidatosFixture, borrar });
    renderConRouter(conRol(<Candidatos />, rol));
    await screen.findByText('Carlos Valenzuela');
    return borrar;
  };

  const pulsarPapelera = () =>
    fireEvent.click(screen.getByRole('button', { name: 'Eliminar candidato Juan Pérez González' }));

  it('67. El admin ve la papelera roja en cada fila.', async () => {
    await abrirEliminar();

    const boton = screen.getByRole('button', { name: 'Eliminar candidato Juan Pérez González' });
    expect(boton.className).toContain('hover:bg-red-50');
    expect(screen.getAllByRole('button', { name: /^Eliminar candidato/ }).length).toBe(3);
  });

  ['reclutador', 'operaciones'].forEach((rol) => {
    it(`67b. El rol ${rol} no ve la papelera.`, async () => {
      await abrirEliminar({}, rol);

      expect(screen.queryAllByRole('button', { name: /^Eliminar candidato/ }).length).toBe(0);
    });
  });

  it('68. La papelera abre un modal de confirmación sin borrar nada todavía.', async () => {
    const borrar = await abrirEliminar();

    pulsarPapelera();

    const dialogo = screen.getByRole('dialog');
    expect(dialogo.textContent).toContain('¿Estás seguro de que deseas eliminar a este candidato?');
    expect(dialogo.textContent).toContain('Juan Pérez González');
    expect(borrar).not.toHaveBeenCalled();
  });

  it('69. Cancelar cierra el modal sin eliminar.', async () => {
    const borrar = await abrirEliminar();
    pulsarPapelera();

    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }));

    expect(screen.queryByRole('dialog')).toBeNull();
    expect(borrar).not.toHaveBeenCalled();
    expect(screen.getByText('Juan Pérez González')).toBeTruthy();
  });

  it('70. Confirmar elimina en Supabase, quita la fila y avisa del éxito.', async () => {
    const borrar = await abrirEliminar();
    pulsarPapelera();

    fireEvent.click(screen.getByRole('button', { name: 'Sí, eliminar' }));

    expect(await screen.findByText(/Candidato Juan Pérez González eliminado/)).toBeTruthy();
    expect(borrar.eq).toHaveBeenCalledWith('id', 1);
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(screen.queryByText('Juan Pérez González', { selector: 'td' })).toBeNull();
    expect(screen.getByText('Carlos Valenzuela')).toBeTruthy();
  });

  it('71. Si la base no borra nada (RLS) muestra el error y conserva la fila.', async () => {
    await abrirEliminar({ filas: [] });
    pulsarPapelera();

    fireEvent.click(screen.getByRole('button', { name: 'Sí, eliminar' }));

    const alerta = await screen.findByRole('alert');
    expect(alerta.textContent).toContain('No se pudo eliminar el candidato: No se eliminó ningún registro');
    expect(screen.getByRole('dialog')).toBeTruthy();
    expect(screen.queryByText(/eliminado\./)).toBeNull();
    expect(screen.getByText('Juan Pérez González', { selector: 'td' })).toBeTruthy();
  });

  it('72. Mientras elimina muestra "Eliminando..." y bloquea los botones.', async () => {
    await abrirEliminar({ pendiente: true });
    pulsarPapelera();

    fireEvent.click(screen.getByRole('button', { name: 'Sí, eliminar' }));

    const eliminando = await screen.findByRole('button', { name: 'Eliminando...' });
    expect(eliminando.disabled).toBe(true);
    expect(screen.getByRole('button', { name: 'Cancelar' }).disabled).toBe(true);
  });
});
