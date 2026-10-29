import { useId } from 'react';

// Gráfico de barras horizontales con Tailwind: el ancho de cada barra es proporcional al mayor valor.
// datos: [{ etiqueta, valor, color? }] donde color es una clase de fondo de Tailwind.
const BarrasHorizontales = ({ titulo, descripcion, datos, vacio = 'Sin datos para mostrar.' }) => {
  const idTitulo = useId();
  const total = datos.reduce((suma, d) => suma + d.valor, 0);
  const maximo = Math.max(0, ...datos.map((d) => d.valor));

  return (
    <section aria-labelledby={idTitulo} className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
      <h3 id={idTitulo} className="text-sm font-bold uppercase tracking-wider text-aqua-blue m-0">
        {titulo}
      </h3>
      {descripcion && <p className="text-xs text-gray-500 mt-1 mb-0">{descripcion}</p>}

      {total === 0 ? (
        <p className="text-sm text-gray-500 mt-4 mb-0">{vacio}</p>
      ) : (
        <ul className="list-none p-0 mt-4 mb-0 flex flex-col gap-3">
          {datos.map(({ etiqueta, valor, color = 'bg-aqua-orange' }) => {
            const porcentaje = Math.round((valor / total) * 100);
            const ancho = valor === 0 ? 0 : Math.max((valor / maximo) * 100, 2);
            return (
              <li key={etiqueta}>
                <div className="flex justify-between text-sm text-aqua-blue mb-1">
                  <span className="font-semibold">{etiqueta}</span>
                  <span>
                    <strong>{valor}</strong> <span className="text-gray-500">({porcentaje}%)</span>
                  </span>
                </div>
                <div
                  role="progressbar"
                  aria-label={etiqueta}
                  aria-valuenow={valor}
                  aria-valuemin={0}
                  aria-valuemax={maximo}
                  className="h-3 w-full bg-gray-100 rounded-full overflow-hidden"
                >
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${color}`}
                    style={{ width: `${ancho}%` }}
                  />
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
};

export default BarrasHorizontales;
