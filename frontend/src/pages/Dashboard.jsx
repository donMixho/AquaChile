import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { AQUACHILE_THEME } from '../theme';
import solicitudesData from '../data/solicitudesMock.json';

const Dashboard = () => {
  const [solicitudes, setSolicitudes] = useState([]);

  useEffect(() => {
    setSolicitudes(solicitudesData);
  }, []);

  const totalSolicitudes = solicitudes.length;
  const enProceso = solicitudes.filter(s => s.estado === 'En Proceso' || s.estado === 'En proceso').length;
  const finalizadas = solicitudes.filter(s => s.estado === 'Finalizada').length;
  const pendientes = solicitudes.filter(s => s.estado === 'Pendiente').length;

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', fontFamily: "'Segoe UI', Roboto, sans-serif" }}>
      
      {/* ENCABEZADO Y BIENVENIDA CON MÁXIMA CLARIDAD */}
      <div style={{
        background: 'rgba(7, 30, 49, 0.75)',
        backdropFilter: 'blur(14px)',
        border: '1px solid rgba(0, 242, 254, 0.25)',
        borderRadius: '14px',
        padding: '24px 28px',
        marginBottom: '28px',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
      }}>
        <h1 style={{
          color: '#FFFFFF',
          fontSize: '28px',
          fontWeight: '900',
          margin: 0,
          letterSpacing: '0.5px',
          textShadow: '0 0 14px rgba(0, 242, 254, 0.5)'
        }}>
          Panel de Control - Reclutamiento & Selección
        </h1>
        
        {/* Frase de Bienvenida: AHORA BLANCA, LUMINOSA Y ULTRA LEGIBLE */}
        <p style={{
          color: '#FFFFFF',
          fontSize: '16px',
          fontWeight: '600',
          margin: '10px 0 0 0',
          letterSpacing: '0.3px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <span style={{ color: '#00F2FE' }}>●</span> Bienvenido al Sistema de Gestión de Evaluaciones Psicolaborales.
        </p>
      </div>

      {/* TARJETAS DE MÉTRICAS */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '20px',
        marginBottom: '32px'
      }}>
        
        {/* Total */}
        <div style={{
          background: 'rgba(7, 30, 49, 0.72)',
          border: '1px solid rgba(0, 242, 254, 0.3)',
          borderRadius: '12px',
          padding: '20px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.2)'
        }}>
          <p style={{ color: '#94B4CB', fontSize: '12px', margin: 0, fontWeight: '700', letterSpacing: '1px', textTransform: 'uppercase' }}>
            TOTAL SOLICITUDES
          </p>
          <h2 style={{ color: '#FFFFFF', fontSize: '32px', margin: '8px 0 0 0', fontWeight: '800' }}>
            {totalSolicitudes}
          </h2>
        </div>

        {/* En Proceso */}
        <div style={{
          background: 'rgba(7, 30, 49, 0.72)',
          border: '1px solid #00F2FE',
          borderRadius: '12px',
          padding: '20px',
          boxShadow: '0 0 16px rgba(0, 242, 254, 0.2)'
        }}>
          <p style={{ color: '#00F2FE', fontSize: '12px', margin: 0, fontWeight: '700', letterSpacing: '1px', textTransform: 'uppercase' }}>
            EN PROCESO
          </p>
          <h2 style={{ color: '#00F2FE', fontSize: '32px', margin: '8px 0 0 0', fontWeight: '800' }}>
            {enProceso}
          </h2>
        </div>

        {/* Finalizadas */}
        <div style={{
          background: 'rgba(7, 30, 49, 0.72)',
          border: '1px solid #00FFB2',
          borderRadius: '12px',
          padding: '20px',
          boxShadow: '0 0 16px rgba(0, 255, 178, 0.2)'
        }}>
          <p style={{ color: '#00FFB2', fontSize: '12px', margin: 0, fontWeight: '700', letterSpacing: '1px', textTransform: 'uppercase' }}>
            FINALIZADAS
          </p>
          <h2 style={{ color: '#00FFB2', fontSize: '32px', margin: '8px 0 0 0', fontWeight: '800' }}>
            {finalizadas}
          </h2>
        </div>

        {/* Pendientes */}
        <div style={{
          background: 'rgba(7, 30, 49, 0.72)',
          border: '1px solid #FF7E5F',
          borderRadius: '12px',
          padding: '20px',
          boxShadow: '0 0 16px rgba(255, 126, 95, 0.2)'
        }}>
          <p style={{ color: '#FF7E5F', fontSize: '12px', margin: 0, fontWeight: '700', letterSpacing: '1px', textTransform: 'uppercase' }}>
            PENDIENTES
          </p>
          <h2 style={{ color: '#FF7E5F', fontSize: '32px', margin: '8px 0 0 0', fontWeight: '800' }}>
            {pendientes}
          </h2>
        </div>

      </div>

      {/* TABLA DE SOLICITUDES RECIENTES */}
      <div style={{
        background: 'rgba(7, 30, 49, 0.72)',
        backdropFilter: 'blur(16px)',
        borderRadius: '14px',
        border: '1px solid rgba(0, 242, 254, 0.22)',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.35)',
        overflow: 'hidden'
      }}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
          <h2 style={{ color: '#FFFFFF', fontSize: '18px', margin: 0, fontWeight: '700' }}>
            Solicitudes Recientes
          </h2>
        </div>
        
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{
              background: 'rgba(0, 242, 254, 0.05)',
              borderBottom: '1px solid rgba(0, 242, 254, 0.2)',
              color: '#00F2FE',
              fontSize: '12px',
              textTransform: 'uppercase',
              letterSpacing: '1px'
            }}>
              <th style={{ padding: '14px 20px' }}>Candidato</th>
              <th style={{ padding: '14px 20px' }}>Cargo</th>
              <th style={{ padding: '14px 20px' }}>Familia</th>
              <th style={{ padding: '14px 20px' }}>Estado</th>
              <th style={{ padding: '14px 20px', textAlign: 'center' }}>Acción</th>
            </tr>
          </thead>
          <tbody>
            {solicitudes.map((item) => (
              <tr key={item.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)', fontSize: '14px' }}>
                <td style={{ padding: '16px 20px', fontWeight: '700', color: '#FFFFFF' }}>{item.candidato}</td>
                <td style={{ padding: '16px 20px', color: '#B4D3E8' }}>{item.cargo}</td>
                <td style={{ padding: '16px 20px', color: '#B4D3E8' }}>{item.familiaCargo}</td>
                <td style={{ padding: '16px 20px' }}>
                  <span style={{
                    backgroundColor: item.estado === 'Finalizada' ? 'rgba(0, 255, 178, 0.15)' : (item.estado === 'En Proceso' || item.estado === 'En proceso') ? 'rgba(0, 242, 254, 0.15)' : 'rgba(255, 126, 95, 0.15)',
                    color: item.estado === 'Finalizada' ? '#00FFB2' : (item.estado === 'En Proceso' || item.estado === 'En proceso') ? '#00F2FE' : '#FF7E5F',
                    border: `1px solid ${item.estado === 'Finalizada' ? '#00FFB2' : (item.estado === 'En Proceso' || item.estado === 'En proceso') ? '#00F2FE' : '#FF7E5F'}`,
                    padding: '4px 12px',
                    borderRadius: '20px',
                    fontSize: '12px',
                    fontWeight: '700'
                  }}>
                    {item.estado}
                  </span>
                </td>
                <td style={{ padding: '16px 20px', textAlign: 'center' }}>
                  <Link
                    to={`/solicitudes/${item.id}/evaluar`}
                    style={{
                      background: 'linear-gradient(135deg, #00F2FE 0%, #008289 100%)',
                      color: '#021120',
                      padding: '6px 16px',
                      borderRadius: '6px',
                      textDecoration: 'none',
                      fontSize: '12px',
                      fontWeight: '800',
                      boxShadow: '0 0 12px rgba(0, 242, 254, 0.35)'
                    }}
                  >
                    Evaluar
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

    </div>
  );
};

export default Dashboard;