import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { crearSolicitud } from '../services/solicitudesService';
import Alerta from '../components/Alerta';

const ESPERA_REDIRECCION_MS = 1200;

const FAMILIAS = ['Administración y Soporte', 'Ingeniería', 'Calidad y Procesos', 'Operaciones', 'Mantenimiento', 'Jefatura'];

const claseCampo = 'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100';
const claseEtiqueta = 'mb-1 block text-sm font-medium text-slate-700';

function NuevaSolicitud() {
  const navigate = useNavigate();
  const [formulario, setFormulario] = useState({
    titulo: '', cargo: '', familiaCargo: '', vacantes: 1, descripcion: ''
  });
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');
  const [exito, setExito] = useState(false);

  // Tras guardar se muestra el aviso y se vuelve al listado.
  useEffect(() => {
    if (!exito) return undefined;
    const temporizador = setTimeout(() => navigate('/solicitudes'), ESPERA_REDIRECCION_MS);
    return () => clearTimeout(temporizador);
  }, [exito, navigate]);

  const cambiar = (campo) => (e) => setFormulario({ ...formulario, [campo]: e.target.value });

  const enviar = async (e) => {
    e.preventDefault();
    if (guardando) return;
    setError('');
    setGuardando(true);
    try {
      await crearSolicitud(formulario);
      setExito(true);
    } catch (err) {
      setError(err.message);
      setGuardando(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl p-6">
      <h1 className="mb-6 text-2xl font-bold text-slate-800">Nueva Solicitud</h1>

      <form onSubmit={enviar} className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="grid gap-5 md:grid-cols-2">
          <div className="md:col-span-2">
            <label htmlFor="titulo" className={claseEtiqueta}>Título</label>
            <input id="titulo" type="text" required className={claseCampo} value={formulario.titulo}
              onChange={cambiar('titulo')} placeholder="Ej: Reposición turno noche" />
          </div>

          <div>
            <label htmlFor="cargo" className={claseEtiqueta}>Cargo</label>
            <input id="cargo" type="text" required className={claseCampo} value={formulario.cargo}
              onChange={cambiar('cargo')} placeholder="Ej: Analista de Operaciones" />
          </div>

          <div>
            <label htmlFor="familia" className={claseEtiqueta}>Familia de Cargo</label>
            <select id="familia" required className={claseCampo} value={formulario.familiaCargo}
              onChange={cambiar('familiaCargo')}>
              <option value="" disabled>Selecciona una familia</option>
              {FAMILIAS.map((f) => <option key={f} value={f}>{f}</option>)}
            </select>
          </div>

          <div>
            <label htmlFor="vacantes" className={claseEtiqueta}>Vacantes</label>
            <input id="vacantes" type="number" min="1" required className={claseCampo}
              value={formulario.vacantes} onChange={cambiar('vacantes')} />
          </div>

          <div className="md:col-span-2">
            <label htmlFor="descripcion" className={claseEtiqueta}>Descripción</label>
            <textarea id="descripcion" rows="4" className={claseCampo} value={formulario.descripcion}
              onChange={cambiar('descripcion')} />
          </div>
        </div>

        {error && <div className="mt-4"><Alerta>{error}</Alerta></div>}
        {exito && <div className="mt-4"><Alerta tipo="exito">¡Solicitud creada exitosamente! Volviendo al listado...</Alerta></div>}

        <div className="mt-6 flex justify-end gap-3">
          <Link
            to="/solicitudes"
            aria-disabled={guardando || exito}
            className={`inline-flex items-center justify-center rounded-lg border border-aqua-orange bg-transparent px-4 py-2 text-sm font-medium text-aqua-orange transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 ${guardando || exito ? 'pointer-events-none opacity-50' : ''}`}
          >
            Cancelar
          </Link>
          <button
            type="submit"
            disabled={guardando || exito}
            className="inline-flex items-center justify-center rounded-lg bg-aqua-orange px-4 py-2 text-sm font-medium text-white shadow-sm transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 disabled:opacity-70 disabled:cursor-wait"
          >
            {guardando ? 'Guardando...' : 'Crear Solicitud'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default NuevaSolicitud;
