# AtemiMX Toolkit

Herramienta educativa para docentes de secundaria que mezcla planeación NEM, actividades STEAM y seguimiento socioemocional.

## Requisitos
- Node.js 20
- npm 10 (Corepack queda deshabilitado en redes con proxy)

## Configuración rápida
1. Instala dependencias: `npm install`
2. Copia `.env.example` a `.env.local` y agrega `VITE_GEMINI_API_KEY`
3. Inicia el entorno docente: `npm run dev`

## Pruebas y calidad
- Ejecuta pruebas con datos seguros: `npm test`
- Modo interactivo: `npm run test:watch`
- Revisión estática: `npm run lint`

Las pruebas cargan variables desde `.env.test` mediante `scripts/run-with-env.mjs`.

## Gemini sin SDK bloqueado
- Eliminamos la dependencia `@google/genai` para esquivar el error 403 en escuelas.
- El servicio `services/genaiClient.ts` hace la petición REST directa y acepta `fetch` simulado en pruebas.
- Si recuperas el acceso a pnpm/Corepack, vuelve a instalar el SDK oficial y ajusta el cliente según tus necesidades.

## Checklist rápido en Codex
1. `node -v` → v20.x
2. `npm -v` → v10.x
3. `npm install` sin errores
4. `npm test` → 19/19 casos verdes
