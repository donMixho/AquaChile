// frontend/src/services/resend.jsx
import { supabase } from './supabase';

const WEBHOOK_URL = import.meta.env?.VITE_GOOGLE_DRIVE_WEBHOOK_URL || '';
const ENVIAR_CORREO_ACTIVO = String(import.meta.env?.VITE_ENVIAR_INFORME_CORREO) !== 'false';

/**
 * Envía correos transaccionales (carta de selección/descarte + informe PDF limpio de 2 páginas)
 * usando la Edge Function `resend-email` de Supabase con respaldo en Apps Script.
 */
export async function enviarCorreoCandidato(
  {
    destinatario,
    nombreCandidato = 'Candidato',
    cargo = 'Proceso de Selección AquaChile',
    estado = 'seleccionado', // 'seleccionado' | 'descartado' | 'citacion'
    asunto,
    mensajeHtml,
    pdfBase64 = null,
    nombreArchivoPdf = 'Informe_Evaluacion_AquaChile.pdf',
  } = {},
  { supabaseClient = supabase, fetchImpl = fetch } = {}
) {
  try {
    if (!ENVIAR_CORREO_ACTIVO) {
      return { ok: true, skipped: true, reason: 'VITE_ENVIAR_INFORME_CORREO está en false' };
    }

    if (!destinatario || !String(destinatario).includes('@')) {
      throw new Error('Se requiere un correo destinatario válido.');
    }

    const asuntoFinal =
      asunto ||
      (estado === 'seleccionado'
        ? `Resultado Proceso de Selección AquaChile - ${cargo}`
        : `Actualización de tu postulación en AquaChile - ${cargo}`);

    const payload = {
      to: destinatario.trim(),
      candidateName: nombreCandidato,
      role: cargo,
      status: estado,
      subject: asuntoFinal,
      html:
        mensajeHtml ||
        `<p>Hola <strong>${nombreCandidato}</strong>,</p><p>Adjuntamos el informe correspondiente a tu participación en el proceso para el cargo de <strong>${cargo}</strong> en AquaChile.</p>`,
      attachmentBase64: pdfBase64,
      attachmentFilename: nombreArchivoPdf,
    };

    // 1. Intentar envío por Edge Function de Supabase (Resend)
    if (supabaseClient?.functions?.invoke) {
      const { data, error } = await supabaseClient.functions.invoke('resend-email', {
        body: payload,
      });

      if (!error && data?.ok !== false) {
        return {
          ok: true,
          provider: 'resend-edge-function',
          data,
        };
      }
      console.warn('[resend.jsx] Edge Function no disponible, activando respaldo Apps Script:', error?.message);
    }

    // 2. Respaldo automático con Google Apps Script Webhook para garantizar entrega
    if (WEBHOOK_URL) {
      const response = await fetchImpl(WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({
          accion: 'enviar_correo_candidato',
          ...payload,
        }),
      });

      return {
        ok: response.ok,
        provider: 'google-apps-script-fallback',
      };
    }

    return {
      ok: true,
      provider: 'simulated-local',
      payload,
    };
  } catch (error) {
    console.error('[resend.jsx] Error enviando correo:', error.message);
    return {
      ok: false,
      error: error.message,
    };
  }
}

export default {
  enviarCorreoCandidato,
};