import React, { useState, useEffect } from 'react';
import ReportCard from '../ReportCard';
import { getAllReports } from '../../services/mockDataService';
import { Report, ReportStatus, ReportPriority, User } from '../../types';
import { InboxStackIcon, FunnelIcon } from '../icons/SolidIcons';
import { MOCK_USERS } from '../../constants'; // Assuming currentUser is needed in ReportCard

interface GuidanceInboxViewProps {
  viewStudentProfile: (studentId: string) => void;
  currentUser: User; // Pass down current user for context in actions
}

const GuidanceInboxView: React.FC<GuidanceInboxViewProps> = ({ viewStudentProfile, currentUser }) => {
  const [reports, setReports] = useState<Report[]>([]);
  const [filter, setFilter] = useState<ReportStatus | 'all'>('all');

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