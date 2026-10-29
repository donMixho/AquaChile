import { useEffect, useState } from 'react';
import { ESTADOS_CANDIDATO, normalizarEstado, obtenerCandidatos } from '../services/candidatosService';
import MetricCard from '../components/MetricCard';
import BarrasHorizontales from '../components/BarrasHorizontales';
import Alerta from '../components/Alerta';

// Color de cada estado en el gráfico; el orden lo da ESTADOS_CANDIDATO (avance del proceso).
const COLOR_ESTADO = {
  Pendiente: 'bg-aqua-orange',
  'En proceso': 'bg-aqua-blue',
  Apto: 'bg-green-600',
  'No apto': 'bg-red-600'
};

const contarPor = (lista, clave) =>
  lista.reduce((acc, item) => {
    const k = clave(item);
    acc[k] = (acc[k] || 0) + 1;
    return acc;
  }, {});

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

  const familias = Object.entries(
    contarPor(candidatos, (c) => c.familia_cargo ?? c.familia ?? 'Sin definir')
  )
    .map(([etiqueta, valor]) => ({ etiqueta, valor }))
    .sort((a, b) => b.valor - a.valor || a.etiqueta.localeCompare(b.etiqueta));

  const porEstado = contarPor(candidatos, normalizarEstado);
  const estados = ESTADOS_CANDIDATO.map((etiqueta) => ({
    etiqueta,
    valor: porEstado[etiqueta] ?? 0,
    color: COLOR_ESTADO[etiqueta]
  }));
  const cifra = (valor) => (cargando ? '...' : valor);

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="text-2xl md:text-3xl font-extrabold text-aqua-dark m-0">Resumen de Reclutamiento</h1>
        <p className="text-sm text-gray-500 mt-1 mb-0">
          Postulantes por familia de cargo y estado de sus evaluaciones.
        </p>
      </header>

      {errorCarga && <Alerta tipo="error">{errorCarga}</Alerta>}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <MetricCard titulo="Total de Solicitudes" valor={cifra(candidatos.length)} to="/solicitudes" />
        <MetricCard
          titulo="Pendientes"
          valor={cifra(porEstado.Pendiente ?? 0)}
          to="/solicitudes"
          detalle="sin evaluar"
          colorValor="text-aqua-orange"
        />
        <MetricCard
          titulo="Aptos"
          valor={cifra(porEstado.Apto ?? 0)}
          to="/solicitudes"
          detalle="evaluación favorable"
          colorValor="text-green-600"
        />
      </div>

      {!cargando && !errorCarga && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <BarrasHorizontales
            titulo="Postulantes por familia de cargo"
            descripcion="Permite ver en qué áreas se concentra la demanda."
            datos={familias.map((f) => ({ ...f, color: 'bg-aqua-blue' }))}
            vacio="Aún no hay candidatos registrados."
          />
          <BarrasHorizontales
            titulo="Registros por estado"
            descripcion="Compara los pendientes con los evaluados."
            datos={estados}
            vacio="Aún no hay candidatos registrados."
          />
        </div>
      )}
    </div>
  );
};

export default Dashboard;
