import { Link } from 'react-router-dom';

export default function DetalleSolicitud() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Detalle de Solicitud y Evaluación</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Sección Izquierda: Antecedentes */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-700 mb-4 border-b pb-2">Antecedentes del Candidato</h2>
          <div className="space-y-4">
            <div>
              <span className="text-sm text-gray-500 block">Nombre</span>
              <span className="font-medium text-gray-900">Leandro Ruiz</span>
            </div>
            <div>
              <span className="text-sm text-gray-500 block">Correo</span>
              <span className="text-gray-900">leandro.ruiz@demo.cl</span>
            </div>
            <div>
              <span className="text-sm text-gray-500 block">Teléfono</span>
              <span className="text-gray-900">+56 9 8765 4321</span>
            </div>
            <div>
              <span className="text-sm text-gray-500 block">Cargo al que postula</span>
              <span className="text-gray-900">Analista de Operaciones</span>
            </div>
            <div>
              <span className="text-sm text-gray-500 block">Familia de cargo</span>
              <span className="px-3 py-1 inline-flex bg-blue-100 text-blue-800 rounded-full text-xs font-semibold mt-1">
                Administración y Soporte
              </span>
            </div>
          </div>
        </div>

        {/* Sección Derecha: Formulario de Evaluación */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-700 mb-4 border-b pb-2">Registro de Evaluación</h2>
          <form className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Estado de la solicitud</label>
              <select className="w-full border border-gray-300 rounded-md p-2.5 focus:ring-blue-500 focus:border-blue-500 bg-white">
                <option>Pendiente</option>
                <option>En proceso</option>
                <option>Finalizada</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fecha de evaluación</label>
              <input type="date" className="w-full border border-gray-300 rounded-md p-2.5 focus:ring-blue-500 focus:border-blue-500" />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Observaciones y Resultados</label>
              <textarea 
                rows="4" 
                className="w-full border border-gray-300 rounded-md p-2.5 focus:ring-blue-500 focus:border-blue-500" 
                placeholder="Ingrese observaciones, hallazgos y resultados de la evaluación..."
              ></textarea>
            </div>
            
            <div className="flex gap-4 pt-4 mt-2">
              <button type="button" className="bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-6 rounded transition-colors shadow-sm">
                Guardar Evaluación
              </button>
              <Link to="/solicitudes" className="bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium py-2 px-6 rounded transition-colors text-center border border-gray-300">
                Volver al listado
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}