import { useState } from 'react';
import { obtenerEvaluacion } from '../services/evaluacionesService';
import { descargarInformePdf } from '../utils/informePdf';

const foco = 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-aqua-orange';

// Descarga el PDF de la entrevista ya guardada del candidato. Lee la entrevista al pulsar, así que
// siempre refleja lo último guardado y respeta las reglas de acceso de la base de datos.
const BotonInformePdf = ({ candidato, solicitud = null }) => {
  const [generando, setGenerando] = useState(false);
  const [error, setError] = useState('');

  const descargar = async () => {
    if (generando) return;
    setGenerando(true);
    setError('');
    try {
      const evaluacion = await obtenerEvaluacion(candidato.id);
      if (!evaluacion) {
        setError('Esta persona aún no tiene una entrevista registrada.');
        return;
      }
      await descargarInformePdf({ candidato, solicitud, evaluacion });
    } catch (e) {
      setError(`No se pudo generar el PDF: ${e?.message ?? 'error desconocido'}`);
    } finally {
      setGenerando(false);
    }
  };

  return (
    <div className="flex flex-col items-start gap-1">
      <button
        type="button"
        onClick={descargar}
        disabled={generando}
        className={`cursor-pointer rounded-lg border border-aqua-blue bg-white px-3 py-2 text-sm font-bold text-aqua-blue transition-colors duration-200 hover:bg-aqua-light disabled:cursor-not-allowed disabled:opacity-50 ${foco}`}
      >
        {generando ? 'Generando PDF...' : 'Descargar PDF de la entrevista'}
      </button>
      {error && <p role="alert" className="m-0 text-xs text-red-700">{error}</p>}
    </div>
  );
};

export default BotonInformePdf;
