import { httpsCallable } from "firebase/functions";

import type { GuardianReport } from "../types";
import { decryptJSON, encryptJSON, type EncryptedPayload } from "./encryptionService";
import { functions } from "./firebase";

export type GuardianReportDraft = Omit<GuardianReport, "id">;

interface SaveEncryptedReportRequest {
  payload: EncryptedPayload;
  recordedAtISO?: string;
  voiceDurationSec?: number | null;
}

interface SaveEncryptedReportResponse {
  reportId: string;
  recordedAtISO?: string | null;
  storedAtISO: string;
}

interface GuardianEncryptedDocument {
  id: string;
  payload: EncryptedPayload;
  recordedAtISO?: string | null;
  updatedAtISO?: string | null;
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
    const payload = await encryptJSON<GuardianReportDraft>({
      ...draft,
      date: recordedAtISO,
    });

    const response = await saveEncryptedReportFn({
      payload,
      recordedAtISO,
    });

    const displayDate = toDisplayDate(recordedAtISO);
    return {
      ...draft,
      id: response.data.reportId,
      date: recordedAtISO,
      displayDate,
    };
  } catch (error) {
    console.error("[GuardianReports] No se pudo guardar el reporte cifrado", error);
    throw new Error("No se pudo guardar el reporte de Ángel Guardián. Intenta nuevamente.");
  }
};

export const fetchGuardianReports = async (): Promise<GuardianReport[]> => {
  try {
    const response = await getEncryptedReportsFn({});
    const encryptedDocs = Array.isArray(response.data.reports) ? response.data.reports : [];

    const reports = await Promise.all(
      encryptedDocs.map(async (doc) => {
        const decrypted = await decryptJSON<GuardianReportDraft>(doc.payload);
        const recordedAtISO = toIsoString(doc.recordedAtISO ?? decrypted.date);
        return {
          ...decrypted,
          id: doc.id,
          date: recordedAtISO,
        };
      }),
    );

    return reports
      .map((report) => ({
        ...report,
        displayDate: toDisplayDate(report.date),
      }))
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
