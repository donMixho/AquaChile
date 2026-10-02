import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AQUACHILE_THEME } from '../theme';

const DetalleSolicitud = () => {
  const navigate = useNavigate();
  const { id } = useParams();

  // Datos simulados del candidato (reemplaza datos fijos anteriores)
  const [candidato] = useState({
    nombre: 'Valentina Ruiz González',
    correo: 'v.ruiz.postulaciones@aquachile-demo.cl',
    telefono: '+56 9 7412 8593',
    cargo: 'Analista de Operaciones',
    familia: 'Operaciones & Logística',
    cvUrl: '#'
  });

  // Estados interactivos para el registro de evaluación
  const [estado, setEstado] = useState('En proceso');
  const [fecha, setFecha] = useState('');
  const [observaciones, setObservaciones] = useState('');
  const [error, setError] = useState('');
  const [exito, setExito] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!fecha || !observaciones.trim()) {
      setError('Por favor, selecciona una fecha y registra las observaciones de la evaluación.');
      setExito(false);
      return;
    }

    setError('');
    setExito(true);
    console.log("Evaluación guardada exitosamente:", { id, estado, fecha, observaciones });

    setTimeout(() => {
      setExito(false);
    }, 3500);
  };

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', fontFamily: "'Segoe UI', Roboto, sans-serif" }}>
      
      {/* Título de la vista con máximo contraste */}
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{
          color: '#FFFFFF',
          fontSize: '28px',
          fontWeight: '800',
          margin: 0,
          textShadow: AQUACHILE_THEME.textGlow || '0 0 10px rgba(0,242,254,0.5)'
        }}>
          Detalle de Solicitud y Evaluación {id ? `(#${id})` : ''}
        </h1>
        <p style={{ color: AQUACHILE_THEME.textMuted || '#94B4CB', margin: '6px 0 0 0', fontSize: '14px' }}>
          Expediente del postulante y registro del informe psicolaboral.
        </p>
      </div>

      {/* Grid de 2 columnas estilo Glassmorphism */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: '24px',
        alignItems: 'start'
      }}>
        
        {/* Columna Izquierda: Antecedentes del Candidato */}
        <div style={{
          background: AQUACHILE_THEME.surface || 'rgba(7, 30, 49, 0.75)',
          backdropFilter: 'blur(16px)',
          border: `1px solid ${AQUACHILE_THEME.surfaceBorder || 'rgba(0, 242, 254, 0.25)'}`,
          borderRadius: '14px',
          padding: '24px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
        }}>
          <h2 style={{
            color: AQUACHILE_THEME.primary || '#00F2FE',
            fontSize: '18px',
            marginTop: 0,
            marginBottom: '16px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
            paddingBottom: '10px'
          }}>
            Antecedentes del Candidato
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '14px' }}>
            <div>
              <span style={{ color: AQUACHILE_THEME.textMuted || '#94B4CB', display: 'block', fontSize: '12px' }}>Nombre</span>
              <strong style={{ color: '#FFFFFF', fontSize: '16px' }}>{candidato.nombre}</strong>
            </div>

            <div>
              <span style={{ color: AQUACHILE_THEME.textMuted || '#94B4CB', display: 'block', fontSize: '12px' }}>Correo Electrónico</span>
              <span style={{ color: '#E2E8F0' }}>{candidato.correo}</span>
            </div>

            <div>
              <span style={{ color: AQUACHILE_THEME.textMuted || '#94B4CB', display: 'block', fontSize: '12px' }}>Teléfono</span>
              <span style={{ color: '#E2E8F0' }}>{candidato.telefono}</span>
            </div>

            <div>
              <span style={{ color: AQUACHILE_THEME.textMuted || '#94B4CB', display: 'block', fontSize: '12px' }}>Cargo al que postula</span>
              <strong style={{ color: '#FFFFFF' }}>{candidato.cargo}</strong>
            </div>

            <div>
              <span style={{ color: AQUACHILE_THEME.textMuted || '#94B4CB', display: 'block', fontSize: '12px', marginBottom: '4px' }}>Familia de cargo</span>
              <span style={{
                background: 'rgba(0, 242, 254, 0.15)',
                color: AQUACHILE_THEME.primary || '#00F2FE',
                padding: '4px 10px',
                borderRadius: '12px',
                fontSize: '12px',
                fontWeight: '600',
                border: '1px solid rgba(0, 242, 254, 0.3)',
                display: 'inline-block'
              }}>
                {candidato.familia}
              </span>
            </div>

            <div style={{ marginTop: '8px', paddingTop: '12px', borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
              <span style={{ color: AQUACHILE_THEME.textMuted || '#94B4CB', display: 'block', fontSize: '12px', marginBottom: '4px' }}>Documentación</span>
              <a href={candidato.cvUrl} onClick={(e) => { e.preventDefault(); alert("Descargando CV_Valentina_Ruiz.pdf"); }} style={{ color: AQUACHILE_THEME.accent || '#00FFB2', textDecoration: 'none', fontWeight: 'bold', fontSize: '13px' }}>
                📄 Ver Curriculum Vitae (CV)
              </a>
            </div>
          </div>
        </div>

        {/* Columna Derecha: Formulario de Evaluación */}
        <div style={{
          background: AQUACHILE_THEME.surface || 'rgba(7, 30, 49, 0.75)',
          backdropFilter: 'blur(16px)',
          border: `1px solid ${AQUACHILE_THEME.surfaceBorder || 'rgba(0, 242, 254, 0.25)'}`,
          borderRadius: '14px',
          padding: '24px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
        }}>
          <h2 style={{
            color: AQUACHILE_THEME.primary || '#00F2FE',
            fontSize: '18px',
            marginTop: 0,
            marginBottom: '16px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
            paddingBottom: '10px'
          }}>
            Registro de Evaluación
          </h2>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            
            {/* Estado */}
            <div>
              <label style={{ display: 'block', color: '#E2E8F0', fontSize: '13px', fontWeight: '600', marginBottom: '6px' }}>
                Estado de la solicitud:
              </label>
              <select
                value={estado}
                onChange={(e) => setEstado(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  background: 'rgba(2, 17, 32, 0.8)',
                  color: '#FFFFFF',
                  outline: 'none',
                  fontSize: '14px'
                }}
              >
                <option value="En proceso" style={{ background: '#021120', color: '#FFF' }}>En proceso</option>
                <option value="Finalizada" style={{ background: '#021120', color: '#FFF' }}>Finalizada</option>
                <option value="Pendiente" style={{ background: '#021120', color: '#FFF' }}>Pendiente</option>
              </select>
            </div>

            {/* Fecha */}
            <div>
              <label style={{ display: 'block', color: '#E2E8F0', fontSize: '13px', fontWeight: '600', marginBottom: '6px' }}>
                Fecha de evaluación:
              </label>
              <input
                type="date"
                value={fecha}
                onChange={(e) => setFecha(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  background: 'rgba(2, 17, 32, 0.8)',
                  color: '#FFFFFF',
                  outline: 'none',
                  fontSize: '14px',
                  boxSizing: 'border-box',
                  colorScheme: 'dark'
                }}
              />
            </div>

            {/* Observaciones */}
            <div>
              <label style={{ display: 'block', color: '#E2E8F0', fontSize: '13px', fontWeight: '600', marginBottom: '6px' }}>
                Observaciones y Resultados:
              </label>
              <textarea
                rows="4"
                value={observaciones}
                onChange={(e) => setObservaciones(e.target.value)}
                placeholder="Ingrese las conclusiones de la entrevista y evaluación psicolaboral..."
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  background: 'rgba(2, 17, 32, 0.8)',
                  color: '#FFFFFF',
                  outline: 'none',
                  fontSize: '14px',
                  resize: 'vertical',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            {/* Alertas */}
            {error && (
              <div style={{
                background: 'rgba(255, 75, 75, 0.15)',
                border: '1px solid #FF4B4B',
                color: '#FF8080',
                padding: '10px',
                borderRadius: '8px',
                fontSize: '13px'
              }}>
                {error}
              </div>
            )}

            {exito && (
              <div style={{
                background: 'rgba(0, 255, 178, 0.15)',
                border: '1px solid #00FFB2',
                color: '#00FFB2',
                padding: '10px',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: 'bold'
              }}>
                ¡Evaluación registrada y guardada exitosamente!
              </div>
            )}

            {/* Botones */}
            <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
              <button
                type="submit"
                style={{
                  flex: 1,
                  background: AQUACHILE_THEME.glowButton || 'linear-gradient(135deg, #00F2FE 0%, #008289 100%)',
                  color: '#021120',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '12px',
                  fontWeight: '800',
                  fontSize: '14px',
                  cursor: 'pointer',
                  boxShadow: '0 0 16px rgba(0, 242, 254, 0.4)'
                }}
              >
                Guardar Evaluación
              </button>

              <button
                type="button"
                onClick={() => navigate('/solicitudes')}
                style={{
                  background: 'rgba(255, 255, 255, 0.08)',
                  color: '#FFFFFF',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  borderRadius: '8px',
                  padding: '12px 18px',
                  fontWeight: '600',
                  fontSize: '14px',
                  cursor: 'pointer'
                }}
              >
                Volver al listado
              </button>
            </div>

          </form>
        </div>

      </div>

    </div>
  );
};

export default DetalleSolicitud;