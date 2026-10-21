# AquaChile — Frontend MVP

## 1. Descripción general

Este proyecto es el frontend del MVP de reclutamiento y selección de AquaChile. Está desarrollado con React + Vite y se conecta a **Supabase** (PostgreSQL) para la gestión de candidatos. Las solicitudes y evaluaciones aún usan datos mock.

El objetivo principal es apoyar el proceso de gestión de postulantes, desde la creación de candidatos hasta la evaluación y seguimiento de solicitudes.

## 2. Estructura actual del proyecto

La estructura real del módulo frontend es la siguiente:

```text
frontend/
├── .babelrc                    # Configuración de Babel
├── .gitignore                 # Archivos ignorados por Git
├── README.md                  # Documentación del frontend
├── dist/                      # Build generado por Vite
├── .env                       # Credenciales de Supabase (no versionado)
├── docker-compose.yml          # PostgreSQL local opcional (usa docs/schema.sql)
├── docs/                      # Documentación técnica, esquema SQL e imágenes
│   ├── DOCUMENTO_COBERTURA_TESTING.md
│   ├── HOJA_DE_RUTA_Y_ESPECIFICACIONES_TECNICAS.md
│   ├── schema.sql
│   └── imagenes/
├── eslint.config.js           # Reglas de linting
├── index.html                 # Entrada principal del app
├── karma.conf.js              # Configuración de Karma + Jasmine
├── node_modules/              # Dependencias instaladas localmente
├── package-lock.json          # Lockfile de npm
├── package.json               # Scripts y dependencias del proyecto
├── postcss.config.js          # Configuración de PostCSS
├── public/                    # Assets públicos estáticos
├── src/
│   ├── App.jsx                # Definición de rutas y layout principal
│   ├── assets/                # Recursos visuales del frontend
│   ├── components/            # Componentes reutilizables de interfaz
│   │   ├── __tests__/
│   │   ├── Layout.jsx
│   │   └── LogoAquaChile.jsx
│   ├── context/               # Contextos de estado global (carpeta vacía por ahora)
│   ├── data/                  # Datos mock / simulados del proyecto
│   │   └── solicitudesMock.js
│   ├── index.css              # Estilos base globales
│   ├── main.jsx               # Punto de entrada de React
│   ├── pages/                 # Vistas principales
│   │   ├── Candidatos.jsx
│   │   ├── Dashboard.jsx
│   │   ├── DetalleEvaluacion.jsx
│   │   ├── DetalleSolicitud.jsx
│   │   ├── NuevaSolicitud.jsx
│   │   ├── NuevoCandidato.jsx
│   │   └── Solicitudes.jsx
│   ├── services/              # Integración con Supabase
│   │   ├── supabaseClient.js
│   │   └── candidatosService.js
│   ├── theme.js               # Paleta y tokens visuales del proyecto
│   └── utils/                 # Utilidades (carpeta vacía por ahora)
├── tailwind.config.js         # Configuración de Tailwind
└── vite.config.js             # Configuración de Vite
```

### Descripción de carpetas clave

- `docs/`: documentación técnica del proyecto, especificaciones funcionales y criterios de testing.
- `src/pages/`: pantallas principales del flujo de reclutamiento y selección.
- `src/components/`: componentes reutilizables y pruebas unitarias relacionadas.
- `src/data/`: datos mock de solicitudes (también usados en las pruebas).
- `src/services/`: cliente de Supabase y funciones `obtenerCandidatos` / `crearCandidato`.
- `src/App.jsx`: rutas principales del sistema.

### Rutas

`/` (Dashboard), `/candidatos`, `/candidatos/nuevo`, `/solicitudes`, `/solicitudes/nueva`, `/solicitudes/:id`, `/solicitudes/:id/evaluar`.

## 3. Integración con Supabase

Los candidatos se leen y crean en la tabla `candidatos` de Supabase (campos: `nombre_completo`, `rut`, `cargo`, `familia_cargo`, `email`, `telefono`, `created_at`). Las vistas Dashboard, Candidatos, Solicitudes y Nuevo Candidato consumen `candidatosService.js`.

Crea `frontend/.env` con tus credenciales (el archivo está en `.gitignore`):

```env
VITE_SUPABASE_URL=https://<tu-proyecto>.supabase.co
VITE_SUPABASE_ANON_KEY=<tu-anon-key>
```

> Nota: `docs/schema.sql` (usado por Docker) está desactualizado respecto a Supabase: no incluye `cargo`/`familia_cargo` en `candidatos` y usa `creado_en` en lugar de `created_at`.

## 4. Restricciones y validaciones del formulario de candidatos

El formulario de registro y edición de candidatos tiene las siguientes reglas funcionales:

### Campos obligatorios

- Nombre completo
- RUT
- Cargo a postular
- Familia de cargo
- Correo electrónico

### Reglas aplicadas

- El campo `Nombre Completo` es obligatorio.
- El `RUT` se formatea automáticamente en el patrón chileno `12.345.678-9` y acepta `K` como dígito verificador.
- El campo `Telefono` es opcional y se ingresa como texto libre.
- El campo `Correo Electrónico`:
  - es requerido,
  - se normaliza a minúsculas,
  - elimina espacios automáticamente,
  - bloquea la entrada de espacios con teclado,
  - debe cumplir un formato válido (ejemplo: `nombre@dominio.cl`).
- Si el correo es inválido, se muestra un mensaje de error y no se envía el formulario.
- Una vez registrado correctamente, el sistema muestra un mensaje de éxito y redirige a la vista de candidatos.

### Familia de cargo disponible

El selector incluye estas opciones:

- Operaciones
- Producción
- Calidad
- Mantenimiento

### Validación de edición

La edición de un candidato reutiliza la misma lógica de validación de correo, con restricción adicional de que no puede haber espacios en blanco en el email.

## 5. Guía de comandos

Ejecuta estos comandos desde la carpeta `frontend/`:

### Instalar dependencias

```bash
cd frontend
npm install
```

### Iniciar el proyecto en modo desarrollo

```bash
npm run dev
```

Esto levanta Vite y muestra la URL local donde se sirve la aplicación.

### Generar build de producción

```bash
npm run build
```

### Ejecutar lint

```bash
npm run lint
```

### Ejecutar pruebas unitarias

```bash
npm test
```

Esto ejecuta la configuración de Karma + Jasmine configurada en `karma.conf.js`.

### Vista previa del build

```bash
npm run preview
```

### Levantar PostgreSQL local con Docker (opcional, no usado por la app)

```bash
docker compose up -d
```

### Detener el entorno local

```bash
docker compose down
```

## 6. Pruebas y buenas prácticas

- Las pruebas unitarias son una capa de validación para prevenir regresiones.
- Se recomienda ejecutarlas antes de hacer commit o subir cambios.
- Si se altera un componente o un formulario, verificar también los casos de validación de email, formato de RUT y navegación entre rutas.

## 7. Tecnologías principales

- React 19
- Vite 8
- React Router
- ESLint
- Supabase (`@supabase/supabase-js`)
- Karma + Jasmine + Testing Library
- Tailwind CSS
- Docker Compose

## 8. Flujo de trabajo recomendado

```bash
cd frontend
npm install
npm run dev
```

Y antes de confirmar cambios:

```bash
npm test
npm run build
```

