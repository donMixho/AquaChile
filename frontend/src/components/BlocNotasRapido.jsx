// frontend/src/components/BlocNotasRapido.jsx
import React, { useState, useEffect } from 'react';
import { actualizarDatosCandidato } from '../services/supabase';

export default function BlocNotasRapido({
  candidatoId = 'general',
  solicitudId = '',
  nombreCandidato = 'Candidato',
  notasIniciales = '',
}) {
  const storageKey = `aquachile_bloc_notas_${solicitudId || candidatoId}`;
  const [notas, setNotas] = useState(() => {
    return localStorage.getItem(storageKey) || notasIniciales || '';
  });
  const [estadoGuardado, setEstadoGuardado] = useState('Listo');

  useEffect(() => {
    const guardadas = localStorage.getItem(storageKey);
    if (guardadas !== null) {
      setNotas(guardadas);
    }
  }, [storageKey]);

  const manejarCambio = (e) => {
    const nuevoTexto = e.target.value;
    setNotas(nuevoTexto);
    setEstadoGuardado('Guardando localmente...');
    localStorage.setItem(storageKey, nuevoTexto);
    setTimeout(() => setEstadoGuardado('Autoguardado local ✓'), 400);
  };

  const sincronizarNube = async () => {
    if (!candidatoId || candidatoId === 'general') return;
    setEstadoGuardado('Sincronizando con Supabase...');
    const res = await actualizarDatosCandidato(candidatoId, {
      apuntes_rapidos: notas,
    });
    setEstadoGuardado(
      res.ok ? 'Sincronizado en nube ✓' : 'Guardado en este equipo ✓'
    );
  };

  return (
    <div className="bg-amber-50 border border-amber-300 rounded-xl p-4 shadow-sm my-3 text-slate-900">
      <div className="flex items-center justify-between mb-2">
        <h4 className="font-bold text-sm flex items-center gap-2 text-slate-900">
          <span role="img" aria-label="notas">📝</span>
          Bloc de Notas Rápido — {nombreCandidato}
        </h4>
        <span className="text-xs font-medium px-2 py-0.5 rounded bg-amber-200 text-slate-900">
          {estadoGuardado}
        </span>
      </div>

      <textarea
        value={notas}
        onChange={manejarCambio}
        rows={4}
        placeholder="Escribe apuntes rápidos pre-entrevista, dudas del CV, disponibilidad o expectativas salariales..."
        className="w-full p-2.5 text-sm bg-white border border-amber-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 text-slate-900"
      />

      <div className="flex justify-between items-center mt-2">
        <span className="text-xs text-slate-700">
          Uso interno de Selección (no aparece en el PDF final del candidato).
        </span>
        {candidatoId && candidatoId !== 'general' && (
          <button
            type="button"
            onClick={sincronizarNube}
            className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-slate-900 text-white hover:bg-slate-800 transition"
          >
            Guardar en ficha
          </button>
        )}
      </div>
    </div>
  );
}