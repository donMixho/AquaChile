import { formatearTelefono, telefonoValido } from '../telefono';

describe('telefono', () => {
  it('155. formatearTelefono agrupa como 9 XXXX XXXX mientras se escribe.', () => {
    expect(formatearTelefono('')).toBe('');
    expect(formatearTelefono('9')).toBe('9');
    expect(formatearTelefono('99555')).toBe('9 9555');
    expect(formatearTelefono('995559205')).toBe('9 9555 9205');
  });

  it('156. formatearTelefono obliga a empezar con 9, quita +56 y limita a 9 dígitos.', () => {
    expect(formatearTelefono('1')).toBe('');
    expect(formatearTelefono('8 9 9555 9205')).toBe('9 9555 9205');
    expect(formatearTelefono('+56 9 9555 9205')).toBe('9 9555 9205');
    expect(formatearTelefono('99555920512345')).toBe('9 9555 9205');
    expect(formatearTelefono('abc')).toBe('');
  });

  it('157. telefonoValido acepta vacío o 9 dígitos completos.', () => {
    expect(telefonoValido('')).toBeTrue();
    expect(telefonoValido('9 9555 9205')).toBeTrue();
    expect(telefonoValido('9 9555')).toBeFalse();
  });
});
