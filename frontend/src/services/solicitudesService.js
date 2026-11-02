import { supabase } from './supabaseClient';

export const ESTADOS_SOLICITUD = ['Abierta', 'En proceso', 'Cerrada'];

// Deja siempre un Error con mensaje legible, venga de Supabase (objeto plano) o de la red.
const comoError = (contexto, error) =>
  new Error(`${contexto}: ${error?.message ?? 'error desconocido'}`, { cause: error });

export const obtenerSolicitudes = async () => {
  try {
    const { data, error } = await supabase
      .from('solicitudes')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data ?? [];
  } catch (error) {
    throw comoError('No se pudieron obtener las solicitudes', error);
  }
};

// Devuelve null cuando el registro no existe, para que la vista muestre el aviso correspondiente.
export const obtenerSolicitudPorId = async (id) => {
  try {
    const { data, error } = await supabase
      .from('solicitudes')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    if (error) throw error;
    return data ?? null;
  } catch (error) {
    throw comoError('No se pudo obtener la solicitud', error);
  }
};

export const crearSolicitud = async (datosSolicitud) => {
  try {
    const { data, error } = await supabase
      .from('solicitudes')
      .insert({
        titulo: datosSolicitud.titulo,
        cargo: datosSolicitud.cargo,
        familia_cargo: datosSolicitud.familiaCargo ?? datosSolicitud.familia_cargo,
        vacantes: Number(datosSolicitud.vacantes) || 1,
        estado: datosSolicitud.estado ?? 'Abierta',
        descripcion: datosSolicitud.descripcion || null
      })
      .select()
      .single();
    if (error) throw error;
    return data;
  } catch (error) {
    throw comoError('No se pudo crear la solicitud', error);
  }
};
