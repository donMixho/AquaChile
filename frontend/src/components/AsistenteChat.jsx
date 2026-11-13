import { useContext, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { ROLES } from '../context/permisos';
import { consultarAsistente } from '../services/llm';
import { IconoAsistente, IconoCerrar, IconoEliminar } from './Iconos';

const foco = 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-aqua-orange';
const MARCADOR = /\[CANDIDATO:([\w-]+)\]/g;

const BIENVENIDA = {
  [ROLES.ADMIN]: 'Hola, soy el asistente de selección de AquaChile. Puedo ayudarte a buscar y comparar candidatos, entrevistas y solicitudes.',
  [ROLES.RECLUTADOR]: 'Hola, soy el asistente de selección de AquaChile. Puedo ayudarte a buscar candidatos por cargo, experiencia o estado, y a revisar sus entrevistas.',
  [ROLES.OPERACIONES]: 'Hola, soy el asistente de selección de AquaChile. Como parte de Operaciones, solo consulto candidatos Aptos: puedo ayudarte a comparar quiénes calzan con tu turno.'
};

const SUGERENCIAS = {
  [ROLES.ADMIN]: [
    'Resumen de postulantes por cargo',
    '¿Quiénes están Aptos pendientes de decisión?',
    'Candidatos con experiencia en maquinaria o planta'
  ],
  [ROLES.RECLUTADOR]: [
    'Candidatos con experiencia en maquinaria o planta',
    'Resumen de postulantes por cargo',
    '¿Quiénes están Aptos pendientes de decisión?'
  ],
  [ROLES.OPERACIONES]: [
    '¿Quiénes están Aptos pendientes de decisión?',
    'Aptos con experiencia en maquinaria o planta',
    'Aptos con disponibilidad para turnos de noche'
  ]
};

// A dónde lleva el enlace de un candidato según lo que cada rol puede abrir: solo el reclutador
// entra a la ficha de entrevista; el resto va a su lista de candidatos.
const rutaCandidato = (rol, id) => {
  if (rol === ROLES.RECLUTADOR) return `/entrevista/${id}`;
  if (rol === ROLES.ADMIN) return '/seguimiento';
  return '/candidatos';
};

// Convierte los marcadores [CANDIDATO:id] de la respuesta en enlaces navegables.
const RespuestaConEnlaces = ({ texto, rol }) => {
  const partes = [];
  let ultimo = 0;
  for (const coincidencia of texto.matchAll(MARCADOR)) {
    partes.push(texto.slice(ultimo, coincidencia.index));
    partes.push(
      <Link
        key={`${coincidencia.index}-${coincidencia[1]}`}
        to={rutaCandidato(rol, coincidencia[1])}
        className={`font-semibold text-orange-700 underline ${foco}`}
      >
        Ver ficha
      </Link>
    );
    ultimo = coincidencia.index + coincidencia[0].length;
  }
  partes.push(texto.slice(ultimo));
  return <p className="m-0 whitespace-pre-wrap">{partes}</p>;
};

// Asistente flotante (esquina inferior derecha) para admin, reclutador y operaciones.
const AsistenteChat = () => {
  const auth = useContext(AuthContext);
  const rol = auth?.rol;
  const habilitado = Boolean(auth?.user) && Object.values(ROLES).includes(rol);

  const [abierto, setAbierto] = useState(false);
  const [mensajes, setMensajes] = useState([]);
  const [texto, setTexto] = useState('');
  const [cargando, setCargando] = useState(false);
  const fin = useRef(null);

  useEffect(() => {
    fin.current?.scrollIntoView?.({ block: 'end' });
  }, [mensajes, cargando, abierto]);

  if (!habilitado) return null;

  const enviar = async (consulta) => {
    const pregunta = String(consulta ?? '').trim();
    if (!pregunta || cargando) return;

    const historial = mensajes.filter((m) => !m.error);
    setMensajes((lista) => [...lista, { rol: 'usuario', texto: pregunta }]);
    setTexto('');
    setCargando(true);
    const respuesta = await consultarAsistente(pregunta, historial);
    setMensajes((lista) => [...lista, { rol: 'asistente', texto: respuesta.texto, error: !respuesta.ok }]);
    setCargando(false);
  };

  const limpiar = () => {
    setMensajes([]);
    setTexto('');
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end gap-3">
      {abierto && (
        <section
          role="dialog"
          aria-label="Asistente de reclutamiento"
          className="flex h-[32rem] max-h-[calc(100vh-6rem)] w-[calc(100vw-2rem)] max-w-96 flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xl"
        >
          <header className="flex items-center justify-between gap-2 bg-aqua-dark px-4 py-3 text-white">
            <h2 className="m-0 text-base font-bold">Asistente de selección</h2>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={limpiar}
                disabled={mensajes.length === 0 && !cargando}
                aria-label="Limpiar conversación"
                title="Limpiar conversación"
                className={`cursor-pointer rounded-lg border-none bg-transparent p-1.5 text-white hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40 ${foco}`}
              >
                <IconoEliminar className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => setAbierto(false)}
                aria-label="Cerrar asistente"
                className={`cursor-pointer rounded-lg border-none bg-transparent p-1.5 text-white hover:bg-white/10 ${foco}`}
              >
                <IconoCerrar className="h-4 w-4" />
              </button>
            </div>
          </header>

          <div role="log" aria-live="polite" className="flex flex-1 flex-col gap-3 overflow-y-auto bg-aqua-light px-4 py-4 text-sm">
            <p className="m-0 max-w-[85%] rounded-2xl rounded-bl-sm bg-white px-3 py-2 text-gray-800 shadow-sm">
              {BIENVENIDA[rol]}
            </p>

            {mensajes.length === 0 && (
              <div className="flex flex-wrap gap-2" aria-label="Sugerencias">
                {SUGERENCIAS[rol].map((sugerencia) => (
                  <button
                    key={sugerencia}
                    type="button"
                    onClick={() => enviar(sugerencia)}
                    disabled={cargando}
                    className={`cursor-pointer rounded-full border border-aqua-blue bg-white px-3 py-1.5 text-left text-xs font-semibold text-aqua-blue hover:bg-aqua-light disabled:opacity-50 ${foco}`}
                  >
                    {sugerencia}
                  </button>
                ))}
              </div>
            )}

            {mensajes.map((m, indice) =>
              m.rol === 'usuario' ? (
                <p key={indice} className="m-0 max-w-[85%] self-end whitespace-pre-wrap rounded-2xl rounded-br-sm bg-aqua-dark px-3 py-2 text-white">
                  {m.texto}
                </p>
              ) : (
                <div
                  key={indice}
                  role={m.error ? 'alert' : undefined}
                  className={`max-w-[85%] rounded-2xl rounded-bl-sm px-3 py-2 shadow-sm ${
                    m.error ? 'bg-red-50 text-red-800' : 'bg-white text-gray-800'
                  }`}
                >
                  <RespuestaConEnlaces texto={m.texto} rol={rol} />
                </div>
              )
            )}

            {cargando && (
              <p role="status" className="m-0 flex items-center gap-2 text-gray-600">
                <span className="flex gap-1" aria-hidden="true">
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-aqua-orange" />
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-aqua-orange [animation-delay:150ms]" />
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-aqua-orange [animation-delay:300ms]" />
                </span>
                Analizando expedientes...
              </p>
            )}
            <div ref={fin} />
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              enviar(texto);
            }}
            className="flex gap-2 border-t border-gray-200 bg-white p-3"
          >
            <label htmlFor="asistente-consulta" className="sr-only">
              Escribe tu consulta
            </label>
            <input
              id="asistente-consulta"
              type="text"
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
              maxLength={1000}
              placeholder="Escribe tu consulta..."
              className="min-w-0 flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-800"
            />
            <button
              type="submit"
              disabled={cargando || !texto.trim()}
              className={`cursor-pointer rounded-lg border-none bg-aqua-orange px-4 py-2 text-sm font-bold text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50 ${foco}`}
            >
              Enviar
            </button>
          </form>
        </section>
      )}

      <button
        type="button"
        onClick={() => setAbierto(!abierto)}
        aria-expanded={abierto}
        aria-label={abierto ? 'Ocultar asistente' : 'Abrir asistente'}
        className={`flex h-14 w-14 cursor-pointer items-center justify-center rounded-full border-none bg-aqua-orange text-white shadow-lg transition-transform duration-200 hover:scale-105 ${foco}`}
      >
        <IconoAsistente className="h-7 w-7" />
      </button>
    </div>
  );
};

export default AsistenteChat;
