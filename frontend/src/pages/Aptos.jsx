import { useEffect, useState } from 'react';
import { decidirCandidato, normalizarEstado, obtenerCandidatos } from '../services/candidatosService';
import { obtenerEvaluacion, obtenerEvaluacionesPorCandidatos } from '../services/evaluacionesService';
import { enviarInformeCandidato } from '../services/driveService';
import { prepararInformeParaSubir, VERSIONES } from '../utils/informePdf';
import { obtenerSolicitudes } from '../services/solicitudesService';
import { usePuede } from '../context/AuthContext';
import { PERMISOS } from '../context/permisos';
import Alerta from '../components/Alerta';
import BotonInformePdf from '../components/BotonInformePdf';
import { iniciales } from '../utils/nombre';

const DIA_MS = 24 * 60 * 60 * 1000;
const foco = 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-aqua-orange';
const COMPETENCIAS = [['comunicacion', 'Comunicación'], ['equipo', 'Trabajo en equipo'], ['adaptacion', 'Adaptación']];

const hace = (fecha) => {
  if (!fecha) return '';
  const dias = Math.max(0, Math.floor((Date.now() - new Date(fecha).getTime()) / DIA_MS));
  if (dias === 0) return 'hoy';
  return `hace ${dias} ${dias === 1 ? 'día' : 'días'}`;
};

const Dato = ({ titulo, children }) => (
  <div>
    <dt className="text-xs font-semibold uppercase tracking-wider text-gray-600">{titulo}</dt>
    <dd className="m-0 mt-0.5 break-words text-sm text-gray-900">{children}</dd>
  </div>
);

// Lo que el reclutador anotó en la entrevista, solo los campos que tienen contenido.
const ResumenEntrevista = ({ candidato, evaluacion, solicitud }) => {
  const r = evaluacion?.respuestas ?? {};
  const competencias = COMPETENCIAS.filter(([clave]) => Number(r[clave]) > 0);
  const lugar = evaluacion?.modalidad === 'Presencial' ? evaluacion.lugar : null;

  return (
    <div className="flex flex-col gap-4 border-t border-gray-100 bg-aqua-light px-5 py-4">
      {evaluacion ? (
        <>
          <dl className="m-0 grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2">
            {r.estudios && <Dato titulo="Estudios">{r.estudios}</Dato>}
            {r.experiencia && <Dato titulo="Experiencia">{r.experiencia}</Dato>}
            {r.disponibilidad && <Dato titulo="Disponibilidad">{r.disponibilidad}</Dato>}
            {r.turnos && <Dato titulo="Turnos y traslado">{r.turnos}</Dato>}
            {Number(r.renta) > 0 && <Dato titulo="Pretensión de renta">${Number(r.renta).toLocaleString('es-CL')}</Dato>}
            {lugar && <Dato titulo="Entrevista presencial en">{lugar}</Dato>}
            {competencias.length > 0 && (
              <Dato titulo="Competencias (1 a 5)">
                {competencias.map(([clave, nombre]) => `${nombre} ${r[clave]}`).join(' · ')}
              </Dato>
            )}
          </dl>
          {evaluacion.observaciones && (
            <div>
              <h3 className="m-0 text-xs font-semibold uppercase tracking-wider text-gray-600">Observaciones del reclutador</h3>
              <p className="m-0 mt-1 max-w-[65ch] whitespace-pre-line text-sm text-gray-900">{evaluacion.observaciones}</p>
            </div>
          )}
        </>
      ) : (
        <p className="m-0 text-sm text-gray-600">Esta persona no tiene apuntes de entrevista registrados.</p>
      )}
      {evaluacion && <BotonInformePdf candidato={candidato} solicitud={solicitud} />}
      <div className="flex flex-wrap gap-x-5 gap-y-1 text-sm">
        {candidato.cv_url && (
          <a href={candidato.cv_url} target="_blank" rel="noreferrer" className="font-semibold text-orange-700 hover:underline">Ver currículum</a>
        )}
        {candidato.drive_folder_url && (
          <a href={candidato.drive_folder_url} target="_blank" rel="noreferrer" className="font-semibold text-orange-700 hover:underline">Carpeta en Drive</a>
        )}
        {candidato.email && <span className="text-gray-700">{candidato.email}</span>}
        {candidato.telefono && <span className="text-gray-700">{candidato.telefono}</span>}
      </div>
    </div>
  );
};

// Inicio de Operaciones: solo los candidatos que R&S dejó como Apto, para decidir si los
// selecciona o los descarta. Primero lo que espera decisión, luego lo ya decidido.
const Aptos = () => {
  const puedeDecidir = usePuede()(PERMISOS.DECIDIR_APTOS);

  const [candidatos, setCandidatos] = useState([]);
  const [evaluaciones, setEvaluaciones] = useState({});
  const [solicitudes, setSolicitudes] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [errorCarga, setErrorCarga] = useState('');

  const [abiertoId, setAbiertoId] = useState(null);
  const [descartandoId, setDescartandoId] = useState(null);
  const [motivo, setMotivo] = useState('');
  const [guardandoId, setGuardandoId] = useState(null);
  const [aviso, setAviso] = useState(null);

  useEffect(() => {
    let activo = true;

    obtenerSolicitudes().then((d) => activo && setSolicitudes(d)).catch(() => {});
    obtenerCandidatos()
      .then(async (datos) => {
        if (!activo) return;
        setCandidatos(datos);
        const ids = datos.filter((c) => normalizarEstado(c) === 'Apto').map((c) => c.id);
        // Los apuntes son un extra: si no se pueden leer, la lista de aptos igual se muestra.
        const lista = await obtenerEvaluacionesPorCandidatos(ids).catch(() => []);
        if (activo) setEvaluaciones(Object.fromEntries(lista.map((e) => [e.candidato_id, e])));
      })
      .catch((e) => {
        if (activo) setErrorCarga(`No se pudieron cargar los candidatos: ${e?.message ?? 'error desconocido'}`);
      })
      .finally(() => {
        if (activo) setCargando(false);
      });

    return () => {
      activo = false;
    };
  }, []);

  const aptos = candidatos.filter((c) => normalizarEstado(c) === 'Apto');
  // Si la migración de decisión no se ejecutó, los candidatos no traen la columna.
  const hayDecision = candidatos.some((c) => 'decision_operaciones' in c);
  const porDecidir = aptos.filter((c) => !c.decision_operaciones);
  const decididos = aptos
    .filter((c) => c.decision_operaciones)
    .sort((a, b) => new Date(b.decidido_en ?? 0) - new Date(a.decidido_en ?? 0));
  const solicitudDe = (c) => solicitudes.find((s) => s.id === c.solicitud_id);

  // Envía al correo del candidato el PDF final con la decisión y su justificación (versión sin
  // observaciones internas). Es un extra: si falla, la decisión ya quedó guardada. Devuelve si salió.
  const informarAlCandidato = async (guardado, solicitud) => {
    try {
      const evaluacion = evaluaciones[guardado.id] ?? (await obtenerEvaluacion(guardado.id));
      const informe = await prepararInformeParaSubir({
        candidato: guardado,
        solicitud,
        evaluacion: { ...evaluacion, finalizada: true, resultado: evaluacion?.resultado ?? 'Apto' },
        version: VERSIONES.CANDIDATO
      });
      return await enviarInformeCandidato({
        email: guardado.email,
        nombre: guardado.nombre_completo,
        decision: guardado.decision_operaciones,
        folderUrl: guardado.drive_folder_url,
        ...informe
      });
    } catch {
      return false;
    }
  };

  const aplicar = async (candidato, decision, texto = '') => {
    if (guardandoId) return;
    setGuardandoId(candidato.id);
    setAviso(null);
    try {
      const guardado = await decidirCandidato(candidato.id, decision, texto);
      setCandidatos((lista) => lista.map((c) => (c.id === guardado.id ? guardado : c)));
      setDescartandoId(null);
      setMotivo('');
      setAbiertoId(null);
      setAviso({
        tipo: 'exito',
        texto: decision === null
          ? `${candidato.nombre_completo} volvió a la lista por decidir.`
          : `${candidato.nombre_completo}: ${decision.toLowerCase()}.`
      });
      if (decision !== null) {
        const enviado = await informarAlCandidato(guardado, solicitudDe(candidato));
        if (enviado) {
          setAviso({
            tipo: 'exito',
            texto: `${candidato.nombre_completo}: ${decision.toLowerCase()}. Se envió el informe final a su correo.`
          });
        }
      }
    } catch (error) {
      setAviso({ tipo: 'error', texto: error?.message ?? 'No se pudo guardar la decisión.' });
    } finally {
      setGuardandoId(null);
    }
  };

  const resumen = cargando
    ? 'Cargando...'
    : porDecidir.length === 0
      ? 'No hay candidatos esperando tu decisión.'
      : `${porDecidir.length} ${porDecidir.length === 1 ? 'candidato espera' : 'candidatos esperan'} tu decisión.`;

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-8">
      <header>
        <h1 className="m-0 text-2xl font-extrabold text-aqua-dark md:text-3xl">Aptos por decidir</h1>
        <p className="m-0 mt-1 text-sm text-gray-600" aria-live="polite">{resumen}</p>
      </header>

      {errorCarga && <Alerta>{errorCarga}</Alerta>}
      {aviso && <Alerta tipo={aviso.tipo}>{aviso.texto}</Alerta>}
      {!cargando && !errorCarga && aptos.length > 0 && !hayDecision && (
        <Alerta>
          Para registrar decisiones falta ejecutar <code>docs/migracion_decision_operaciones.sql</code> en Supabase.
        </Alerta>
      )}

      <section aria-labelledby="t-por-decidir" className="flex flex-col gap-3">
        <h2 id="t-por-decidir" className="m-0 text-lg font-bold text-aqua-dark">Esperan tu decisión</h2>
        {cargando ? (
          <div aria-hidden="true" className="rounded-xl border border-gray-200 bg-white p-5">
            <div className="h-4 w-1/2 animate-pulse rounded bg-gray-100" />
          </div>
        ) : porDecidir.length === 0 ? (
          <p className="m-0 rounded-xl border border-gray-200 bg-white p-5 text-sm text-gray-600">
            Cuando Reclutamiento deje a alguien como apto, aparecerá aquí con el resumen de su entrevista.
          </p>
        ) : (
          <ul className="m-0 flex list-none flex-col gap-4 p-0">
            {porDecidir.map((c) => {
              const abierto = abiertoId === c.id;
              const descartando = descartandoId === c.id;
              const ocupado = guardandoId === c.id;
              return (
                <li key={c.id} className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
                  <div className="flex flex-col gap-4 px-5 py-5">
                    <div className="flex min-w-0 items-center gap-4">
                      <span
                        aria-hidden="true"
                        className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-aqua-dark text-base font-bold text-white"
                      >
                        {iniciales(c.nombre_completo)}
                      </span>
                      <div className="min-w-0">
                        <div className="truncate text-base font-bold text-aqua-dark">{c.nombre_completo}</div>
                        <div className="text-sm text-gray-600">
                          {c.cargo}
                          {solicitudDe(c) && ` · ${solicitudDe(c).titulo}`}
                          {c.created_at && ` · registrado ${hace(c.created_at)}`}
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 border-t border-gray-100 pt-4">
                      <button
                        type="button"
                        aria-expanded={abierto}
                        aria-label={`${abierto ? 'Ocultar' : 'Ver'} la entrevista de ${c.nombre_completo}`}
                        onClick={() => setAbiertoId(abierto ? null : c.id)}
                        className={`mr-auto cursor-pointer border-none bg-transparent px-1 py-1 text-sm font-semibold text-aqua-blue underline ${foco}`}
                      >
                        {abierto ? 'Ocultar entrevista' : 'Ver entrevista'}
                      </button>
                      {puedeDecidir && hayDecision && !descartando && (
                        <>
                          <button
                            type="button"
                            disabled={ocupado}
                            aria-label={`Seleccionar a ${c.nombre_completo}`}
                            onClick={() => aplicar(c, 'Seleccionado')}
                            className={`cursor-pointer rounded-lg border-none bg-green-700 px-6 py-2.5 text-sm font-bold text-white transition-colors duration-200 hover:bg-green-800 disabled:cursor-not-allowed disabled:opacity-50 ${foco}`}
                          >
                            Seleccionar
                          </button>
                          <button
                            type="button"
                            disabled={ocupado}
                            aria-label={`Descartar a ${c.nombre_completo}`}
                            onClick={() => {
                              setDescartandoId(c.id);
                              setMotivo('');
                              setAbiertoId(c.id);
                            }}
                            className={`cursor-pointer rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-bold text-aqua-blue transition-colors duration-200 hover:border-aqua-blue disabled:cursor-not-allowed disabled:opacity-50 ${foco}`}
                          >
                            Descartar
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  {abierto && <ResumenEntrevista candidato={c} evaluacion={evaluaciones[c.id]} solicitud={solicitudDe(c)} />}

                  {descartando && (
                    <div className="flex flex-col gap-3 border-t border-gray-100 px-5 py-4">
                      <label htmlFor={`motivo-${c.id}`} className="text-sm font-semibold text-aqua-blue">
                        Motivo del descarte
                      </label>
                      <textarea
                        id={`motivo-${c.id}`}
                        rows="2"
                        value={motivo}
                        onChange={(e) => setMotivo(e.target.value)}
                        placeholder="Por qué no continúa en el proceso. Este motivo se incluye en el informe que recibe el candidato."
                        className="w-full max-w-[65ch] resize-y rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-800"
                      />
                      <div className="flex gap-2">
                        <button
                          type="button"
                          disabled={ocupado || !motivo.trim()}
                          onClick={() => aplicar(c, 'Descartado', motivo)}
                          className={`cursor-pointer rounded-lg border-none bg-red-600 px-4 py-2 text-sm font-bold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50 ${foco}`}
                        >
                          {ocupado ? 'Guardando...' : 'Confirmar descarte'}
                        </button>
                        <button
                          type="button"
                          disabled={ocupado}
                          onClick={() => setDescartandoId(null)}
                          className={`cursor-pointer rounded-lg border border-aqua-blue bg-white px-4 py-2 text-sm font-bold text-aqua-blue ${foco}`}
                        >
                          Cancelar
                        </button>
                      </div>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {decididos.length > 0 && (
        <section aria-labelledby="t-decididos" className="flex flex-col gap-3">
          <h2 id="t-decididos" className="m-0 text-lg font-bold text-aqua-dark">Ya decididos</h2>
          <ul className="m-0 list-none divide-y divide-gray-200 overflow-hidden rounded-xl border border-gray-200 bg-white/60 p-0">
            {decididos.map((c) => (
              <li key={c.id} className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 px-5 py-3.5">
                <div className="min-w-0">
                  <div className="truncate text-sm font-bold text-aqua-dark">{c.nombre_completo}</div>
                  <div className="text-sm text-gray-600">
                    <span className={`font-semibold ${c.decision_operaciones === 'Seleccionado' ? 'text-green-800' : 'text-gray-700'}`}>
                      {c.decision_operaciones}
                    </span>
                    {c.motivo_decision && ` · ${c.motivo_decision}`}
                    {c.decidido_en && ` · ${hace(c.decidido_en)}`}
                  </div>
                </div>
                {puedeDecidir && (
                  <button
                    type="button"
                    disabled={guardandoId === c.id}
                    aria-label={`Reconsiderar a ${c.nombre_completo}`}
                    onClick={() => aplicar(c, null)}
                    className={`cursor-pointer border-none bg-transparent px-2 py-1 text-sm font-semibold text-aqua-blue underline disabled:cursor-not-allowed disabled:opacity-50 ${foco}`}
                  >
                    Reconsiderar
                  </button>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
};

export default Aptos;
