import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AQUACHILE_THEME } from '../theme';
import { obtenerCandidatos } from '../services/candidatosService';

const Candidatos = () => {
  const navigate = useNavigate();

  const [candidatos, setCandidatos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [errorCarga, setErrorCarga] = useState('');

  const [modalEditar, setModalEditar] = useState(null);
  const [modalSolicitud, setModalSolicitud] = useState(null);
  const [notificacion, setNotificacion] = useState('');
  const [errorEmail, setErrorEmail] = useState('');

  useEffect(() => {
    let activo = true;

    obtenerCandidatos()
      .then((datos) => {
        if (activo) {
          setCandidatos(datos.map((candidato) => ({
            ...candidato,
            nombre: candidato.nombre_completo ?? candidato.nombre,
            familia: candidato.familia_cargo ?? candidato.familia
          })));
        }
      })
      .catch((error) => {
        if (activo) {
          setErrorCarga(error instanceof Error
            ? `No se pudieron cargar los candidatos: ${error.message}`
            : 'No se pudieron cargar los candidatos. Inténtalo nuevamente.');
        }
      })
      .finally(() => {
        if (activo) setCargando(false);
      });

    return () => {
      activo = false;
    };
  }, []);

  // 1. Guardar cambios con validación estricta de correo sin espacios
  const guardarEdicion = (e) => {
    e.preventDefault();

    // Verificación de espacios
    if (modalEditar.email.includes(' ')) {
      setErrorEmail('El correo no puede contener espacios en blanco.');
      return;
    }

    // Verificación de formato estándar
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(modalEditar.email)) {
      setErrorEmail('Ingresa un formato de correo válido (ej: nombre@dominio.cl).');
      return;
    }

    setErrorEmail('');
    setCandidatos(candidatos.map(c => c.id === modalEditar.id ? modalEditar : c));
    setModalEditar(null);
    lanzarNotificacion('✅ Datos del candidato actualizados con éxito.');
  };

  const confirmarSolicitudEvaluacion = () => {
    lanzarNotificacion(`🚀 Solicitud creada para ${modalSolicitud.nombre}. Carpeta OneDrive y Pauta STAR vinculadas.`);
    setModalSolicitud(null);
    setTimeout(() => {
      navigate('/solicitudes');
    }, 1500);
  };

  const lanzarNotificacion = (msg) => {
    setNotificacion(msg);
    setTimeout(() => setNotificacion(''), 4000);
  };

  return (
    <div style={{ minHeight: '85vh', fontFamily: "'Segoe UI', Roboto, sans-serif" }}>
      
      {/* Notificación flotante superior */}
      {notificacion && (
        <div style={{
          background: 'rgba(2, 27, 43, 0.95)',
          color: '#FFFFFF',
          padding: '14px 24px',
          borderRadius: '10px',
          boxShadow: '0 4px 20px rgba(0, 242, 254, 0.3)',
          marginBottom: '20px',
          borderLeft: `6px solid ${AQUACHILE_THEME.accent || '#00FFB2'}`,
          border: '1px solid rgba(0, 242, 254, 0.3)',
          fontWeight: '600',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <span>{notificacion}</span>
          <button onClick={() => setNotificacion('')} style={{ background: 'transparent', border: 'none', color: '#FFF', cursor: 'pointer', fontSize: '18px' }}>✕</button>
        </div>
      )}

      {/* Encabezado */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{
            color: '#FFFFFF',
            fontSize: '28px',
            fontWeight: '800',
            margin: 0,
            textShadow: AQUACHILE_THEME.textGlow || '0 0 12px rgba(0,242,254,0.45)'
          }}>
            Gestión de Candidatos
          </h1>
          <p style={{ color: AQUACHILE_THEME.textMuted || '#94B4CB', margin: '4px 0 0 0', fontSize: '14px' }}>
            Base de postulantes para procesos de evaluación y selección AquaChile.
          </p>
        </div>

        <button
          onClick={() => navigate('/candidatos/nuevo')}
          style={{
            background: AQUACHILE_THEME.glowButton || 'linear-gradient(135deg, #00F2FE 0%, #008289 100%)',
            color: '#021120',
            border: 'none',
            borderRadius: '10px',
            padding: '12px 20px',
            fontWeight: '800',
            fontSize: '14px',
            cursor: 'pointer',
            boxShadow: '0 0 16px rgba(0, 242, 254, 0.4)'
          }}
        >
          + Nuevo Candidato
        </button>
      </div>

      {/* Tabla Glassmorphic */}
      <div style={{
        background: AQUACHILE_THEME.surface || 'rgba(7, 30, 49, 0.72)',
        backdropFilter: 'blur(16px)',
        borderRadius: '14px',
        border: `1px solid ${AQUACHILE_THEME.surfaceBorder || 'rgba(0, 242, 254, 0.22)'}`,
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.35)',
        overflow: 'hidden'
      }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{
              background: 'rgba(0, 242, 254, 0.06)',
              borderBottom: `1px solid ${AQUACHILE_THEME.surfaceBorder || 'rgba(0, 242, 254, 0.22)'}`,
              color: AQUACHILE_THEME.primary || '#00F2FE',
              fontSize: '13px',
              textTransform: 'uppercase',
              letterSpacing: '1px'
            }}>
              <th style={{ padding: '16px 20px' }}>Candidato</th>
              <th style={{ padding: '16px 20px' }}>RUT</th>
              <th style={{ padding: '16px 20px' }}>Cargo / Área</th>
              <th style={{ padding: '16px 20px' }}>Contacto</th>
              <th style={{ padding: '16px 20px', textAlign: 'center' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {cargando ? (
              <tr><td colSpan="5" style={{ padding: '24px', textAlign: 'center', color: AQUACHILE_THEME.textMuted }}>Cargando candidatos...</td></tr>
            ) : errorCarga ? (
              <tr><td colSpan="5" role="alert" style={{ padding: '24px', textAlign: 'center', color: '#FF7B7B' }}>{errorCarga}</td></tr>
            ) : candidatos.length === 0 ? (
              <tr><td colSpan="5" style={{ padding: '24px', textAlign: 'center', color: AQUACHILE_THEME.textMuted }}>No hay candidatos registrados.</td></tr>
            ) : candidatos.map((c) => (
              <tr key={c.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)', fontSize: '14px' }}>
                <td style={{ padding: '16px 20px', fontWeight: 'bold', color: '#FFFFFF' }}>
                  {c.nombre}
                </td>
                <td style={{ padding: '16px 20px', color: AQUACHILE_THEME.textMuted || '#94B4CB' }}>{c.rut}</td>
                <td style={{ padding: '16px 20px' }}>
                  <div style={{ fontWeight: '600', color: AQUACHILE_THEME.primary || '#00F2FE' }}>{c.cargo}</div>
                  <small style={{ color: AQUACHILE_THEME.textMuted || '#94B4CB' }}>{c.familia}</small>
                </td>
                <td style={{ padding: '16px 20px', color: AQUACHILE_THEME.textMuted || '#94B4CB' }}>{c.email}</td>
                
                <td style={{ padding: '16px 20px', textAlign: 'center' }}>
                  <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                    
                    <button
                      onClick={() => {
                        setErrorEmail('');
                        setModalEditar({ ...c });
                      }}
                      style={{
                        background: 'rgba(255, 255, 255, 0.08)',
                        color: '#FFFFFF',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                        borderRadius: '6px',
                        padding: '6px 14px',
                        fontSize: '12px',
                        fontWeight: '700',
                        cursor: 'pointer'
                      }}
                    >
                      Editar
                    </button>

                    <button
                      onClick={() => setModalSolicitud(c)}
                      style={{
                        background: AQUACHILE_THEME.glowButton || 'linear-gradient(135deg, #00F2FE 0%, #008289 100%)',
                        color: '#021120',
                        border: 'none',
                        borderRadius: '6px',
                        padding: '6px 14px',
                        fontSize: '12px',
                        fontWeight: '800',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        boxShadow: '0 0 10px rgba(0, 242, 254, 0.3)'
                      }}
                    >
                      <span>⚡</span> Solicitar Eval.
                    </button>

                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* --- MODAL EDITAR CANDIDATO --- */}
      {modalEditar && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(1, 10, 18, 0.85)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: '#041B2D',
            border: '1px solid rgba(0, 242, 254, 0.4)',
            borderRadius: '14px',
            padding: '28px',
            maxWidth: '460px',
            width: '90%',
            boxShadow: '0 10px 40px rgba(0, 242, 254, 0.2)'
          }}>
            <h3 style={{
              margin: '0 0 18px 0',
              color: AQUACHILE_THEME.primary || '#00F2FE',
              fontSize: '20px',
              fontWeight: '800',
              borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
              paddingBottom: '10px'
            }}>
              Editar Candidato
            </h3>
            
            <form onSubmit={guardarEdicion} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ fontSize: '13px', fontWeight: '700', color: '#E2E8F0', display: 'block', marginBottom: '6px' }}>
                  Nombre Completo:
                </label>
                <input
                  type="text"
                  value={modalEditar.nombre}
                  onChange={(e) => setModalEditar({ ...modalEditar, nombre: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    border: '1px solid rgba(0, 242, 254, 0.3)',
                    background: '#020F1D',
                    color: '#FFFFFF',
                    fontSize: '15px',
                    fontWeight: '600',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                  required
                />
              </div>

              <div>
                <label style={{ fontSize: '13px', fontWeight: '700', color: '#E2E8F0', display: 'block', marginBottom: '6px' }}>
                  Cargo al que postula:
                </label>
                <input
                  type="text"
                  value={modalEditar.cargo}
                  onChange={(e) => setModalEditar({ ...modalEditar, cargo: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    border: '1px solid rgba(0, 242, 254, 0.3)',
                    background: '#020F1D',
                    color: '#FFFFFF',
                    fontSize: '15px',
                    fontWeight: '600',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                  required
                />
              </div>

              <div>
                <label style={{ fontSize: '13px', fontWeight: '700', color: '#E2E8F0', display: 'block', marginBottom: '6px' }}>
                  Correo Electrónico (sin espacios):
                </label>
                <input
                  type="email"
                  value={modalEditar.email}
                  /* Filtra espacios automáticamente al pegar o escribir */
                  onChange={(e) => {
                    const textoLimpio = e.target.value.replace(/\s/g, '');
                    setModalEditar({ ...modalEditar, email: textoLimpio });
                    if (errorEmail) setErrorEmail('');
                  }}
                  /* Bloquea la barra espaciadora en vivo */
                  onKeyDown={(e) => {
                    if (e.key === ' ' || e.code === 'Space') {
                      e.preventDefault();
                    }
                  }}
                  placeholder="ejemplo@aquachile.cl"
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    border: errorEmail ? '1px solid #FF4B4B' : '1px solid rgba(0, 242, 254, 0.3)',
                    background: '#020F1D',
                    color: '#FFFFFF',
                    fontSize: '15px',
                    fontWeight: '600',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                  required
                />
                {errorEmail && (
                  <span style={{ color: '#FF7B7B', fontSize: '12px', display: 'block', marginTop: '4px', fontWeight: 'bold' }}>
                    {errorEmail}
                  </span>
                )}
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '16px' }}>
                <button
                  type="button"
                  onClick={() => {
                    setErrorEmail('');
                    setModalEditar(null);
                  }}
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
                    padding: '10px 22px',
                    borderRadius: '8px',
                    border: 'none',
                    background: AQUACHILE_THEME.glowButton || 'linear-gradient(135deg, #00F2FE 0%, #008289 100%)',
                    color: '#021120',
                    fontWeight: '800',
                    fontSize: '14px',
                    cursor: 'pointer',
                    boxShadow: '0 0 14px rgba(0, 242, 254, 0.4)'
                  }}
                >
                  Guardar Cambios
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL SOLICITAR EVALUACIÓN --- */}
      {modalSolicitud && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(1, 10, 18, 0.85)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: '#041B2D',
            border: '1px solid rgba(0, 242, 254, 0.4)',
            borderRadius: '14px',
            padding: '28px',
            maxWidth: '500px',
            width: '90%',
            boxShadow: '0 10px 40px rgba(0, 242, 254, 0.2)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <div style={{
                background: AQUACHILE_THEME.glowButton || 'linear-gradient(135deg, #00F2FE 0%, #008289 100%)',
                color: '#021120',
                borderRadius: '50%',
                width: '36px',
                height: '36px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: '900',
                fontSize: '14px',
                boxShadow: '0 0 12px rgba(0, 242, 254, 0.5)'
              }}>AI</div>
              <h3 style={{ margin: 0, color: '#FFFFFF', fontSize: '20px', fontWeight: '800' }}>
                Iniciar Flujo Automatizado
              </h3>
            </div>
            
            <p style={{ color: '#E2E8F0', fontSize: '14px', lineHeight: '1.6' }}>
              ¿Deseas generar la orden de evaluación psicolaboral para <strong style={{ color: AQUACHILE_THEME.primary || '#00F2FE' }}>{modalSolicitud.nombre}</strong>?
            </p>

            <div style={{
              background: 'rgba(2, 15, 29, 0.7)',
              padding: '14px',
              borderRadius: '8px',
              fontSize: '13px',
              marginBottom: '22px',
              borderLeft: `4px solid ${AQUACHILE_THEME.accent || '#00FFB2'}`,
              border: '1px solid rgba(255, 255, 255, 0.08)'
            }}>
              <strong style={{ color: AQUACHILE_THEME.accent || '#00FFB2' }}>Acciones automáticas del sistema:</strong>
              <ul style={{ margin: '8px 0 0 16px', padding: 0, color: '#CBD5E1', lineHeight: '1.5' }}>
                <li>Creación de carpeta en OneDrive: <code style={{ color: '#00F2FE' }}>/{modalSolicitud.nombre}/</code></li>
                <li>Incrustación de plantilla Excel y Pauta STAR ({modalSolicitud.familia})</li>
                <li>Notificación inmediata al psicólogo evaluador</li>
              </ul>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button
                onClick={() => setModalSolicitud(null)}
                style={{
                  padding: '10px 18px',
                  borderRadius: '8px',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  background: 'rgba(255, 255, 255, 0.08)',
                  color: '#FFFFFF',
                  cursor: 'pointer',
                  fontWeight: '600'
                }}
              >
                Cancelar
              </button>
              <button
                onClick={confirmarSolicitudEvaluacion}
                style={{
                  padding: '10px 22px',
                  borderRadius: '8px',
                  border: 'none',
                  background: AQUACHILE_THEME.glowButton || 'linear-gradient(135deg, #00F2FE 0%, #008289 100%)',
                  color: '#021120',
                  cursor: 'pointer',
                  fontWeight: '800',
                  boxShadow: '0 0 14px rgba(0, 242, 254, 0.4)'
                }}
              >
                Confirmar y Derivar
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Candidatos;