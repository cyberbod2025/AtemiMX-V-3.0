# Curricular NEM avanzado – ruta prioritaria

Este archivo describe los pasos accionables para convertir el prototipo del cuaderno en el módulo curricular completo, siguiendo el orden que solicitaste: catálogo NEM completo, lógica en “Calificaciones/Plano de asientos”, y migración de la planificación a Firestore con trazabilidad.

## 1. Completar el catálogo curricular NEM

- **Estado actual:** `NemViewer.tsx` (y los datos que provee) solo contienen ejemplos puntuales de Fase 2 y Fase 6; no hay fuentes para Fases 3, 4 y 5 ni para cada campo formativo y PDA.
- **Tareas inmediatas**
  1. Diseñar un JSON estructurado (`src/data/nem-catalog.json` o similar) que documente todas las fases (1‑6), campos formativos, contenidos clave y los procesos de desarrollo de aprendizaje (PDA) asociados.
  2. Crear un hook `useNemCatalog` que exponga filtros por fase/campo y que sirva como fuente para los formularios del gradebook y el plano de asientos.
  3. Actualizar `NemViewer.tsx` y cualquier otro componente que renderice el catálogo para apoyarse en este archivo (ya sea via `NemCatalogContext` o `useNemCatalog`), de modo que el filtro “Procesos de Desarrollo de Aprendizaje” incluya fases 3‑5 y sus descriptores.

## 2. Implementar la lógica NEM en “Calificaciones” y “Plano de Asientos”

- **Estado actual:** Las pestañas “Calificaciones” y “Plano de asientos” son placeholders en `Modules.tsx`, `Dashboard.tsx` y `DossierExporter.tsx`, y el gradebook solo muestra columnas/tabs sin metadata NEM.
- **Tareas inmediatas**
  1. Extender el modelo `gradebooks` (`src/dashboard/modules/gradebook/types.ts`, `GradebookModel`) para que cada `GradebookColumn` incluya: `campoFormativo`, `pdaId`, `descriptor` y `competencia`. La UI debe mostrar esta metadata.
  2. Crear controles dentro de `GradebookPanel.tsx` para invocar `useNemCatalog` y vincular columnas/pestañas con los elementos curriculares: dropdowns de fase/campo/pda, pulsadores “anclar descriptor”, y visualización de evidencia (foto/audio/video).
  3. Diseñar el `Plano de asientos` como una vista que consuma la misma metadata: cada alumno en el plano debe mostrar columnas activas, indicadores de logro por PDA y un mini chat de observaciones rápidas (quizás en `src/dashboard/components/views/TeacherDashboardView.tsx` o un nuevo panel).
  4. Asegurar que `DossierExporter.tsx` y otros exportadores incluyan la metadata curricular (campo/pda) en los PDFs/exports.

## 3. Forzar trazabilidad y persistencia en Firestore

- **Estado actual:** `storageService.ts` mantiene datos locales (perfiles, planes, proyectos) bajo la clave `atemi:*`, y `useGradebook` guarda modelos en Firestore solo si el docente tiene `teacherId`. La planeación docente vive en localStorage.
- **Tareas inmediatas**
  1. Identificar la lista de claves `atemi:*` usadas por los módulos de planeación (revisar `Dashboard.tsx`, `Modules.tsx`, `DossierExporter.tsx`, `PlannerPanel.tsx` y `services/storageService.ts`).
  2. Migrar esos datos a colecciones Firestore con estructura normalizada: por ejemplo, `/gradebooks/{teacherId}`, `/proyectos/{teacherId}/{projectId}`, `/planner/{teacherId}`. Cada documento debe incluir referencias NEM (`pdaId`, `campoFormativo`).
  3. Actualizar `storageService.ts` para que polite localStorage solo para configuraciones temporales, pero que `saveData`/`loadData` devuelvan a Firestore. Usar `services/firebase.ts` y `gradebookService.ts`.
  4. Agregar validaciones (por ejemplo, en `PlannerPanel` y `Modules`): no permitir guardar un proyecto si no tiene `campoFormativo` ni `pdaId`. Mostrar errores y un workflow de “vincular recurso NEM”.
  5. Crear un script `scripts/migrate-local-to-firestore.ts` que lea las claves `atemi:*` desde localStorage (o un archivo de dump) y los reimporte en Firestore, asegurando que los registros referencien el catálogo NEM completado en el paso 1.

## Orden de trabajo propuesto

1. Comenzar con el catálogo NEM (paso 1) porque sirve de base para los dropdowns y validaciones del gradebook y el plano de asientos.
2. Implementar el modelo extendido del gradebook y el plano de asientos (paso 2), utilizando el catálogo para obligar la trazabilidad.
3. Finalizar la migración de datos y las validaciones de persistencia (paso 3), eliminando la dependencia de localStorage y asegurando que todos los elementos estén en Firestore.

¿Quieres que convierta cada sub-paso en tickets independientes o prefieres que empiece por escribir los schemas y los mockups necesarios para el catálogo y el gradebook? Estoy listo para generar los archivos base (JSON/schema/components) y ayudarte a aplicar las validaciones en el código existente.
