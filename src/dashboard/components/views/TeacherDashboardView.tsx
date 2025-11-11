import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';
import ReportForm from '../ReportForm';
import ReportCard from '../ReportCard';
import { getReportsByTeacher } from "../../services/mockDataService";
import { Report, User, ReportType, ReportStatus } from '../../types';
import { DocumentPlusIcon, ClockIcon, ChartBarIcon } from '../icons/SolidIcons';
import { GradebookPanel } from '../../modules/gradebook/GradebookPanel';
import { PlannerPanel } from "../PlannerPanel";

interface TeacherDashboardViewProps {
  currentUser: User;
  viewStudentProfile: (studentId: string) => void;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

const TeacherDashboardView: React.FC<TeacherDashboardViewProps> = ({ currentUser, viewStudentProfile }) => {
  const [myReports, setMyReports] = useState<Report[]>([]);
  const [showForm, setShowForm] = useState(false);

  const fetchReports = useCallback(async () => {
    const reports = await getReportsByTeacher(currentUser.id);
    setMyReports(reports.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
  }, [currentUser.id]);

  useEffect(() => {
    void fetchReports();
  }, [fetchReports]);
  
  const handleReportUpdate = (updatedReport: Report) => {
    setMyReports(prevReports => prevReports.map(r => r.id === updatedReport.id ? updatedReport : r));
  };
  
  const analyticsData = useMemo(() => {
    const reportsByType = myReports.reduce((acc, report) => {
        acc[report.type] = (acc[report.type] || 0) + 1;
        return acc;
    }, {} as Record<ReportType, number>);
    const typeData = Object.entries(reportsByType).map(([name, value]) => ({ name, value }));

    const reportsByStatus = myReports.reduce((acc, report) => {
        acc[report.status] = (acc[report.status] || 0) + 1;
        return acc;
    }, {} as Record<ReportStatus, number>);
    const statusData = Object.entries(reportsByStatus).map(([name, value]) => ({ name, value }));

    return { typeData, statusData };
  }, [myReports]);

return (
    <div className="space-y-6">
      <div className="dashboard-grid">
        <div className="dashboard-grid__item">
          <GradebookPanel teacherId={currentUser.id} />
        </div>
        <div className="dashboard-grid__item">
          <PlannerPanel teacher={currentUser} />
        </div>
      </div>

      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Mi Panel</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center bg-blue-600 text-white font-semibold px-4 py-2 rounded-lg shadow-md hover:bg-blue-700 transition-colors"
        >
          <DocumentPlusIcon className="h-5 w-5 mr-2"/>
          {showForm ? 'Cancelar Reporte' : 'Nuevo Reporte'}
        </button>
      </div>

      {showForm && (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg animate-fade-in-down">
          <ReportForm
            currentUser={currentUser}
            onCreated={() => {
              setShowForm(false);
              void fetchReports();
            }}
          />
        </div>
      )}

      {/* Teacher Analytics Section */}
      {myReports.length > 0 && (
        <div>
            <h3 className="text-xl font-semibold flex items-center mb-4 text-gray-700 dark:text-gray-300">
                <ChartBarIcon className="h-6 w-6 mr-2"/>
                Mis Estadísticas
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow-md h-64">
                    <h4 className="font-semibold mb-2 text-center">Mis Reportes por Tipo</h4>
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie data={analyticsData.typeData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={40} outerRadius={60} fill="#8884d8" paddingAngle={5} label>
                                {analyticsData.typeData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                            </Pie>
                            <Tooltip />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
                 <div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow-md h-64">
                    <h4 className="font-semibold mb-2 text-center">Mis Reportes por Estado</h4>
                     <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                             <Pie data={analyticsData.statusData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={40} outerRadius={60} fill="#82ca9d" paddingAngle={5} label>
                                {analyticsData.statusData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS.slice(2)[index % COLORS.length]} />)}
                            </Pie>
                            <Tooltip />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
      )}

      <div>
        <h3 className="text-xl font-semibold flex items-center mb-4 text-gray-700 dark:text-gray-300">
          <ClockIcon className="h-6 w-6 mr-2"/>
          Historial de Reportes Enviados
        </h3>
        {myReports.length > 0 ? (
          <div className="space-y-4">
            {myReports.map((report) => (
              <ReportCard key={report.id} report={report} viewStudentProfile={viewStudentProfile} onReportUpdate={handleReportUpdate} currentUser={currentUser} />
            ))}
          </div>
        ) : (
          <div className="text-center py-10 px-6 bg-white dark:bg-gray-800 rounded-lg shadow-md">
            <p className="text-gray-500 dark:text-gray-400">No has enviado ningún reporte todavía.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TeacherDashboardView;
