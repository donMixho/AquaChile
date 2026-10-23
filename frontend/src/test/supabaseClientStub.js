// Reemplaza a services/supabaseClient.js durante las pruebas (ver alias en karma.conf.js).
// Evita depender de import.meta.env y de la red; cada prueba lo espía con spyOn.
export const supabase = {
  from: () => {
    throw new Error('supabase.from no fue simulado en esta prueba');
  },
  storage: {
    from: () => {
      throw new Error('supabase.storage.from no fue simulado en esta prueba');
    }
  }
};
