import { PERMISOS, ROLES, tienePermiso } from '../permisos';
import { obtenerRol } from '../AuthContext';

describe('Permisos por rol (RBAC)', () => {
  it('40. El admin tiene todos los permisos.', () => {
    Object.values(PERMISOS).forEach((permiso) => {
      expect(tienePermiso(ROLES.ADMIN, permiso)).toBe(true);
    });
  });

  it('41. El reclutador registra y evalúa, pero no elimina ni configura.', () => {
    [PERMISOS.VER_CANDIDATOS, PERMISOS.CREAR_CANDIDATO, PERMISOS.EDITAR_CANDIDATO, PERMISOS.EVALUAR].forEach(
      (permiso) => expect(tienePermiso(ROLES.RECLUTADOR, permiso)).toBe(true)
    );
    expect(tienePermiso(ROLES.RECLUTADOR, PERMISOS.ELIMINAR_CANDIDATO)).toBe(false);
    expect(tienePermiso(ROLES.RECLUTADOR, PERMISOS.CONFIGURACION)).toBe(false);
  });

  it('42. Operaciones es de solo lectura.', () => {
    [PERMISOS.VER_INICIO, PERMISOS.VER_SOLICITUDES, PERMISOS.VER_CANDIDATOS].forEach((permiso) =>
      expect(tienePermiso(ROLES.OPERACIONES, permiso)).toBe(true)
    );
    [
      PERMISOS.CREAR_SOLICITUD, PERMISOS.CREAR_CANDIDATO, PERMISOS.EDITAR_CANDIDATO,
      PERMISOS.EVALUAR, PERMISOS.ELIMINAR_CANDIDATO, PERMISOS.CONFIGURACION
    ].forEach((permiso) => expect(tienePermiso(ROLES.OPERACIONES, permiso)).toBe(false));
  });

  it('43. Un rol desconocido o ausente no tiene ningún permiso.', () => {
    expect(tienePermiso('superusuario', PERMISOS.VER_SOLICITUDES)).toBe(false);
    expect(tienePermiso(null, PERMISOS.VER_SOLICITUDES)).toBe(false);
    expect(tienePermiso(undefined, PERMISOS.EVALUAR)).toBe(false);
  });

  it('44. El rol sale de app_metadata, con respaldo por correo, e ignora user_metadata.', () => {
    expect(obtenerRol({ email: 'x@y.cl', app_metadata: { rol: 'reclutador' } })).toBe('reclutador');
    expect(obtenerRol({ email: 'Admin@AquaChile.cl', app_metadata: {} })).toBe('admin');
    // Un usuario no puede darse rol de admin editando su propio user_metadata.
    expect(obtenerRol({ email: 'otro@y.cl', app_metadata: {}, user_metadata: { rol: 'admin' } })).toBeNull();
    expect(obtenerRol(null)).toBeNull();
    expect(obtenerRol({ email: 'operaciones@aquachile.cl', app_metadata: {} })).toBe('operaciones');
    expect(obtenerRol({ email: 'x@y.cl', app_metadata: { rol: 'operaciones' } })).toBe('operaciones');
  });
});
