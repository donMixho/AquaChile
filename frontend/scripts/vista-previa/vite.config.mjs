import path from 'node:path';
import { fileURLToPath } from 'node:url';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

const aqui = path.dirname(fileURLToPath(import.meta.url));
const raiz = path.resolve(aqui, '../..');
const sintetico = path.resolve(aqui, 'supabaseSintetico.js');

// Misma app, pero con el cliente de Supabase reemplazado por datos de muestra. Solo para las
// capturas del README: nunca se usa en desarrollo ni en producción.
export default defineConfig({
  root: raiz,
  plugins: [
    react(),
    {
      name: 'supabase-sintetico',
      enforce: 'pre',
      async resolveId(origen, importador, opciones) {
        if (!/supabaseClient(\.js)?$/.test(origen)) return null;
        const resuelto = await this.resolve(origen, importador, { ...opciones, skipSelf: true });
        return resuelto?.id.endsWith('services/supabaseClient.js') ? sintetico : null;
      }
    }
  ],
  server: { port: 5199, strictPort: true }
});
