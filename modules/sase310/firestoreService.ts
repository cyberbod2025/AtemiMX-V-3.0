import {
  addDoc,
  collection,
  deleteDoc,
  doc,
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

type ReportRecord = Omit<Report, "id">;

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

export const createReport = async (data: ReportInput, owner?: ReportOwnerMeta): Promise<Report> => {
  const validated = validateReportInput(data);
  const now = Timestamp.now();

  const reportsRef = collection(db, REPORTS_COLLECTION);
  const record: ReportRecord = {
    uid: validated.uid,
    title: validated.title,
    description: validated.description,
    category: validated.category,
    date: toTimestamp(validated.date),
    createdAt: now,
    updatedAt: now,
    ownerName: normalizeMeta(owner?.name) ?? null,
    ownerEmail: normalizeMeta(owner?.email?.toLowerCase()) ?? null,
    ownerRole: normalizeMeta(owner?.role) ?? null,
  };

  try {
    const docRef = await addDoc(reportsRef, record);
    return {
      id: docRef.id,
      ...record,
    };
  } catch (error) {
    console.error("[Firestore] Failed to create report:", error);
    throw new Error("No se pudo crear el reporte en Firestore.");
  }
};

const mapReportSnapshot = (reportDoc: QueryDocumentSnapshot<DocumentData>): Report => {
  const data = reportDoc.data() as Partial<ReportRecord>;
  return {
    id: reportDoc.id,
    uid: data?.uid ?? "",
    title: data?.title ?? "",
    description: data?.description ?? "",
    category: data?.category ?? "",
    date: (data?.date as Timestamp) ?? Timestamp.now(),
    createdAt: (data?.createdAt as Timestamp) ?? Timestamp.now(),
    updatedAt: (data?.updatedAt as Timestamp) ?? Timestamp.now(),
    ownerName: (data?.ownerName as string | null | undefined) ?? null,
    ownerEmail: (data?.ownerEmail as string | null | undefined) ?? null,
    ownerRole: (data?.ownerRole as string | null | undefined) ?? null,
  };
};

export const getReportsByUser = async (uid: User["id"]): Promise<Report[]> => {
  try {
    const reportsRef = collection(db, REPORTS_COLLECTION);
    const userReportsQuery = query(reportsRef, where("uid", "==", uid));
    const snapshot = await getDocs(userReportsQuery);

    const reports = snapshot.docs.map(mapReportSnapshot);
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
    const reports = snapshot.docs.map(mapReportSnapshot);
    return reports.sort((a, b) => b.updatedAt.toMillis() - a.updatedAt.toMillis());
  } catch (error) {
    console.error("[Firestore] Failed to fetch all reports:", error);
    throw new Error("No se pudieron obtener los reportes registrados.");
  }
};

export const updateReport = async (reportId: Report["id"], updates: ReportUpdate): Promise<void> => {
  const validated = validateReportUpdate(updates);
  const reportRef = doc(db, REPORTS_COLLECTION, reportId);

  const normalizedUpdates = {
    ...validated,
    ...(validated.date ? { date: toTimestamp(validated.date) } : null),
    updatedAt: Timestamp.now(),
  };

  try {
    await updateDoc(reportRef, normalizedUpdates);
  } catch (error) {
    console.error(`[Firestore] Failed to update report (${reportId}):`, error);
    throw new Error("No se pudo actualizar el reporte.");
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
