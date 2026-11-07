import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Alerta from '../components/Alerta';
import InsigniaEstado from '../components/InsigniaEstado';
import { actualizarEstadoCandidato, obtenerCandidatoPorId } from '../services/candidatosService';

// Tiempo que se muestra el mensaje de éxito antes de volver al listado.
const ESPERA_REDIRECCION_MS = 1500;

// Fecha de hoy en el mismo formato que entrega <input type="date"> (AAAA-MM-DD). Usa la hora
// local: toISOString() usaría UTC y, de noche en Chile, devolvería el día siguiente.
const fechaDeHoy = () => {
  const hoy = new Date();
  const dos = (n) => String(n).padStart(2, '0');
  return `${hoy.getFullYear()}-${dos(hoy.getMonth() + 1)}-${dos(hoy.getDate())}`;
};

const DetalleEvaluacion = () => {
  const navigate = useNavigate();
  const { id } = useParams();

  // Candidato real, cargado desde Supabase
  const [candidato, setCandidato] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [errorCarga, setErrorCarga] = useState('');

  // Estados del formulario de evaluación
  const [estado, setEstado] = useState('En proceso');
  const [fecha, setFecha] = useState('');
  const [observaciones, setObservaciones] = useState('');

  // Estados para validación y alertas
  const [error, setError] = useState('');
  const [exito, setExito] = useState(false);
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    let activo = true;

    obtenerCandidatoPorId(id)
      .then((datos) => {
        if (!activo) return;
        setCandidato(datos);
        // Parte del estado actual para no pisarlo sin querer
        if (['En proceso', 'Apto', 'No apto'].includes(datos.estado)) setEstado(datos.estado);
      })
      .catch((e) => {
        if (activo) setErrorCarga(`No se pudo cargar el candidato: ${e?.message ?? 'error desconocido'}`);
      })
      .finally(() => {
        if (activo) setCargando(false);
      });

    return () => {
      activo = false;
    };
  }, [id]);

  // Tras guardar, vuelve al listado; el temporizador se cancela si el usuario sale antes.
  useEffect(() => {
    if (!exito) return undefined;
    const temporizador = setTimeout(() => navigate('/solicitudes'), ESPERA_REDIRECCION_MS);
    return () => clearTimeout(temporizador);
  }, [exito, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (guardando || exito) return;

    // Validación de campos obligatorios
    if (!fecha || !observaciones.trim()) {
      setError('Por favor, selecciona una fecha y escribe tus observaciones antes de guardar.');
      return;
    }

    setError('');
    setGuardando(true);
    try {
      await actualizarEstadoCandidato(id, estado);
      setExito(true);
    } catch (err) {
      setError(`No se pudo guardar la evaluación: ${err?.message ?? 'error desconocido'}`);
    } finally {
      setGuardando(false);
    }
  };

  const handleVolver = () => {
    navigate('/solicitudes');
  };

  const campo = 'w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-800 outline-none focus:border-aqua-orange focus:ring-2 focus:ring-aqua-orange/30';
  const etiqueta = 'mb-1.5 block text-sm font-bold text-aqua-blue';
  const bloqueado = guardando || exito || !candidato;

  return (
    <div className="mx-auto max-w-2xl">
      {/* Encabezado */}
      <div className="mb-6 rounded-lg border border-gray-100 bg-white px-6 py-4 shadow-sm">
        <h2 className="m-0 text-2xl font-bold text-aqua-blue">Detalle de Evaluación Psicolaboral</h2>
      </div>

      {/* Tarjeta de información del candidato */}
      <div className="mb-5 rounded-xl border border-gray-200 bg-white p-5 text-sm text-gray-700 shadow-sm">
        <h3 className="mb-3 mt-0 text-base font-bold text-aqua-dark">Datos de la Solicitud</h3>
        {cargando && <p className="my-1 text-gray-500">Cargando candidato...</p>}
        {errorCarga && <Alerta tipo="error">{errorCarga}</Alerta>}
        {candidato && (
          <>
            <p className="my-1"><strong className="text-aqua-blue">Candidato:</strong> {candidato.nombre_completo}</p>
            <p className="my-1"><strong className="text-aqua-blue">Familia de Cargo:</strong> {candidato.familia_cargo ?? '—'}</p>
            <p className="my-1"><strong className="text-aqua-blue">Cargo a Postular:</strong> {candidato.cargo ?? '—'}</p>
            <p className="my-1 flex items-center gap-2">
              <strong className="text-aqua-blue">Estado actual:</strong> <InsigniaEstado candidato={candidato} />
            </p>
            <p className="my-1">
              <strong className="text-aqua-blue">Curriculum Vitae:</strong>{' '}
              {candidato.cv_url ? (
                <a href={candidato.cv_url} target="_blank" rel="noreferrer" className="font-semibold text-orange-700 hover:underline">
                  Descargar CV
                </a>
              ) : (
                'No adjunto'
              )}
            </p>
          </>
        )}
      </div>

      {/* Formulario de evaluación */}
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <div>
          <label htmlFor="estado" className={etiqueta}>Estado de la Evaluación:</label>
          <select id="estado" value={estado} onChange={(e) => setEstado(e.target.value)} className={campo}>
            <option value="En proceso">En proceso</option>
            <option value="Apto">Apto</option>
            <option value="No apto">No apto</option>
          </select>
        </div>

        <div>
          <label htmlFor="fecha" className={etiqueta}>Fecha de Evaluación:</label>
          <div className="flex gap-2">
            <input type="date" id="fecha" value={fecha} onChange={(e) => setFecha(e.target.value)} className={campo} />
            <button
              type="button"
              onClick={() => setFecha(fechaDeHoy())}
              className="shrink-0 cursor-pointer whitespace-nowrap rounded-lg border border-aqua-orange bg-white px-4 py-2.5 text-sm font-bold text-aqua-orange hover:bg-aqua-orange hover:text-white"
            >
              Fecha actual
            </button>
          </div>
        </div>

        <div>
          <label htmlFor="observaciones" className={etiqueta}>Observaciones y Conclusiones:</label>
          <textarea
            id="observaciones"
            rows="4"
            value={observaciones}
            onChange={(e) => setObservaciones(e.target.value)}
            placeholder="Escriba las observaciones del postulante y los resultados preliminares..."
            className={`${campo} resize-y`}
          />
        </div>

        {error && <Alerta tipo="error">{error}</Alerta>}
        {exito && <Alerta tipo="exito">¡Evaluación guardada exitosamente! Volviendo al listado...</Alerta>}

        <div className="mt-2 flex flex-wrap gap-3">
          <button
            type="submit"
            disabled={bloqueado}
            className={`rounded-lg bg-aqua-orange px-5 py-2.5 text-sm font-bold text-white transition-all duration-200 ${
              bloqueado ? 'cursor-not-allowed opacity-60' : 'cursor-pointer hover:-translate-y-0.5 hover:shadow-md'
            }`}
          >
            {guardando ? 'Guardando...' : 'Guardar Evaluación'}
          </button>

          <button
            type="button"
            onClick={handleVolver}
            className="cursor-pointer rounded-lg bg-aqua-blue px-5 py-2.5 text-sm font-bold text-white hover:bg-aqua-dark"
          >
            Volver al listado
          </button>
        </div>
      </form>
    </div>
  );
};

export default DetalleEvaluacion;
