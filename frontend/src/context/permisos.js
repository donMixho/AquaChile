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
  CONFIGURACION: 'configuracion',
  GESTIONAR_EQUIPO: 'gestionar_equipo',
  ASIGNAR_CASOS: 'asignar_casos',
  DECIDIR_APTOS: 'decidir_aptos',
  VER_AUDITORIA: 'ver_auditoria'
};

const {
  VER_INICIO, VER_SOLICITUDES, CREAR_SOLICITUD, VER_CANDIDATOS,
  CREAR_CANDIDATO, EDITAR_CANDIDATO, EVALUAR, DECIDIR_APTOS
} = PERMISOS;

const PERMISOS_POR_ROL = {
  // Jefatura: supervisa, asigna, gestiona al equipo y es la única que elimina. No hace el trabajo
  // operativo (registrar candidatos, entrevistar) ni la decisión de Operaciones. A nivel de base de
  // datos conserva acceso amplio como respaldo; la interfaz solo le muestra lo de supervisión.
  [ROLES.ADMIN]: Object.values(PERMISOS).filter(
    (permiso) => ![CREAR_CANDIDATO, EDITAR_CANDIDATO, EVALUAR, DECIDIR_APTOS].includes(permiso)
  ),
  // Registra y evalúa candidatos, pero no elimina ni configura.
  [ROLES.RECLUTADOR]: [
    VER_INICIO, VER_SOLICITUDES, CREAR_SOLICITUD, VER_CANDIDATOS, CREAR_CANDIDATO, EDITAR_CANDIDATO, EVALUAR
  ],
  // Recibe a los aptos y decide si los selecciona o descarta. No crea, edita, evalúa ni elimina.
  [ROLES.OPERACIONES]: [VER_INICIO, VER_SOLICITUDES, VER_CANDIDATOS, DECIDIR_APTOS]
};

// Un rol desconocido o ausente no tiene ningún permiso.
export const tienePermiso = (rol, permiso) => Boolean(PERMISOS_POR_ROL[rol]?.includes(permiso));

// Nombre visible de cada rol (insignia del encabezado).
export const ETIQUETAS_ROL = {
  [ROLES.ADMIN]: 'Administrador',
  [ROLES.RECLUTADOR]: 'Reclutador',
  [ROLES.OPERACIONES]: 'Operaciones'
};
