import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AQUACHILE_THEME } from '../theme';

const Solicitudes = () => {
  const navigate = useNavigate();

  const [solicitudes] = useState([
    {
      id: 1,
      candidato: 'Valentina Ruiz',
      cargo: 'Analista de Operaciones',
      fecha: '2026-09-18',
      estado: 'Pendiente',
      responsable: 'María López'
    },
    {
      id: 2,
      candidato: 'Mateo Flores',
      cargo: 'Ingeniero de Proyectos',
      fecha: '2026-09-20',
      estado: 'En proceso',
      responsable: 'Daniel Rojas'
    },
    {
      id: 3,
      candidato: 'Camila Ortega',
      cargo: 'Coordinador de Calidad',
      fecha: '2026-09-22',
      estado: 'Finalizada',
      responsable: 'Sofía Castro'
    }
  ]);

  const getStatusBadge = (estado) => {
    switch (estado) {
      case 'Finalizada':
        return { background: 'rgba(0, 255, 178, 0.15)', color: '#00FFB2', border: '1px solid #00FFB2' };
      case 'En proceso':
        return { background: 'rgba(0, 242, 254, 0.15)', color: '#00F2FE', border: '1px solid #00F2FE' };
      case 'Pendiente':
      default:
        return { background: 'rgba(255, 126, 95, 0.15)', color: '#FF7E5F', border: '1px solid #FF7E5F' };
    }
  };

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
            Monitoreo en tiempo real del flujo psicolaboral automatizado.
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
              <th style={{ padding: '16px 20px' }}>Cargo</th>
              <th style={{ padding: '16px 20px' }}>Fecha</th>
              <th style={{ padding: '16px 20px' }}>Estado</th>
              <th style={{ padding: '16px 20px' }}>Responsable</th>
              <th style={{ padding: '16px 20px', textAlign: 'center' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {solicitudes.map((sol) => (
              <tr key={sol.id} style={{
                borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                fontSize: '14px'
              }}>
                <td style={{ padding: '16px 20px', fontWeight: '700', color: '#FFFFFF' }}>
                  {sol.candidato}
                </td>
                <td style={{ padding: '16px 20px', color: AQUACHILE_THEME.textMuted }}>
                  {sol.cargo}
                </td>
                <td style={{ padding: '16px 20px', color: AQUACHILE_THEME.textMuted }}>
                  {sol.fecha}
                </td>
                <td style={{ padding: '16px 20px' }}>
                  <span style={{
                    ...getStatusBadge(sol.estado),
                    padding: '5px 12px',
                    borderRadius: '20px',
                    fontSize: '12px',
                    fontWeight: '700',
                    display: 'inline-block'
                  }}>
                    {sol.estado}
                  </span>
                </td>
                <td style={{ padding: '16px 20px', color: AQUACHILE_THEME.textMuted }}>
                  {sol.responsable}
                </td>
                <td style={{ padding: '16px 20px', textAlign: 'center' }}>
                  <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                    <Link
                      to={`/solicitudes/${sol.id}/evaluar`}
                      style={{
                        background: AQUACHILE_THEME.glowButton,
                        color: '#021120',
                        textDecoration: 'none',
                        padding: '6px 14px',
                        borderRadius: '6px',
                        fontSize: '12px',
                        fontWeight: '800',
                        boxShadow: '0 0 10px rgba(0, 242, 254, 0.3)'
                      }}
                    >
                      Evaluar
                    </Link>
                    <Link
                      to={`/solicitudes/${sol.id}`}
                      style={{
                        background: 'rgba(255, 255, 255, 0.08)',
                        color: '#FFFFFF',
                        textDecoration: 'none',
                        padding: '6px 12px',
                        borderRadius: '6px',
                        fontSize: '12px',
                        fontWeight: '600',
                        border: '1px solid rgba(255, 255, 255, 0.15)'
                      }}
                    >
                      Ver Detalle
                    </Link>
                  </div>
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