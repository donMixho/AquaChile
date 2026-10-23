import { useEffect, useState } from 'react';
import { obtenerCandidatos } from '../services/candidatosService';
import MetricCard from '../components/MetricCard';
import Alerta from '../components/Alerta';

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
        padding: '20px',
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
        
        <MetricCard
          titulo="Total de Solicitudes"
          valor={cargando ? '...' : candidatos.length}
          to="/solicitudes"
        />

        {!cargando && porFamilia.map(([familia, cantidad]) => (
          <MetricCard
            key={familia}
            titulo={familia}
            valor={cantidad}
            to="/candidatos"
            detalle={cantidad === 1 ? 'candidato' : 'candidatos'}
            colorValor="text-aqua-orange"
          />
        ))}

      </div>
      {errorCarga && <Alerta tipo="error">{errorCarga}</Alerta>}

    </div>
  );
};

export default Dashboard;