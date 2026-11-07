import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ESTADOS_CANDIDATO, normalizarEstado, obtenerCandidatos } from '../services/candidatosService';
import { obtenerEquipo } from '../services/equipoService';
import { obtenerSolicitudes } from '../services/solicitudesService';
import BarrasHorizontales from '../components/BarrasHorizontales';
import Alerta from '../components/Alerta';
import InsigniaSolicitud from '../components/InsigniaSolicitud';

const COLOR_ESTADO = {
  Pendiente: { barra: 'bg-aqua-orange', texto: 'text-orange-700' },
  'En proceso': { barra: 'bg-aqua-blue', texto: 'text-aqua-blue' },
  Apto: { barra: 'bg-green-600', texto: 'text-green-700' },
  'No apto': { barra: 'bg-red-600', texto: 'text-red-700' }
};

const DIA_MS = 24 * 60 * 60 * 1000;

const contarPor = (lista, clave) =>
  lista.reduce((acc, item) => {
    const k = clave(item);
    acc[k] = (acc[k] || 0) + 1;
    return acc;
  }, {});

const diasDesde = (fecha) => Math.max(0, Math.floor((Date.now() - new Date(fecha).getTime()) / DIA_MS));

const enlace = 'font-semibold text-orange-700 hover:underline focus-visible:outline-2 focus-visible:outline-aqua-orange';

const AdminResumen = () => {
  const [candidatos, setCandidatos] = useState([]);
  const [equipo, setEquipo] = useState([]);
  const [solicitudes, setSolicitudes] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [errorCarga, setErrorCarga] = useState('');
  const [equipoDisponible, setEquipoDisponible] = useState(true);

  useEffect(() => {
    let activo = true;

    // El equipo y las solicitudes son opcionales: si fallan, el resto del resumen sigue.
    Promise.all([
      obtenerCandidatos(),
      obtenerEquipo().catch(() => {
        if (activo) setEquipoDisponible(false);
        return [];
      }),
      obtenerSolicitudes().catch(() => [])
    ])
      .then(([listaCandidatos, listaEquipo, listaSolicitudes]) => {
        if (!activo) return;
        setCandidatos(listaCandidatos);
        setEquipo(listaEquipo);
        setSolicitudes(listaSolicitudes);
      })
      .catch((error) => {
        if (activo) setErrorCarga(`No se pudieron cargar los datos: ${error?.message ?? 'error desconocido'}`);
      })
      .finally(() => {
        if (activo) setCargando(false);
      });

    return () => {
      activo = false;
    };
  }, []);

  const total = candidatos.length;
  const porEstado = contarPor(candidatos, normalizarEstado);
  const etapas = ESTADOS_CANDIDATO.map((etiqueta) => ({ etiqueta, valor: porEstado[etiqueta] ?? 0 }));

  const evaluados = (porEstado.Apto ?? 0) + (porEstado['No apto'] ?? 0);
  const tasaApto = evaluados > 0 ? Math.round(((porEstado.Apto ?? 0) / evaluados) * 100) : null;

  const familias = Object.entries(contarPor(candidatos, (c) => c.familia_cargo ?? 'Sin definir'))
    .map(([etiqueta, valor]) => ({ etiqueta, valor, color: 'bg-aqua-blue' }))
    .sort((a, b) => b.valor - a.valor || a.etiqueta.localeCompare(b.etiqueta));

  // Los pendientes que llevan más tiempo esperando: lo primero que la jefatura querría destrabar.
  const esperando = candidatos
    .filter((c) => normalizarEstado(c) === 'Pendiente' && c.created_at)
    .sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
    .slice(0, 5);

  // Sin la migración de asignación los candidatos no traen `reclutador_id`: no se muestra nada de esto.
  const hayAsignacion = candidatos.some((c) => 'reclutador_id' in c);
  const sinResponsable = hayAsignacion
    ? candidatos.filter(
        (c) => !c.reclutador_id && ['Pendiente', 'En proceso'].includes(normalizarEstado(c))
      ).length
    : 0;
  // Una vacante se cubre cuando Operaciones selecciona a un candidato de la solicitud. Si aún no
  // existe la columna de decisión (migración pendiente), se cuenta a los Apto como antes.
  const hayDecision = candidatos.some((c) => 'decision_operaciones' in c);
  const cubiertas = (idSolicitud) =>
    candidatos.filter(
      (c) =>
        c.solicitud_id === idSolicitud &&
        (hayDecision ? c.decision_operaciones === 'Seleccionado' : normalizarEstado(c) === 'Apto')
    ).length;

  const personasActivas = equipo.filter((p) => p.estado !== 'inactivo');
  const cuentaRol = (rol) => personasActivas.filter((p) => p.rol === rol).length;
  const ausentes = equipo.filter((p) => p.estado === 'ausente').length;

  return (
    <div className="flex flex-col gap-8">
      <header>
        <h1 className="m-0 text-2xl font-extrabold text-aqua-dark md:text-3xl">Resumen de gestión</h1>
        <p className="m-0 mt-1 max-w-[65ch] text-sm text-gray-600">
          Cómo avanza el proceso de selección y quién lo está llevando.
        </p>
      </header>

      {errorCarga && <Alerta>{errorCarga}</Alerta>}

      {sinResponsable > 0 && (
        <p className="m-0 flex flex-wrap items-center gap-x-3 gap-y-1 rounded-lg bg-orange-50 px-4 py-3 text-sm text-orange-900">
          <span>
            {sinResponsable} {sinResponsable === 1 ? 'candidato sin responsable' : 'candidatos sin responsable'}.
          </span>
          <Link
            to="/seguimiento?responsable=sin"
            className="font-bold text-orange-900 underline focus-visible:outline-2 focus-visible:outline-aqua-orange"
          >
            Asignar
          </Link>
        </p>
      )}

      <section aria-labelledby="titulo-embudo" className="flex flex-col gap-4">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 id="titulo-embudo" className="m-0 text-lg font-bold text-aqua-dark">Avance de los candidatos</h2>
          <p className="m-0 text-sm text-gray-600">
            {cargando ? 'Cargando...' : `${total} ${total === 1 ? 'candidato' : 'candidatos'} en total`}
            {tasaApto !== null && ` · ${tasaApto}% de los evaluados resultó apto`}
          </p>
        </div>

        {total > 0 ? (
          <div
            role="img"
            aria-label={etapas.map((e) => `${e.etiqueta}: ${e.valor}`).join(', ')}
            className="flex h-3 w-full overflow-hidden rounded-full bg-gray-200"
          >
            {etapas.map((e) => (
              <div
                key={e.etiqueta}
                className={COLOR_ESTADO[e.etiqueta].barra}
                style={{ width: `${(e.valor / total) * 100}%` }}
              />
            ))}
          </div>
        ) : (
          !cargando && !errorCarga && (
            <p className="m-0 text-sm text-gray-600">Aún no hay candidatos registrados.</p>
          )
        )}

        <ul className="m-0 grid list-none grid-cols-2 gap-3 p-0 md:grid-cols-4">
          {etapas.map((e) => (
            <li key={e.etiqueta}>
              <Link
                to={`/seguimiento?estado=${encodeURIComponent(e.etiqueta)}`}
                aria-label={`${e.etiqueta}: ${e.valor}. Ver en seguimiento`}
                className="block rounded-xl border border-gray-200 bg-white px-4 py-3 no-underline transition-colors duration-200 hover:border-aqua-blue focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-aqua-orange"
              >
                <span className="flex items-center gap-2 text-sm text-gray-600">
                  <span aria-hidden="true" className={`h-2.5 w-2.5 rounded-full ${COLOR_ESTADO[e.etiqueta].barra}`} />
                  {e.etiqueta}
                </span>
                <span className={`mt-1 block text-3xl font-extrabold tabular-nums ${COLOR_ESTADO[e.etiqueta].texto}`}>
                  {cargando ? '…' : e.valor}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[3fr_2fr]">
        <section aria-labelledby="titulo-espera" className="flex flex-col gap-3">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 id="titulo-espera" className="m-0 text-lg font-bold text-aqua-dark">Esperando evaluación</h2>
            <Link to="/seguimiento?estado=Pendiente" className={enlace}>Ver todos</Link>
          </div>
          {esperando.length === 0 ? (
            <p className="m-0 rounded-xl border border-gray-200 bg-white p-5 text-sm text-gray-600">
              {cargando ? 'Cargando...' : 'No hay candidatos pendientes. Todo lo registrado ya está en curso o evaluado.'}
            </p>
          ) : (
            <ul className="m-0 list-none divide-y divide-gray-100 overflow-hidden rounded-xl border border-gray-200 bg-white p-0">
              {esperando.map((c) => {
                const dias = diasDesde(c.created_at);
                return (
                  <li key={c.id} className="flex items-center justify-between gap-4 px-5 py-3.5 text-sm">
                    <div className="min-w-0">
                      <div className="truncate font-bold text-aqua-dark">{c.nombre_completo}</div>
                      <div className="truncate text-gray-600">{c.cargo}</div>
                    </div>
                    <span className="shrink-0 font-semibold tabular-nums text-orange-700">
                      {dias === 0 ? 'Hoy' : `${dias} ${dias === 1 ? 'día' : 'días'}`}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <section aria-labelledby="titulo-equipo" className="flex flex-col gap-3">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 id="titulo-equipo" className="m-0 text-lg font-bold text-aqua-dark">Equipo</h2>
            <Link to="/equipo" className={enlace}>Gestionar accesos</Link>
          </div>
          <div className="rounded-xl border border-gray-200 bg-white p-5 text-sm">
            {!equipoDisponible ? (
              <p className="m-0 text-gray-600">
                Aún no se puede leer el equipo. Ejecuta <code>docs/migracion_perfiles.sql</code> en Supabase.
              </p>
            ) : (
              <dl className="m-0 grid grid-cols-[1fr_auto] gap-x-4 gap-y-2">
                <dt className="text-gray-600">Reclutadores activos</dt>
                <dd className="m-0 text-right font-bold tabular-nums text-aqua-dark">{cargando ? '…' : cuentaRol('reclutador')}</dd>
                <dt className="text-gray-600">Equipo de Operaciones activo</dt>
                <dd className="m-0 text-right font-bold tabular-nums text-aqua-dark">{cargando ? '…' : cuentaRol('operaciones')}</dd>
                <dt className="text-gray-600">Ausentes</dt>
                <dd className="m-0 text-right font-bold tabular-nums text-aqua-dark">{cargando ? '…' : ausentes}</dd>
              </dl>
            )}
          </div>
        </section>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        <section aria-labelledby="titulo-solicitudes" className="flex flex-col gap-3">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 id="titulo-solicitudes" className="m-0 text-lg font-bold text-aqua-dark">Solicitudes de cargo</h2>
            <Link to="/solicitudes" className={enlace}>Ver todas</Link>
          </div>
          {solicitudes.length === 0 ? (
            <p className="m-0 rounded-xl border border-gray-200 bg-white p-5 text-sm text-gray-600">
              {cargando ? 'Cargando...' : 'Aún no hay solicitudes de cargo registradas.'}
            </p>
          ) : (
            <ul className="m-0 list-none divide-y divide-gray-100 overflow-hidden rounded-xl border border-gray-200 bg-white p-0">
              {solicitudes.slice(0, 5).map((s) => (
                <li key={s.id}>
                  <Link
                    to={`/solicitudes/${s.id}`}
                    className="flex items-center justify-between gap-4 px-5 py-3.5 text-sm no-underline hover:bg-aqua-light focus-visible:outline-2 focus-visible:outline-aqua-orange"
                  >
                    <span className="min-w-0">
                      <span className="block truncate font-bold text-aqua-dark">{s.titulo}</span>
                      <span className="block truncate text-gray-600">
                        {s.cargo} ·{' '}
                        {hayAsignacion
                          ? `${cubiertas(s.id)} de ${s.vacantes} ${Number(s.vacantes) === 1 ? 'vacante cubierta' : 'vacantes cubiertas'}`
                          : `${s.vacantes} ${Number(s.vacantes) === 1 ? 'vacante' : 'vacantes'}`}
                      </span>
                    </span>
                    <InsigniaSolicitud estado={s.estado} />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        {!cargando && !errorCarga && total > 0 && (
          <BarrasHorizontales
            titulo="Postulantes por familia de cargo"
            descripcion="Permite ver en qué áreas se concentra la demanda."
            datos={familias}
            vacio="Aún no hay candidatos registrados."
          />
        )}
      </div>
    </div>
  );
};

export default AdminResumen;
