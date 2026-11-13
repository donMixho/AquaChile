/**
 * Google Apps Script (Web App) de AquaChile: crea la carpeta del candidato Y guarda el informe PDF.
 *
 * Cómo usarlo:
 *  1. Pega la parte nueva (acción 'subir_informe') en tu script actual, ANTES del código que crea carpetas.
 *  2. Implementa una nueva versión del Web App (Implementar > Gestionar implementaciones > Editar).
 *  3. Solo entonces agrega VITE_DRIVE_SUBIR_INFORMES=true (guardar en Drive) y/o
 *     VITE_ENVIAR_INFORME_CORREO=true (enviar al candidato) en el .env del frontend.
 *     Con un script antiguo, la solicitud se tomaría como "crear carpeta".
 *  4. La primera vez, Apps Script pedirá autorizar el envío de correos (MailApp).
 *
 * Solicitud que envía el frontend (text/plain con JSON):
 *   { accion: 'subir_informe', folderUrl, nombreArchivo, pdfBase64, rut, nombre }
 *   { accion: 'enviar_informe', email, nombre, decision, folderUrl, nombreArchivo, pdfBase64 }
 * Respuesta: { success: true, fileUrl } o { success: false, error }
 *
 * Seguridad: el Web App debe estar "Cualquier persona", así que quien conozca la URL puede llamarlo.
 * Por eso solo acepta guardar en una carpeta que ya exista, dentro de la carpeta raíz de AquaChile.
 * 'enviar_informe' exige además la misma carpeta válida, un correo con formato correcto y un PDF de
 * tamaño razonable, y usa un asunto y texto fijos: no sirve para enviar mensajes a voluntad.
 * Cambia CARPETA_RAIZ_ID por el id de tu carpeta raíz de candidatos.
 */
var CARPETA_RAIZ_ID = 'PEGA_AQUI_EL_ID_DE_LA_CARPETA_RAIZ';

function doPost(e) {
  var datos = JSON.parse(e.postData.contents);

  if (datos.accion === 'subir_informe') {
    return subirInforme(datos);
  }

  if (datos.accion === 'enviar_informe') {
    return enviarInforme(datos);
  }

  // ... aquí sigue tu código actual que crea la carpeta del candidato ...
}

function subirInforme(datos) {
  try {
    var idCarpeta = (String(datos.folderUrl).match(/[-\w]{25,}/) || [])[0];
    if (!idCarpeta || !datos.pdfBase64) throw new Error('Datos incompletos');

    var carpeta = DriveApp.getFolderById(idCarpeta);
    if (!esHijaDeRaiz(carpeta)) throw new Error('Carpeta no permitida');

    var nombre = String(datos.nombreArchivo || 'Informe_Entrevista.pdf').replace(/[^\w.\-]/g, '_');
    var blob = Utilities.newBlob(Utilities.base64Decode(datos.pdfBase64), 'application/pdf', nombre);

    // Reemplaza el informe anterior del mismo candidato para no acumular copias.
    var existentes = carpeta.getFilesByName(nombre);
    while (existentes.hasNext()) existentes.next().setTrashed(true);

    var archivo = carpeta.createFile(blob);
    return respuesta({ success: true, fileUrl: archivo.getUrl() });
  } catch (error) {
    return respuesta({ success: false, error: String(error.message || error) });
  }
}

var MAX_PDF_BYTES = 2 * 1024 * 1024;

function enviarInforme(datos) {
  try {
    var idCarpeta = (String(datos.folderUrl).match(/[-\w]{25,}/) || [])[0];
    if (!idCarpeta || !datos.pdfBase64) throw new Error('Datos incompletos');
    if (!esHijaDeRaiz(DriveApp.getFolderById(idCarpeta))) throw new Error('Carpeta no permitida');

    var email = String(datos.email || '').trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error('Correo no válido');

    var bytes = Utilities.base64Decode(datos.pdfBase64);
    if (bytes.length > MAX_PDF_BYTES) throw new Error('PDF demasiado grande');

    var nombreArchivo = String(datos.nombreArchivo || 'Informe_Entrevista.pdf').replace(/[^\w.\-]/g, '_');
    var blob = Utilities.newBlob(bytes, 'application/pdf', nombreArchivo);
    var nombre = String(datos.nombre || '').replace(/[^\wÁÉÍÓÚÑáéíóúñ .\-]/g, '').slice(0, 80);
    var resultado = datos.decision === 'Seleccionado' ? 'seleccionado/a' : 'no continuará en el proceso';

    MailApp.sendEmail({
      to: email,
      subject: 'AquaChile · Resultado de tu proceso de selección',
      body: 'Hola ' + nombre + ',

Te agradecemos tu participación en el proceso de selección de AquaChile. ' +
        'Adjuntamos el informe final con el resultado (' + resultado + ') y su justificación.

' +
        'Tus datos se tratan solo para este proceso, según la Ley N° 19.628 y la Ley N° 21.719. ' +
        'Puedes pedir acceso, rectificación o supresión escribiendo a Gestión de Personas.

Saludos,
Gestión de Personas · AquaChile',
      attachments: [blob],
      name: 'AquaChile Gestión de Personas'
    });
    return respuesta({ success: true });
  } catch (error) {
    return respuesta({ success: false, error: String(error.message || error) });
  }
}

function esHijaDeRaiz(carpeta) {
  var padres = carpeta.getParents();
  while (padres.hasNext()) {
    if (padres.next().getId() === CARPETA_RAIZ_ID) return true;
  }
  return false;
}

function respuesta(objeto) {
  return ContentService.createTextOutput(JSON.stringify(objeto)).setMimeType(ContentService.MimeType.JSON);
}
