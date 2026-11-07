// Utilidades del RUT chileno. Aceptan cualquier formato de entrada (con o sin puntos y guion,
// con k minúscula o mayúscula) y siempre trabajan con el dígito verificador en mayúscula.

// Deja solo dígitos y K (en mayúscula); descarta puntos, guion, espacios y otros símbolos.
export const limpiarRut = (valor) => String(valor ?? '').toUpperCase().replace(/[^0-9K]/g, '');

// Da formato 12.345.678-K mientras se escribe o pega. Sin verificador devuelve solo el cuerpo.
export const formatearRut = (valor) => {
  const caracteres = limpiarRut(valor);
  // Con 8 caracteres hay dos lecturas: cuerpo de 8 dígitos sin verificador, o cuerpo de 7 más su
  // verificador (RUT bajo 10 millones). Se elige la segunda solo si el último dígito es el
  // verificador correcto de los 7 primeros; si no, se sigue esperando el verificador del cuerpo de 8.
  const esCuerpoDeSieteConVerificador =
    caracteres.length === 8 && caracteres[7] === calcularDigitoVerificador(caracteres.slice(0, 7));
  const tieneVerificador = caracteres.length > 8 || caracteres.endsWith('K') || esCuerpoDeSieteConVerificador;
  const cuerpo = (tieneVerificador ? caracteres.slice(0, -1) : caracteres)
    .replace(/\D/g, '')
    .slice(0, 8);
  const verificador = tieneVerificador ? caracteres.slice(-1) : '';
  const cuerpoFormateado = cuerpo.replace(/\B(?=(\d{3})+(?!\d))/g, '.');

  return verificador ? `${cuerpoFormateado}-${verificador}` : cuerpoFormateado;
};

// Dígito verificador (módulo 11) de un cuerpo numérico: '0'-'9' o 'K'.
export const calcularDigitoVerificador = (cuerpo) => {
  let suma = 0;
  let multiplicador = 2;
  for (let i = cuerpo.length - 1; i >= 0; i -= 1) {
    suma += Number(cuerpo[i]) * multiplicador;
    multiplicador = multiplicador === 7 ? 2 : multiplicador + 1;
  }
  const resto = 11 - (suma % 11);
  if (resto === 11) return '0';
  return resto === 10 ? 'K' : String(resto);
};

// Valida largo y dígito verificador de un RUT con o sin formato; la k minúscula es válida.
export const rutValido = (rut) => {
  const limpio = limpiarRut(rut);
  if (!/^\d{7,8}[0-9K]$/.test(limpio)) return false;

  return limpio.slice(-1) === calcularDigitoVerificador(limpio.slice(0, -1));
};

// Si el RUT tiene el largo de un RUT completo (cuerpo de 7 u 8 dígitos + verificador) pero el
// verificador no corresponde, devuelve el DV correcto para ese cuerpo; en otro caso, null.
export const sugerirDigitoVerificador = (rut) => {
  const limpio = limpiarRut(rut);
  if (!/^\d{7,8}[0-9K]$/.test(limpio)) return null;

  const cuerpo = limpio.slice(0, -1);
  const esperado = calcularDigitoVerificador(cuerpo);
  return limpio.slice(-1) === esperado ? null : { cuerpo, digito: esperado };
};
