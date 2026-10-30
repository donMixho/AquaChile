// Fuente única de roles y permisos (RBAC). Las rutas, el menú y los botones preguntan por
// permisos, no por nombres de rol: para cambiar quién puede qué basta editar PERMISOS_POR_ROL.
export const ROLES = {
  ADMIN: 'admin',
  RECLUTADOR: 'reclutador',
  OPERACIONES: 'operaciones'
};

export const PERMISOS = {
  VER_INICIO: 'ver_inicio',
  VER_SOLICITUDES: 'ver_solicitudes',
  CREAR_SOLICITUD: 'crear_solicitud',
  VER_CANDIDATOS: 'ver_candidatos',
  CREAR_CANDIDATO: 'crear_candidato',
  EDITAR_CANDIDATO: 'editar_candidato',
  EVALUAR: 'evaluar',
  ELIMINAR_CANDIDATO: 'eliminar_candidato',
  CONFIGURACION: 'configuracion'
};

const {
  VER_INICIO, VER_SOLICITUDES, CREAR_SOLICITUD, VER_CANDIDATOS,
  CREAR_CANDIDATO, EDITAR_CANDIDATO, EVALUAR
} = PERMISOS;

const PERMISOS_POR_ROL = {
  // Todo, incluido borrado y configuración avanzada (exclusivos del admin).
  [ROLES.ADMIN]: Object.values(PERMISOS),
  // Registra y evalúa candidatos, pero no elimina ni configura.
  [ROLES.RECLUTADOR]: [
    VER_INICIO, VER_SOLICITUDES, CREAR_SOLICITUD, VER_CANDIDATOS, CREAR_CANDIDATO, EDITAR_CANDIDATO, EVALUAR
  ],
  // Solo lectura: Inicio, solicitudes y candidatos. No crea, edita, evalúa ni elimina nada.
  [ROLES.OPERACIONES]: [VER_INICIO, VER_SOLICITUDES, VER_CANDIDATOS]
};

// Un rol desconocido o ausente no tiene ningún permiso.
export const tienePermiso = (rol, permiso) => Boolean(PERMISOS_POR_ROL[rol]?.includes(permiso));
