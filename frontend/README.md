# AquaChile — MVP Frontend

## 1. Título y Descripción

**Proyecto MVP Frontend (Reclutamiento y Selección)** desarrollado con React y Vite, con pruebas automatizadas usando Jasmine y Karma. El MVP presenta una interfaz para apoyar los procesos de reclutamiento, selección y evaluación psicolaboral.

## 2. Estructura del Proyecto

Las carpetas principales del frontend se organizan así:

```text
frontend/
├── docs/                         # Documentación técnica, infraestructura y ERS
├── src/
│   ├── components/               # Componentes reutilizables de la interfaz (UI)
│   │   └── __tests__/            # Pruebas unitarias de los componentes
│   ├── data/                     # Datos simulados para el MVP
│   └── pages/                    # Vistas principales de la aplicación
├── docker-compose.yml            # Configuración de la base de datos local
├── karma.conf.js                 # Configuración de Jasmine y Karma
└── package.json                  # Dependencias y comandos del frontend
```

- **`docs/`** reúne documentación técnica del proyecto, especificaciones (ERS) e información de infraestructura, incluido el esquema de la base de datos.
- **`src/components/`** contiene los componentes reutilizables de la UI.
- **`src/data/`** contiene los datos simulados del MVP, como `solicitudesMock.js`, que exporta registros en formato de objetos JavaScript.
- **`src/components/__tests__/`** contiene las pruebas automatizadas de componentes.

## 3. ¿Qué son las Pruebas Unitarias y qué aportan?

Las pruebas unitarias son chequeos automáticos que verifican que cada pieza del software funcione bien por separado.

Aportan seguridad: si modificamos el código, las pruebas nos avisan si rompimos algo sin querer. **No es necesario ejecutarlas todo el tiempo mientras se programa**, pero **sí es obligatorio ejecutarlas antes de hacer un `git commit` o subir cambios al repositorio principal**, para revisar la calidad de los cambios.

## 4. Guía de Comandos (Terminal)

Abre Git Bash en la raíz del repositorio y entra a la carpeta del frontend. Los comandos de npm deben ejecutarse desde `frontend/`, donde están su `package.json` y sus dependencias:

```bash
cd frontend
```

Instalar las dependencias base del frontend:

```bash
npm install
```

Configurar el entorno de pruebas con Webpack y Babel:

```bash
npm install --save-dev karma-webpack webpack babel-loader --legacy-peer-deps
npm install --save-dev ajv@^8.0.0 ajv-keywords@^5.0.0 --legacy-peer-deps
```

Instalar las herramientas de Testing Library para montar e interactuar con componentes React en el DOM:

```bash
npm install --save-dev @testing-library/react @testing-library/dom @testing-library/user-event
```

Ejecutar las pruebas unitarias con Jasmine y Karma:

```bash
npm test
```

Levantar la base de datos local PostgreSQL con Docker Compose:

```bash
docker compose up -d
```

Iniciar Vite y abrir el proyecto en el navegador usando la URL que muestra la terminal:

```bash
npm run dev
```
