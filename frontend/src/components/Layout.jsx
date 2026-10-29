import { useContext, useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import LogoAquaChile from './LogoAquaChile';
import { AuthContext, ROLES_RRHH } from '../context/AuthContext';

// `roles` limita qué rol ve el enlace; sin `roles` lo ven todos.
const navLinks = [
  { name: 'Inicio', path: '/' },
  { name: 'Solicitudes', path: '/solicitudes' },
  { name: 'Candidatos', path: '/candidatos', roles: ROLES_RRHH }
];

const NavItem = ({ item, activo, onClick }) => (
  <Link
    to={item.path}
    onClick={onClick}
    aria-current={activo ? 'page' : undefined}
    className={`px-5 py-2 rounded-full text-sm font-semibold no-underline transition-all duration-200 hover:shadow-md ${
      activo
        ? 'bg-white/15 text-white border-b-2 border-aqua-orange'
        : 'text-gray-300 hover:text-white hover:bg-white/10'
    }`}
  >
    {item.name}
  </Link>
);

const Layout = () => {
  const location = useLocation();
  const [menuAbierto, setMenuAbierto] = useState(false);
  // Opcional: sin AuthProvider (p. ej. en pruebas) se muestran todos los enlaces y no hay botón de salida.
  const auth = useContext(AuthContext);
  const enlaces = navLinks.filter((l) => !l.roles || !auth || l.roles.includes(auth.rol));

  const botonSalir = auth && (
    <button
      type="button"
      onClick={() => auth.signOut()}
      className="px-4 py-2 rounded-full text-sm font-semibold text-gray-300 hover:text-white hover:bg-white/10 bg-transparent border border-white/20 cursor-pointer"
    >
      Cerrar sesión
    </button>
  );

  return (
    <div className="min-h-screen flex flex-col bg-aqua-light text-aqua-blue font-sans">
      <header className="sticky top-0 z-50 bg-aqua-dark text-white border-b-2 border-aqua-orange shadow-md">
        <div className="min-h-[74px] px-4 md:px-8 flex items-center justify-between">
          <Link to="/" aria-label="AquaChile - Inicio" className="flex items-center no-underline">
            <LogoAquaChile sobreOscuro />
          </Link>

          <button
            type="button"
            aria-label="Abrir menú"
            aria-expanded={menuAbierto}
            onClick={() => setMenuAbierto(!menuAbierto)}
            className="md:hidden text-white text-2xl bg-transparent border-none cursor-pointer"
          >
            {menuAbierto ? '✕' : '☰'}
          </button>

          <nav aria-label="Navegación principal" className="hidden md:flex gap-3">
            {enlaces.map((item) => (
              <NavItem key={item.name} item={item} activo={location.pathname === item.path} />
            ))}
            {botonSalir}
          </nav>
        </div>

        {menuAbierto && (
          <nav aria-label="Navegación móvil" className="md:hidden flex flex-col gap-1 px-4 pb-4">
            {enlaces.map((item) => (
              <NavItem
                key={item.name}
                item={item}
                activo={location.pathname === item.path}
                onClick={() => setMenuAbierto(false)}
              />
            ))}
            {botonSalir}
          </nav>
        )}
      </header>

      <main className="flex-1 w-full max-w-[1200px] mx-auto px-4 md:px-6 py-6 md:py-8">
        <Outlet />
      </main>

      <footer className="bg-aqua-dark text-gray-300 text-center text-xs py-4 px-4">
        AquaChile S.A. &copy; 2026 • Sistema de Evaluación Psicolaboral Automatizado
      </footer>
    </div>
  );
};

export default Layout;
