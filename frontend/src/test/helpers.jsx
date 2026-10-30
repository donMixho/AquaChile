import { MemoryRouter, Routes, Route, useLocation } from 'react-router-dom';
import { render } from '@testing-library/react';
import { supabase } from '../services/supabaseClient';
import { AuthContext } from '../context/AuthContext';

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
export const simularConsulta = ({ data = null, error = null, update, borrar } = {}) =>
  spyOn(supabase, 'from').and.returnValue({
    select: () => ({ order: () => Promise.resolve({ data, error }) }),
    ...(update && { update }),
    ...(borrar && { delete: borrar })
  });

// Simula supabase.from('candidatos').update(valores).eq(...).select().single().
// `error` hace fallar la respuesta; `pendiente` la deja sin resolver (para probar el estado de carga).
export const simularUpdate = ({ error = null, filaBase = candidatosFixture[0], pendiente = false } = {}) =>
  jasmine.createSpy('update').and.callFake((valores) => ({
    eq: () => ({
      select: () => ({
        single: () =>
          pendiente
            ? new Promise(() => {})
            : Promise.resolve(error ? { data: null, error } : { data: { ...filaBase, ...valores }, error: null })
      })
    })
  }));

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

// Simula una sesión con el rol indicado (admin, reclutador, operaciones o null = sin rol)
// para probar qué ve y a qué accede cada rol sin pasar por Supabase.
export const conRol = (ui, rol, { sesion = true } = {}) => (
  <AuthContext.Provider
    value={{ user: sesion ? { email: 'prueba@aquachile.cl' } : null, rol, loading: false, signOut: () => {} }}
  >
    {ui}
  </AuthContext.Provider>
);

// Simula supabase.from('candidatos').delete().eq(...).select('id').
// `filas` es lo que devuelve la base (vacío = RLS bloqueó sin dar error); `error` fuerza un fallo.
export const simularDelete = ({ error = null, filas = [{ id: 1 }], pendiente = false } = {}) => {
  const eq = jasmine.createSpy('eq').and.returnValue({
    select: () => (pendiente ? new Promise(() => {}) : Promise.resolve({ data: error ? null : filas, error }))
  });
  const borrar = jasmine.createSpy('delete').and.returnValue({ eq });
  borrar.eq = eq;
  return borrar;
};
