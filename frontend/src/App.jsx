import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import Candidatos from './pages/Candidatos'
import Solicitudes from './pages/Solicitudes'
import NuevoCandidato from './pages/NuevoCandidato'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="candidatos" element={<Candidatos />} />
          <Route path="candidatos/nuevo" element={<NuevoCandidato />} />
          <Route path="solicitudes" element={<Solicitudes />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App