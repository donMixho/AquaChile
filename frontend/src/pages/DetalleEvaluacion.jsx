import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AQUACHILE_THEME } from '../theme';

const DetalleEvaluacion = () => {
  const navigate = useNavigate();

  // Estados del formulario de evaluación
  const [estado, setEstado] = useState('En proceso');
  const [fecha, setFecha] = useState('');
  const [observaciones, setObservaciones] = useState('');

  // Estados para validación y alertas
  const [error, setError] = useState('');
  const [exito, setExito] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();

    // Validación de campos obligatorios
    if (!fecha || !observaciones.trim()) {
      setError('Por favor, selecciona una fecha y escribe tus observaciones antes de guardar.');
      setExito(false);
      return;
    }

    setError('');
    setExito(true);
    console.log("Evaluación registrada:", { estado, fecha, observaciones });

    // Ocultar mensaje tras 3 segundos
    setTimeout(() => setExito(false), 3000);
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
        <p style={{ margin: '4px 0' }}><strong>Candidato:</strong> Juan Pérez González</p>
        <p style={{ margin: '4px 0' }}><strong>Familia de Cargo:</strong> Operaciones</p>
        <p style={{ margin: '4px 0' }}><strong>Cargo a Postular:</strong> Analista de Reclutamiento</p>
        <p style={{ margin: '4px 0' }}>
          <strong>Curriculum Vitae:</strong> <span style={{ color: AQUACHILE_THEME.secondary, textDecoration: 'underline', cursor: 'pointer' }}>Descargar CV_JuanPerez.pdf</span>
        </p>
      </div>

      {/* Formulario de Evaluación */}
      <form onSubmit={handleSubmit} style={{ backgroundColor: AQUACHILE_THEME.surface, padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.06)', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        
        {/* Selector de Estado */}
        <div>
          <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '6px', color: AQUACHILE_THEME.primary }}>
            Estado de la Evaluación:
          </label>
          <select 
            value={estado} 
            onChange={(e) => setEstado(e.target.value)} 
            style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #CCD6DD', outline: 'none' }}
          >
            <option value="En proceso">En proceso</option>
            <option value="Finalizada">Finalizada</option>
          </select>
        </div>

        {/* Fecha de Evaluación */}
        <div>
          <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '6px', color: AQUACHILE_THEME.primary }}>
            Fecha de Evaluación:
          </label>
          <input 
            type="date" 
            value={fecha} 
            onChange={(e) => setFecha(e.target.value)} 
            style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #CCD6DD', outline: 'none', boxSizing: 'border-box' }}
          />
        </div>

        {/* Observaciones */}
        <div>
          <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '6px', color: AQUACHILE_THEME.primary }}>
            Observaciones y Conclusiones:
          </label>
          <textarea 
            rows="4" 
            value={observaciones} 
            onChange={(e) => setObservaciones(e.target.value)} 
            placeholder="Escriba las observaciones del postulante y los resultados preliminares..."
            style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #CCD6DD', outline: 'none', resize: 'vertical', boxSizing: 'border-box' }}
          />
        </div>

        {/* Alertas */}
        {error && (
          <div style={{ backgroundColor: '#FDE8E4', color: '#A93B24', padding: '10px', borderRadius: '6px', fontSize: '14px', borderLeft: '4px solid #A93B24' }}>
            {error}
          </div>
        )}

        {exito && (
          <div style={{ backgroundColor: '#E3F2DC', color: '#2F6914', padding: '10px', borderRadius: '6px', fontSize: '14px', borderLeft: `4px solid ${AQUACHILE_THEME.accent}` }}>
            ¡Evaluación guardada exitosamente!
          </div>
        )}

        {/* Botones */}
        <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
          <button 
            type="submit" 
            style={{ 
              backgroundColor: AQUACHILE_THEME.secondary, 
              color: '#FFFFFF', 
              padding: '10px 20px', 
              border: 'none', 
              borderRadius: '6px', 
              fontWeight: 'bold', 
              cursor: 'pointer' 
            }}
          >
            Guardar Evaluación
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