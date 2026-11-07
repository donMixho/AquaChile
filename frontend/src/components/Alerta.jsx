const estilos = {
  error: { backgroundColor: '#FDE8E4', color: '#A93B24', border: '1px solid #F2B8AA' },
  exito: { backgroundColor: '#E3F2DC', color: '#2F6914', border: '1px solid #B7D8A5' }
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
