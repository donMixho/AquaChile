import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AQUACHILE_THEME } from '../theme';
import { obtenerCandidatos } from '../services/candidatosService';

const Solicitudes = () => {
  const navigate = useNavigate();

  const [candidatos, setCandidatos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [errorCarga, setErrorCarga] = useState('');

  useEffect(() => {
    let activo = true;

    obtenerCandidatos()
      .then((datos) => {
        if (activo) setCandidatos(datos);
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

  return (
    <div>
      {/* Título y Botón Principal Neón */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px' }}>
        <div>
          <h1 style={{
            margin: 0,
            fontSize: '28px',
            fontWeight: '800',
            color: '#FFFFFF',
            textShadow: AQUACHILE_THEME.textGlow
          }}>
            Solicitudes de Evaluación
          </h1>
          <p style={{ color: AQUACHILE_THEME.textMuted, margin: '6px 0 0 0', fontSize: '14px' }}>
            Candidatos registrados disponibles para iniciar una evaluación psicolaboral.
          </p>
        </div>

        <button
          onClick={() => navigate('/solicitudes/nueva')}
          style={{
            background: AQUACHILE_THEME.glowButton,
            color: '#021120',
            border: 'none',
            borderRadius: '10px',
            padding: '12px 22px',
            fontWeight: '800',
            fontSize: '14px',
            cursor: 'pointer',
            boxShadow: '0 0 18px rgba(0, 242, 254, 0.45)',
            transition: 'transform 0.2s'
          }}
        >
          + Nueva Solicitud
        </button>
      </div>

      {/* Tarjeta Glassmorphic con Borde Neón */}
      <div style={{
        background: AQUACHILE_THEME.surface,
        backdropFilter: 'blur(16px)',
        borderRadius: '14px',
        border: `1px solid ${AQUACHILE_THEME.surfaceBorder}`,
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.35)',
        overflow: 'hidden'
      }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{
              background: 'rgba(0, 242, 254, 0.05)',
              borderBottom: `1px solid ${AQUACHILE_THEME.surfaceBorder}`,
              color: AQUACHILE_THEME.primary,
              fontSize: '13px',
              textTransform: 'uppercase',
              letterSpacing: '1px'
            }}>
              <th style={{ padding: '16px 20px' }}>Candidato</th>
              <th style={{ padding: '16px 20px' }}>RUT</th>
              <th style={{ padding: '16px 20px' }}>Cargo / Familia</th>
              <th style={{ padding: '16px 20px' }}>Correo</th>
            </tr>
          </thead>
          <tbody>
            {cargando ? (
              <tr><td colSpan="4" style={{ padding: '24px', textAlign: 'center', color: AQUACHILE_THEME.textMuted }}>Cargando candidatos...</td></tr>
            ) : errorCarga ? (
              <tr><td colSpan="4" role="alert" style={{ padding: '24px', textAlign: 'center', color: '#FF7B7B' }}>{errorCarga}</td></tr>
            ) : candidatos.length === 0 ? (
              <tr><td colSpan="4" style={{ padding: '24px', textAlign: 'center', color: AQUACHILE_THEME.textMuted }}>No hay candidatos registrados.</td></tr>
            ) : candidatos.map((candidato) => (
              <tr key={candidato.id} style={{
                borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                fontSize: '14px'
              }}>
                <td style={{ padding: '16px 20px', fontWeight: '700', color: '#FFFFFF' }}>
                  {candidato.nombre_completo ?? candidato.nombre}
                </td>
                <td style={{ padding: '16px 20px', color: AQUACHILE_THEME.textMuted }}>
                  {candidato.rut}
                </td>
                <td style={{ padding: '16px 20px', color: AQUACHILE_THEME.textMuted }}>
                  <div>{candidato.cargo || '—'}</div>
                  <small>{candidato.familia_cargo ?? candidato.familia ?? '—'}</small>
                </td>
                <td style={{ padding: '16px 20px', color: AQUACHILE_THEME.textMuted }}>
                  {candidato.email || '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Solicitudes;