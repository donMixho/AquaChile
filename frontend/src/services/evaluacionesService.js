import { supabase } from './supabaseClient';
import { actualizarEstadoCandidato } from './candidatosService';
import { traducirFaltaDeMigracion } from './erroresBase';

const MIGRACION = { tabla: 'evaluaciones', archivo: 'migracion_evaluaciones.sql' };

export const RESULTADOS = ['Apto', 'No apto'];

// Devuelve null si el candidato aún no tiene entrevista iniciada.
export const obtenerEvaluacion = async (candidatoId) => {
  const { data, error } = await supabase
    .from('evaluaciones')
    .select('*')
    .eq('candidato_id', candidatoId)
    .maybeSingle();

  if (error) {
    throw traducirFaltaDeMigracion(error, MIGRACION);
  }

  return data ?? null;
};

// Las entrevistas de varios candidatos a la vez (Operaciones solo recibe las de los Apto).
export const obtenerEvaluacionesPorCandidatos = async (ids) => {
  if (!ids || ids.length === 0) return [];

  const { data, error } = await supabase.from('evaluaciones').select('*').in('candidato_id', ids);

  if (error) {
    throw traducirFaltaDeMigracion(error, MIGRACION);
  }

  return data ?? [];
};

// Una fila por candidato: upsert por candidato_id. `datos` trae solo lo que cambió en la ficha.
const guardar = async (candidatoId, evaluadorId, datos, finalizar = null) => {
  const fila = {
    candidato_id: candidatoId,
    evaluador_id: evaluadorId ?? null,
    modalidad: datos.modalidad === 'Presencial' ? 'Presencial' : 'Videollamada',
    enlace_reunion: datos.enlaceReunion || null,
    lugar: datos.lugar || null,
    respuestas: datos.respuestas ?? {},
    observaciones: datos.observaciones || null,
    fecha_entrevista: datos.fechaEntrevista || null,
    actualizado_en: new Date().toISOString(),
    ...(finalizar && { estado: 'finalizada', resultado: finalizar }),
    ...(!finalizar && { estado: 'borrador' })
  };

  const { data, error } = await supabase
    .from('evaluaciones')
    .upsert(fila, { onConflict: 'candidato_id' })
    .select()
    .single();

  if (error) {
    throw traducirFaltaDeMigracion(error, MIGRACION);
  }

  return data;
};

// Guarda el borrador y, la primera vez, pasa al candidato de Pendiente a En proceso: empezar la
// entrevista es lo que lo pone en curso, sin un paso aparte de "solicitar evaluación".
export const guardarBorrador = async (candidato, evaluadorId, datos) => {
  const evaluacion = await guardar(candidato.id, evaluadorId, datos);
  if (candidato.estado !== 'En proceso') {
    await actualizarEstadoCandidato(candidato.id, 'En proceso');
  }
  return evaluacion;
};

// Cierra la entrevista con la decisión; el estado del candidato pasa a Apto o No apto.
export const finalizarEvaluacion = async (candidato, evaluadorId, datos, resultado) => {
  if (!RESULTADOS.includes(resultado)) {
    throw new Error('Elige Apto o No apto para finalizar la entrevista.');
  }
  if (!String(datos.observaciones ?? '').trim()) {
    throw new Error('Escribe las observaciones antes de finalizar.');
  }

  const evaluacion = await guardar(candidato.id, evaluadorId, datos, resultado);
  await actualizarEstadoCandidato(candidato.id, resultado);
  return evaluacion;
};
