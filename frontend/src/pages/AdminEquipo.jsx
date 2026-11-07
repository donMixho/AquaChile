import { useContext, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { normalizarEstado, obtenerCandidatos } from '../services/candidatosService';
import { ETIQUETAS_ROL } from '../context/permisos';
import {
  ESTADOS_PERFIL,
  ETIQUETAS_ESTADO,
  ROLES_INVITABLES,
  cambiarEstadoUsuario,
  invitarUsuario,
  obtenerEquipo
} from '../services/equipoService';
import Alerta from '../components/Alerta';
import { IconoInvitar } from '../components/Iconos';

const ESTILO_ESTADO = {
  activo: { punto: 'bg-green-600', texto: 'text-green-800' },
  ausente: { punto: 'bg-amber-500', texto: 'text-amber-800' },
  inactivo: { punto: 'bg-slate-400', texto: 'text-slate-600' }
};

const campo = 'w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-800';
const etiquetaCampo = 'mb-1 block text-sm font-semibold text-aqua-blue';
const foco = 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-aqua-orange';

const InsigniaPerfil = ({ estado }) => {
  const estilo = ESTILO_ESTADO[estado] ?? ESTILO_ESTADO.inactivo;
  return (
    <span className={`inline-flex items-center gap-2 text-sm font-semibold ${estilo.texto}`}>
      <span aria-hidden="true" className={`h-2 w-2 rounded-full ${estilo.punto}`} />
      {ETIQUETAS_ESTADO[estado] ?? estado}
    </span>
  );
};

const FilasEsqueleto = () =>
  [0, 1, 2].map((i) => (
    <tr key={i} className="border-b border-gray-100" aria-hidden="true">
      {[0, 1, 2, 3, 4].map((j) => (
        <td key={j} className="px-5 py-4">
          <div className="h-4 w-3/4 animate-pulse rounded bg-gray-100" />
        </td>
      ))}
    </tr>
  ));

const AdminEquipo = () => {
  const miId = useContext(AuthContext)?.user?.id;

  const [equipo, setEquipo] = useState([]);
  const [candidatos, setCandidatos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [errorCarga, setErrorCarga] = useState('');

  const [panelAbierto, setPanelAbierto] = useState(false);
  const [form, setForm] = useState({ nombre: '', email: '', rol: ROLES_INVITABLES[0] });
  const [enviando, setEnviando] = useState(false);
  const [errorInvitar, setErrorInvitar] = useState('');

  const [guardandoId, setGuardandoId] = useState(null);
  const [porInactivar, setPorInactivar] = useState(null);
  const [aviso, setAviso] = useState(null);

  useEffect(() => {
    let activo = true;

    // Solo para contar los casos abiertos de cada persona; si falla, la lista sigue sin esa cifra.
    obtenerCandidatos().then((d) => activo && setCandidatos(d)).catch(() => {});

    obtenerEquipo()
      .then((datos) => {
        if (activo) setEquipo(datos);
      })
      .catch((error) => {
        if (activo) setErrorCarga(`No se pudo cargar el equipo: ${error?.message ?? 'error desconocido'}`);
      })
      .finally(() => {
        if (activo) setCargando(false);
      });

    return () => {
      activo = false;
    };
  }, []);

  const reemplazar = (perfil) =>
    setEquipo((lista) => {
      const existe = lista.some((p) => p.id === perfil.id);
      const nueva = existe ? lista.map((p) => (p.id === perfil.id ? perfil : p)) : [...lista, perfil];
      return nueva.sort((a, b) => String(a.nombre).localeCompare(String(b.nombre)));
    });

  const invitar = async (e) => {
    e.preventDefault();
    if (enviando) return;
    setErrorInvitar('');
    setEnviando(true);
    try {
      const perfil = await invitarUsuario(form);
      reemplazar(perfil);
      setAviso({ tipo: 'exito', texto: `Invitación enviada a ${perfil.email}. Recibirá un correo para crear su contraseña.` });
      setForm({ nombre: '', email: '', rol: ROLES_INVITABLES[0] });
      setPanelAbierto(false);
    } catch (error) {
      setErrorInvitar(error?.message ?? 'No se pudo enviar la invitación.');
    } finally {
      setEnviando(false);
    }
  };

  const aplicarEstado = async (persona, estado) => {
    setPorInactivar(null);
    setAviso(null);
    setGuardandoId(persona.id);
    try {
      reemplazar(await cambiarEstadoUsuario(persona.id, estado));
      setAviso({
        tipo: 'exito',
        texto: estado === 'inactivo'
          ? `${persona.nombre} quedó inactivo y ya no puede iniciar sesión.`
          : `${persona.nombre} ahora está ${ETIQUETAS_ESTADO[estado].toLowerCase()}.`
      });
    } catch (error) {
      setAviso({ tipo: 'error', texto: `No se pudo cambiar el estado de ${persona.nombre}: ${error?.message ?? 'error desconocido'}` });
    } finally {
      setGuardandoId(null);
    }
  };

  const cambiarEstado = (persona, estado) => {
    if (estado === persona.estado) return;
    // Revocar el acceso pide confirmación, en la misma fila y sin ventana emergente.
    if (estado === 'inactivo') {
      setPorInactivar(persona.id);
      return;
    }
    aplicarEstado(persona, estado);
  };

  const cuenta = (estado) => equipo.filter((p) => p.estado === estado).length;

  // Casos que la persona aún tiene en curso (Pendiente o En proceso). Solo aplica a reclutadores.
  const casosAbiertos = (persona) =>
    candidatos.filter(
      (c) => c.reclutador_id === persona.id && ['Pendiente', 'En proceso'].includes(normalizarEstado(c))
    ).length;

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="m-0 text-2xl font-extrabold text-aqua-dark md:text-3xl">Equipo y accesos</h1>
          <p className="m-0 mt-1 max-w-[65ch] text-sm text-gray-600">
            Quién trabaja en la plataforma y con qué rol. Una persona inactiva pierde el acceso al instante;
            su historial se conserva.
          </p>
        </div>
        <button
          type="button"
          aria-expanded={panelAbierto}
          onClick={() => {
            setPanelAbierto(!panelAbierto);
            setErrorInvitar('');
          }}
          className={`inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 rounded-lg border-none bg-aqua-orange px-5 py-3 text-sm font-extrabold text-white transition-colors duration-200 hover:bg-[#d9561a] ${foco}`}
        >
          <IconoInvitar className="h-4 w-4" />
          Invitar persona
        </button>
      </header>

      {aviso && <Alerta tipo={aviso.tipo}>{aviso.texto}</Alerta>}

      {panelAbierto && (
        <form
          onSubmit={invitar}
          aria-label="Invitar persona"
          className="grid grid-cols-1 gap-4 rounded-xl border border-gray-200 bg-white p-5 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_12rem_auto] lg:items-end"
        >
          <div>
            <label htmlFor="inv-nombre" className={etiquetaCampo}>Nombre completo</label>
            <input
              id="inv-nombre"
              type="text"
              required
              autoComplete="off"
              value={form.nombre}
              onChange={(e) => setForm({ ...form, nombre: e.target.value })}
              className={campo}
            />
          </div>
          <div>
            <label htmlFor="inv-email" className={etiquetaCampo}>Correo</label>
            <input
              id="inv-email"
              type="email"
              required
              autoComplete="off"
              placeholder="nombre@aquachile.cl"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value.replace(/\s/g, '') })}
              className={campo}
            />
          </div>
          <div>
            <label htmlFor="inv-rol" className={etiquetaCampo}>Rol</label>
            <select
              id="inv-rol"
              value={form.rol}
              onChange={(e) => setForm({ ...form, rol: e.target.value })}
              className={campo}
            >
              {ROLES_INVITABLES.map((r) => (
                <option key={r} value={r}>{ETIQUETAS_ROL[r]}</option>
              ))}
            </select>
          </div>
          <button
            type="submit"
            disabled={enviando}
            className={`cursor-pointer rounded-lg border-none bg-aqua-dark px-5 py-2.5 text-sm font-bold text-white transition-colors duration-200 hover:bg-aqua-blue disabled:cursor-not-allowed disabled:opacity-50 ${foco}`}
          >
            {enviando ? 'Enviando...' : 'Enviar invitación'}
          </button>
          <p className="m-0 text-xs text-gray-600 sm:col-span-2 lg:col-span-4">
            La persona recibe un correo con un enlace para crear su propia contraseña. Nadie más la conoce.
          </p>
          {errorInvitar && (
            <div className="sm:col-span-2 lg:col-span-4">
              <Alerta>{errorInvitar}</Alerta>
            </div>
          )}
        </form>
      )}

      {!cargando && !errorCarga && equipo.length > 0 && (
        <p className="m-0 text-sm text-gray-600" aria-live="polite">
          {cuenta('activo')} {cuenta('activo') === 1 ? 'activo' : 'activos'} · {cuenta('ausente')}{' '}
          {cuenta('ausente') === 1 ? 'ausente' : 'ausentes'} · {cuenta('inactivo')}{' '}
          {cuenta('inactivo') === 1 ? 'inactivo' : 'inactivos'}
        </p>
      )}

      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
        <table className="w-full min-w-[720px] border-collapse text-left">
          <thead>
            <tr className="border-b border-gray-200 bg-aqua-light text-xs uppercase tracking-wider text-aqua-blue">
              <th className="px-5 py-4">Persona</th>
              <th className="px-5 py-4">Rol</th>
              <th className="px-5 py-4">Estado</th>
              <th className="px-5 py-4">Casos abiertos</th>
              <th className="px-5 py-4">Acceso</th>
            </tr>
          </thead>
          <tbody>
            {cargando ? (
              <FilasEsqueleto />
            ) : errorCarga ? (
              <tr>
                <td colSpan="5" role="alert" className="p-6 text-center text-red-700">{errorCarga}</td>
              </tr>
            ) : equipo.length === 0 ? (
              <tr>
                <td colSpan="5" className="p-8 text-center text-sm text-gray-600">
                  Aún no hay personas registradas. Usa «Invitar persona» para sumar a un reclutador u operador.
                </td>
              </tr>
            ) : (
              equipo.map((p) => {
                const esYo = p.id === miId;
                return (
                  <tr key={p.id} className="border-b border-gray-100 text-sm">
                    <td className="px-5 py-4">
                      <div className="font-bold text-aqua-dark">{p.nombre}</div>
                      <div className="text-gray-600">{p.email}</div>
                    </td>
                    <td className="px-5 py-4 text-gray-700">{ETIQUETAS_ROL[p.rol] ?? p.rol}</td>
                    <td className="px-5 py-4"><InsigniaPerfil estado={p.estado} /></td>
                    <td className="px-5 py-4 text-gray-700">
                      {p.rol !== 'reclutador' ? (
                        '—'
                      ) : (
                        <span className="inline-flex flex-wrap items-center gap-x-3">
                          <span className="tabular-nums">{casosAbiertos(p)}</span>
                          {p.estado !== 'activo' && casosAbiertos(p) > 0 && (
                            <Link
                              to={`/seguimiento?responsable=${p.id}`}
                              className="font-semibold text-orange-800 underline focus-visible:outline-2 focus-visible:outline-aqua-orange"
                            >
                              Reasignar
                            </Link>
                          )}
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      {esYo ? (
                        <span className="text-gray-600">Tu cuenta</span>
                      ) : porInactivar === p.id ? (
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-semibold text-red-700">¿Revocar el acceso de {p.nombre}?</span>
                          <button
                            type="button"
                            onClick={() => aplicarEstado(p, 'inactivo')}
                            className={`cursor-pointer rounded-lg border-none bg-red-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-red-700 ${foco}`}
                          >
                            Sí, revocar
                          </button>
                          <button
                            type="button"
                            onClick={() => setPorInactivar(null)}
                            className={`cursor-pointer rounded-lg border border-aqua-blue bg-white px-3 py-1.5 text-xs font-bold text-aqua-blue ${foco}`}
                          >
                            Cancelar
                          </button>
                        </div>
                      ) : (
                        <select
                          aria-label={`Estado de ${p.nombre}`}
                          value={p.estado}
                          disabled={guardandoId === p.id}
                          onChange={(e) => cambiarEstado(p, e.target.value)}
                          className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-800 disabled:cursor-wait disabled:opacity-50"
                        >
                          {ESTADOS_PERFIL.map((estado) => (
                            <option key={estado} value={estado}>{ETIQUETAS_ESTADO[estado]}</option>
                          ))}
                        </select>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminEquipo;
