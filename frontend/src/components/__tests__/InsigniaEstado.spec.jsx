import { cleanup, render, screen } from '@testing-library/react';
import InsigniaEstado from '../InsigniaEstado';

describe('InsigniaEstado', () => {
  afterEach(cleanup);

  it('60. Muestra texto, icono y color propios de cada estado.', () => {
    const casos = [
      [{}, 'Pendiente', 'text-orange-700'],
      [{ estado: 'En proceso' }, 'En proceso', 'text-blue-700'],
      [{ estado: 'Apto' }, 'Apto', 'text-green-700'],
      [{ estado: 'No apto' }, 'No apto', 'text-red-700']
    ];

    casos.forEach(([candidato, texto, color]) => {
      const { container } = render(<InsigniaEstado candidato={candidato} />);
      const insignia = screen.getByText(texto);
      expect(insignia.className).toContain(color);
      expect(container.querySelector('svg')).toBeTruthy();
      cleanup();
    });
  });
});
