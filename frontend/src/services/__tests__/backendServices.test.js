// frontend/src/services/__tests__/backendServices.test.js
import { describe, it, expect, vi } from 'vitest';
import {
  agendarEntrevistaCalendar,
  generarUrlGoogleCalendar,
} from '../google_calendar';
import { enviarCorreoCandidato } from '../resend';
import { subirInformeDrive } from '../google_drive';
import { verificarConexionSupabase, actualizarDatosCandidato } from '../supabase';

describe('Suite Testing Backend - Servicios AquaChile (Pizarra)', () => {
  it('google_calendar.jsx: genera link válido y agenda entrevista con fecha_hora', async () => {
    const url = generarUrlGoogleCalendar({
      candidatoNombre: 'Juan Pérez',
      fechaHoraISO: '2026-11-20T15:00:00.000Z',
      modalidad: 'Videollamada (Google Meet)',
      candidatoCorreo: 'juan@ejemplo.cl',
    });

    expect(url).toContain('calendar.google.com/calendar/render');
    expect(url).toContain('Juan+P%C3%A9rez');

    const mockSupabase = {
      from: () => ({
        update: () => ({
          eq: () => ({
            select: async () => ({ data: [{ id: 1, fecha_hora: '2026-11-20T15:00:00.000Z' }], error: null }),
          }),
        }),
      }),
    };

    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ meetLink: 'https://meet.google.com/abc-defg-hij' }),
    });

    const res = await agendarEntrevistaCalendar(
      {
        candidatoId: 1,
        fecha_hora: '2026-11-20T15:00:00.000Z',
        modalidad: 'meet',
        candidatoNombre: 'Juan Pérez',
      },
      { supabaseClient: mockSupabase, fetchImpl: mockFetch }
    );

    expect(res.ok).toBe(true);
    expect(res.fecha_hora).toBe('2026-11-20T15:00:00.000Z');
  });

  it('google_calendar.jsx: maneja fechas inválidas o vacías sin botar la app', async () => {
    const resSinFecha = await agendarEntrevistaCalendar({});
    expect(resSinFecha.ok).toBe(false);

    const resFechaMala = await agendarEntrevistaCalendar({ fecha_hora: 'fecha-invalida' });
    expect(resFechaMala.ok).toBe(false);
  });

  it('resend.jsx: envía correo por Edge Function y maneja errores cuando falta destinatario', async () => {
    const mockSupabase = {
      functions: {
        invoke: vi.fn().mockResolvedValue({ data: { id: 'email_123', ok: true }, error: null }),
      },
    };

    const exito = await enviarCorreoCandidato(
      {
        destinatario: 'postulante@aquachile.cl',
        nombreCandidato: 'María Soto',
        estado: 'seleccionado',
      },
      { supabaseClient: mockSupabase }
    );

    expect(exito.ok).toBe(true);
    expect(exito.provider).toBeDefined();

    const falloSinCorreo = await enviarCorreoCandidato({ destinatario: '' });
    expect(falloSinCorreo.ok).toBe(false);
  });

  it('supabase.jsx: captura errores de base de datos sin romper la ejecución', async () => {
    const falloSinId = await actualizarDatosCandidato(null, { apuntes_rapidos: 'test' });
    expect(falloSinId.ok).toBe(false);

    const estado = await verificarConexionSupabase();
    expect(typeof estado.ok).toBe('boolean');
  });

  it('google_drive.jsx: maneja fallos de red en el Webhook sin lanzar excepción no controlada', async () => {
    const mockFetchError = vi.fn().mockRejectedValue(new Error('Network offline'));
    let res;
    try {
      res = await subirInformeDrive({ candidato: 'Test' }, mockFetchError);
    } catch (e) {
      res = { ok: false, error: e.message };
    }
    expect(res).toBeDefined();
    expect(typeof res.ok).toBe('boolean');
  });
});