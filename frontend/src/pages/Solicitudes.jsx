import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { obtenerSolicitudes } from '../services/solicitudesService';
import { usePuede } from '../context/AuthContext';
import { PERMISOS } from '../context/permisos';
import BotonIcono from '../components/BotonIcono';
import InsigniaSolicitud from '../components/InsigniaSolicitud';
import ListaEvaluaciones from '../components/ListaEvaluaciones';
import { IconoVer } from '../components/Iconos';

const PESTANAS = [
  ['cargos', 'Solicitudes de cargo'],
  ['candidatos', 'Candidatos por evaluar']
];

const ListaSolicitudes = () => {
  const [solicitudes, setSolicitudes] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [errorCarga, setErrorCarga] = useState('');

  useEffect(() => {
    let activo = true;

    obtenerSolicitudes()
      .then((datos) => {
        if (activo) setSolicitudes(datos);
      })
      .catch((error) => {
        if (activo) setErrorCarga(error.message);
      })
      .finally(() => {
        if (activo) setCargando(false);
      });

    return () => {
      activo = false;
    };
  }, []);

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-x-auto">
      <table className="w-full min-w-[640px] border-collapse text-left">
        <thead>
          <tr className="bg-aqua-light border-b border-gray-200 text-aqua-blue text-xs uppercase tracking-wider">
            <th className="px-5 py-4">Solicitud</th>
            <th className="px-5 py-4">Cargo / Familia</th>
            <th className="px-5 py-4">Vacantes</th>
            <th className="px-5 py-4">Fecha</th>
            <th className="px-5 py-4">Estado</th>
            <th className="px-5 py-4 text-center">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {cargando ? (
            <tr><td colSpan="6" className="p-6 text-center text-gray-500">Cargando solicitudes...</td></tr>
          ) : errorCarga ? (
            <tr><td colSpan="6" role="alert" className="p-6 text-center text-red-700">{errorCarga}</td></tr>
          ) : solicitudes.length === 0 ? (
            <tr><td colSpan="6" className="p-6 text-center text-gray-500">No hay solicitudes registradas.</td></tr>
          ) : solicitudes.map((s) => (
            <tr key={s.id} className="border-b border-gray-100 text-sm">
              <td className="px-5 py-4 font-bold text-aqua-blue">{s.titulo}</td>
              <td className="px-5 py-4 text-gray-700">
                <div>{s.cargo}</div>
                <small className="text-gray-500">{s.familia_cargo}</small>
              </td>
              <td className="px-5 py-4 text-gray-700">{s.vacantes}</td>
              <td className="px-5 py-4 text-gray-700">
                {s.created_at ? new Date(s.created_at).toLocaleDateString('en-CA') : '—'}
              </td>
              <td className="px-5 py-4"><InsigniaSolicitud estado={s.estado} /></td>
              <td className="px-5 py-4">
                <div className="flex gap-1 justify-center">
                  <BotonIcono
                    icono={IconoVer}
                    etiqueta={`Ver detalle de la solicitud ${s.titulo}`}
                    tono="gris"
                    to={`/solicitudes/${s.id}`}
                  />
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const Solicitudes = () => {
  const navigate = useNavigate();
  const puedeCrear = usePuede()(PERMISOS.CREAR_SOLICITUD);
  const [pestana, setPestana] = useState(useLocation().state?.pestana ?? 'cargos');

  return (
    <div>
      <div className="bg-white px-6 py-4 rounded-lg shadow-sm border border-gray-100 mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-aqua-blue font-bold" style={{ margin: 0, fontSize: '28px' }}>
            Solicitudes de Evaluación
          </h1>
          <p style={{ color: '#6b7280', margin: '6px 0 0 0', fontSize: '14px' }}>
            Requerimientos de cargo y candidatos disponibles para iniciar una evaluación psicolaboral.
          </p>
        </div>

        {puedeCrear && (
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
        )}
      </div>

      <div role="group" aria-label="Vista de solicitudes" className="flex gap-2 mb-4">
        {PESTANAS.map(([clave, etiqueta]) => (
          <button
            key={clave}
            type="button"
            aria-pressed={pestana === clave}
            onClick={() => setPestana(clave)}
            className={`px-4 py-2 rounded-lg text-sm font-bold border cursor-pointer ${
              pestana === clave
                ? 'bg-aqua-blue text-white border-aqua-blue'
                : 'bg-white text-aqua-blue border-gray-200'
            }`}
          >
            {etiqueta}
          </button>
        ))}
      </div>

      {pestana === 'cargos' ? <ListaSolicitudes /> : <ListaEvaluaciones />}
    </div>
  );
};

export default Solicitudes;
