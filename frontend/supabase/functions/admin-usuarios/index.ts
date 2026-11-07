// Edge Function `admin-usuarios`: invitar personas y cambiar su estado o rol.
// Usa la clave service_role, que NUNCA puede estar en el frontend. Antes de hacer nada comprueba
// que quien llama sea un administrador activo.
//
// Despliegue (desde la carpeta frontend/):
//   supabase functions deploy admin-usuarios
//   supabase secrets set SITE_URL=https://tu-dominio.cl
// SUPABASE_URL, SUPABASE_ANON_KEY y SUPABASE_SERVICE_ROLE_KEY los inyecta Supabase automáticamente.
//
// Entrada (JSON): { accion: 'invitar' | 'cambiar_estado' | 'cambiar_rol', ... }
// Salida: { ok: true, perfil } o { error: 'mensaje' } con el código HTTP correspondiente.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';

const ROLES_INVITABLES = ['reclutador', 'operaciones'];
const ROLES = ['admin', ...ROLES_INVITABLES];
const ESTADOS = ['activo', 'ausente', 'inactivo'];
// Bloqueo prácticamente indefinido (100 años) para quien queda inactivo.
const BLOQUEO_INDEFINIDO = '876000h';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

const responder = (cuerpo: unknown, status = 200) =>
  new Response(JSON.stringify(cuerpo), { status, headers: { ...CORS, 'Content-Type': 'application/json' } });

class ErrorHttp extends Error {
  constructor(mensaje: string, public status = 400) {
    super(mensaje);
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });

  try {
    const url = Deno.env.get('SUPABASE_URL')!;
    const admin = createClient(url, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

    // 1. Quién llama: se valida el JWT recibido, no lo que diga el cuerpo de la petición.
    const autorizacion = req.headers.get('Authorization') ?? '';
    const llamador = createClient(url, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: autorizacion } }
    });
    const { data: sesion, error: errorSesion } = await llamador.auth.getUser();
    if (errorSesion || !sesion.user) throw new ErrorHttp('Sesión no válida.', 401);

    const { data: perfilLlamador } = await admin
      .from('perfiles')
      .select('rol, estado')
      .eq('id', sesion.user.id)
      .maybeSingle();
    if (perfilLlamador?.rol !== 'admin' || perfilLlamador.estado === 'inactivo') {
      throw new ErrorHttp('Solo un administrador activo puede gestionar el equipo.', 403);
    }

    const cuerpo = await req.json().catch(() => ({}));

    // 2. Acción pedida.
    if (cuerpo.accion === 'invitar') {
      const email = String(cuerpo.email ?? '').trim().toLowerCase();
      const nombre = String(cuerpo.nombre ?? '').trim();
      const rol = String(cuerpo.rol ?? '');
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new ErrorHttp('Ingresa un correo válido.');
      if (!nombre) throw new ErrorHttp('Ingresa el nombre de la persona.');
      if (!ROLES_INVITABLES.includes(rol)) throw new ErrorHttp('El rol debe ser reclutador u operaciones.');

      const redirectTo = `${Deno.env.get('SITE_URL') ?? ''}/definir-contrasena`;
      const { data, error } = await admin.auth.admin.inviteUserByEmail(email, {
        data: { nombre },
        redirectTo
      });
      if (error || !data.user) throw new ErrorHttp(error?.message ?? 'No se pudo enviar la invitación.');

      // El rol va en app_metadata: solo el backend puede escribirlo.
      const { error: errorRol } = await admin.auth.admin.updateUserById(data.user.id, { app_metadata: { rol } });
      if (errorRol) throw new ErrorHttp(errorRol.message, 500);

      const { data: perfil, error: errorPerfil } = await admin
        .from('perfiles')
        .upsert({ id: data.user.id, nombre, email, rol, estado: 'activo' })
        .select()
        .single();
      if (errorPerfil) throw new ErrorHttp(errorPerfil.message, 500);
      return responder({ ok: true, perfil });
    }

    if (cuerpo.accion === 'cambiar_estado') {
      const { id, estado } = cuerpo;
      if (!ESTADOS.includes(estado)) throw new ErrorHttp('Estado no válido.');
      if (id === sesion.user.id) throw new ErrorHttp('No puedes cambiar el estado de tu propia cuenta.');

      const { data: objetivo } = await admin.from('perfiles').select('rol, estado').eq('id', id).maybeSingle();
      if (!objetivo) throw new ErrorHttp('La persona no existe.', 404);

      // Nunca dejar el sistema sin un administrador activo.
      if (objetivo.rol === 'admin' && estado === 'inactivo') {
        const { count } = await admin
          .from('perfiles')
          .select('id', { count: 'exact', head: true })
          .eq('rol', 'admin')
          .neq('estado', 'inactivo')
          .neq('id', id);
        if (!count) throw new ErrorHttp('Debe quedar al menos un administrador activo.');
      }

      const { error: errorAuth } = await admin.auth.admin.updateUserById(id, {
        ban_duration: estado === 'inactivo' ? BLOQUEO_INDEFINIDO : 'none'
      });
      if (errorAuth) throw new ErrorHttp(errorAuth.message, 500);

      const { data: perfil, error } = await admin
        .from('perfiles')
        .update({ estado, actualizado_en: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();
      if (error) throw new ErrorHttp(error.message, 500);
      return responder({ ok: true, perfil });
    }

    if (cuerpo.accion === 'cambiar_rol') {
      const { id, rol } = cuerpo;
      if (!ROLES.includes(rol)) throw new ErrorHttp('Rol no válido.');
      if (id === sesion.user.id) throw new ErrorHttp('No puedes cambiar el rol de tu propia cuenta.');

      const { error: errorAuth } = await admin.auth.admin.updateUserById(id, { app_metadata: { rol } });
      if (errorAuth) throw new ErrorHttp(errorAuth.message, 500);

      const { data: perfil, error } = await admin
        .from('perfiles')
        .update({ rol, actualizado_en: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();
      if (error) throw new ErrorHttp(error.message, 500);
      return responder({ ok: true, perfil });
    }

    throw new ErrorHttp('Acción desconocida.');
  } catch (e) {
    if (e instanceof ErrorHttp) return responder({ error: e.message }, e.status);
    return responder({ error: 'Error interno del servidor.' }, 500);
  }
});
