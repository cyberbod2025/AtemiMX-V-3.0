# 🧩 SASE-310 – Documento de Integración de Módulo

> **Producto:** AtemiMX Plataforma Institucional  
> **Módulo:** SASE-310 (Sistema de Acompañamiento y Seguimiento Escolar)  
> **Versión:** 1.0.0 (Arquitectura y plan de implementación)

---

## 1. Propósito y Alcance

- **Objetivo general:** Centralizar, automatizar y trazar el ciclo completo de reportes socioemocionales y disciplinarios en secundaria.
- **Entorno actual:** Formularios y automatizaciones en Google Workspace (Forms, Sheets, Apps Script).
- **Alcance de esta fase:** Migrar el módulo SASE-310 al stack AtemiMX (Firebase Auth + Firestore + React/Vite/Tailwind) con políticas S-SDLC desde la fase de diseño.

---

## 2. Visión Arquitectónica

| Nivel | Tecnología | Rol |
| --- | --- | --- |
| **Frontend** | React 19 (Vite + Tailwind) | AtemiDashboard: captura, seguimiento y tableros por rol. |
| **Backend as a Service** | Firebase (Auth + Firestore) | Autenticación con reclamaciones personalizadas y base documental auditable. |
| **Automatización** | Cloud Functions (Node 20) | Validación, normalización, notificaciones y acuses. |
| **IA asistiva** | Google Gemini (REST) vía módulo IA de AtemiMX | Resumen de reportes y seguimiento asistido, siempre sujeto a revisión humana. |

### 2.1 Flujo de alto nivel
1. El docente inicia sesión con su cuenta institucional → Firebase Auth asigna `customClaims`.
2. El formulario React valida datos (Zod + react-hook-form) y envía al backend.
3. Una Cloud Function `reportes-onCreate` verifica esquema, asigna consecutivo, normaliza datos sensibles y escribe en `/reportes`.
4. Trigger secundarios:
   - Notificación a Orientación / Prefectura según categoría.
   - Registro en colección `/bitacora` para trazabilidad.
5. AtemiDashboard muestra tableros segmentados por rol con filtros y estado de seguimiento.

---

## 3. Modelo de Datos (Firestore)

```text
/usuarios/{userId}
  displayName: string
  email: string
  rol: 'docente' | 'prefectura' | 'orientacion' | 'coordinacion' | 'direccion'
  escuelas: string[]
  activo: boolean
  createdAt: timestamp
  updatedAt: timestamp

/alumnos/{alumnoId}
  curp: string
  nombres: string
  apellidos: string
  grado: number
  grupo: string
  tutores: { nombre: string; telefono: string; email?: string }[]
  sensitiveHash: string
  createdAt: timestamp
  updatedAt: timestamp

/reportes/{reporteId}
  folio: string
  alumnoRef: DocumentReference<alumnos>
  autorRef: DocumentReference<usuarios>
  tipo: 'conducta' | 'asistencia' | 'academico' | 'socemo'
  descripcion: string
  evidenciaUrls: string[]
  estado: 'nuevo' | 'enRevision' | 'seguimiento' | 'cerrado'
  responsables: DocumentReference<usuarios>[]
  meta: { prioridad: 'alta' | 'media' | 'baja'; canal: 'correo' | 'llamada' | 'reunion' }
  createdAt: timestamp
  updatedAt: timestamp

/prefectura/{registroId}
  alumnoRef: DocumentReference<alumnos>
  fecha: timestamp
  tipo: 'retardo' | 'falta' | 'permiso'
  motivo: string
  registradoPor: DocumentReference<usuarios>
  validadoPor?: DocumentReference<usuarios>
  createdAt: timestamp
  updatedAt: timestamp

/bitacora/{eventoId}
  entidad: 'usuario' | 'reporte' | 'prefectura' | 'alumno'
  entidadId: string
  accion: 'CREAR' | 'ACTUALIZAR' | 'CERRAR' | 'NOTIFICAR'
  realizadoPor: DocumentReference<usuarios>
  timestamp: timestamp
  detalle: string
  checksum: string
```

---

## 4. Seguridad – Firestore Rules (borrador inicial)

```js
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    function hasRole(role) {
      return request.auth != null && role in request.auth.token.roles;
    }

    function isOwner(doc) {
      return request.auth != null && doc.data.autorRef.id == request.auth.uid;
    }

    match /usuarios/{userId} {
      allow read: if hasRole('direccion') || request.auth.uid == userId;
      allow write: if false; // Solo procesos administrativos
    }

    match /alumnos/{alumnoId} {
      allow read: if hasRole('orientacion') || hasRole('direccion') || hasRole('coordinacion');
      allow create, update: if hasRole('orientacion') || hasRole('direccion');
    }

    match /reportes/{reporteId} {
      allow create: if hasRole('docente') && request.resource.data.autorRef.id == request.auth.uid;
      allow read: if hasRole('direccion') || hasRole('coordinacion') ||
                   (hasRole('docente') && isOwner(resource)) ||
                   hasRole('orientacion');
      allow update: if hasRole('orientacion') || hasRole('direccion');
      allow delete: if hasRole('direccion');
    }

    match /prefectura/{registroId} {
      allow create: if hasRole('prefectura');
      allow read: if hasRole('prefectura') || hasRole('direccion') || hasRole('coordinacion');
      allow update: if hasRole('prefectura') || hasRole('orientacion');
      allow delete: if false;
    }

    match /bitacora/{eventoId} {
      allow read: if hasRole('direccion');
      allow write: if request.auth != null; // Automations with service account
    }
  }
}
```

> 🔐 **S-SDLC Hooks:** Pre-commit lint + tests, reglas firmadas en `firebase.rules.md` con revisión de seguridad, despliegue sólo mediante pipeline CI.

---

## 5. Autenticación y Gestión de Roles

- **Ingreso docente:** SSO institucional (Google Workspace) o passwordless por dominio `@escuela.mx`.
- **Asignación de roles:** Script de administración (`scripts/assign-claims.ts`) que usa `firebase-admin` para aplicar `customClaims.roles = ['docente']`.
- **Servicios internos:** Cloud Functions con Service Account dedicada; vigilar `least privilege`.
- **Revocación:** `scripts/revoke-claims.ts` + flag `activo` → bloquea acceso inmediato.

---

## 6. Frontend – AtemiDashboard (React)

### 6.1 Estructura de carpetas

```
modules/
└── sase310/
    ├── firestore.rules       # Reglas listas para desplegar con Firebase CLI
    ├── package.json          # Scripts específicos del módulo (build, lint, test)
    ├── src/
    │   ├── components/
    │   │   ├── ReportForm.tsx
    │   │   ├── ReportTable.tsx
    │   │   └── StudentSummary.tsx
    │   ├── pages/
    │   │   ├── DashboardPage.tsx
    │   │   └── ReportDetailPage.tsx
    │   └── services/
    │       ├── firestoreClient.ts
    │       ├── authClient.ts
    │       └── notifications.ts
    └── README.md              # Este documento
```

### 6.2 Experiencia por rol

- **Docente:** Formulario guiado, histórico personal, seguimiento de estado.
- **Orientación:** Bandeja de entrada priorizada, timeline por alumno, emisión de acuses.
- **Prefectura:** Registro ágil de incidencias de asistencia, filtros diarios.
- **Coordinación:** Panel consolidado (kpis, tendencias, exportables).
- **Dirección:** Vista 360, bitácora y auditorías.

> UI integra componentes existentes (tema AtemiMX) mediante `Modules` tab y rutas dedicadas con `react-router`.

---

## 7. Migración desde Google Workspace

1. **Inventario y congelamiento:** Descargar `Base_Prefectura_310` (copia de seguridad), pausar automatizaciones de Apps Script.
2. **Normalización:** Script en Node (`scripts/migrate-sheets-to-firestore.ts`) que:
   - Lee `Reportes_Docentes` y `Prefectura`.
   - Genera `alumnos` únicos por CURP o combinación nombre+grupo.
   - Genera reportes con `estado = 'cerrado'` si tienen acuse firmado.
3. **Carga incremental:** Firestore `batch` (500 docs) con reintentos exponenciales.
4. **Verificación:** Export de Firestore → CSV para cotejo con hoja original.
5. **Activación:** Reactivar automatizaciones en Firebase (Cloud Functions) y redirigir Formularios a nuevo frontend.

---

## 8. Automatizaciones clave

- **Validación:** Cloud Function `validateReporte` guarda esquema JSON en Storage (`schemas/reportes.json`) para versionado.
- **Notificaciones:** Function HTTP `sendNotification` integra correo + Telegram (webhook) según matricula.
- **Acuses:** PDF generado con `@react-pdf/renderer`, almacenado en Storage `/acuses/{folio}.pdf`.
- **IA asistiva:** Endpoint protegido `/ai/summarize` envía payload a Gemini; respuesta guardada como borrador vinculado al reporte.

---

## 9. S-SDLC y Controles de Calidad

- **Revisión de diseño:** Este documento es la base para el checklist de arquitectura.
- **Desarrollo seguro:** Validación de entradas con Zod, sanitización y canonicalización de identificadores.
- **Pruebas:**
  - Unitarias (Vitest) en componentes críticos y services.
  - E2E (Playwright) para flujo docente → acuse orientadora.
  - Pruebas de reglas Firestore (`firebase emulators:exec`).
- **Monitoreo:** Cloud Logging + métricas en Dashboard (errores, latencia, rechazos de reglas).
- **Plan de respuesta:** Runbook en Notion/AtemiMX con contactos de TI y responsables pedagógicos.

---

## 10. Backlog de Implementación

| Sprint | Épica | Entregable | Criterio de aceptación |
| --- | --- | --- | --- |
| S1 | Infraestructura | Proyecto Firebase + reglas iniciales | `firebase deploy --only firestore:rules` sin errores |
| S1 | Frontend base | Ruta `/sase310` con layout y lista dummy | Navegación desde tab Módulos |
| S2 | Autenticación | Login + claims + guardas de ruta | Usuario sin rol es redirigido |
| S2 | Captura de reportes | Formulario validado + escritura Firestore | Reporte visible en subcolección |
| S3 | Bandeja orientación | Tabla de seguimiento + filtros | Cambios de estado guardados |
| S3 | Notificaciones | Cloud Function + correo institucional | Acuse llega a orientadora |
| S4 | Migración datos | Script ETL + verificación | 100% de reportes históricos presentes |
| S4 | IA asistiva | Resumen automático con opt-in | Orientación aprueba borrador |

---

## 11. Integración en AtemiMX

- Añadir ruta `modules/sase310` en el router principal (`App.tsx`) y exponer enlace en tab **Módulos**.
- Configurar `pnpm workspace` para compartir dependencias (React, Tailwind) entre shell principal y módulo.
- Sincronizar estilos con tokens Atemi (`primitives.css`).
- `services/firestoreClient.ts` reutiliza config global (`services/firebaseApp.ts`).
- Documentar variables en `.env.example` (`VITE_FIREBASE_API_KEY`, etc.).

---

## 12. Operación y Mantenimiento

- **Roles de operación:**  
  - *Product Owner*: Dirección escolar.  
  - *Tech Lead*: Equipo Codex.  
  - *Custodio datos*: Orientación (Marta) + Coordinación.
- **Respaldos:** Export mensual automático a Storage + copia cifrada Off-site.
- **Soporte:** Canal Teams `#sase310` + SLA 24 h hábil.
- **Auditorías:** Revisión semestral de reglas y acceso (LGPDPPSO).

---

## 13. Próximos pasos inmediatos

1. Crear proyecto Firebase `atemimx-sase310` y descargar `google-services.json`.
2. Configurar módulo React como micro-frontend dentro de AtemiMX.
3. Implementar Cloud Functions básicas (`validateReporte`, `notifyOrientacion`).
4. Ejecutar migración piloto con 10 reportes reales.
5. Planificar capacitación docente + manuales de uso.

### Semilla de `plantilla_docente`

La colección de whitelist se inicializa con los registros del archivo `modules/sase310/data/plantilla_docente.json`. Durante la preparación del entorno:

1. Asegúrate de que el proyecto local use Node 20 (`.nvmrc` y campo `engines` en `package.json`).
2. Inicia sesión en Firebase CLI con la cuenta institucional autorizada.
3. Importa el JSON mediante `firebase firestore:import` o el script `scripts/setup-firestore.ps1` para crear la colección `plantilla_docente` con los campos:
   - `nombre_completo` (string, mayúsculas sin acentos)
   - `registrado` (boolean, empieza en `false`)
   - `uid_asociado` (string | null)
   - `rol` (`'docente' | 'admin' | 'medical' | 'guidance' | 'socialWork' | 'prefect' | 'clerk'`)

La Cloud Function de registro bloqueará cualquier duplicado marcando `registrado: true` al asociar un `uid`.

---

### Control de versiones

- `2025-10-26`: Creación inicial del documento y alineación con plan de desarrollo.
