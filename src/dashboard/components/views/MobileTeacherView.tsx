import React from 'react';
import { User } from '../../types';

interface MobileTeacherViewProps {
    currentUser: User;
}

const MobileTeacherView: React.FC<MobileTeacherViewProps> = ({ currentUser }) => {
    return (
        <div className="p-4 bg-gray-100 dark:bg-gray-900 min-h-screen">
            <h1 className="text-xl font-bold text-gray-800 dark:text-white mb-4">
                AtemiMX Mobile
            </h1>
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg text-center">
                <h2 className="text-lg font-semibold mb-2">
                    Vista Móvil en Desarrollo
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                    Hola, {currentUser.name}. La vista móvil optimizada para docentes está en construcción. Por favor, acceda desde una tablet o computadora de escritorio para una experiencia completa.
                </p>
            </div>
        </div>
    );
};

export default MobileTeacherView;
