// Sustituye a services/supabaseClient.js SOLO al generar las capturas del README (ver
// generar-capturas.mjs). No se conecta a ningún Supabase: responde con datos de muestra inventados
// y con una sesión del rol que pida la dirección (?rol=admin | reclutador | operaciones).
const DIA = 24 * 60 * 60 * 1000;
const haceDias = (n) => new Date(Date.now() - n * DIA).toISOString();

const rol = new URLSearchParams(window.location.search).get('rol') ?? 'admin';

const USUARIOS = {
  admin: { id: 'a1', email: 'marcela.soto@aquachile.cl' },
  reclutador: { id: 'r1', email: 'camila.rojas@aquachile.cl' },
  operaciones: { id: 'o1', email: 'jorge.paredes@aquachile.cl' }
};

const perfiles = [
  { id: 'a1', nombre: 'Marcela Soto', email: 'marcela.soto@aquachile.cl', rol: 'admin', estado: 'activo' },
  { id: 'r1', nombre: 'Camila Rojas', email: 'camila.rojas@aquachile.cl', rol: 'reclutador', estado: 'activo' },
  { id: 'r2', nombre: 'Diego Fuentes', email: 'diego.fuentes@aquachile.cl', rol: 'reclutador', estado: 'ausente' },
  { id: 'o1', nombre: 'Jorge Paredes', email: 'jorge.paredes@aquachile.cl', rol: 'operaciones', estado: 'activo' }
];

const solicitudes = [
  { id: 1, titulo: 'Reposición turno noche planta', cargo: 'Operario de Procesos', familia_cargo: 'Operaciones', vacantes: 3, estado: 'Abierta', descripcion: 'Tres operarios para el turno de noche.', created_at: haceDias(14) },
  { id: 2, titulo: 'Refuerzo mantención mecánica', cargo: 'Técnico en Mantención', familia_cargo: 'Mantenimiento', vacantes: 1, estado: 'En proceso', descripcion: 'Técnico mecánico para mantención preventiva.', created_at: haceDias(12) },
  { id: 3, titulo: 'Jefe de turno centro de cultivo', cargo: 'Jefe de Turno', familia_cargo: 'Producción', vacantes: 1, estado: 'Abierta', descripcion: 'Jefatura de turno en centro de cultivo.', created_at: haceDias(9) }
];

const base = (id, nombre, cargo, familia, estado, reclutador, solicitud, dias, extra = {}) => ({
  id,
  nombre_completo: nombre,
  rut: `${17 + (id % 6)}.${300 + id * 37}.${100 + id * 11}-${id % 10}`,
  cargo,
  familia_cargo: familia,
  email: `${nombre.split(' ')[0].toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')}@correo.cl`,
  telefono: `+569${50000000 + id * 123457}`,
  cv_url: 'https://example.com/cv.pdf',
  drive_folder_url: 'https://drive.google.com/',
  estado,
  reclutador_id: reclutador,
  solicitud_id: solicitud,
  decision_operaciones: null,
  motivo_decision: null,
  decidido_en: null,
  created_at: haceDias(dias),
  ...extra
});

const candidatos = [
  base(1, 'Valentina Muñoz Araya', 'Operario de Procesos', 'Operaciones', 'Pendiente', 'r1', 1, 6),
  base(2, 'Sebastián Cárcamo Vera', 'Operario de Procesos', 'Operaciones', 'En proceso', 'r1', 1, 4),
  base(3, 'Francisca Oyarzún Díaz', 'Técnico en Mantención', 'Mantenimiento', 'En proceso', 'r1', 2, 3),
  base(4, 'Matías Barría Soto', 'Operario de Procesos', 'Operaciones', 'Apto', 'r1', 1, 9),
  base(5, 'Constanza Levipán Ruiz', 'Operario de Procesos', 'Operaciones', 'Apto', 'r1', 1, 11, {
    decision_operaciones: 'Seleccionado', decidido_en: haceDias(2)
  }),
  base(6, 'Nicolás Alvarado Pinto', 'Técnico en Mantención', 'Mantenimiento', 'No apto', 'r1', 2, 10),
  base(7, 'Daniela Uribe Cárdenas', 'Jefe de Turno', 'Producción', 'Pendiente', 'r2', 3, 8),
  base(8, 'Felipe Mansilla Gómez', 'Jefe de Turno', 'Producción', 'En proceso', 'r2', 3, 5),
  base(9, 'Javiera Navarro Téllez', 'Operario de Procesos', 'Operaciones', 'Apto', 'r2', 1, 7),
  base(10, 'Ignacio Soto Barrientos', 'Operario de Procesos', 'Operaciones', 'Pendiente', null, null, 1),
  base(11, 'Tomás Fierro Aguilar', 'Operario de Procesos', 'Operaciones', 'Apto', 'r1', 1, 13, {
    decision_operaciones: 'Descartado', motivo_decision: 'Prefirió continuar en su empleo actual.', decidido_en: haceDias(5)
  })
];

const evaluaciones = [4, 5, 9, 11].map((id, i) => ({
  candidato_id: id,
  modalidad: i % 2 ? 'Presencial' : 'Videollamada',
  lugar: i % 2 ? 'Oficina Puerto Montt, sala 2' : null,
  respuestas: {
    estudios: 'Técnico en acuicultura',
    experiencia: 'Tres años en planta de proceso, turnos rotativos.',
    disponibilidad: 'Inmediata',
    turnos: 'Acepta turnos y traslado',
    renta: '780000',
    comunicacion: 4,
    equipo: 5,
    adaptacion: 4
  },
  observaciones: 'Buena disposición a turnos y a trabajar en zonas remotas.',
  estado: 'finalizada'
}));

const TABLAS = { perfiles, solicitudes, candidatos, evaluaciones };

// Imita la cadena de consultas de supabase-js lo justo para que la app funcione.
const consulta = (nombre) => {
  let filas = [...(TABLAS[nombre] ?? [])];
  const q = {
    select: () => q,
    order: (columna, { ascending = true } = {}) => {
      filas.sort((a, b) => (String(a[columna]) < String(b[columna]) ? -1 : 1) * (ascending ? 1 : -1));
      return q;
    },
    eq: (columna, valor) => {
      filas = filas.filter((f) => f[columna] === valor);
      return q;
    },
    in: (columna, valores) => {
      filas = filas.filter((f) => valores.includes(f[columna]));
      return q;
    },
    maybeSingle: () => Promise.resolve({ data: filas[0] ?? null, error: null }),
    single: () => Promise.resolve({ data: filas[0] ?? null, error: null }),
    then: (ok, ko) => Promise.resolve({ data: filas, error: null }).then(ok, ko)
  };
  return q;
};

const sesion = {
  user: { ...USUARIOS[rol], app_metadata: { rol } }
};

export const supabase = {
  from: consulta,
  auth: {
    getSession: () => Promise.resolve({ data: { session: sesion } }),
    onAuthStateChange: () => ({ data: { subscription: { unsubscribe() {} } } }),
    signInWithPassword: () => Promise.resolve({ data: { session: sesion }, error: null }),
    signOut: () => Promise.resolve({ error: null }),
    updateUser: () => Promise.resolve({ error: null })
  },
  functions: { invoke: () => Promise.resolve({ data: null, error: new Error('Sin conexión (vista previa)') }) },
  storage: { from: () => ({ upload: () => Promise.resolve({ error: null }), getPublicUrl: () => ({ data: { publicUrl: '' } }), remove: () => Promise.resolve({}) }) }
};
