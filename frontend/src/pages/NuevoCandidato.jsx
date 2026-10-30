import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { crearCandidato } from '../services/candidatosService';

const formatearRut = (valor) => {
  const caracteres = valor.toUpperCase().replace(/[^0-9K]/g, '');
  const tieneVerificador = caracteres.length > 8 || caracteres.endsWith('K');
  const cuerpo = (tieneVerificador ? caracteres.slice(0, -1) : caracteres)
    .replace(/\D/g, '')
    .slice(0, 8);
  const verificador = tieneVerificador
    ? caracteres.slice(-1).replace(/[^0-9K]/g, '')
    : '';
  const cuerpoFormateado = cuerpo.replace(/\B(?=(\d{3})+(?!\d))/g, '.');

  return verificador
    ? `${cuerpoFormateado}-${verificador}`
    : cuerpoFormateado;
};

// Valida largo y dígito verificador (módulo 11) de un RUT ya formateado o sin formato.
const rutValido = (rut) => {
  const limpio = rut.replace(/[.\-\s]/g, '').toUpperCase();
  if (!/^\d{7,8}[0-9K]$/.test(limpio)) return false;

  const cuerpo = limpio.slice(0, -1);
  let suma = 0;
  let multiplicador = 2;
  for (let i = cuerpo.length - 1; i >= 0; i -= 1) {
    suma += Number(cuerpo[i]) * multiplicador;
    multiplicador = multiplicador === 7 ? 2 : multiplicador + 1;
  }
  const resto = 11 - (suma % 11);
  const esperado = resto === 11 ? '0' : resto === 10 ? 'K' : String(resto);

  return limpio.slice(-1) === esperado;
};

const normalizarEmail = (valor) => valor.replace(/\s/g, '').toLowerCase();

const TAMANO_MAX_CV = 5 * 1024 * 1024;
const EXTENSIONES_CV = ['pdf', 'doc', 'docx'];

const emailValido = (email) =>
  /^[^@\s]+@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z]{2,}$/i.test(email);

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

  const [archivoCv, setArchivoCv] = useState(null);
  const [errorCv, setErrorCv] = useState('');
  const [errorEmail, setErrorEmail] = useState('');
  const [errorRut, setErrorRut] = useState('');
  const [errorInsercion, setErrorInsercion] = useState('');
  const [mensajeExito, setMensajeExito] = useState(false);
  const [guardando, setGuardando] = useState(false);

  const handleCvChange = (e) => {
    const archivo = e.target.files[0] ?? null;
    const extension = archivo?.name.split('.').pop().toLowerCase();

    if (archivo && !EXTENSIONES_CV.includes(extension)) {
      setErrorCv('Formato no permitido. Usa PDF, DOC o DOCX.');
      setArchivoCv(null);
      e.target.value = '';
    } else if (archivo && archivo.size > TAMANO_MAX_CV) {
      setErrorCv('El archivo supera el máximo de 5 MB.');
      setArchivoCv(null);
      e.target.value = '';
    } else {
      setErrorCv('');
      setArchivoCv(archivo);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const rutOk = rutValido(formulario.rut);
    const emailOk = emailValido(formulario.email);
    setErrorRut(rutOk ? '' : 'El RUT no es válido. Revisa el número y el dígito verificador.');
    setErrorEmail(emailOk ? '' : 'Ingresa un correo electrónico con formato válido.');
    if (!rutOk || !emailOk) return;

    setErrorInsercion('');
    setGuardando(true);

    try {
      const formData = formulario;
      await crearCandidato(formData, archivoCv);
      setMensajeExito(true);
      setTimeout(() => {
        navigate('/candidatos');
      }, 1500);
    } catch (error) {
      setErrorInsercion(
        error instanceof Error
          ? `No se pudo registrar el candidato: ${error.message}`
          : 'No se pudo registrar el candidato. Inténtalo nuevamente.'
      );
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div style={{ maxWidth: '650px', margin: '0 auto', fontFamily: "'Segoe UI', Roboto, sans-serif" }}>
      
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{
          color: '#5a6b81',
          fontSize: '28px',
          fontWeight: '800',
          margin: 0
        }}>
          Registrar Nuevo Candidato
        </h1>
        <p style={{ color: '#6b7280', margin: '6px 0 0 0', fontSize: '14px' }}>
          Ingresa los antecedentes del postulante para el proceso de selección.
        </p>
      </div>

      <div style={{
        background: '#FFFFFF',
        borderRadius: '14px',
        border: '1px solid #e5e7eb',
        padding: '28px',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08)'
      }}>
        
        {mensajeExito && (
          <div role="status" style={{
            background: '#ecfdf5',
            border: '1px solid #6ee7b7',
            color: '#047857',
            padding: '12px',
            borderRadius: '8px',
            marginBottom: '18px',
            fontWeight: 'bold',
            textAlign: 'center'
          }}>
            ¡Candidato registrado exitosamente! Redirigiendo...
          </div>
        )}

        {errorInsercion && (
          <div role="alert" style={{
            background: '#fef2f2',
            border: '1px solid #fca5a5',
            color: '#b91c1c',
            padding: '12px',
            borderRadius: '8px',
            marginBottom: '18px',
            fontWeight: 'bold',
            textAlign: 'center'
          }}>
            {errorInsercion}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          <div>
            <label style={{ display: 'block', color: '#5a6b81', fontSize: '13px', fontWeight: '700', marginBottom: '6px' }}>
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
                border: '1px solid #d1d5db',
                background: '#FFFFFF',
                color: '#1f2937',
                fontSize: '14px',
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', color: '#5a6b81', fontSize: '13px', fontWeight: '700', marginBottom: '6px' }}>
                RUT:
              </label>
              <input
                type="text"
                required
                value={formulario.rut}
                onChange={(e) => {
                  setFormulario({ ...formulario, rut: formatearRut(e.target.value) });
                  if (errorRut) setErrorRut('');
                }}
                placeholder="12.345.678-9"
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: '8px',
                  border: errorRut ? '1px solid #b91c1c' : '1px solid #d1d5db',
                  background: '#FFFFFF',
                  color: '#1f2937',
                  fontSize: '14px',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
              {errorRut && (
                <span role="alert" style={{ color: '#b91c1c', fontSize: '12px', display: 'block', marginTop: '4px', fontWeight: 'bold' }}>
                  {errorRut}
                </span>
              )}
            </div>

            <div>
              <label style={{ display: 'block', color: '#5a6b81', fontSize: '13px', fontWeight: '700', marginBottom: '6px' }}>
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
                  border: '1px solid #d1d5db',
                  background: '#FFFFFF',
                  color: '#1f2937',
                  fontSize: '14px',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', color: '#5a6b81', fontSize: '13px', fontWeight: '700', marginBottom: '6px' }}>
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
                  border: '1px solid #d1d5db',
                  background: '#FFFFFF',
                  color: '#1f2937',
                  fontSize: '14px',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', color: '#5a6b81', fontSize: '13px', fontWeight: '700', marginBottom: '6px' }}>
                Familia de Cargo:
              </label>
              <select
                value={formulario.familia}
                onChange={(e) => setFormulario({ ...formulario, familia: e.target.value })}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: '8px',
                  border: '1px solid #d1d5db',
                  background: '#FFFFFF',
                  color: '#1f2937',
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
            <label style={{ display: 'block', color: '#5a6b81', fontSize: '13px', fontWeight: '700', marginBottom: '6px' }}>
              Correo Electrónico (sin espacios):
            </label>
            <input
              type="email"
              required
              value={formulario.email}
              onChange={(e) => {
                setFormulario({
                  ...formulario,
                  email: normalizarEmail(e.target.value)
                });
                if (errorEmail) setErrorEmail('');
              }}
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
                border: errorEmail ? '1px solid #b91c1c' : '1px solid #d1d5db',
                background: '#FFFFFF',
                color: '#1f2937',
                fontSize: '14px',
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />
            {errorEmail && (
              <span role="alert" style={{ color: '#b91c1c', fontSize: '12px', display: 'block', marginTop: '4px', fontWeight: 'bold' }}>
                {errorEmail}
              </span>
            )}
          </div>

          <div>
            <label style={{ display: 'block', color: '#5a6b81', fontSize: '13px', fontWeight: '700', marginBottom: '6px' }}>
              Currículum Vitae (opcional):
            </label>
            <input
              type="file"
              accept=".pdf,.doc,.docx"
              onChange={handleCvChange}
              className="file:mr-3 file:rounded-md file:border file:border-aqua-orange file:bg-transparent file:px-3 file:py-1 file:text-sm file:text-aqua-orange file:cursor-pointer"
              style={{
                width: '100%',
                padding: '8px 14px',
                borderRadius: '8px',
                border: errorCv ? '1px solid #b91c1c' : '1px solid #d1d5db',
                background: '#FFFFFF',
                color: '#1f2937',
                fontSize: '14px',
                boxSizing: 'border-box'
              }}
            />
            <span style={{ color: '#6b7280', fontSize: '12px', display: 'block', marginTop: '4px' }}>
              PDF, DOC o DOCX. Máximo 5 MB.
            </span>
            {errorCv && (
              <span style={{ color: '#b91c1c', fontSize: '12px', display: 'block', marginTop: '4px', fontWeight: 'bold' }}>
                {errorCv}
              </span>
            )}
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '14px' }}>
            <button
              type="button"
              onClick={() => navigate('/candidatos')}
              className="transition-all duration-200 hover:shadow-md hover:-translate-y-0.5"
              style={{
                padding: '10px 18px',
                borderRadius: '8px',
                border: '1px solid #f26522',
                background: 'transparent',
                color: '#f26522',
                cursor: 'pointer',
                fontWeight: '600',
                fontSize: '14px'
              }}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={guardando}
              className="transition-all duration-200 hover:shadow-md hover:-translate-y-0.5"
              style={{
                padding: '10px 24px',
                borderRadius: '8px',
                border: 'none',
                background: '#f26522',
                color: '#FFFFFF',
                cursor: guardando ? 'wait' : 'pointer',
                opacity: guardando ? 0.7 : 1,
                fontWeight: '800',
                fontSize: '14px'
              }}
            >
              {guardando ? 'Registrando...' : 'Registrar Candidato'}
            </button>
          </div>

        </form>
      </div>

    </div>
  );
};

export default NuevoCandidato;