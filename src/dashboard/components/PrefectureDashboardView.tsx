import React, { useState, useEffect, useMemo } from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import ReportForm from './ReportForm';
import ReportCard from './ReportCard';
import { getAllReports } from '../services/mockDataService';
import { Report, User, ReportType } from '../types';
import { MOCK_STUDENTS } from '../constants';
import { DocumentPlusIcon, ClockIcon, ChartBarIcon, ExclamationTriangleIcon } from './icons/SolidIcons';

interface PrefectureDashboardViewProps {
  currentUser: User;
  viewStudentProfile: (studentId: string) => void;
}

const PrefectureDashboardView: React.FC<PrefectureDashboardViewProps> = ({ currentUser, viewStudentProfile }) => {
  const [attendanceReports, setAttendanceReports] = useState<Report[]>([]);
  const [showForm, setShowForm] = useState(false);

  const fetchReports = async () => {
    const allReports = await getAllReports();
    const reports = allReports.filter(r => r.type === ReportType.Attendance);
    setAttendanceReports(reports.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
  };
  
  useEffect(() => {
    fetchReports();
  }, [currentUser.id]);

  const handleReportSubmitted = (newReport: Report) => {
    setAttendanceReports(prevReports => [newReport, ...prevReports]);
    setShowForm(false);
    fetchReports(); // Re-fetch to update analytics with re-incidences
  };

  const handleReportUpdate = (updatedReport: Report) => {
    setAttendanceReports(prevReports => prevReports.map(r => r.id === updatedReport.id ? updatedReport : r));
  };
  
  const analyticsData = useMemo(() => {
    const byGrade = attendanceReports.reduce((acc, r) => {
        const grade = MOCK_STUDENTS.find(s => s.id === r.studentId)?.grade || 'N/A';
        acc[grade] = (acc[grade] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);
    const gradeData = (Object.entries(byGrade) as Array<[string, number]>)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => a.name.localeCompare(b.name));

    const byStudent = attendanceReports.reduce((acc, r) => {
        const studentName = MOCK_STUDENTS.find(s => s.id === r.studentId)?.name || 'Desconocido';
        acc[studentName] = (acc[studentName] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);
    const studentData = (Object.entries(byStudent) as Array<[string, number]>)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);

    const reincidences = studentData.filter(s => s.value > 1);

    return { gradeData, reincidences };
  }, [attendanceReports]);

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Panel de Prefectura</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center bg-blue-600 text-white font-semibold px-4 py-2 rounded-lg shadow-md hover:bg-blue-700 transition-colors"
        >
          <DocumentPlusIcon className="h-5 w-5 mr-2"/>
          {showForm ? 'Cancelar' : 'Registrar Incidencia'}
        </button>
      </div>

      {showForm && (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg animate-fade-in-down">
          {/* A specialized form might be needed here, but for now we reuse the main one */}
          <ReportForm currentUser={currentUser} onReportSubmit={handleReportSubmitted} />
        </div>
      )}
      
      {/* Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow h-80">
            <h4 className="font-semibold mb-2 text-center flex items-center justify-center"><ChartBarIcon className="h-5 w-5 mr-2"/>Incidencias de Asistencia por Grado</h4>
            <ResponsiveContainer width="100%" height="90%">
                <BarChart data={analyticsData.gradeData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Bar dataKey="value" fill="#8884d8" name="Incidencias" />
                </BarChart>
            </ResponsiveContainer>
        </div>
        <div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow h-80">
            <h4 className="font-semibold mb-2 text-center flex items-center justify-center text-red-600 dark:text-red-400"><ExclamationTriangleIcon className="h-5 w-5 mr-2"/>Alumnos con Reincidencias</h4>
            {analyticsData.reincidences.length > 0 ? (
                <ul className="space-y-2 overflow-y-auto max-h-64">
                    {analyticsData.reincidences.map(student => (
                        <li key={student.name} className="flex justify-between items-center p-2 bg-red-50 dark:bg-red-900/20 rounded">
                            <span className="font-medium">{student.name}</span>
                            <span className="font-bold text-red-500">{student.value} incidencias</span>
                        </li>
                    ))}
                </ul>
            ) : <p className="text-center text-gray-500 pt-10">No hay alumnos con reincidencias.</p>}
        </div>
      </div>


      <div>
        <h3 className="text-xl font-semibold flex items-center mb-4 text-gray-700 dark:text-gray-300">
          <ClockIcon className="h-6 w-6 mr-2"/>
          Historial de Asistencia
        </h3>
        <div className="space-y-4">
            {attendanceReports.map((report) => (
              <ReportCard key={report.id} report={report} viewStudentProfile={viewStudentProfile} onReportUpdate={handleReportUpdate} currentUser={currentUser} />
            ))}
        </div>
      </div>
    </div>
  );
};

export default PrefectureDashboardView;
