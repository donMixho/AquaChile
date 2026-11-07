// Utilidades del teléfono móvil chileno: 9 dígitos que empiezan con 9, mostrados como "9 9555 9205".
const LARGO_MOVIL = 9;

// Deja solo los dígitos que forman un móvil: quita un prefijo +56 pegado, descarta lo que
// precede al primer 9 (el número siempre empieza en 9) y limita el largo a 9 dígitos.
export const limpiarTelefono = (valor) => {
  let digitos = String(valor ?? '').replace(/\D/g, '');
  if (/^56\d{9}$/.test(digitos)) digitos = digitos.slice(2);

  return digitos.replace(/^[^9]+/, '').slice(0, LARGO_MOVIL);
};

// Da formato 9 XXXX XXXX mientras se escribe o pega.
export const formatearTelefono = (valor) => {
  const d = limpiarTelefono(valor);

  return [d.slice(0, 1), d.slice(1, 5), d.slice(5, 9)].filter(Boolean).join(' ');
};

// El teléfono es opcional: vacío es válido; si se ingresa, debe tener los 9 dígitos.
export const telefonoValido = (valor) => {
  const d = limpiarTelefono(valor);

  return d.length === 0 || d.length === LARGO_MOVIL;
};
