import { supabase } from './supabaseClient';
import { crearCarpetaDrive } from './driveService';
import { traducirFaltaDeMigracion } from './erroresBase';

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

// Códigos de error que devuelve Supabase cuando una política de seguridad (RLS) bloquea el UPDATE:
// - 42501: PostgreSQL rechaza la operación por permisos o por una política WITH CHECK.
// - PGRST116: el UPDATE no afectó ninguna fila (RLS sin política de UPDATE/SELECT o id inexistente).
const CODIGO_SIN_PERMISO = '42501';
const CODIGO_SIN_FILAS = 'PGRST116';

const traducirErrorDeActualizacion = (error) => {
  if (error.code === CODIGO_SIN_PERMISO) {
    return new Error('Tu usuario no tiene permiso para modificar candidatos (política de seguridad de la base de datos).');
  }
  if (error.code === CODIGO_SIN_FILAS) {
    return new Error('No se modificó ningún registro. Revisa que exista y que tengas permiso para editarlo.');
  }
  return error; // red u otros: se propaga tal cual
};

// UPDATE por id compartido por las funciones de edición. Con .select().single() un UPDATE que no
// cambia nada (RLS o id inexistente) falla en vez de parecer exitoso.
const actualizarPorId = async (id, cambios) => {
  const { data, error } = await supabase
    .from('candidatos')
    .update(cambios)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    throw traducirErrorDeActualizacion(error);
  }

  return data;
};

export const actualizarEstadoCandidato = async (id, nuevoEstado) => {
  if (!ESTADOS_CANDIDATO.includes(nuevoEstado)) {
    throw new Error(`Estado no válido: ${nuevoEstado}`);
  }

  return actualizarPorId(id, { estado: nuevoEstado });
};

export const DECISIONES = ['Seleccionado', 'Descartado'];

// Decisión de Operaciones sobre un candidato Apto. `decision` null la deja otra vez sin decidir
// (reconsiderar). Descartar exige motivo; quién decidió y cuándo los pone la base de datos.
export const decidirCandidato = async (id, decision, motivo = '') => {
  if (decision !== null && !DECISIONES.includes(decision)) {
    throw new Error(`Decisión no válida: ${decision}`);
  }
  if (decision === 'Descartado' && !String(motivo).trim()) {
    throw new Error('Indica el motivo del descarte.');
  }

  try {
    return await actualizarPorId(id, {
      decision_operaciones: decision,
      motivo_decision: decision === 'Descartado' ? String(motivo).trim() : null
    });
  } catch (error) {
    throw traducirFaltaDeMigracion(error, { tabla: 'candidatos', archivo: 'migracion_decision_operaciones.sql' });
  }
};

// Asignación (solo admin; la base lo exige con el trigger de docs/migracion_asignacion.sql).
// reclutadorId / solicitudId vacíos o null dejan al candidato sin asignar. Solo se tocan las
// claves presentes: asignar el responsable no borra la solicitud ni al revés.
export const asignarCandidato = async (id, { reclutadorId, solicitudId } = {}) => {
  const cambios = {};
  if (reclutadorId !== undefined) cambios.reclutador_id = reclutadorId || null;
  if (solicitudId !== undefined) cambios.solicitud_id = solicitudId ? Number(solicitudId) : null;

  if (Object.keys(cambios).length === 0) {
    throw new Error('No hay datos para actualizar.');
  }

  return actualizarPorId(id, cambios);
};

// Campos editables (nombre en el formulario -> columna de la tabla). Cualquier otro se ignora,
// así un objeto de la UI con id, estado o cv_url no puede sobrescribir esas columnas.
const COLUMNAS_EDITABLES = {
  nombre: 'nombre_completo',
  nombre_completo: 'nombre_completo',
  cargo: 'cargo',
  email: 'email',
  telefono: 'telefono',
  familia: 'familia_cargo',
  familia_cargo: 'familia_cargo'
};

export const actualizarCandidato = async (id, datosActualizados) => {
  const cambios = {};
  Object.entries(datosActualizados ?? {}).forEach(([campo, valor]) => {
    const columna = COLUMNAS_EDITABLES[campo];
    if (columna && valor !== undefined) cambios[columna] = valor;
  });

  if (Object.keys(cambios).length === 0) {
    throw new Error('No hay datos para actualizar.');
  }

  return actualizarPorId(id, cambios);
};

const CODIGO_SIN_PERMISO_ELIMINAR = '42501';
const CODIGO_CON_REGISTROS_ASOCIADOS = '23503'; // violación de clave foránea

// Con RLS, un DELETE que ninguna política permite NO devuelve error: simplemente borra cero filas.
// Por eso se pide la fila eliminada (.select) y se falla si no hay ninguna.
// Ojo: el CV subido a Storage no se borra; solo se elimina el registro de la tabla.
export const eliminarCandidato = async (id) => {
  const { data, error } = await supabase.from('candidatos').delete().eq('id', id).select('id');

  if (error) {
    if (error.code === CODIGO_SIN_PERMISO_ELIMINAR) {
      throw new Error('Tu usuario no tiene permiso para eliminar candidatos (política de seguridad de la base de datos).');
    }
    if (error.code === CODIGO_CON_REGISTROS_ASOCIADOS) {
      throw new Error('No se puede eliminar: el candidato tiene registros asociados (solicitudes o evaluaciones).');
    }
    throw error;
  }

  if (!data || data.length === 0) {
    throw new Error('No se eliminó ningún registro. Revisa que exista y que tu usuario tenga el rol admin en la base (docs/asignar_roles_usuarios.sql).');
  }

  return data[0];
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

// La carpeta de Drive es opcional y se crea en segundo plano (fire-and-forget): el registro no
// espera al webhook. Si la carpeta no se crea o no se puede guardar el enlace, el candidato
// queda registrado igual (sin drive_folder_url). Nunca lanza ni deja una promesa rechazada.
const asociarCarpetaDrive = async (candidato) => {
  try {
    const folderUrl = await crearCarpetaDrive({ rut: candidato.rut, nombre: candidato.nombre_completo });
    if (folderUrl) await actualizarPorId(candidato.id, { drive_folder_url: folderUrl });
  } catch {
    // Silencioso a propósito: la carpeta es un extra y no debe afectar al registro.
  }
};

const CODIGO_COLUMNA_AUSENTE = 'PGRST204';

// `reclutadorId`: quien registra al candidato queda como su responsable, para que aparezca en su
// bandeja sin esperar a que el admin lo asigne. Si la columna aún no existe (migración de
// asignación pendiente) se reintenta sin ella, como antes.
export const crearCandidato = async (formData, archivoCv = null, { reclutadorId } = {}) => {
  const cv = archivoCv ? await subirCurriculum(archivoCv, formData.rut) : null;

  const fila = {
    nombre_completo: formData.nombreCompleto ?? formData.nombre,
    rut: formData.rut,
    cargo: formData.cargo,
    familia_cargo: formData.familiaCargo ?? formData.familia,
    email: formData.email,
    telefono: formData.telefono || null,
    cv_url: cv?.url ?? null
  };
  const insertar = (valores) => supabase.from('candidatos').insert(valores).select().single();

  let { data, error } = await insertar(reclutadorId ? { ...fila, reclutador_id: reclutadorId } : fila);
  if (error?.code === CODIGO_COLUMNA_AUSENTE && reclutadorId) {
    ({ data, error } = await insertar(fila));
  }

  if (error) {
    if (cv) await supabase.storage.from(BUCKET_CV).remove([cv.ruta]);
    throw error;
  }

  // Sin await: la latencia del webhook no se suma al guardado.
  asociarCarpetaDrive(data);

  return data;
};
