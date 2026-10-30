import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { PERMISOS } from './context/permisos'
import ProtectedRoute from './components/ProtectedRoute'
import Layout from './components/Layout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Candidatos from './pages/Candidatos'
import Solicitudes from './pages/Solicitudes'
import NuevoCandidato from './pages/NuevoCandidato'
import NuevaSolicitud from './pages/NuevaSolicitud'
import DetalleSolicitud from './pages/DetalleSolicitud'
import DetalleEvaluacion from './pages/DetalleEvaluacion'

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />

          {/* Todo lo demás exige sesión; cada grupo exige además un permiso (ver context/permisos.js) */}
          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<Layout />}>
              <Route index element={<Dashboard />} />

              <Route element={<ProtectedRoute permiso={PERMISOS.VER_SOLICITUDES} />}>
                <Route path="solicitudes" element={<Solicitudes />} />
                <Route path="solicitudes/:id" element={<DetalleSolicitud />} />
              </Route>
              <Route element={<ProtectedRoute permiso={PERMISOS.CREAR_SOLICITUD} />}>
                <Route path="solicitudes/nueva" element={<NuevaSolicitud />} />
              </Route>

              <Route element={<ProtectedRoute permiso={PERMISOS.VER_CANDIDATOS} />}>
                <Route path="candidatos" element={<Candidatos />} />
              </Route>
              <Route element={<ProtectedRoute permiso={PERMISOS.CREAR_CANDIDATO} />}>
                <Route path="candidatos/nuevo" element={<NuevoCandidato />} />
              </Route>
              <Route element={<ProtectedRoute permiso={PERMISOS.EVALUAR} />}>
                <Route path="solicitudes/:id/evaluar" element={<DetalleEvaluacion />} />
              </Route>
            </Route>
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
