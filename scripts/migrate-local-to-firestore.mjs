#!/usr/bin/env node
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { initializeApp, applicationDefault, cert, getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import nemCatalogData from "../src/data/nemCatalog.json" assert { type: "json" };

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DEFAULT_DUMP = path.join(__dirname, "localStorageDump.json");

const ensureFirebase = () => {
  if (getApps().length) {
    return;
  }
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    initializeApp({ credential: cert(serviceAccount) });
    return;
  }
  initializeApp({ credential: applicationDefault() });
};

const parseValue = (value) => {
  if (typeof value === "string") {
    try {
      return JSON.parse(value);
    } catch {
      return null;
    }
  }
  return value;
};

const isGradebookModel = (value) =>
  value &&
  typeof value === "object" &&
  Array.isArray(value.tabs) &&
  Array.isArray(value.rows) &&
  typeof value.cells === "object";

const guessTeacherId = (model, key) => {
  if (model?.teacherId) {
    return model.teacherId;
  }
  const fallback = key.split(":").pop();
  if (fallback && fallback.startsWith("teacher")) {
    return fallback;
  }
  return fallback ?? null;
};

const normalizeText = (value) => (value?.toString().trim().toLowerCase() ?? "");

const findCampoByName = (name) => {
  if (!name) {
    return null;
  }
  const normalized = normalizeText(name);
  return nemCatalogData.camposFormativos.find(
    (campo) =>
      campo.nombre.toLowerCase() === normalized ||
      normalized.includes(campo.nombre.toLowerCase()) ||
      campo.nombre.toLowerCase().includes(normalized),
  );
};

const findPdaByName = (name) => {
  if (!name) {
    return null;
  }
  const normalized = normalizeText(name);
  return nemCatalogData.pdas.find(
    (pda) =>
      pda.nombre.toLowerCase() === normalized ||
      normalized.includes(pda.nombre.toLowerCase()) ||
      pda.nombre.toLowerCase().includes(normalized),
  );
};

const ensurePlannerMetadata = (entry) => {
  const campoId = entry.campoFormativoId || findCampoByName(entry.field)?.campoId;
  const pdaId =
    entry.pdaId ||
    findPdaByName(entry.subject)?.pdaId ||
    findPdaByName(entry.objective)?.pdaId ||
    findPdaByName(entry.activities)?.pdaId;
  if (!campoId || !pdaId) {
    return null;
  }
  return { ...entry, campoFormativoId: campoId, pdaId };
};

const buildPlannerEntries = (dump) => {
  const entries = [];
  for (const value of Object.values(dump)) {
    const parsed = parseValue(value);
    const bucket = Array.isArray(parsed)
      ? parsed
      : Array.isArray(parsed?.entries)
        ? parsed.entries
        : [];
    if (!bucket.length) {
      continue;
    }
    bucket.forEach((entry) => {
      if (entry && entry.teacherId && entry.dateISO) {
        entries.push(entry);
      }
    });
  }
  return entries;
};

const migrateGradebooks = async (db, dump) => {
  const gradebookEntries = Object.entries(dump)
    .map(([key, raw]) => {
      const parsed = parseValue(raw);
      return { key, value: parsed };
    })
    .filter(({ value }) => isGradebookModel(value));

  for (const { key, value } of gradebookEntries) {
    const teacherId = guessTeacherId(value, key);
    if (!teacherId) {
      console.warn(`[migrate] No se pudo determinar teacherId para ${key}, se omite.`);
      continue;
    }
    await db.collection("gradebooks").doc(teacherId).set(
      {
        ...value,
        teacherId,
        migratedAt: new Date().toISOString(),
      },
      { merge: true },
    );
    console.log(`[migrate] Gradebook de ${teacherId} sincronizado (${key}).`);
  }
  if (!gradebookEntries.length) {
    console.log("[migrate] No se encontró un modelo de gradebook en los datos.");
  }
};

const migratePlanner = async (db, dump) => {
  const plannerEntries = buildPlannerEntries(dump);
  if (!plannerEntries.length) {
    console.log("[migrate] No se encontraron planeaciones locales.");
    return;
  }

  for (const entry of plannerEntries) {
    const metadata = ensurePlannerMetadata(entry);
    if (!metadata) {
      console.warn(`[migrate] El registro ${entry.id ?? entry.dateISO} carece de metadata NEM y se omite.`);
      continue;
    }
    const docId = metadata.id ?? `${metadata.teacherId}-${metadata.dateISO}`;
    await db.collection("plannerEntries").doc(docId).set(
      {
        ...metadata,
        id: docId,
        updatedAtISO: metadata.updatedAtISO ?? new Date().toISOString(),
      },
      { merge: true },
    );
    console.log(`[migrate] Planeación ${docId} sincronizada en Firestore.`);
  }
};

const main = async () => {
  const dumpPath = process.argv[2] ? path.resolve(process.argv[2]) : DEFAULT_DUMP;
  try {
    await fs.access(dumpPath);
  } catch {
    console.error(`[migrate] No se encontró el archivo de localStorage: ${dumpPath}`);
    process.exit(1);
  }

  const rawDump = await fs.readFile(dumpPath, "utf-8");
  const dump = JSON.parse(rawDump);

  ensureFirebase();
  const db = getFirestore();

  await migrateGradebooks(db, dump);
  await migratePlanner(db, dump);
  console.log("[migrate] Proceso completado.");
};

main().catch((error) => {
  console.error("[migrate] Error inesperado:", error);
  process.exit(1);
});
