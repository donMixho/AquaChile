import { useContext, useState } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import LogoAquaChile from './LogoAquaChile';
import AsistenteChat from './AsistenteChat';
import { AuthContext } from '../context/AuthContext';
import { ETIQUETAS_ROL, PERMISOS, tienePermiso } from '../context/permisos';
import {
  IconoCandidatos,
  IconoEquipo,
  IconoMenu,
  IconoResumen,
  IconoSalir,
  IconoVer
} from './Iconos';

// La jefatura mira, decide y gestiona al equipo: cuatro entradas. El trabajo operativo con
// solicitudes y candidatos (crear, editar, evaluar) es del reclutador y no está en este menú.
const GRUPOS = [
  [
    { name: 'Resumen', path: '/', icono: IconoResumen, exacto: true },
    { name: 'Seguimiento', path: '/seguimiento', icono: IconoCandidatos, permiso: PERMISOS.VER_CANDIDATOS },
    { name: 'Equipo y accesos', path: '/equipo', icono: IconoEquipo, permiso: PERMISOS.GESTIONAR_EQUIPO },
    { name: 'Auditoría', path: '/auditoria', icono: IconoVer, permiso: PERMISOS.VER_AUDITORIA }
  ]
];

const foco = 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-aqua-orange';

const EnlaceLateral = ({ item, activo, onClick }) => {
  const Icono = item.icono;
  return (
    <Link
      to={item.path}
      onClick={onClick}
      aria-current={activo ? 'page' : undefined}
      className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold no-underline transition-colors duration-200 ${foco} ${
        activo ? 'bg-white/12 text-white' : 'text-slate-300 hover:bg-white/8 hover:text-white'
      }`}
    >
      <Icono className={`h-5 w-5 shrink-0 ${activo ? 'text-aqua-orange' : ''}`} />
      {item.name}
    </Link>
  );
};

// Estructura propia del administrador: navegación lateral fija, pensada para gestionar, a
// diferencia del menú superior que usan reclutador y operaciones.
const AdminLayout = () => {
  const location = useLocation();
  const auth = useContext(AuthContext);
  const [abierto, setAbierto] = useState(false);

  const rol = auth?.rol;
  const esActivo = (item) =>
    item.exacto ? location.pathname === item.path : location.pathname.startsWith(item.path);
  const cerrar = () => setAbierto(false);

  const grupos = GRUPOS.map((g) => g.filter((i) => !i.permiso || tienePermiso(rol, i.permiso))).filter(
    (g) => g.length > 0
  );

  return (
    <div className="min-h-screen bg-aqua-light font-sans text-aqua-blue">
      <header className="sticky top-0 z-40 flex items-center justify-between border-b border-white/10 bg-aqua-dark px-4 py-3 md:hidden">
        <Link to="/" aria-label="AquaChile - Resumen" className={`flex items-center no-underline ${foco}`}>
          <LogoAquaChile sobreOscuro />
        </Link>
        <button
          type="button"
          aria-label="Abrir menú"
          aria-expanded={abierto}
          aria-controls="barra-lateral"
          onClick={() => setAbierto(!abierto)}
          className={`cursor-pointer rounded-lg border-none bg-transparent p-2 text-white ${foco}`}
        >
          <IconoMenu className="h-6 w-6" />
        </button>
      </header>

      {abierto && (
        <button
          type="button"
          aria-label="Cerrar menú"
          onClick={cerrar}
          className="fixed inset-0 z-40 cursor-default border-none bg-aqua-dark/60 md:hidden"
        />
      )}

      <aside
        id="barra-lateral"
        aria-label="Panel de administración"
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-aqua-dark text-white transition-transform duration-200 ease-out md:translate-x-0 ${
          abierto ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="px-5 pb-5 pt-6">
          <Link to="/" aria-label="AquaChile - Resumen" onClick={cerrar} className={`inline-flex no-underline ${foco}`}>
            <LogoAquaChile sobreOscuro />
          </Link>
        </div>

        <nav aria-label="Navegación principal" className="flex flex-1 flex-col gap-1 overflow-y-auto px-3">
          {grupos.map((grupo, i) => (
            <div key={i} className={`flex flex-col gap-1 ${i > 0 ? 'mt-3 border-t border-white/10 pt-4' : ''}`}>
              {grupo.map((item) => (
                <EnlaceLateral key={item.path} item={item} activo={esActivo(item)} onClick={cerrar} />
              ))}
            </div>
          ))}
        </nav>

        <div className="border-t border-white/10 px-5 py-4">
          <p data-testid="rol-actual" className="m-0 text-sm font-bold text-white">
            {rol ? ETIQUETAS_ROL[rol] : 'Sesión'}
          </p>
          {auth?.user?.email && (
            <p className="m-0 mt-0.5 truncate text-xs text-slate-300" title={auth.user.email}>
              {auth.user.email}
            </p>
          )}
          {auth && (
            <button
              type="button"
              onClick={() => auth.signOut()}
              className={`mt-3 inline-flex cursor-pointer items-center gap-2 rounded-lg border border-white/25 bg-transparent px-3 py-2 text-sm font-semibold text-slate-200 transition-colors duration-200 hover:bg-white/10 hover:text-white ${foco}`}
            >
              <IconoSalir className="h-4 w-4" />
              Cerrar sesión
            </button>
          )}
        </div>
      </aside>

      <main className="min-h-screen px-4 py-6 md:ml-64 md:px-8 md:py-8">
        <div className="mx-auto w-full max-w-[1100px]">
          <Outlet />
        </div>
      </main>

      <AsistenteChat />
    </div>
  );
};

export default AdminLayout;
