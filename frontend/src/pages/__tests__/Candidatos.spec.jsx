import { cleanup, fireEvent, screen } from '@testing-library/react';
import Candidatos from '../Candidatos';
import { AuthContext } from '../../context/AuthContext';
import {
  candidatosFixture, conRol, renderConRouter, simularConsulta, simularUpdate
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

  it('20b. Muestra "Carpeta Drive" en nueva pestaña solo si hay drive_folder_url.', async () => {
    simularConsulta({
      data: [{ ...candidatosFixture[0], drive_folder_url: 'https://drive.google.com/f1' }, candidatosFixture[1]]
    });
    renderConRouter(<Candidatos />);

    await screen.findByText('Juan Pérez González');
    const enlaces = screen.getAllByText('Carpeta Drive');
    expect(enlaces.length).toBe(1);
    expect(enlaces[0].getAttribute('href')).toBe('https://drive.google.com/f1');
    expect(enlaces[0].getAttribute('target')).toBe('_blank');
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


describe('Candidatos: entrevistar', () => {
  afterEach(cleanup);

  it('63. Quien está pendiente se entrevista desde un enlace directo a la entrevista.', async () => {
    simularConsulta({ data: candidatosFixture });
    renderConRouter(<Candidatos />);
    await screen.findByText('Carlos Valenzuela');

    const enlace = screen.getByRole('link', { name: 'Entrevistar a Juan Pérez González' });
    expect(enlace.getAttribute('href')).toBe('/entrevista/1');
    // Ya no existe el paso aparte de "solicitar evaluación": empezar la entrevista pone al candidato en proceso.
    expect(screen.queryByRole('button', { name: /Solicitar evaluación/ })).toBeNull();
  });

  it('64. Quien ya está en proceso ofrece continuar la entrevista.', async () => {
    simularConsulta({ data: [{ ...candidatosFixture[0], estado: 'En proceso' }, candidatosFixture[1]] });
    renderConRouter(<Candidatos />);
    await screen.findByText('María José Silva');

    expect(screen.getByRole('link', { name: 'Continuar la entrevista de Juan Pérez González' })).toBeTruthy();
  });

  it('65. Quien ya fue evaluado (Apto o No apto) no ofrece entrevistar.', async () => {
    simularConsulta({
      data: [
        { ...candidatosFixture[0], estado: 'Apto' },
        { ...candidatosFixture[1], estado: 'No apto' },
        candidatosFixture[2]
      ]
    });
    renderConRouter(<Candidatos />);
    await screen.findByText('Carlos Valenzuela');

    const entrevistas = screen.queryAllByRole('link', { name: /^(Entrevistar a|Continuar la entrevista de)/ });
    expect(entrevistas.map((e) => e.getAttribute('aria-label'))).toEqual(['Entrevistar a Carlos Valenzuela']);
  });

  it('66. La papelera ya no está en esta tabla: eliminar es del admin, desde Seguimiento.', async () => {
    simularConsulta({ data: candidatosFixture });
    renderConRouter(conRol(<Candidatos />, 'admin'));
    await screen.findByText('Carlos Valenzuela');

    expect(screen.queryAllByRole('button', { name: /^Eliminar candidato/ }).length).toBe(0);
  });
});

describe('Candidatos: mis candidatos (reclutador)', () => {
  afterEach(cleanup);

  const lista = [
    { ...candidatosFixture[0], reclutador_id: 'yo' },
    { ...candidatosFixture[1], reclutador_id: 'otra' },
    { ...candidatosFixture[2], reclutador_id: null }
  ];

  const ver = () => {
    simularConsulta({ data: lista });
    return renderConRouter(
      <AuthContext.Provider value={{ user: { id: 'yo' }, rol: 'reclutador', loading: false, signOut() {} }}>
        <Candidatos />
      </AuthContext.Provider>
    );
  };

  it('parte mostrando solo a sus candidatos.', async () => {
    ver();

    expect(await screen.findByText('Juan Pérez González')).toBeTruthy();
    expect(screen.queryByText('María José Silva')).toBeNull();
    expect(screen.queryByText('Carlos Valenzuela')).toBeNull();
    expect(screen.getByRole('button', { name: 'Mis candidatos' }).getAttribute('aria-pressed')).toBe('true');
  });

  it('"Todos" muestra el resto, por ejemplo para revisar si alguien ya está registrado.', async () => {
    ver();
    await screen.findByText('Juan Pérez González');

    fireEvent.click(screen.getByRole('button', { name: 'Todos' }));

    expect(screen.getByText('María José Silva')).toBeTruthy();
    expect(screen.getByText('Carlos Valenzuela')).toBeTruthy();
  });
});
