import React, { useState, useEffect, useMemo } from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend } from 'recharts';
import { User, Report, ReportType, ReportStatus, Student, GuardianReport } from '../../types';
import { getAllReports } from '../../services/mockDataService';
import { MOCK_STUDENTS, MOCK_USERS } from '../../constants';
import { ChartPieIcon, ChartBarIcon, UsersIcon } from '../icons/SolidIcons';
import { useGuardianReports } from "../../hooks/useGuardianReports";
import { getDashboardModulesForRole } from "../../services/roleDashboards";

interface AdminDashboardViewProps {
  currentUser: User;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];
const STATUS_COLORS = ['#3B82F6', '#F59E0B', '#10B981'];

const AdminDashboardView: React.FC<AdminDashboardViewProps> = ({ currentUser }) => {
    const [reports, setReports] = useState<Report[]>([]);
    const [filteredReports, setFilteredReports] = useState<Report[]>([]);
    const modules = useMemo(() => getDashboardModulesForRole(currentUser.role), [currentUser.role]);
    const showGuardianModule = modules.some((module) => module.id === "guardian-inbox");
    const { reports: guardianReports, loading: guardianLoading, error: guardianError } = useGuardianReports(showGuardianModule);

    const [gradeFilter, setGradeFilter] = useState('all');
    const [groupFilter, setGroupFilter] = useState('all');
    const [studentFilter, setStudentFilter] = useState('all');

    const students = MOCK_STUDENTS;
    const teachers = MOCK_USERS.filter(u => u.role === 'teacher');

    useEffect(() => {
        const fetchReports = async () => {
            const allReports = await getAllReports();
            setReports(allReports);
            setFilteredReports(allReports);
        };
        fetchReports();
    }, []);

    useEffect(() => {
        let tempReports = reports;
        if (gradeFilter !== 'all') {
            tempReports = tempReports.filter(r => students.find(s => s.id === r.studentId)?.grade === gradeFilter);
        }
        if (groupFilter !== 'all') {
            tempReports = tempReports.filter(r => students.find(s => s.id === r.studentId)?.group === groupFilter);
        }
        if (studentFilter !== 'all') {
            tempReports = tempReports.filter(r => r.studentId === studentFilter);
        }
        setFilteredReports(tempReports);
    }, [gradeFilter, groupFilter, studentFilter, reports, students]);
    
    const analyticsData = useMemo(() => {
        const total = filteredReports.length;
        const newCount = filteredReports.filter(r => r.status === ReportStatus.New).length;
        const inProgress = filteredReports.filter(r => r.status === ReportStatus.InProgress).length;
        const resolved = filteredReports.filter(r => r.status === ReportStatus.Resolved).length;

        const byType = filteredReports.reduce((acc, r) => {
            acc[r.type] = (acc[r.type] || 0) + 1;
            return acc;
        }, {} as Record<ReportType, number>);
        const typeData = Object.entries(byType).map(([name, value]) => ({ name, value }));
        
        const byStatus = filteredReports.reduce((acc, r) => {
            acc[r.status] = (acc[r.status] || 0) + 1;
            return acc;
        }, {} as Record<ReportStatus, number>);
        const statusData = Object.entries(byStatus).map(([name, value]) => ({ name, value }));

        const byTeacher = filteredReports.reduce((acc, r) => {
            const teacherName = teachers.find(t => t.id === r.teacherId)?.name || 'Desconocido';
            acc[teacherName] = (acc[teacherName] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);
        const teacherData = Object.entries(byTeacher).map(([name, value]) => ({ name, value }));

        const byGrade = filteredReports.reduce((acc, r) => {
            const grade = students.find(s => s.id === r.studentId)?.grade || 'N/A';
            acc[grade] = (acc[grade] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);
        const gradeData = Object.entries(byGrade).map(([name, value]) => ({ name, value })).sort((a,b) => a.name.localeCompare(b.name));

        return { total, newCount, inProgress, resolved, typeData, statusData, teacherData, gradeData };

    }, [filteredReports, students, teachers]);

    const availableGrades = [...new Set(students.map(s => s.grade))];
    const availableGroups = [...new Set(students.map(s => s.group))];

    const guardianMetrics = useMemo(() => {
        const total = guardianReports.length;
        const last24h = guardianReports.filter(r => Date.now() - Date.parse(r.date) <= 24 * 60 * 60 * 1000).length;
        const avgDuration = total
            ? Math.round(
                guardianReports.reduce((acc, report) => acc + (report.voiceDurationSec ?? 0), 0) / total,
              )
            : 0;
        const byRole = guardianReports.reduce((acc, report) => {
            const role = report.createdBy?.role ?? "desconocido";
            acc[role] = (acc[role] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);
        const byRoleEntries = Object.entries(byRole).sort((a, b) => b[1] - a[1]);
        return { total, last24h, avgDuration, byRoleEntries };
    }, [guardianReports]);

  return (
    <div className="space-y-6">
       <h2 className="text-2xl font-bold flex items-center text-gray-800 dark:text-white">
            Panel de Coordinación y Dirección
        </h2>
      
      {/* Filters */}
      <div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow-md flex flex-wrap items-center gap-4">
        <h3 className="font-semibold mr-2">Filtros:</h3>
        <select onChange={(e) => setGradeFilter(e.target.value)} value={gradeFilter} className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white">
            <option value="all">Todos los Grados</option>
            {availableGrades.map(g => <option key={g} value={g}>{g}</option>)}
        </select>
         <select onChange={(e) => setGroupFilter(e.target.value)} value={groupFilter} className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white">
            <option value="all">Todos los Grupos</option>
            {availableGroups.map(g => <option key={g} value={g}>{g}</option>)}
        </select>
        <select onChange={(e) => setStudentFilter(e.target.value)} value={studentFilter} className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white">
            <option value="all">Todos los Alumnos</option>
            {students.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
      </div>

      {showGuardianModule ? (
        <section className="bg-white dark:bg-gray-900 rounded-xl shadow p-6 space-y-4">
          <header className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 uppercase tracking-wide">Ángel Guardián</p>
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">Indicadores globales</h3>
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {guardianMetrics.total} reportes · {guardianMetrics.last24h} últimas 24h
            </div>
          </header>
          {guardianLoading ? (
            <p className="text-sm text-gray-500">Sincronizando registros...</p>
          ) : guardianError ? (
            <p className="text-sm text-red-500">{guardianError}</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-4">
                  <p className="text-xs text-gray-500 uppercase">Duración media</p>
                  <p className="text-2xl font-semibold text-gray-800 dark:text-gray-100">
                    {guardianMetrics.avgDuration} s
                  </p>
                </div>
                <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-4">
                  <p className="text-xs text-gray-500 uppercase">Reportes por rol</p>
                  <ul className="space-y-1 text-sm text-gray-700 dark:text-gray-200">
                    {guardianMetrics.byRoleEntries.map(([role, count]) => (
                      <li key={`guardian-role-${role}`} className="flex justify-between">
                        <span>{role}</span>
                        <span className="font-semibold">{count}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
              <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-4">
                <p className="text-xs text-gray-500 uppercase mb-2">Últimos registros</p>
                <ul className="space-y-2 max-h-64 overflow-y-auto pr-2">
                  {guardianReports.slice(0, 6).map((report) => (
                    <li key={`guardian-dashboard-${report.id}`} className="text-sm border-b border-gray-100 dark:border-gray-800 pb-1">
                      <p className="font-medium text-gray-800 dark:text-gray-100">{report.title}</p>
                      <p className="text-xs text-gray-500">
                        {report.createdBy?.role ?? "desconocido"} ·{" "}
                        {report.displayDate ?? new Date(report.date).toLocaleString("es-MX")}
                      </p>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </section>
      ) : null}

       {/* Stat Cards */}
       <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow text-center"><h4 className="font-semibold">Reportes Totales</h4><p className="text-3xl font-bold">{analyticsData.total}</p></div>
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow text-center"><h4 className="font-semibold">Nuevos</h4><p className="text-3xl font-bold text-blue-500">{analyticsData.newCount}</p></div>
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow text-center"><h4 className="font-semibold">En Progreso</h4><p className="text-3xl font-bold text-yellow-500">{analyticsData.inProgress}</p></div>
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow text-center"><h4 className="font-semibold">Resueltos</h4><p className="text-3xl font-bold text-green-500">{analyticsData.resolved}</p></div>
       </div>

       {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow h-80">
                <h4 className="font-semibold mb-2 text-center flex items-center justify-center"><ChartPieIcon className="h-5 w-5 mr-2"/>Reportes por Tipo</h4>
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie data={analyticsData.typeData} dataKey="value" nameKey="name" cx="50%" cy="45%" outerRadius={80} fill="#8884d8" label>
                             {analyticsData.typeData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                        </Pie>
                        <Tooltip />
                        <Legend />
                    </PieChart>
                </ResponsiveContainer>
            </div>
             <div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow h-80">
                <h4 className="font-semibold mb-2 text-center flex items-center justify-center"><ChartPieIcon className="h-5 w-5 mr-2"/>Reportes por Estado</h4>
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie data={analyticsData.statusData} dataKey="value" nameKey="name" cx="50%" cy="45%" outerRadius={80} fill="#82ca9d" label>
                            {analyticsData.statusData.map((entry, index) => <Cell key={`cell-${index}`} fill={STATUS_COLORS[index % STATUS_COLORS.length]} />)}
                        </Pie>
                        <Tooltip />
                        <Legend />
                    </PieChart>
                </ResponsiveContainer>
            </div>
             <div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow h-80 lg:col-span-2">
                <h4 className="font-semibold mb-2 text-center flex items-center justify-center"><ChartBarIcon className="h-5 w-5 mr-2"/>Incidencia por Docente</h4>
                <ResponsiveContainer width="100%" height="90%">
                    <BarChart data={analyticsData.teacherData} layout="vertical" margin={{ top: 5, right: 30, left: 50, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" />
                        <YAxis type="category" dataKey="name" width={120} />
                        <Tooltip />
                        <Bar dataKey="value" fill="#8884d8" />
                    </BarChart>
                </ResponsiveContainer>
            </div>
             <div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow h-80 lg:col-span-2">
                <h4 className="font-semibold mb-2 text-center flex items-center justify-center"><UsersIcon className="h-5 w-5 mr-2"/>Incidencia por Grado</h4>
                <ResponsiveContainer width="100%" height="90%">
                    <BarChart data={analyticsData.gradeData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="value" fill="#82ca9d" />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    </div>
  );
};

export default AdminDashboardView;
