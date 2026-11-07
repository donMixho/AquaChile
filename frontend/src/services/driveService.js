const TIEMPO_MAXIMO_MS = 10000;

// Crea la carpeta del candidato en Google Drive mediante el Webhook de Apps Script.
// Nunca lanza: ante cualquier falla (sin URL configurada, red, timeout, respuesta inválida)
// retorna null para que el registro del candidato no se vea afectado.
export const crearCarpetaDrive = async ({ rut, nombre }) => {
  const url = import.meta.env.VITE_GOOGLE_DRIVE_WEBHOOK_URL;
  if (!url) {
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
    if (!respuesta.ok) return null;

    const cuerpo = await respuesta.json();
    const { success, folderUrl } = cuerpo;
    return success && folderUrl ? folderUrl : null;
  } catch {
    return null;
  } finally {
    clearTimeout(temporizador);
  }
};
