import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { usePuede } from '../context/AuthContext';
import { PERMISOS } from '../context/permisos';
import { IconoEvaluar } from '../components/Iconos';
import { obtenerSolicitudPorId } from '../services/solicitudesService';
import Alerta from '../components/Alerta';
import InsigniaSolicitud from '../components/InsigniaSolicitud';

const Dato = ({ etiqueta, children }) => (
  <div>
    <dt className="text-xs font-semibold uppercase tracking-wider text-slate-600">{etiqueta}</dt>
    <dd className="m-0 mt-1 text-slate-900">{children}</dd>
  </div>
);

const DetalleSolicitud = () => {
  const { id } = useParams();
  const puedeEvaluar = usePuede()(PERMISOS.EVALUAR);
  const [solicitud, setSolicitud] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [errorCarga, setErrorCarga] = useState('');

  useEffect(() => {
    let activo = true;

    obtenerSolicitudPorId(id)
      .then((dato) => {
        if (activo) setSolicitud(dato);
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
  }, [id]);

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex flex-wrap gap-3" aria-label="Acciones de la solicitud" role="group">
        <Link
          to="/solicitudes"
          aria-label="Volver al listado de solicitudes"
          className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 no-underline transition-all hover:bg-slate-50 hover:shadow-sm"
        >
          <span aria-hidden="true">←</span> Volver
        </Link>
        {puedeEvaluar && (
          <Link
            to="/solicitudes"
            state={{ pestana: 'candidatos' }}
            aria-label="Evaluar candidatos de esta solicitud"
            className="inline-flex items-center gap-2 rounded-lg bg-[#F26522] px-4 py-2 text-sm font-semibold text-white no-underline shadow-sm transition-all hover:bg-[#d9561a] hover:shadow"
          >
            <IconoEvaluar className="w-4 h-4" /> Evaluar candidatos
          </Link>
        )}
      </div>

      {cargando ? (
        <p className="mt-6 text-slate-600">Cargando solicitud...</p>
      ) : errorCarga ? (
        <div className="mt-6"><Alerta>{errorCarga}</Alerta></div>
      ) : !solicitud ? (
        <p className="mt-6 text-slate-600" role="status">La solicitud #{id} no existe.</p>
      ) : (
        <div className="mt-6 bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h1 className="text-slate-900 font-bold text-2xl m-0">{solicitud.titulo}</h1>
            <InsigniaSolicitud estado={solicitud.estado} />
          </div>
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-5 mt-6">
            <Dato etiqueta="Cargo">{solicitud.cargo}</Dato>
            <Dato etiqueta="Familia de cargo">{solicitud.familia_cargo}</Dato>
            <Dato etiqueta="Vacantes">{solicitud.vacantes}</Dato>
            <Dato etiqueta="Fecha">
              {solicitud.created_at ? new Date(solicitud.created_at).toLocaleDateString('en-CA') : '—'}
            </Dato>
            <div className="sm:col-span-2">
              <Dato etiqueta="Descripción">{solicitud.descripcion || 'Sin descripción.'}</Dato>
            </div>
          </dl>
        </div>
      )}
    </div>
  );
};

export default DetalleSolicitud;
