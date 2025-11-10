import React, { useState, useEffect } from 'react';
import ReportCard from '../ReportCard';
import { getReportsByStudent, getStudentById } from '../../services/mockDataService';
import { Report, Student, User } from '../../types';
import { UserCircleIcon } from '../icons/SolidIcons';

interface StudentProfileViewProps {
  studentId: string;
  viewStudentProfile: (studentId:string) => void;
  currentUser: User;
}

const StudentProfileView: React.FC<StudentProfileViewProps> = ({ studentId, viewStudentProfile, currentUser }) => {
  const [student, setStudent] = useState<Student | null>(null);
  const [reports, setReports] = useState<Report[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      const studentData = await getStudentById(studentId);
      const reportData = await getReportsByStudent(studentId);
      setStudent(studentData || null);
      setReports(reportData.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
    };
    fetchData();
  }, [studentId]);
  
  const handleReportUpdate = (updatedReport: Report) => {
    setReports(prevReports => prevReports.map(r => r.id === updatedReport.id ? updatedReport : r));
  };


  if (!student) {
    return <div>Cargando perfil del alumno...</div>;
  }

  return (
    <div className="space-y-6">
       <div className="flex items-center">
            <UserCircleIcon className="h-12 w-12 text-blue-500" />
            <div className="ml-4">
                <h2 className="text-3xl font-bold text-gray-800 dark:text-white">{student.name}</h2>
                <p className="text-md text-gray-600 dark:text-gray-400">Grado: {student.grade} - Grupo: {student.group}</p>
            </div>
        </div>
        
        <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300 border-b pb-2">Línea de Tiempo de Incidencias</h3>

      {reports.length > 0 ? (
        <div className="space-y-4">
          {reports.map((report) => (
            <ReportCard 
              key={report.id} 
              report={report} 
              viewStudentProfile={viewStudentProfile} 
              isStudentProfileView={true} 
              currentUser={currentUser}
              onReportUpdate={handleReportUpdate}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-10 px-6 bg-white dark:bg-gray-800 rounded-lg shadow-md">
            <p className="text-gray-500 dark:text-gray-400">Este alumno no tiene reportes registrados.</p>
        </div>
      )}
    </div>
  );
};

export default StudentProfileView;