import React, { useState, useEffect } from 'react';
import ReportCard from '../ReportCard';
import { getAllReports } from '../../services/mockDataService';
import { Report, ReportStatus, ReportPriority, User, GuardianReport } from '../../types';
import { InboxStackIcon, FunnelIcon } from '../icons/SolidIcons';
import { MOCK_USERS } from '../../constants';
import { useGuardianReports } from "../../hooks/useGuardianReports";
import { getDashboardModulesForRole } from "../../services/roleDashboards";

interface GuidanceInboxViewProps {
  viewStudentProfile: (studentId: string) => void;
  currentUser: User; // Pass down current user for context in actions
}

const GuidanceInboxView: React.FC<GuidanceInboxViewProps> = ({ viewStudentProfile, currentUser }) => {
  const [reports, setReports] = useState<Report[]>([]);
  const [filter, setFilter] = useState<ReportStatus | 'all'>('all');
  const modules = React.useMemo(() => getDashboardModulesForRole(currentUser.role), [currentUser.role]);
  const showGuardianModule = modules.some((module) => module.id === "guardian-inbox");
  const { reports: guardianReports, loading: guardianLoading, error: guardianError } = useGuardianReports(showGuardianModule);

  useEffect(() => {
    const fetchReports = async () => {
      const allReports = await getAllReports();
      const sortedReports = allReports.sort((a, b) => {
        const priorityOrder = { [ReportPriority.High]: 0, [ReportPriority.Medium]: 1, [ReportPriority.Low]: 2 };
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      });
      setReports(sortedReports);
    };
    fetchReports();
  }, []);

  const handleReportUpdate = (updatedReport: Report) => {
    setReports(prevReports => prevReports.map(r => r.id === updatedReport.id ? updatedReport : r));
  };

  const filteredReports = reports.filter(report =>
    filter === 'all' || report.status === filter
  );

  const orientationGuardianReports = React.useMemo(
    () =>
      guardianReports.filter((report) =>
        (report.roleVisibility ?? []).includes("guidance"),
      ),
    [guardianReports],
  );

  const backlogCases = React.useMemo(() => {
    const threshold = Date.now() - 24 * 60 * 60 * 1000;
    return orientationGuardianReports.filter((report) => Date.parse(report.date) < threshold);
  }, [orientationGuardianReports]);

  const sensitiveCases = React.useMemo(
    () =>
      orientationGuardianReports.filter((report) => {
        const transcript = report.transcript.toLowerCase();
        const summary = report.summary.toLowerCase();
        return (
          transcript.includes("alerta") ||
          transcript.includes("riesgo") ||
          summary.includes("crisis") ||
          (report.voiceDurationSec ?? 0) > 90 ||
          report.transcript.length > 600
        );
      }),
    [orientationGuardianReports],
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold flex items-center text-gray-800 dark:text-white">
            <InboxStackIcon className="h-7 w-7 mr-3" />
            Bandeja de Orientación
        </h2>
        <div className="flex items-center space-x-2">
            <FunnelIcon className="h-5 w-5 text-gray-500" />
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as ReportStatus | 'all')}
              className="bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md p-2 text-sm"
            >
              <option value="all">Todos los estados</option>
              <option value={ReportStatus.New}>Nuevos</option>
              <option value={ReportStatus.InProgress}>En Progreso</option>
              <option value={ReportStatus.Resolved}>Resueltos</option>
            </select>
        </div>
      </div>

      {showGuardianModule ? (
        <section className="bg-white dark:bg-gray-900 rounded-xl shadow p-5 space-y-4">
          <header className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 uppercase tracking-wide">Ángel Guardián</p>
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">Casos sensibles</h3>
            </div>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {orientationGuardianReports.length} registros recibidos
            </span>
          </header>
          {guardianLoading ? (
            <p className="text-sm text-gray-500">Sincronizando buzón...</p>
          ) : guardianError ? (
            <p className="text-sm text-red-500">{guardianError}</p>
          ) : sensitiveCases.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div>
                <h4 className="font-semibold text-gray-700 dark:text-gray-200 mb-2">Alertas prioritarias</h4>
                <ul className="space-y-3">
                  {sensitiveCases.slice(0, 4).map((report) => (
                    <li key={report.id} className="border border-rose-200 dark:border-rose-900/40 rounded-lg p-3">
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {report.displayDate ?? new Date(report.date).toLocaleString("es-MX")}
                      </p>
                      <h5 className="font-semibold text-gray-800 dark:text-gray-100">{report.title}</h5>
                      <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">{report.summary}</p>
                      <div className="flex justify-between text-xs mt-1 text-gray-500 dark:text-gray-300">
                        <span>{report.voiceDurationSec ? `${report.voiceDurationSec}s` : "Sin audio"}</span>
                        <span>{report.createdBy?.role ?? "Desconocido"}</span>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-gray-700 dark:text-gray-200 mb-2">Casos a seguimiento (&gt;24h)</h4>
                {backlogCases.length > 0 ? (
                  <ul className="space-y-2 max-h-72 overflow-y-auto pr-2">
                    {backlogCases.map((report) => (
                      <li key={`${report.id}-backlog`} className="flex justify-between items-center border border-gray-200 dark:border-gray-700 rounded-md p-2 text-sm">
                        <span className="font-medium text-gray-700 dark:text-gray-200">{report.title}</span>
                        <span className="text-xs text-gray-500">
                          {new Date(report.date).toLocaleDateString("es-MX")}
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-gray-500">No hay casos pendientes de revisión.</p>
                )}
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-500">No se han recibido alertas prioritarias.</p>
          )}
        </section>
      ) : null}
      
      {filteredReports.length > 0 ? (
        <div className="space-y-4">
          {filteredReports.map((report) => (
            <ReportCard 
              key={report.id} 
              report={report} 
              viewStudentProfile={viewStudentProfile} 
              onReportUpdate={handleReportUpdate}
              currentUser={currentUser}
              isGuidanceView={true} 
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-10 px-6 bg-white dark:bg-gray-800 rounded-lg shadow-md">
            <p className="text-gray-500 dark:text-gray-400">No hay reportes que coincidan con el filtro seleccionado.</p>
        </div>
      )}
    </div>
  );
};

export default GuidanceInboxView;
