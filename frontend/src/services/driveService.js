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

// Sube el informe PDF de la entrevista a la carpeta del candidato. Solo actúa si se activó con
// VITE_DRIVE_SUBIR_INFORMES=true: el Apps Script debe haberse actualizado antes (ver
// docs/apps_script_informes.gs), porque uno antiguo ignoraría la acción y crearía otra carpeta.
// Nunca lanza: devuelve la URL del archivo o null.
export const subirInformeDrive = async ({ rut, nombre, folderUrl, nombreArchivo, pdfBase64 }) => {
  const url = import.meta.env.VITE_GOOGLE_DRIVE_WEBHOOK_URL;
  if (!url || import.meta.env.VITE_DRIVE_SUBIR_INFORMES !== 'true' || !folderUrl || !pdfBase64) {
    return null;
  }

  const controlador = new AbortController();
  const temporizador = setTimeout(() => controlador.abort(), TIEMPO_MAXIMO_MS * 3);

  try {
    const respuesta = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ accion: 'subir_informe', rut, nombre, folderUrl, nombreArchivo, pdfBase64 }),
      signal: controlador.signal
    });
    if (!respuesta.ok) return null;

    const { success, fileUrl } = await respuesta.json();
    return success && fileUrl ? fileUrl : null;
  } catch {
    return null;
  } finally {
    clearTimeout(temporizador);
  }
};

// Envía por correo el informe PDF final al candidato (al correo que se ingresó al registrarlo).
// Solo actúa con VITE_ENVIAR_INFORME_CORREO=true: el Apps Script debe haberse actualizado antes (ver
// docs/apps_script_informes.gs). `folderUrl` debe ser la carpeta Drive del candidato: el script la
// usa para comprobar que la solicitud viene de un registro real. Nunca lanza: devuelve true o false.
export const enviarInformeCandidato = async ({ email, nombre, decision, folderUrl, nombreArchivo, pdfBase64 }) => {
  const url = import.meta.env.VITE_GOOGLE_DRIVE_WEBHOOK_URL;
  if (!url || import.meta.env.VITE_ENVIAR_INFORME_CORREO !== 'true' || !email || !folderUrl || !pdfBase64) {
    return false;
  }

  const controlador = new AbortController();
  const temporizador = setTimeout(() => controlador.abort(), TIEMPO_MAXIMO_MS * 3);

  try {
    const respuesta = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ accion: 'enviar_informe', email, nombre, decision, folderUrl, nombreArchivo, pdfBase64 }),
      signal: controlador.signal
    });
    if (!respuesta.ok) return false;

    const { success } = await respuesta.json();
    return success === true;
  } catch {
    return false;
  } finally {
    clearTimeout(temporizador);
  }
};
