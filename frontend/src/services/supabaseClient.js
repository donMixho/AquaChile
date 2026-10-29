import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Falla con un mensaje claro en vez de un error críptico de createClient.
if (!url || !anonKey) {
  throw new Error('Faltan VITE_SUPABASE_URL y/o VITE_SUPABASE_ANON_KEY en el archivo .env (reinicia npm run dev tras editarlo).');
}

export const supabase = createClient(url, anonKey);
