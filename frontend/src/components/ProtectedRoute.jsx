import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// Wrapper de rutas: exige sesión y, opcionalmente, que el rol esté en allowedRoles.
// Se usa como ruta padre (<Outlet />) o envolviendo un elemento (children).
const ProtectedRoute = ({ allowedRoles, children }) => {
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

  if (allowedRoles && !allowedRoles.includes(rol)) {
    return <Navigate to="/" replace />;
  }

  return children ?? <Outlet />;
};

export default ProtectedRoute;
