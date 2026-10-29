import { supabase } from './supabaseClient';

export const ESTADOS_CANDIDATO = ['Pendiente', 'En proceso', 'Apto', 'No apto'];

// Lleva el estado guardado (columna `estado`, o `estado_resultado` si viniera de una unión)
// a uno de los cuatro valores. Sin dato, o con un texto desconocido, cuenta como Pendiente.
export const normalizarEstado = (candidato) => {
  const texto = String(candidato?.estado_resultado ?? candidato?.estado ?? '').toLowerCase();
  if (/no apto|rechaz/.test(texto)) return 'No apto';
  if (/apto|aprobad|finalizad/.test(texto)) return 'Apto';
  if (/proceso/.test(texto)) return 'En proceso';
  return 'Pendiente';
};

// select('*') ya incluye `estado` cuando la columna existe (ver docs/migracion_estado_candidatos.sql).
export const obtenerCandidatos = async () => {
  const { data, error } = await supabase
    .from('candidatos')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    throw error;
  }

  return data;
};

export const obtenerCandidatoPorId = async (id) => {
  const { data, error } = await supabase.from('candidatos').select('*').eq('id', id).single();

  if (error) {
    throw error;
  }

  return data;
};

// UPDATE de la columna `estado`. Con .single() un UPDATE que no afecta filas (id inexistente o
// bloqueado por RLS) falla en vez de parecer exitoso.
export const actualizarEstadoCandidato = async (id, nuevoEstado) => {
  if (!ESTADOS_CANDIDATO.includes(nuevoEstado)) {
    throw new Error(`Estado no válido: ${nuevoEstado}`);
  }

  const { data, error } = await supabase
    .from('candidatos')
    .update({ estado: nuevoEstado })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
};

const BUCKET_CV = 'curriculums';

export const subirCurriculum = async (archivo, rut) => {
  const extension = archivo.name.split('.').pop().toLowerCase();
  const rutLimpio = (rut || 'sin-rut').replace(/[^0-9kK]/g, '');
  const ruta = `${rutLimpio}-${Date.now()}.${extension}`;

  const { error } = await supabase.storage
    .from(BUCKET_CV)
    .upload(ruta, archivo, { contentType: archivo.type || undefined });

  if (error) {
    throw error;
  }

  const { data } = supabase.storage.from(BUCKET_CV).getPublicUrl(ruta);

  return { ruta, url: data.publicUrl };
};

export const crearCandidato = async (formData, archivoCv = null) => {
  const cv = archivoCv ? await subirCurriculum(archivoCv, formData.rut) : null;

  const { data, error } = await supabase
    .from('candidatos')
    .insert({
      nombre_completo: formData.nombreCompleto ?? formData.nombre,
      rut: formData.rut,
      cargo: formData.cargo,
      familia_cargo: formData.familiaCargo ?? formData.familia,
      email: formData.email,
      telefono: formData.telefono || null,
      cv_url: cv?.url ?? null
    })
    .select()
    .single();

  if (error) {
    if (cv) await supabase.storage.from(BUCKET_CV).remove([cv.ruta]);
    throw error;
  }

  return data;
};
