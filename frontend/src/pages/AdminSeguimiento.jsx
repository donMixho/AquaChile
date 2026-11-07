import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  ESTADOS_CANDIDATO,
  asignarCandidato,
  eliminarCandidato,
  normalizarEstado,
  obtenerCandidatos
} from '../services/candidatosService';
import { ETIQUETAS_ESTADO, obtenerEquipo } from '../services/equipoService';
import { obtenerSolicitudes } from '../services/solicitudesService';
import { usePuede } from '../context/AuthContext';
import { PERMISOS } from '../context/permisos';
import Alerta from '../components/Alerta';
import InsigniaEstado from '../components/InsigniaEstado';
import { IconoEliminar } from '../components/Iconos';

const DIA_MS = 24 * 60 * 60 * 1000;
const foco = 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-aqua-orange';
const campo = 'rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-800';

const sinTildes = (texto) =>
  String(texto ?? '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

const registradoHace = (fecha) => {
  if (!fecha) return '—';
  const dias = Math.max(0, Math.floor((Date.now() - new Date(fecha).getTime()) / DIA_MS));
  if (dias === 0) return 'Hoy';
  return `${dias} ${dias === 1 ? 'día' : 'días'}`;
};

const Dato = ({ etiqueta, children }) => (
  <div>
    <dt className="text-xs font-semibold uppercase tracking-wider text-gray-600">{etiqueta}</dt>
    <dd className="m-0 mt-0.5 break-words text-sm text-gray-900">{children || '—'}</dd>
  </div>
);

// Vista de supervisión del administrador: panorama del proceso con filtros y, al elegir a una
// persona, su detalle. No se edita ni se evalúa aquí (eso es del reclutador); lo único que puede
// hacerse es eliminar, con confirmación escrita, dentro del detalle.
const AdminSeguimiento = () => {
  const [params, setParams] = useSearchParams();
  const puede = usePuede();
  const puedeEliminar = puede(PERMISOS.ELIMINAR_CANDIDATO);
  const puedeAsignar = puede(PERMISOS.ASIGNAR_CASOS);

  const [candidatos, setCandidatos] = useState([]);
  const [equipo, setEquipo] = useState([]);
  const [solicitudes, setSolicitudes] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [errorCarga, setErrorCarga] = useState('');
  const [guardandoAsignacion, setGuardandoAsignacion] = useState(false);
  const [errorAsignacion, setErrorAsignacion] = useState('');

  const [seleccionadoId, setSeleccionadoId] = useState(null);
  const [confirmando, setConfirmando] = useState(false);
  const [nombreEscrito, setNombreEscrito] = useState('');
  const [eliminando, setEliminando] = useState(false);
  const [errorEliminar, setErrorEliminar] = useState('');
  const [aviso, setAviso] = useState('');

  const estadoParam = params.get('estado');
  const estado = ESTADOS_CANDIDATO.includes(estadoParam) ? estadoParam : '';
  const familia = params.get('familia') ?? '';
  const busqueda = params.get('q') ?? '';
  const responsable = params.get('responsable') ?? '';

  useEffect(() => {
    let activo = true;

    // Equipo y solicitudes solo sirven para asignar y mostrar nombres: si fallan, la lista sigue.
    obtenerEquipo().then((d) => activo && setEquipo(d)).catch(() => {});
    obtenerSolicitudes().then((d) => activo && setSolicitudes(d)).catch(() => {});

    obtenerCandidatos()
      .then((datos) => {
        if (activo) setCandidatos(datos);
      })
      .catch((error) => {
        if (activo) setErrorCarga(`No se pudieron cargar los candidatos: ${error?.message ?? 'error desconocido'}`);
      })
      .finally(() => {
        if (activo) setCargando(false);
      });

    return () => {
      activo = false;
    };
  }, []);

  const actualizar = (clave, valor) => {
    const siguiente = new URLSearchParams(params);
    if (valor) siguiente.set(clave, valor);
    else siguiente.delete(clave);
    setParams(siguiente, { replace: true });
  };

  const familias = useMemo(
    () => [...new Set(candidatos.map((c) => c.familia_cargo).filter(Boolean))].sort((a, b) => a.localeCompare(b)),
    [candidatos]
  );

  const porEstado = useMemo(
    () => candidatos.reduce((acc, c) => ({ ...acc, [normalizarEstado(c)]: (acc[normalizarEstado(c)] ?? 0) + 1 }), {}),
    [candidatos]
  );

  // Si la migración de asignación aún no se ejecutó, los candidatos no traen `reclutador_id`
  // y la interfaz oculta todo lo relacionado con responsables.
  const hayAsignacion = candidatos.some((c) => 'reclutador_id' in c);
  const reclutadores = equipo.filter((p) => p.rol === 'reclutador');
  const nombreDe = (id) => equipo.find((p) => p.id === id)?.nombre;

  const visibles = useMemo(() => {
    const texto = sinTildes(busqueda.trim());
    return candidatos.filter((c) => {
      if (estado && normalizarEstado(c) !== estado) return false;
      if (familia && c.familia_cargo !== familia) return false;
      if (responsable === 'sin' && c.reclutador_id) return false;
      if (responsable && responsable !== 'sin' && c.reclutador_id !== responsable) return false;
      if (!texto) return true;
      return [c.nombre_completo, c.rut, c.cargo].some((v) => sinTildes(v).includes(texto));
    });
  }, [candidatos, estado, familia, responsable, busqueda]);

  const seleccionado = candidatos.find((c) => c.id === seleccionadoId) ?? null;
  const filtrando = Boolean(estado || familia || busqueda || responsable);

  // Se guarda al elegir, sin botón aparte: un cambio, un efecto.
  const asignar = async (cambios) => {
    if (!seleccionado || guardandoAsignacion) return;
    setErrorAsignacion('');
    setGuardandoAsignacion(true);
    try {
      const guardado = await asignarCandidato(seleccionado.id, cambios);
      setCandidatos((lista) => lista.map((c) => (c.id === guardado.id ? guardado : c)));
    } catch (error) {
      setErrorAsignacion(error?.message ?? 'No se pudo guardar la asignación.');
    } finally {
      setGuardandoAsignacion(false);
    }
  };

  const etiquetaResponsable = (p) =>
    p.estado === 'activo' ? p.nombre : `${p.nombre} (${ETIQUETAS_ESTADO[p.estado]?.toLowerCase() ?? p.estado})`;

  const elegir = (id) => {
    setSeleccionadoId(id === seleccionadoId ? null : id);
    setConfirmando(false);
    setNombreEscrito('');
    setErrorEliminar('');
    setErrorAsignacion('');
  };

  const normalizarNombre = (t) => String(t ?? '').trim().replace(/\s+/g, ' ').toLowerCase();
  const nombreConfirmado = Boolean(seleccionado) &&
    normalizarNombre(nombreEscrito) === normalizarNombre(seleccionado.nombre_completo);

  const eliminar = async () => {
    if (!seleccionado || eliminando || !nombreConfirmado) return;
    setEliminando(true);
    setErrorEliminar('');
    try {
      await eliminarCandidato(seleccionado.id);
      setCandidatos((lista) => lista.filter((c) => c.id !== seleccionado.id));
      setAviso(`Se eliminó a ${seleccionado.nombre_completo}.`);
      elegir(null);
    } catch (error) {
      setErrorEliminar(error?.message ?? 'No se pudo eliminar el candidato.');
    } finally {
      setEliminando(false);
    }
  };

  const chip = (activo) =>
    `inline-flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-1.5 text-sm font-semibold transition-colors duration-200 ${foco} ${
      activo
        ? 'border-aqua-dark bg-aqua-dark text-white'
        : 'border-gray-300 bg-white text-aqua-blue hover:border-aqua-blue'
    }`;

  return (
    <div className="flex flex-col gap-5">
      <header>
        <h1 className="m-0 text-2xl font-extrabold text-aqua-dark md:text-3xl">Seguimiento</h1>
        <p className="m-0 mt-1 max-w-[65ch] text-sm text-gray-600">
          Todos los candidatos del proceso. Filtra para ver una etapa y abre una fila para ver su detalle.
        </p>
      </header>

      {aviso && <Alerta tipo="exito">{aviso}</Alerta>}
      {errorCarga && <Alerta>{errorCarga}</Alerta>}

      <div className="flex flex-col gap-3">
        <div role="group" aria-label="Filtrar por estado" className="flex flex-wrap gap-2">
          <button type="button" aria-pressed={!estado} onClick={() => actualizar('estado', '')} className={chip(!estado)}>
            Todos <span className="tabular-nums opacity-80">{candidatos.length}</span>
          </button>
          {ESTADOS_CANDIDATO.map((e) => (
            <button
              key={e}
              type="button"
              aria-pressed={estado === e}
              onClick={() => actualizar('estado', estado === e ? '' : e)}
              className={chip(estado === e)}
            >
              {e} <span className="tabular-nums opacity-80">{porEstado[e] ?? 0}</span>
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <label className="sr-only" htmlFor="seg-busqueda">Buscar por nombre, RUT o cargo</label>
          <input
            id="seg-busqueda"
            type="search"
            placeholder="Buscar por nombre, RUT o cargo"
            value={busqueda}
            onChange={(e) => actualizar('q', e.target.value)}
            className={`${campo} w-full sm:w-80`}
          />
          <label className="sr-only" htmlFor="seg-familia">Familia de cargo</label>
          <select id="seg-familia" value={familia} onChange={(e) => actualizar('familia', e.target.value)} className={campo}>
            <option value="">Todas las familias</option>
            {familias.map((f) => (
              <option key={f} value={f}>{f}</option>
            ))}
          </select>
          {hayAsignacion && (
            <>
              <label className="sr-only" htmlFor="seg-responsable">Filtrar por responsable</label>
              <select id="seg-responsable" value={responsable} onChange={(e) => actualizar('responsable', e.target.value)} className={campo}>
                <option value="">Todos los responsables</option>
                <option value="sin">Sin asignar</option>
                {reclutadores.map((p) => (
                  <option key={p.id} value={p.id}>{etiquetaResponsable(p)}</option>
                ))}
              </select>
            </>
          )}
          {filtrando && (
            <button
              type="button"
              onClick={() => setParams({}, { replace: true })}
              className={`cursor-pointer border-none bg-transparent px-1 text-sm font-semibold text-orange-700 hover:underline ${foco}`}
            >
              Limpiar filtros
            </button>
          )}
          <p className="m-0 text-sm text-gray-600 sm:ml-auto" aria-live="polite">
            {cargando ? 'Cargando...' : `${visibles.length} ${visibles.length === 1 ? 'resultado' : 'resultados'}`}
          </p>
        </div>
      </div>

      <div className={`grid items-start gap-5 ${seleccionado ? 'lg:grid-cols-[1fr_22rem]' : ''}`}>
        <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
          <table className="w-full min-w-[600px] border-collapse text-left">
            <thead>
              <tr className="border-b border-gray-200 bg-aqua-light text-xs uppercase tracking-wider text-aqua-blue">
                <th className="px-5 py-3.5">Candidato</th>
                <th className="px-5 py-3.5">Estado</th>
                <th className="px-5 py-3.5">Responsable</th>
                <th className="px-5 py-3.5 text-right">Registrado</th>
              </tr>
            </thead>
            <tbody>
              {cargando ? (
                [0, 1, 2, 3].map((i) => (
                  <tr key={i} aria-hidden="true" className="border-b border-gray-100">
                    {[0, 1, 2, 3].map((j) => (
                      <td key={j} className="px-5 py-4"><div className="h-4 w-3/4 animate-pulse rounded bg-gray-100" /></td>
                    ))}
                  </tr>
                ))
              ) : visibles.length === 0 ? (
                <tr>
                  <td colSpan="4" className="p-8 text-center text-sm text-gray-600">
                    {candidatos.length === 0
                      ? 'Aún no hay candidatos. Aparecerán aquí cuando el equipo de reclutamiento los registre.'
                      : 'Ningún candidato coincide con estos filtros.'}
                  </td>
                </tr>
              ) : (
                visibles.map((c) => {
                  const activo = c.id === seleccionadoId;
                  return (
                    <tr
                      key={c.id}
                      onClick={() => elegir(c.id)}
                      className={`cursor-pointer border-b border-gray-100 text-sm transition-colors duration-150 ${
                        activo ? 'bg-orange-50' : 'hover:bg-aqua-light'
                      }`}
                    >
                      <td className="px-5 py-3.5">
                        <button
                          type="button"
                          aria-pressed={activo}
                          aria-label={`Ver detalle de ${c.nombre_completo}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            elegir(c.id);
                          }}
                          className={`cursor-pointer border-none bg-transparent p-0 text-left ${foco}`}
                        >
                          <span className="block font-bold text-aqua-dark">{c.nombre_completo}</span>
                          <span className="block text-gray-600">{c.cargo}</span>
                        </button>
                      </td>
                      <td className="px-5 py-3.5"><InsigniaEstado candidato={c} /></td>
                      <td className="px-5 py-3.5">
                        {!hayAsignacion ? (
                          <span className="text-gray-600">—</span>
                        ) : c.reclutador_id ? (
                          <span className="text-gray-700">{nombreDe(c.reclutador_id) ?? 'Sin datos'}</span>
                        ) : (
                          <span className="font-semibold text-orange-700">Sin asignar</span>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-right tabular-nums text-gray-700">{registradoHace(c.created_at)}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {seleccionado && (
          <aside
            aria-label="Detalle del candidato"
            className="flex flex-col gap-5 rounded-xl border border-gray-200 bg-white p-5 lg:sticky lg:top-6"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h2 className="m-0 break-words text-lg font-extrabold text-aqua-dark">{seleccionado.nombre_completo}</h2>
                <div className="mt-2"><InsigniaEstado candidato={seleccionado} /></div>
              </div>
              <button
                type="button"
                aria-label="Cerrar detalle"
                onClick={() => elegir(null)}
                className={`cursor-pointer rounded-lg border border-gray-300 bg-white px-2.5 py-1 text-sm font-semibold text-aqua-blue hover:bg-aqua-light ${foco}`}
              >
                Cerrar
              </button>
            </div>

            {puedeAsignar && hayAsignacion && (
              <div className="flex flex-col gap-3 rounded-lg bg-aqua-light p-4">
                <div>
                  <label htmlFor="asig-responsable" className="mb-1 block text-sm font-semibold text-aqua-blue">Responsable</label>
                  <select
                    id="asig-responsable"
                    value={seleccionado.reclutador_id ?? ''}
                    disabled={guardandoAsignacion}
                    onChange={(e) => asignar({ reclutadorId: e.target.value })}
                    className={`${campo} w-full disabled:cursor-wait disabled:opacity-50`}
                  >
                    <option value="">Sin asignar</option>
                    {reclutadores
                      .filter((p) => p.estado !== 'inactivo' || p.id === seleccionado.reclutador_id)
                      .map((p) => (
                        <option key={p.id} value={p.id}>{etiquetaResponsable(p)}</option>
                      ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="asig-solicitud" className="mb-1 block text-sm font-semibold text-aqua-blue">Solicitud de cargo</label>
                  <select
                    id="asig-solicitud"
                    value={seleccionado.solicitud_id ?? ''}
                    disabled={guardandoAsignacion}
                    onChange={(e) => asignar({ solicitudId: e.target.value })}
                    className={`${campo} w-full disabled:cursor-wait disabled:opacity-50`}
                  >
                    <option value="">Sin solicitud</option>
                    {solicitudes
                      .filter((s) => s.estado !== 'Cerrada' || s.id === seleccionado.solicitud_id)
                      .map((s) => (
                        <option key={s.id} value={s.id}>{s.titulo}</option>
                      ))}
                  </select>
                </div>
                {errorAsignacion && <Alerta>{errorAsignacion}</Alerta>}
              </div>
            )}

            <dl className="m-0 grid grid-cols-2 gap-x-4 gap-y-4">
              <Dato etiqueta="RUT">{seleccionado.rut}</Dato>
              <Dato etiqueta="Registrado">
                {seleccionado.created_at ? new Date(seleccionado.created_at).toLocaleDateString('es-CL') : null}
              </Dato>
              <div className="col-span-2"><Dato etiqueta="Cargo">{seleccionado.cargo}</Dato></div>
              <div className="col-span-2"><Dato etiqueta="Familia de cargo">{seleccionado.familia_cargo}</Dato></div>
              {'decision_operaciones' in seleccionado && normalizarEstado(seleccionado) === 'Apto' && (
                <div className="col-span-2">
                  <Dato etiqueta="Decisión de Operaciones">
                    {seleccionado.decision_operaciones
                      ? `${seleccionado.decision_operaciones}${seleccionado.motivo_decision ? ` · ${seleccionado.motivo_decision}` : ''}`
                      : 'Pendiente de decisión'}
                  </Dato>
                </div>
              )}
              <div className="col-span-2"><Dato etiqueta="Correo">{seleccionado.email}</Dato></div>
              <div className="col-span-2"><Dato etiqueta="Teléfono">{seleccionado.telefono}</Dato></div>
            </dl>

            <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm">
              {seleccionado.cv_url ? (
                <a href={seleccionado.cv_url} target="_blank" rel="noreferrer" className="font-semibold text-orange-700 hover:underline">
                  Ver currículum
                </a>
              ) : (
                <span className="text-gray-600">Sin currículum adjunto</span>
              )}
              {seleccionado.drive_folder_url && (
                <a href={seleccionado.drive_folder_url} target="_blank" rel="noreferrer" className="font-semibold text-orange-700 hover:underline">
                  Carpeta en Drive
                </a>
              )}
            </div>

            {puedeEliminar && (
              <div className="border-t border-gray-200 pt-4">
                {!confirmando ? (
                  <button
                    type="button"
                    onClick={() => setConfirmando(true)}
                    className={`inline-flex cursor-pointer items-center gap-2 rounded-lg border border-red-300 bg-white px-3 py-2 text-sm font-bold text-red-700 hover:bg-red-50 ${foco}`}
                  >
                    <IconoEliminar className="h-4 w-4" />
                    Eliminar candidato
                  </button>
                ) : (
                  <div className="flex flex-col gap-3">
                    <p className="m-0 text-sm text-gray-700">
                      Esto no se puede deshacer. Escribe <strong className="text-aqua-dark">{seleccionado.nombre_completo}</strong> para confirmar.
                    </p>
                    <label className="sr-only" htmlFor="seg-confirmar">Nombre completo para confirmar</label>
                    <input
                      id="seg-confirmar"
                      type="text"
                      autoComplete="off"
                      value={nombreEscrito}
                      onChange={(e) => setNombreEscrito(e.target.value)}
                      disabled={eliminando}
                      className={`${campo} w-full`}
                    />
                    {errorEliminar && <Alerta>{errorEliminar}</Alerta>}
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={eliminar}
                        disabled={!nombreConfirmado || eliminando}
                        className={`cursor-pointer rounded-lg border-none bg-red-600 px-4 py-2 text-sm font-bold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50 ${foco}`}
                      >
                        {eliminando ? 'Eliminando...' : 'Sí, eliminar'}
                      </button>
                      <button
                        type="button"
                        disabled={eliminando}
                        onClick={() => {
                          setConfirmando(false);
                          setNombreEscrito('');
                          setErrorEliminar('');
                        }}
                        className={`cursor-pointer rounded-lg border border-aqua-blue bg-white px-4 py-2 text-sm font-bold text-aqua-blue ${foco}`}
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </aside>
        )}
      </div>
    </div>
  );
};

export default AdminSeguimiento;
