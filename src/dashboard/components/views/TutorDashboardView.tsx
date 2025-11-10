import React, { useState, useEffect, useMemo } from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';
import ReportCard from '../ReportCard';
import { getAllReports } from '../../services/mockDataService';
import { MOCK_STUDENTS } from '../../constants';
import { Report, User, ReportType } from '../../types';
import { AcademicCapIcon, ClockIcon } from '../icons/SolidIcons';

interface TutorDashboardViewProps {
  currentUser: User;
  viewStudentProfile: (studentId: string) => void;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

const TutorDashboardView: React.FC<TutorDashboardViewProps> = ({ currentUser, viewStudentProfile }) => {
  const [groupReports, setGroupReports] = useState<Report[]>([]);

  useEffect(() => {
    const fetchAndFilterReports = async () => {
      if (!currentUser.tutorOfGroup) return;

      const allReports = await getAllReports();
      const studentIdsInGroup = MOCK_STUDENTS
        .filter(s => s.grade === currentUser.tutorOfGroup?.grade && s.group === currentUser.tutorOfGroup?.group)
        .map(s => s.id);
      
      const filteredReports = allReports
        .filter(r => studentIdsInGroup.includes(r.studentId))
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        
      setGroupReports(filteredReports);
    };

    fetchAndFilterReports();
  }, [currentUser.tutorOfGroup]);

  const handleReportUpdate = (updatedReport: Report) => {
    setGroupReports(prevReports => prevReports.map(r => r.id === updatedReport.id ? updatedReport : r));
  };

  const analyticsData = useMemo(() => {
    const reportsByType = groupReports.reduce((acc, report) => {
        acc[report.type] = (acc[report.type] || 0) + 1;
        return acc;
    }, {} as Record<ReportType, number>);
    return Object.entries(reportsByType).map(([name, value]) => ({ name, value }));
  }, [groupReports]);

  if (!currentUser.tutorOfGroup) {
      return <div>No estás asignado como tutor a ningún grupo.</div>;
  }
  
  const { grade, group } = currentUser.tutorOfGroup;

  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center">
          <AcademicCapIcon className="h-7 w-7 mr-3" />
          Panel de Tutoría - {grade}° "{group}"
      </h2>

      {/* Analytics Section */}
      {groupReports.length > 0 && (
        <div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow-md h-72">
            <h4 className="font-semibold mb-2 text-center">Reportes del Grupo por Tipo</h4>
            <ResponsiveContainer width="100%" height="90%">
                <PieChart>
                    <Pie data={analyticsData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} fill="#8884d8" label>
                        {analyticsData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                    </Pie>
                    <Tooltip />
                </PieChart>
            </ResponsiveContainer>
        </div>
      )}

      <div>
        <h3 className="text-xl font-semibold flex items-center mb-4 text-gray-700 dark:text-gray-300">
          <ClockIcon className="h-6 w-6 mr-2"/>
          Línea de Tiempo del Grupo
        </h3>
        {groupReports.length > 0 ? (
          <div className="space-y-4">
            {groupReports.map((report) => (
              <ReportCard 
                key={report.id} 
                report={report} 
                viewStudentProfile={viewStudentProfile} 
                onReportUpdate={handleReportUpdate} 
                currentUser={currentUser} 
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-10 px-6 bg-white dark:bg-gray-800 rounded-lg shadow-md">
            <p className="text-gray-500 dark:text-gray-400">No hay reportes para tu grupo de tutoría.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TutorDashboardView;
