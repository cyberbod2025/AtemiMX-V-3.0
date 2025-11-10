import React, { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import NotificationsPanel from './NotificationsPanel';
import { User, Notification as NotificationType } from '../types';
import { VIEW_TITLES } from '../constants';
import { getNotificationsForUser } from '../services/mockDataService';
import { Bars3Icon, BellIcon } from './icons/SolidIcons';

interface DashboardLayoutProps {
  children: React.ReactNode;
  currentUser: User;
  currentView: string;
  onViewChange: (view: string) => void;
  onUserChange: (userId: string) => void;
  allUsers: User[];
  onLogout?: () => void;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({
    children,
    currentUser,
    currentView,
    onViewChange,
    onUserChange,
    allUsers,
    onLogout,
}) => {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [notificationsOpen, setNotificationsOpen] = useState(false);
    const [notifications, setNotifications] = useState<NotificationType[]>([]);
    
    const title = VIEW_TITLES[currentView] || 'AtemiMX';

    useEffect(() => {
        const fetchNotifications = async () => {
            const userNotifications = await getNotificationsForUser(currentUser.id);
            setNotifications(userNotifications);
        };
        fetchNotifications();
    }, [currentUser.id]);

    const unreadCount = notifications.filter(n => !n.read).length;

    return (
        <div className="flex h-screen overflow-hidden">
            <Sidebar
                currentUser={currentUser}
                currentView={currentView}
                onViewChange={onViewChange}
                onUserChange={onUserChange}
                allUsers={allUsers}
                isOpen={sidebarOpen}
                setIsOpen={setSidebarOpen}
                onLogout={onLogout}
            />
            <div className="flex-1 flex flex-col overflow-y-auto">
                <header className="sticky top-0 bg-white dark:bg-gray-800 shadow-sm z-20">
                    <div className="px-4 sm:px-6 lg:px-8">
                        <div className="flex items-center justify-between h-16">
                            {/* Mobile menu button */}
                            <button
                                className="text-gray-500 hover:text-gray-600 md:hidden"
                                onClick={() => setSidebarOpen(!sidebarOpen)}
                                aria-label="Open sidebar"
                            >
                                <span className="sr-only">Open sidebar</span>
                                <Bars3Icon className="h-6 w-6"/>
                            </button>
                            {/* Header Title */}
                             <h1 className="text-lg font-semibold ml-2 md:ml-0">{title}</h1>

                            {/* Notifications Bell */}
                            <div className="relative">
                                <button
                                    className="p-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                                    onClick={() => setNotificationsOpen(prev => !prev)}
                                >
                                    {unreadCount > 0 && (
                                        <span className="absolute top-1 right-1 block h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-white dark:ring-gray-800"></span>
                                    )}
                                    <BellIcon className="h-6 w-6" />
                                </button>
                                {notificationsOpen && (
                                    <NotificationsPanel 
                                        notifications={notifications} 
                                        onClose={() => setNotificationsOpen(false)}
                                        setNotifications={setNotifications}
                                    />
                                )}
                            </div>
                        </div>
                    </div>
                </header>
                <main className="p-4 sm:p-6 lg:p-8 flex-1">
                    {children}
                </main>
            </div>
        </div>
    );
};

export default DashboardLayout;
