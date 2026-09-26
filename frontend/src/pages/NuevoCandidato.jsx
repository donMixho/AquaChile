import { Link } from 'react-router-dom'

function NuevoCandidato() {
  return (
    <div className="mx-auto max-w-3xl p-6">
      <h1 className="mb-6 text-2xl font-bold text-slate-800">Registrar Candidato</h1>

      <form className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="grid gap-5 md:grid-cols-2">
          <div className="md:col-span-2">
            <label className="mb-1 block text-sm font-medium text-slate-700">Nombre</label>
            <input
              type="text"
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
              placeholder="Ingrese el nombre completo"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Correo electrónico</label>
            <input
              type="email"
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
              placeholder="correo@ejemplo.com"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Teléfono</label>
            <input
              type="tel"
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
              placeholder="+56 9 1234 5678"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Cargo al que postula</label>
            <input
              type="text"
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
              placeholder="Ej: Analista de Operaciones"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Familia de cargo</label>
            <select
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
              defaultValue=""
            >
              <option value="" disabled>Selecciona una familia</option>
              <option value="Administración y Soporte">Administración y Soporte</option>
              <option value="Ingeniería">Ingeniería</option>
              <option value="Calidad y Procesos">Calidad y Procesos</option>
              <option value="Operaciones">Operaciones</option>
              <option value="Jefatura">Jefatura</option>
            </select>
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <Link
            to="/candidatos"
            className="inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            Cancelar
          </Link>
          <button
            type="submit"
            className="inline-flex items-center justify-center rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-sky-700"
          >
            Guardar Candidato
          </button>
        </div>
      </form>
    </div>
  )
}

export default NuevoCandidato
