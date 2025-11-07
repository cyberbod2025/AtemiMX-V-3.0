import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  Timestamp,
  updateDoc,
  where,
  type DocumentData,
  type QueryDocumentSnapshot,
} from "firebase/firestore";
import { ZodError, z } from "zod";

import { db } from "../../services/firebase";
import { decryptJSON, encryptJSON, type EncryptedPayload } from "../../services/encryptionService";
import { reportInputSchema, type ReportInput } from "./validation/reportSchema";

const REPORTS_COLLECTION = "reports";

export interface User {
  id: string;
  email?: string;
  displayName?: string;
}

export interface Report {
  id: string;
  uid: User["id"];
  title: string;
  description: string;
  category: string;
  date: Timestamp;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  ownerName: string | null;
  ownerEmail: string | null;
  ownerRole: string | null;
}

interface ReportSecretPayload {
  title: string;
  description: string;
  category: string;
  dateISO: string;
  ownerName: string | null;
  ownerEmail: string | null;
  ownerRole: string | null;
}

type ReportRecord = {
  uid: string;
  date: Timestamp;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  payload: EncryptedPayload;
  encryptionVersion: number;
};

export type { ReportInput } from "./validation/reportSchema";

export interface ReportOwnerMeta {
  name?: string | null;
  email?: string | null;
  role?: string | null;
}

const reportUpdateSchema = reportInputSchema.omit({ uid: true }).partial();
type ReportUpdatePayload = z.infer<typeof reportUpdateSchema>;

export type ReportUpdate = Partial<Omit<Report, "id" | "uid" | "createdAt" | "updatedAt">> & {
  date?: string;
};

const formatValidationError = (error: ZodError): string => {
  const first = error.errors[0];
  return `Datos de reporte invalidos: ${first?.message ?? "verifica la informacion ingresada."}`;
};

const validateReportInput = (data: ReportInput): ReportInput => {
  try {
    return reportInputSchema.parse(data);
  } catch (error) {
    if (error instanceof ZodError) {
      throw new Error(formatValidationError(error));
    }
    throw error;
  }
};

const validateReportUpdate = (data: ReportUpdate): ReportUpdatePayload => {
  try {
    return reportUpdateSchema.parse(data);
  } catch (error) {
    if (error instanceof ZodError) {
      throw new Error(formatValidationError(error));
    }
    throw error;
  }
};

const toTimestamp = (value: string): Timestamp => Timestamp.fromDate(new Date(value));

const normalizeMeta = (value: string | null | undefined): string | null => {
  const trimmed = value?.trim();
  return trimmed && trimmed.length > 0 ? trimmed : null;
};

const buildSecretPayload = (data: ReportInput, owner?: ReportOwnerMeta): ReportSecretPayload => ({
  title: data.title,
  description: data.description,
  category: data.category,
  dateISO: data.date,
  ownerName: normalizeMeta(owner?.name) ?? null,
  ownerEmail: normalizeMeta(owner?.email?.toLowerCase()) ?? null,
  ownerRole: normalizeMeta(owner?.role) ?? null,
});

const decryptSecretPayload = async (
  record: Partial<ReportRecord> & Record<string, unknown>,
): Promise<ReportSecretPayload> => {
  if (record.payload && typeof record.payload === "object") {
    return decryptJSON<ReportSecretPayload>(record.payload as EncryptedPayload);
  }

  // Legacy fallback: use plaintext fields if payload is not present.
  return {
    title: typeof record.title === "string" ? record.title : "",
    description: typeof record.description === "string" ? record.description : "",
    category: typeof record.category === "string" ? record.category : "",
    dateISO:
      typeof record.date === "string"
        ? record.date
        : record.date instanceof Timestamp
          ? record.date.toDate().toISOString()
          : "",
    ownerName: typeof record.ownerName === "string" ? record.ownerName : null,
    ownerEmail: typeof record.ownerEmail === "string" ? record.ownerEmail : null,
    ownerRole: typeof record.ownerRole === "string" ? record.ownerRole : null,
  };
};

export const createReport = async (data: ReportInput, owner?: ReportOwnerMeta): Promise<Report> => {
  const validated = validateReportInput(data);
  const now = Timestamp.now();
  const secretPayload = buildSecretPayload(validated, owner);
  const encryptedPayload = await encryptJSON(secretPayload);

  const reportsRef = collection(db, REPORTS_COLLECTION);
  const record: ReportRecord = {
    uid: validated.uid,
    date: toTimestamp(validated.date),
    createdAt: now,
    updatedAt: now,
    payload: encryptedPayload,
    encryptionVersion: encryptedPayload.version,
  };

  try {
    const docRef = await addDoc(reportsRef, record);
    return {
      id: docRef.id,
      uid: record.uid,
      title: secretPayload.title,
      description: secretPayload.description,
      category: secretPayload.category,
      date: record.date,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
      ownerName: secretPayload.ownerName,
      ownerEmail: secretPayload.ownerEmail,
      ownerRole: secretPayload.ownerRole,
    };
  } catch (error) {
    console.error("[Firestore] Failed to create report:", error);
    throw new Error("No se pudo crear el reporte en Firestore.");
  }
};

const mapReportSnapshot = async (reportDoc: QueryDocumentSnapshot<DocumentData>): Promise<Report> => {
  const data = reportDoc.data() as Partial<ReportRecord> & Record<string, unknown>;
  const secret = await decryptSecretPayload(data);
  return {
    id: reportDoc.id,
    uid: typeof data.uid === "string" ? data.uid : "",
    title: secret.title,
    description: secret.description,
    category: secret.category,
    date: (data.date as Timestamp) ?? Timestamp.now(),
    createdAt: (data.createdAt as Timestamp) ?? Timestamp.now(),
    updatedAt: (data.updatedAt as Timestamp) ?? Timestamp.now(),
    ownerName: secret.ownerName,
    ownerEmail: secret.ownerEmail,
    ownerRole: secret.ownerRole,
  };
};

export const getReportsByUser = async (uid: User["id"]): Promise<Report[]> => {
  try {
    const reportsRef = collection(db, REPORTS_COLLECTION);
    const userReportsQuery = query(reportsRef, where("uid", "==", uid));
    const snapshot = await getDocs(userReportsQuery);

    const reports = await Promise.all(snapshot.docs.map(mapReportSnapshot));
    return reports.sort((a, b) => b.updatedAt.toMillis() - a.updatedAt.toMillis());
  } catch (error) {
    console.error("[Firestore] Failed to fetch reports for user:", error);
    throw new Error("No se pudieron obtener los reportes del usuario.");
  }
};

export const getAllReports = async (): Promise<Report[]> => {
  try {
    const reportsRef = collection(db, REPORTS_COLLECTION);
    const snapshot = await getDocs(reportsRef);
    const reports = await Promise.all(snapshot.docs.map(mapReportSnapshot));
    return reports.sort((a, b) => b.updatedAt.toMillis() - a.updatedAt.toMillis());
  } catch (error) {
    console.error("[Firestore] Failed to fetch all reports:", error);
    throw new Error("No se pudieron obtener los reportes registrados.");
  }
};

export const updateReport = async (reportId: Report["id"], updates: ReportUpdate): Promise<void> => {
  const validated = validateReportUpdate(updates);
  const reportRef = doc(db, REPORTS_COLLECTION, reportId);

  try {
    const snapshot = await getDoc(reportRef);
    if (!snapshot.exists()) {
      throw new Error("El reporte no existe.");
    }

    const record = snapshot.data() as Partial<ReportRecord> & Record<string, unknown>;
    const currentSecret = await decryptSecretPayload(record);
    const nextSecret: ReportSecretPayload = {
      ...currentSecret,
      ...(validated.title ? { title: validated.title } : null),
      ...(validated.description ? { description: validated.description } : null),
      ...(validated.category ? { category: validated.category } : null),
      ...(validated.date ? { dateISO: validated.date } : null),
    };

    const encryptedPayload = await encryptJSON(nextSecret);
    const normalizedUpdates: Record<string, unknown> = {
      payload: encryptedPayload,
      encryptionVersion: encryptedPayload.version,
      updatedAt: Timestamp.now(),
    };

    if (validated.date) {
      normalizedUpdates.date = toTimestamp(validated.date);
    }

    await updateDoc(reportRef, normalizedUpdates);
  } catch (error) {
    console.error(`[Firestore] Failed to update report (${reportId}):`, error);
    throw new Error(error instanceof Error ? error.message : "No se pudo actualizar el reporte.");
  }
};

export const deleteReport = async (reportId: Report["id"]): Promise<void> => {
  try {
    const reportRef = doc(db, REPORTS_COLLECTION, reportId);
    await deleteDoc(reportRef);
  } catch (error) {
    console.error(`[Firestore] Failed to delete report (${reportId}):`, error);
    throw new Error("No se pudo eliminar el reporte.");
  }
};
