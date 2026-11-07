import { Navigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ROLES } from '../context/permisos';
import Layout from './Layout';
import AdminLayout from './AdminLayout';
import AdminResumen from '../pages/AdminResumen';
import MiBandeja from '../pages/MiBandeja';
import Aptos from '../pages/Aptos';
import Dashboard from '../pages/Dashboard';
import Candidatos from '../pages/Candidatos';

// Cada rol tiene su propia estructura e inicio: el admin trabaja con navegación lateral y un
// resumen de gestión; el reclutador con su bandeja y Operaciones con los aptos por decidir, ambos
// bajo el menú superior.
export const LayoutPorRol = () => (useAuth().rol === ROLES.ADMIN ? <AdminLayout /> : <Layout />);

export const InicioPorRol = () => {
  const { rol } = useAuth();
  if (rol === ROLES.ADMIN) return <AdminResumen />;
  if (rol === ROLES.RECLUTADOR) return <MiBandeja />;
  if (rol === ROLES.OPERACIONES) return <Aptos />;
  return <Dashboard />;
};

// El admin supervisa desde Seguimiento: la tabla de trabajo de Candidatos (editar, entrevistar)
// es del reclutador.
export const CandidatosPorRol = () =>
  useAuth().rol === ROLES.ADMIN ? <Navigate to="/seguimiento" replace /> : <Candidatos />;

// La pantalla antigua de evaluación no guardaba fecha ni observaciones; su dirección ahora lleva
// a la entrevista.
export const AEntrevista = () => <Navigate to={`/entrevista/${useParams().id}`} replace />;
