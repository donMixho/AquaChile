import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import BotonInformePdf from '../BotonInformePdf';
import { supabase } from '../../services/supabaseClient';

const candidato = { id: 4, nombre_completo: 'Juan Pérez', rut: '12345678-5' };

describe('BotonInformePdf', () => {
  afterEach(cleanup);

  it('avisa cuando la persona aún no tiene entrevista registrada.', async () => {
    spyOn(supabase, 'from').and.returnValue({
      select: () => ({ eq: () => ({ maybeSingle: () => Promise.resolve({ data: null, error: null }) }) })
    });
    render(<BotonInformePdf candidato={candidato} />);

    fireEvent.click(screen.getByRole('button', { name: 'Descargar PDF de la entrevista' }));

    expect((await screen.findByRole('alert')).textContent).toMatch(/aún no tiene una entrevista/);
  });

  it('muestra el error si no se puede leer la entrevista.', async () => {
    spyOn(supabase, 'from').and.returnValue({
      select: () => ({ eq: () => ({ maybeSingle: () => Promise.resolve({ data: null, error: new Error('sin permiso') }) }) })
    });
    render(<BotonInformePdf candidato={candidato} />);

    fireEvent.click(screen.getByRole('button', { name: 'Descargar PDF de la entrevista' }));

    expect((await screen.findByRole('alert')).textContent).toMatch(/sin permiso/);
  });
});
