/**
 * Funciones de seguridad para SASE-310
 *
 * - Sincroniza custom claims a partir de la colección `users`.
 * - Normaliza reportes recién creados y genera folios consecutivos.
 */

const functions = require("firebase-functions");
const admin = require("firebase-admin");

const { logger } = functions;

functions.setGlobalOptions({ maxInstances: 10 });

admin.initializeApp();

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

    const now = admin.firestore.Timestamp.now();
    const normalizedTitle = normalizeString(data.title, "Seguimiento sin título");
    const normalizedDescription = normalizeString(data.description, "Sin descripción registrada.");
    const normalizedCategory = normalizeString(data.category, "Sin categoría");

    await db.runTransaction(async (transaction) => {
      const folio = await generateFolio(transaction);

      transaction.update(snapshot.ref, {
        folio,
        title: normalizedTitle,
        description: normalizedDescription,
        category: normalizedCategory,
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
