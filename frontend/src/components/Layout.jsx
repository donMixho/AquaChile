import { Link, Outlet } from 'react-router-dom'
import logo from '../assets/logo-aquachile.png'

export default function Layout() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Barra de navegación */}
      <nav className="bg-blue-800 text-white py-3 shadow-md">
        <div className="container mx-auto flex items-center justify-between">
          <div className="font-bold text-xl tracking-wide min-w-[180px]">
            AquaChile VcM
          </div>

          <div className="flex-1 flex justify-center">
            <div className="bg-white rounded-full w-16 h-16 shadow-md overflow-hidden flex items-center justify-center">
              <img src={logo} alt="Logo AquaChile" className="w-full h-full object-contain p-1.5" />
            </div>
          </div>

          <div className="flex gap-6 font-medium min-w-[180px] justify-end">
            <Link to="/" className="hover:text-blue-200 transition-colors">Dashboard</Link>
            <Link to="/candidatos" className="hover:text-blue-200 transition-colors">Candidatos</Link>
            <Link to="/solicitudes" className="hover:text-blue-200 transition-colors">Solicitudes</Link>
          </div>
        </div>
      </nav>

      {/* Contenedor dinámico de las vistas */}
      <main className="container mx-auto p-6 flex-grow">
        <Outlet />
      </main>
    </div>
  )
}