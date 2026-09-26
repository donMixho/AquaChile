# Sistema Web para la Gestión de Evaluaciones Psicolaborales - AquaChile

## Descripción del proyecto
MVP Full Stack desarrollado para la asignatura Desarrollo Full Stack II. El sistema digitaliza y centraliza la información básica del proceso de evaluación psicolaboral del área de Reclutamiento y Selección de AquaChile.

## Contexto del problema
Actualmente, el proceso se administra mediante múltiples herramientas fragmentadas (Forms, Excel, Planner, correos), lo que genera trabajo manual repetitivo y falta de centralización de la información.

## Estructura del Proyecto
```text
AquaChile/
├── frontend/               # Aplicación React con Vite y Tailwind CSS
│   ├── src/
│   │   ├── components/     # Componentes reutilizables (Layout, etc.)
│   │   ├── pages/          # Vistas (Dashboard, Candidatos, Solicitudes, etc.)
│   │   ├── context/        # Manejo de estados globales
│   │   ├── services/       # Conexión futura a la API backend
│   │   └── utils/          # Funciones genéricas de apoyo
│   └── ...
├── backend/                # (Pendiente de inicializar) Lógica de negocio y API REST
└── docs/                   # Documentación adicional del proyecto
    ├── informe/            # Informes académicos de la asignatura
    ├── documentacion/      # Anexos, requerimientos y manuales
    ├── imagenes/           # Capturas de pantalla y diagramas
    └── otros/              # Material complementario entregado por AquaChile
