import { useState } from 'react'
import { Link } from 'react-router-dom'

function Solicitudes() {
  const [solicitudes] = useState([
    {
      id: 1,
      candidato: 'Valentina Ruiz',
      cargo: 'Analista de Operaciones',
      fecha: '2026-09-18',
      estado: 'Pendiente',
      responsable: 'María López'
    },
    {
      id: 2,
      candidato: 'Mateo Flores',
      cargo: 'Ingeniero de Proyectos',
      fecha: '2026-09-20',
      estado: 'En proceso',
      responsable: 'Daniel Rojas'
    },
    {
      id: 3,
      candidato: 'Camila Ortega',
      cargo: 'Coordinador de Calidad',
      fecha: '2026-09-22',
      estado: 'Finalizada',
      responsable: 'Sofía Castro'
    }
  ])

  const estadoClasses = {
    Pendiente: 'bg-yellow-100 text-yellow-800',
    'En proceso': 'bg-blue-100 text-blue-800',
    Finalizada: 'bg-green-100 text-green-800'
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-slate-800">Solicitudes de Evaluación</h1>
        <Link
          to="/solicitudes/nueva"
          className="inline-flex items-center justify-center rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-sky-700"
        >
          + Nueva Solicitud
        </Link>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">Candidato</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">Cargo</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">Fecha de solicitud</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">Estado</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">Responsable</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">Acciones</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-200 bg-white">
            {solicitudes.map((solicitud) => (
              <tr key={solicitud.id} className="hover:bg-slate-50">
                <td className="px-4 py-3 text-sm font-medium text-slate-800">{solicitud.candidato}</td>
                <td className="px-4 py-3 text-sm text-slate-700">{solicitud.cargo}</td>
                <td className="px-4 py-3 text-sm text-slate-700">{solicitud.fecha}</td>
                <td className="px-4 py-3 text-sm">
                  <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${estadoClasses[solicitud.estado]}`}>
                    {solicitud.estado}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-slate-700">{solicitud.responsable}</td>
                <td className="px-4 py-3 text-sm">
                  <button type="button" className="font-medium text-sky-600 hover:text-sky-700">
                    Ver Detalle
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default Solicitudes
