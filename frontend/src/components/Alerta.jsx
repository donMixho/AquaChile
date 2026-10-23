const estilos = {
  error: { backgroundColor: '#FDE8E4', color: '#A93B24', borderLeft: '4px solid #A93B24' },
  exito: { backgroundColor: '#E3F2DC', color: '#2F6914', borderLeft: '4px solid #2F6914' }
};

const Alerta = ({ tipo = 'error', children }) => (
  <div
    role={tipo === 'error' ? 'alert' : 'status'}
    style={{ ...estilos[tipo], padding: '10px', borderRadius: '6px', fontSize: '14px' }}
  >
    {children}
  </div>
);

export default Alerta;
