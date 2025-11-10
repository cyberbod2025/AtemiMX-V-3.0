import React, { useState, useCallback } from 'react';
import DashboardLayout from './components/DashboardLayout';
import TeacherDashboardView from './components/views/TeacherDashboardView';
import GuidanceInboxView from './components/views/GuidanceInboxView';
import StudentProfileView from './components/views/StudentProfileView';
import AdminDashboardView from './components/views/AdminDashboardView';
import LiveAssistantView from './components/views/LiveAssistantView';
import PrefectureDashboardView from './components/PrefectureDashboardView';
import TutorDashboardView from './components/views/TutorDashboardView';
import MobileTeacherView from './components/views/MobileTeacherView';
import { User, UserRole } from './types';
import { MOCK_USERS } from './constants';
import useMediaQuery from './hooks/useMediaQuery';

const App: React.FC = () => {
    const [currentUserId, setCurrentUserId] = useState<string>(MOCK_USERS[0].id);
    const [currentView, setCurrentView] = useState('teacher-dashboard');
    const [studentProfileId, setStudentProfileId] = useState<string | null>(null);

    const isMobile = useMediaQuery('(max-width: 768px)');
    
    const currentUser = MOCK_USERS.find(u => u.id === currentUserId) || MOCK_USERS[0];

    const handleUserChange = (userId: string) => {
        const user = MOCK_USERS.find(u => u.id === userId);
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
                default:
                    setCurrentView('teacher-dashboard');
            }
        }
    };

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
            allUsers={MOCK_USERS}
        >
            {renderView()}
        </DashboardLayout>
    );
};

export default App;