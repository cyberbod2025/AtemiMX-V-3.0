import React, { useState, useCallback, useMemo, useEffect, Suspense, lazy } from 'react';
import DashboardLayout from './components/DashboardLayout';
import { User, UserRole } from './types';
import { MOCK_USERS } from './constants';
import useMediaQuery from './hooks/useMediaQuery';

const TeacherDashboardView = lazy(() => import('./components/views/TeacherDashboardView'));
const GuidanceInboxView = lazy(() => import('./components/views/GuidanceInboxView'));
const StudentProfileView = lazy(() => import('./components/views/StudentProfileView'));
const AdminDashboardView = lazy(() => import('./components/views/AdminDashboardView'));
const LiveAssistantView = lazy(() => import('./components/views/LiveAssistantView'));
const PrefectureDashboardView = lazy(() => import('./components/PrefectureDashboardView'));
const TutorDashboardView = lazy(() => import('./components/views/TutorDashboardView'));
const MobileTeacherView = lazy(() => import('./components/views/MobileTeacherView'));

export interface DashboardAppProps {
    users?: User[];
    defaultUserId?: string;
    defaultView?: string;
    onLogout?: () => void;
}

const App: React.FC<DashboardAppProps> = ({ users, defaultUserId, defaultView = 'teacher-dashboard', onLogout }) => {
    const userPool = useMemo(() => (users?.length ? users : MOCK_USERS), [users]);
    const initialUserId = defaultUserId ?? userPool[0]?.id;
    const [currentUserId, setCurrentUserId] = useState<string>(initialUserId);
    const [currentView, setCurrentView] = useState<string | null>(null);
    const [studentProfileId, setStudentProfileId] = useState<string | null>(null);

    const isMobile = useMediaQuery('(max-width: 768px)');
    
    useEffect(() => {
        if (defaultUserId) {
            setCurrentUserId(defaultUserId);
        }
    }, [defaultUserId]);

    useEffect(() => {
        if (defaultView) {
            setCurrentView(defaultView);
        }
    }, [defaultView]);

    const currentUser = userPool.find(u => u.id === currentUserId) || userPool[0];

    const handleUserChange = (userId: string) => {
        const user = userPool.find(u => u.id === userId);
        if (user) {
            setCurrentUserId(userId);
            switch (user.role) {
                case UserRole.Teacher:
                    setCurrentView('teacher-dashboard');
                    break;
                case UserRole.Guidance:
                    setCurrentView('guidance-inbox');
                    break;
                case UserRole.Admin:
                    setCurrentView('admin-dashboard');
                    break;
                case UserRole.Prefect:
                    setCurrentView('prefecture-dashboard');
                    break;
                case 'direccion':
                    setCurrentView('admin-dashboard');
                    break;
                default:
                    setCurrentView('teacher-dashboard');
            }
        }
    };

    useEffect(() => {
        if (currentUser) {
            handleUserChange(currentUser.id);
        }
    }, [currentUser]);

    const handleViewChange = (view: string) => {
        if (view.startsWith('student-profile:')) {
            const studentId = view.split(':')[1];
            setStudentProfileId(studentId);
            setCurrentView('student-profile');
        } else {
            setCurrentView(view);
            setStudentProfileId(null);
        }
    };
    
    const viewStudentProfile = useCallback((studentId: string) => {
        handleViewChange(`student-profile:${studentId}`);
    }, []);

    const renderView = () => {
        if (isMobile && currentUser.role === UserRole.Teacher) {
            return <MobileTeacherView currentUser={currentUser} />;
        }
        
        switch (currentView) {
            case 'teacher-dashboard':
                return <TeacherDashboardView currentUser={currentUser} viewStudentProfile={viewStudentProfile} />;
            case 'tutor-dashboard':
                return <TutorDashboardView currentUser={currentUser} viewStudentProfile={viewStudentProfile} />;
            case 'guidance-inbox':
                return <GuidanceInboxView currentUser={currentUser} viewStudentProfile={viewStudentProfile} />;
            case 'student-profile':
                if (studentProfileId) {
                    return <StudentProfileView studentId={studentProfileId} currentUser={currentUser} viewStudentProfile={viewStudentProfile} />;
                }
                return <div>Seleccione un alumno para ver su perfil.</div>;
            case 'admin-dashboard':
                return <AdminDashboardView currentUser={currentUser} />;
            case 'prefecture-dashboard':
                return <PrefectureDashboardView currentUser={currentUser} viewStudentProfile={viewStudentProfile} />;
            case 'live-assistant':
                return <LiveAssistantView />;
            default:
                return <div>Vista no encontrada</div>;
        }
    };

    return (
        <DashboardLayout
            currentUser={currentUser}
            currentView={currentView}
            onViewChange={handleViewChange}
            onUserChange={handleUserChange}
            allUsers={userPool}
            onLogout={onLogout}
        >
            <Suspense fallback={<div className="card">Cargando módulo...</div>}>
                {renderView()}
            </Suspense>
        </DashboardLayout>
    );
};

export default App;
