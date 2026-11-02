import { IconoCheck, IconoProceso, IconoReloj } from './Iconos';

// Estados de una solicitud de cargo; color + icono + texto, igual que InsigniaEstado.
const ESTILOS = {
  Abierta: { icono: IconoReloj, clases: 'bg-orange-50 text-orange-700 border-orange-200' },
  'En proceso': { icono: IconoProceso, clases: 'bg-blue-50 text-blue-700 border-blue-200' },
  Cerrada: { icono: IconoCheck, clases: 'bg-slate-100 text-slate-700 border-slate-300' }
};

const InsigniaSolicitud = ({ estado }) => {
  const { icono: Icono, clases } = ESTILOS[estado] ?? ESTILOS.Abierta;

  return (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-1 text-xs font-semibold ${clases}`}
    >
      <Icono className="w-4 h-4" />
      {ESTILOS[estado] ? estado : 'Abierta'}
    </span>
  );
};

export default InsigniaSolicitud;
