import { construirInformePdf, VERSIONES, fechaLarga, nombreArchivoInforme } from '../informePdf';

const candidato = {
  id: 4,
  nombre_completo: 'Juan Pérez González',
  rut: '12.345.678-5',
  email: 'juan@correo.cl',
  telefono: '+56911112222',
  cargo: 'Operario de planta',
  familia_cargo: 'Producción'
};

const evaluacion = {
  respuestas: { estudios: 'Técnico', experiencia: 'Cinco años en planta', renta: '650000', comunicacion: 4, equipo: 5, adaptacion: 3 },
  observaciones: 'Buena disposición.',
  modalidad: 'Presencial',
  lugar: 'Planta Calbuco',
  fechaEntrevista: '2026-11-07',
  resultado: 'Apto',
  finalizada: true
};

const textoDe = (doc) => doc.output().replace(/\s+/g, ' ');

describe('informePdf', () => {
  it('formatea la fecha larga sin desfase de zona horaria.', () => {
    expect(fechaLarga('2026-11-07')).toBe('7 de noviembre de 2026');
    expect(fechaLarga(null)).toBe('fecha no registrada');
  });

  it('nombra el archivo sin tildes ni espacios.', () => {
    expect(nombreArchivoInforme(candidato)).toBe('Informe_Entrevista_Juan_Perez_Gonzalez.pdf');
    expect(nombreArchivoInforme(null)).toBe('Informe_Entrevista_candidato.pdf');
  });

  it('genera un PDF con los datos del candidato, la entrevista, las observaciones y el dictamen.', () => {
    const doc = construirInformePdf({ candidato, evaluacion, evaluador: 'Ana Rojas', emitidoEn: new Date(2026, 10, 8) });
    const texto = textoDe(doc);

    expect(texto.startsWith('%PDF-')).toBe(true);
    ['12.345.678-5', 'Operario de planta', 'Planta Calbuco', 'Buena disposición', 'APTO', 'Ley N° 19.628', 'Ley N° 21.719'].forEach((fragmento) =>
      expect(texto).toContain(fragmento)
    );
  });

  it('marca como borrador una entrevista sin finalizar.', () => {
    const doc = construirInformePdf({ candidato, evaluacion: { ...evaluacion, resultado: null, finalizada: false } });

    expect(textoDe(doc)).toContain('borrador');
  });

  it('nunca pasa de dos hojas, aunque los textos sean larguísimos.', () => {
    const largo = 'Texto largo. '.repeat(900);
    const doc = construirInformePdf({
      candidato,
      solicitud: { titulo: largo },
      evaluacion: { ...evaluacion, observaciones: largo, respuestas: { estudios: largo, experiencia: largo, disponibilidad: largo, turnos: largo } },
      decision: { resultado: 'Descartado', motivo: largo, fecha: '2026-11-09' }
    });

    expect(doc.getNumberOfPages()).toBeLessThanOrEqual(2);
    expect(textoDe(doc)).toContain(`de ${doc.getNumberOfPages()}`);
  });

  it('un informe normal cabe en una o dos hojas.', () => {
    expect(construirInformePdf({ candidato, evaluacion }).getNumberOfPages()).toBeLessThanOrEqual(2);
  });

  it('incluye la decisión de Operaciones y su justificación.', () => {
    const doc = construirInformePdf({
      candidato,
      evaluacion,
      decision: { resultado: 'Descartado', motivo: 'No cumple el turno rotativo.', fecha: '2026-11-09' }
    });
    const texto = textoDe(doc);

    expect(texto).toContain('DESCARTADO');
    expect(texto).toContain('No cumple el turno rotativo.');
  });

  it('toma la decisión de las columnas del candidato si no se pasa aparte.', () => {
    const doc = construirInformePdf({
      candidato: { ...candidato, decision_operaciones: 'Seleccionado', decidido_en: '2026-11-09T12:00:00Z' },
      evaluacion
    });

    expect(textoDe(doc)).toContain('SELECCIONADO');
  });

  it('la versión para el candidato omite las observaciones internas.', () => {
    const interno = textoDe(construirInformePdf({ candidato, evaluacion }));
    const paraCandidato = textoDe(construirInformePdf({ candidato, evaluacion, version: VERSIONES.CANDIDATO }));

    expect(interno).toContain('Buena disposición');
    expect(paraCandidato).not.toContain('Buena disposición');
    expect(paraCandidato).toContain('Ley N° 19.628');
  });

  it('no falla con datos vacíos.', () => {
    expect(() => construirInformePdf({ candidato: {}, evaluacion: {} })).not.toThrow();
  });
});
