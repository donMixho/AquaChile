import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { PERMISOS, ROLES } from './context/permisos'
import ProtectedRoute from './components/ProtectedRoute'
import { AEntrevista, CandidatosPorRol, InicioPorRol, LayoutPorRol } from './components/PorRol'
import AdminEquipo from './pages/AdminEquipo'
import AdminAuditoria from './pages/AdminAuditoria'
import AdminSeguimiento from './pages/AdminSeguimiento'
import Entrevista from './pages/Entrevista'
import DefinirContrasena from './pages/DefinirContrasena'
import Login from './pages/Login'
import Solicitudes from './pages/Solicitudes'
import NuevoCandidato from './pages/NuevoCandidato'
import NuevaSolicitud from './pages/NuevaSolicitud'
import DetalleSolicitud from './pages/DetalleSolicitud'

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/definir-contrasena" element={<DefinirContrasena />} />

          {/* Todo lo demás exige sesión; cada grupo exige además un permiso (ver context/permisos.js) */}
          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<LayoutPorRol />}>
              <Route index element={<InicioPorRol />} />

              <Route element={<ProtectedRoute permiso={PERMISOS.GESTIONAR_EQUIPO} />}>
                <Route path="equipo" element={<AdminEquipo />} />
              </Route>
              <Route element={<ProtectedRoute permiso={PERMISOS.VER_AUDITORIA} />}>
                <Route path="auditoria" element={<AdminAuditoria />} />
              </Route>
              <Route element={<ProtectedRoute allowedRoles={[ROLES.ADMIN]} />}>
                <Route path="seguimiento" element={<AdminSeguimiento />} />
              </Route>

              <Route element={<ProtectedRoute permiso={PERMISOS.VER_SOLICITUDES} />}>
                <Route path="solicitudes" element={<Solicitudes />} />
                <Route path="solicitudes/:id" element={<DetalleSolicitud />} />
              </Route>
              <Route element={<ProtectedRoute permiso={PERMISOS.CREAR_SOLICITUD} />}>
                <Route path="solicitudes/nueva" element={<NuevaSolicitud />} />
              </Route>

              <Route element={<ProtectedRoute permiso={PERMISOS.VER_CANDIDATOS} />}>
                <Route path="candidatos" element={<CandidatosPorRol />} />
              </Route>
              <Route element={<ProtectedRoute permiso={PERMISOS.CREAR_CANDIDATO} />}>
                <Route path="candidatos/nuevo" element={<NuevoCandidato />} />
              </Route>
              <Route element={<ProtectedRoute permiso={PERMISOS.EVALUAR} />}>
                <Route path="entrevista/:id" element={<Entrevista />} />
                <Route path="solicitudes/:id/evaluar" element={<AEntrevista />} />
              </Route>
            </Route>
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
