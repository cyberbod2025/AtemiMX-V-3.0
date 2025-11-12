# Esquema del catálogo curricular NEM

Este esquema define las entidades y campos que debe exponer el catálogo NEM antes de generar el JSON y el hook `useNemCatalog`. No incluye ejemplos concretos; sirve como contrato para la estructura que deberá importar Gradebook, Plano de asientos, Planner y otras herramientas formativas.

## Entidades principales

### 1. Fase
- Identificador: `faseId` (cadena, p.e. `"fase-3"`)
- Nombre descriptivo: `nombre` (string)
- Descripción: `descripcion` (string)
- Orden cronológico: `orden` (número)
- Campos formativos asociados: `camposFormativos` (array de referencias a la entidad CampoFormativo)

### 2. Campo formativo
- Identificador único: `campoId`
- Nombre (ej. “Saberes y pensamiento científico”)
- Descripción general: `descripcion`
- Fase padre: referencia a `faseId`
- Procesos de Desarrollo de Aprendizaje (PDA): `pdas` (array)

### 3. PDA (Proceso de Desarrollo de Aprendizaje)
- Identificador: `pdaId`
- Nombre del proceso: `nombre`
- Descripción de su propósito formativo: `descripcion`
- Descriptor operativo: `descriptor`
- Competencias específicas implicadas: `competencias` (array de strings)
- Evidencias sugeridas: `evidencias` (array de strings como “evidencia fotográfica”, “grabación de audio”, etc.)
- Indicadores de logro sugeridos: `indicadores` (array)
- Recursos vinculados: `recursos` (array libre para URL, documento, mol)
- Prioridad/orden dentro del campo formativo: `orden`

## Relación con el gradebook y otros módulos
- Cada `GradebookColumn` debe incluir estas propiedades:
  * `campoFormativo`: `campoId`
  * `pdaId`
  * `descriptor`: tomada del PDA
  * `competencias`: array heredado del PDA
  * `tipo`: (`numeric`|`text`|`icon`|`badge`)
  * `evidenciasRequeridas`: (boolean) indica si se exige registrar foto/audio/video
  * `peso`: decimal para cálculo de promedio
  * `badgeId` (opcional) para integrar gamificación
- El `Plano de asientos` consume la misma metadata para mostrar indicadores de PDA junto a cada alumno y activar observaciones rápidas.
- Los proyectos/planes deben almacenar referencias a `campoFormativo` y `pdaId` antes de permitirse guardar.
- El hook `useNemCatalog` expone:
  * `getFases()`: lista ordenada
  * `getCamposPorFase(faseId)`
  * `getPdasPorCampo(campoId)`
  * `findPda(pdaId)`
  * `searchIndicadores({ faseId?, campoId?, palabraClave? })`
  * `formatDescriptor(pdaId)`

## Consideraciones adicionales
- El esquema debe permitir incluir descriptores en múltiples niveles (p.e. descripción general + evidencias).
- Las relaciones se pueden almacenar en un JSON plano si se prefieren referencias por ID, pero debe existir una forma rápida de recuperar todos los PDAs de una fase y de un campo.
- El `NemViewer.tsx` y cualquier otra UI que muestre el catálogo deben usar el hook anterior para evitar duplicación y alimentar los dropdowns sin hardcodear fases o campos.
