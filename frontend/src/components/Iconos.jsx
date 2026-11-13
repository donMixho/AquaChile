// Iconos SVG de trazo (estilo Lucide) como componentes reutilizables.
// Son decorativos (aria-hidden): el nombre accesible lo da el botón que los contiene.
const Icono = ({ children, className = 'w-5 h-5' }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    focusable="false"
    className={className}
  >
    {children}
  </svg>
);

export const IconoEditar = (props) => (
  <Icono {...props}>
    <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
    <path d="m15 5 4 4" />
  </Icono>
);

export const IconoEliminar = (props) => (
  <Icono {...props}>
    <path d="M3 6h18" />
    <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
    <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
    <path d="M10 11v6" />
    <path d="M14 11v6" />
  </Icono>
);

export const IconoVer = (props) => (
  <Icono {...props}>
    <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
    <circle cx="12" cy="12" r="3" />
  </Icono>
);

export const IconoFiltro = (props) => (
  <Icono {...props}>
    <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
  </Icono>
);

export const IconoEvaluar = (props) => (
  <Icono {...props}>
    <rect x="8" y="2" width="8" height="4" rx="1" />
    <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
    <path d="m9 14 2 2 4-4" />
  </Icono>
);

export const IconoReloj = (props) => (
  <Icono {...props}>
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </Icono>
);

export const IconoProceso = (props) => (
  <Icono {...props}>
    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
  </Icono>
);

export const IconoCheck = (props) => (
  <Icono {...props}>
    <circle cx="12" cy="12" r="10" />
    <path d="m9 12 2 2 4-4" />
  </Icono>
);

export const IconoEquis = (props) => (
  <Icono {...props}>
    <circle cx="12" cy="12" r="10" />
    <path d="m15 9-6 6" />
    <path d="m9 9 6 6" />
  </Icono>
);

export const IconoResumen = (props) => (
  <Icono {...props}>
    <rect x="3" y="3" width="7" height="9" rx="1" />
    <rect x="14" y="3" width="7" height="5" rx="1" />
    <rect x="14" y="12" width="7" height="9" rx="1" />
    <rect x="3" y="16" width="7" height="5" rx="1" />
  </Icono>
);

export const IconoEquipo = (props) => (
  <Icono {...props}>
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </Icono>
);

export const IconoSolicitudes = (props) => (
  <Icono {...props}>
    <rect x="2" y="7" width="20" height="14" rx="2" />
    <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" />
  </Icono>
);

export const IconoCandidatos = (props) => (
  <Icono {...props}>
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" />
    <path d="M14 2v6h6" />
    <circle cx="12" cy="14" r="2" />
    <path d="M8.5 19a3.5 3.5 0 0 1 7 0" />
  </Icono>
);

export const IconoSalir = (props) => (
  <Icono {...props}>
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <path d="m16 17 5-5-5-5" />
    <path d="M21 12H9" />
  </Icono>
);

export const IconoMenu = (props) => (
  <Icono {...props}>
    <path d="M4 6h16" />
    <path d="M4 12h16" />
    <path d="M4 18h16" />
  </Icono>
);

export const IconoInvitar = (props) => (
  <Icono {...props}>
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M19 8v6" />
    <path d="M22 11h-6" />
  </Icono>
);

export const IconoUsuario = (props) => (
  <Icono {...props}>
    <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </Icono>
);

export const IconoAsistente = (props) => (
  <Icono {...props}>
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    <path d="M12 7v.01" />
    <path d="m9.5 10.5 1 1 1.5-2 1.5 2 1-1" />
  </Icono>
);

export const IconoCerrar = (props) => (
  <Icono {...props}>
    <path d="M18 6 6 18" />
    <path d="m6 6 12 12" />
  </Icono>
);
