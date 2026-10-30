import { cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider, obtenerRol } from '../AuthContext';
import ProtectedRoute from '../../components/ProtectedRoute';
import { PERMISOS } from '../permisos';
import { supabase } from '../../services/supabaseClient';

const sesionDe = (email, app_metadata = {}, user_metadata = {}) => ({
  user: { email, app_metadata, user_metadata }
});

// Misma estructura de permisos que App.jsx, con un contenido identificable por ruta.
const ir = (ruta, sesion) => {
  spyOn(supabase.auth, 'getSession').and.returnValue(Promise.resolve({ data: { session: sesion } }));
  const protegida = (permiso, path, texto) => (
    <Route element={<ProtectedRoute permiso={permiso} />}>
      <Route path={path} element={<p>{texto}</p>} />
    </Route>
  );

  return render(
    <MemoryRouter initialEntries={[ruta]}>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<p>pantalla-login</p>} />
          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<p>pantalla-inicio</p>} />
          </Route>
          {protegida(PERMISOS.VER_SOLICITUDES, '/solicitudes', 'pantalla-solicitudes')}
          {protegida(PERMISOS.CREAR_CANDIDATO, '/candidatos/nuevo', 'pantalla-nuevo-candidato')}
          {protegida(PERMISOS.EVALUAR, '/solicitudes/:id/evaluar', 'pantalla-evaluar')}
          {protegida(PERMISOS.ELIMINAR_CANDIDATO, '/admin/eliminar', 'pantalla-eliminar')}
          {protegida(PERMISOS.CONFIGURACION, '/admin/configuracion', 'pantalla-configuracion')}
        </Routes>
      </AuthProvider>
    </MemoryRouter>
  );
};

const RECLUTADOR = 'reclutador@aquachile.cl';

describe('Rol del correo reclutador@aquachile.cl', () => {
  afterEach(cleanup);

  it('67. Se resuelve como reclutador por correo, sin importar mayúsculas ni espacios.', () => {
    expect(obtenerRol({ email: RECLUTADOR, app_metadata: {} })).toBe('reclutador');
    expect(obtenerRol({ email: '  Reclutador@AquaChile.CL ', app_metadata: {} })).toBe('reclutador');
  });

  it('68. app_metadata.rol tiene prioridad sobre el correo.', () => {
    expect(obtenerRol({ email: RECLUTADOR, app_metadata: { rol: 'admin' } })).toBe('admin');
    expect(obtenerRol({ email: 'otro@aquachile.cl', app_metadata: { rol: 'reclutador' } })).toBe('reclutador');
  });

  it('69. No se otorga el rol por coincidencias parciales del correo ni por user_metadata.', () => {
    expect(obtenerRol({ email: 'reclutador@gmail.com', app_metadata: {} })).toBeNull();
    expect(obtenerRol({ email: 'xreclutador@aquachile.cl', app_metadata: {} })).toBeNull();
    expect(obtenerRol({ email: 'reclutador@aquachile.cl.falso.com', app_metadata: {} })).toBeNull();
    // user_metadata lo edita el propio usuario: no sirve para asignar roles.
    expect(obtenerRol({ email: 'x@y.cl', app_metadata: {}, user_metadata: { rol: 'admin' } })).toBeNull();
  });

  [
    ['Inicio', '/', 'pantalla-inicio'],
    ['Solicitudes', '/solicitudes', 'pantalla-solicitudes'],
    ['Nuevo Candidato', '/candidatos/nuevo', 'pantalla-nuevo-candidato'],
    ['Evaluar Candidato', '/solicitudes/7/evaluar', 'pantalla-evaluar']
  ].forEach(([nombre, ruta, texto], i) => {
    it(`${70 + i}. Con sesión real del reclutador accede a ${nombre}.`, async () => {
      ir(ruta, sesionDe(RECLUTADOR));
      expect(await screen.findByText(texto)).toBeTruthy();
    });
  });

  [
    ['Eliminar', '/admin/eliminar', 'pantalla-eliminar'],
    ['Configuración', '/admin/configuracion', 'pantalla-configuracion']
  ].forEach(([nombre, ruta, texto], i) => {
    it(`${74 + i}. Escribir la URL de ${nombre} lo devuelve al inicio.`, async () => {
      ir(ruta, sesionDe(RECLUTADOR));
      expect(await screen.findByText('pantalla-inicio')).toBeTruthy();
      expect(screen.queryByText(texto)).toBeNull();
    });
  });

  it('76. El administrador sí accede a las rutas exclusivas.', async () => {
    ir('/admin/eliminar', sesionDe('admin@aquachile.cl'));
    expect(await screen.findByText('pantalla-eliminar')).toBeTruthy();
  });

  it('77. Sin sesión cualquier ruta redirige a /login.', async () => {
    ir('/candidatos/nuevo', null);
    expect(await screen.findByText('pantalla-login')).toBeTruthy();
  });
});
