import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { obtenerCandidatos } from '../services/candidatosService';

const Solicitudes = () => {
  const navigate = useNavigate();

  const [candidatos, setCandidatos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [errorCarga, setErrorCarga] = useState('');
  const [filtroFamilia, setFiltroFamilia] = useState('');
  const [fechaDesde, setFechaDesde] = useState('');
  const [fechaHasta, setFechaHasta] = useState('');

  useEffect(() => {
    let activo = true;

    obtenerCandidatos()
      .then((datos) => {
        if (activo) setCandidatos(datos);
      })
      .catch((error) => {
        if (activo) {
          setErrorCarga(error instanceof Error
            ? `No se pudieron cargar los candidatos: ${error.message}`
            : 'No se pudieron cargar los candidatos. Inténtalo nuevamente.');
        }
      })
      .finally(() => {
        if (activo) setCargando(false);
      });

    return () => {
      activo = false;
    };
  }, []);

  const fechaSolicitud = (candidato) =>
    candidato.created_at ? new Date(candidato.created_at).toLocaleDateString('en-CA') : '';

  const familias = useMemo(
    () => [...new Set(candidatos.map((c) => c.familia_cargo ?? c.familia).filter(Boolean))].sort(),
    [candidatos]
  );

  const candidatosFiltrados = candidatos.filter((c) =>
    (!filtroFamilia || (c.familia_cargo ?? c.familia) === filtroFamilia) &&
    (!fechaDesde || fechaSolicitud(c) >= fechaDesde) &&
    (!fechaHasta || fechaSolicitud(c) <= fechaHasta)
  );

  const claseFiltro = 'bg-white border border-gray-300 rounded-md px-3 py-1.5 text-sm text-gray-800 focus:border-aqua-orange';

  return (
    <div>
      {/* Título y Botón Principal Neón */}
      <div className="bg-white px-6 py-4 rounded-lg shadow-sm border border-gray-100 mb-6" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 className="text-aqua-blue font-bold" style={{
            margin: 0,
            fontSize: '28px'
          }}>
            Solicitudes de Evaluación
          </h1>
          <p style={{ color: '#6b7280', margin: '6px 0 0 0', fontSize: '14px' }}>
            Candidatos registrados disponibles para iniciar una evaluación psicolaboral.
          </p>
        </div>

        <button
          onClick={() => navigate('/solicitudes/nueva')}
          className="transition-all duration-200 hover:shadow-md hover:-translate-y-0.5"
          style={{
            background: '#f26522',
            color: '#FFFFFF',
            border: 'none',
            borderRadius: '10px',
            padding: '12px 22px',
            fontWeight: '800',
            fontSize: '14px',
            cursor: 'pointer'
          }}
        >
          + Nueva Solicitud
        </button>
      </div>

      {/* Filtros */}
      <div className="flex justify-end items-center gap-3 mb-3">
        <select
          aria-label="Filtrar por familia de cargo"
          value={filtroFamilia}
          onChange={(e) => setFiltroFamilia(e.target.value)}
          className={claseFiltro}
        >
          <option value="">Todas las familias</option>
          {familias.map((familia) => (
            <option key={familia} value={familia}>{familia}</option>
          ))}
        </select>
        <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-md px-2 py-1">
          <label className="flex items-center gap-1.5 text-sm text-aqua-blue font-medium">
            Desde
            <input
              type="date"
              value={fechaDesde}
              max={fechaHasta || undefined}
              onChange={(e) => setFechaDesde(e.target.value)}
              className={claseFiltro}
            />
          </label>
          <span className="text-gray-400">—</span>
          <label className="flex items-center gap-1.5 text-sm text-aqua-blue font-medium">
            Hasta
            <input
              type="date"
              value={fechaHasta}
              min={fechaDesde || undefined}
              onChange={(e) => setFechaHasta(e.target.value)}
              className={claseFiltro}
            />
          </label>
        </div>
        {(filtroFamilia || fechaDesde || fechaHasta) && (
          <button
            type="button"
            onClick={() => { setFiltroFamilia(''); setFechaDesde(''); setFechaHasta(''); }}
            className="text-sm text-aqua-orange hover:underline bg-transparent border-none cursor-pointer"
          >
            Limpiar
          </button>
        )}
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="bg-aqua-light border-b border-gray-200 text-aqua-blue text-xs uppercase tracking-wider">
              <th className="px-5 py-4">Candidato</th>
              <th className="px-5 py-4">RUT</th>
              <th className="px-5 py-4">Cargo / Familia</th>
              <th className="px-5 py-4">Correo</th>
              <th className="px-5 py-4">Fecha solicitud</th>
            </tr>
          </thead>
          <tbody>
            {cargando ? (
              <tr><td colSpan="5" className="p-6 text-center text-gray-500">Cargando candidatos...</td></tr>
            ) : errorCarga ? (
              <tr><td colSpan="5" role="alert" className="p-6 text-center text-red-700">{errorCarga}</td></tr>
            ) : candidatosFiltrados.length === 0 ? (
              <tr><td colSpan="5" className="p-6 text-center text-gray-500">
                {candidatos.length === 0 ? 'No hay candidatos registrados.' : 'Ninguna solicitud coincide con los filtros.'}
              </td></tr>
            ) : candidatosFiltrados.map((candidato) => (
              <tr key={candidato.id} className="border-b border-gray-100 text-sm">
                <td className="px-5 py-4 font-bold text-aqua-blue">
                  {candidato.nombre_completo ?? candidato.nombre}
                </td>
                <td className="px-5 py-4 text-gray-700">{candidato.rut}</td>
                <td className="px-5 py-4 text-gray-700">
                  <div>{candidato.cargo || '—'}</div>
                  <small className="text-gray-500">{candidato.familia_cargo ?? candidato.familia ?? '—'}</small>
                </td>
                <td className="px-5 py-4 text-gray-700">{candidato.email || '—'}</td>
                <td className="px-5 py-4 text-gray-700">{fechaSolicitud(candidato) || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Solicitudes;