import { Outlet, Link, useLocation } from 'react-router-dom';
import LogoAquaChile from './LogoAquaChile';

const navLinks = [
  { name: 'Dashboard', path: '/' },
  { name: 'Solicitudes', path: '/solicitudes' },
  { name: 'Candidatos', path: '/candidatos' }
];

const Layout = () => {
  const location = useLocation();

  return (
    <div className="min-h-screen flex flex-col bg-aqua-light text-aqua-blue font-sans">
      <header className="sticky top-0 z-50 h-[74px] px-8 flex items-center justify-between bg-aqua-dark text-white border-b-2 border-aqua-orange shadow-md">
        <Link to="/" className="no-underline">
          <LogoAquaChile />
        </Link>

        <nav className="flex gap-3">
          {navLinks.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.name}
                to={item.path}
                className={`px-5 py-2 rounded-full text-sm font-semibold no-underline transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 ${
                  isActive
                    ? 'bg-white/15 text-white border-b-2 border-aqua-orange'
                    : 'text-gray-300 hover:text-white hover:bg-white/10'
                }`}
              >
                {item.name}
              </Link>
            );
          })}
        </nav>
      </header>

      <main className="flex-1 w-full max-w-[1200px] mx-auto px-6 py-8">
        <Outlet />
      </main>

      <footer className="bg-aqua-dark text-gray-300 text-center text-xs py-4">
        AquaChile S.A. &copy; 2026 • Sistema de Evaluación Psicolaboral Automatizado
      </footer>
    </div>
  );
};

export default Layout;
