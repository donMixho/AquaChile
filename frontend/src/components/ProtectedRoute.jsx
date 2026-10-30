import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { tienePermiso } from '../context/permisos';

// Wrapper de rutas: exige sesión y, opcionalmente, un permiso (`permiso`) y/o un rol de
// `allowedRoles`. Si se dan ambos deben cumplirse los dos. Sin rol conocido se deniega.
// Se usa como ruta padre (<Outlet />) o envolviendo un elemento (children).
const ProtectedRoute = ({ permiso, allowedRoles, children }) => {
  const { user, rol, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <p role="status" className="p-8 text-center text-sm text-gray-500">
        Verificando sesión...
      </p>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  const rolPermitido = !allowedRoles || (Array.isArray(allowedRoles) && allowedRoles.includes(rol));
  const permisoOtorgado = !permiso || tienePermiso(rol, permiso);
  if (!rolPermitido || !permisoOtorgado) {
    return <Navigate to="/" replace />;
  }

  return children ?? <Outlet />;
};

export default ProtectedRoute;
