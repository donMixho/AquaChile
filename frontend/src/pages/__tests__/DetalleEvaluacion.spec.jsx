import { cleanup, fireEvent, screen, waitFor } from '@testing-library/react';
import DetalleEvaluacion from '../DetalleEvaluacion';
import { candidatosFixture, renderConRouter } from '../../test/helpers';
import { supabase } from '../../services/supabaseClient';

// Simula supabase.from('candidatos'): select().eq().single() carga el candidato
// y update().eq().select().single() guarda el estado.
const simularCandidato = ({ errorCarga = null, errorGuardado = null } = {}) => {
  const update = jasmine.createSpy('update').and.callFake((valores) => ({
    eq: () => ({
      select: () => ({
        single: () =>
          Promise.resolve(
            errorGuardado
              ? { data: null, error: errorGuardado }
              : { data: { ...candidatosFixture[0], ...valores }, error: null }
          )
      })
    })
  }));
  spyOn(supabase, 'from').and.returnValue({
    select: () => ({
      eq: () => ({
        single: () =>
          Promise.resolve(errorCarga ? { data: null, error: errorCarga } : { data: candidatosFixture[0], error: null })
      })
    }),
    update
  });
  return update;
};

const renderEvaluacion = async (opciones) => {
  const update = simularCandidato(opciones);
  renderConRouter(<DetalleEvaluacion />, { ruta: '/solicitudes/1/evaluar' });
  if (!opciones?.errorCarga) await screen.findByText('Juan Pérez González', { exact: false });
  return update;
};

const llenarFormulario = () => {
  fireEvent.change(screen.getByLabelText('Fecha de Evaluación:'), { target: { value: '2026-10-01' } });
  fireEvent.change(screen.getByLabelText('Observaciones y Conclusiones:'), {
    target: { value: 'Buen desempeño en la prueba.' }
  });
};

describe('DetalleEvaluacion', () => {
  afterEach(cleanup);

  it('13. Renderiza los datos reales del candidato y el formulario.', async () => {
    await renderEvaluacion();

    expect(screen.getByText('Detalle de Evaluación Psicolaboral')).toBeTruthy();
    expect(screen.getByText('Analista de Reclutamiento', { exact: false })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Guardar Evaluación' })).toBeTruthy();
  });

  it('14. Valida los campos requeridos antes de guardar.', async () => {
    const update = await renderEvaluacion();
    fireEvent.click(screen.getByRole('button', { name: 'Guardar Evaluación' }));

    expect(screen.getByRole('alert').textContent).toContain('selecciona una fecha');
    expect(screen.queryByText('¡Evaluación guardada exitosamente!', { exact: false })).toBeNull();
    expect(update).not.toHaveBeenCalled();
  });

  it('15. Rechaza observaciones compuestas solo por espacios.', async () => {
    const update = await renderEvaluacion();
    fireEvent.change(screen.getByLabelText('Fecha de Evaluación:'), { target: { value: '2026-10-01' } });
    fireEvent.change(screen.getByLabelText('Observaciones y Conclusiones:'), { target: { value: '   ' } });
    fireEvent.click(screen.getByRole('button', { name: 'Guardar Evaluación' }));

    expect(screen.getByRole('alert')).toBeTruthy();
    expect(update).not.toHaveBeenCalled();
  });

  it('16. Guarda el estado en Supabase, informa el éxito y vuelve al listado.', async () => {
    const update = await renderEvaluacion();
    fireEvent.change(screen.getByLabelText('Estado de la Evaluación:'), { target: { value: 'Apto' } });
    llenarFormulario();
    fireEvent.click(screen.getByRole('button', { name: 'Guardar Evaluación' }));

    expect((await screen.findByRole('status')).textContent).toContain('guardada exitosamente');
    expect(update).toHaveBeenCalledWith({ estado: 'Apto' });
    expect(screen.queryByRole('alert')).toBeNull();

    // Jasmine no lanza en expect, así que la espera debe lanzar para reintentar.
    await waitFor(
      () => {
        if (screen.getByTestId('ruta').textContent !== '/solicitudes') throw new Error('aún sin redirigir');
      },
      { timeout: 3000 }
    );
  });

  it('17. Permite elegir entre En proceso, Apto y No apto.', async () => {
    await renderEvaluacion();
    const select = screen.getByLabelText('Estado de la Evaluación:');
    expect(select.value).toBe('En proceso');

    fireEvent.change(select, { target: { value: 'No apto' } });

    expect(select.value).toBe('No apto');
  });

  it('18. El botón Volver al listado redirige a /solicitudes.', async () => {
    await renderEvaluacion();
    fireEvent.click(screen.getByRole('button', { name: 'Volver al listado' }));

    expect(screen.getByTestId('ruta').textContent).toBe('/solicitudes');
  });

  it('19. Muestra el error de Supabase si falla el guardado y no redirige.', async () => {
    await renderEvaluacion({ errorGuardado: new Error('permiso denegado') });
    llenarFormulario();
    fireEvent.click(screen.getByRole('button', { name: 'Guardar Evaluación' }));

    expect((await screen.findByRole('alert')).textContent).toContain('No se pudo guardar la evaluación: permiso denegado');
    expect(screen.queryByRole('status')).toBeNull();
    expect(screen.getByTestId('ruta').textContent).toBe('/solicitudes/1/evaluar');
  });

  it('20. Deshabilita el botón mientras guarda.', async () => {
    const update = await renderEvaluacion();
    update.and.returnValue({ eq: () => ({ select: () => ({ single: () => new Promise(() => {}) }) }) });
    llenarFormulario();
    fireEvent.click(screen.getByRole('button', { name: 'Guardar Evaluación' }));

    const boton = await screen.findByRole('button', { name: 'Guardando...' });
    expect(boton.disabled).toBe(true);
  });

  it('21. Informa si no se pudo cargar el candidato.', async () => {
    await renderEvaluacion({ errorCarga: new Error('no existe') });

    expect((await screen.findByRole('alert')).textContent).toContain('No se pudo cargar el candidato: no existe');
    expect(screen.getByRole('button', { name: 'Guardar Evaluación' }).disabled).toBe(true);
  });
});
