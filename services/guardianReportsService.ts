import { httpsCallable } from "firebase/functions";

import type { GuardianReport } from "../types";
import { functions } from "./firebase";

export interface GuardianReportDraft {
  title: string;
  summary: string;
  transcript: string;
  date: string;
  displayDate?: string;
}

interface GuardianReportAuthor {
  uid: string;
  email?: string | null;
  role?: string | null;
}

interface SaveEncryptedReportRequest {
  payload: GuardianReportDraft;
  recordedAtISO?: string;
  voiceDurationSec?: number | null;
  roleVisibility?: string[];
}

interface SaveEncryptedReportResponse {
  reportId: string;
  recordedAtISO?: string | null;
  storedAtISO: string;
  roleVisibility?: string[];
}

interface GuardianEncryptedDocument {
  id: string;
  payload: GuardianReportDraft;
  recordedAtISO?: string | null;
  updatedAtISO?: string | null;
  roleVisibility?: string[];
  createdBy?: GuardianReportAuthor | null;
  voiceDurationSec?: number | null;
}

interface GetEncryptedReportsResponse {
  reports: GuardianEncryptedDocument[];
}

interface DeleteEncryptedReportRequest {
  reportId: string;
}

interface DeleteEncryptedReportResponse {
  deleted: boolean;
}

const saveEncryptedReportFn = httpsCallable<SaveEncryptedReportRequest, SaveEncryptedReportResponse>(
  functions,
  "saveEncryptedReport",
);

const getEncryptedReportsFn = httpsCallable<Record<string, never>, GetEncryptedReportsResponse>(
  functions,
  "getEncryptedReports",
);

const deleteEncryptedReportFn = httpsCallable<DeleteEncryptedReportRequest, DeleteEncryptedReportResponse>(
  functions,
  "deleteEncryptedReport",
);

const toIsoString = (value?: string): string => {
  if (value) {
    const parsed = Date.parse(value);
    if (!Number.isNaN(parsed)) {
      return new Date(parsed).toISOString();
    }
  }
  return new Date().toISOString();
};

const toDisplayDate = (value: string): string => {
  const parsed = Date.parse(value);
  if (Number.isNaN(parsed)) {
    return value;
  }
  try {
    return new Intl.DateTimeFormat("es-MX", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(parsed));
  } catch {
    return new Date(parsed).toLocaleString("es-MX");
  }
};

export const saveGuardianReport = async (draft: GuardianReportDraft): Promise<GuardianReport> => {
  const recordedAtISO = toIsoString(draft.date);

  try {
    const response = await saveEncryptedReportFn({
      payload: {
        ...draft,
        date: recordedAtISO,
      },
      recordedAtISO,
    });

    const displayDate = toDisplayDate(recordedAtISO);
    return {
      ...draft,
      id: response.data.reportId,
      date: recordedAtISO,
      displayDate,
      roleVisibility: response.data.roleVisibility ?? [],
    };
  } catch (error) {
    console.error("[GuardianReports] No se pudo guardar el reporte cifrado", error);
    throw new Error("No se pudo guardar el reporte de Ángel Guardián. Intenta nuevamente.");
  }
};

export const fetchGuardianReports = async (): Promise<GuardianReport[]> => {
  try {
    const response = await getEncryptedReportsFn({});
    const documents = Array.isArray(response.data.reports) ? response.data.reports : [];

    return documents
      .map((doc) => {
        const recordedAtISO = toIsoString(doc.recordedAtISO ?? doc.payload?.date);
        return {
          ...doc.payload,
          id: doc.id,
          date: recordedAtISO,
          displayDate: toDisplayDate(recordedAtISO),
          roleVisibility: doc.roleVisibility ?? [],
          createdBy: doc.createdBy ?? undefined,
          voiceDurationSec: doc.voiceDurationSec ?? null,
        };
      })
      .sort((a, b) => Date.parse(b.date) - Date.parse(a.date));
  } catch (error) {
    console.error("[GuardianReports] No se pudieron recuperar los reportes cifrados", error);
    throw new Error("No pudimos sincronizar tus reportes de Ángel Guardián.");
  }
};

export const deleteGuardianReport = async (reportId: string): Promise<void> => {
  const trimmedId = reportId.trim();
  if (!trimmedId) {
    throw new Error("Falta el identificador del reporte a eliminar.");
  }

  try {
    await deleteEncryptedReportFn({ reportId: trimmedId });
  } catch (error) {
    console.error("[GuardianReports] No se pudo eliminar el reporte cifrado", error);
    throw new Error("No fue posible eliminar el reporte.");
  }
};
