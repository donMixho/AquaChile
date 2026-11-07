// Ventana de confirmación con la paleta clara de la app: tarjeta blanca sobre fondo atenuado.
const Modal = ({ titulo, idTitulo, icono, tono = 'azul', children }) => (
  <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-aqua-dark/60 px-4">
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={idTitulo}
      className="w-full max-w-md rounded-xl border border-gray-200 bg-white p-6 shadow-xl"
    >
      <div className="flex items-center gap-3 mb-4">
        {icono && <span className={tono === 'rojo' ? 'text-red-600' : 'text-aqua-orange'}>{icono}</span>}
        <h3 id={idTitulo} className="m-0 text-xl font-extrabold text-aqua-blue">{titulo}</h3>
      </div>
      {children}
    </div>
  </div>
);

export const BotonModal = ({ variante = 'primario', ...props }) => {
  const estilos = {
    primario: 'bg-aqua-orange text-white border-transparent',
    peligro: 'bg-red-600 text-white border-transparent',
    secundario: 'bg-white text-aqua-blue border-aqua-blue'
  };
  return (
    <button
      type="button"
      {...props}
      className={`px-5 py-2 rounded-lg border text-sm font-bold cursor-pointer transition-all duration-200
        hover:shadow-md hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed
        disabled:hover:shadow-none disabled:hover:translate-y-0 ${estilos[variante]}`}
    />
  );
};

export default Modal;
