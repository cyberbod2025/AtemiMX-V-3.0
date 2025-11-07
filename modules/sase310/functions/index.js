/**
 * Funciones de seguridad para SASE-310
 *
 * - Sincroniza custom claims a partir de la colección `users`.
 * - Normaliza reportes recién creados y genera folios consecutivos.
 */

const functions = require("firebase-functions/v1");
const admin = require("firebase-admin");
const { decryptPayload, encryptPayload } = require("./lib/encryption");

if (!admin.apps.length) {
  admin.initializeApp();
}

const { logger } = functions;

const db = admin.firestore();
const auth = admin.auth();

const USERS_COLLECTION = "users";
const REPORTS_COLLECTION = "reports";
const BITACORA_COLLECTION = "bitacora";
const BITACORA_SDLC_COLLECTION = "bitacora_sdlc";
const META_COLLECTION = "_meta";
const REPORT_COUNTER_DOC = "reportes";

const MAX_PROFILE_RETRIES = 5;
const RETRY_DELAY_MS = 500;

const ROLE_ALIASES = {
  admin: "admin",
  administrador: "admin",
  teacher: "teacher",
  docente: "teacher",
  professor: "teacher",
  prefect: "prefect",
  prefecto: "prefect",
  guidance: "guidance",
  orientacion: "guidance",
  medical: "medical",
  medico: "medical",
  socialwork: "socialWork",
  trabajo_social: "socialWork",
  social: "socialWork",
  clerk: "clerk",
  secretaria: "clerk",
  pending: "pending",
};

const VALID_ROLES = new Set(["admin", "teacher", "prefect", "guidance", "medical", "socialWork", "clerk", "pending"]);
const DEFAULT_ROLE = "pending";

const REPORT_SCHEMA_VERSION = "1.1.0";
const REPORT_SCHEMA_PATH = "schemas/reportes.json";

const CATEGORY_CANONICAL = {
  seguimiento: "Seguimiento",
  incidencia: "Incidencia",
  planeacion: "Planeacion",
  otro: "Otro",
};

const ORIENTATION_CATEGORIES = new Set(["seguimiento", "incidencia"]);

const ORIENTATION_PRIORITY = {
  seguimiento: "media",
  incidencia: "alta",
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const normalizeRole = (value) => {
  if (typeof value !== "string") {
    return DEFAULT_ROLE;
  }
  const candidate = value.trim().toLowerCase();
  const resolved = ROLE_ALIASES[candidate] ?? candidate;
  if (VALID_ROLES.has(resolved)) {
    return resolved;
  }
  return DEFAULT_ROLE;
};

const coerceBoolean = (value) => value === true;

const buildClaimsFromProfile = (profile) => {
  const role = normalizeRole(profile?.rol);
  const autorizado = coerceBoolean(profile?.autorizado);
  return { role, autorizado };
};

const sanitizeAuditString = (value, fallback = null) => {
  if (typeof value !== "string") {
    return fallback;
  }
  const trimmed = value.trim();
  if (!trimmed) {
    return fallback;
  }
  return trimmed.slice(0, 180);
};

async function fetchUserProfileWithRetry(uid) {
  const userRef = db.collection(USERS_COLLECTION).doc(uid);
  for (let attempt = 0; attempt < MAX_PROFILE_RETRIES; attempt += 1) {
    const snapshot = await userRef.get();
    if (snapshot.exists) {
      return snapshot.data();
    }
    await sleep(RETRY_DELAY_MS * (attempt + 1));
  }
  return null;
}

async function syncCustomClaims(uid, profile) {
  const record = profile ?? (await fetchUserProfileWithRetry(uid));

  const { role, autorizado } = buildClaimsFromProfile(record);

  await auth.setCustomUserClaims(uid, { role, autorizado });

  if (record) {
    await db
      .collection(USERS_COLLECTION)
      .doc(uid)
      .set(
        {
          claimsSincronizadosEn: admin.firestore.FieldValue.serverTimestamp(),
        },
        { merge: true },
      )
      .catch((error) => {
        logger.warn("No se pudo actualizar el sello de sincronización de claims", { uid, error });
      });
  }

  logger.info("Claims sincronizados", { uid, role, autorizado });
}

exports.syncClaimsOnAuthCreate = functions.auth.user().onCreate(async (user) => {
  await syncCustomClaims(user.uid);
});

exports.syncClaimsOnUserCreate = functions.firestore
  .document(`${USERS_COLLECTION}/{uid}`)
  .onCreate(async (snapshot, context) => {
    await syncCustomClaims(context.params.uid, snapshot.data());
  });

exports.syncClaimsOnUserUpdate = functions.firestore
  .document(`${USERS_COLLECTION}/{uid}`)
  .onUpdate(async (change, context) => {
    const beforeClaims = buildClaimsFromProfile(change.before.data());
    const afterClaims = buildClaimsFromProfile(change.after.data());

    if (beforeClaims.role === afterClaims.role && beforeClaims.autorizado === afterClaims.autorizado) {
      logger.debug("Sin cambios en claims, se omite sincronización", { uid: context.params.uid });
      return;
    }

    await syncCustomClaims(context.params.uid, change.after.data());
  });

const normalizeString = (value, fallback) => {
  if (typeof value !== "string") {
    return fallback;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : fallback;
};

async function generateFolio(transaction) {
  const counterRef = db.collection(META_COLLECTION).doc(REPORT_COUNTER_DOC);
  const snapshot = await transaction.get(counterRef);
  const current = snapshot.exists ? snapshot.data()?.consecutivo ?? 0 : 0;
  const next = current + 1;
  transaction.set(
    counterRef,
    {
      consecutivo: next,
      actualizadoEn: admin.firestore.FieldValue.serverTimestamp(),
    },
    { merge: true },
  );
  return `SASE310-${String(next).padStart(6, "0")}`;
}

exports.reportesOnCreate = functions.firestore
  .document(`${REPORTS_COLLECTION}/{reportId}`)
  .onCreate(async (snapshot, context) => {
    const data = snapshot.data();
    const reportId = context.params.reportId;

    if (!data) {
      logger.warn("Reporte sin datos; se aborta la normalización", { reportId });
      return;
    }

    const uid = normalizeString(data.uid, null);
    if (!uid) {
      logger.error("Reporte creado sin UID; bloqueando acceso", { reportId });
      await snapshot.ref.delete().catch((error) => {
        logger.error("No se pudo eliminar reporte inválido", { reportId, error });
      });
      return;
    }

    let secret;
    try {
      secret = await extractReportSecret(data);
    } catch (error) {
      logger.error("Reporte no pudo descifrarse en reportesOnCreate", {
        reportId,
        error: error instanceof Error ? error.message : error,
      });
      return;
    }

    const now = admin.firestore.Timestamp.now();
    const normalizedTitle = normalizeString(secret.title, "Seguimiento sin título");
    const normalizedDescription = normalizeString(secret.description, "Sin descripción registrada.");
    const normalizedCategory = normalizeString(secret.category, "Sin categoría");

    const sanitizedSecret = {
      ...secret,
      title: normalizedTitle,
      description: normalizedDescription,
      category: normalizedCategory,
    };

    await db.runTransaction(async (transaction) => {
      const folio = await generateFolio(transaction);
      const encryptedPayload = await encryptPayload(sanitizedSecret);

      transaction.update(snapshot.ref, {
        folio,
        payload: encryptedPayload,
        encryptionVersion: encryptedPayload.version,
        createdAt: data.createdAt ?? now,
        updatedAt: now,
      });

      const bitacoraRef = db.collection(BITACORA_COLLECTION).doc();
      transaction.set(bitacoraRef, {
        entidad: "reporte",
        entidadId: reportId,
        accion: "CREAR",
        realizadoPor: uid,
        timestamp: now,
        detalle: `Reporte generado y normalizado. Folio asignado: ${folio}`,
        checksum: `${reportId}:${folio}`,
      });
    });

    logger.info("Reporte normalizado correctamente", { reportId });
  });

exports.logSensitiveAccess = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError("unauthenticated", "Debes iniciar sesion para validar tu identidad.");
  }

  const resource = sanitizeAuditString(data?.resource, null);
  if (!resource) {
    throw new functions.https.HttpsError("invalid-argument", "El recurso solicitado es obligatorio.");
  }

  const reason = sanitizeAuditString(data?.reason, null);
  const now = admin.firestore.Timestamp.now();

  await db.collection(BITACORA_SDLC_COLLECTION).add({
    uid: context.auth.uid,
    email: typeof context.auth.token?.email === "string" ? context.auth.token.email : null,
    role: typeof context.auth.token?.role === "string" ? context.auth.token.role : "unknown",
    resource,
    reason,
    tipo: "reauthentication",
    timestamp: now,
  });

  logger.info("Reautenticacion auditada", { uid: context.auth.uid, resource });

  return {
    recorded: true,
    timestamp: now.toDate().toISOString(),
  };
});

const normalizeCategory = (value) => {
  if (typeof value !== "string") {
    return null;
  }
  const trimmed = value.trim().toLowerCase();
  return CATEGORY_CANONICAL[trimmed] ?? null;
};

const buildReportSchema = () => ({
  version: REPORT_SCHEMA_VERSION,
  description: "Esquema base para reportes SASE-310 con cifrado en reposo.",
  required: ["uid", "payload", "date", "createdAt", "updatedAt", "encryptionVersion"],
  properties: {
    uid: { type: "string", minLength: 1 },
    payload: {
      type: "object",
      required: ["version", "iv", "ciphertext"],
      properties: {
        version: { type: "number" },
        iv: { type: "string", minLength: 12 },
        ciphertext: { type: "string", minLength: 32 },
      },
    },
    encryptionVersion: { type: "number" },
    date: { type: "timestamp" },
    folio: { type: "string" },
    createdAt: { type: "timestamp" },
    updatedAt: { type: "timestamp" },
  },
});

const ensureSchemaFile = async () => {
  const bucket = admin.storage().bucket();
  const file = bucket.file(REPORT_SCHEMA_PATH);
  const schemaContent = JSON.stringify(buildReportSchema(), null, 2);

  try {
    const [exists] = await file.exists();
    if (exists) {
      const [buffer] = await file.download();
      if (buffer.toString("utf8") === schemaContent) {
        return false;
      }
    }

    await file.save(schemaContent, {
      contentType: "application/json",
      resumable: false,
    });
    logger.info("Esquema de reportes actualizado en storage", { path: REPORT_SCHEMA_PATH });
    return true;
  } catch (error) {
    logger.error("No fue posible actualizar el esquema de reportes en storage", { error });
    return false;
  }
};

const coerceOwnerValue = (value) => {
  if (typeof value !== "string") {
    return null;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

const extractReportSecret = async (data) => {
  if (data?.payload) {
    try {
      return await decryptPayload(data.payload);
    } catch (error) {
      logger.error("No se pudo descifrar el payload del reporte", {
        error: error instanceof Error ? error.message : error,
      });
      throw new Error("Payload cifrado invalido.");
    }
  }
  return {
    title: typeof data?.title === "string" ? data.title : "",
    description: typeof data?.description === "string" ? data.description : "",
    category: typeof data?.category === "string" ? data.category : "",
    dateISO: typeof data?.date === "string" ? data.date : "",
    ownerName: coerceOwnerValue(data?.ownerName),
    ownerEmail: coerceOwnerValue(data?.ownerEmail),
    ownerRole: coerceOwnerValue(data?.ownerRole),
  };
};

const validateReportPayload = async (data) => {
  const issues = [];

  const ensureString = (value, field, { min = 1, max = 2000 } = {}) => {
    if (typeof value !== "string") {
      issues.push(`${field} debe ser texto`);
      return null;
    }
    const trimmed = value.trim();
    if (trimmed.length < min) {
      issues.push(`${field} debe tener al menos ${min} caracteres`);
      return null;
    }
    if (trimmed.length > max) {
      issues.push(`${field} excede el maximo de ${max} caracteres`);
      return trimmed.slice(0, max);
    }
    return trimmed;
  };

  const resolveDate = (value) => {
    if (value instanceof admin.firestore.Timestamp) {
      return value;
    }
    if (value && typeof value.toDate === "function") {
      return value;
    }
    if (typeof value === "string") {
      const parsed = new Date(value);
      if (!Number.isNaN(parsed.getTime())) {
        return admin.firestore.Timestamp.fromDate(parsed);
      }
    }
    issues.push("date debe ser una fecha valida");
    return null;
  };

  const secret = await extractReportSecret(data);
  const uid = ensureString(data?.uid, "uid");
  const title = ensureString(secret?.title, "title", { min: 3, max: 120 });
  const description = ensureString(secret?.description, "description", { min: 10, max: 2000 });
  const category = normalizeCategory(secret?.category);
  if (!category) {
    issues.push("category no pertenece al catalogo permitido");
  }
  const date = resolveDate(data?.date ?? secret?.dateISO);

  if (issues.length > 0) {
    const message = issues.join("; ");
    throw new Error(message);
  }

  return {
    uid,
    title,
    description,
    category,
    date,
    ownerName: coerceOwnerValue(secret?.ownerName),
    ownerEmail: coerceOwnerValue(secret?.ownerEmail)?.toLowerCase() ?? null,
    ownerRole: coerceOwnerValue(secret?.ownerRole),
  };
};

exports.validateReporte = functions.firestore
  .document(`${REPORTS_COLLECTION}/{reportId}`)
  .onCreate(async (snapshot, context) => {
    const data = snapshot.data();
    const reportId = context.params.reportId;

    if (!data) {
      logger.warn("Reporte sin datos en validateReporte", { reportId });
      return;
    }

    const now = admin.firestore.Timestamp.now();

    try {
      const sanitized = await validateReportPayload(data);
      await ensureSchemaFile();
      await db.collection(BITACORA_COLLECTION).add({
        entidad: "reporte",
        entidadId: reportId,
        accion: "VALIDACION",
        realizadoPor: sanitized.uid,
        detalle: `Reporte validado contra el esquema ${REPORT_SCHEMA_VERSION}`,
        timestamp: now,
        checksum: `${reportId}:validation`,
      });
      logger.info("Reporte validado correctamente", { reportId });
    } catch (error) {
      logger.error("Reporte no valido detectado", { reportId, error: error instanceof Error ? error.message : error });
      await db.collection(BITACORA_COLLECTION).add({
        entidad: "reporte",
        entidadId: reportId,
        accion: "VALIDACION_FALLIDA",
        realizadoPor: data?.uid ?? null,
        detalle: `Validacion fallida: ${error instanceof Error ? error.message : "sin detalle"}`,
        timestamp: now,
        checksum: `${reportId}:validation:error`,
      });
    }
  });

exports.notifyOrientacion = functions.firestore
  .document(`${REPORTS_COLLECTION}/{reportId}`)
  .onCreate(async (snapshot, context) => {
    const data = snapshot.data();
    const reportId = context.params.reportId;

    if (!data) {
      logger.warn("Reporte sin datos en notifyOrientacion", { reportId });
      return;
    }

    let secret;
    try {
      secret = await extractReportSecret(data);
    } catch (error) {
      logger.error("No se pudo descifrar el reporte para notificar a orientacion", {
        reportId,
        error: error instanceof Error ? error.message : error,
      });
      return;
    }

    const normalizedCategoryKey = typeof secret?.category === "string" ? secret.category.trim().toLowerCase() : "";
    if (!ORIENTATION_CATEGORIES.has(normalizedCategoryKey)) {
      logger.debug("Reporte sin notificacion obligatoria", { reportId, category: secret?.category });
      return;
    }

    const now = admin.firestore.Timestamp.now();
    const categoryLabel = CATEGORY_CANONICAL[normalizedCategoryKey] ?? secret?.category ?? "Sin categoria";
    const priority = ORIENTATION_PRIORITY[normalizedCategoryKey] ?? "media";

    const notificationPayload = {
      tipo: "orientacion",
      reporteId: reportId,
      categoria: categoryLabel,
      prioridad: priority,
      estado: "pendiente",
      destinatarios: ["orientacion"],
      creadoEn: now,
      origenUid: typeof data.uid === "string" ? data.uid : null,
      ownerName: coerceOwnerValue(secret?.ownerName),
      ownerEmail: coerceOwnerValue(secret?.ownerEmail),
    };

    try {
      await db.collection("notifications").add(notificationPayload);
      await db.collection(BITACORA_COLLECTION).add({
        entidad: "reporte",
        entidadId: reportId,
        accion: "NOTIFICAR",
        realizadoPor: notificationPayload.origenUid,
        detalle: `Notificacion a orientacion registrada (categoria ${categoryLabel}, prioridad ${priority})`,
        timestamp: now,
        checksum: `${reportId}:notify`,
      });
      logger.info("Notificacion a orientacion registrada", { reportId, category: categoryLabel });
    } catch (error) {
      logger.error("No se pudo registrar la notificacion a orientacion", {
        reportId,
        error: error instanceof Error ? error.message : error,
      });
    }
  });
