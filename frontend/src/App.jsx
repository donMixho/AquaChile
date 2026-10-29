import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider, ROLES_RRHH } from './context/AuthContext'
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

          {/* Todo lo demás exige sesión; cada grupo restringe por rol */}
          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<Layout />}>
              <Route index element={<Dashboard />} />
              <Route path="solicitudes" element={<Solicitudes />} />
              <Route path="solicitudes/nueva" element={<NuevaSolicitud />} />
              <Route path="solicitudes/:id" element={<DetalleSolicitud />} />

              <Route element={<ProtectedRoute allowedRoles={ROLES_RRHH} />}>
                <Route path="candidatos" element={<Candidatos />} />
                <Route path="candidatos/nuevo" element={<NuevoCandidato />} />
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
