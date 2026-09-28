import React, { useState } from 'react';
// Descomenta la siguiente línea si utilizan react-router-dom en el proyecto
// import { useNavigate } from 'react-router-dom';

const DetalleEvaluacion = () => {
  // const navigate = useNavigate();

  // 1. Estados principales del formulario
  const [estado, setEstado] = useState('En proceso');
  const [fecha, setFecha] = useState('');
  const [observaciones, setObservaciones] = useState('');

  // 2. Estados para validación y feedback visual
  const [error, setError] = useState('');
  const [exito, setExito] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();

    // Validación: Evitar envío si faltan datos
    if (!fecha || !observaciones.trim()) {
      setError('Por favor, selecciona una fecha y escribe tus observaciones antes de guardar.');
      setExito(false);
      return;
    }

    // Simulación de guardado exitoso
    setError('');
    setExito(true);
    
    // Simula una petición al backend imprimiendo los datos en consola
    console.log("Datos enviados al backend:", { estado, fecha, observaciones });

    // Oculta el mensaje de éxito después de 3 segundos
    setTimeout(() => setExito(false), 3000);
  };

  const handleVolver = () => {
    // Navegación cruzada (Ajusta la ruta según la configuración del router de su equipo)
    // navigate('/solicitudes');
    console.log("Navegando de vuelta a la tabla de solicitudes...");
  };

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', fontFamily: 'sans-serif' }}>
      <h2>Detalle de Solicitud de Evaluación (#1)</h2>

      {/* Bloque de contexto extraído del flujo del proyecto */}
      <div style={{ background: '#f4f4f4', padding: '15px', borderRadius: '8px', marginBottom: '20px' }}>
        <h3>Datos del Candidato</h3>
        <p><strong>Nombre:</strong> Juan Pérez</p>
        <p><strong>Familia de cargo:</strong> Operaciones</p>
        <p><strong>Cargo:</strong> Analista de Reclutamiento</p>
        <p><strong>Documento:</strong> <a href="#">Descargar Curriculum Vitae (CV)</a></p>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        
        {/* Selector de Estado */}
        <div>
          <label style={{ fontWeight: 'bold' }}>Estado de Evaluación:</label> <br />
          <select value={estado} onChange={(e) => setEstado(e.target.value)} style={{ padding: '8px', width: '100%' }}>
            <option value="En proceso">En proceso</option>
            <option value="Finalizada">Finalizada</option>
          </select>
        </div>

        {/* Input de Fecha */}
        <div>
          <label style={{ fontWeight: 'bold' }}>Fecha de Evaluación:</label> <br />
          <input 
            type="date" 
            value={fecha} 
            onChange={(e) => setFecha(e.target.value)} 
            style={{ padding: '8px', width: '100%' }}
          />
        </div>

        {/* Textarea de Observaciones */}
        <div>
          <label style={{ fontWeight: 'bold' }}>Observaciones:</label> <br />
          <textarea 
            rows="4" 
            value={observaciones} 
            onChange={(e) => setObservaciones(e.target.value)} 
            placeholder="Ingresa las observaciones sobre la evaluación y la entrevista..."
            style={{ padding: '8px', width: '100%', resize: 'vertical' }}
          />
        </div>

        {/* Alertas Condicionales */}
        {error && <div style={{ color: 'red', marginTop: '10px' }}>{error}</div>}
        {exito && <div style={{ color: 'green', fontWeight: 'bold', marginTop: '10px' }}>¡Evaluación guardada correctamente!</div>}

        {/* Botones de Acción */}
        <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
          <button type="submit" style={{ padding: '10px 15px', background: '#007BFF', color: '#fff', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>
            Guardar Evaluación
          </button>
          <button type="button" onClick={handleVolver} style={{ padding: '10px 15px', background: '#6c757d', color: '#fff', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>
            Volver al listado
          </button>
        </div>
      </form>
    </div>
  );
};

export default DetalleEvaluacion;