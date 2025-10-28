GEMINI.md – Contexto oficial AtemiMX / SASE-310
📘 Proyecto

AtemiMX-V-3.0
Sistema modular docente con arquitectura React + Firebase (Auth, Firestore, Hosting).
Primer módulo activo: SASE-310 (Sistema de Acompañamiento y Seguimiento Escolar).

🧱 Estructura base

Frontend: React 19 + Vite + Tailwind

Backend: Firebase Functions + Firestore + Auth

Estilo: Inter / Poppins, paleta NEM

Seguridad: Modelo S-SDLC (Secure Software Development Life Cycle)

Entorno local: http://localhost:5173/

Hosting previo (v3.0): https://atemi-sase310.web.app

⚙️ Estado actual

Auth 1.0 operativo con registro abierto.

Firestore CRUD funcional con validación Zod.

Test suite (Vitest) aprobado.

Versión 3.5 en planeación con Auth 2.0 – Acceso Docente Controlado.

🧠 Protocolo de desarrollo (aprobado)

Nueva etapa obligatoria: Revisión de Código (Code Review S-SDLC)

Flujo:

El programador desarrolla una función o módulo.

Antes de marcarlo como “listo”, envía el código para revisión (Cloud Functions, reglas Firestore, etc.).

El desarrollador principal revisa seguridad, lógica y cumplimiento S-SDLC.

El programador aplica correcciones.

Hugo emite informe de avance (v4.0, v5.0…).

El desarrollador otorga VoBo técnico previo a cualquier despliegue.

Rol de Gemini Code Assist:

Gemini puede actuar como asistente de revisión técnica durante la codificación (extensión VS Code).
Comandos útiles:

/fix → corregir errores

/simplify → refactorizar

/doc → documentar funciones

🔒 Auth 2.0 – Especificación técnica

Objetivo: Restringir el acceso al panel docente solo a usuarios autorizados.

Modelo Firestore:
users/{uid}:
  email: string
  rol: 'docente' | 'prefectura' | 'orientacion' | 'direccion'
  autorizado: boolean
  fechaRegistro: timestamp
  autorizadoPor: string | null

Flujo:

Registro limitado a dominio institucional (@institucion.mx).

Nuevo usuario → autorizado: false.

Acceso bloqueado hasta aprobación manual.

Panel de administración ligero (React) para autorización.

Reglas Firestore controlan lectura/escritura según rol y estado autorizado.

✅ VoBo del Desarrollador Principal

He recibido el Aviso de Actualización de Protocolo – AtemiMX / SASE-310.
Otorgo mi VoBo de aceptación al nuevo flujo de trabajo.
Confirmo la conformidad con el proceso de revisión de código y autorizo formalmente que se proceda con el diseño técnico e integración de Auth 2.0 – Acceso Docente Controlado.

Quedo a la espera del primer envío de código (Cloud Functions y firestore.rules) para iniciar la revisión conforme al nuevo protocolo.

🧩 Instrucciones para agentes

Respetar el flujo S-SDLC (toda orden de Codex requiere VoBo previo).

Mantener consistencia con las reglas Auth 2.0 y la estructura modular del proyecto.

Priorizar la seguridad sobre la velocidad de despliegue.

Todas las salidas deben ser seguras, trazables y documentadas.