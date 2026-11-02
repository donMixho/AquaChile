const TIEMPO_MAXIMO_MS = 10000;

// Crea la carpeta del candidato en Google Drive mediante el Webhook de Apps Script.
// Nunca lanza: ante cualquier falla (sin URL configurada, red, timeout, respuesta inválida)
// retorna null para que el registro del candidato no se vea afectado.
export const crearCarpetaDrive = async ({ rut, nombre }) => {
  const url = import.meta.env.VITE_GOOGLE_DRIVE_WEBHOOK_URL;
  console.log('[Drive] Inicio crearCarpetaDrive', { rut, nombre, webhookConfigurado: Boolean(url) });
  if (!url) {
    console.warn('[Drive] VITE_GOOGLE_DRIVE_WEBHOOK_URL no está definida (reinicia `npm run dev` tras editar .env).');
    return null;
  }

  const controlador = new AbortController();
  const temporizador = setTimeout(() => controlador.abort(), TIEMPO_MAXIMO_MS);

  try {
    const respuesta = await fetch(url, {
      method: 'POST',
      // text/plain evita el preflight CORS, que Apps Script no responde.
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ rut, nombre }),
      signal: controlador.signal
    });
    console.log('[Drive] Respuesta HTTP', respuesta.status, respuesta.statusText);
    if (!respuesta.ok) return null;

    const cuerpo = await respuesta.json();
    console.log('[Drive] Cuerpo de la respuesta', cuerpo);
    const { success, folderUrl } = cuerpo;
    return success && folderUrl ? folderUrl : null;
  } catch (error) {
    console.error('[Drive] Falló la llamada al webhook:', error);
    return null;
  } finally {
    clearTimeout(temporizador);
  }
};
