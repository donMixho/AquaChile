import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from '../../context/AuthContext';
import ProtectedRoute from '../../components/ProtectedRoute';
import Login from '../Login';
import { supabase } from '../../services/supabaseClient';

const sesionDe = (email, app_metadata = {}) => ({ user: { email, app_metadata } });

const renderApp = (ruta, { sesion = null } = {}) => {
  spyOn(supabase.auth, 'getSession').and.returnValue(Promise.resolve({ data: { session: sesion } }));
  return render(
    <MemoryRouter initialEntries={[ruta]}>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<p>home</p>} />
          </Route>
          <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
            <Route path="/admin" element={<p>zona-admin</p>} />
          </Route>
        </Routes>
      </AuthProvider>
    </MemoryRouter>
  );
};

describe('Autenticación', () => {
  afterEach(cleanup);

  it('26. Sin sesión, una ruta protegida redirige a /login.', async () => {
    renderApp('/');
    expect(await screen.findByRole('heading', { name: 'Iniciar sesión' })).toBeTruthy();
  });

  it('27. Con sesión, entra a la ruta protegida.', async () => {
    renderApp('/', { sesion: sesionDe('x@aquachile.cl') });
    expect(await screen.findByText('home')).toBeTruthy();
  });

  it('28. Un rol no permitido es redirigido al inicio.', async () => {
    renderApp('/admin', { sesion: sesionDe('reclutador@aquachile.cl') });
    expect(await screen.findByText('home')).toBeTruthy();
    expect(screen.queryByText('zona-admin')).toBeNull();
  });

  it('29. El rol se deduce del correo si no hay metadatos.', async () => {
    renderApp('/admin', { sesion: sesionDe('admin@aquachile.cl') });
    expect(await screen.findByText('zona-admin')).toBeTruthy();
  });

  it('30. Credenciales inválidas muestran un error claro.', async () => {
    renderApp('/login');
    spyOn(supabase.auth, 'signInWithPassword').and.returnValue(
      Promise.reject({ status: 400, message: 'Invalid login credentials' })
    );
    fireEvent.change(await screen.findByLabelText('Correo electrónico'), { target: { value: 'a@b.cl' } });
    fireEvent.change(screen.getByLabelText('Contraseña'), { target: { value: 'mala' } });
    fireEvent.click(screen.getByRole('button', { name: 'Ingresar' }));

    const alerta = await screen.findByRole('alert');
    expect(alerta.textContent).toContain('incorrectos');
  });

  it('31. Un error de red se informa distinto a uno de credenciales.', async () => {
    renderApp('/login');
    spyOn(supabase.auth, 'signInWithPassword').and.returnValue(
      Promise.reject({ status: 0, message: 'Failed to fetch' })
    );
    fireEvent.change(await screen.findByLabelText('Correo electrónico'), { target: { value: 'a@b.cl' } });
    fireEvent.change(screen.getByLabelText('Contraseña'), { target: { value: 'x' } });
    fireEvent.click(screen.getByRole('button', { name: 'Ingresar' }));

    await waitFor(() => expect(screen.getByRole('alert').textContent).toContain('conectar'));
  });
});
