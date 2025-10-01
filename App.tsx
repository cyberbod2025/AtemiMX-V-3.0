import React, { useState, useEffect, useCallback } from 'react';
import OnboardingBubble from './OnboardingBubble';
import Dashboard from './Dashboard';
import NemViewer from './NemViewer';
import DossierExporter from './DossierExporter';
import Modules from './Modules';
import AngelGuardian from './AngelGuardian';
import AngelGuardianModal from './AngelGuardianModal';
import type { PerfilDocente } from './types';
import { getProfile, saveProfile } from './services/storageService';
import { AtemiLogo, GuardianIcon } from './constants';

type ActiveTab = 'dashboard' | 'nem' | 'modules' | 'guardian';

type NavItem = {
  tab: ActiveTab;
  label: string;
};

const NAV_ITEMS: ReadonlyArray<NavItem> = [
  // Tabs cubren las rutas principales de la experiencia docente.
  { tab: 'dashboard', label: 'Dashboard' },
  { tab: 'nem', label: 'Catálogo NEM' },
  { tab: 'modules', label: 'Módulos' },
  { tab: 'guardian', label: 'Reportes' },
];

type NavButtonProps = {
  tab: ActiveTab;
  label: string;
  isActive: boolean;
  onSelect: (tab: ActiveTab) => void;
};

const NavButton: React.FC<NavButtonProps> = ({ tab, label, isActive, onSelect }) => {
  const baseClasses = 'px-3 py-2 rounded-lg text-sm font-medium transition-colors hover:bg-white/10';
  const activeClasses = 'bg-[var(--accent-1)] text-[var(--txt-dark)] hover:bg-[var(--accent-1)/90]';
  const inactiveClasses = 'text-white/80 hover:text-white';

  return (
    <button
      type="button"
      onClick={() => onSelect(tab)}
      className={`${baseClasses} ${isActive ? activeClasses : inactiveClasses}`}
      aria-current={isActive ? 'page' : undefined}
    >
      {label}
    </button>
  );
};

const App: React.FC = () => {
  const [profile, setProfile] = useState<PerfilDocente | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [isLoading, setIsLoading] = useState(true);
  const [isGuardianModalOpen, setGuardianModalOpen] = useState(false);

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
    setShowOnboarding(true);
  }, []);

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen">Cargando...</div>;
  }

  const handleSelectTab = useCallback((tab: ActiveTab) => {
    setActiveTab(tab);
  }, []);

  const navItems = NAV_ITEMS;

  return (
    <div className="min-h-screen">
      {showOnboarding && <OnboardingBubble onComplete={handleOnboardingComplete} existingProfile={profile} />}
      
      {!showOnboarding && profile && (
        <div className="flex flex-col min-h-screen">
          <header
            className="sticky top-0 z-20"
            style={{
              backgroundColor: 'rgba(11, 11, 14, 0.75)',
              backdropFilter: 'blur(10px)',
              borderBottom: '1px solid var(--muted)',
            }}
          >
            <nav className="container">
              <div className="flex items-center justify-between h-16">
                <div className="flex items-center space-x-4">
                  <div className="w-8 h-8">{AtemiLogo}</div>
                  <span className="text-xl font-bold font-display">AtemiMX</span>
                </div>
                <div className="hidden sm:flex items-center space-x-4">
                  {navItems.map((item) => (
                    <NavButton
                      key={item.tab}
                      tab={item.tab}
                      label={item.label}
                      isActive={activeTab === item.tab}
                      onSelect={handleSelectTab}
                    />
                  ))}
                  <button onClick={handleReconfigure} className="px-3 py-2 rounded-lg text-sm font-medium hover:bg-white/10 transition-colors">Configuración</button>
                </div>
                <div className="sm:hidden">
                  {/* Mobile menu could be added here */}
                </div>
              </div>
            </nav>
          </header>

          <main className="flex-grow container py-8">
            <div className="mb-8">
              <h1 className="text-3xl font-bold font-display text-white">Bienvenido(a), {profile.nombre}</h1>
              <p className="text-gray-400">{profile.escuela} - Ciclo {profile.cicloEscolar}</p>
            </div>
            {activeTab === 'dashboard' && <Dashboard />}
            {activeTab === 'nem' && <NemViewer />}
            {activeTab === 'modules' && <Modules />}
            {activeTab === 'guardian' && <AngelGuardian />}
            
            <DossierExporter profile={profile} />
          </main>
          
          <button
            onClick={() => setGuardianModalOpen(true)}
            className="fixed bottom-6 right-6 w-16 h-16 bg-gradient-to-br from-[#C0C6CC] to-[#8a9199] text-white rounded-full shadow-lg hover:scale-110 transition-transform flex items-center justify-center z-30"
            aria-label="Activar Ángel Guardián"
            title="Ángel Guardián"
          >
            <GuardianIcon className="w-8 h-8" />
          </button>
          
          {isGuardianModalOpen && <AngelGuardianModal onClose={() => setGuardianModalOpen(false)} />}

          <footer className="text-center py-4 border-t border-[var(--muted)] text-xs text-gray-500">
            AtemiMX - Herramienta para la Nueva Escuela Mexicana
          </footer>
        </div>
      )}
    </div>
  );
};

export default App;
