import { MemoryRouter, Routes, Route, useLocation } from 'react-router-dom';
import { render } from '@testing-library/react';
import { supabase } from '../services/supabaseClient';

export const candidatosFixture = [
  {
    id: 1,
    nombre_completo: 'Juan Pérez González',
    rut: '12345678-5',
    cargo: 'Analista de Reclutamiento',
    familia_cargo: 'Operaciones',
    email: 'juan@aquachile.cl',
    cv_url: 'https://example.com/cv-juan.pdf',
    created_at: '2026-09-20T12:00:00Z'
  },
  {
    id: 2,
    nombre_completo: 'María José Silva',
    rut: '98765432-1',
    cargo: 'Jefe de Turno Planta',
    familia_cargo: 'Producción',
    email: 'maria@aquachile.cl',
    cv_url: null,
    created_at: '2026-09-18T12:00:00Z'
  },
  {
    id: 3,
    nombre_completo: 'Carlos Valenzuela',
    rut: '11222333-4',
    cargo: 'Técnico en Mantención',
    familia_cargo: 'Operaciones',
    email: 'carlos@aquachile.cl',
    cv_url: null,
    created_at: '2026-09-25T12:00:00Z'
  }
];

// Simula la cadena supabase.from('candidatos').select('*').order(...)
export const simularConsulta = ({ data = null, error = null } = {}) =>
  spyOn(supabase, 'from').and.returnValue({
    select: () => ({ order: () => Promise.resolve({ data, error }) })
  });

const MostrarRuta = () => <span data-testid="ruta">{useLocation().pathname}</span>;

// Renderiza un componente dentro de un router en memoria y expone la ruta actual.
export const renderConRouter = (ui, { ruta = '/' } = {}) =>
  render(
    <MemoryRouter initialEntries={[ruta]}>
      <Routes>
        <Route path="/solicitudes/:id/evaluar" element={ui} />
        <Route path="*" element={ui} />
      </Routes>
      <MostrarRuta />
    </MemoryRouter>
  );
