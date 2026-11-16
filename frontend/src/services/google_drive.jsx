// frontend/src/services/google_drive.jsx
import * as driveServiceOriginal from './driveService';

const WEBHOOK_URL = import.meta.env?.VITE_GOOGLE_DRIVE_WEBHOOK_URL || '';
const SUBIR_INFORMES = String(import.meta.env?.VITE_DRIVE_SUBIR_INFORMES) === 'true';

/**
 * Sube el informe PDF interno (2 páginas con observaciones) a la carpeta de Google Drive.
 */
export async function subirInformeDrive(payload = {}, fetchImpl = fetch) {
  try {
    if (driveServiceOriginal?.subirInformeDrive) {
      return await driveServiceOriginal.subirInformeDrive(payload);
    }
    if (!SUBIR_INFORMES) {
      return { ok: true, skipped: true, reason: 'VITE_DRIVE_SUBIR_INFORMES está desactivado' };
    }
    if (!WEBHOOK_URL) {
      throw new Error('VITE_GOOGLE_DRIVE_WEBHOOK_URL no configurada');
    }

    const response = await fetchImpl(WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({
        accion: 'subir_informe_pdf',
        ...payload,
      }),
    });

    const result = await response.json().catch(() => ({ ok: response.ok }));
    return { ok: response.ok, ...result };
  } catch (error) {
    console.error('[google_drive.jsx] Error subiendo informe a Drive:', error.message);
    return { ok: false, error: error.message };
  }
}

export * from './driveService';
export default {
  ...driveServiceOriginal,
  subirInformeDrive,
};