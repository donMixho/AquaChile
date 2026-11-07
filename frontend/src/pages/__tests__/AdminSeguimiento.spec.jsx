import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import AdminSeguimiento from '../AdminSeguimiento';
import AdminResumen from '../AdminResumen';
import { candidatosFixture, conRol, esperar, simularConsulta } from '../../test/helpers';
import { supabase } from '../../services/supabaseClient';

const datos = [
  { ...candidatosFixture[0], estado: 'Pendiente' },
  { ...candidatosFixture[1], estado: 'Apto', telefono: '+56912345678' },
  { ...candidatosFixture[2], estado: 'Apto' }
];

const verSeguimiento = (rol = 'admin', ruta = '/seguimiento') =>
  render(conRol(
    <MemoryRouter initialEntries={[ruta]}><AdminSeguimiento /></MemoryRouter>,
    rol
  ));

describe('Admin: seguimiento', () => {
  afterEach(cleanup);

  it('lista a todos y filtra por estado con los chips.', async () => {
    simularConsulta({ data: datos });
    verSeguimiento();

    expect(await screen.findByText('Juan Pérez González')).toBeTruthy();
    expect(screen.getByText('3 resultados')).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: /^Apto/ }));

    expect(screen.queryByText('Juan Pérez González')).toBeNull();
    expect(screen.getByText('María José Silva')).toBeTruthy();
    expect(screen.getByText('2 resultados')).toBeTruthy();
  });

  it('abre ya filtrado cuando la URL trae ?estado= (viene del Resumen).', async () => {
    simularConsulta({ data: datos });
    verSeguimiento('admin', '/seguimiento?estado=Pendiente');

    expect(await screen.findByText('Juan Pérez González')).toBeTruthy();
    expect(screen.queryByText('María José Silva')).toBeNull();
    expect(screen.getByRole('button', { name: /^Pendiente/ }).getAttribute('aria-pressed')).toBe('true');
  });

  it('busca por nombre sin importar tildes y mayúsculas.', async () => {
    simularConsulta({ data: datos });
    verSeguimiento();
    await screen.findByText('Juan Pérez González');

    fireEvent.change(screen.getByLabelText('Buscar por nombre, RUT o cargo'), { target: { value: 'maria jose' } });

    expect(screen.getByText('María José Silva')).toBeTruthy();
    expect(screen.queryByText('Carlos Valenzuela')).toBeNull();
  });

  it('muestra el detalle al elegir una fila y no ofrece editar ni evaluar.', async () => {
    simularConsulta({ data: datos });
    verSeguimiento();
    await screen.findByText('María José Silva');

    fireEvent.click(screen.getByRole('button', { name: 'Ver detalle de María José Silva' }));

    const detalle = screen.getByRole('complementary', { name: 'Detalle del candidato' });
    expect(within(detalle).getByText('+56912345678')).toBeTruthy();
    expect(within(detalle).getByText('Sin currículum adjunto')).toBeTruthy();
    expect(screen.queryByRole('button', { name: /Editar/ })).toBeNull();
    expect(screen.queryByRole('button', { name: /Solicitar evaluación/ })).toBeNull();
  });

  it('eliminar exige escribir el nombre y recién entonces borra.', async () => {
    simularConsulta({ data: datos });
    const eq = jasmine.createSpy('eq').and.returnValue({ select: () => Promise.resolve({ data: [{ id: 2 }], error: null }) });
    supabase.from.and.returnValue({
      select: () => ({ order: () => Promise.resolve({ data: datos, error: null }) }),
      delete: () => ({ eq })
    });
    verSeguimiento();
    await screen.findByText('María José Silva');

    fireEvent.click(screen.getByRole('button', { name: 'Ver detalle de María José Silva' }));
    fireEvent.click(screen.getByRole('button', { name: /Eliminar candidato/ }));
    const confirmar = screen.getByRole('button', { name: 'Sí, eliminar' });
    expect(confirmar.disabled).toBe(true);

    fireEvent.change(screen.getByLabelText('Nombre completo para confirmar'), { target: { value: 'maría josé silva' } });
    expect(confirmar.disabled).toBe(false);
    fireEvent.click(confirmar);

    await esperar(() => eq.calls.any());
    await esperar(() => !screen.queryByText('María José Silva'));
    expect(screen.getByText('Se eliminó a María José Silva.')).toBeTruthy();
  });

  describe('asignación', () => {
    const equipo = [
      { id: 'r1', nombre: 'Ana Rojas', email: 'ana@aquachile.cl', rol: 'reclutador', estado: 'activo' },
      { id: 'r2', nombre: 'Beto Díaz', email: 'beto@aquachile.cl', rol: 'reclutador', estado: 'ausente' },
      { id: 'r3', nombre: 'Cami Paz', email: 'cami@aquachile.cl', rol: 'reclutador', estado: 'inactivo' }
    ];
    const solicitudes = [{ id: 7, titulo: 'Turno noche', estado: 'Abierta' }, { id: 8, titulo: 'Vieja', estado: 'Cerrada' }];
    const conAsignacion = [
      { ...candidatosFixture[0], estado: 'Pendiente', reclutador_id: null, solicitud_id: null },
      { ...candidatosFixture[1], estado: 'En proceso', reclutador_id: 'r1', solicitud_id: 7 }
    ];

    const simular = (actualizar) =>
      spyOn(supabase, 'from').and.callFake((tabla) => ({
        select: () => ({
          order: () => Promise.resolve({
            data: { candidatos: conAsignacion, perfiles: equipo, solicitudes }[tabla],
            error: null
          })
        }),
        ...(actualizar && { update: actualizar })
      }));

    it('muestra el responsable de cada fila y "Sin asignar" cuando falta.', async () => {
      simular();
      verSeguimiento();

      await esperar(() => within(screen.getByRole('table')).queryByText('Sin asignar'));
      expect(await within(screen.getByRole('table')).findByText('Ana Rojas')).toBeTruthy();
    });

    it('filtra los candidatos sin responsable.', async () => {
      simular();
      verSeguimiento('admin', '/seguimiento?responsable=sin');

      expect(await screen.findByText('Juan Pérez González')).toBeTruthy();
      expect(screen.queryByText('María José Silva')).toBeNull();
    });

    it('asigna un responsable al elegirlo, sin botón de guardar, y ofrece solo personas con acceso.', async () => {
      const update = jasmine.createSpy('update').and.callFake((valores) => ({
        eq: () => ({ select: () => ({ single: () => Promise.resolve({ data: { ...conAsignacion[0], ...valores }, error: null }) }) })
      }));
      simular(update);
      verSeguimiento();
      await screen.findByText('Juan Pérez González');

      fireEvent.click(screen.getByRole('button', { name: 'Ver detalle de Juan Pérez González' }));
      const lista = screen.getByLabelText('Responsable');
      const opciones = [...lista.options].map((o) => o.textContent);
      expect(opciones).toContain('Beto Díaz (ausente)');
      expect(opciones).not.toContain('Cami Paz (inactivo)');

      fireEvent.change(lista, { target: { value: 'r1' } });

      await esperar(() => update.calls.allArgs().some(([v]) => v.reclutador_id === 'r1'));
      await esperar(() => screen.getByLabelText('Responsable').value === 'r1');
    });

    it('vincula la candidata a una solicitud abierta y oculta las cerradas.', async () => {
      const update = jasmine.createSpy('update').and.callFake((valores) => ({
        eq: () => ({ select: () => ({ single: () => Promise.resolve({ data: { ...conAsignacion[0], ...valores }, error: null }) }) })
      }));
      simular(update);
      verSeguimiento();
      await screen.findByText('Juan Pérez González');

      fireEvent.click(screen.getByRole('button', { name: 'Ver detalle de Juan Pérez González' }));
      const lista = screen.getByLabelText('Solicitud de cargo');
      expect([...lista.options].map((o) => o.textContent)).toEqual(['Sin solicitud', 'Turno noche']);

      fireEvent.change(lista, { target: { value: '7' } });

      await esperar(() => update.calls.allArgs().some(([v]) => v.solicitud_id === 7));
    });

    it('el reclutador no recibe controles de asignación.', async () => {
      simular();
      verSeguimiento('reclutador');
      await screen.findByText('Juan Pérez González');

      fireEvent.click(screen.getByRole('button', { name: 'Ver detalle de Juan Pérez González' }));

      expect(screen.queryByLabelText('Solicitud de cargo')).toBeNull();
    });
  });

  it('muestra el error de carga.', async () => {
    simularConsulta({ error: new Error('sin conexión') });
    verSeguimiento();

    expect((await screen.findByRole('alert')).textContent).toContain('sin conexión');
  });
});

describe('Admin: resumen', () => {
  afterEach(cleanup);

  it('cada etapa del avance lleva a Seguimiento ya filtrado.', async () => {
    spyOn(supabase, 'from').and.callFake((tabla) => ({
      select: () => ({
        order: () => Promise.resolve({ data: tabla === 'candidatos' ? datos : [], error: null })
      })
    }));
    render(conRol(<MemoryRouter><AdminResumen /></MemoryRouter>, 'admin'));

    const apto = await screen.findByRole('link', { name: 'Apto: 2. Ver en seguimiento' });
    expect(apto.getAttribute('href')).toBe('/seguimiento?estado=Apto');
    expect(screen.getByRole('link', { name: 'Pendiente: 1. Ver en seguimiento' })).toBeTruthy();
  });

  it('avisa los candidatos sin responsable y cuenta las vacantes cubiertas.', async () => {
    const lista = [
      { ...candidatosFixture[0], estado: 'Pendiente', reclutador_id: null, solicitud_id: 7 },
      { ...candidatosFixture[1], estado: 'Apto', reclutador_id: 'r1', solicitud_id: 7 }
    ];
    spyOn(supabase, 'from').and.callFake((tabla) => ({
      select: () => ({
        order: () => Promise.resolve({
          data: { candidatos: lista, perfiles: [], solicitudes: [{ id: 7, titulo: 'Turno noche', cargo: 'Operario', vacantes: 3, estado: 'Abierta' }] }[tabla],
          error: null
        })
      })
    }));
    render(conRol(<MemoryRouter><AdminResumen /></MemoryRouter>, 'admin'));

    expect(await screen.findByText('1 candidato sin responsable.')).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Asignar' }).getAttribute('href')).toBe('/seguimiento?responsable=sin');
    expect(screen.getByText(/1 de 3 vacantes cubiertas/)).toBeTruthy();
  });

  it('con la decisión de Operaciones, una vacante se cubre solo con un candidato Seleccionado.', async () => {
    const lista = [
      { ...candidatosFixture[0], estado: 'Apto', reclutador_id: 'r1', solicitud_id: 7, decision_operaciones: null },
      { ...candidatosFixture[1], estado: 'Apto', reclutador_id: 'r1', solicitud_id: 7, decision_operaciones: 'Seleccionado' }
    ];
    spyOn(supabase, 'from').and.callFake((tabla) => ({
      select: () => ({
        order: () => Promise.resolve({
          data: { candidatos: lista, perfiles: [], solicitudes: [{ id: 7, titulo: 'Turno noche', cargo: 'Operario', vacantes: 3, estado: 'Abierta' }] }[tabla],
          error: null
        })
      })
    }));
    render(conRol(<MemoryRouter><AdminResumen /></MemoryRouter>, 'admin'));

    expect(await screen.findByText(/1 de 3 vacantes cubiertas/)).toBeTruthy();
  });
});
