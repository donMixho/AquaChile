import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AQUACHILE_THEME } from '../theme';
import Alerta from '../components/Alerta';
import { actualizarEstadoCandidato, obtenerCandidatoPorId } from '../services/candidatosService';

// Tiempo que se muestra el mensaje de éxito antes de volver al listado.
const ESPERA_REDIRECCION_MS = 1500;

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

  return (
    <div style={{ maxWidth: '680px', margin: '0 auto', fontFamily: 'Segoe UI, sans-serif', color: AQUACHILE_THEME.text }}>
      
      {/* Título Principal */}
      <h2 style={{ color: AQUACHILE_THEME.primary, borderBottom: `2px solid ${AQUACHILE_THEME.secondary}`, paddingBottom: '8px' }}>
        Detalle de Evaluación Psicolaboral
      </h2>

      {/* Tarjeta de Información del Candidato */}
      <div style={{ backgroundColor: AQUACHILE_THEME.surface, padding: '18px', borderRadius: '8px', marginBottom: '20px', borderLeft: `5px solid ${AQUACHILE_THEME.primary}`, boxShadow: '0 2px 4px rgba(0,0,0,0.06)' }}>
        <h3 style={{ margin: '0 0 10px 0', color: AQUACHILE_THEME.primary, fontSize: '16px' }}>Datos de la Solicitud</h3>
        {cargando && <p style={{ margin: '4px 0' }}>Cargando candidato...</p>}
        {errorCarga && <Alerta tipo="error">{errorCarga}</Alerta>}
        {candidato && (
          <>
            <p style={{ margin: '4px 0' }}><strong>Candidato:</strong> {candidato.nombre_completo}</p>
            <p style={{ margin: '4px 0' }}><strong>Familia de Cargo:</strong> {candidato.familia_cargo ?? '—'}</p>
            <p style={{ margin: '4px 0' }}><strong>Cargo a Postular:</strong> {candidato.cargo ?? '—'}</p>
            <p style={{ margin: '4px 0' }}>
              <strong>Curriculum Vitae:</strong>{' '}
              {candidato.cv_url ? (
                <a href={candidato.cv_url} target="_blank" rel="noreferrer" style={{ color: AQUACHILE_THEME.secondary }}>
                  Descargar CV
                </a>
              ) : (
                'No adjunto'
              )}
            </p>
          </>
        )}
      </div>

      {/* Formulario de Evaluación */}
      <form onSubmit={handleSubmit} style={{ backgroundColor: AQUACHILE_THEME.surface, padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.06)', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        
        {/* Selector de Estado */}
        <div>
          <label htmlFor="estado" style={{ fontWeight: 'bold', display: 'block', marginBottom: '6px', color: AQUACHILE_THEME.primary }}>
            Estado de la Evaluación:
          </label>
          <select 
            id="estado"
            value={estado} 
            onChange={(e) => setEstado(e.target.value)} 
            style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #CCD6DD', outline: 'none' }}
          >
            <option value="En proceso">En proceso</option>
            <option value="Apto">Apto</option>
            <option value="No apto">No apto</option>
          </select>
        </div>

        {/* Fecha de Evaluación */}
        <div>
          <label htmlFor="fecha" style={{ fontWeight: 'bold', display: 'block', marginBottom: '6px', color: AQUACHILE_THEME.primary }}>
            Fecha de Evaluación:
          </label>
          <input 
            type="date" 
            id="fecha"
            value={fecha} 
            onChange={(e) => setFecha(e.target.value)} 
            style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #CCD6DD', outline: 'none', boxSizing: 'border-box' }}
          />
        </div>

        {/* Observaciones */}
        <div>
          <label htmlFor="observaciones" style={{ fontWeight: 'bold', display: 'block', marginBottom: '6px', color: AQUACHILE_THEME.primary }}>
            Observaciones y Conclusiones:
          </label>
          <textarea 
            id="observaciones"
            rows="4" 
            value={observaciones} 
            onChange={(e) => setObservaciones(e.target.value)} 
            placeholder="Escriba las observaciones del postulante y los resultados preliminares..."
            style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #CCD6DD', outline: 'none', resize: 'vertical', boxSizing: 'border-box' }}
          />
        </div>

        {/* Alertas */}
        {error && <Alerta tipo="error">{error}</Alerta>}

        {exito && <Alerta tipo="exito">¡Evaluación guardada exitosamente! Volviendo al listado...</Alerta>}

        {/* Botones */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginTop: '8px' }}>
          <button 
            type="submit"
            disabled={guardando || exito || !candidato}
            style={{
              backgroundColor: AQUACHILE_THEME.secondary,
              color: '#FFFFFF',
              padding: '10px 20px',
              border: 'none',
              borderRadius: '6px',
              fontWeight: 'bold',
              cursor: guardando || exito || !candidato ? 'not-allowed' : 'pointer',
              opacity: guardando || exito || !candidato ? 0.6 : 1
            }}
          >
            {guardando ? 'Guardando...' : 'Guardar Evaluación'}
          </button>
          
          <button 
            type="button" 
            onClick={handleVolver} 
            style={{ 
              backgroundColor: '#6C7A89', 
              color: '#FFFFFF', 
              padding: '10px 20px', 
              border: 'none', 
              borderRadius: '6px', 
              fontWeight: 'bold', 
              cursor: 'pointer' 
            }}
          >
            Volver al listado
          </button>
        </div>

      </form>
    </div>
  );
};

export default DetalleEvaluacion;