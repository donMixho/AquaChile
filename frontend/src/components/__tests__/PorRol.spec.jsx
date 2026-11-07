import { cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { AEntrevista, CandidatosPorRol, LayoutPorRol } from '../PorRol';
import { conRol } from '../../test/helpers';

const montar = (ui, rol, ruta) =>
  render(conRol(<MemoryRouter initialEntries={[ruta]}>{ui}</MemoryRouter>, rol));

describe('Estructura por rol', () => {
  afterEach(cleanup);

  it('el admin usa la navegación lateral y los demás roles el menú superior.', () => {
    const rutas = <Routes><Route path="/" element={<LayoutPorRol />} /></Routes>;

    montar(rutas, 'admin', '/');
    expect(screen.getByRole('complementary', { name: 'Panel de administración' })).toBeTruthy();
    cleanup();

    montar(rutas, 'reclutador', '/');
    expect(screen.queryByRole('complementary', { name: 'Panel de administración' })).toBeNull();
    expect(screen.getByRole('navigation', { name: 'Navegación principal', hidden: true })).toBeTruthy();
  });

  it('el admin que entra a /candidatos es llevado a Seguimiento.', () => {
    montar(
      <Routes>
        <Route path="/candidatos" element={<CandidatosPorRol />} />
        <Route path="/seguimiento" element={<p>vista-seguimiento</p>} />
      </Routes>,
      'admin',
      '/candidatos'
    );

    expect(screen.getByText('vista-seguimiento')).toBeTruthy();
  });

  it('la ruta antigua de evaluación lleva a la entrevista del mismo candidato.', () => {
    montar(
      <Routes>
        <Route path="/solicitudes/:id/evaluar" element={<AEntrevista />} />
        <Route path="/entrevista/:id" element={<p>entrevista-7</p>} />
      </Routes>,
      'reclutador',
      '/solicitudes/7/evaluar'
    );

    expect(screen.getByText('entrevista-7')).toBeTruthy();
  });
});
