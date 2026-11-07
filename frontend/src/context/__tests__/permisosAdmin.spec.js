import { PERMISOS, ROLES, tienePermiso } from '../permisos';

describe('Permisos: separación de funciones', () => {
  it('el admin supervisa, asigna, gestiona el equipo y elimina; no hace el trabajo operativo.', () => {
    [
      PERMISOS.VER_INICIO, PERMISOS.VER_SOLICITUDES, PERMISOS.CREAR_SOLICITUD, PERMISOS.VER_CANDIDATOS,
      PERMISOS.ELIMINAR_CANDIDATO, PERMISOS.CONFIGURACION, PERMISOS.GESTIONAR_EQUIPO, PERMISOS.ASIGNAR_CASOS
    ].forEach((permiso) => expect(tienePermiso(ROLES.ADMIN, permiso)).toBe(true));

    [PERMISOS.CREAR_CANDIDATO, PERMISOS.EDITAR_CANDIDATO, PERMISOS.EVALUAR, PERMISOS.DECIDIR_APTOS].forEach(
      (permiso) => expect(tienePermiso(ROLES.ADMIN, permiso)).toBe(false)
    );
  });

  it('solo el admin elimina, asigna y gestiona el equipo.', () => {
    [PERMISOS.ELIMINAR_CANDIDATO, PERMISOS.ASIGNAR_CASOS, PERMISOS.GESTIONAR_EQUIPO].forEach((permiso) => {
      expect(tienePermiso(ROLES.RECLUTADOR, permiso)).toBe(false);
      expect(tienePermiso(ROLES.OPERACIONES, permiso)).toBe(false);
    });
  });

  it('solo Operaciones decide sobre los aptos.', () => {
    expect(tienePermiso(ROLES.OPERACIONES, PERMISOS.DECIDIR_APTOS)).toBe(true);
    expect(tienePermiso(ROLES.RECLUTADOR, PERMISOS.DECIDIR_APTOS)).toBe(false);
    expect(tienePermiso(ROLES.ADMIN, PERMISOS.DECIDIR_APTOS)).toBe(false);
  });
});
