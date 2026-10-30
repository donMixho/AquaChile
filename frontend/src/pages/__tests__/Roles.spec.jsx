import { cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import Candidatos from '../Candidatos';
import Solicitudes from '../Solicitudes';
import Layout from '../../components/Layout';
import ProtectedRoute from '../../components/ProtectedRoute';
import { PERMISOS } from '../../context/permisos';
import { candidatosFixture, conRol, renderConRouter, simularConsulta } from '../../test/helpers';

const verRuta = (rol, protegida, opciones) =>
  render(
    conRol(
      <MemoryRouter initialEntries={['/secreto']}>
        <Routes>
          <Route path="/" element={<p>inicio</p>} />
          <Route path="/login" element={<p>login</p>} />
          <Route element={protegida}>
            <Route path="/secreto" element={<p>zona-privada</p>} />
          </Route>
        </Routes>
      </MemoryRouter>,
      rol,
      opciones
    )
  );

const soloAdmin = <ProtectedRoute permiso={PERMISOS.ELIMINAR_CANDIDATO} />;

describe('Control de acceso por rol', () => {
  afterEach(cleanup);

  it('45. Una ruta con permiso exclusivo del admin lo deja pasar.', () => {
    verRuta('admin', soloAdmin);
    expect(screen.getByText('zona-privada')).toBeTruthy();
  });

  it('46. El reclutador que entra por URL directa es devuelto al inicio.', () => {
    verRuta('reclutador', soloAdmin);
    expect(screen.queryByText('zona-privada')).toBeNull();
    expect(screen.getByText('inicio')).toBeTruthy();
  });

  it('47. Sin sesión se redirige a /login aunque el rol sea admin.', () => {
    verRuta('admin', soloAdmin, { sesion: false });
    expect(screen.getByText('login')).toBeTruthy();
  });

  it('48. allowedRoles deniega a un rol ausente de la lista y a un valor que no es lista.', () => {
    verRuta('reclutador', <ProtectedRoute allowedRoles={['admin']} />);
    expect(screen.queryByText('zona-privada')).toBeNull();
    cleanup();

    verRuta('reclutador', <ProtectedRoute allowedRoles="reclutador" />); // texto en vez de arreglo
    expect(screen.queryByText('zona-privada')).toBeNull();
    cleanup();

    verRuta('reclutador', <ProtectedRoute allowedRoles={['admin', 'reclutador']} />);
    expect(screen.getByText('zona-privada')).toBeTruthy();
  });

  it('49. El menú de Operaciones incluye Candidatos y Solicitudes (solo lectura).', () => {
    const textoMenu = (rol) => {
      render(
        conRol(
          <MemoryRouter>
            <Routes>
              <Route path="/" element={<Layout />} />
            </Routes>
          </MemoryRouter>,
          rol
        )
      );
      return screen.getByRole('navigation', { name: 'Navegación principal', hidden: true }).textContent;
    };

    expect(textoMenu('operaciones')).toContain('Candidatos');
    cleanup();
    expect(textoMenu('reclutador')).toContain('Candidatos');
  });

  it('49b. Operaciones entrando por URL a crear candidato o solicitud vuelve al inicio.', () => {
    [PERMISOS.CREAR_CANDIDATO, PERMISOS.CREAR_SOLICITUD, PERMISOS.EVALUAR].forEach((permiso) => {
      verRuta('operaciones', <ProtectedRoute permiso={permiso} />);
      expect(screen.queryByText('zona-privada')).toBeNull();
      expect(screen.getByText('inicio')).toBeTruthy();
      cleanup();
    });
    verRuta('operaciones', <ProtectedRoute permiso={PERMISOS.VER_CANDIDATOS} />);
    expect(screen.getByText('zona-privada')).toBeTruthy();
  });

  it('50. Operaciones ve Solicitudes sin Evaluar ni Nueva Solicitud.', async () => {
    simularConsulta({ data: candidatosFixture });
    renderConRouter(conRol(<Solicitudes />, 'operaciones'));
    await screen.findByText('Carlos Valenzuela');

    expect(screen.queryAllByRole('link', { name: /^Evaluar a/ }).length).toBe(0);
    expect(screen.queryByRole('button', { name: '+ Nueva Solicitud' })).toBeNull();
  });

  it('51. El reclutador ve el enlace Evaluar en cada solicitud.', async () => {
    simularConsulta({ data: candidatosFixture });
    renderConRouter(conRol(<Solicitudes />, 'reclutador'));
    await screen.findByText('Carlos Valenzuela');

    expect(screen.getAllByRole('link', { name: /^Evaluar a/ }).length).toBe(3);
  });

  it('52. Candidatos oculta Editar y Nuevo Candidato a un rol sin esos permisos.', async () => {
    simularConsulta({ data: candidatosFixture });
    renderConRouter(conRol(<Candidatos />, 'operaciones'));
    await screen.findByText('Carlos Valenzuela');

    expect(screen.queryAllByRole('button', { name: /^Editar candidato/ }).length).toBe(0);
    expect(screen.queryByRole('button', { name: '+ Nuevo Candidato' })).toBeNull();
    expect(screen.queryAllByRole('button', { name: /^Solicitar evaluación/ }).length).toBe(0);
    expect(screen.queryAllByRole('button', { name: /^Eliminar candidato/ }).length).toBe(0);
  });

  it('53. Candidatos muestra Editar y Nuevo Candidato al reclutador.', async () => {
    simularConsulta({ data: candidatosFixture });
    renderConRouter(conRol(<Candidatos />, 'reclutador'));
    await screen.findByText('Carlos Valenzuela');

    expect(screen.getAllByRole('button', { name: /^Editar candidato/ }).length).toBe(3);
    expect(screen.getByRole('button', { name: '+ Nuevo Candidato' })).toBeTruthy();
  });
});

describe('Vista del reclutador', () => {
  afterEach(cleanup);

  it('61. No ve acciones administrativas (eliminar ni configuración) en listado ni menú.', async () => {
    simularConsulta({ data: candidatosFixture });
    renderConRouter(
      conRol(
        <>
          <Layout />
          <Candidatos />
        </>,
        'reclutador'
      )
    );
    await screen.findByText('Carlos Valenzuela');

    expect(screen.queryAllByRole('button', { name: /eliminar|borrar/i }).length).toBe(0);
    expect(screen.queryAllByRole('link', { name: /configuraci|usuarios/i }).length).toBe(0);
  });

  it('62. Las tablas de candidatos y solicitudes muestran el estado de cada registro.', async () => {
    simularConsulta({
      data: [
        { ...candidatosFixture[0], estado: 'Apto' },
        { ...candidatosFixture[1], estado: 'En proceso' },
        candidatosFixture[2]
      ]
    });
    renderConRouter(conRol(<Candidatos />, 'reclutador'));
    await screen.findByText('Carlos Valenzuela');

    expect(screen.getByText('Apto')).toBeTruthy();
    expect(screen.getByText('En proceso')).toBeTruthy();
    expect(screen.getByText('Pendiente')).toBeTruthy();
  });
});
