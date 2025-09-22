import React, { useState, useEffect, useCallback } from 'react';
import OnboardingBubble from './OnboardingBubble';
import Dashboard from './Dashboard';
import NemViewer from './NemViewer';
import DossierExporter from './DossierExporter';
import Modules from './Modules';
import type { PerfilDocente } from './types';
import { getProfile, saveProfile, clearProfile } from './services/storageService';
import { AtemiLogo } from './constants';

type ActiveTab = 'dashboard' | 'nem' | 'modules';

const App: React.FC = () => {
  const [profile, setProfile] = useState<PerfilDocente | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const existingProfile = getProfile();
    if (existingProfile) {
      setProfile(existingProfile);
    } else {
      setShowOnboarding(true);
    }
    setIsLoading(false);
  }, []);

  const handleOnboardingComplete = (newProfile: PerfilDocente) => {
    saveProfile(newProfile);
    setProfile(newProfile);
    setShowOnboarding(false);
    setActiveTab('dashboard');
  };

  const handleReconfigure = useCallback(() => {
    // Optional: clear profile if re-configuring from scratch
    // clearProfile(); 
    setShowOnboarding(true);
  }, []);

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen">Cargando...</div>;
  }

  const NavButton: React.FC<{tab: ActiveTab, label: string}> = ({tab, label}) => (
     <button 
        onClick={() => setActiveTab(tab)} 
        className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === tab ? 'bg-[#39FF14] text-black' : 'hover:bg-white/10'}`}>
        {label}
      </button>
  );

  return (
    <div className="min-h-screen">
      {showOnboarding && <OnboardingBubble onComplete={handleOnboardingComplete} existingProfile={profile} />}
      
      {!showOnboarding && profile && (
        <div className="flex flex-col min-h-screen">
          <header className="sticky top-0 z-20" style={{backgroundColor: 'rgba(10, 10, 10, 0.5)', backdropFilter: 'blur(10px)', borderBottom: '1px solid rgba(138, 21, 56, 0.3)'}}>
            <nav className="container">
              <div className="flex items-center justify-between h-16">
                <div className="flex items-center space-x-4">
                   <div className="w-8 h-8">{AtemiLogo}</div>
                   <span className="text-xl font-bold">AtemiMX</span>
                </div>
                <div className="hidden sm:flex items-center space-x-4">
                  <NavButton tab="dashboard" label="Dashboard" />
                  <NavButton tab="nem" label="Catálogo NEM" />
                  <NavButton tab="modules" label="Módulos" />
                  <button onClick={handleReconfigure} className="px-3 py-2 rounded-md text-sm font-medium hover:bg-white/10 transition-colors">Configuración</button>
                </div>
                <div className="sm:hidden">
                  {/* Mobile menu could be added here */}
                </div>
              </div>
            </nav>
          </header>

          <main className="flex-grow container py-8">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-white">Bienvenido(a), {profile.nombre}</h1>
                <p className="text-gray-400">{profile.escuela} - Ciclo {profile.cicloEscolar}</p>
            </div>
            {activeTab === 'dashboard' && <Dashboard />}
            {activeTab === 'nem' && <NemViewer />}
            {activeTab === 'modules' && <Modules />}
            
            <DossierExporter profile={profile} />
          </main>

          <footer className="text-center py-4 border-t border-[#8A1538]/30 text-xs text-gray-500">
            AtemiMX Burbuja - Herramienta para la Nueva Escuela Mexicana
          </footer>
        </div>
      )}
    </div>
  );
};

export default App;
