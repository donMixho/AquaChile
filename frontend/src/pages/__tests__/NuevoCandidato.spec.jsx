import { cleanup, fireEvent, screen, waitFor } from '@testing-library/react';
import NuevoCandidato from '../NuevoCandidato';
import { conRol, renderConRouter } from '../../test/helpers';
import { supabase } from '../../services/supabaseClient';

const llenar = ({ rut = '12.345.678-5', email = 'ana@aquachile.cl' } = {}) => {
  fireEvent.change(screen.getByPlaceholderText('Ej: Andrés Muñoz Soto'), { target: { value: 'Ana Soto' } });
  fireEvent.change(screen.getByPlaceholderText('12.345.678-9'), { target: { value: rut } });
  fireEvent.change(screen.getByPlaceholderText('Ej: Supervisor de Calidad'), { target: { value: 'Analista' } });
  fireEvent.change(screen.getByPlaceholderText('correo@ejemplo.cl'), { target: { value: email } });
};

const enviar = () => fireEvent.click(screen.getByRole('button', { name: 'Registrar Candidato' }));

describe('NuevoCandidato (rol reclutador)', () => {
  beforeEach(() => {
    spyOn(supabase, 'from').and.returnValue({
      insert: () => ({ select: () => ({ single: () => Promise.resolve({ data: { id: 9 }, error: null }) }) })
    });
    renderConRouter(conRol(<NuevoCandidato />, 'reclutador'), { ruta: '/candidatos/nuevo' });
  });
  afterEach(cleanup);

  it('54. Da formato al RUT mientras se escribe.', () => {
    const rut = screen.getByPlaceholderText('12.345.678-9');
    fireEvent.change(rut, { target: { value: '123456785' } });

    expect(rut.value).toBe('12.345.678-5');
  });

  it('55. Rechaza un RUT con dígito verificador incorrecto y no guarda.', () => {
    llenar({ rut: '12.345.678-9' });
    enviar();

    expect(screen.getByRole('alert').textContent).toContain('El RUT no es válido');
    expect(supabase.from).not.toHaveBeenCalled();
  });

  it('56. Acepta un RUT con verificador K válido.', () => {
    llenar({ rut: '10.000.013-K' });
    enviar();

    expect(screen.queryByText('El RUT no es válido', { exact: false })).toBeNull();
  });

  it('57. Normaliza el correo (sin espacios y en minúsculas).', () => {
    const correo = screen.getByPlaceholderText('correo@ejemplo.cl');
    fireEvent.change(correo, { target: { value: ' Ana.SOTO @AquaChile.CL ' } });

    expect(correo.value).toBe('ana.soto@aquachile.cl');
  });

  it('58. Informa a la vez RUT y correo inválidos.', () => {
    llenar({ rut: '1.111.111-1', email: 'sin-arroba' });
    // Se envía el formulario directo: el navegador ya bloquea type="email" inválido al hacer clic.
    fireEvent.submit(screen.getByRole('button', { name: 'Registrar Candidato' }).closest('form'));

    expect(screen.getAllByRole('alert').length).toBe(2);
    expect(supabase.from).not.toHaveBeenCalled();
  });

  it('59. Con datos válidos guarda, informa el éxito y vuelve al listado.', async () => {
    llenar();
    enviar();

    expect((await screen.findByRole('status')).textContent).toContain('registrado exitosamente');
    expect(supabase.from).toHaveBeenCalledWith('candidatos');
    await waitFor(
      () => {
        if (screen.getByTestId('ruta').textContent !== '/candidatos') throw new Error('aún sin redirigir');
      },
      { timeout: 3000 }
    );
  });
});
