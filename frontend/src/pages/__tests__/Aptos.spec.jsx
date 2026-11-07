import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Aptos from '../Aptos';
import { candidatosFixture, conRol, esperar } from '../../test/helpers';
import { supabase } from '../../services/supabaseClient';
import { decidirCandidato } from '../../services/candidatosService';
import { tienePermiso } from '../../context/permisos';

const base = [
  { ...candidatosFixture[0], estado: 'Apto', solicitud_id: 7, decision_operaciones: null, motivo_decision: null, decidido_en: null },
  { ...candidatosFixture[1], estado: 'Apto', decision_operaciones: 'Seleccionado', motivo_decision: null, decidido_en: '2026-11-05T12:00:00Z' },
  { ...candidatosFixture[2], estado: 'Pendiente', decision_operaciones: null }
];

const entrevista = {
  candidato_id: 1,
  modalidad: 'Presencial',
  lugar: 'Oficina Puerto Montt',
  respuestas: { estudios: 'Técnico acuícola', renta: '850000', comunicacion: 4, equipo: 5, adaptacion: 3 },
  observaciones: 'Muy buena disposición a turnos.'
};

const simular = ({ candidatos = base } = {}) => {
  const update = jasmine.createSpy('update').and.callFake((valores) => ({
    eq: (_columna, id) => ({
      select: () => ({
        single: () => Promise.resolve({ data: { ...candidatos.find((c) => c.id === id), ...valores }, error: null })
      })
    })
  }));
  spyOn(supabase, 'from').and.callFake((tabla) => {
    if (tabla === 'candidatos') {
      return { select: () => ({ order: () => Promise.resolve({ data: candidatos, error: null }) }), update };
    }
    if (tabla === 'evaluaciones') {
      return { select: () => ({ in: () => Promise.resolve({ data: [entrevista], error: null }) }) };
    }
    return { select: () => ({ order: () => Promise.resolve({ data: [{ id: 7, titulo: 'Turno noche' }], error: null }) }) };
  });
  return update;
};

const ver = (rol = 'operaciones') => render(conRol(<MemoryRouter><Aptos /></MemoryRouter>, rol));

describe('Operaciones: aptos por decidir', () => {
  afterEach(cleanup);

  it('Operaciones puede decidir; reclutador y admin según su permiso.', () => {
    expect(tienePermiso('operaciones', 'decidir_aptos')).toBe(true);
    expect(tienePermiso('reclutador', 'decidir_aptos')).toBe(false);
  });

  it('separa los aptos que esperan decisión de los ya decididos y oculta a los no aptos.', async () => {
    simular();
    ver();

    expect(await screen.findByText('Juan Pérez González')).toBeTruthy();
    expect(screen.getByText('1 candidato espera tu decisión.')).toBeTruthy();
    expect(screen.getByText('María José Silva')).toBeTruthy();
    expect(screen.queryByText('Carlos Valenzuela')).toBeNull();
    expect(screen.getByRole('button', { name: 'Reconsiderar a María José Silva' })).toBeTruthy();
  });

  it('muestra el resumen de la entrevista al abrirla.', async () => {
    simular();
    ver();
    await screen.findByText('Juan Pérez González');

    fireEvent.click(screen.getByRole('button', { name: 'Ver la entrevista de Juan Pérez González' }));

    expect(await screen.findByText('Técnico acuícola')).toBeTruthy();
    expect(screen.getByText('$850.000')).toBeTruthy();
    expect(screen.getByText('Muy buena disposición a turnos.')).toBeTruthy();
    expect(screen.getByText('Oficina Puerto Montt')).toBeTruthy();
    expect(screen.getByText(/Comunicación 4 · Trabajo en equipo 5 · Adaptación 3/)).toBeTruthy();
  });

  it('selecciona con un clic y pasa al candidato a "Ya decididos".', async () => {
    const update = simular();
    ver();
    await screen.findByText('Juan Pérez González');

    fireEvent.click(screen.getByRole('button', { name: 'Seleccionar a Juan Pérez González' }));

    await esperar(() => update.calls.any());
    expect(update).toHaveBeenCalledWith({ decision_operaciones: 'Seleccionado', motivo_decision: null });
    expect(await screen.findByText('Juan Pérez González: seleccionado.')).toBeTruthy();
    expect(screen.getByText('No hay candidatos esperando tu decisión.')).toBeTruthy();
  });

  it('descartar exige un motivo antes de confirmar.', async () => {
    const update = simular();
    ver();
    await screen.findByText('Juan Pérez González');

    fireEvent.click(screen.getByRole('button', { name: 'Descartar a Juan Pérez González' }));
    const confirmar = screen.getByRole('button', { name: 'Confirmar descarte' });
    expect(confirmar.disabled).toBe(true);

    fireEvent.change(screen.getByLabelText('Motivo del descarte'), { target: { value: 'No acepta turnos de noche.' } });
    expect(confirmar.disabled).toBe(false);
    fireEvent.click(confirmar);

    await esperar(() => update.calls.any());
    expect(update).toHaveBeenCalledWith({ decision_operaciones: 'Descartado', motivo_decision: 'No acepta turnos de noche.' });
  });

  it('reconsiderar deja la decisión otra vez sin definir.', async () => {
    const update = simular();
    ver();
    await screen.findByText('María José Silva');

    fireEvent.click(screen.getByRole('button', { name: 'Reconsiderar a María José Silva' }));

    await esperar(() => update.calls.any());
    expect(update).toHaveBeenCalledWith({ decision_operaciones: null, motivo_decision: null });
  });

  it('sin la migración de decisión avisa y no ofrece botones de decidir.', async () => {
    simular({
      candidatos: base.map((c) => {
        const sinDecision = { ...c };
        delete sinDecision.decision_operaciones;
        return sinDecision;
      })
    });
    ver();

    expect(await screen.findByText(/migracion_decision_operaciones\.sql/)).toBeTruthy();
    expect(screen.queryByRole('button', { name: /^Seleccionar a/ })).toBeNull();
  });

  it('un rol sin permiso de decidir ve la lista sin botones.', async () => {
    simular();
    ver('reclutador');
    await screen.findByText('Juan Pérez González');

    expect(screen.queryByRole('button', { name: /^Seleccionar a/ })).toBeNull();
    expect(screen.queryByRole('button', { name: /^Descartar a/ })).toBeNull();
  });
});

describe('decidirCandidato', () => {
  const simularUpdate = () => {
    const update = jasmine.createSpy('update').and.callFake((valores) => ({
      eq: () => ({ select: () => ({ single: () => Promise.resolve({ data: { id: 1, ...valores }, error: null }) }) })
    }));
    spyOn(supabase, 'from').and.returnValue({ update });
    return update;
  };

  it('rechaza una decisión desconocida y un descarte sin motivo, sin tocar la base.', async () => {
    const update = simularUpdate();

    await expectAsync(decidirCandidato(1, 'Quizás')).toBeRejectedWithError(/Decisión no válida/);
    await expectAsync(decidirCandidato(1, 'Descartado', '   ')).toBeRejectedWithError(/motivo del descarte/);
    expect(update).not.toHaveBeenCalled();
  });

  it('seleccionar no guarda motivo; descartar lo guarda sin espacios sobrantes.', async () => {
    const update = simularUpdate();

    await decidirCandidato(1, 'Seleccionado', 'texto ignorado');
    expect(update).toHaveBeenCalledWith({ decision_operaciones: 'Seleccionado', motivo_decision: null });

    await decidirCandidato(1, 'Descartado', '  Sin disponibilidad  ');
    expect(update).toHaveBeenCalledWith({ decision_operaciones: 'Descartado', motivo_decision: 'Sin disponibilidad' });
  });

  it('avisa qué archivo ejecutar si la columna aún no existe.', async () => {
    spyOn(supabase, 'from').and.returnValue({
      update: () => ({
        eq: () => ({
          select: () => ({
            single: () => Promise.resolve({
              data: null,
              error: { code: 'PGRST204', message: "Could not find the 'decision_operaciones' column of 'candidatos' in the schema cache" }
            })
          })
        })
      })
    });

    await expectAsync(decidirCandidato(1, 'Seleccionado')).toBeRejectedWithError(/migracion_decision_operaciones\.sql/);
  });
});
