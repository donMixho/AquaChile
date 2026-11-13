import { supabase } from './supabaseClient';
import { traducirFaltaDeMigracion } from './erroresBase';

export const ACCIONES_AUDITORIA = ['CREAR', 'ACTUALIZAR', 'ELIMINAR'];

export const ETIQUETAS_ACCION = {
  CREAR: 'Creó',
  ACTUALIZAR: 'Modificó',
  ELIMINAR: 'Eliminó'
};

export const ETIQUETAS_TABLA = {
  candidatos: 'Candidato',
  solicitudes: 'Solicitud',
  evaluaciones: 'Evaluación',
  perfiles: 'Perfil de equipo'
};

// Lectura directa: la política RLS "log_auditoria_select_admin" solo deja leer a un admin activo.
export const obtenerRegistrosAuditoria = async ({ limite = 200 } = {}) => {
  const { data, error } = await supabase
    .from('log_auditoria')
    .select('*')
    .order('creado_en', { ascending: false })
    .limit(limite);

  if (error) {
    throw traducirFaltaDeMigracion(error, { tabla: 'log_auditoria', archivo: 'migracion_auditoria.sql' });
  }

  return data ?? [];
};

// Lista corta de los campos que cambiaron en una actualización (sin mostrar los valores, que
// pueden ser datos personales).
export const camposModificados = (registro) => {
  const antes = registro?.datos_antes;
  const despues = registro?.datos_despues;
  if (registro?.accion !== 'ACTUALIZAR' || !antes || !despues) return [];
  return Object.keys(despues).filter((campo) => JSON.stringify(antes[campo]) !== JSON.stringify(despues[campo]));
};
