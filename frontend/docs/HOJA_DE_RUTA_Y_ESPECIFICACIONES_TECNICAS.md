# Hoja de Ruta Tecnológica, Seguridad y Especificaciones de Arquitectura
**Proyecto:** Sistema de Gestión de Evaluaciones Psicolaborales (AquaChile MVP)  
**Módulo:** Documentación Técnica de Expansión y Arquitectura de Backend  
**Ubicación:** `/docs/HOJA_DE_RUTA_Y_ESPECIFICACIONES_TECNICAS.md`

---

## 1. Sistema de Control de Acceso Basado en Roles (RBAC) y Autenticación

Para garantizar la confidencialidad de las evaluaciones psicolaborales y cumplir con la normativa de protección de datos personales, el sistema implementa una arquitectura de seguridad por capas en el Backend.

### 1.1 Estado real: perfiles y matriz de permisos (implementado)
El sistema corre sobre **Supabase** (Auth + Postgres + RLS), no sobre Spring Boot. Los roles vigentes son tres y viven en `src/context/permisos.js` (fuente única):

| Rol | Puede | No puede |
| :--- | :--- | :--- |
| **Reclutador** | Crear y editar candidatos, crear solicitudes, evaluar. | Eliminar, configurar, decidir aptos. |
| **Operaciones** | Ver solicitudes y candidatos; decidir sobre los aptos. | Crear, editar, evaluar, eliminar. |
| **Administrador** | Supervisar, asignar casos, gestionar equipo y accesos, eliminar, **ver el registro de auditoría**. | Trabajo operativo (registrar, evaluar, decidir aptos) desde la interfaz. |

Defensa por capas:
- **Interfaz:** `<ProtectedRoute permiso=... />` y `usePuede()` ocultan rutas y botones.
- **Base de datos:** políticas RLS (`docs/politicas_rls_candidatos.sql`, `docs/migracion_perfiles.sql`) leen el rol desde `app_metadata` (solo escribible por el backend) y rechazan a usuarios con perfil `inactivo`.
- **Privilegios:** invitar, cambiar rol y bloquear cuentas solo pasa por la Edge Function `admin-usuarios` (clave `service_role` fuera del navegador).

### 1.2 Autenticación (implementado con Supabase Auth)
Email y contraseña vía Supabase Auth (hash y JWT los gestiona Supabase; el token vive en el cliente y expira). El diseño original con Spring Security + JWT propio, SSO Google/Azure y `@PreAuthorize` queda como **hoja de ruta** si se migra a un backend propio.

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

## 4. Estrategia de Auditoría de Seguridad e Integridad

### 4.1 Auditoría de código
**Frontend (aplicado):**
- `npm run lint` (ESLint) sin errores.
- `npm audit` / `npm audit fix` ejecutado: se corrigieron las vulnerabilidades altas (vite, zod, source-map-js). Quedan 8 de severidad moderada, solo en herramientas de desarrollo (eslint, karma-webpack); `npm audit fix --force` las arreglaría pero con cambios incompatibles, por lo que se difieren.
- Revisión de secretos: no hay credenciales en el código. `.env` está en `.gitignore` y solo contiene la clave pública `anon` (la `service_role` solo existe en la Edge Function). El `docker-compose.yml` contiene una contraseña de desarrollo local: cambiarla antes de cualquier despliegue.
- Inyección SQL: el cliente usa solo el API parametrizado de Supabase (sin SQL armado a mano).

**Pendiente (si se crea backend propio):** SonarQube / CODEX Security, política CORS restringida al dominio del frontend y revisión OWASP Top 10.

### 4.2 Trazabilidad y logs de auditoría (implementado)
`docs/migracion_auditoria.sql` crea la tabla `log_auditoria` y triggers sobre `candidatos`, `solicitudes`, `evaluaciones` y `perfiles`:

- **Campos:** usuario, email, rol, acción (`CREAR`/`ACTUALIZAR`/`ELIMINAR`), tabla, id del registro, datos antes y después, fecha/hora.
- **Inalterable:** sin permisos de escritura desde la app; solo se inserta desde el trigger.
- **Acceso:** solo un administrador activo puede leerlo (pantalla **Auditoría**, `/auditoria`). La pantalla muestra qué campos cambiaron, no sus valores.
- No incluye aún `LOGIN_FALLIDO` ni `DESCARGAR_INFORME` (requieren eventos de Auth y de descarga).

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
