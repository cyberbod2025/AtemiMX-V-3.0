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
const META_COLLECTION = "_meta";
const REPORT_COUNTER_DOC = "reportes";

const MAX_PROFILE_RETRIES = 5;
const RETRY_DELAY_MS = 500;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const formatRole = (value) => {
  if (typeof value === "string" && value.trim().length > 0) {
    return value.trim();
  }
  return "pendiente";
};

const coerceBoolean = (value) => value === true;

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

  const role = formatRole(record?.rol);
  const autorizado = coerceBoolean(record?.autorizado);

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

exports.syncClaimsOnCreate = functions.auth.user().onCreate(async (user) => {
  await syncCustomClaims(user.uid);
});

exports.syncClaimsOnUserWrite = functions.firestore
  .document(`${USERS_COLLECTION}/{uid}`)
  .onWrite(async (change, context) => {
    if (!change.after.exists) {
      logger.info("Perfil eliminado, se limpia claim a estado pendiente", { uid: context.params.uid });
      await auth.setCustomUserClaims(context.params.uid, { role: "pendiente", autorizado: false });
      return;
    }

    const profile = change.after.data();
    await syncCustomClaims(context.params.uid, profile);
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
