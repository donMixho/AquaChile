/* eslint-disable react-refresh/only-export-components -- contexto, constantes y hook conviven por diseño */
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { supabase } from '../services/supabaseClient';

export const ROLES = {
  ADMIN: 'admin',
  RECLUTADOR: 'reclutador',
  OPERACIONES: 'operaciones'
};

// Roles que gestionan candidatos y evaluaciones.
export const ROLES_RRHH = [ROLES.ADMIN, ROLES.RECLUTADOR];

// Respaldo para pruebas: se usa solo si el usuario aún no tiene rol en Supabase.
const ROL_POR_CORREO = {
  'admin@aquachile.cl': ROLES.ADMIN,
  'reclutador@aquachile.cl': ROLES.RECLUTADOR,
  'operaciones@aquachile.cl': ROLES.OPERACIONES
};

// app_metadata solo lo escribe el backend (más seguro); user_metadata lo puede editar el propio usuario.
export const obtenerRol = (user) => {
  if (!user) return null;
  const rol = user.app_metadata?.rol ?? user.user_metadata?.rol;
  return rol ?? ROL_POR_CORREO[user.email?.toLowerCase()] ?? null;
};

// Sin proveedor retorna null; Layout lo tolera para no exigir AuthProvider en sus pruebas.
export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let activo = true;

    // Si falla (red, token corrupto) se trata como "sin sesión" para no dejar la app cargando.
    supabase.auth
      .getSession()
      .then(({ data }) => (activo ? setSession(data?.session ?? null) : undefined))
      .catch(() => (activo ? setSession(null) : undefined))
      .finally(() => (activo ? setLoading(false) : undefined));

    // Se dispara al iniciar/cerrar sesión, renovar el token o en otra pestaña.
    const { data } = supabase.auth.onAuthStateChange((_evento, nuevaSesion) => {
      if (!activo) return;
      setSession(nuevaSesion);
      setLoading(false);
    });

    return () => {
      activo = false;
      data?.subscription?.unsubscribe();
    };
  }, []);

  const signIn = useCallback(async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  }, []);

  const signOut = useCallback(async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  }, []);

  const value = useMemo(() => {
    const user = session?.user ?? null;
    return { session, user, rol: obtenerRol(user), loading, signIn, signOut };
  }, [session, loading, signIn, signOut]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de <AuthProvider>');
  return ctx;
};
