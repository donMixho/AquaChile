import { useContext } from 'react';
import { Link, NavLink, Outlet } from 'react-router-dom';
import LogoAquaChile from './LogoAquaChile';
import AsistenteChat from './AsistenteChat';
import { AuthContext, usePuede } from '../context/AuthContext';
import { ETIQUETAS_ROL, PERMISOS } from '../context/permisos';

const foco = 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-aqua-orange';

const ENLACES = [
  { name: 'Por decidir', path: '/', exacto: true },
  { name: 'Candidatos', path: '/candidatos', permiso: PERMISOS.VER_CANDIDATOS }
];

// Dos opciones nada más, como un selector: Operaciones decide, no navega.
const Opcion = ({ item }) => (
  <NavLink
    to={item.path}
    end={item.exacto}
    className={({ isActive }) =>
      `rounded-full px-4 py-1.5 text-sm font-semibold no-underline transition-colors duration-200 ${foco} ${
        isActive ? 'bg-white text-aqua-dark' : 'text-slate-200 hover:bg-white/10 hover:text-white'
      }`
    }
  >
    {item.name}
  </NavLink>
);

// Estructura de Operaciones: una sola columna angosta y centrada, pensada para leer y decidir.
// Cabecera oscura, sin pestañas de trabajo ni acción de crear: es lo que la separa del
// reclutador (cabecera clara, pestañas y botón de registro) y del admin (barra lateral).
const OperacionesLayout = () => {
  const auth = useContext(AuthContext);
  const puede = usePuede();
  const enlaces = ENLACES.filter((l) => !l.permiso || puede(l.permiso));
  const etiquetaRol = auth?.rol ? ETIQUETAS_ROL[auth.rol] : null;

  return (
    <div className="flex min-h-screen flex-col bg-[#eef2f6] font-sans text-aqua-blue">
      <header className="bg-aqua-dark text-white">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-x-6 gap-y-3 px-4 py-3 md:px-6">
          <Link to="/" aria-label="AquaChile - Por decidir" className={`flex items-center no-underline ${foco}`}>
            <LogoAquaChile size="small" sobreOscuro />
          </Link>

          <nav aria-label="Navegación principal" className="flex items-center gap-1 rounded-full bg-white/10 p-1">
            {enlaces.map((item) => (
              <Opcion key={item.path} item={item} />
            ))}
          </nav>

          <div className="flex items-center gap-3">
            {etiquetaRol && (
              <span data-testid="rol-actual" title={`Sesión iniciada como ${etiquetaRol}`} className="text-sm font-semibold text-slate-200">
                {etiquetaRol}
              </span>
            )}
            {auth && (
              <button
                type="button"
                onClick={() => auth.signOut()}
                className={`cursor-pointer rounded-lg border border-white/30 bg-transparent px-3 py-1.5 text-sm font-semibold text-white hover:bg-white/10 ${foco}`}
              >
                Cerrar sesión
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 md:px-6 md:py-10">
        <Outlet />
      </main>

      <AsistenteChat />
    </div>
  );
};

export default OperacionesLayout;
