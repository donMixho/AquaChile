import { useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { actualizarCandidato, normalizarEstado, obtenerCandidatos } from '../services/candidatosService';
import BotonIcono from '../components/BotonIcono';
import Alerta from '../components/Alerta';
import Modal, { BotonModal } from '../components/Modal';
import InsigniaEstado from '../components/InsigniaEstado';
import { AuthContext, usePuede } from '../context/AuthContext';
import { PERMISOS, ROLES } from '../context/permisos';
import { IconoEditar, IconoEvaluar, IconoVer } from '../components/Iconos';

// La tabla usa nombre_completo/familia_cargo; la interfaz trabaja con nombre/familia.
const paraVista = (candidato) => ({
  ...candidato,
  nombre: candidato.nombre_completo ?? candidato.nombre,
  familia: candidato.familia_cargo ?? candidato.familia
});

const claseCampo = 'w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-800 outline-none focus:border-aqua-orange focus:ring-2 focus:ring-orange-100';
const claseEtiqueta = 'mb-1 block text-sm font-semibold text-aqua-blue';

const Candidatos = () => {
  const navigate = useNavigate();
  const puede = usePuede();
  const puedeCrear = puede(PERMISOS.CREAR_CANDIDATO);
  const puedeEditar = puede(PERMISOS.EDITAR_CANDIDATO);
  const puedeEntrevistar = puede(PERMISOS.EVALUAR);

  // Operaciones recibe a los candidatos que superaron la primera etapa: por defecto ve solo los "Apto".
  const auth = useContext(AuthContext);
  const esOperaciones = auth?.rol === ROLES.OPERACIONES;
  const esReclutador = auth?.rol === ROLES.RECLUTADOR;
  const [soloAptos, setSoloAptos] = useState(esOperaciones);
  // El reclutador parte viendo solo a sus candidatos (los que registró o le asignó el admin).
  const [soloMios, setSoloMios] = useState(true);

  const [candidatos, setCandidatos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [errorCarga, setErrorCarga] = useState('');

  const [modalEditar, setModalEditar] = useState(null);
  const [notificacion, setNotificacion] = useState('');
  const [errorEmail, setErrorEmail] = useState('');
  const [guardandoEdicion, setGuardandoEdicion] = useState(false);
  const [errorGuardado, setErrorGuardado] = useState('');

  useEffect(() => {
    let activo = true;

    obtenerCandidatos()
      .then((datos) => {
        if (activo) {
          setCandidatos(datos.map(paraVista));
        }
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

  // 1. Guardar cambios con validación estricta de correo sin espacios y persistencia en Supabase
  const guardarEdicion = async (e) => {
    e.preventDefault();
    if (guardandoEdicion) return;

    // Verificación de espacios
    if (modalEditar.email.includes(' ')) {
      setErrorEmail('El correo no puede contener espacios en blanco.');
      return;
    }

    // Verificación de formato estándar
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(modalEditar.email)) {
      setErrorEmail('Ingresa un formato de correo válido (ej: nombre@dominio.cl).');
      return;
    }

    setErrorEmail('');
    setErrorGuardado('');
    setGuardandoEdicion(true);
    try {
      // La lista se actualiza con la fila que devuelve la base, no con lo que se escribió.
      const guardado = await actualizarCandidato(modalEditar.id, {
        nombre: modalEditar.nombre,
        cargo: modalEditar.cargo,
        email: modalEditar.email
      });
      setCandidatos((lista) => lista.map((c) => (c.id === guardado.id ? paraVista(guardado) : c)));
      setModalEditar(null);
      lanzarNotificacion('Datos del candidato actualizados con éxito.');
    } catch (error) {
      setErrorGuardado(`No se pudieron guardar los cambios: ${error?.message ?? 'error desconocido'}`);
    } finally {
      setGuardandoEdicion(false);
    }
  };

  // Sin la migración de asignación los candidatos no traen `reclutador_id`: no hay "mis candidatos".
  const hayAsignacion = candidatos.some((c) => 'reclutador_id' in c);
  const filtraMios = esReclutador && hayAsignacion && soloMios;
  const visibles = candidatos
    .filter((c) => !(esOperaciones && soloAptos) || normalizarEstado(c) === 'Apto')
    .filter((c) => !filtraMios || c.reclutador_id === auth.user?.id);

  const lanzarNotificacion = (msg) => {
    setNotificacion(msg);
    setTimeout(() => setNotificacion(''), 4000);
  };

  return (
    <div style={{ minHeight: '85vh', fontFamily: "'Segoe UI', Roboto, sans-serif" }}>
      
      {/* Notificación flotante superior */}
      {notificacion && (
        <div role="status" className="mb-5 flex items-center justify-between gap-3 rounded-lg border border-green-200 bg-green-50 px-5 py-3 text-sm font-semibold text-green-900">
          <span>{notificacion}</span>
          <button
            type="button"
            aria-label="Cerrar aviso"
            onClick={() => setNotificacion('')}
            className="bg-transparent border-none text-green-900 cursor-pointer text-lg"
          >
            ✕
          </button>
        </div>
      )}

      {/* Encabezado */}
      <div className="bg-white px-6 py-4 rounded-lg shadow-sm border border-gray-100 mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-aqua-blue font-bold" style={{
            fontSize: '28px',
            margin: 0
          }}>
            Gestión de Candidatos
          </h1>
          <p style={{ color: '#6b7280', margin: '4px 0 0 0', fontSize: '14px' }}>
            Base de postulantes para procesos de evaluación y selección AquaChile.
          </p>
        </div>

        {puedeCrear && (
          <button
            onClick={() => navigate('/candidatos/nuevo')}
            className="transition-all duration-200 hover:shadow-md hover:-translate-y-0.5"
            style={{
              background: '#f26522',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '10px',
              padding: '12px 20px',
              fontWeight: '800',
              fontSize: '14px',
              cursor: 'pointer'
            }}
          >
            + Nuevo Candidato
          </button>
        )}
      </div>

      {esReclutador && hayAsignacion && (
        <div role="group" aria-label="Filtro de candidatos" className="flex gap-2 mb-4">
          {[['Mis candidatos', true], ['Todos', false]].map(([etiqueta, valor]) => (
            <button
              key={etiqueta}
              type="button"
              aria-pressed={soloMios === valor}
              onClick={() => setSoloMios(valor)}
              className={`px-4 py-2 rounded-lg text-sm font-bold border cursor-pointer ${
                soloMios === valor
                  ? 'bg-aqua-blue text-white border-aqua-blue'
                  : 'bg-white text-aqua-blue border-gray-200'
              }`}
            >
              {etiqueta}
            </button>
          ))}
        </div>
      )}

      {esOperaciones && (
        <div role="group" aria-label="Filtro de candidatos" className="flex gap-2 mb-4">
          {[['Todos', false], ['Solo Aptos', true]].map(([etiqueta, valor]) => (
            <button
              key={etiqueta}
              type="button"
              aria-pressed={soloAptos === valor}
              onClick={() => setSoloAptos(valor)}
              className={`px-4 py-2 rounded-lg text-sm font-bold border cursor-pointer ${
                soloAptos === valor
                  ? 'bg-aqua-blue text-white border-aqua-blue'
                  : 'bg-white text-aqua-blue border-gray-200'
              }`}
            >
              {etiqueta}
            </button>
          ))}
        </div>
      )}

      {/* Tabla (mismo estilo que Solicitudes) */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-x-auto">
        <table className="w-full min-w-[760px] border-collapse text-left">
          <thead>
            <tr className="bg-aqua-light border-b border-gray-200 text-aqua-blue text-xs uppercase tracking-wider">
              <th className="px-5 py-4">Candidato</th>
              <th className="px-5 py-4">RUT</th>
              <th className="px-5 py-4">Cargo / Área</th>
              <th className="px-5 py-4">Estado</th>
              <th className="px-5 py-4">Contacto</th>
              <th className="px-5 py-4">CV</th>
              <th className="px-5 py-4 text-center">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {cargando ? (
              <tr><td colSpan="7" className="p-6 text-center text-gray-500">Cargando candidatos...</td></tr>
            ) : errorCarga ? (
              <tr><td colSpan="7" role="alert" className="p-6 text-center text-red-700">{errorCarga}</td></tr>
            ) : visibles.length === 0 ? (
              <tr><td colSpan="7" className="p-6 text-center text-gray-500">
                {candidatos.length === 0
                  ? 'No hay candidatos registrados.'
                  : filtraMios
                    ? 'No tienes candidatos asignados. Cambia a «Todos» para ver el resto.'
                    : 'No hay candidatos en estado Apto.'}
              </td></tr>
            ) : visibles.map((c) => (
              <tr key={c.id} className="border-b border-gray-100 text-sm">
                <td className="px-5 py-4 font-bold text-aqua-blue">{c.nombre}</td>
                <td className="px-5 py-4 text-gray-700">{c.rut}</td>
                <td className="px-5 py-4 text-gray-700">
                  <div>{c.cargo}</div>
                  <small className="text-gray-500">{c.familia}</small>
                </td>
                <td className="px-5 py-4"><InsigniaEstado candidato={c} /></td>
                <td className="px-5 py-4 text-gray-700">{c.email}</td>
                <td className="px-5 py-4">
                  {c.cv_url ? (
                    <BotonIcono icono={IconoVer} etiqueta={`Ver CV de ${c.nombre}`} tono="gris" href={c.cv_url} />
                  ) : (
                    <span className="text-gray-500 text-xs">Sin adjunto</span>
                  )}
                  {c.drive_folder_url && (
                    <a
                      href={c.drive_folder_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`Carpeta Drive de ${c.nombre}`}
                      className="block mt-1 text-xs font-semibold text-blue-600 hover:underline"
                    >
                      Carpeta Drive
                    </a>
                  )}
                </td>
                <td className="px-5 py-4">
                  <div className="flex gap-1 justify-center">
                    {puedeEditar && (
                      <BotonIcono
                        icono={IconoEditar}
                        etiqueta={`Editar candidato ${c.nombre}`}
                        tono="azul"
                        onClick={() => {
                          setErrorEmail('');
                          setErrorGuardado('');
                          setModalEditar({ ...c });
                        }}
                      />
                    )}
                    {puedeEntrevistar && !['Apto', 'No apto'].includes(normalizarEstado(c)) && (
                      <BotonIcono
                        icono={IconoEvaluar}
                        etiqueta={`${normalizarEstado(c) === 'En proceso' ? 'Continuar la entrevista de' : 'Entrevistar a'} ${c.nombre}`}
                        tono="naranja"
                        to={`/entrevista/${c.id}`}
                      />
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* --- MODAL EDITAR CANDIDATO --- */}
      {modalEditar && (
        <Modal titulo="Editar Candidato" idTitulo="titulo-editar" icono={<IconoEditar className="w-6 h-6" />}>
          <form onSubmit={guardarEdicion} className="flex flex-col gap-4">
            <div>
              <label htmlFor="edit-nombre" className={claseEtiqueta}>Nombre Completo:</label>
              <input
                id="edit-nombre"
                type="text"
                value={modalEditar.nombre}
                onChange={(e) => setModalEditar({ ...modalEditar, nombre: e.target.value })}
                className={claseCampo}
                required
              />
            </div>

            <div>
              <label htmlFor="edit-cargo" className={claseEtiqueta}>Cargo al que postula:</label>
              <input
                id="edit-cargo"
                type="text"
                value={modalEditar.cargo}
                onChange={(e) => setModalEditar({ ...modalEditar, cargo: e.target.value })}
                className={claseCampo}
                required
              />
            </div>

            <div>
              <label htmlFor="edit-email" className={claseEtiqueta}>Correo Electrónico (sin espacios):</label>
              <input
                id="edit-email"
                type="email"
                value={modalEditar.email}
                /* Filtra espacios automáticamente al pegar o escribir */
                onChange={(e) => {
                  const textoLimpio = e.target.value.replace(/\s/g, '');
                  setModalEditar({ ...modalEditar, email: textoLimpio });
                  if (errorEmail) setErrorEmail('');
                }}
                /* Bloquea la barra espaciadora en vivo */
                onKeyDown={(e) => {
                  if (e.key === ' ' || e.code === 'Space') e.preventDefault();
                }}
                placeholder="ejemplo@aquachile.cl"
                className={`${claseCampo} ${errorEmail ? 'border-red-500' : ''}`}
                required
              />
              {errorEmail && (
                <span className="block mt-1 text-xs font-bold text-red-700">{errorEmail}</span>
              )}
            </div>

            {errorGuardado && <Alerta>{errorGuardado}</Alerta>}

            <div className="flex justify-end gap-3 mt-2">
              <BotonModal
                variante="secundario"
                disabled={guardandoEdicion}
                onClick={() => {
                  setErrorEmail('');
                  setErrorGuardado('');
                  setModalEditar(null);
                }}
              >
                Cancelar
              </BotonModal>
              <BotonModal type="submit" disabled={guardandoEdicion}>
                {guardandoEdicion ? 'Guardando...' : 'Guardar Cambios'}
              </BotonModal>
            </div>
          </form>
        </Modal>
      )}

    </div>
  );
};

export default Candidatos;
