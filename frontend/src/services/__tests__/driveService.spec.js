import { enviarInformeCandidato, subirInformeDrive } from '../driveService';

const datos = {
  rut: '12345678-5',
  nombre: 'Juan Pérez',
  folderUrl: 'https://drive.google.com/drive/folders/abc',
  nombreArchivo: 'Informe.pdf',
  pdfBase64: 'JVBERi0='
};

describe('driveService.subirInformeDrive', () => {
  it('envía el PDF al webhook y devuelve la URL del archivo.', async () => {
    const fetchEspia = spyOn(window, 'fetch').and.resolveTo({
      ok: true,
      json: () => Promise.resolve({ success: true, fileUrl: 'https://drive.google.com/file/d/1' })
    });

    expect(await subirInformeDrive(datos)).toBe('https://drive.google.com/file/d/1');
    const cuerpo = JSON.parse(fetchEspia.calls.mostRecent().args[1].body);
    expect(cuerpo).toEqual(jasmine.objectContaining({ accion: 'subir_informe', folderUrl: datos.folderUrl, nombreArchivo: 'Informe.pdf' }));
  });

  it('no llama a la red si el candidato no tiene carpeta o no hay PDF.', async () => {
    const fetchEspia = spyOn(window, 'fetch');

    expect(await subirInformeDrive({ ...datos, folderUrl: null })).toBeNull();
    expect(await subirInformeDrive({ ...datos, pdfBase64: '' })).toBeNull();
    expect(fetchEspia).not.toHaveBeenCalled();
  });

  it('nunca lanza: devuelve null ante red caída o respuesta fallida.', async () => {
    spyOn(window, 'fetch').and.rejectWith(new Error('sin red'));
    expect(await subirInformeDrive(datos)).toBeNull();

    window.fetch.and.resolveTo({ ok: true, json: () => Promise.resolve({ success: false }) });
    expect(await subirInformeDrive(datos)).toBeNull();
  });
});

describe('driveService.enviarInformeCandidato', () => {
  const envio = { ...datos, email: 'juan@correo.cl', decision: 'Seleccionado' };

  it('pide al webhook enviar el PDF al correo del candidato.', async () => {
    const fetchEspia = spyOn(window, 'fetch').and.resolveTo({ ok: true, json: () => Promise.resolve({ success: true }) });

    expect(await enviarInformeCandidato(envio)).toBeTrue();
    const cuerpo = JSON.parse(fetchEspia.calls.mostRecent().args[1].body);
    expect(cuerpo).toEqual(jasmine.objectContaining({ accion: 'enviar_informe', email: 'juan@correo.cl', decision: 'Seleccionado' }));
  });

  it('no llama a la red sin correo, carpeta o PDF.', async () => {
    const fetchEspia = spyOn(window, 'fetch');

    expect(await enviarInformeCandidato({ ...envio, email: '' })).toBeFalse();
    expect(await enviarInformeCandidato({ ...envio, folderUrl: null })).toBeFalse();
    expect(await enviarInformeCandidato({ ...envio, pdfBase64: '' })).toBeFalse();
    expect(fetchEspia).not.toHaveBeenCalled();
  });

  it('nunca lanza: devuelve false ante red caída o respuesta fallida.', async () => {
    spyOn(window, 'fetch').and.rejectWith(new Error('sin red'));
    expect(await enviarInformeCandidato(envio)).toBeFalse();

    window.fetch.and.resolveTo({ ok: true, json: () => Promise.resolve({ success: false }) });
    expect(await enviarInformeCandidato(envio)).toBeFalse();
  });
});
