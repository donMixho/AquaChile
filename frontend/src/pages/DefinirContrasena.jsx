import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../services/supabaseClient';
import LogoAquaChile from '../components/LogoAquaChile';
import Alerta from '../components/Alerta';

const MINIMO = 8;

// Destino del enlace de invitación: la persona ya llega con sesión y solo crea su contraseña.
const DefinirContrasena = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [clave, setClave] = useState('');
  const [repetida, setRepetida] = useState('');
  const [error, setError] = useState('');
  const [guardando, setGuardando] = useState(false);

  if (loading) {
    return <p role="status" className="p-8 text-center text-sm text-gray-600">Verificando enlace...</p>;
  }
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const guardar = async (e) => {
    e.preventDefault();
    if (guardando) return;
    if (clave.length < MINIMO) {
      setError(`La contraseña debe tener al menos ${MINIMO} caracteres.`);
      return;
    }
    if (clave !== repetida) {
      setError('Las contraseñas no coinciden.');
      return;
    }
    setError('');
    setGuardando(true);
    try {
      const { error: errorSupabase } = await supabase.auth.updateUser({ password: clave });
      if (errorSupabase) throw errorSupabase;
      navigate('/', { replace: true });
    } catch (err) {
      setError(`No se pudo guardar la contraseña: ${err?.message ?? 'error desconocido'}`);
    } finally {
      setGuardando(false);
    }
  };

  const campo = 'w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-800';
  const etiqueta = 'mb-1 block text-sm font-semibold text-aqua-blue';

  return (
    <div className="flex min-h-screen items-center justify-center bg-aqua-light px-4">
      <form onSubmit={guardar} className="flex w-full max-w-sm flex-col gap-4 rounded-xl border border-gray-200 bg-white p-6">
        <LogoAquaChile />
        <div>
          <h1 className="m-0 text-xl font-extrabold text-aqua-dark">Crea tu contraseña</h1>
          <p className="m-0 mt-1 text-sm text-gray-600">Con ella entrarás a la plataforma de AquaChile.</p>
        </div>
        <div>
          <label htmlFor="clave" className={etiqueta}>Contraseña nueva</label>
          <input id="clave" type="password" autoComplete="new-password" value={clave} onChange={(e) => setClave(e.target.value)} className={campo} required />
        </div>
        <div>
          <label htmlFor="repetida" className={etiqueta}>Repite la contraseña</label>
          <input id="repetida" type="password" autoComplete="new-password" value={repetida} onChange={(e) => setRepetida(e.target.value)} className={campo} required />
        </div>
        {error && <Alerta>{error}</Alerta>}
        <button
          type="submit"
          disabled={guardando}
          className="cursor-pointer rounded-lg border-none bg-aqua-orange px-5 py-2.5 text-sm font-extrabold text-white hover:bg-[#d9561a] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {guardando ? 'Guardando...' : 'Guardar y entrar'}
        </button>
      </form>
    </div>
  );
};

export default DefinirContrasena;
