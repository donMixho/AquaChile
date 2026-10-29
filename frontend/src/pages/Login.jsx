import { useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import LogoAquaChile from '../components/LogoAquaChile';

// Traduce el error de Supabase a un mensaje útil: credenciales, red/CORS o configuración.
// eslint-disable-next-line react-refresh/only-export-components
export const mensajeDeError = (err) => {
  const msg = String(err?.message ?? '');
  if (err?.status === 0 || /failed to fetch|network|load failed/i.test(msg)) {
    return 'No se pudo conectar con el servidor de autenticación. Revisa tu conexión o la configuración de Supabase (URL y CORS).';
  }
  if (err?.status === 401 || /invalid api key|no api key/i.test(msg)) {
    return 'La clave de Supabase no es válida. Revisa VITE_SUPABASE_ANON_KEY en el archivo .env.';
  }
  if (err?.status === 429) {
    return 'Demasiados intentos. Espera un momento e intenta nuevamente.';
  }
  if (/email not confirmed/i.test(msg)) {
    return 'Tu correo aún no está confirmado. Revisa tu bandeja de entrada.';
  }
  if (err?.status === 400 || /invalid login credentials/i.test(msg)) {
    return 'Correo o contraseña incorrectos. Verifica tus credenciales e intenta nuevamente.';
  }
  return 'No fue posible iniciar sesión. Intenta nuevamente en unos minutos.';
};

const Login = () => {
  const { user, loading, signIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const destino = location.state?.from?.pathname ?? '/';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState('');

  if (!loading && user) return <Navigate to={destino} replace />;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setEnviando(true);
    try {
      await signIn(email.trim(), password);
      navigate(destino, { replace: true });
    } catch (err) {
      setError(mensajeDeError(err));
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-aqua-dark px-4">
      <div className="w-full max-w-sm bg-white rounded-xl shadow-xl border-t-4 border-aqua-orange p-8">
        <div className="flex justify-center mb-6">
          <LogoAquaChile size="large" />
        </div>

        <h1 className="text-xl font-bold text-aqua-blue mb-1">Iniciar sesión</h1>
        <p className="text-sm text-gray-500 mb-6">Accede con tu cuenta corporativa.</p>

        <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
          <label className="flex flex-col gap-1 text-sm font-semibold text-aqua-blue">
            Correo electrónico
            <input
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="usuario@aquachile.cl"
              className="border border-gray-300 rounded-md px-3 py-2 font-normal focus:outline-none focus:ring-2 focus:ring-aqua-orange"
            />
          </label>

          <label className="flex flex-col gap-1 text-sm font-semibold text-aqua-blue">
            Contraseña
            <input
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 font-normal focus:outline-none focus:ring-2 focus:ring-aqua-orange"
            />
          </label>

          {error && (
            <p role="alert" className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-md px-3 py-2">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={enviando || !email || !password}
            className="bg-aqua-orange text-white font-semibold rounded-md py-2 cursor-pointer border-none transition-opacity disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {enviando ? 'Ingresando...' : 'Ingresar'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
