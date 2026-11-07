import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth, usePuede } from '../context/AuthContext';
import { PERMISOS } from '../context/permisos';
import { normalizarEstado, obtenerCandidatos } from '../services/candidatosService';
import { obtenerSolicitudes } from '../services/solicitudesService';
import Alerta from '../components/Alerta';
import InsigniaEstado from '../components/InsigniaEstado';

const DIA_MS = 24 * 60 * 60 * 1000;
const foco = 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-aqua-orange';

const hace = (fecha) => {
  if (!fecha) return '';
  const dias = Math.max(0, Math.floor((Date.now() - new Date(fecha).getTime()) / DIA_MS));
  if (dias === 0) return 'Hoy';
  return `Hace ${dias} ${dias === 1 ? 'día' : 'días'}`;
};

const Fila = ({ candidato, solicitud, accion }) => (
  <li className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 px-5 py-3.5">
    <div className="min-w-0">
      <div className="truncate text-sm font-bold text-aqua-dark">{candidato.nombre_completo}</div>
      <div className="truncate text-sm text-gray-600">
        {candidato.cargo}
        {solicitud && ` · ${solicitud.titulo}`}
        {candidato.created_at && ` · ${hace(candidato.created_at)}`}
      </div>
    </div>
    <div className="flex items-center gap-3">
      <InsigniaEstado candidato={candidato} />
      {accion}
    </div>
  </li>
);

// Inicio del reclutador: solo lo que tiene que hacer hoy. Primero las entrevistas en curso, luego
// las que aún no empieza, y al final un registro corto de lo ya resuelto.
const MiBandeja = () => {
  const { user } = useAuth();
  const puedeCrear = usePuede()(PERMISOS.CREAR_CANDIDATO);

  const [candidatos, setCandidatos] = useState([]);
  const [solicitudes, setSolicitudes] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [errorCarga, setErrorCarga] = useState('');

  useEffect(() => {
    let activo = true;

    obtenerSolicitudes().then((d) => activo && setSolicitudes(d)).catch(() => {});
    obtenerCandidatos()
      .then((datos) => {
        if (activo) setCandidatos(datos);
      })
      .catch((e) => {
        if (activo) setErrorCarga(`No se pudieron cargar tus candidatos: ${e?.message ?? 'error desconocido'}`);
      })
      .finally(() => {
        if (activo) setCargando(false);
      });

    return () => {
      activo = false;
    };
  }, []);

  // Con la migración de asignación cada reclutador ve solo sus casos; sin ella ve todos.
  const hayAsignacion = candidatos.some((c) => 'reclutador_id' in c);
  const mios = hayAsignacion ? candidatos.filter((c) => c.reclutador_id === user?.id) : candidatos;
  const solicitudDe = (c) => solicitudes.find((s) => s.id === c.solicitud_id);

  const enCurso = mios.filter((c) => normalizarEstado(c) === 'En proceso');
  const porIniciar = mios
    .filter((c) => normalizarEstado(c) === 'Pendiente')
    .sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
  const porEntrevistar = [...enCurso, ...porIniciar];
  const resueltos = mios
    .filter((c) => ['Apto', 'No apto'].includes(normalizarEstado(c)))
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .slice(0, 5);

  const resumen = cargando
    ? 'Cargando...'
    : porEntrevistar.length === 0
      ? 'No tienes entrevistas pendientes.'
      : `${porEntrevistar.length} por entrevistar${enCurso.length ? `, ${enCurso.length} ya en curso` : ''}.`;

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="m-0 text-2xl font-extrabold text-aqua-dark md:text-3xl">Mi bandeja</h1>
          <p className="m-0 mt-1 text-sm text-gray-600" aria-live="polite">{resumen}</p>
        </div>
        {puedeCrear && (
          <Link
            to="/candidatos/nuevo"
            className={`inline-flex w-fit rounded-lg bg-aqua-orange px-5 py-3 text-sm font-extrabold text-white no-underline transition-colors duration-200 hover:bg-[#d9561a] ${foco}`}
          >
            + Nuevo candidato
          </Link>
        )}
      </header>

      {errorCarga && <Alerta>{errorCarga}</Alerta>}

      <section aria-labelledby="t-entrevistar" className="flex flex-col gap-3">
        <h2 id="t-entrevistar" className="m-0 text-lg font-bold text-aqua-dark">Por entrevistar</h2>
        {cargando ? (
          <div aria-hidden="true" className="rounded-xl border border-gray-200 bg-white p-5">
            <div className="h-4 w-1/2 animate-pulse rounded bg-gray-100" />
          </div>
        ) : porEntrevistar.length === 0 ? (
          <p className="m-0 rounded-xl border border-gray-200 bg-white p-5 text-sm text-gray-600">
            {hayAsignacion
              ? 'No tienes candidatos asignados por ahora. Cuando el administrador te asigne uno, aparecerá aquí.'
              : 'No hay candidatos por entrevistar.'}
          </p>
        ) : (
          <ul className="m-0 list-none divide-y divide-gray-100 overflow-hidden rounded-xl border border-gray-200 bg-white p-0">
            {porEntrevistar.map((c) => (
              <Fila
                key={c.id}
                candidato={c}
                solicitud={solicitudDe(c)}
                accion={
                  <Link
                    to={`/entrevista/${c.id}`}
                    aria-label={`${normalizarEstado(c) === 'En proceso' ? 'Continuar' : 'Entrevistar'} a ${c.nombre_completo}`}
                    className={`rounded-lg bg-aqua-dark px-4 py-2 text-sm font-bold text-white no-underline transition-colors duration-200 hover:bg-aqua-blue ${foco}`}
                  >
                    {normalizarEstado(c) === 'En proceso' ? 'Continuar' : 'Entrevistar'}
                  </Link>
                }
              />
            ))}
          </ul>
        )}
      </section>

      {resueltos.length > 0 && (
        <section aria-labelledby="t-resueltos" className="flex flex-col gap-3">
          <h2 id="t-resueltos" className="m-0 text-lg font-bold text-aqua-dark">Resueltos recientemente</h2>
          <ul className="m-0 list-none divide-y divide-gray-100 overflow-hidden rounded-xl border border-gray-200 bg-white p-0">
            {resueltos.map((c) => (
              <Fila key={c.id} candidato={c} solicitud={solicitudDe(c)} />
            ))}
          </ul>
        </section>
      )}
    </div>
  );
};

export default MiBandeja;
