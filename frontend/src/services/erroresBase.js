// Supabase responde con estos códigos cuando el API no encuentra una tabla o columna en su caché:
// normalmente porque falta ejecutar una migración de docs/.
const TABLA_NO_ENCONTRADA = 'PGRST205';
const COLUMNA_NO_ENCONTRADA = 'PGRST204';

const mencionaTabla = (error) => /could not find the table|schema cache/i.test(error?.message ?? '');
const mencionaColumna = (error) => /could not find the '.+' column/i.test(error?.message ?? '');

// Convierte el error técnico en una instrucción. Si no es de este tipo, lo devuelve igual.
export const traducirFaltaDeMigracion = (error, { tabla, archivo }) => {
  if (error?.code === COLUMNA_NO_ENCONTRADA || mencionaColumna(error)) {
    return new Error(`La tabla «${tabla}» está desactualizada. Vuelve a ejecutar docs/${archivo} en Supabase (SQL Editor).`, { cause: error });
  }
  if (error?.code === TABLA_NO_ENCONTRADA || mencionaTabla(error)) {
    return new Error(`Falta crear la tabla «${tabla}». Ejecuta docs/${archivo} en Supabase (SQL Editor).`, { cause: error });
  }
  return error;
};
