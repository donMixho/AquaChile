import { jsPDF } from 'jspdf';

// Informe de entrevista psicolaboral en PDF de MÁXIMO DOS HOJAS, con la información agrupada en
// bloques: Candidato, Entrevista, Perfil, Competencias, Resultado y Aviso legal. Se genera en el
// navegador: los datos del candidato no salen a ningún servicio externo.
//
// Hay dos versiones del mismo documento:
//  - 'interno'   (por defecto): para R&S y Operaciones; incluye las observaciones del entrevistador.
//  - 'candidato': la que recibe el propio candidato por correo; sin observaciones internas.

const MARGEN = 18;
const ANCHO_PAGINA = 210;
const ALTO_PAGINA = 297;
const ANCHO_UTIL = ANCHO_PAGINA - MARGEN * 2;
const LIMITE_INFERIOR = ALTO_PAGINA - 20;
const MAX_PAGINAS = 2;
const INTERLINEADO = 4.6;

const AZUL = [10, 61, 98];
const NARANJA = [232, 119, 34];
const GRIS = [100, 100, 100];
const TEXTO = [30, 30, 30];
const FONDO = [243, 247, 250];

const LOGO_URL = '/logo-aquachile.png';
const LOGO_ANCHO_MM = 38;
const LOGO_PROPORCION = 4413 / 1073;

// Tope de caracteres por campo de texto libre: garantiza que el informe nunca pase de dos hojas.
const MAX_CAMPO = 280;
const MAX_OBSERVACIONES = 1400;
const MAX_MOTIVO = 600;

export const VERSIONES = { INTERNO: 'interno', CANDIDATO: 'candidato' };

const MESES = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
];

const vacio = (valor) => valor === null || valor === undefined || String(valor).trim() === '';
const o = (valor, alternativa = 'No registrado') => (vacio(valor) ? alternativa : String(valor).trim());
const recortar = (valor, maximo) => {
  const texto = o(valor, '');
  return texto.length > maximo ? `${texto.slice(0, maximo - 1).trimEnd()}…` : texto;
};

// Acepta 'AAAA-MM-DD' (columna date) o una fecha ISO completa. Sin new Date('AAAA-MM-DD'), que
// interpreta UTC y de noche en Chile daría el día anterior.
const aFecha = (valor) => {
  if (vacio(valor)) return null;
  const solo = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(valor));
  if (solo) return new Date(Number(solo[1]), Number(solo[2]) - 1, Number(solo[3]));
  const fecha = new Date(valor);
  return Number.isNaN(fecha.getTime()) ? null : fecha;
};

export const fechaLarga = (valor) => {
  const fecha = aFecha(valor);
  return fecha ? `${fecha.getDate()} de ${MESES[fecha.getMonth()]} de ${fecha.getFullYear()}` : 'fecha no registrada';
};

const pesos = (valor) => {
  const numero = Number(valor);
  if (vacio(valor) || !Number.isFinite(numero) || numero <= 0) return 'No informada';
  return `$${Math.round(numero).toLocaleString('es-CL')} CLP`;
};

const NIVELES = { 1: 'Muy bajo', 2: 'Bajo', 3: 'Medio', 4: 'Alto', 5: 'Muy alto' };
const COMPETENCIAS = [
  ['comunicacion', 'Comunicación'],
  ['equipo', 'Trabajo en equipo'],
  ['adaptacion', 'Adaptación a turnos']
];

export const nombreArchivoInforme = (candidato) => {
  const base = String(candidato?.nombre_completo ?? 'candidato')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
  return `Informe_Entrevista_${base || 'candidato'}.pdf`;
};

// Descarga el logo del sitio y lo reduce para que el PDF no pese varios MB. Si falla (sin red,
// bloqueado), el informe se genera igual con el nombre de la empresa en texto.
export const cargarLogo = async (url = LOGO_URL) => {
  try {
    const imagen = await new Promise((resolver, rechazar) => {
      const img = new Image();
      img.onload = () => resolver(img);
      img.onerror = rechazar;
      img.src = url;
    });
    const ancho = 700;
    const alto = Math.round(ancho / LOGO_PROPORCION);
    const lienzo = document.createElement('canvas');
    lienzo.width = ancho;
    lienzo.height = alto;
    lienzo.getContext('2d').drawImage(imagen, 0, 0, ancho, alto);
    return lienzo.toDataURL('image/png');
  } catch {
    return null;
  }
};

// Decisión de Operaciones: viene en `datos.decision` o, si no, de las columnas del candidato.
const leerDecision = (datos, candidato) => {
  const d = datos.decision ?? {};
  const resultado = d.resultado ?? candidato.decision_operaciones ?? null;
  if (!resultado) return null;
  return {
    resultado,
    motivo: d.motivo ?? candidato.motivo_decision ?? '',
    fecha: d.fecha ?? candidato.decidido_en ?? null
  };
};

// Arma el documento. `datos`: { candidato, solicitud, evaluacion, evaluador, decision, version,
// emitidoEn }. `evaluacion` es el estado actual de la entrevista (guardada o no): { respuestas,
// observaciones, modalidad, enlaceReunion, lugar, fechaEntrevista, resultado, finalizada }.
export const construirInformePdf = (datos, logo = null) => {
  const { candidato = {}, solicitud = null, evaluacion = {} } = datos;
  const version = datos.version === VERSIONES.CANDIDATO ? VERSIONES.CANDIDATO : VERSIONES.INTERNO;
  const paraCandidato = version === VERSIONES.CANDIDATO;
  const emitidoEn = datos.emitidoEn ?? new Date();
  const ficha = evaluacion.respuestas ?? {};
  // El nombre del entrevistador se guarda junto a las respuestas para que quien lea el informe
  // después (Operaciones no puede leer los perfiles) sepa quién entrevistó.
  const evaluador = datos.evaluador ?? ficha.evaluador_nombre ?? null;
  const decision = leerDecision(datos, candidato);
  const entrevista = evaluacion.fechaEntrevista ?? evaluacion.fecha_entrevista;
  const resultado = evaluacion.resultado || null;
  const finalizada = evaluacion.finalizada === true || evaluacion.estado === 'finalizada';

  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  doc.setProperties({
    title: `Informe de entrevista psicolaboral - ${o(candidato.nombre_completo, 'Candidato')}`,
    subject: 'Informe de entrevista psicolaboral',
    author: 'AquaChile'
  });

  let y = 0;

  const encabezado = () => {
    if (logo) {
      doc.addImage(logo, 'PNG', MARGEN, 10, LOGO_ANCHO_MM, LOGO_ANCHO_MM / LOGO_PROPORCION);
    } else {
      doc.setFont('helvetica', 'bold').setFontSize(15).setTextColor(...AZUL);
      doc.text('AquaChile', MARGEN, 17);
    }
    doc.setFont('helvetica', 'normal').setFontSize(8.5).setTextColor(...GRIS);
    doc.text('Gestión de Personas · Evaluación Psicolaboral', ANCHO_PAGINA - MARGEN, 16, { align: 'right' });
    doc.setDrawColor(...NARANJA).setLineWidth(0.6);
    doc.line(MARGEN, 21, ANCHO_PAGINA - MARGEN, 21);
    y = 29;
  };

  const salto = () => {
    doc.addPage();
    encabezado();
  };

  // Reserva `alto` mm; si no caben en la página, pasa a la siguiente.
  const reservar = (alto) => {
    if (y + alto > LIMITE_INFERIOR) salto();
  };

  const seccion = (titulo) => {
    reservar(16);
    y += 2;
    doc.setFillColor(...AZUL).rect(MARGEN, y, ANCHO_UTIL, 6, 'F');
    doc.setFont('helvetica', 'bold').setFontSize(9.5).setTextColor(255, 255, 255);
    doc.text(titulo.toUpperCase(), MARGEN + 3, y + 4.2);
    y += 6 + 3;
  };

  // Rejilla de «etiqueta / valor» en `columnas` columnas: la información queda junta y alineada.
  const rejilla = (items, columnas = 2) => {
    const ancho = ANCHO_UTIL / columnas;
    for (let i = 0; i < items.length; i += columnas) {
      const fila = items.slice(i, i + columnas).map(([etiqueta, valor]) => {
        doc.setFont('helvetica', 'normal').setFontSize(9.5);
        return { etiqueta, lineas: doc.splitTextToSize(o(valor), ancho - 4) };
      });
      const alto = 4 + Math.max(...fila.map((c) => c.lineas.length)) * INTERLINEADO + 1.5;
      reservar(alto);
      fila.forEach((celda, indice) => {
        const x = MARGEN + indice * ancho;
        doc.setFont('helvetica', 'bold').setFontSize(7.5).setTextColor(...GRIS);
        doc.text(celda.etiqueta.toUpperCase(), x, y);
        doc.setFont('helvetica', 'normal').setFontSize(9.5).setTextColor(...TEXTO);
        doc.text(celda.lineas, x, y + 4.2);
      });
      y += alto;
    }
  };

  const parrafo = (texto, { negrita = false, tamano = 9.5, color = TEXTO, fondo = false } = {}) => {
    doc.setFont('helvetica', negrita ? 'bold' : 'normal').setFontSize(tamano);
    const lineas = doc.splitTextToSize(String(texto), ANCHO_UTIL - (fondo ? 6 : 0));
    const alto = lineas.length * INTERLINEADO + (fondo ? 5 : 0);
    reservar(alto);
    if (fondo) {
      doc.setFillColor(...FONDO).rect(MARGEN, y - 3.5, ANCHO_UTIL, alto, 'F');
    }
    doc.setTextColor(...color);
    doc.text(lineas, MARGEN + (fondo ? 3 : 0), y + (fondo ? 0.5 : 0));
    y += alto + 1.5;
  };

  // ---------- Título ----------
  encabezado();
  doc.setFont('helvetica', 'bold').setFontSize(14).setTextColor(...AZUL);
  doc.text('INFORME DE ENTREVISTA PSICOLABORAL', MARGEN, y);
  y += 5.5;
  doc.setFont('helvetica', 'normal').setFontSize(8.5).setTextColor(...GRIS);
  doc.text(`Folio N° ${o(candidato.id, 'S/N')} · Emitido el ${fechaLarga(emitidoEn)}`, MARGEN, y);
  y += 3;

  // ---------- 1. Candidato ----------
  seccion('1. Candidato');
  rejilla([
    ['Nombre completo', candidato.nombre_completo],
    ['RUT', candidato.rut],
    ['Correo electrónico', candidato.email],
    ['Teléfono', candidato.telefono],
    ['Cargo al que postula', candidato.cargo],
    ['Familia de cargo', candidato.familia_cargo]
  ]);
  if (solicitud?.titulo) rejilla([['Solicitud asociada', solicitud.titulo]], 1);

  // ---------- 2. Entrevista ----------
  seccion('2. Entrevista');
  const modalidad = evaluacion.modalidad ?? 'Videollamada';
  const lugarOEnlace = modalidad === 'Presencial'
    ? ['Lugar', evaluacion.lugar]
    : ['Enlace de la reunión', evaluacion.enlaceReunion ?? evaluacion.enlace_reunion];
  rejilla([
    ['Fecha', fechaLarga(entrevista)],
    ['Modalidad', modalidad],
    lugarOEnlace,
    ['Entrevistador(a)', evaluador]
  ]);

  // ---------- 3. Perfil declarado ----------
  seccion('3. Perfil y condiciones declaradas');
  rejilla([
    ['Estudios', recortar(ficha.estudios, MAX_CAMPO)],
    ['Experiencia relevante', recortar(ficha.experiencia, MAX_CAMPO)],
    ['Disponibilidad de ingreso', recortar(ficha.disponibilidad, MAX_CAMPO)],
    ['Turnos y traslado', recortar(ficha.turnos, MAX_CAMPO)],
    ['Pretensión de renta', pesos(ficha.renta)]
  ]);

  // ---------- 4. Competencias ----------
  seccion('4. Competencias (escala de 1 a 5)');
  rejilla(
    COMPETENCIAS.map(([clave, nombre]) => {
      const nivel = Number(ficha[clave]);
      return [nombre, nivel >= 1 && nivel <= 5 ? `${nivel} de 5 · ${NIVELES[nivel]}` : 'Sin evaluar'];
    }),
    3
  );

  // ---------- 5. Observaciones (solo versión interna) ----------
  let numero = 5;
  if (!paraCandidato) {
    seccion(`${numero}. Observaciones del entrevistador`);
    parrafo(recortar(evaluacion.observaciones, MAX_OBSERVACIONES) || 'El entrevistador no registró observaciones.');
    numero += 1;
  }

  // ---------- Resultado ----------
  seccion(`${numero}. Resultado`);
  if (resultado && finalizada) {
    parrafo(`Resultado de la entrevista: ${resultado.toUpperCase()} para el cargo de ${o(candidato.cargo, 'cargo no especificado')}.`, {
      negrita: true
    });
  } else {
    parrafo(
      'La entrevista está en curso y aún no tiene resultado final. Este documento es un borrador y no constituye una decisión.',
      { negrita: true }
    );
  }
  if (decision) {
    const seleccionado = decision.resultado === 'Seleccionado';
    const fechaDecision = decision.fecha ? ` el ${fechaLarga(decision.fecha)}` : '';
    parrafo(
      `Decisión final de Operaciones${fechaDecision}: ${decision.resultado.toUpperCase()}.`,
      { negrita: true, fondo: true, color: seleccionado ? [22, 101, 52] : [153, 27, 27] }
    );
    const motivo = recortar(decision.motivo, MAX_MOTIVO);
    if (motivo) {
      parrafo(`Justificación: ${motivo}`);
    } else if (seleccionado) {
      parrafo('Justificación: el perfil del candidato se ajusta a los requisitos del cargo y a las necesidades del turno.');
    }
  }

  // ---------- Aviso legal ----------
  seccion('Aviso legal y protección de datos');
  const avisoLegal = [
    'Protección de datos: los datos de este documento se tratan solo para el proceso de selección de personal, conforme a la ' +
      'Ley N° 19.628 sobre Protección de la Vida Privada y a la Ley N° 21.719 sobre Protección y Tratamiento de los Datos ' +
      'Personales (vigente desde el 1 de diciembre de 2026). Usted puede solicitar a AquaChile (Gestión de Personas) el acceso, ' +
      'la rectificación, la supresión y la oposición al tratamiento de sus datos.',
    'No discriminación: la evaluación se basa en la idoneidad para el cargo, según el artículo 2° del Código del Trabajo y la ' +
      'Ley N° 20.609 contra la discriminación. Este documento no constituye una oferta de empleo ni un contrato de trabajo.',
    paraCandidato
      ? 'Este informe se envió al correo que usted indicó al postular. Si no corresponde a usted, elimínelo y avise a AquaChile.'
      : 'Documento confidencial de uso interno: queda prohibida su divulgación o uso para otros fines.'
  ];
  avisoLegal.forEach((texto) => parrafo(texto, { tamano: 8, color: GRIS }));

  // ---------- Pie con numeración; nunca más de dos hojas ----------
  while (doc.getNumberOfPages() > MAX_PAGINAS) doc.deletePage(doc.getNumberOfPages());
  const total = doc.getNumberOfPages();
  for (let pagina = 1; pagina <= total; pagina += 1) {
    doc.setPage(pagina);
    doc.setDrawColor(200, 200, 200).setLineWidth(0.2);
    doc.line(MARGEN, ALTO_PAGINA - 14, ANCHO_PAGINA - MARGEN, ALTO_PAGINA - 14);
    doc.setFont('helvetica', 'normal').setFontSize(8).setTextColor(...GRIS);
    doc.text(
      paraCandidato ? 'AquaChile · Informe para el candidato' : 'Documento confidencial · AquaChile',
      MARGEN,
      ALTO_PAGINA - 9
    );
    doc.text(`Página ${pagina} de ${total}`, ANCHO_PAGINA - MARGEN, ALTO_PAGINA - 9, { align: 'right' });
  }

  return doc;
};

// PDF en base64 puro (sin el prefijo data:), listo para enviarlo en un JSON.
export const informeEnBase64 = (doc) => doc.output('datauristring').split(',')[1];

// Genera el informe y lo descarga en el navegador.
export const descargarInformePdf = async (datos) => {
  const logo = await cargarLogo();
  const doc = construirInformePdf(datos, logo);
  doc.save(nombreArchivoInforme(datos.candidato));
  return doc;
};

// Genera el informe sin descargarlo: devuelve el nombre y el contenido para subirlo o enviarlo.
export const prepararInformeParaSubir = async (datos) => {
  const logo = await cargarLogo();
  const doc = construirInformePdf(datos, logo);
  return { nombreArchivo: nombreArchivoInforme(datos.candidato), pdfBase64: informeEnBase64(doc) };
};
