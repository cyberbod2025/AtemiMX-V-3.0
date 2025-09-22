import React, { useState, useEffect, useCallback } from 'react';
import { loadData, saveData } from './services/storageService';
import type { GuardianReport } from './types';

const STORAGE_KEY = 'guardian_reports';

const AngelGuardian: React.FC = () => {
  const [reports, setReports] = useState<GuardianReport[]>([]);
  const [selectedReport, setSelectedReport] = useState<GuardianReport | null>(null);

  useEffect(() => {
    const savedReports = loadData<GuardianReport[]>(STORAGE_KEY);
    if (savedReports) {
      setReports(savedReports);
    }
  }, []);

  const handleDelete = (reportId: string) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar este reporte? Esta acción no se puede deshacer.')) {
      const updatedReports = reports.filter(r => r.id !== reportId);
      setReports(updatedReports);
      saveData(STORAGE_KEY, updatedReports);
    }
  };

  const ReportModal: React.FC<{ report: GuardianReport; onClose: () => void }> = ({ report, onClose }) => (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div 
        className="bg-surface-800/80 backdrop-blur-lg border border-[var(--accent-2)]/50 rounded-2xl p-6 sm:p-8 w-full max-w-3xl shadow-2xl shadow-[var(--accent-1)]/10 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-2xl font-bold font-display text-[var(--accent-1)] mb-2">{report.title}</h2>
        <p className="text-xs text-gray-400 mb-4">Fecha: {report.date}</p>
        
        <div className="mb-6">
          <h3 className="font-bold text-lg mb-2">Resumen por IA</h3>
          <p className="text-gray-300 bg-black/20 p-3 rounded-md">{report.summary}</p>
        </div>
        
        <div>
          <h3 className="font-bold text-lg mb-2">Transcripción Completa</h3>
          <p className="text-gray-300 bg-black/20 p-3 rounded-md whitespace-pre-wrap h-64 overflow-y-auto">{report.transcript}</p>
        </div>

        <button onClick={onClose} className="btn btn-secondary mt-6">Cerrar</button>
      </div>
    </div>
  );

  return (
    <div>
      {selectedReport && <ReportModal report={selectedReport} onClose={() => setSelectedReport(null)} />}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold font-display">Reportes de Ángel Guardián</h2>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {reports.map(report => (
          <div key={report.id} className="card flex flex-col justify-between">
            <div>
              <h3 className="font-bold text-lg text-[var(--accent-1)] truncate">{report.title}</h3>
              <p className="text-sm text-gray-400 mt-1 line-clamp-2">{report.summary}</p>
            </div>
            <div className="mt-4 flex justify-between items-center">
              <p className="text-xs text-gray-500">Grabado: {report.date}</p>
              <div>
                <button onClick={() => setSelectedReport(report)} className="text-xs btn btn-secondary !py-1 !px-2 mr-2">Ver</button>
                <button onClick={() => handleDelete(report.id)} className="text-xs btn btn-secondary !py-1 !px-2 !border-red-500/50 hover:!bg-red-500">Borrar</button>
              </div>
            </div>
          </div>
        ))}
        {reports.length === 0 && (
            <div className="col-span-full text-center py-10 card">
                <p className="text-gray-400">No tienes reportes guardados.</p>
                <p className="text-sm text-gray-500 mt-2">Usa el botón del escudo para crear tu primer reporte de Ángel Guardián.</p>
            </div>
        )}
      </div>
    </div>
  );
};

export default AngelGuardian;