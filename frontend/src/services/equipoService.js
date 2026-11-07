import { supabase } from './supabaseClient';
import { traducirFaltaDeMigracion } from './erroresBase';

export const ESTADOS_PERFIL = ['activo', 'ausente', 'inactivo'];
export const ROLES_INVITABLES = ['reclutador', 'operaciones'];

export const ETIQUETAS_ESTADO = {
  activo: 'Activo',
  ausente: 'Ausente',
  inactivo: 'Inactivo'
};

// Lectura directa: la política RLS "perfiles_select" solo deja ver a todo el equipo a un admin activo.
export const obtenerEquipo = async () => {
  const { data, error } = await supabase.from('perfiles').select('*').order('nombre', { ascending: true });

  if (error) {
    throw traducirFaltaDeMigracion(error, { tabla: 'perfiles', archivo: 'migracion_perfiles.sql' });
  }

  return data ?? [];
};

// Invitar y bloquear requieren la clave service_role, que no puede estar en el navegador: lo hace
// la Edge Function `admin-usuarios`, que antes comprueba que quien llama sea admin activo.
const llamarFuncion = async (cuerpo) => {
  const { data, error } = await supabase.functions.invoke('admin-usuarios', { body: cuerpo });

  if (error) {
    // En errores HTTP, supabase-js entrega la respuesta cruda en error.context.
    const detalle = await error.context?.json?.().catch(() => null);
    throw new Error(detalle?.error ?? error.message ?? 'No se pudo completar la acción.');
  }
  if (data?.error) {
    throw new Error(data.error);
  }

  return data.perfil;
};

export const invitarUsuario = async ({ email, nombre, rol }) => {
  const correo = String(email ?? '').trim();
  const nombreLimpio = String(nombre ?? '').trim();

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)) {
    throw new Error('Ingresa un correo válido (ej: nombre@aquachile.cl).');
  }
  if (!nombreLimpio) {
    throw new Error('Ingresa el nombre de la persona.');
  }
  if (!ROLES_INVITABLES.includes(rol)) {
    throw new Error('Elige si la persona será reclutador u operaciones.');
  }

  return llamarFuncion({ accion: 'invitar', email: correo, nombre: nombreLimpio, rol });
};

export const cambiarEstadoUsuario = async (id, estado) => {
  if (!ESTADOS_PERFIL.includes(estado)) {
    throw new Error(`Estado no válido: ${estado}`);
  }

  return llamarFuncion({ accion: 'cambiar_estado', id, estado });
};
