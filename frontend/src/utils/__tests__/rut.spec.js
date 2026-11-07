import { calcularDigitoVerificador, formatearRut, rutValido } from '../rut';

describe('rut', () => {
  it('75. formatearRut convierte la k minúscula en K y agrega puntos y guion.', () => {
    expect(formatearRut('15432190k')).toBe('15.432.190-K');
    expect(formatearRut('15432190K')).toBe('15.432.190-K');
    expect(formatearRut('15.432.190-k')).toBe('15.432.190-K');
    expect(formatearRut('10000013k')).toBe('10.000.013-K');
  });

  it('76. formatearRut formatea mientras se escribe y ignora símbolos.', () => {
    expect(formatearRut('')).toBe('');
    expect(formatearRut('1234')).toBe('1.234');
    expect(formatearRut('123456785')).toBe('12.345.678-5');
    expect(formatearRut(' 12 345 678 - 5 ')).toBe('12.345.678-5');
  });

  it('77. calcularDigitoVerificador devuelve 0-9 o K.', () => {
    expect(calcularDigitoVerificador('15432190')).toBe('K');
    expect(calcularDigitoVerificador('12345678')).toBe('5');
    expect(calcularDigitoVerificador('11111111')).toBe('1');
  });

  it('78. rutValido acepta K y k indistintamente, con o sin formato.', () => {
    ['15.432.190-K', '15.432.190-k', '15432190k', '15432190K', '10.000.013-k'].forEach((rut) => {
      expect(rutValido(rut)).toBe(true, rut);
    });
  });

  it('79. rutValido rechaza verificadores incorrectos y largos inválidos.', () => {
    // 15.432.198 tiene verificador 5, no K.
    ['15.432.198-K', '15.432.198-k', '12.345.678-9', '123-4', '', null].forEach((rut) => {
      expect(rutValido(rut)).toBe(false, String(rut));
    });
  });

  it('159. formatearRut separa el verificador de RUT de 7 dígitos con cualquier DV (0-9 y K).', () => {
    expect(formatearRut('98765433')).toBe('9.876.543-3');
    expect(formatearRut('10000076')).toBe('1.000.007-6');
    expect(formatearRut('10000009')).toBe('1.000.000-9');
    expect(formatearRut('1000005K')).toBe('1.000.005-K');
  });

  it('160. Un RUT de 8 dígitos se forma bien al teclear aunque un paso intermedio parezca de 7 dígitos.', () => {
    // 10000009: su último dígito (9) es el DV correcto de 1000000, o sea, un paso ambiguo.
    const completo = `10000009${calcularDigitoVerificador('10000009')}`;
    let campo = '';
    for (const caracter of completo) {
      campo = formatearRut(campo + caracter);
      if (caracter === '9' && campo.replace(/\D/g, '').length === 8) expect(campo).toBe('1.000.000-9');
    }
    expect(campo).toBe(`10.000.009-${completo.slice(-1)}`);
    expect(rutValido(campo)).toBeTrue();
  });
});
