// Extrae el texto plano de un currículum en PDF, en el navegador, para que el Asistente pueda
// buscar por su contenido. Se limita a los primeros caracteres para no gastar tokens de más.
// pdfjs-dist se carga solo al usarlo: no pesa en el resto de la aplicación.

export const MAX_CARACTERES_CV = 6000;

const esPdf = (archivo) =>
  archivo?.type === 'application/pdf' || /\.pdf$/i.test(archivo?.name ?? '');

export const limpiarTexto = (texto, maximo = MAX_CARACTERES_CV) =>
  String(texto ?? '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, maximo);

// Devuelve el texto del PDF o null si no es un PDF o no se pudo leer. Nunca lanza: leer el CV es
// un extra y no debe impedir registrar al candidato.
export const extraerTextoPdf = async (archivo) => {
  if (!esPdf(archivo)) return null;

  try {
    const pdfjs = await import('pdfjs-dist');
    pdfjs.GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url).toString();

    const documento = await pdfjs.getDocument({ data: new Uint8Array(await archivo.arrayBuffer()) }).promise;
    let texto = '';
    for (let n = 1; n <= documento.numPages && texto.length < MAX_CARACTERES_CV; n += 1) {
      const pagina = await documento.getPage(n);
      const contenido = await pagina.getTextContent();
      texto += `${contenido.items.map((item) => item.str ?? '').join(' ')} `;
    }
    await documento.destroy();

    return limpiarTexto(texto) || null;
  } catch {
    return null;
  }
};
