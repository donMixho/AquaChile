import { cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import OperacionesLayout from '../OperacionesLayout';
import { conRol } from '../../test/helpers';

const montar = (Layout, rol) =>
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

const menu = () => screen.getByRole('navigation', { name: 'Navegación principal', hidden: true }).textContent;

describe('Estructura de Operaciones', () => {
  afterEach(cleanup);

  it('97. Operaciones ve solo Por decidir y Candidatos, sin botón de registro.', () => {
    montar(OperacionesLayout, 'operaciones');

    expect(menu()).toContain('Por decidir');
    expect(menu()).toContain('Candidatos');
    expect(menu()).not.toContain('Solicitudes');
    expect(screen.queryByRole('link', { name: '+ Nuevo candidato' })).toBeNull();
    expect(screen.getByTestId('rol-actual').textContent).toBe('Operaciones');
  });

  it('98. Permite cerrar sesión.', () => {
    [OperacionesLayout].forEach((Layout) => {
      render(
        <MemoryRouter>
          {conRol(<Routes><Route path="/" element={<Layout />} /></Routes>, 'reclutador')}
        </MemoryRouter>
      );
      expect(screen.getByRole('button', { name: 'Cerrar sesión' })).toBeTruthy();
      cleanup();
    });
  });
});
