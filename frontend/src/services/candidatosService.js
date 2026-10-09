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

export const crearCandidato = async (formData) => {
  const { data, error } = await supabase
    .from('candidatos')
    .insert({
      nombre_completo: formData.nombreCompleto ?? formData.nombre,
      rut: formData.rut,
      cargo: formData.cargo,
      familia_cargo: formData.familiaCargo ?? formData.familia,
      email: formData.email,
      telefono: formData.telefono || null
    })
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
};
