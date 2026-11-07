// Genera las capturas de la pantalla de inicio de cada rol para el README:
//   npm run capturas
// Levanta la app con datos de muestra (sin Supabase) y la fotografía con Chrome en modo headless.
// Requiere Google Chrome; si no está en la ruta habitual, indica la ruta en la variable CHROME_BIN.
import { spawn } from 'node:child_process';
import { existsSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createServer } from 'vite';

const aqui = path.dirname(fileURLToPath(import.meta.url));
const destino = path.resolve(aqui, '../../docs/imagenes');
const PUERTO = 5199;

const rutasChrome = [
  process.env.CHROME_BIN,
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium'
];
const chrome = rutasChrome.find((ruta) => ruta && existsSync(ruta));
if (!chrome) {
  console.error('No se encontró Chrome. Define CHROME_BIN con la ruta del ejecutable.');
  process.exit(1);
}

const CAPTURAS = [
  { rol: 'admin', archivo: 'inicio-admin.png' },
  { rol: 'reclutador', archivo: 'inicio-reclutador.png' },
  { rol: 'operaciones', archivo: 'inicio-operaciones.png' }
];

mkdirSync(destino, { recursive: true });
const servidor = await createServer({ configFile: path.join(aqui, 'vite.config.mjs') });
await servidor.listen();

// spawn (asíncrono) y no spawnSync: el servidor de Vite vive en este mismo proceso y debe poder
// responderle a Chrome mientras toma la captura.
const fotografiar = (url, salida) =>
  new Promise((resolver) => {
    const proceso = spawn(
      chrome,
      [
        '--headless=new',
        '--disable-gpu',
        '--hide-scrollbars',
        '--window-size=1440,1000',
        '--virtual-time-budget=8000',
        `--screenshot=${salida}`,
        url
      ],
      { stdio: 'ignore', windowsHide: true }
    );
    const limite = setTimeout(() => proceso.kill('SIGKILL'), 90_000);
    proceso.on('exit', (codigo) => {
      clearTimeout(limite);
      resolver(codigo === 0 && existsSync(salida));
    });
  });

// Primera carga: Vite optimiza dependencias y puede recargar la página; se calienta antes de fotografiar.
await fetch(`http://localhost:${PUERTO}/?rol=admin`).catch(() => {});
await fetch(`http://localhost:${PUERTO}/src/main.jsx`).catch(() => {});

let fallo = false;
for (const { rol, archivo } of CAPTURAS) {
  const ok = await fotografiar(`http://localhost:${PUERTO}/?rol=${rol}`, path.join(destino, archivo));
  fallo ||= !ok;
  console.log(`${ok ? 'OK ' : 'ERR'} ${archivo}`);
}

await servidor.close();
process.exit(fallo ? 1 : 0);
