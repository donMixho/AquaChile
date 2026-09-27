# Hoja de Ruta Tecnológica, Seguridad y Especificaciones de Arquitectura
**Proyecto:** Sistema de Gestión de Evaluaciones Psicolaborales (AquaChile MVP)  
**Módulo:** Documentación Técnica de Expansión y Arquitectura de Backend  
**Ubicación:** `/docs/HOJA_DE_RUTA_Y_ESPECIFICACIONES_TECNICAS.md`

---

## 1. Sistema de Control de Acceso Basado en Roles (RBAC) y Autenticación

Para garantizar la confidencialidad de las evaluaciones psicolaborales y cumplir con la normativa de protección de datos personales, el sistema implementa una arquitectura de seguridad por capas en el Backend.

### 1.1 Definición de Perfiles y Matriz de Permisos
El sistema distingue tres roles principales dentro del flujo de gestión de personas:

| Rol / Perfil | Descripción del Usuario | Permisos de Sistema |
| :--- | :--- | :--- |
| **Reclutador / Analista de Selección** | Encargado de levantar solicitudes de evaluación y cargar datos de candidatos. | - Crear, editar y listar Candidatos.<br>- Crear y asignar Solicitudes de Evaluación.<br>- Consultar el estado general del pipeline de selección.<br>- *Restricción:* No puede editar ni ver el detalle clínico de la informe psicolaboral. |
| **Psicólogo / Evaluador Psicolaboral** | Profesional interno o externo encargado de realizar la entrevista y aplicar test. | - Visualizar solicitudes asignadas a su perfil.<br>- Llenar formularios de evaluación psicolaboral.<br>- Adjuntar archivos/informes clínicos en PDF.<br>- Definir el dictamen final ("Apto", "No Apto", "Apto con Observaciones").<br>- *Restricción:* No puede modificar datos de la solicitud ni crear nuevos candidatos. |
| **Administrador / Jefatura de RRHH** | Dirección del área con acceso global para toma de decisiones y auditorías. | - Acceso total de lectura y escritura.<br>- Gestión de usuarios y asignación de roles.<br>- Descarga de reportes ejecutivos en Excel/PDF.<br>- Acceso a logs de auditoría del sistema. |

---

### 1.2 Mecanismo de Autenticación e Inicio de Sesión (Backend + Frontend)

Para conectar los permisos del Backend con la interfaz de React se especifica el siguiente estándar:

```
[ Usuario (Psicólogo / Reclutador) ]
│
▼
[ Iniciar sesión en React (Email / Pass) ] ────(Opción SSO)─── ► [ Google Workspace / Azure AD ]
│                                                                              │
▼ (POST /api/v1/auth/login)                                    ▼ (OAuth2 Token)
[ Spring Security + BCripta ] ◄─────────────────────────────────────────────┘
│
▼
[ Generación de JWT (Access Token + Refresh Token) ]
│
▼
[ React almacena JWT y adjunta Header: Authorization: Bearer <token> ]
```

1. **Autenticación Nativa (JWT - JSON Web Token):**
   - El backend en Spring Boot valida credenciales encriptadas con `BCryptPasswordEncoder`.
   - Si la autenticación es exitosa, emite un token **JWT firmado con clave asimétrica (RSA/HMAC)** conteniendo el ID del usuario, su email y su lista de roles/autoridades (`ROLE_RECLUTADOR`, `ROLE_PSICOLOGO`).
   - El token tiene una vigencia limitada (ej. 60 minutos) apoyado por un *Refresh Token* seguro almacenado en una cookie `HttpOnly` para evitar ataques XSS.

2. **Integración con Inicio de Sesión Corporativo (SSO / OAuth2):**
   - Dado que los reclutadores y psicólogos utilizan cuentas institucionales (Google Workspace o Microsoft 365/Azure AD), el backend integrará el módulo **`spring-boot-starter-oauth2-client`**.
   - Los usuarios podrán iniciar sesión presionando *"Iniciar Sesión con Google/Microsoft"*, delegando la autenticación al proveedor corporativo y conectando automáticamente sus permisos en la base de datos local mediante su correo institucional.

3. **Protección de Rutas y Endpoints:**
   - **Backend:** Uso de anotaciones `@PreAuthorize("hasRole('PSICOLOGO')")` en los controladores de Java para denegar acceso a nivel de API a quienes no posean el rol correspondiente.
   - **Frontend:** Implementación del componente `<ProtectedRoute allowedRoles={['ROLE_PSICOLOGO']} />` en React Router para restringir la renderización de vistas según el perfil logueado.

---

## 2. Ingesta de Datos, Integración con Excel y Formularios Externos

### 2.1 Módulo de Procesamiento Masivo de Excel (Apache POI)
Para permitir que el Reclutador cargue listas masivas de candidatos provenientes de planillas históricas o encuestas externas:

- **Procesamiento Asíncrono en Backend:** Subida de archivos `.xlsx` vía `MultipartFile` procesada con **Apache POI**.
- **Motor de Validaciones Previas a la Inserción:**
  - Validador de formato de RUT chileno (algoritmo Módulo 11).
  - Normalización de correos electrónicos y teléfonos.
  - Verificación de duplicados: Si el candidato ya existe en la base de datos, la API retorna una lista de advertencias sin detener la carga de las filas válidas.
- **Exportación de Informes Consolidados:** Generación dinámica de reportes en Excel con formatos de celda, estilos corporativos de AquaChile y gráficos integrados directamente desde Java.

### 2.2 Estrategia de Conexión con Formularios en Línea (Google/Microsoft Forms)
Si la empresa mantiene encuestas iniciales en plataformas como Microsoft Forms o Google Forms:
- **Webhook Listener:** Creación de un endpoint seguro `POST /api/v1/integrations/forms-webhook` que recibe la respuesta del formulario en formato JSON a través de herramientas de automatización (Power Automate o Zapier) e inserta automáticamente la solicitud en el sistema.

---

## 3. Prevención de Incompatibilidades, Codificación y Resiliencia de Datos

Para evitar errores comunes de corrupción de caracteres (tildes, letras "ñ", símbolos) y discrepancias entre plataformas (Windows/Linux/Docker):

### 3.1 Estándar Estricto de Codificación (UTF-8 Enforced)
- **Base de Datos (PostgreSQL):** Base de datos creada explícitamente con `ENCODING = 'UTF8' LC_COLLATE = 'es_CL.UTF-8'`.
- **Backend (Spring Boot):**
  - Configuración explícita en `application.yml`:
    ```yaml
    server:
      servlet:
        encoding:
          charset: UTF-8
          enabled: true
          force: true
    ```
- **Filtros HTTP:** Inyección de `CharacterEncodingFilter` para asegurar que todas las peticiones `JSON` procesadas acepten únicamente la codificación UTF-8.
- **Fechas y Tiempos (Estándar ISO-8601):** Comunicación de fechas entre React y Spring Boot usando el formato UTC estándar `YYYY-MM-DDTHH:mm:ss.SSSZ`. Manejo de zona horaria `America/Santiago` al renderizar en el cliente.

---

## 4. Estrategia de Auditoría de Seguridad e Integridad (CODEX Security / SonarQube)

Para realizar análisis estáticos de seguridad (SAST) y análisis dinámicos (DAST) sin generar impedimentos durante el desarrollo:

### 4.1 Fases de Auditoría de Código
1. **Fase Frontend (Estado Actual):**
   - Ejecución de linters sintácticos (`ESLint`) para mantener código limpio.
   - Auditorías de dependencias vulnerables mediante `npm audit`.
2. **Fase Backend Integrado (Spring Boot + DB):**
   - Momento en que se habilitará la extensión/herramienta **CODEX Security** y **SonarQube**.
   - **Alcance del Análisis:**
     - Detección de código duro o credenciales expuestas (*Hardcoded Secrets*).
     - Validación de inyecciones SQL (asegurando el uso exclusivo de `JPA Repositories` o consultas parametrizadas `JPQL`).
     - Verificación de políticas CORS para restringir peticiones HTTP exclusivamente desde el dominio oficial del Frontend.
     - Evaluación de vulnerabilidades OWASP Top 10.

### 4.2 Trazabilidad y Logs de Auditoría (Audit Trail)
Creación de la tabla `log_auditoria` en la base de datos para registrar la actividad del sistema de forma inalterable:

```
[ Evento en el Sistema ] ── ► [ Interceptor Spring AOP ] ── ► [ Inserción en Tabla LogAuditoria ]
```

- **Campos registrados:** ID de usuario, rol, tipo de acción (`CREAR_EVALUACION`, `DESCARGAR_INFORME`, `LOGIN_FALLIDO`), dirección IP, fecha/hora exacta y payload modificado.

---

## 5. Diseño del Modelo de Datos Relacional (Entidades Principales)

El Backend modelará la información mediante el framework JPA/Hibernate sobre las siguientes entidades relacionales claves:

```
+--------------------+  1:N  +-----------------------+
|      Usuario       | ----► |  SolicitudEvaluacion  |
|--------------------|       |-----------------------|
| - id (PK)          |       | - id (PK)             |
| - nombre           |       | - fecha_creacion      |
| - correo           |       | - estado              |
| - contrasena_hash  |       | - id_candidato (FK)   |
| - rol              |       | - id_reclutador (FK)  |
+--------------------+       | - id_psicologo (FK)   |
                             +-----------------------+
                                       | 1:1
                                       ▼
+--------------------+  1:N  +-----------------------+
|     Candidato      | ◄---- | EvaluacionPsicologica |
|--------------------|       |-----------------------|
| - id (PK)          |       | - id (PK)             |
| - rut              |       | - dictamen_final      |
| - nombre_completo  |       | - observaciones       |
| - correo           |       | - puntaje_tecnico     |
| - telefono         |       | - fecha_evaluacion    |
+--------------------+       +-----------------------+
```

---

## 6. Arquitectura de Despliegue y Orquestación (Docker Compose)

Para garantizar que el sistema corra de manera idéntica en cualquier equipo (desarrollo local, servidores de prueba de la universidad o infraestructura cloud de AquaChile), se define la siguiente orquestación de contenedores mediante `docker-compose.yml`:

- **Servicio 1: `aquachile-db`**
  - Motor: PostgreSQL 16
  - Puertos: `5432:5432`
  - Volumen de datos persistente para evitar pérdida de información al reiniciar el contenedor.

- **Servicio 2: `aquachile-backend`**
  - Entorno: Java 21 / Spring Boot 3.x
  - Puertos: `8080:8080`
  - Dependencia: Espera a que `aquachile-db` esté completamente inicializado (`depends_on`).

- **Servicio 3: `aquachile-frontend`**
  - Servidor web de producción: Nginx sirviendo el build optimizado de React.
  - Puertos: `80:80`
