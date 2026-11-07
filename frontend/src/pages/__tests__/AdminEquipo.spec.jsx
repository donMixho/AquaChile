import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import AdminEquipo from '../AdminEquipo';
import AdminLayout from '../../components/AdminLayout';
import { AuthContext } from '../../context/AuthContext';
import { PERMISOS, ROLES, tienePermiso } from '../../context/permisos';
import { supabase } from '../../services/supabaseClient';
import { esperar } from '../../test/helpers';

const equipo = [
  { id: 'yo', nombre: 'Jefa Gestión', email: 'admin@aquachile.cl', rol: 'admin', estado: 'activo' },
  { id: 'u1', nombre: 'Ana Rojas', email: 'ana@aquachile.cl', rol: 'reclutador', estado: 'activo' },
  { id: 'u2', nombre: 'Luis Soto', email: 'luis@aquachile.cl', rol: 'operaciones', estado: 'inactivo' }
];

const simularEquipo = (datos = equipo) =>
  spyOn(supabase, 'from').and.returnValue({
    select: () => ({ order: () => Promise.resolve({ data: datos, error: null }) })
  });

const renderEquipo = () =>
  render(
    <AuthContext.Provider value={{ user: { id: 'yo', email: 'admin@aquachile.cl' }, rol: 'admin', loading: false, signOut() {} }}>
      <MemoryRouter>
        <AdminEquipo />
      </MemoryRouter>
    </AuthContext.Provider>
  );

describe('Admin: equipo y accesos', () => {
  afterEach(cleanup);

  it('GESTIONAR_EQUIPO es exclusivo del administrador.', () => {
    expect(tienePermiso(ROLES.ADMIN, PERMISOS.GESTIONAR_EQUIPO)).toBe(true);
    expect(tienePermiso(ROLES.RECLUTADOR, PERMISOS.GESTIONAR_EQUIPO)).toBe(false);
    expect(tienePermiso(ROLES.OPERACIONES, PERMISOS.GESTIONAR_EQUIPO)).toBe(false);
  });

  it('lista al equipo con su rol y estado, y marca la propia cuenta sin selector.', async () => {
    simularEquipo();
    renderEquipo();

    expect(await screen.findByText('Ana Rojas')).toBeTruthy();
    expect(screen.getByText('Luis Soto')).toBeTruthy();
    expect(screen.getByText('Tu cuenta')).toBeTruthy();
    expect(screen.queryByLabelText('Estado de Jefa Gestión')).toBeNull();
    expect(screen.getByLabelText('Estado de Ana Rojas').value).toBe('activo');
    expect(screen.getByText(/2 activos · 0 ausentes · 1 inactivo$/)).toBeTruthy();
  });

  it('muestra el error cuando no se puede leer el equipo.', async () => {
    spyOn(supabase, 'from').and.returnValue({
      select: () => ({ order: () => Promise.resolve({ data: null, error: new Error('tabla inexistente') }) })
    });
    renderEquipo();

    expect((await screen.findByRole('alert')).textContent).toContain('tabla inexistente');
  });

  it('revocar el acceso pide confirmación en la fila y solo entonces llama a la función.', async () => {
    simularEquipo();
    const invoke = spyOn(supabase.functions, 'invoke').and.resolveTo({
      data: { ok: true, perfil: { ...equipo[1], estado: 'inactivo' } },
      error: null
    });
    renderEquipo();
    await screen.findByText('Ana Rojas');

    fireEvent.change(screen.getByLabelText('Estado de Ana Rojas'), { target: { value: 'inactivo' } });
    expect(invoke).not.toHaveBeenCalled();
    expect(screen.getByText(/Revocar el acceso de Ana Rojas/)).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'Sí, revocar' }));

    await esperar(() => invoke.calls.any());
    expect(invoke).toHaveBeenCalledWith('admin-usuarios', {
      body: { accion: 'cambiar_estado', id: 'u1', estado: 'inactivo' }
    });
    expect((await screen.findByRole('status')).textContent).toContain('ya no puede iniciar sesión');
  });

  it('cancelar la revocación no cambia nada.', async () => {
    simularEquipo();
    const invoke = spyOn(supabase.functions, 'invoke');
    renderEquipo();
    await screen.findByText('Ana Rojas');

    fireEvent.change(screen.getByLabelText('Estado de Ana Rojas'), { target: { value: 'inactivo' } });
    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }));

    expect(invoke).not.toHaveBeenCalled();
    expect(screen.getByLabelText('Estado de Ana Rojas').value).toBe('activo');
  });

  it('pasar a ausente se aplica de inmediato, sin confirmación.', async () => {
    simularEquipo();
    const invoke = spyOn(supabase.functions, 'invoke').and.resolveTo({
      data: { ok: true, perfil: { ...equipo[1], estado: 'ausente' } },
      error: null
    });
    renderEquipo();
    await screen.findByText('Ana Rojas');

    fireEvent.change(screen.getByLabelText('Estado de Ana Rojas'), { target: { value: 'ausente' } });

    await esperar(() => invoke.calls.any());
    expect((await screen.findByRole('status')).textContent).toContain('ausente');
  });

  it('invita a una persona nueva y la agrega a la lista.', async () => {
    simularEquipo();
    const nueva = { id: 'u3', nombre: 'Pía Díaz', email: 'pia@aquachile.cl', rol: 'operaciones', estado: 'activo' };
    const invoke = spyOn(supabase.functions, 'invoke').and.resolveTo({ data: { ok: true, perfil: nueva }, error: null });
    renderEquipo();
    await screen.findByText('Ana Rojas');

    fireEvent.click(screen.getByRole('button', { name: /Invitar persona/ }));
    fireEvent.change(screen.getByLabelText('Nombre completo'), { target: { value: 'Pía Díaz' } });
    fireEvent.change(screen.getByLabelText('Correo'), { target: { value: 'pia@aquachile.cl' } });
    fireEvent.change(screen.getByLabelText('Rol'), { target: { value: 'operaciones' } });
    fireEvent.click(screen.getByRole('button', { name: 'Enviar invitación' }));

    await esperar(() => invoke.calls.any());
    expect(invoke).toHaveBeenCalledWith('admin-usuarios', {
      body: { accion: 'invitar', email: 'pia@aquachile.cl', nombre: 'Pía Díaz', rol: 'operaciones' }
    });
    expect(await screen.findByText('Pía Díaz')).toBeTruthy();
    expect(screen.getByRole('status').textContent).toContain('pia@aquachile.cl');
  });

  it('muestra el error de la invitación sin cerrar el formulario.', async () => {
    simularEquipo();
    spyOn(supabase.functions, 'invoke').and.resolveTo({ data: { error: 'Ese correo ya está registrado.' }, error: null });
    renderEquipo();
    await screen.findByText('Ana Rojas');

    fireEvent.click(screen.getByRole('button', { name: /Invitar persona/ }));
    fireEvent.change(screen.getByLabelText('Nombre completo'), { target: { value: 'Ana Rojas' } });
    fireEvent.change(screen.getByLabelText('Correo'), { target: { value: 'ana@aquachile.cl' } });
    fireEvent.click(screen.getByRole('button', { name: 'Enviar invitación' }));

    expect((await screen.findByText('Ese correo ya está registrado.'))).toBeTruthy();
    expect(screen.getByLabelText('Nombre completo')).toBeTruthy();
  });
});

describe('Admin: estructura lateral', () => {
  afterEach(cleanup);

  it('muestra navegación lateral con Equipo y accesos y el rol de la sesión.', () => {
    render(
      <AuthContext.Provider value={{ user: { id: 'yo', email: 'admin@aquachile.cl' }, rol: 'admin', loading: false, signOut() {} }}>
        <MemoryRouter>
          <AdminLayout />
        </MemoryRouter>
      </AuthContext.Provider>
    );

    expect(screen.getByRole('complementary', { name: 'Panel de administración' })).toBeTruthy();
    ['Resumen', 'Seguimiento', 'Equipo y accesos'].forEach((nombre) =>
      expect(screen.getByRole('link', { name: nombre })).toBeTruthy()
    );
    // El trabajo operativo es del reclutador: no aparece en el menú del admin.
    expect(screen.queryByRole('link', { name: 'Solicitudes' })).toBeNull();
    expect(screen.queryByRole('link', { name: 'Candidatos' })).toBeNull();
    expect(screen.getByTestId('rol-actual').textContent).toBe('Administrador');
    expect(screen.getByRole('button', { name: 'Cerrar sesión' })).toBeTruthy();
  });
});
