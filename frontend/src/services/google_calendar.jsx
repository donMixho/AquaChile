// frontend/src/services/google_calendar.jsx
import { supabase } from './supabase';

const WEBHOOK_URL = import.meta.env?.VITE_GOOGLE_DRIVE_WEBHOOK_URL || '';

/**
 * Genera una URL directa para agregar la entrevista a Google Calendar.
 */
export function generarUrlGoogleCalendar({
  titulo = 'Entrevista Laboral - AquaChile',
  fechaHoraISO,
  duracionMinutos = 45,
  modalidad = 'Videollamada (Google Meet)',
  ubicacion = 'Google Meet',
  candidatoNombre = '',
  candidatoCorreo = '',
  detallesExtra = '',
}) {
  const inicio = fechaHoraISO ? new Date(fechaHoraISO) : new Date();
  if (Number.isNaN(inicio.getTime())) {
    throw new Error('Formato de fecha_hora inválido');
  }
  const fin = new Date(inicio.getTime() + duracionMinutos * 60000);

  const formatGCalDate = (date) =>
    date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');

  const descripcion = [
    `Candidato: ${candidatoNombre}`,
    `Modalidad: ${modalidad}`,
    candidatoCorreo ? `Correo: ${candidatoCorreo}` : '',
    detallesExtra,
  ]
    .filter(Boolean)
    .join('\n');

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: `${titulo} - ${candidatoNombre}`.trim(),
    dates: `${formatGCalDate(inicio)}/${formatGCalDate(fin)}`,
    details: descripcion,
    location: modalidad.toLowerCase().includes('presencial')
      ? ubicacion || 'Oficina Central AquaChile, Puerto Montt'
      : 'Google Meet (Videollamada)',
  });

  if (candidatoCorreo) {
    params.append('add', candidatoCorreo);
  }

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

/**
 * Agenda una entrevista actualizando la columna `fecha_hora` en la base de datos
 * y sincronizando el evento con Google Calendar / Meet mediante Webhook.
 */
export async function agendarEntrevistaCalendar(
  {
    candidatoId,
    entrevistaId,
    fecha_hora,
    modalidad = 'meet', // 'meet' | 'presencial'
    ubicacion = 'Oficina Puerto Montt',
    candidatoNombre = 'Candidato',
    candidatoCorreo = '',
    notas = '',
  } = {},
  { supabaseClient = supabase, fetchImpl = fetch } = {}
) {
  try {
    if (!fecha_hora) {
      throw new Error('El campo fecha_hora es obligatorio para agendar la entrevista.');
    }

    const fechaValida = new Date(fecha_hora);
    if (Number.isNaN(fechaValida.getTime())) {
      throw new Error('La fecha_hora proporcionada no es válida.');
    }

    const fechaISO = fechaValida.toISOString();
    const meetLinkFallback =
      modalidad === 'meet'
        ? `https://meet.google.com/lookup/aquachile-${String(candidatoId || 'entrevista').slice(0, 8)}`
        : null;

    // 1. Guardar fecha_hora en Supabase (intenta en candidatos o entrevistas según la estructura activa)
    let dbResult = null;
    if (candidatoId && supabaseClient) {
      const { data, error } = await supabaseClient
        .from('candidatos')
        .update({ fecha_hora: fechaISO })
        .eq('id', candidatoId)
        .select();

      if (!error) dbResult = data;
    }

    if (entrevistaId && supabaseClient) {
      await supabaseClient
        .from('entrevistas')
        .update({ fecha_hora: fechaISO })
        .eq('id', entrevistaId);
    }

    // 2. Generar link de calendario y notificar al Webhook de Google Apps Script si está activo
    const calendarUrl = generarUrlGoogleCalendar({
      fechaHoraISO: fechaISO,
      modalidad: modalidad === 'meet' ? 'Videollamada (Google Meet)' : 'Presencial',
      ubicacion: modalidad === 'meet' ? meetLinkFallback : ubicacion,
      candidatoNombre,
      candidatoCorreo,
      detallesExtra: notas,
    });

    let webhookData = null;
    if (WEBHOOK_URL) {
      try {
        const res = await fetchImpl(WEBHOOK_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify({
            accion: 'agendar_entrevista',
            candidatoId,
            fecha_hora: fechaISO,
            modalidad,
            ubicacion: modalidad === 'meet' ? meetLinkFallback : ubicacion,
            candidatoNombre,
            candidatoCorreo,
            notas,
          }),
        });
        webhookData = await res.json().catch(() => null);
      } catch (errWebhook) {
        console.warn('[google_calendar.jsx] Webhook no disponible, usando enlace directo:', errWebhook.message);
      }
    }

    return {
      ok: true,
      fecha_hora: fechaISO,
      modalidad,
      meetLink: webhookData?.meetLink || meetLinkFallback,
      calendarUrl,
      dbResult,
    };
  } catch (error) {
    console.error('[google_calendar.jsx] Error al agendar entrevista:', error.message);
    return {
      ok: false,
      error: error.message,
    };
  }
}

export default {
  agendarEntrevistaCalendar,
  generarUrlGoogleCalendar,
};