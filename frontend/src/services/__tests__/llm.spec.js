import { consultarAsistente, MENSAJES } from '../llm';
import { supabase } from '../supabaseClient';

const errorHttp = (status, cuerpo = null) => ({
  message: 'Edge Function returned a non-2xx status code',
  context: { status, json: () => (cuerpo ? Promise.resolve(cuerpo) : Promise.reject(new Error('sin cuerpo'))) }
});

describe('llm.consultarAsistente', () => {
  it('80. Envía la consulta con el historial y devuelve la respuesta.', async () => {
    const invocar = spyOn(supabase.functions, 'invoke').and.resolveTo({ data: { respuesta: 'Juan Pérez [CANDIDATO:1]' }, error: null });

    const resultado = await consultarAsistente('  ¿Quién tiene experiencia?  ', [{ rol: 'usuario', texto: 'hola', extra: 'x' }]);

    expect(resultado).toEqual({ ok: true, texto: 'Juan Pérez [CANDIDATO:1]' });
    expect(invocar).toHaveBeenCalledWith('asistente-candidatos', {
      body: { mensaje: '¿Quién tiene experiencia?', historial: [{ rol: 'usuario', texto: 'hola' }] }
    });
  });

  it('81. No llama a la red con una consulta vacía.', async () => {
    const invocar = spyOn(supabase.functions, 'invoke');

    expect((await consultarAsistente('   ')).ok).toBeFalse();
    expect(invocar).not.toHaveBeenCalled();
  });

  it('82. Avisa cuando el servicio no está configurado (503).', async () => {
    spyOn(supabase.functions, 'invoke').and.resolveTo({ data: null, error: errorHttp(503) });

    expect(await consultarAsistente('hola')).toEqual({ ok: false, texto: MENSAJES.sinConfigurar });
  });

  it('83. Usa el mensaje del servidor en otros errores HTTP y avisa si la sesión expiró.', async () => {
    const invocar = spyOn(supabase.functions, 'invoke').and.resolveTo({ data: null, error: errorHttp(403, { error: 'Tu acceso está inactivo.' }) });
    expect(await consultarAsistente('hola')).toEqual({ ok: false, texto: 'Tu acceso está inactivo.' });

    invocar.and.resolveTo({ data: null, error: errorHttp(401) });
    expect((await consultarAsistente('hola')).texto).toBe(MENSAJES.sesion);

    invocar.and.resolveTo({ data: null, error: errorHttp(504) });
    expect((await consultarAsistente('hola')).texto).toBe(MENSAJES.tiempo);

    invocar.and.resolveTo({ data: null, error: errorHttp(500) });
    expect((await consultarAsistente('hola')).texto).toBe(MENSAJES.generico);
  });

  it('84. Nunca lanza: una falla de red devuelve un mensaje claro.', async () => {
    spyOn(supabase.functions, 'invoke').and.rejectWith(new Error('Failed to fetch'));

    expect(await consultarAsistente('hola')).toEqual({ ok: false, texto: MENSAJES.sinConexion });
  });

  it('85. Una respuesta vacía se trata como servicio no disponible.', async () => {
    spyOn(supabase.functions, 'invoke').and.resolveTo({ data: {}, error: null });

    expect((await consultarAsistente('hola')).texto).toBe(MENSAJES.generico);
  });
});
