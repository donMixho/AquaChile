import { normalizarEstado } from '../services/candidatosService';
import { IconoCheck, IconoEquis, IconoProceso, IconoReloj } from './Iconos';

// Cada estado combina color, icono y texto: no depende solo del color para entenderse.
const ESTILOS = {
  Pendiente: { icono: IconoReloj, clases: 'bg-orange-50 text-orange-700 border-orange-200' },
  'En proceso': { icono: IconoProceso, clases: 'bg-blue-50 text-blue-700 border-blue-200' },
  Apto: { icono: IconoCheck, clases: 'bg-green-50 text-green-700 border-green-200' },
  'No apto': { icono: IconoEquis, clases: 'bg-red-50 text-red-700 border-red-200' }
};

// Recibe el registro del candidato (usa `estado`); sin dato se muestra Pendiente.
const InsigniaEstado = ({ candidato }) => {
  const estado = normalizarEstado(candidato);
  const { icono: Icono, clases } = ESTILOS[estado];

  return (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-1 text-xs font-semibold ${clases}`}
    >
      <Icono className="w-4 h-4" />
      {estado}
    </span>
  );
};

export default InsigniaEstado;
