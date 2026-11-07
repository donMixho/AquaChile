import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import Entrevista from '../Entrevista';
import MiBandeja from '../MiBandeja';
import { AuthContext } from '../../context/AuthContext';
import { candidatosFixture, conRol, esperar } from '../../test/helpers';
import { supabase } from '../../services/supabaseClient';

const candidato = { ...candidatosFixture[0], estado: 'Pendiente', solicitud_id: 7, telefono: '+56911112222' };

// Simula las tablas que toca la pantalla: candidatos, evaluaciones y solicitudes.
const simular = ({ evaluacion = null, base = candidato } = {}) => {
  const upsert = jasmine.createSpy('upsert').and.callFake((fila) => ({
    select: () => ({ single: () => Promise.resolve({ data: { ...fila, fecha_entrevista: '2026-11-07' }, error: null }) })
  }));
  const update = jasmine.createSpy('update').and.callFake((valores) => ({
    eq: () => ({ select: () => ({ single: () => Promise.resolve({ data: { ...base, ...valores }, error: null }) }) })
  }));
  spyOn(supabase, 'from').and.callFake((tabla) => {
    if (tabla === 'candidatos') {
      return { select: () => ({ eq: () => ({ single: () => Promise.resolve({ data: base, error: null }) }) }), update };
    }
    if (tabla === 'evaluaciones') {
      return { select: () => ({ eq: () => ({ maybeSingle: () => Promise.resolve({ data: evaluacion, error: null }) }) }), upsert };
    }
    return { select: () => ({ eq: () => ({ maybeSingle: () => Promise.resolve({ data: { id: 7, titulo: 'Turno noche' }, error: null }) }) }) };
  });
  return { upsert, update };
};

const verEntrevista = () =>
  render(conRol(
    <MemoryRouter initialEntries={['/entrevista/1']}>
      <Routes>
        <Route path="/entrevista/:id" element={<Entrevista />} />
      </Routes>
    </MemoryRouter>,
    'reclutador'
  ));

describe('Reclutador: entrevista', () => {
  afterEach(cleanup);

  it('precarga la ficha del candidato desde la base y la solicitud vinculada.', async () => {
    simular();
    verEntrevista();

    expect(await screen.findByRole('heading', { name: 'Juan Pérez González' })).toBeTruthy();
    expect(screen.getByText('12345678-5')).toBeTruthy();
    expect(screen.getByText('+56911112222')).toBeTruthy();
    expect(await screen.findByText(/Turno noche/)).toBeTruthy();
  });

  it('autoguarda el borrador y pasa al candidato a En proceso.', async () => {
    const { upsert, update } = simular();
    verEntrevista();
    await screen.findByRole('heading', { name: 'Juan Pérez González' });

    fireEvent.change(screen.getByLabelText('Estudios'), { target: { value: 'Ingeniería en Acuicultura' } });

    await esperar(() => upsert.calls.any(), { timeout: 4000 });
    const fila = upsert.calls.mostRecent().args[0];
    expect(fila.candidato_id).toBe(1);
    expect(fila.estado).toBe('borrador');
    expect(fila.respuestas.estudios).toBe('Ingeniería en Acuicultura');
    await esperar(() => update.calls.allArgs().some(([v]) => v.estado === 'En proceso'));
    expect(await screen.findByText('Borrador guardado')).toBeTruthy();
  });

  it('exige elegir el resultado y escribir observaciones para finalizar.', async () => {
    const { upsert } = simular();
    verEntrevista();
    await screen.findByRole('heading', { name: 'Juan Pérez González' });

    fireEvent.click(screen.getByRole('button', { name: 'Finalizar entrevista' }));
    expect((await screen.findByRole('alert')).textContent).toContain('Elige Apto o No apto');

    fireEvent.click(screen.getByRole('radio', { name: 'Apto' }));
    fireEvent.click(screen.getByRole('button', { name: 'Finalizar entrevista' }));
    await esperar(() => screen.queryByRole('alert')?.textContent.includes('observaciones'));
    expect(upsert).not.toHaveBeenCalled();
  });

  it('finaliza con la decisión: guarda la entrevista y actualiza el estado del candidato.', async () => {
    const { upsert, update } = simular();
    verEntrevista();
    await screen.findByRole('heading', { name: 'Juan Pérez González' });

    fireEvent.change(screen.getByRole('textbox', { name: 'Observaciones y conclusiones' }), { target: { value: 'Buen perfil técnico.' } });
    fireEvent.click(screen.getByRole('radio', { name: 'Apto' }));
    fireEvent.click(screen.getByRole('button', { name: 'Finalizar entrevista' }));

    await esperar(() => update.calls.allArgs().some(([v]) => v.estado === 'Apto'));
    const fila = upsert.calls.mostRecent().args[0];
    expect(fila.estado).toBe('finalizada');
    expect(fila.resultado).toBe('Apto');
    expect(await screen.findByText(/Entrevista finalizada: Apto/)).toBeTruthy();
    expect(screen.getByLabelText('Estudios').disabled).toBe(true);
  });

  it('una entrevista ya finalizada se abre en solo lectura.', async () => {
    simular({
      base: { ...candidato, estado: 'No apto' },
      evaluacion: { estado: 'finalizada', resultado: 'No apto', observaciones: 'No cumple turnos.', respuestas: { estudios: 'Técnico' }, enlace_reunion: null }
    });
    verEntrevista();

    expect(await screen.findByText(/Entrevista finalizada: No apto/)).toBeTruthy();
    expect(screen.getByLabelText('Estudios').value).toBe('Técnico');
    expect(screen.getByLabelText('Estudios').disabled).toBe(true);
    expect(screen.queryByRole('button', { name: 'Finalizar entrevista' })).toBeNull();
  });

  it('el botón de videollamada aparece solo con un enlace válido.', async () => {
    simular();
    verEntrevista();
    await screen.findByRole('heading', { name: 'Juan Pérez González' });
    expect(screen.queryByRole('link', { name: 'Abrir videollamada' })).toBeNull();

    fireEvent.change(screen.getByLabelText('Enlace de la videollamada'), { target: { value: 'https://meet.google.com/abc-defg' } });

    expect(screen.getByRole('link', { name: 'Abrir videollamada' }).getAttribute('href')).toBe('https://meet.google.com/abc-defg');
  });
});

describe('Reclutador: modalidad de la entrevista', () => {
  afterEach(cleanup);

  it('por defecto es videollamada: ofrece crear la reunión en Meet y no pide lugar.', async () => {
    simular();
    verEntrevista();
    await screen.findByRole('heading', { name: 'Juan Pérez González' });

    expect(screen.getByRole('radio', { name: 'Videollamada' }).getAttribute('aria-checked')).toBe('true');
    expect(screen.getByRole('link', { name: 'Crear reunión en Meet' }).getAttribute('href')).toBe('https://meet.new');
    expect(screen.queryByLabelText('Lugar de la entrevista')).toBeNull();
  });

  it('presencial cambia el enlace por el lugar y oculta los botones de videollamada.', async () => {
    simular();
    verEntrevista();
    await screen.findByRole('heading', { name: 'Juan Pérez González' });

    fireEvent.click(screen.getByRole('radio', { name: 'Presencial' }));

    expect(screen.getByLabelText('Lugar de la entrevista')).toBeTruthy();
    expect(screen.queryByLabelText('Enlace de la videollamada')).toBeNull();
    expect(screen.queryByRole('link', { name: 'Crear reunión en Meet' })).toBeNull();
  });

  it('guarda la modalidad presencial y el lugar en el borrador.', async () => {
    const { upsert } = simular();
    verEntrevista();
    await screen.findByRole('heading', { name: 'Juan Pérez González' });

    fireEvent.click(screen.getByRole('radio', { name: 'Presencial' }));
    fireEvent.change(screen.getByLabelText('Lugar de la entrevista'), { target: { value: 'Oficina Puerto Montt, sala 2' } });
    await esperar(() => upsert.calls.any(), { timeout: 4000 });

    const fila = upsert.calls.mostRecent().args[0];
    expect(fila.modalidad).toBe('Presencial');
    expect(fila.lugar).toBe('Oficina Puerto Montt, sala 2');
  });

  it('retoma una entrevista presencial guardada con su lugar.', async () => {
    simular({ evaluacion: { estado: 'borrador', modalidad: 'Presencial', lugar: 'Planta Calbuco', respuestas: {}, observaciones: '', enlace_reunion: null } });
    verEntrevista();

    expect(await screen.findByDisplayValue('Planta Calbuco')).toBeTruthy();
    expect(screen.getByRole('radio', { name: 'Presencial' }).getAttribute('aria-checked')).toBe('true');
  });
});

describe('Reclutador: mi bandeja', () => {
  afterEach(cleanup);

  const lista = [
    { ...candidatosFixture[0], estado: 'Pendiente', reclutador_id: 'yo' },
    { ...candidatosFixture[1], estado: 'En proceso', reclutador_id: 'yo' },
    { ...candidatosFixture[2], estado: 'Pendiente', reclutador_id: 'otra' }
  ];

  const verBandejaComo = (datos, idUsuario) => {
    spyOn(supabase, 'from').and.callFake((tabla) => ({
      select: () => ({ order: () => Promise.resolve({ data: tabla === 'candidatos' ? datos : [], error: null }) })
    }));
    return render(
      <MemoryRouter>
        <AuthContext.Provider value={{ user: { id: idUsuario }, rol: 'reclutador', loading: false, signOut() {} }}>
          <MiBandeja />
        </AuthContext.Provider>
      </MemoryRouter>
    );
  };

  it('quien no tiene casos asignados ve un mensaje claro.', async () => {
    verBandejaComo(lista, 'nadie');
    expect(await screen.findByText(/No tienes candidatos asignados/)).toBeTruthy();
  });

  it('muestra solo mis casos, con los que están en curso primero, y enlaza a la entrevista.', async () => {
    verBandejaComo(lista, 'yo');

    expect(await screen.findByText('María José Silva')).toBeTruthy();
    expect(screen.getByText('Juan Pérez González')).toBeTruthy();
    expect(screen.queryByText('Carlos Valenzuela')).toBeNull();
    expect(screen.getByText('2 por entrevistar, 1 ya en curso.')).toBeTruthy();

    const enlaces = screen.getAllByRole('link', { name: /Continuar a|Entrevistar a/ });
    expect(enlaces[0].textContent).toBe('Continuar');
    expect(enlaces[0].getAttribute('href')).toBe('/entrevista/2');
    expect(enlaces[1].getAttribute('href')).toBe('/entrevista/1');
  });
});
