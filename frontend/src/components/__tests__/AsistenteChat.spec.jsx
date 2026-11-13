import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import AsistenteChat from '../AsistenteChat';
import { supabase } from '../../services/supabaseClient';
import { conRol } from '../../test/helpers';

const mostrar = (rol, opciones) =>
  render(
    <MemoryRouter>
      {conRol(<AsistenteChat />, rol, opciones)}
    </MemoryRouter>
  );

const abrir = () => fireEvent.click(screen.getByRole('button', { name: 'Abrir asistente' }));

describe('AsistenteChat', () => {
  afterEach(cleanup);

  it('86. No aparece sin sesión ni sin rol.', () => {
    mostrar('admin', { sesion: false });
    expect(screen.queryByRole('button', { name: 'Abrir asistente' })).toBeNull();
    cleanup();

    mostrar(null);
    expect(screen.queryByRole('button', { name: 'Abrir asistente' })).toBeNull();
  });

  it('87. Operaciones recibe una bienvenida que aclara que solo consulta candidatos Aptos.', () => {
    mostrar('operaciones');
    abrir();

    expect(screen.getByRole('dialog').textContent).toMatch(/solo consulto candidatos Aptos/);
  });

  it('88. El reclutador recibe su propia bienvenida y sugerencias.', () => {
    mostrar('reclutador');
    abrir();

    expect(screen.getByRole('dialog').textContent).not.toMatch(/solo consulto candidatos Aptos/);
    expect(screen.getByRole('button', { name: 'Resumen de postulantes por cargo' })).toBeTruthy();
  });

  it('89. Envía la consulta y convierte [CANDIDATO:id] en un enlace a la entrevista.', async () => {
    const invocar = spyOn(supabase.functions, 'invoke').and.resolveTo({
      data: { respuesta: 'Juan Pérez — Operario (Apto) [CANDIDATO:7]' },
      error: null
    });
    mostrar('reclutador');
    abrir();

    fireEvent.change(screen.getByLabelText('Escribe tu consulta'), { target: { value: 'aptos en planta' } });
    fireEvent.click(screen.getByRole('button', { name: 'Enviar' }));

    expect(screen.getByRole('status').textContent).toMatch(/Analizando expedientes/);
    const enlace = await screen.findByRole('link', { name: 'Ver ficha' });
    expect(enlace.getAttribute('href')).toBe('/entrevista/7');
    expect(invocar.calls.mostRecent().args[1].body.mensaje).toBe('aptos en planta');
  });

  it('90. Una sugerencia rápida envía la consulta; Operaciones enlaza a Candidatos.', async () => {
    spyOn(supabase.functions, 'invoke').and.resolveTo({ data: { respuesta: 'Ana [CANDIDATO:2]' }, error: null });
    mostrar('operaciones');
    abrir();

    fireEvent.click(screen.getByRole('button', { name: '¿Quiénes están Aptos pendientes de decisión?' }));

    const enlace = await screen.findByRole('link', { name: 'Ver ficha' });
    expect(enlace.getAttribute('href')).toBe('/candidatos');
  });

  it('91. Muestra un mensaje claro si el servicio falla, sin romper la pantalla.', async () => {
    spyOn(supabase.functions, 'invoke').and.rejectWith(new Error('Failed to fetch'));
    mostrar('admin');
    abrir();

    fireEvent.change(screen.getByLabelText('Escribe tu consulta'), { target: { value: 'hola' } });
    fireEvent.click(screen.getByRole('button', { name: 'Enviar' }));

    expect((await screen.findByRole('alert')).textContent).toMatch(/No se pudo conectar/);
  });

  it('92. Limpiar la conversación borra los mensajes y vuelven las sugerencias.', async () => {
    spyOn(supabase.functions, 'invoke').and.resolveTo({ data: { respuesta: 'Respuesta de prueba' }, error: null });
    mostrar('admin');
    abrir();

    fireEvent.change(screen.getByLabelText('Escribe tu consulta'), { target: { value: 'hola' } });
    fireEvent.click(screen.getByRole('button', { name: 'Enviar' }));
    await screen.findByText('Respuesta de prueba');
    expect(screen.queryByRole('button', { name: 'Resumen de postulantes por cargo' })).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: 'Limpiar conversación' }));

    expect(screen.queryByText('Respuesta de prueba')).toBeNull();
    expect(screen.getByRole('button', { name: 'Resumen de postulantes por cargo' })).toBeTruthy();
  });

  it('93. Se puede cerrar el panel.', () => {
    mostrar('admin');
    abrir();
    fireEvent.click(screen.getByRole('button', { name: 'Cerrar asistente' }));

    expect(screen.queryByRole('dialog')).toBeNull();
  });
});
