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
const GUARDIAN_REPORTS_COLLECTION = "guardianReports";

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

const GUARDIAN_ALLOWED_ROLES = new Set(["teacher", "prefect", "guidance", "medical", "socialWork", "admin"]);
const DEFAULT_GUARDIAN_VISIBILITY = {
  teacher: ["teacher", "guidance", "admin"],
  guidance: ["guidance", "admin"],
  prefect: ["prefect", "guidance", "admin"],
  medical: ["medical", "guidance", "admin"],
  socialWork: ["socialWork", "guidance", "admin"],
  admin: ["admin"],
};

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

const ensureIsoString = (value, fallback = null) => {
  const fallbackDate = fallback instanceof Date ? fallback : new Date();
  if (typeof value !== "string") {
    return fallbackDate.toISOString();
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return fallbackDate.toISOString();
  }
  return parsed.toISOString();
};

const ensureGuardianString = (value, fallback, { min = 3, max = 160 } = {}) => {
  if (typeof value !== "string") {
    return fallback;
  }
  const trimmed = value.trim();
  if (trimmed.length < min) {
    return fallback;
  }
  if (trimmed.length > max) {
    return trimmed.slice(0, max);
  }
  return trimmed;
};

const normalizeGuardianDraft = (payload = {}) => {
  const nowIso = new Date().toISOString();
  return {
    title: ensureGuardianString(payload.title, "Registro Ángel Guardián", { min: 3, max: 140 }),
    summary: ensureGuardianString(payload.summary, "Sin resumen registrado.", { min: 3, max: 500 }),
    transcript: ensureGuardianString(payload.transcript, "", { min: 0, max: 8000 }),
    date: ensureIsoString(payload.date ?? payload.recordedAtISO ?? nowIso, nowIso),
  };
};

const sanitizeGuardianVisibility = (requestedVisibility, reporterRole) => {
  const requested = Array.isArray(requestedVisibility) ? requestedVisibility : DEFAULT_GUARDIAN_VISIBILITY[reporterRole] ?? [];
  const roles = new Set(
    requested
      .map((role) => normalizeRole(role))
      .filter((role) => GUARDIAN_ALLOWED_ROLES.has(role)),
  );
  if (GUARDIAN_ALLOWED_ROLES.has(reporterRole)) {
    roles.add(reporterRole);
  }
  roles.add("admin");
  return Array.from(roles);
};

const buildGuardianCreatedBy = (context, role) => ({
  uid: context.auth.uid,
  email: typeof context.auth.token?.email === "string" ? context.auth.token.email : null,
  role,
});

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

const isValidBase64 = (value) => typeof value === "string" && /^[A-Za-z0-9+/]+={0,2}$/.test(value);

const validateEncryptedGuardianPayload = (payload) => {
  if (!payload || typeof payload !== "object") {
    throw new functions.https.HttpsError("invalid-argument", "El payload cifrado es obligatorio.");
  }
  const { version, iv, ciphertext } = payload;
  if (typeof version !== "number" || version < 1) {
    throw new functions.https.HttpsError("invalid-argument", "La version de cifrado enviada no es valida.");
  }
  if (!isValidBase64(iv) || !isValidBase64(ciphertext)) {
    throw new functions.https.HttpsError("invalid-argument", "El payload cifrado no tiene el formato esperado.");
  }
  return {
    version,
    iv,
    ciphertext,
  };
};

const toTimestampFromIso = (value, fallback = null) => {
  if (typeof value !== "string") {
    return fallback;
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return fallback;
  }
  return admin.firestore.Timestamp.fromDate(date);
};

const coerceDuration = (value) => {
  if (typeof value !== "number" || Number.isNaN(value) || value <= 0) {
    return null;
  }
  const capped = Math.min(Math.round(value), 12 * 60 * 60);
  return capped;
};

const extractGuardianSecret = async (payload) => {
  if (payload && typeof payload === "object" && payload.ciphertext && payload.iv) {
    const validated = validateEncryptedGuardianPayload(payload);
    return decryptPayload(validated);
  }
  if (payload && typeof payload === "object") {
    return payload;
  }
  throw new functions.https.HttpsError("invalid-argument", "El contenido del reporte es obligatorio.");
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

exports.saveEncryptedReport = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError("unauthenticated", "Inicia sesion para guardar reportes cifrados.");
  }

  const reporterRole = normalizeRole(context.auth.token?.role);
  if (!GUARDIAN_ALLOWED_ROLES.has(reporterRole)) {
    throw new functions.https.HttpsError("permission-denied", "Tu rol no puede registrar reportes de Ángel Guardián.");
  }

  const now = admin.firestore.Timestamp.now();
  const secretPayload = await extractGuardianSecret(data?.payload);
  const normalizedSecret = normalizeGuardianDraft(secretPayload);
  const encryptedPayload = await encryptPayload(normalizedSecret);
  const recordedAt = toTimestampFromIso(data?.recordedAtISO ?? normalizedSecret.date, now) ?? now;
  const voiceDurationSec = coerceDuration(data?.voiceDurationSec);
  const roleVisibility = sanitizeGuardianVisibility(data?.roleVisibility, reporterRole);
  const createdBy = buildGuardianCreatedBy(context, reporterRole);

  const document = {
    uid: context.auth.uid,
    payload: encryptedPayload,
    encryptionVersion: encryptedPayload.version,
    recordedAt,
    createdAt: now,
    updatedAt: now,
    roleVisibility,
    createdBy,
    ...(voiceDurationSec ? { voiceDurationSec } : null),
  };

  const docRef = await db.collection(GUARDIAN_REPORTS_COLLECTION).add(document);

  await db.collection(BITACORA_SDLC_COLLECTION).add({
    uid: context.auth.uid,
    email: createdBy.email,
    role: reporterRole,
    resource: docRef.path,
    tipo: "guardian_report",
    accion: "CREAR",
    timestamp: now,
    visibility: roleVisibility,
  });

  logger.info("Reporte de Angel Guardian almacenado", { uid: context.auth.uid, reportId: docRef.id });

  return {
    reportId: docRef.id,
    recordedAtISO: recordedAt.toDate().toISOString(),
    storedAtISO: now.toDate().toISOString(),
    roleVisibility,
  };
});

exports.getEncryptedReports = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError("unauthenticated", "Inicia sesion para consultar tus reportes cifrados.");
  }

  const role = normalizeRole(context.auth.token?.role);
  if (!GUARDIAN_ALLOWED_ROLES.has(role) && role !== "admin") {
    throw new functions.https.HttpsError("permission-denied", "Tu rol no puede consultar reportes de Ángel Guardián.");
  }

  const collectionRef = db.collection(GUARDIAN_REPORTS_COLLECTION);
  let queryRef;
  let scope = "role";
  if (role === "admin") {
    queryRef = collectionRef;
    scope = "admin";
  } else if (role === "teacher") {
    queryRef = collectionRef.where("uid", "==", context.auth.uid);
    scope = "own";
  } else {
    queryRef = collectionRef.where("roleVisibility", "array-contains", role);
  }

  const snapshot = await queryRef.orderBy("recordedAt", "desc").limit(150).get();

  const reports = (
    await Promise.all(
      snapshot.docs.map(async (docSnapshot) => {
        const docData = docSnapshot.data();
        if (!docData?.payload) {
          return null;
        }
        try {
          const secret = await decryptPayload(docData.payload);
          return {
            id: docSnapshot.id,
            payload: secret,
            recordedAtISO: docData.recordedAt?.toDate().toISOString() ?? null,
            updatedAtISO: docData.updatedAt?.toDate().toISOString() ?? null,
            roleVisibility: Array.isArray(docData.roleVisibility) ? docData.roleVisibility : [],
            createdBy: docData.createdBy ?? null,
            voiceDurationSec: typeof docData.voiceDurationSec === "number" ? docData.voiceDurationSec : null,
          };
        } catch (error) {
          logger.error("No se pudo descifrar un reporte de guardian", {
            reportId: docSnapshot.id,
            error: error instanceof Error ? error.message : error,
          });
          return null;
        }
      }),
    )
  ).filter(Boolean);

  await db.collection(BITACORA_SDLC_COLLECTION).add({
    uid: context.auth.uid,
    email: typeof context.auth.token?.email === "string" ? context.auth.token.email : null,
    role,
    resource: `guardianReports:${scope}`,
    tipo: "guardian_report",
    accion: "CONSULTAR",
    timestamp: admin.firestore.Timestamp.now(),
  });

  return { reports };
});

exports.deleteEncryptedReport = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError("unauthenticated", "Inicia sesion para eliminar reportes cifrados.");
  }
  const reportId = typeof data?.reportId === "string" ? data.reportId.trim() : "";
  if (!reportId) {
    throw new functions.https.HttpsError("invalid-argument", "Debes indicar el reporte que deseas eliminar.");
  }

  const docRef = db.collection(GUARDIAN_REPORTS_COLLECTION).doc(reportId);
  const snapshot = await docRef.get();
  if (!snapshot.exists) {
    throw new functions.https.HttpsError("not-found", "El reporte indicado no existe.");
  }
  if (snapshot.get("uid") !== context.auth.uid) {
    throw new functions.https.HttpsError("permission-denied", "No puedes eliminar reportes de otros usuarios.");
  }

  await docRef.delete();
  logger.info("Reporte cifrado eliminado", { uid: context.auth.uid, reportId });
  return { deleted: true };
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
