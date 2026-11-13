// Formato de nombres de personas: "marco antonio" -> "Marco Antonio".
// Se aplica mientras se escribe, así que conserva un espacio final (para poder seguir con la
// siguiente palabra) pero no deja espacios al inicio ni espacios dobles.
export const formatearNombre = (valor) =>
  String(valor ?? '')
    .replace(/^\s+/, '')
    .replace(/\s{2,}/g, ' ')
    .toLocaleLowerCase('es-CL')
    .replace(/(^|[\s'’-])(\p{L})/gu, (_, separador, letra) => separador + letra.toLocaleUpperCase('es-CL'));

// Versión final para guardar: además quita el espacio del final.
export const normalizarNombre = (valor) => formatearNombre(valor).trim();

// Iniciales para el avatar: "marco antonio pérez" -> "MA".
export const iniciales = (valor) =>
  String(valor ?? '')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((palabra) => palabra[0].toLocaleUpperCase('es-CL'))
    .join('');
