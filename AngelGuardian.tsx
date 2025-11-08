import React, { useCallback, useMemo, useState } from "react";

import AngelGuardianModal from "./AngelGuardianModal";
import { useIncidents } from "./hooks/useIncidents";
import type { GuardianReport } from "./types";

const formatRecordedDate = (value: string, fallback?: string): string => {
  const parsed = Date.parse(value);
  if (Number.isNaN(parsed)) {
    return fallback ?? value;
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

const AngelGuardian: React.FC = () => {
  const { reports, loading, error, deleteReport, saveReport } = useIncidents();
  const [selectedReport, setSelectedReport] = useState<GuardianReport | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const handleDelete = useCallback(
    async (reportId: string) => {
      if (!window.confirm("¿Deseas eliminar este reporte cifrado? No podrás recuperarlo después.")) {
        return;
      }
      try {
        setProcessingId(reportId);
        await deleteReport(reportId);
        setFeedback("Reporte eliminado correctamente.");
      } catch (err) {
        console.error("[AngelGuardian] No se pudo eliminar el reporte", err);
        setFeedback(err instanceof Error ? err.message : "Error al eliminar el reporte.");
      } finally {
        setProcessingId(null);
      }
    },
    [deleteReport],
  );

  const handleReportSaved = useCallback((report: GuardianReport) => {
    setModalOpen(false);
    setFeedback("Reporte cifrado guardado y sincronizado.");
    setSelectedReport(report);
  }, []);

  const sortedReports = useMemo(
    () =>
      reports.map((report) => ({
        ...report,
        displayDate: formatRecordedDate(report.date, report.displayDate),
      })),
    [reports],
  );

  const ReportModal: React.FC<{ report: GuardianReport; onClose: () => void }> = ({ report, onClose }) => (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div
        className="bg-surface-800/80 backdrop-blur-lg border border-[var(--accent-2)]/50 rounded-2xl p-6 sm:p-8 w-full max-w-3xl shadow-2xl shadow-[var(--accent-1)]/10 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-2xl font-bold font-display text-[var(--accent-1)] mb-2">{report.title}</h2>
        <p className="text-xs text-gray-400 mb-4">Fecha: {formatRecordedDate(report.date)}</p>

        <div className="mb-6">
          <h3 className="font-bold text-lg mb-2">Resumen generado</h3>
          <p className="text-gray-300 bg-black/20 p-3 rounded-md">{report.summary}</p>
        </div>

        <div>
          <h3 className="font-bold text-lg mb-2">Transcripción completa</h3>
          <p className="text-gray-300 bg-black/20 p-3 rounded-md whitespace-pre-wrap h-64 overflow-y-auto">
            {report.transcript}
          </p>
        </div>

        <button onClick={onClose} className="btn btn-secondary mt-6">
          Cerrar
        </button>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {modalOpen ? (
        <AngelGuardianModal
          onClose={() => setModalOpen(false)}
          onSaveReport={saveReport}
          onSaved={handleReportSaved}
        />
      ) : null}
      {selectedReport ? <ReportModal report={selectedReport} onClose={() => setSelectedReport(null)} /> : null}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold font-display">Reportes de Ángel Guardián</h2>
          <p className="text-sm text-gray-400">
            Los reportes se cifran en tu navegador usando AES-GCM antes de enviarse a Firestore.
          </p>
        </div>
        <button type="button" className="btn btn-primary self-start" onClick={() => setModalOpen(true)}>
          Registrar nuevo reporte
        </button>
      </div>

      {feedback && (
        <div className="rounded-lg border border-[var(--accent-2)]/50 bg-black/30 px-4 py-3 text-sm text-gray-200">
          {feedback}
        </div>
      )}
      {error && (
        <div className="rounded-lg border border-red-500/60 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error}
        </div>
      )}

      {loading ? (
        <div className="card text-center py-10">
          <p className="text-gray-300">Sincronizando reportes cifrados...</p>
        </div>
      ) : null}

      {!loading && sortedReports.length === 0 ? (
        <div className="card text-center py-10">
          <p className="text-gray-400">No tienes reportes guardados todavía.</p>
          <p className="text-sm text-gray-500 mt-2">
            Usa el botón del escudo para activar Ángel Guardián y generar tu primer reporte cifrado.
          </p>
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {sortedReports.map((report) => (
          <div key={report.id} className="card flex flex-col justify-between border border-white/5">
            <div>
              <h3 className="font-bold text-lg text-[var(--accent-1)] truncate">{report.title}</h3>
              <p className="text-sm text-gray-400 mt-1 line-clamp-2">{report.summary}</p>
            </div>
            <div className="mt-4 flex justify-between items-center text-xs text-gray-500">
              <span>Grabado: {report.displayDate ?? formatRecordedDate(report.date)}</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedReport(report)}
                  className="btn btn-secondary !py-1 !px-2 text-xs"
                >
                  Ver
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(report.id)}
                  disabled={processingId === report.id}
                  className="btn btn-secondary !py-1 !px-2 text-xs !border-red-500/50 hover:!bg-red-500 disabled:opacity-70"
                >
                  {processingId === report.id ? "Borrando..." : "Borrar"}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AngelGuardian;
