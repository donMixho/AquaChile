import { supabase } from './supabaseClient';

// Cliente del Asistente de Reclutamiento. La Edge Function `asistente-candidatos` valida la sesión
// y filtra los datos según el rol; aquí solo se envía la consulta (supabase-js adjunta el JWT de la
// sesión activa) y se traduce cualquier falla a un mensaje claro. Nunca lanza.

const TIEMPO_MAXIMO_MS = 60000;
const MAX_HISTORIAL = 8;

export const MENSAJES = {
  sinConfigurar: 'El asistente aún no está configurado. Pide a un administrador que cargue la clave del servicio (LLM_API_KEY).',
  sinConexion: 'No se pudo conectar con el asistente. Revisa tu conexión e inténtalo de nuevo.',
  tiempo: 'El asistente tardó demasiado en responder. Inténtalo de nuevo en unos segundos.',
  sesion: 'Tu sesión expiró. Vuelve a iniciar sesión para usar el asistente.',
  generico: 'El asistente no está disponible por ahora. Inténtalo más tarde.'
};

const esperarMaximo = (promesa) =>
  new Promise((resolver, rechazar) => {
    const temporizador = setTimeout(() => rechazar(new Error('timeout')), TIEMPO_MAXIMO_MS);
    promesa.then(
      (valor) => {
        clearTimeout(temporizador);
        resolver(valor);
      },
      (error) => {
        clearTimeout(temporizador);
        rechazar(error);
      }
    );
  });

// `historial`: [{ rol: 'usuario' | 'asistente', texto }]. Devuelve { ok: true, texto } o
// { ok: false, texto: <mensaje para mostrar> }.
export const consultarAsistente = async (mensaje, historial = []) => {
  const consulta = String(mensaje ?? '').trim();
  if (!consulta) return { ok: false, texto: 'Escribe una consulta.' };

  try {
    const { data, error } = await esperarMaximo(
      supabase.functions.invoke('asistente-candidatos', {
        body: {
          mensaje: consulta,
          historial: historial.slice(-MAX_HISTORIAL).map(({ rol, texto }) => ({ rol, texto }))
        }
      })
    );

    if (error) {
      // En errores HTTP, supabase-js entrega la respuesta cruda en error.context.
      const estado = error.context?.status;
      const detalle = await error.context?.json?.().catch(() => null);
      if (estado === 503) return { ok: false, texto: MENSAJES.sinConfigurar };
      if (estado === 401) return { ok: false, texto: MENSAJES.sesion };
      if (estado === 504) return { ok: false, texto: MENSAJES.tiempo };
      if (detalle?.error) return { ok: false, texto: detalle.error };
      return { ok: false, texto: error.context ? MENSAJES.generico : MENSAJES.sinConexion };
    }
    if (data?.error) return { ok: false, texto: data.error };
    if (!data?.respuesta) return { ok: false, texto: MENSAJES.generico };

    return { ok: true, texto: String(data.respuesta) };
  } catch (e) {
    return { ok: false, texto: e?.message === 'timeout' ? MENSAJES.tiempo : MENSAJES.sinConexion };
  }
};
