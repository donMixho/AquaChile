import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import Layout from '../Layout';
import { conRol } from '../../test/helpers';

const renderLayout = (ruta = '/') =>
  render(
    <MemoryRouter initialEntries={[ruta]}>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<p>contenido-home</p>} />
          <Route path="solicitudes" element={<p>contenido-solicitudes</p>} />
        </Route>
      </Routes>
    </MemoryRouter>
  );

describe('Layout', () => {
  afterEach(cleanup);

  it('22. Renderiza la navegación principal y el contenido de la ruta.', () => {
    renderLayout();

    const nav = screen.getByRole('navigation', { name: 'Navegación principal', hidden: true });
    expect(nav.querySelectorAll('a').length).toBe(3);
    expect(nav.querySelector('a').textContent).toBe('Inicio');
    expect(screen.getByText('contenido-home')).toBeTruthy();
  });

  it('23. Marca como activo el enlace de la ruta actual.', () => {
    renderLayout('/solicitudes');

    const nav = screen.getByRole('navigation', { name: 'Navegación principal', hidden: true });
    expect(nav.querySelector('[aria-current="page"]').textContent).toBe('Solicitudes');
  });

  it('24. El botón hamburguesa abre y cierra el menú móvil.', () => {
    renderLayout();
    const boton = screen.getByRole('button', { name: 'Abrir menú' });
    expect(screen.queryByRole('navigation', { name: 'Navegación móvil', hidden: true })).toBeNull();

    fireEvent.click(boton);
    expect(screen.getByRole('navigation', { name: 'Navegación móvil', hidden: true })).toBeTruthy();
    expect(boton.getAttribute('aria-expanded')).toBe('true');

    fireEvent.click(boton);
    expect(screen.queryByRole('navigation', { name: 'Navegación móvil', hidden: true })).toBeNull();
  });

  it('25. Elegir un enlace del menú móvil lo cierra.', () => {
    renderLayout();
    fireEvent.click(screen.getByRole('button', { name: 'Abrir menú' }));

    const movil = screen.getByRole('navigation', { name: 'Navegación móvil', hidden: true });
    fireEvent.click(movil.querySelectorAll('a')[1]);

    expect(screen.queryByRole('navigation', { name: 'Navegación móvil', hidden: true })).toBeNull();
    expect(screen.getByText('contenido-solicitudes')).toBeTruthy();
  });

  [['admin', 'Administrador'], ['reclutador', 'Reclutador'], ['operaciones', 'Operaciones']].forEach(([rol, texto]) => {
    it(`73. Muestra el rol ${rol} con icono de usuario en el encabezado.`, () => {
      render(conRol(
        <MemoryRouter><Routes><Route path="/" element={<Layout />} /></Routes></MemoryRouter>, rol
      ));

      const insignia = screen.getByTestId('rol-actual');
      expect(insignia.textContent).toBe(texto);
      expect(insignia.querySelector('svg')).toBeTruthy();
    });
  });

  it('74. Sin sesión de rol no muestra insignia.', () => {
    renderLayout();

    expect(screen.queryByTestId('rol-actual')).toBeNull();
  });
});
