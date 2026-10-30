import { Link } from 'react-router-dom';

// Color de cada acción: azul editar, rojo eliminar, naranja acción principal, gris neutro.
const TONOS = {
  azul: 'text-blue-600 hover:bg-blue-50 focus-visible:ring-blue-400',
  rojo: 'text-red-600 hover:bg-red-50 focus-visible:ring-red-400',
  naranja: 'text-aqua-orange hover:bg-orange-50 focus-visible:ring-orange-400',
  gris: 'text-gray-600 hover:bg-gray-100 focus-visible:ring-gray-400'
};

// Botón solo-icono. `etiqueta` es el nombre accesible (aria-label) y el tooltip nativo (title).
// Según las props se renderiza como <Link> (to), <a> (href) o <button>.
const BotonIcono = ({ icono: Icono, etiqueta, tono = 'gris', to, href, ...resto }) => {
  const clases = `inline-flex items-center justify-center w-9 h-9 rounded-md bg-transparent border-none
    cursor-pointer no-underline transition-colors duration-150 focus:outline-none focus-visible:ring-2
    disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent ${TONOS[tono]}`;
  const comunes = { 'aria-label': etiqueta, title: etiqueta, className: clases, ...resto };
  const contenido = <Icono />;

  if (to) return <Link to={to} {...comunes}>{contenido}</Link>;
  if (href) return <a href={href} target="_blank" rel="noopener noreferrer" {...comunes}>{contenido}</a>;
  return <button type="button" {...comunes}>{contenido}</button>;
};

export default BotonIcono;
