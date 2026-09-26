import { Link, Outlet } from 'react-router-dom'

export default function Layout() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Barra de navegación */}
      <nav className="bg-blue-800 text-white p-4 shadow-md">
        <div className="container mx-auto flex items-center justify-between">
          <div className="font-bold text-xl tracking-wide">
            AquaChile VcM
          </div>
          <div className="flex gap-6 font-medium">
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