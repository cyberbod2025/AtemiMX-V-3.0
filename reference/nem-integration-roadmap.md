# Roadmap AtemiMX – alineamiento NEM, SASE y Ángel Guardián

Este documento sintetiza las áreas faltantes que la aplicación debe cubrir para cumplir con los requerimientos de la Nueva Escuela Mexicana (NEM), la operación del Antídoto Burocrático (SASE-310), la protección de datos (Ángel Guardián) y la gamificación avanzada. Cada bloque contiene el estado actual, las brechas detectadas y tareas concretas de implementación.

## I. Módulo Curricular y Evaluación (El Cuaderno)

### Estado actual
- `src/dashboard/components/views/TeacherDashboardView.tsx` monta el Gradebook y el Planner como módulos principales, pero los datos se alimentan desde `src/dashboard/modules/gradebook/mockData.ts` mientras el `useGradebook` se apoya en `buildMockGradebook`.
- La integración con Firestore (colección `gradebooks`) existe, pero solo se usa cuando se proporciona el `teacherId`; en el resto del app se muestra en modo mock. Las pestañas “Calificaciones” y “Plano de asientos” aún no tienen lógica específica porque no apuntan a datasets curriculares.
- No existe un catálogo NEM completo; el contenido del gradebook no obliga a vincular columnas con campos formativos, contenidos o procesos de desarrollo (PDA).
- El almacenamiento de planes/proyectos se maneja mediante `services/storageService.ts` (localStorage), lo que permite dejar datos “sueltos”.

### Brechas clave
1. Catálogo NEM incompleto: solo hay ejemplos iniciales (Fases 2 y 6) y no se han cargado Fases 3‑5 ni todos los procesos por campo formativo.
2. Falta trazabilidad vertical: no hay validaciones ni flujos que obliguen a asociar columnas/rúbricas con su campo formativo/CDP/PDA.
3. Riesgo de datos sueltos: localStorage permite guardar planes sin vinculación con recursos NEM ni sincronización con Firestore.

### Tareas propuestas
- Crear un módulo `src/data/nemCatalog.ts` con la estructura completa de fases 1‑6 por campo formativo y PDA; proveer contenido serializado (JSON) y usarlo en `useGradebook`/`GradebookPanel`.
- Extender `GradebookTab` y `GradebookColumn` (y el modelo Firestore) para incluir campos secundarios: `campoFormativo`, `pdaId`, `descriptor`, `competencia`; implementar validaciones que impidan crear columnas sin esa metadata.
- Actualizar `GradebookPanel` para incluir filtros por campo formativo y botones de “vincular con PDA”; usar la información del catálogo para sugerir valores y anclar evidencias multimedia.
- Reemplazar los guardados en `storageService` por llamadas de persistencia a Firestore (colección `gradebooks` y/o una nueva `/nem-proyectos`). Diseñar pipelines de migración que limpien localStorage y reubiquen esos registros con referencias NEM.
- Diseñar un formulario de onboarding (podría evolucionar desde `IdeaIntro.tsx`) que pida al docente definir su campo formativo, PDAs y grupos antes de acceder al gradebook.

## II. Módulo Administrativo (SASE-310)

### Estado actual
- `modules/sase310/Sase310Module.tsx` ofrece login/autenticación y formularios para reportes, pero la UI queda en modo “chooser” aún si la data en `modules/sase310/firestoreService.ts` manipula la colección `reports`.
- `src/dashboard/App.tsx` y `MOCK_USERS` simulan roles (docente, orientador, prefectura, dirección). La importación real de plantillas docentes y dashboards por rol aún no existe.
- Hay scripts y servicios (en `modules/sase310/functions` y `firestoreService.ts`) preparados para cifrado, pero los pipelines de migración desde el SIIE (Google Sheets / Apps Script) no están documentados ni orquestados.

### Brechas clave
1. Conexión real a Firestore y sincronización de plantillas docentes.
2. Automatización para generar dashboards por rol y reportes estadísticos/censales (Formato 911).
3. Scripts/pipelines de migración desde la infraestructura administrativa vigente (SIIE Web/Forms).

### Tareas propuestas
- Ampliar `modules/sase310/firestoreService.ts` para incluir importadores y actualizadores de `/plantillas` y `/dashboards`, consumiendo datos reales (puede arrancar desde JSON exportado del SIIE). Añadir endpoints de Cloud Functions (ej: `importTeacherRoster`) para automatizar la ingesta inicial.
- Reemplazar `MOCK_USERS` en `src/dashboard/constants.ts` con usuarios sincronizados desde Firestore y un endpoint “dashboardSettings” que indique vistas por rol (`teacher-dashboard`, `guidance-inbox`, `prefecture-dashboard`, etc.).
- Crear un submódulo `modules/sase310/scripts/migrate-sii` (Node o Cloud Function) que:
  - Extraiga datos de Sheets/Forms/CSV provistos por la Dirección.
  - Normalice campos (CURP, plantel, rol) y escriba en `/usuarios`, `/alumnos`, `/reports`.
  - Genere Formato 911 y reportes censales en Firestore + exportación (CSV/JSON).
- Diseñar dashboards en `src/dashboard/components/views` que consuman datos Firestore reales (nuevos hooks `useReports`, `useIncidentAnalytics`) y los conecten al “Antídoto Burocrático”.

## III. Seguridad y Protección de Datos (Ángel Guardián)

### Estado actual
- `AngelGuardian.tsx` y `AngelGuardianModal.tsx` permiten grabar reportes con voz mediante Web Speech API; los datos se cifran con `services/encryptionService.ts` y se sincronizan con una Cloud Function (`GuardianReportsService`).
- Sin embargo, `useIncidents.ts` y `services/guardianReportsService.ts` aún dependen de funciones HTTP (Cloud Functions) y no están preparados para expiración local; el texto sugiere que están guardando en localStorage, pero la implementación actual ya hace fetch desde `functions`.
- No existen políticas que invaliden la persistencia local tras cerrar sesión ni controles para garantizar que cada reporte esté vinculado a un elemento curricular o administrativo validado.

### Brechas clave
1. Falta de expiración/cifrado local: si por alguna razón hay datos en localStorage, deben cifrarse y caducar con TTL.
2. No se fuerza la migración completa a Firestore cifrado por cuenta; todavía pueden quedar reportes sin sincronizar.
3. No hay integración con la trazabilidad NEM (los reportes no se vinculan a proyectos/tareas).

### Tareas propuestas
- Actualizar `services/storageService.ts` para que cualquier clave sensible (por ejemplo `atemi:guardian_reports`) se cifre mediante `encryptionService`, tenga TTL (timestamp + expiración configurable) y se limpie al cerrar sesión; documentar TTL en README.
- Asegurar que `saveGuardianReport` solo acceda a Cloud Functions y que cualquier fallback local active un workflow de “sincronización pendiente” con UI (botón “Cargar reporte pendiente”).
- En la ejecución del backend (`modules/sase310/functions`), reforzar la colección `/reports` con reglas Firestore (ya listadas en `firestore.rules`), y validar que cada documento contiene referencias `alumnoRef`, `campoCurricular`, `projectId`.
- Crear mecanismos de trazabilidad curricular en los reportes: un campo `curricularPayload` que referencia `gradebooks`/`projects`, para que cada incidente se ancle a una actividad NEM.

## IV. Gamificación (Insignias)

### Estado actual
- No existe componente `BadgeMaker` ni fórmula `BADGEMAKER()` en el código; la visión lo menciona, pero los componentes y servicios (en `src/` o `modules/`) aún no reflejan la lógica de insignias.
- No hay representación de habilidades blandas (liderazgo, empatía, colaboración) y la integración con el gradebook no está definida.

### Brechas clave
1. No se evalúan habilidades blandas ni se asocian a insignias.
2. No hay integración con gradebook o widgets para visualizar los badges.

### Tareas propuestas
- Diseñar un módulo `modules/badgemaker` que permita crear insignias con criterios (tipo, peso, descripción, habilidades blandas); almacenar las definiciones en Firestore (`/badges`) y permitir su asignación manual o automática desde el gradebook.
- Extender `GradebookColumn` para permitir un tipo `badge` y sumar sus puntos mediante una fórmula tipo `BADGEMAKER(): badges.reduce(...)`.
- Crear widgets en el dashboard que muestren “Perfil de Avance” (círculos de color) y “Logros socioemocionales” alimentados por las insignias; exponer API en `ui/AtemiDashboard` para visualizarlos.
- Preparar endpoints o scripts que puedan emitir reportes de reconocimiento (insignias por docente/institución) y exportarlos como parte del informe formativo.

## Conclusión y próximos pasos

1. Priorizar la conexión Firestore completa para el gradebook y SASE-310 (pasando de MOCK y localStorage a colecciones reales).
2. Completar el catálogo NEM y asegurar que cualquier columna, proyecto o reporte quede vinculado a campos formativos, PDA y competencias.
3. Fortalecer Ángel Guardián para que los reportes solo vivan cifrados en Firestore, con sincronización forzada y expiración local.
4. Definir e implementar la gamificación avanzada (Badge Maker + BADGEMAKER) y conectarla con el cuaderno y los widgets de logro.

¿Deseas que convierta estos pasos en tickets o comience con la implementación de alguno en particular?
