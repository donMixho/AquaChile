import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import BotonIcono from '../BotonIcono';
import { IconoEditar, IconoEliminar, IconoVer } from '../Iconos';

describe('BotonIcono', () => {
  afterEach(cleanup);

  it('37. Es un botón con nombre accesible, tooltip e icono decorativo.', () => {
    const alHacerClic = jasmine.createSpy('clic');
    render(<BotonIcono icono={IconoEditar} etiqueta="Editar candidato Ana" tono="azul" onClick={alHacerClic} />);

    const boton = screen.getByRole('button', { name: 'Editar candidato Ana' });
    expect(boton.getAttribute('title')).toBe('Editar candidato Ana');
    expect(boton.querySelector('svg').getAttribute('aria-hidden')).toBe('true');
    expect(boton.className).toContain('hover:bg-blue-50');

    fireEvent.click(boton);
    expect(alHacerClic).toHaveBeenCalledTimes(1);
  });

  it('38. La acción de eliminar usa tono rojo.', () => {
    render(<BotonIcono icono={IconoEliminar} etiqueta="Eliminar candidato Ana" tono="rojo" />);

    expect(screen.getByRole('button', { name: 'Eliminar candidato Ana' }).className).toContain('hover:bg-red-50');
  });

  it('39. Con `to` se comporta como enlace interno y con `href` abre en pestaña nueva.', () => {
    render(
      <MemoryRouter>
        <BotonIcono icono={IconoVer} etiqueta="Ver detalle" to="/solicitudes/1" />
        <BotonIcono icono={IconoVer} etiqueta="Ver CV" href="https://example.com/cv.pdf" />
      </MemoryRouter>
    );

    expect(screen.getByRole('link', { name: 'Ver detalle' }).getAttribute('href')).toBe('/solicitudes/1');
    const externo = screen.getByRole('link', { name: 'Ver CV' });
    expect(externo.getAttribute('target')).toBe('_blank');
    expect(externo.getAttribute('rel')).toContain('noopener');
  });
});
