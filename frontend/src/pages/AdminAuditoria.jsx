import { useEffect, useMemo, useState } from 'react';
import {
  ACCIONES_AUDITORIA,
  ETIQUETAS_ACCION,
  ETIQUETAS_TABLA,
  camposModificados,
  obtenerRegistrosAuditoria
} from '../services/auditoriaService';
import Alerta from '../components/Alerta';

const campo = 'rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-800';

const formatearFecha = (fecha) =>
  new Date(fecha).toLocaleString('es-CL', { dateStyle: 'short', timeStyle: 'medium', timeZone: 'America/Santiago' });

// Registro de auditoría: quién hizo qué y cuándo. Solo lectura; no muestra los valores de los
// campos (pueden ser datos personales), únicamente cuáles cambiaron.
const AdminAuditoria = () => {
  const [registros, setRegistros] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [errorCarga, setErrorCarga] = useState('');
  const [tabla, setTabla] = useState('');
  const [accion, setAccion] = useState('');

  useEffect(() => {
    let activo = true;
    obtenerRegistrosAuditoria()
      .then((datos) => activo && setRegistros(datos))
      .catch((error) => activo && setErrorCarga(error?.message ?? 'No se pudo cargar el registro.'))
      .finally(() => activo && setCargando(false));
    return () => {
      activo = false;
    };
  }, []);

  const visibles = useMemo(
    () => registros.filter((r) => (!tabla || r.tabla === tabla) && (!accion || r.accion === accion)),
    [registros, tabla, accion]
  );

  return (
    <section aria-labelledby="titulo-auditoria">
      <h1 id="titulo-auditoria" className="m-0 text-2xl font-bold text-aqua-blue">
        Registro de auditoría
      </h1>
      <p className="mb-5 mt-1 text-sm text-gray-600">
        Últimos {registros.length || 200} movimientos sobre datos sensibles. El registro no se puede editar ni borrar.
      </p>

      <div className="mb-4 flex flex-wrap gap-3">
        <label className="text-sm font-semibold text-aqua-blue">
          Tabla{' '}
          <select className={campo} value={tabla} onChange={(e) => setTabla(e.target.value)}>
            <option value="">Todas</option>
            {Object.entries(ETIQUETAS_TABLA).map(([valor, etiqueta]) => (
              <option key={valor} value={valor}>{etiqueta}</option>
            ))}
          </select>
        </label>
        <label className="text-sm font-semibold text-aqua-blue">
          Acción{' '}
          <select className={campo} value={accion} onChange={(e) => setAccion(e.target.value)}>
            <option value="">Todas</option>
            {ACCIONES_AUDITORIA.map((a) => (
              <option key={a} value={a}>{ETIQUETAS_ACCION[a]}</option>
            ))}
          </select>
        </label>
      </div>

      {errorCarga && <Alerta>{errorCarga}</Alerta>}

      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-gray-200 text-xs uppercase tracking-wider text-gray-600">
            <tr>
              <th className="px-5 py-3">Fecha</th>
              <th className="px-5 py-3">Usuario</th>
              <th className="px-5 py-3">Acción</th>
              <th className="px-5 py-3">Registro</th>
              <th className="px-5 py-3">Campos modificados</th>
            </tr>
          </thead>
          <tbody>
            {cargando && (
              <tr><td colSpan={5} className="px-5 py-6 text-center text-gray-500">Cargando registro...</td></tr>
            )}
            {!cargando && !errorCarga && visibles.length === 0 && (
              <tr><td colSpan={5} className="px-5 py-6 text-center text-gray-500">Sin movimientos para mostrar.</td></tr>
            )}
            {visibles.map((r) => (
              <tr key={r.id} className="border-b border-gray-100 align-top">
                <td className="whitespace-nowrap px-5 py-3">{formatearFecha(r.creado_en)}</td>
                <td className="px-5 py-3">
                  {r.usuario_email ?? 'Sistema'}
                  {r.rol && <span className="block text-xs text-gray-600">{r.rol}</span>}
                </td>
                <td className="px-5 py-3">{ETIQUETAS_ACCION[r.accion] ?? r.accion}</td>
                <td className="px-5 py-3">
                  {ETIQUETAS_TABLA[r.tabla] ?? r.tabla}
                  <span className="block text-xs text-gray-600">#{r.registro_id}</span>
                </td>
                <td className="px-5 py-3 text-gray-700">{camposModificados(r).join(', ') || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
};

export default AdminAuditoria;
