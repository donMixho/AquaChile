import { Link } from 'react-router-dom';

const claseTarjeta = 'block no-underline bg-white border border-gray-200 border-t-4 border-t-aqua-orange rounded-xl p-5 shadow-sm hover:shadow-md hover:scale-105 transition-transform cursor-pointer';

const MetricCard = ({ titulo, valor, to, detalle, colorValor = 'text-aqua-blue' }) => (
  <Link to={to} className={claseTarjeta}>
    <p className="text-xs font-bold uppercase tracking-wider text-aqua-blue m-0">{titulo}</p>
    <h2 className={`text-4xl font-extrabold ${colorValor} mt-2 mb-0`}>{valor}</h2>
    {detalle && <p className="text-xs text-gray-500 mt-1 mb-0">{detalle}</p>}
  </Link>
);

export default MetricCard;
