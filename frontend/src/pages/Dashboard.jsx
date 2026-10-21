import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { obtenerCandidatos } from '../services/candidatosService';

const claseTarjeta = 'block no-underline bg-white border border-gray-200 border-t-4 border-t-aqua-orange rounded-xl p-5 shadow-sm hover:shadow-md hover:scale-105 transition-transform cursor-pointer';
const claseEtiqueta = 'text-xs font-bold uppercase tracking-wider text-aqua-blue m-0';

const Dashboard = () => {
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

  const porFamilia = Object.entries(
    candidatos.reduce((acc, candidato) => {
      const familia = candidato.familia_cargo ?? candidato.familia ?? 'Sin definir';
      acc[familia] = (acc[familia] || 0) + 1;
      return acc;
    }, {})
  ).sort((x, y) => x[0].localeCompare(y[0]));

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
          letterSpacing: '0.5px'
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
        
        {/* Total de Solicitudes */}
        <Link to="/solicitudes" className={claseTarjeta}>
          <p className={claseEtiqueta}>Total de Solicitudes</p>
          <h2 className="text-4xl font-extrabold text-aqua-blue mt-2 mb-0">
            {cargando ? '...' : candidatos.length}
          </h2>
        </Link>

        {/* Una tarjeta por familia de cargo */}
        {!cargando && porFamilia.map(([familia, cantidad]) => (
          <Link key={familia} to="/candidatos" className={claseTarjeta}>
            <p className={claseEtiqueta}>{familia}</p>
            <h2 className="text-4xl font-extrabold text-aqua-orange mt-2 mb-0">{cantidad}</h2>
            <p className="text-xs text-gray-500 mt-1 mb-0">
              {cantidad === 1 ? 'candidato' : 'candidatos'}
            </p>
          </Link>
        ))}

      </div>

      {/* LISTADO DE CANDIDATOS RECIENTES */}
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
            Candidatos Recientes
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
              <th style={{ padding: '14px 20px' }}>Contacto</th>
              <th style={{ padding: '14px 20px', textAlign: 'center' }}>Acción</th>
            </tr>
          </thead>
          <tbody>
            {cargando ? (
              <tr><td colSpan="5" style={{ padding: '24px', textAlign: 'center', color: '#B4D3E8' }}>Cargando candidatos...</td></tr>
            ) : errorCarga ? (
              <tr><td colSpan="5" role="alert" style={{ padding: '24px', textAlign: 'center', color: '#FF7B7B' }}>{errorCarga}</td></tr>
            ) : candidatos.length === 0 ? (
              <tr><td colSpan="5" style={{ padding: '24px', textAlign: 'center', color: '#B4D3E8' }}>No hay candidatos registrados.</td></tr>
            ) : candidatos.slice(0, 5).map((candidato) => (
              <tr key={candidato.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)', fontSize: '14px' }}>
                <td style={{ padding: '16px 20px', fontWeight: '700', color: '#FFFFFF' }}>{candidato.nombre_completo ?? candidato.nombre}</td>
                <td style={{ padding: '16px 20px', color: '#B4D3E8' }}>{candidato.cargo || '—'}</td>
                <td style={{ padding: '16px 20px', color: '#B4D3E8' }}>{candidato.familia_cargo ?? candidato.familia ?? '—'}</td>
                <td style={{ padding: '16px 20px', color: '#B4D3E8' }}>{candidato.email || '—'}</td>
                <td style={{ padding: '16px 20px', textAlign: 'center' }}>
                  <Link to="/candidatos" className="inline-block transition-all duration-200 hover:shadow-md hover:-translate-y-0.5" style={{
                    background: 'linear-gradient(135deg, #00F2FE 0%, #008289 100%)',
                    color: '#021120',
                    padding: '6px 16px',
                    borderRadius: '6px',
                    textDecoration: 'none',
                    fontSize: '12px',
                    fontWeight: '800'
                  }}>
                    Ver candidatos
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