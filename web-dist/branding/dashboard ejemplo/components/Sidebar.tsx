import React, { useState, Fragment } from 'react';
import { Transition } from '@headlessui/react';
import { User, UserRole } from '../types';
import { AtemiMXLogo } from './icons/AtemiMXLogo';
import {
    HomeIcon,
    InboxStackIcon,
    UserCircleIcon,
    Cog6ToothIcon,
    ChatBubbleLeftRightIcon,
    ArrowLeftOnRectangleIcon,
    ChevronDownIcon,
    UsersIcon,
    // FIX: Added AcademicCapIcon to the import list.
    AcademicCapIcon
} from './icons/SolidIcons';
import useMediaQuery from '../hooks/useMediaQuery';

interface SidebarProps {
    currentUser: User;
    currentView: string;
    onViewChange: (view: string) => void;
    onUserChange: (userId: string) => void;
    allUsers: User[];
    isOpen: boolean;
    setIsOpen: (isOpen: boolean) => void;
}

const getNavItems = (user: User) => {
    switch (user.role) {
        case UserRole.Teacher:
            const navItems = [
                { id: 'teacher-dashboard', label: 'Mi Panel', icon: HomeIcon },
            ];
            if (user.tutorOfGroup) {
                 navItems.push({ id: 'tutor-dashboard', label: 'Panel de Tutoría', icon: AcademicCapIcon });
            }
            navItems.push({ id: 'live-assistant', label: 'Asistente IA', icon: ChatBubbleLeftRightIcon });
            return navItems;
        case UserRole.Guidance:
            return [
                { id: 'guidance-inbox', label: 'Bandeja', icon: InboxStackIcon },
                { id: 'live-assistant', label: 'Asistente IA', icon: ChatBubbleLeftRightIcon },
            ];
        case UserRole.Admin:
             return [
                { id: 'admin-dashboard', label: 'Análisis y Control', icon: Cog6ToothIcon },
                { id: 'guidance-inbox', label: 'Bandeja General', icon: InboxStackIcon },
                { id: 'prefecture-dashboard', label: 'Vista Prefectura', icon: UsersIcon },
            ];
        case UserRole.Prefect:
             return [
                { id: 'prefecture-dashboard', label: 'Panel de Asistencia', icon: UsersIcon },
                { id: 'guidance-inbox', label: 'Bandeja General', icon: InboxStackIcon },
            ];
        default:
            return [];
    }
};

const Sidebar: React.FC<SidebarProps> = ({ currentUser, currentView, onViewChange, onUserChange, allUsers, isOpen, setIsOpen }) => {
    const [userDropdownOpen, setUserDropdownOpen] = useState(false);
    const navItems = getNavItems(currentUser);
    const isMobile = useMediaQuery('(max-width: 767px)');

    const handleUserSelect = (userId: string) => {
        onUserChange(userId);
        setUserDropdownOpen(false);
    };

    const handleViewChange = (view: string) => {
        onViewChange(view);
        if (isMobile) {
            setIsOpen(false);
        }
    };

    const SidebarContent = () => (
        <div className="flex flex-col h-full bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 shadow-lg">
            {/* Header */}
            <div className="flex items-center justify-center h-16 border-b dark:border-gray-700">
                <AtemiMXLogo className="h-8 w-auto" />
            </div>

            {/* User Profile / Switcher */}
            <div className="p-4 border-b dark:border-gray-700">
                <div className="relative">
                    <button
                        onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                        className="w-full flex items-center justify-between text-left p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                        <div className="flex items-center">
                            <UserCircleIcon className="h-10 w-10 text-blue-500" />
                            <div className="ml-3">
                                <p className="font-semibold text-sm">{currentUser.name}</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">{currentUser.role}{currentUser.tutorOfGroup && ` (Tutor ${currentUser.tutorOfGroup.grade}°${currentUser.tutorOfGroup.group})`}</p>
                            </div>
                        </div>
                        <ChevronDownIcon className={`h-5 w-5 transition-transform ${userDropdownOpen ? 'rotate-180' : ''}`} />
                    </button>
                    {userDropdownOpen && (
                        <div className="absolute z-10 mt-2 w-full bg-white dark:bg-gray-900 rounded-md shadow-lg border dark:border-gray-700">
                            {allUsers.map(user => (
                                <button
                                    key={user.id}
                                    onClick={() => handleUserSelect(user.id)}
                                    className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800"
                                >
                                    {user.name} ({user.role})
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 p-4 space-y-2">
                {navItems.map(item => (
                    <button
                        key={item.id}
                        onClick={() => handleViewChange(item.id)}
                        className={`w-full flex items-center p-3 rounded-lg transition-colors ${
                            currentView === item.id
                                ? 'bg-blue-600 text-white'
                                : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                        }`}
                    >
                        <item.icon className="h-6 w-6 mr-3" />
                        <span className="font-medium">{item.label}</span>
                    </button>
                ))}
            </nav>

            {/* Footer */}
            <div className="p-4 border-t dark:border-gray-700">
                <button className="w-full flex items-center p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
                    <ArrowLeftOnRectangleIcon className="h-6 w-6 mr-3" />
                    <span className="font-medium">Cerrar Sesión</span>
                </button>
            </div>
        </div>
    );
    
     if (isMobile) {
        return (
            <Transition.Root show={isOpen} as={Fragment}>
                <div>
                    <Transition.Child
                        as={Fragment}
                        enter="transition-opacity ease-linear duration-300"
                        enterFrom="opacity-0"
                        enterTo="opacity-100"
                        leave="transition-opacity ease-linear duration-300"
                        leaveFrom="opacity-100"
                        leaveTo="opacity-0"
                    >
                        <div className="fixed inset-0 bg-gray-600 bg-opacity-75 z-30" onClick={() => setIsOpen(false)} />
                    </Transition.Child>

                    <Transition.Child
                        as={Fragment}
                        enter="transition ease-in-out duration-300 transform"
                        enterFrom="-translate-x-full"
                        enterTo="translate-x-0"
                        leave="transition ease-in-out duration-300 transform"
                        leaveFrom="translate-x-0"
                        leaveTo="-translate-x-full"
                    >
                        <div className="fixed inset-y-0 left-0 flex w-64 z-40">
                             <SidebarContent />
                        </div>
                    {/* FIX: Corrected unclosed tag that was causing a syntax error. */}
                    </Transition.Child>
                </div>
            </Transition.Root>
        );
     }
    
    return (
        <div className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0">
            <SidebarContent />
        </div>
    );
};

// FIX: Added default export to align with project conventions and fix import errors.
export default Sidebar;
