# Documento de Cobertura de Testing - AquaChile MVP

## 1. Entorno de Pruebas Unitarias
* **Framework de Testing:** Jasmine
* **Test Runner:** Karma
* **Enfoque:** Pruebas unitarias sobre componentes y datos simulados (Mocks JSON).

## 2. Matriz de Cobertura (10 Pruebas Unitarias)

| # | Módulo / Componente | Caso de Prueba | Tipo / Mock |
|---|---|---|---|
| 1 | `DetalleEvaluacion` | Renderiza correctamente los datos del candidato | Mock Candidato |
| 2 | `DetalleEvaluacion` | Valida campos requeridos (fecha y observaciones) antes de guardar | Validación UI |
| 3 | `DetalleEvaluacion` | Muestra mensaje de éxito al completar el formulario | Simulación de Guardado |
| 4 | `DetalleEvaluacion` | Permite alternar estado entre 'En proceso' y 'Finalizada' | Estado UI |
| 5 | `Dashboard` | Carga y calcula métricas desde el mock de solicitudes | Mock Solicitudes |
| 6 | `Solicitudes` | Filtra solicitudes según estado ('Pendiente', 'En Proceso', 'Finalizada') | Filtro de Datos |
| 7 | `Solicitudes` | Muestra estado visual 'Apto' según evaluación asociada | Mock Evaluaciones |
| 8 | `Candidatos` | Renderiza el listado completo de candidatos sin errores | Mock Candidatos |
| 9 | `Navigation` | El botón 'Volver al listado' redirige a `/solicitudes` | Enrutamiento |
| 10 | `API/Service` | Maneja excepciones cuando el servicio de datos no responde | Simulación de Fallo |