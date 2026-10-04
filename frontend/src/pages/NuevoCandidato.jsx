import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AQUACHILE_THEME } from '../theme';

const NuevoCandidato = () => {
  const navigate = useNavigate();

  const [formulario, setFormulario] = useState({
    nombre: '',
    rut: '',
    cargo: '',
    familia: 'Operaciones',
    email: '',
    telefono: ''
  });

  const [errorEmail, setErrorEmail] = useState('');
  const [mensajeExito, setMensajeExito] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();

    // 1. Verificación de espacios en blanco en el email
    if (formulario.email.includes(' ')) {
      setErrorEmail('El correo electrónico no puede contener espacios.');
      return;
    }

    // 2. Validación de formato de correo
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formulario.email)) {
      setErrorEmail('Ingresa un correo electrónico con formato válido.');
      return;
    }

    setErrorEmail('');
    setMensajeExito(true);
    console.log("Nuevo candidato registrado:", formulario);

    setTimeout(() => {
      navigate('/candidatos');
    }, 1500);
  };

  return (
    <div style={{ maxWidth: '650px', margin: '0 auto', fontFamily: "'Segoe UI', Roboto, sans-serif" }}>
      
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{
          color: '#FFFFFF',
          fontSize: '28px',
          fontWeight: '800',
          margin: 0,
          textShadow: AQUACHILE_THEME.textGlow || '0 0 12px rgba(0,242,254,0.45)'
        }}>
          Registrar Nuevo Candidato
        </h1>
        <p style={{ color: AQUACHILE_THEME.textMuted || '#94B4CB', margin: '6px 0 0 0', fontSize: '14px' }}>
          Ingresa los antecedentes del postulante para el proceso de selección.
        </p>
      </div>

      <div style={{
        background: AQUACHILE_THEME.surface || 'rgba(7, 30, 49, 0.72)',
        backdropFilter: 'blur(16px)',
        borderRadius: '14px',
        border: `1px solid ${AQUACHILE_THEME.surfaceBorder || 'rgba(0, 242, 254, 0.22)'}`,
        padding: '28px',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.35)'
      }}>
        
        {mensajeExito && (
          <div style={{
            background: 'rgba(0, 255, 178, 0.15)',
            border: '1px solid #00FFB2',
            color: '#00FFB2',
            padding: '12px',
            borderRadius: '8px',
            marginBottom: '18px',
            fontWeight: 'bold',
            textAlign: 'center'
          }}>
            ¡Candidato registrado exitosamente! Redirigiendo...
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          <div>
            <label style={{ display: 'block', color: '#E2E8F0', fontSize: '13px', fontWeight: '700', marginBottom: '6px' }}>
              Nombre Completo:
            </label>
            <input
              type="text"
              required
              value={formulario.nombre}
              onChange={(e) => setFormulario({ ...formulario, nombre: e.target.value })}
              placeholder="Ej: Andrés Muñoz Soto"
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: '8px',
                border: '1px solid rgba(0, 242, 254, 0.3)',
                background: '#020F1D',
                color: '#FFFFFF',
                fontSize: '14px',
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', color: '#E2E8F0', fontSize: '13px', fontWeight: '700', marginBottom: '6px' }}>
                RUT:
              </label>
              <input
                type="text"
                required
                value={formulario.rut}
                onChange={(e) => setFormulario({ ...formulario, rut: e.target.value })}
                placeholder="12.345.678-9"
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: '8px',
                  border: '1px solid rgba(0, 242, 254, 0.3)',
                  background: '#020F1D',
                  color: '#FFFFFF',
                  fontSize: '14px',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', color: '#E2E8F0', fontSize: '13px', fontWeight: '700', marginBottom: '6px' }}>
                Teléfono:
              </label>
              <input
                type="text"
                value={formulario.telefono}
                onChange={(e) => setFormulario({ ...formulario, telefono: e.target.value })}
                placeholder="+56 9 1234 5678"
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: '8px',
                  border: '1px solid rgba(0, 242, 254, 0.3)',
                  background: '#020F1D',
                  color: '#FFFFFF',
                  fontSize: '14px',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', color: '#E2E8F0', fontSize: '13px', fontWeight: '700', marginBottom: '6px' }}>
                Cargo a Postular:
              </label>
              <input
                type="text"
                required
                value={formulario.cargo}
                onChange={(e) => setFormulario({ ...formulario, cargo: e.target.value })}
                placeholder="Ej: Supervisor de Calidad"
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: '8px',
                  border: '1px solid rgba(0, 242, 254, 0.3)',
                  background: '#020F1D',
                  color: '#FFFFFF',
                  fontSize: '14px',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', color: '#E2E8F0', fontSize: '13px', fontWeight: '700', marginBottom: '6px' }}>
                Familia de Cargo:
              </label>
              <select
                value={formulario.familia}
                onChange={(e) => setFormulario({ ...formulario, familia: e.target.value })}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: '8px',
                  border: '1px solid rgba(0, 242, 254, 0.3)',
                  background: '#020F1D',
                  color: '#FFFFFF',
                  fontSize: '14px',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              >
                <option value="Operaciones" style={{ background: '#021120', color: '#FFF' }}>Operaciones</option>
                <option value="Producción" style={{ background: '#021120', color: '#FFF' }}>Producción</option>
                <option value="Calidad" style={{ background: '#021120', color: '#FFF' }}>Calidad</option>
                <option value="Mantenimiento" style={{ background: '#021120', color: '#FFF' }}>Mantenimiento</option>
              </select>
            </div>
          </div>

          <div>
            <label style={{ display: 'block', color: '#E2E8F0', fontSize: '13px', fontWeight: '700', marginBottom: '6px' }}>
              Correo Electrónico (sin espacios):
            </label>
            <input
              type="email"
              required
              value={formulario.email}
              /* Elimina espacios automáticamente al tipear o pegar */
              onChange={(e) => {
                const sinEspacios = e.target.value.replace(/\s/g, '');
                setFormulario({ ...formulario, email: sinEspacios });
                if (errorEmail) setErrorEmail('');
              }}
              /* Bloquea directamente la tecla espaciadora */
              onKeyDown={(e) => {
                if (e.key === ' ' || e.code === 'Space') {
                  e.preventDefault();
                }
              }}
              placeholder="correo@ejemplo.cl"
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: '8px',
                border: errorEmail ? '1px solid #FF4B4B' : '1px solid rgba(0, 242, 254, 0.3)',
                background: '#020F1D',
                color: '#FFFFFF',
                fontSize: '14px',
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />
            {errorEmail && (
              <span style={{ color: '#FF7B7B', fontSize: '12px', display: 'block', marginTop: '4px', fontWeight: 'bold' }}>
                {errorEmail}
              </span>
            )}
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '14px' }}>
            <button
              type="button"
              onClick={() => navigate('/candidatos')}
              style={{
                padding: '10px 18px',
                borderRadius: '8px',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                background: 'rgba(255, 255, 255, 0.08)',
                color: '#FFFFFF',
                cursor: 'pointer',
                fontWeight: '600',
                fontSize: '14px'
              }}
            >
              Cancelar
            </button>
            <button
              type="submit"
              style={{
                padding: '10px 24px',
                borderRadius: '8px',
                border: 'none',
                background: AQUACHILE_THEME.glowButton || 'linear-gradient(135deg, #00F2FE 0%, #008289 100%)',
                color: '#021120',
                cursor: 'pointer',
                fontWeight: '800',
                fontSize: '14px',
                boxShadow: '0 0 14px rgba(0, 242, 254, 0.4)'
              }}
            >
              Registrar Candidato
            </button>
          </div>

        </form>
      </div>

    </div>
  );
};

export default NuevoCandidato;