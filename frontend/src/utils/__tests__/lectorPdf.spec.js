import { extraerTextoPdf, limpiarTexto, MAX_CARACTERES_CV } from '../lectorPdf';

describe('lectorPdf', () => {
  it('94. Limpia espacios y limita el largo del texto.', () => {
    expect(limpiarTexto('  Juan \n\n  Pérez   ')).toBe('Juan Pérez');
    expect(limpiarTexto('a '.repeat(10000)).length).toBe(MAX_CARACTERES_CV);
  });

  it('95. Devuelve null, sin lanzar, si el archivo no es PDF.', async () => {
    expect(await extraerTextoPdf(new File(['x'], 'cv.docx'))).toBeNull();
    expect(await extraerTextoPdf(null)).toBeNull();
  });

  it('96. Devuelve null, sin lanzar, si el PDF está dañado.', async () => {
    expect(await extraerTextoPdf(new File(['esto no es un pdf'], 'cv.pdf', { type: 'application/pdf' }))).toBeNull();
  });
});
