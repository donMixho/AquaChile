import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { obtenerCandidatoPorId } from '../services/candidatosService';
import { obtenerSolicitudPorId } from '../services/solicitudesService';
import { finalizarEvaluacion, guardarBorrador, obtenerEvaluacion } from '../services/evaluacionesService';
import Alerta from '../components/Alerta';
import InsigniaEstado from '../components/InsigniaEstado';
import { descargarInformePdf, prepararInformeParaSubir } from '../utils/informePdf';
import { subirInformeDrive } from '../services/driveService';

const ESPERA_AUTOGUARDADO_MS = 1500;

const MODALIDADES = ['Videollamada', 'Presencial'];
const DISPONIBILIDAD = ['Inmediata', 'En 2 semanas', 'En 1 mes', 'Más de 1 mes'];
const TURNOS = ['Acepta turnos y traslado', 'Solo turnos', 'Solo traslado', 'Ninguno'];
const COMPETENCIAS = [
  ['comunicacion', 'Comunicación'],
  ['equipo', 'Trabajo en equipo'],
  ['adaptacion', 'Adaptación a turnos y zonas remotas']
];

const FICHA_VACIA = {
  estudios: '', experiencia: '', disponibilidad: '', turnos: '', renta: '',
  comunicacion: 0, equipo: 0, adaptacion: 0
};

// Fecha de hoy en hora local (toISOString usaría UTC y de noche daría el día siguiente).
const hoy = () => {
  const d = new Date();
  const dos = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${dos(d.getMonth() + 1)}-${dos(d.getDate())}`;
};

const foco = 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-aqua-orange';
const campo = 'w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-800 disabled:bg-gray-50 disabled:text-gray-600';
const etiqueta = 'mb-1 block text-sm font-semibold text-aqua-blue';

const Dato = ({ titulo, children }) => (
  <div>
    <dt className="text-xs font-semibold uppercase tracking-wider text-gray-600">{titulo}</dt>
    <dd className="m-0 mt-0.5 break-words text-sm text-gray-900">{children || '—'}</dd>
  </div>
);

// Escala de 1 a 5 como grupo de opciones: una sola elección, usable con teclado.
const Nivel = ({ nombre, valor, onChange, deshabilitado }) => (
  <div role="radiogroup" aria-label={nombre} className="flex gap-1.5">
    {[1, 2, 3, 4, 5].map((n) => (
      <button
        key={n}
        type="button"
        role="radio"
        aria-checked={valor === n}
        aria-label={`${nombre}: ${n}`}
        disabled={deshabilitado}
        onClick={() => onChange(n)}
        className={`h-9 w-9 cursor-pointer rounded-lg border text-sm font-bold transition-colors duration-150 disabled:cursor-not-allowed ${foco} ${
          valor === n
            ? 'border-aqua-dark bg-aqua-dark text-white'
            : 'border-gray-300 bg-white text-aqua-blue hover:border-aqua-blue disabled:hover:border-gray-300'
        }`}
      >
        {n}
      </button>
    ))}
  </div>
);

// Pantalla de entrevista: a la izquierda los datos que ya están en la base, a la derecha los
// apuntes. La videollamada se hace en otra ventana (Meet, Teams y Zoom no se pueden incrustar).
const Entrevista = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const evaluadorId = user?.id;
  const nombreEvaluador = user?.user_metadata?.nombre ?? user?.email ?? null;

  const [candidato, setCandidato] = useState(null);
  const [solicitud, setSolicitud] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [errorCarga, setErrorCarga] = useState('');

  const [ficha, setFicha] = useState(FICHA_VACIA);
  const [observaciones, setObservaciones] = useState('');
  const [enlace, setEnlace] = useState('');
  const [modalidad, setModalidad] = useState('Videollamada');
  const [lugar, setLugar] = useState('');
  const [fecha, setFecha] = useState(null);
  const [resultado, setResultado] = useState('');
  const [finalizada, setFinalizada] = useState(false);

  const [sucio, setSucio] = useState(false);
  const [guardado, setGuardado] = useState('');
  const [error, setError] = useState('');
  const [finalizando, setFinalizando] = useState(false);
  const [generandoPdf, setGenerandoPdf] = useState(false);
  const [informeDriveUrl, setInformeDriveUrl] = useState('');
  const guardando = useRef(false);

  useEffect(() => {
    let activo = true;

    Promise.all([obtenerCandidatoPorId(id), obtenerEvaluacion(id)])
      .then(([datos, evaluacion]) => {
        if (!activo) return;
        setCandidato(datos);
        if (evaluacion) {
          const { observaciones: obs, respuestas, enlace_reunion: enlaceGuardado } = evaluacion;
          setFicha({ ...FICHA_VACIA, ...respuestas });
          setObservaciones(obs ?? '');
          setEnlace(enlaceGuardado ?? '');
          setModalidad(evaluacion.modalidad ?? 'Videollamada');
          setLugar(evaluacion.lugar ?? '');
          setFecha(evaluacion.fecha_entrevista);
          setResultado(evaluacion.resultado ?? '');
          setFinalizada(evaluacion.estado === 'finalizada');
        }
        if (datos.solicitud_id) {
          obtenerSolicitudPorId(datos.solicitud_id).then((s) => activo && setSolicitud(s)).catch(() => {});
        }
      })
      .catch((e) => {
        if (activo) setErrorCarga(`No se pudo cargar la entrevista: ${e?.message ?? 'error desconocido'}`);
      })
      .finally(() => {
        if (activo) setCargando(false);
      });

    return () => {
      activo = false;
    };
  }, [id]);

  const datosFicha = useCallback(
    () => ({ respuestas: { ...ficha, evaluador_nombre: nombreEvaluador }, observaciones, enlaceReunion: enlace, modalidad, lugar, fechaEntrevista: fecha ?? hoy() }),
    [ficha, nombreEvaluador, observaciones, enlace, modalidad, lugar, fecha]
  );

  const guardarAhora = useCallback(async () => {
    if (!candidato || guardando.current) return;
    guardando.current = true;
    setGuardado('guardando');
    setError('');
    try {
      const evaluacion = await guardarBorrador(candidato, evaluadorId, datosFicha());
      setFecha(evaluacion.fecha_entrevista);
      setCandidato((c) => ({ ...c, estado: 'En proceso' }));
      setSucio(false);
      setGuardado('guardado');
    } catch (e) {
      setGuardado('error');
      setError(`No se pudo guardar el borrador: ${e?.message ?? 'error desconocido'}`);
    } finally {
      guardando.current = false;
    }
  }, [candidato, evaluadorId, datosFicha]);

  // Autoguardado: espera a que el reclutador deje de escribir.
  useEffect(() => {
    if (!sucio || finalizada) return undefined;
    const temporizador = setTimeout(guardarAhora, ESPERA_AUTOGUARDADO_MS);
    return () => clearTimeout(temporizador);
  }, [sucio, finalizada, guardarAhora]);

  const cambiarFicha = (clave, valor) => {
    setFicha((f) => ({ ...f, [clave]: valor }));
    setSucio(true);
    setGuardado('');
  };

  const cambiarContacto = (poner, valor) => {
    poner(valor);
    setSucio(true);
    setGuardado('');
  };

  // Deja el informe definitivo en la carpeta de Drive del candidato. Es un extra: si falla, la
  // entrevista ya quedó finalizada y el informe se puede descargar igual desde el botón.
  const guardarInformeEnDrive = async (datos) => {
    try {
      const informe = await prepararInformeParaSubir({
        candidato: { ...candidato, estado: resultado },
        solicitud,
        evaluador: nombreEvaluador,
        evaluacion: {
          respuestas: datos.respuestas,
          observaciones: datos.observaciones,
          modalidad: datos.modalidad,
          enlaceReunion: datos.enlaceReunion,
          lugar: datos.lugar,
          fechaEntrevista: datos.fechaEntrevista,
          resultado,
          finalizada: true
        }
      });
      const archivo = await subirInformeDrive({
        rut: candidato.rut,
        nombre: candidato.nombre_completo,
        folderUrl: candidato.drive_folder_url,
        ...informe
      });
      if (archivo) setInformeDriveUrl(archivo);
    } catch {
      // Sin Drive no se bloquea nada.
    }
  };

  const finalizar = async () => {
    if (finalizando || finalizada) return;
    if (!resultado) {
      setError('Elige Apto o No apto para finalizar la entrevista.');
      return;
    }
    setError('');
    setFinalizando(true);
    try {
      const finalizado = datosFicha();
      await finalizarEvaluacion(candidato, evaluadorId, finalizado, resultado);
      setCandidato((c) => ({ ...c, estado: resultado }));
      setFinalizada(true);
      setSucio(false);
      guardarInformeEnDrive(finalizado);
    } catch (e) {
      setError(e?.message ?? 'No se pudo finalizar la entrevista.');
    } finally {
      setFinalizando(false);
    }
  };

  // Informe con lo que hay en pantalla en este momento, esté o no guardado.
  const descargarPdf = async () => {
    if (generandoPdf) return;
    setGenerandoPdf(true);
    setError('');
    try {
      await descargarInformePdf({
        candidato,
        solicitud,
        evaluador: nombreEvaluador,
        evaluacion: {
          respuestas: ficha,
          observaciones,
          modalidad,
          enlaceReunion: enlace,
          lugar,
          fechaEntrevista: fecha ?? hoy(),
          resultado: finalizada ? resultado : null,
          finalizada
        }
      });
    } catch (e) {
      setError(`No se pudo generar el PDF: ${e?.message ?? 'error desconocido'}`);
    } finally {
      setGenerandoPdf(false);
    }
  };

  if (cargando) {
    return <p role="status" className="p-6 text-sm text-gray-600">Cargando entrevista...</p>;
  }
  if (errorCarga) {
    return (
      <div className="flex flex-col gap-4">
        <Alerta>{errorCarga}</Alerta>
        <Link to="/" className="text-sm font-semibold text-orange-700 hover:underline">Volver a mi bandeja</Link>
      </div>
    );
  }

  const bloqueado = finalizada || finalizando;
  const enlaceValido = /^https?:\/\//i.test(enlace.trim());
  const estadoGuardado = {
    guardando: 'Guardando...',
    guardado: 'Borrador guardado',
    error: 'No se pudo guardar'
  }[guardado] ?? (sucio ? 'Cambios sin guardar' : '');

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-2">
        <Link to="/" className={`w-fit text-sm font-semibold text-aqua-blue no-underline hover:underline ${foco}`}>
          ← Mi bandeja
        </Link>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="m-0 text-2xl font-extrabold text-aqua-dark md:text-3xl">{candidato.nombre_completo}</h1>
          <InsigniaEstado candidato={candidato} />
        </div>
        <p className="m-0 text-sm text-gray-600">
          {candidato.cargo}
          {candidato.familia_cargo && ` · ${candidato.familia_cargo}`}
          {solicitud && ` · ${solicitud.titulo}`}
        </p>
      </header>

      <div className="grid items-start gap-6 lg:grid-cols-[20rem_1fr]">
        <aside aria-label="Ficha del candidato" className="flex flex-col gap-5 rounded-xl border border-gray-200 bg-white p-5 lg:sticky lg:top-24">
          <h2 className="m-0 text-base font-bold text-aqua-dark">Ficha del candidato</h2>
          <dl className="m-0 grid grid-cols-2 gap-x-4 gap-y-3">
            <Dato titulo="RUT">{candidato.rut}</Dato>
            <Dato titulo="Teléfono">{candidato.telefono}</Dato>
            <div className="col-span-2"><Dato titulo="Correo">{candidato.email}</Dato></div>
          </dl>
          <div className="flex flex-wrap gap-x-5 gap-y-1 text-sm">
            {candidato.cv_url ? (
              <a href={candidato.cv_url} target="_blank" rel="noreferrer" className="font-semibold text-orange-700 hover:underline">Ver currículum</a>
            ) : (
              <span className="text-gray-600">Sin currículum adjunto</span>
            )}
            {candidato.drive_folder_url && (
              <a href={candidato.drive_folder_url} target="_blank" rel="noreferrer" className="font-semibold text-orange-700 hover:underline">Carpeta en Drive</a>
            )}
          </div>

          <div className="flex flex-col gap-3 border-t border-gray-200 pt-4">
            <div>
              <span id="t-modalidad" className={etiqueta}>Modalidad</span>
              <div role="radiogroup" aria-labelledby="t-modalidad" className="flex gap-2">
                {MODALIDADES.map((m) => (
                  <button
                    key={m}
                    type="button"
                    role="radio"
                    aria-checked={modalidad === m}
                    disabled={bloqueado}
                    onClick={() => cambiarContacto(setModalidad, m)}
                    className={`flex-1 cursor-pointer rounded-lg border px-3 py-2 text-sm font-bold transition-colors duration-150 disabled:cursor-not-allowed ${foco} ${
                      modalidad === m
                        ? 'border-aqua-dark bg-aqua-dark text-white'
                        : 'border-gray-300 bg-white text-aqua-blue hover:border-aqua-blue disabled:hover:border-gray-300'
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>

            {modalidad === 'Videollamada' ? (
              <div>
                <label htmlFor="enlace" className={etiqueta}>Enlace de la videollamada</label>
                <input
                  id="enlace"
                  type="url"
                  placeholder="https://meet.google.com/..."
                  value={enlace}
                  disabled={bloqueado}
                  onChange={(e) => cambiarContacto(setEnlace, e.target.value)}
                  className={campo}
                />
                {enlaceValido ? (
                  <a
                    href={enlace.trim()}
                    target="_blank"
                    rel="noreferrer"
                    className={`mt-3 inline-flex rounded-lg bg-aqua-dark px-4 py-2 text-sm font-bold text-white no-underline hover:bg-aqua-blue ${foco}`}
                  >
                    Abrir videollamada
                  </a>
                ) : (
                  !bloqueado && (
                    <>
                      <a
                        href="https://meet.new"
                        target="_blank"
                        rel="noreferrer"
                        className={`mt-3 inline-flex rounded-lg border border-aqua-blue bg-white px-4 py-2 text-sm font-bold text-aqua-blue no-underline hover:bg-aqua-light ${foco}`}
                      >
                        Crear reunión en Meet
                      </a>
                      <p className="m-0 mt-2 text-xs text-gray-600">Copia el enlace de la reunión y pégalo arriba.</p>
                    </>
                  )
                )}
              </div>
            ) : (
              <div>
                <label htmlFor="lugar" className={etiqueta}>Lugar de la entrevista</label>
                <input
                  id="lugar"
                  type="text"
                  placeholder="Planta, oficina o sala, con dirección"
                  value={lugar}
                  disabled={bloqueado}
                  onChange={(e) => cambiarContacto(setLugar, e.target.value)}
                  className={campo}
                />
              </div>
            )}
          </div>
        </aside>

        <form
          onSubmit={(e) => e.preventDefault()}
          aria-label="Apuntes de la entrevista"
          className="flex flex-col gap-7 rounded-xl border border-gray-200 bg-white p-5 md:p-6"
        >
          <section className="flex flex-col gap-4" aria-labelledby="t-perfil">
            <h2 id="t-perfil" className="m-0 text-base font-bold text-aqua-dark">Perfil</h2>
            <div>
              <label htmlFor="estudios" className={etiqueta}>Estudios</label>
              <input id="estudios" type="text" disabled={bloqueado} value={ficha.estudios} onChange={(e) => cambiarFicha('estudios', e.target.value)} className={campo} />
            </div>
            <div>
              <label htmlFor="experiencia" className={etiqueta}>Experiencia relevante</label>
              <textarea id="experiencia" rows="3" disabled={bloqueado} value={ficha.experiencia} onChange={(e) => cambiarFicha('experiencia', e.target.value)} className={`${campo} resize-y`} />
            </div>
          </section>

          <section className="flex flex-col gap-4" aria-labelledby="t-condiciones">
            <h2 id="t-condiciones" className="m-0 text-base font-bold text-aqua-dark">Condiciones</h2>
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <label htmlFor="disponibilidad" className={etiqueta}>Disponibilidad</label>
                <select id="disponibilidad" disabled={bloqueado} value={ficha.disponibilidad} onChange={(e) => cambiarFicha('disponibilidad', e.target.value)} className={campo}>
                  <option value="">Sin definir</option>
                  {DISPONIBILIDAD.map((o) => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>
              <div>
                <label htmlFor="turnos" className={etiqueta}>Turnos y traslado</label>
                <select id="turnos" disabled={bloqueado} value={ficha.turnos} onChange={(e) => cambiarFicha('turnos', e.target.value)} className={campo}>
                  <option value="">Sin definir</option>
                  {TURNOS.map((o) => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>
              <div>
                <label htmlFor="renta" className={etiqueta}>Pretensión de renta (CLP)</label>
                <input id="renta" type="number" min="0" step="10000" inputMode="numeric" disabled={bloqueado} value={ficha.renta} onChange={(e) => cambiarFicha('renta', e.target.value)} className={campo} />
              </div>
            </div>
          </section>

          <section className="flex flex-col gap-4" aria-labelledby="t-competencias">
            <h2 id="t-competencias" className="m-0 text-base font-bold text-aqua-dark">Competencias</h2>
            <div className="flex flex-col gap-3">
              {COMPETENCIAS.map(([clave, nombre]) => (
                <div key={clave} className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-sm text-gray-800">{nombre}</span>
                  <Nivel nombre={nombre} valor={ficha[clave]} deshabilitado={bloqueado} onChange={(n) => cambiarFicha(clave, n)} />
                </div>
              ))}
            </div>
          </section>

          <section className="flex flex-col gap-2" aria-labelledby="t-observaciones">
            <h2 id="t-observaciones" className="m-0 text-base font-bold text-aqua-dark">Observaciones y conclusiones</h2>
            <label htmlFor="observaciones" className="sr-only">Observaciones y conclusiones</label>
            <textarea
              id="observaciones"
              rows="5"
              disabled={bloqueado}
              placeholder="Qué destacó, qué dudas quedan y por qué recomiendas o no a la persona."
              value={observaciones}
              onChange={(e) => {
                setObservaciones(e.target.value);
                setSucio(true);
                setGuardado('');
              }}
              className={`${campo} resize-y`}
            />
          </section>

          <section className="flex flex-col gap-4 border-t border-gray-200 pt-5" aria-labelledby="t-decision">
            <h2 id="t-decision" className="m-0 text-base font-bold text-aqua-dark">Decisión</h2>
            <div role="radiogroup" aria-label="Resultado de la entrevista" className="flex gap-2">
              {['Apto', 'No apto'].map((r) => (
                <button
                  key={r}
                  type="button"
                  role="radio"
                  aria-checked={resultado === r}
                  disabled={bloqueado}
                  onClick={() => setResultado(r)}
                  className={`cursor-pointer rounded-lg border px-5 py-2 text-sm font-bold transition-colors duration-150 disabled:cursor-not-allowed ${foco} ${
                    resultado === r
                      ? r === 'Apto'
                        ? 'border-green-700 bg-green-700 text-white'
                        : 'border-red-700 bg-red-700 text-white'
                      : 'border-gray-300 bg-white text-aqua-blue hover:border-aqua-blue disabled:hover:border-gray-300'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>

            {error && <Alerta>{error}</Alerta>}
            {finalizada && (
              <Alerta tipo="exito">
                Entrevista finalizada: {resultado}. El resultado ya quedó registrado.{' '}
                <Link to="/" className="font-bold text-green-900 underline">Volver a mi bandeja</Link>
              </Alerta>
            )}

            <div className="flex flex-wrap items-center gap-4">
              {informeDriveUrl && (
                <a href={informeDriveUrl} target="_blank" rel="noreferrer" className="text-sm font-semibold text-orange-700 hover:underline">
                  Informe guardado en Drive
                </a>
              )}
              <button
                type="button"
                onClick={descargarPdf}
                disabled={generandoPdf}
                className={`cursor-pointer rounded-lg border border-aqua-blue bg-white px-5 py-2.5 text-sm font-bold text-aqua-blue transition-colors duration-200 hover:bg-aqua-light disabled:cursor-not-allowed disabled:opacity-50 ${foco}`}
              >
                {generandoPdf ? 'Generando PDF...' : finalizada ? 'Descargar PDF de la entrevista' : 'Descargar borrador en PDF'}
              </button>
            </div>

            {!finalizada && (
              <div className="flex flex-wrap items-center gap-4">
                <button
                  type="button"
                  onClick={finalizar}
                  disabled={finalizando}
                  className={`cursor-pointer rounded-lg border-none bg-aqua-orange px-5 py-2.5 text-sm font-extrabold text-white transition-colors duration-200 hover:bg-[#d9561a] disabled:cursor-not-allowed disabled:opacity-50 ${foco}`}
                >
                  {finalizando ? 'Finalizando...' : 'Finalizar entrevista'}
                </button>
                <span role="status" className="text-sm text-gray-600">{estadoGuardado}</span>
              </div>
            )}
          </section>
        </form>
      </div>
    </div>
  );
};

export default Entrevista;
