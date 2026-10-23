# Documento de Cobertura de Testing - AquaChile MVP

## 1. Entorno de pruebas

| Elemento | Herramienta |
|---|---|
| Framework de pruebas | Jasmine (`jasmine-core`) |
| Test runner | Karma (`karma`, `karma-jasmine`, `karma-chrome-launcher`) en Chrome Headless |
| Empaquetado de los specs | `karma-webpack` + `babel-loader` (preset-env y preset-react) |
| Manipulación del DOM | React Testing Library (`render`, `screen`, `fireEvent`, `waitFor`) |
| Cobertura de código | `karma-coverage` + `babel-plugin-istanbul` |
| Reporte | `karma-spec-reporter` (consola) y `coverage/html/index.html` |

Configuración: [karma.conf.js](../karma.conf.js). Los specs se ubican junto al código en carpetas `__tests__`.

### Comandos

```bash
npm test                         # ejecuta todas las pruebas y genera la cobertura
# abrir coverage/html/index.html para ver el detalle por archivo
```

## 2. Estrategia de mocks

- **Servicio de datos (Supabase):** `karma.conf.js` reemplaza (alias de webpack) `services/supabaseClient.js` por
  `src/test/supabaseClientStub.js`. Cada prueba espía `supabase.from(...)` con `spyOn` y devuelve datos de
  prueba (`candidatosFixture`) o un error. Así se prueban las páginas **reales** y el servicio **real** sin red.
- **Enrutamiento:** `MemoryRouter` (helper `renderConRouter`) y un indicador de ruta para comprobar redirecciones.
- **Espías Jasmine:** `spyOn`, `jasmine.createSpy` y `expectAsync` para el servicio y para silenciar `console.log`.

## 3. Matriz de cobertura (36 pruebas unitarias)

| # | Componente / módulo | Caso de prueba | Mock / técnica |
|---|---|---|---|
| 1 | `Dashboard` | Renderiza el título del panel | Servicio simulado |
| 2 | `Dashboard` | Muestra "..." en el total mientras carga | Promesa simulada |
| 3 | `Dashboard` | Calcula total y métricas por familia | `candidatosFixture` |
| 4 | `Dashboard` | No muestra tabla de candidatos (solo métricas) | DOM |
| 5 | `Dashboard` | Muestra error si el servicio falla | Simulación de fallo |
| 6 | `Dashboard` / `MetricCard` | Tarjeta enlaza a `/solicitudes` | Router en memoria |
| 7 | `Solicitudes` | Una fila por candidato | `candidatosFixture` |
| 8 | `Solicitudes` | Filtra por familia de cargo | Evento `change` |
| 9 | `Solicitudes` | Filtra por fecha y "Limpiar" restablece | Eventos `change`/`click` |
| 10 | `Solicitudes` | Mensaje si ningún candidato coincide | Filtro de fecha |
| 11 | `Solicitudes` | "Nueva Solicitud" navega a `/solicitudes/nueva` | Router en memoria |
| 12 | `Solicitudes` | Error al fallar la carga | Simulación de fallo |
| 13 | `DetalleEvaluacion` | Renderiza datos del candidato y formulario | DOM |
| 14 | `DetalleEvaluacion` | Valida fecha y observaciones requeridas | Validación UI |
| 15 | `DetalleEvaluacion` | Rechaza observaciones solo con espacios | Caso borde |
| 16 | `DetalleEvaluacion` | Mensaje de éxito al guardar | Estado del componente |
| 17 | `DetalleEvaluacion` | Alterna estado "En proceso" / "Finalizada" | Estado UI |
| 18 | `DetalleEvaluacion` | "Volver al listado" redirige a `/solicitudes` | Router en memoria |
| 19 | `Candidatos` | Renderiza el listado completo | `candidatosFixture` |
| 20 | `Candidatos` | Enlace "Ver CV" solo si hay `cv_url` | Renderizado condicional |
| 21 | `Candidatos` | Error si el servicio no responde | Simulación de fallo |
| 22 | `Layout` | Navegación principal y contenido de la ruta | Router en memoria |
| 23 | `Layout` | Marca el enlace activo (`aria-current`) | Router en memoria |
| 24 | `Layout` | Menú hamburguesa abre/cierra (responsivo) | Estado UI |
| 25 | `Layout` | Elegir un enlace móvil cierra el menú | Navegación |
| 26 | `MetricCard` | Muestra título, valor y enlace por props | Props |
| 27 | `MetricCard` | Omite el detalle si no se entrega | Props opcionales |
| 28 | `Alerta` | `role="alert"` (error) / `role="status"` (éxito) | Props / rerender |
| 29 | `candidatosService` | `obtenerCandidatos` devuelve los datos | `spyOn(supabase, 'from')` |
| 30 | `candidatosService` | `obtenerCandidatos` lanza el error del servicio | `expectAsync` |
| 31 | `candidatosService` | `crearCandidato` mapea campos a columnas | `jasmine.createSpy` |
| 32 | `candidatosService` | Elimina el CV subido si falla el insert | Mock de storage |
| 33 | `Candidatos` | Rechaza correo con formato inválido | Validación UI |
| 34 | `Candidatos` | El campo de correo elimina espacios | Evento `change` |
| 35 | `Candidatos` | Guarda edición válida y notifica | Estado del componente |
| 36 | `Candidatos` | "Cancelar" cierra el modal | Evento `click` |

## 4. Resultados y análisis (última ejecución)

- **Pruebas:** 36 de 36 exitosas.
- **Cobertura global del código ejecutado por las pruebas:**

| Métrica | Resultado |
|---|---|
| Sentencias | 90,00 % |
| Ramas | 66,97 % |
| Funciones | 82,85 % |
| Líneas | 90,90 % |

- **Alcance cubierto:** `Layout`, `MetricCard`, `Alerta`, `Dashboard`, `Solicitudes`, `Candidatos`, `DetalleEvaluacion`
  y `candidatosService`.
- **Fuera del alcance actual (pendiente):** `NuevoCandidato`, `NuevaSolicitud`, `DetalleSolicitud` y `LogoAquaChile`
  (no tienen pruebas aún, por lo que no aparecen en el reporte de cobertura). Las ramas son la métrica más baja
  porque muchas condiciones de estilo y de campos alternativos (`nombre_completo ?? nombre`) no se ejercitan.
