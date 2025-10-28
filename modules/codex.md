CODEX.md — Context técnico para GitHub Copilot / Codex
Proyecto: AtemiMX-V-3.0
Módulo activo: SASE-310 (Sistema de Acompañamiento y Seguimiento Escolar)
Autor: Profe Hugo Sánchez Reséndiz
🧠 Objetivo

Establecer las reglas de contexto, seguridad y flujo de trabajo para que Codex:

Genere código, configuraciones y documentación alineados con el protocolo S-SDLC AtemiMX.

Respete los roles, permisos y estándares del sistema institucional.

Coordine acciones con Gemini Code Assist cuando corresponda.

🧩 Estructura del proyecto

Frontend: React 19 + Vite + Tailwind

Backend: Firebase (Auth, Firestore, Functions, Hosting)

Lenguaje principal: TypeScript

Estilo: Inter / Poppins, dark theme NEM

Ruta base: C:\Users\HugoSYSTEM\Desktop\AtemiMX-V-3.0

🔐 Protocolo S-SDLC AtemiMX
Fases del ciclo:

Diseño técnico: se plantea la solución o cambio.

Autorización: el desarrollador principal emite VoBo.

Codificación: Codex genera el código.

Revisión: Gemini revisa la seguridad, eficiencia y compatibilidad.

Validación: se aplican pruebas y revisión de Hugo.

Despliegue: autorización final y subida a Firebase Hosting.

Nota: Codex nunca debe ejecutar acciones (commit, push, deploy) sin el VoBo previo.

🔒 Reglas de seguridad

Nada de datos duros (API keys, tokens, correos personales) en el código.

Las variables deben ir en .env.local bajo el prefijo VITE_FIREBASE_.

Todo acceso a Firestore o Auth debe estar protegido por roles y validaciones previas.

Prohibido exponer información sensible en logs o mensajes de error.

La función principal de Codex es asistir, no automatizar despliegues.

🧮 Roles del sistema
Rol	Permisos
docente	Crear y leer sus propios reportes
prefectura	Registrar asistencias y retardos
orientación	Leer y actualizar reportes
dirección	Revisar y eliminar reportes
admin	Autorizar usuarios y configurar sistema
🧱 Auth 2.0 – Acceso Docente Controlado

Estructura Firestore:

users/{uid} {
  email: string
  rol: 'docente' | 'prefectura' | 'orientacion' | 'direccion'
  autorizado: boolean
  fechaRegistro: timestamp
  autorizadoPor: string | null
}


Flujo esperado:

Registro limitado a dominio institucional (@institucion.mx).

Usuario nuevo → autorizado:false.

Acceso bloqueado hasta aprobación del admin.

Panel React para autorizar usuarios.

Reglas Firestore controlan todo acceso.

🧰 Guía de trabajo para Codex
Al generar código:

Explicar siempre el propósito de la función antes del bloque.

Incluir comentarios de seguridad (// seguridad: valida rol antes de...).

Usar imports modulares de Firebase (import { getAuth } from 'firebase/auth').

Toda función debe ser idempotente y segura.

Preferir hooks y servicios separados antes que lógica directa en componentes.

Al responder instrucciones:

Si no hay VoBo del desarrollador → responde con:

“⚠️ Se requiere VoBo técnico antes de ejecutar esta orden.”

Si hay VoBo confirmado → procede con:

“Me tomé la libertad de generar…” seguido del código.

Convenciones:

Nombres de archivo: camelCase para scripts, PascalCase para componentes.

Test unitarios con Vitest, siguiendo esquema __tests__/*.test.ts.

Reglas Firestore en modules/sase310/firestore.rules.

🧩 Integración con Gemini

Gemini puede revisar el código generado por Codex.
Codex debe incluir en los commits un comentario tipo:

Revisión pendiente: Gemini Code Assist – seguridad y rendimiento


para asegurar trazabilidad dentro del flujo S-SDLC.

✅ Autorización vigente

Por disposición oficial del Desarrollador Principal, Codex queda autorizado para participar en la generación del código de Auth 2.0 – Acceso Docente Controlado, siempre bajo el esquema de revisión y VoBo técnico previo.