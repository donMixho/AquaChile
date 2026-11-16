// frontend/src/services/supabase.jsx
import { supabase as supabaseOriginal } from './supabaseClient';

// Reexportamos el cliente oficial para que sirva tanto para supabaseClient como para supabase
export const supabase = supabaseOriginal;

/**
 * Verifica el estado de conexión con Supabase (Requisito de testing de la pizarra).
 */
export async function verificarConexionSupabase() {
  try {
    const { data, error } = await supabase.from('candidatos').select('id').limit(1);
    if (error) throw error;
    return { ok: true, data };
  } catch (error) {
    console.warn('[supabase.jsx] Error verificando conexión:', error.message);
    return { ok: false, error: error.message };
  }
}

/**
 * Actualiza datos o apuntes rápidos de un candidato en la base de datos.
 */
export async function actualizarDatosCandidato(candidatoId, campos = {}) {
  try {
    if (!candidatoId) throw new Error('ID de candidato requerido');
    const { data, error } = await supabase
      .from('candidatos')
      .update(campos)
      .eq('id', candidatoId)
      .select()
      .single();

    if (error) throw error;
    return { ok: true, data };
  } catch (error) {
    console.error('[supabase.jsx] Error al actualizar candidato:', error.message);
    return { ok: false, error: error.message };
  }
}

export default supabase;