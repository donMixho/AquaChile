import { useState } from 'react'
import { Link } from 'react-router-dom'

export default function Candidatos() {
  // Datos ficticios obligatorios para el MVP académico
  const [candidatos] = useState([
    { id: 1, nombre: 'Josman Radatz', correo: 'jradatz@demo.com', telefono: '+56912345678', cargo: 'Operador de máquina', familiaCargo: 'Operario Calificado' },
    { id: 2, nombre: 'Marcos Fonseca', correo: 'mfonseca@demo.com', telefono: '+56987654321', cargo: 'Analista de Sistemas', familiaCargo: 'Profesional B C' },
    { id: 3, nombre: 'Ana Silva', correo: 'asilva@demo.com', telefono: '+56911223344', cargo: 'Jefe de SSO', familiaCargo: 'Jefatura' },
  ])

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Listado de Candidatos</h1>
        <Link
          to="/candidatos/nuevo"
          className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded transition-colors shadow-sm"
        >
          + Nuevo Candidato
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nombre</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contacto</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cargo al que postula</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Familia de Cargo</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {candidatos.map((candidato) => (
              <tr key={candidato.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">{candidato.nombre}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <div>{candidato.correo}</div>
                  <div className="text-xs">{candidato.telefono}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{candidato.cargo}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                    {candidato.familiaCargo}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button className="text-blue-600 hover:text-blue-900 mr-4">Editar</button>
                  <button className="text-green-600 hover:text-green-900">Solicitar Eval.</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}