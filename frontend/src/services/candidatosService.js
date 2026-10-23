import { supabase } from './supabaseClient';

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
