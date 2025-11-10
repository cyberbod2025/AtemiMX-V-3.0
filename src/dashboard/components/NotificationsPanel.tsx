import React from 'react';
import { Notification } from '../types';
import { markNotificationAsRead } from '../services/mockDataService';
import { BellAlertIcon } from './icons/SolidIcons';

interface NotificationsPanelProps {
    notifications: Notification[];
    onClose: () => void;
    setNotifications: React.Dispatch<React.SetStateAction<Notification[]>>;
}

const NotificationsPanel: React.FC<NotificationsPanelProps> = ({ notifications, onClose, setNotifications }) => {

    const handleMarkAsRead = async (notificationId: string) => {
        const success = await markNotificationAsRead(notificationId);
        if (success) {
            setNotifications(prev => prev.map(n => n.id === notificationId ? { ...n, read: true } : n));
        }
    };

    return (
        <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 z-50">
            <div className="p-3 border-b border-gray-200 dark:border-gray-700">
                <h4 className="font-semibold text-gray-800 dark:text-white">Notificaciones</h4>
            </div>
            <div className="max-h-96 overflow-y-auto">
                {notifications.length > 0 ? (
                    notifications.map(notification => (
                        <div 
                            key={notification.id} 
                            className={`p-3 border-b border-gray-100 dark:border-gray-700 ${notification.read ? 'opacity-60' : ''}`}
                        >
                            <p className="text-sm text-gray-700 dark:text-gray-300">{notification.message}</p>
                            <div className="flex justify-between items-center mt-1">
                                <span className="text-xs text-gray-400">{new Date(notification.date).toLocaleString()}</span>
                                {!notification.read && (
                                    <button 
                                        onClick={() => handleMarkAsRead(notification.id)} 
                                        className="text-xs text-blue-500 hover:underline"
                                    >
                                        Marcar como leído
                                    </button>
                                )}
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="text-center p-6 text-sm text-gray-500">
                        No tienes notificaciones.
                    </div>
                )}
            </div>
        </div>
    );
};

export default NotificationsPanel;