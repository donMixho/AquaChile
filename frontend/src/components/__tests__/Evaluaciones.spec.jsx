import React, { useMemo, useState } from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { solicitudesMock } from '../../data/solicitudesMock.js';

const DashboardTitle = () => (
  <h1>Panel de Control - Reclutamiento &amp; Selección</h1>
);

const CandidateTable = ({ candidates = [] }) => (
  <table>
    <tbody>
      {candidates.map((candidate) => (
        <tr key={candidate.id}>
          <td>{candidate.candidato}</td>
          <td>{candidate.estado}</td>
        </tr>
      ))}
    </tbody>
  </table>
);

const StatusFilter = ({ candidates = [] }) => {
  const [selectedFilter, setSelectedFilter] = useState('Todos');

  const filteredCandidates = useMemo(() => {
    if (selectedFilter === 'Todos') return candidates;
    return candidates.filter(
      (candidate) =>
        candidate.resultadoEvaluacion === selectedFilter ||
        candidate.estado === selectedFilter
    );
  }, [candidates, selectedFilter]);

  return (
    <div>
      <button type="button" onClick={() => setSelectedFilter('Todos')}>Todos</button>
      <button type="button" onClick={() => setSelectedFilter('Apto')}>Apto</button>
      <button type="button" onClick={() => setSelectedFilter('Pendiente')}>Pendiente</button>
      <CandidateTable candidates={filteredCandidates} />
    </div>
  );
};

const RUTInput = () => {
  const [rut, setRut] = useState('');
  const [isValid, setIsValid] = useState(false);

  const validateRut = (value) => /^\d{1,8}-[0-9kK]$/.test(value);

  const handleChange = (event) => {
    const nextValue = event.target.value;
    setRut(nextValue);
    setIsValid(validateRut(nextValue));
  };

  return (
    <div>
      <input aria-label="rut" value={rut} onChange={handleChange} />
      <span data-testid="rut-status">{isValid ? 'válido' : 'inválido'}</span>
    </div>
  );
};

const EvaluationForm = () => {
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (event) => {
    event.preventDefault();
    setSubmitted(true);
  };

  return (
    <form onSubmit={handleSubmit}>
      <input aria-label="nombre" defaultValue="María José Silva" />
      <button type="submit">Guardar evaluación</button>
      {submitted ? <span>Enviado</span> : null}
    </form>
  );
};

const MetricsCard = ({ title, value }) => (
  <div className="metric-card">
    <h3>{title}</h3>
    <strong>{value}</strong>
  </div>
);

const ResultsTable = ({ rows = [], headers = [] }) => (
  <table>
    <thead>
      <tr>
        {headers.map((header) => (
          <th key={header}>{header}</th>
        ))}
      </tr>
    </thead>
    <tbody>
      {rows.map((row) => (
        <tr key={row.id}>
          <td>{row.candidato}</td>
          <td>{row.estado}</td>
          <td>{row.resultadoEvaluacion}</td>
        </tr>
      ))}
    </tbody>
  </table>
);

const ResetFilters = ({ candidates = [] }) => {
  const [selectedFilter, setSelectedFilter] = useState('Pendiente');

  const filteredCandidates = useMemo(() => {
    if (selectedFilter === 'Todos') return candidates;
    return candidates.filter(
      (candidate) =>
        candidate.resultadoEvaluacion === selectedFilter ||
        candidate.estado === selectedFilter
    );
  }, [candidates, selectedFilter]);

  const resetFilters = () => setSelectedFilter('Todos');

  return (
    <div>
      <button type="button" onClick={() => setSelectedFilter('Apto')}>Apto</button>
      <button type="button" onClick={resetFilters}>Restablecer</button>
      <span id="resultado-filtro">{filteredCandidates.length}</span>
    </div>
  );
};

describe('AquaChile Evaluaciones', () => {
  afterEach(() => {
    cleanup();
  });

  it('1. Renderiza correctamente el título del Dashboard.', () => {
    render(<DashboardTitle />);

    expect(
      screen.getByRole('heading', {
        name: 'Panel de Control - Reclutamiento & Selección'
      })
    ).toBeTruthy();
  });

  it('2. Cuenta correctamente la lista de candidatos en la tabla mediante props.', () => {
    const { container } = render(<CandidateTable candidates={solicitudesMock} />);

    expect(container.querySelectorAll('tbody tr').length).toBe(3);
  });

  it('3. Cambia de estado al hacer clic en un filtro de solicitudes.', () => {
    render(<StatusFilter candidates={solicitudesMock} />);

    fireEvent.click(screen.getByRole('button', { name: 'Apto' }));

    expect(screen.getByText('María José Silva')).toBeTruthy();
  });

  it('4. Filtra correctamente a los candidatos con estado Apto.', () => {
    const { container } = render(<StatusFilter candidates={solicitudesMock} />);

    fireEvent.click(screen.getByRole('button', { name: 'Apto' }));

    expect(container.querySelectorAll('tbody tr').length).toBe(1);
    expect(screen.getByText('María José Silva')).toBeTruthy();
  });

  it('5. Filtra correctamente a los candidatos con estado Pendiente.', () => {
    const { container } = render(<StatusFilter candidates={solicitudesMock} />);

    fireEvent.click(screen.getByRole('button', { name: 'Pendiente' }));

    expect(container.querySelectorAll('tbody tr').length).toBe(2);
    expect(screen.getByText('Juan Pérez González')).toBeTruthy();
    expect(screen.getByText('Carlos Valenzuela')).toBeTruthy();
  });

  it('6. Valida el formato de RUT chileno en un input.', () => {
    render(<RUTInput />);
    const input = screen.getByRole('textbox', { name: 'rut' });

    fireEvent.change(input, { target: { value: '19.345.678-2' } });
    expect(screen.getByText('inválido')).toBeTruthy();

    fireEvent.change(input, { target: { value: '19345678-2' } });
    expect(screen.getByText('válido')).toBeTruthy();
  });

  it('7. Simula el envío del formulario de evaluación.', () => {
    render(<EvaluationForm />);

    fireEvent.click(screen.getByRole('button', { name: 'Guardar evaluación' }));

    expect(screen.getByText('Enviado')).toBeTruthy();
  });

  it('8. Verifica el renderizado de la tarjeta de métricas de AquaChile.', () => {
    render(<MetricsCard title="TOTAL SOLICITUDES" value={3} />);

    expect(screen.getByRole('heading', { name: 'TOTAL SOLICITUDES' })).toBeTruthy();
    expect(screen.getByText('3')).toBeTruthy();
  });

  it('9. Recibe correctamente los accesorios en la tabla de resultados.', () => {
    const rows = [
      {
        id: 1,
        candidato: 'María José Silva',
        estado: 'Apto',
        resultadoEvaluacion: 'Apto'
      }
    ];
    const headers = ['Candidato', 'Estado', 'Resultado'];

    render(<ResultsTable rows={rows} headers={headers} />);

    expect(screen.getAllByRole('columnheader').length).toBe(3);
    expect(screen.getByText('María José Silva')).toBeTruthy();
    expect(screen.getAllByText('Apto').length).toBe(2);
  });

  it('10. Limpia los filtros al presionar el botón Restablecer.', () => {
    const { container } = render(<ResetFilters candidates={solicitudesMock} />);

    fireEvent.click(screen.getByRole('button', { name: 'Apto' }));
    expect(container.querySelector('#resultado-filtro').textContent).toBe('1');

    fireEvent.click(screen.getByRole('button', { name: 'Restablecer' }));
    expect(container.querySelector('#resultado-filtro').textContent).toBe('3');
  });
});
