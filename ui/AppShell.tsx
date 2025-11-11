import React, { Suspense, useEffect, useMemo, useState } from "react";

import { useAuth } from "../hooks/useAuth";
import { logoutUser } from "../services/authService";
import { ErrorBoundary } from "./ErrorBoundary";
import "./styles/theme.css";

const AdminPanel = React.lazy(() => import("../modules/sase310/auth/components/AdminPanel"));
const Sase310Module = React.lazy(() => import("../modules/sase310/Sase310Module"));
const Sidebar = React.lazy(() => import("./Sidebar"));
const AtemiDashboard = React.lazy(() => import("./AtemiDashboard"));
const GlobalMenuModal = React.lazy(() => import("./GlobalMenuModal"));
const PinPreferencesModal = React.lazy(() => import("./PinPreferencesModal"));
const SecurityPinScreen = React.lazy(() => import("./SecurityPinScreen"));
const IdeaIntro = React.lazy(() => import("./IdeaIntro"));

type ActiveView = "none" | "menu" | "sase310" | "admin";

const getInitialView = (): ActiveView => "menu";

const resolvePath = (view: ActiveView): string => {
  if (view === "sase310") {
    return "/sase310";
  }
  if (view === "admin") {
    return "/sase310/admin";
  }
  return "/";
};

export const AppShell: React.FC = () => {
  const { user, loading, claimsLoading, role, claimsError } = useAuth();
  const [activeView, setActiveView] = useState<ActiveView>(() => getInitialView());
  const [logoutPending, setLogoutPending] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [showSecurityPin, setShowSecurityPin] = useState(false);
  const [pinScreenMode, setPinScreenMode] = useState<"unlock" | "setup">("unlock");
  const [pinError, setPinError] = useState<string | null>(null);
  const [showGlobalMenu, setShowGlobalMenu] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(true);
  const [showIdeaIntro, setShowIdeaIntro] = useState(true);
  const [pinPreferencesOpen, setPinPreferencesOpen] = useState(false);
  const [pinEnabled, setPinEnabled] = useState(false);
  const [storedPin, setStoredPin] = useState<string | null>(null);
  const [requiresPinUnlock, setRequiresPinUnlock] = useState(false);

  const isAuthPending = loading || claimsLoading;
  const PIN_ENABLED_KEY = "atemi:pinEnabled";
  const PIN_VALUE_KEY = "atemi:pinValue";

  useEffect(() => {
    if (!statusMessage) {
      return undefined;
    }
    const timeoutId = window.setTimeout(() => setStatusMessage(null), 4000);
    return () => window.clearTimeout(timeoutId);
  }, [statusMessage]);

  useEffect(() => {
    if (claimsError) {
      setStatusMessage(claimsError);
    }
  }, [claimsError]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    const enabled = window.localStorage.getItem(PIN_ENABLED_KEY) === "true";
    const savedPin = window.localStorage.getItem(PIN_VALUE_KEY);
    if (enabled && savedPin) {
      setPinEnabled(true);
      setStoredPin(savedPin);
      setRequiresPinUnlock(true);
    }
  }, []);

  useEffect(() => {
    if (!requiresPinUnlock) {
      return;
    }
    setPinScreenMode("unlock");
    setPinError(null);
    setShowSecurityPin(true);
  }, [requiresPinUnlock]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    if (!user) {
      setActiveView("menu");
      if (window.location.pathname !== "/") {
        window.history.replaceState({}, "", "/");
      }
      return;
    }
    const currentPath = window.location.pathname;
    if (currentPath.startsWith("/sase310/admin")) {
      setActiveView("admin");
      return;
    }
    if (currentPath.startsWith("/sase310")) {
      setActiveView("sase310");
      return;
    }
    setActiveView("menu");
  }, [user]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    const desiredPath = resolvePath(activeView);
    if (window.location.pathname !== desiredPath) {
      window.history.replaceState({}, "", desiredPath);
    }
  }, [activeView]);

  useEffect(() => {
    if (typeof window === "undefined" || !isAuthPending) {
      return undefined;
    }
    const SPLASH_DEADLINE = 15000;
    const deadlineTimer = window.setTimeout(() => {
      setStatusMessage((current) => current ?? "No pudimos confirmar la sesion. Intenta iniciar sesion desde el modulo SASE-310.");
    }, SPLASH_DEADLINE);
    return () => window.clearTimeout(deadlineTimer);
  }, [isAuthPending]);

  useEffect(() => {
    if (!user && (activeView === "admin" || activeView === "sase310")) {
      setActiveView("menu");
    }
  }, [user, activeView]);

  const isAdmin = useMemo(() => (role ?? "").toLowerCase() === "admin", [role]);
  const isDashboardActive = activeView === "menu";

  const handleSelectMenu = () => {
    setActiveView("menu");
    if (typeof window !== "undefined") {
      window.history.replaceState({}, "", "/");
    }
  };

  const handleResetView = () => {
    setActiveView("menu");
    if (typeof window !== "undefined") {
      window.history.replaceState({}, "", "/");
    }
  };

  const handleSelectSase = () => {
    setActiveView("sase310");
    if (typeof window !== "undefined") {
      window.history.replaceState({}, "", "/sase310");
    }
  };

  const handleSelectAdmin = () => {
    if (!isAdmin) {
      setStatusMessage("No cuentas con permisos de administraciï¿½n para acceder a esta secciï¿½n.");
      handleSelectMenu();
      return;
    }
    setActiveView("admin");
    if (typeof window !== "undefined") {
      window.history.replaceState({}, "", "/sase310/admin");
    }
  };

  const handleOpenHelp = () => {
    setStatusMessage("Consulta la documentacion AtemiMX o contacta al equipo para asistencia.");
  };

  const handleOpenSettings = () => {
    setStatusMessage("La configuracion personalizada estara disponible proximamente.");
  };

  const handlePinSubmit = (value: string) => {
    if (pinScreenMode === "setup") {
      if (typeof window !== "undefined") {
        window.localStorage.setItem(PIN_VALUE_KEY, value);
        window.localStorage.setItem(PIN_ENABLED_KEY, "true");
      }
      setStoredPin(value);
      setPinEnabled(true);
      setPinError(null);
      setShowSecurityPin(false);
      setPinScreenMode("unlock");
      setStatusMessage("PIN configurado correctamente.");
      return;
    }
    if (storedPin && value === storedPin) {
      setRequiresPinUnlock(false);
      setShowSecurityPin(false);
      setPinError(null);
      return;
    }
    setPinError("PIN incorrecto. Intenta nuevamente.");
  };

  const handleDisablePin = () => {
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(PIN_VALUE_KEY);
      window.localStorage.removeItem(PIN_ENABLED_KEY);
    }
    setStoredPin(null);
    setPinEnabled(false);
    setRequiresPinUnlock(false);
    setPinPreferencesOpen(false);
    setStatusMessage("PIN desactivado.");
  };

  const handleRequestPinSetup = () => {
    setPinPreferencesOpen(false);
    setPinScreenMode("setup");
    setPinError(null);
    setShowSecurityPin(true);
  };

  const handleShowGlobalMenu = () => {
    setShowGlobalMenu(true);
  };

  const handleToggleSidebar = () => {
    setIsSidebarCollapsed((prev) => !prev);
  };

  const handleOpenPinPreferences = () => {
    setPinPreferencesOpen(true);
  };

  const handleLogout = async () => {
    if (logoutPending) {
      return;
    }
    try {
      setLogoutPending(true);
      await logoutUser();
      setStatusMessage("Sesion finalizada correctamente.");
    } catch (error) {
      console.error("[UI] Error al cerrar sesion", error);
      setStatusMessage("No fue posible cerrar sesion. Intenta nuevamente.");
    } finally {
      setLogoutPending(false);
      handleSelectMenu();
    }
  };

  const renderEmptyState = (message: string) => (
    <section className="empty-state">
      <p className="empty-state__eyebrow">AtemiMX</p>
      <h2>{message}</h2>
      <p>Usa el menú lateral para abrir módulos o lanzar el menú flotante.</p>
    </section>
  );

  const renderLoader = (message: string) => (
    <div className="app-shell__loader" role="status" aria-live="polite">
      {message}
    </div>
  );

  const renderContent = () => {
    if (activeView === "none") {
      return renderEmptyState("Elige un módulo para comenzar");
    }
    if (activeView === "admin") {
      if (!user || !isAdmin) {
        return (
          <section className="card">
            <h2 className="text-lg font-display text-white">Acceso restringido</h2>
            <p className="text-sm text-gray-400">
              Necesitas permisos de administración para ingresar a este panel.
            </p>
          </section>
        );
      }
      return (
        <Suspense fallback={renderLoader("Abriendo panel administrativo...")}>
          <AdminPanel />
        </Suspense>
      );
    }
    if (activeView === "sase310") {
      return (
        <Suspense fallback={renderLoader("Cargando módulo SASE-310...")}>
          <Sase310Module onNavigateHome={handleSelectMenu} />
        </Suspense>
      );
    }
    return renderEmptyState("Panel principal disponible desde el menú general");
  };



  const renderLegacyShell = () => (
    <div className="app-shell__layer">
      <div className="app-shell__layout">
        <Suspense fallback={renderLoader("Cargando navegación principal...")}>
          <Sidebar
            activeView={activeView}
            hasSession={Boolean(user)}
            logoutPending={logoutPending}
            onSelectHome={handleSelectMenu}
            onResetView={handleResetView}
            onSelectSase={handleSelectSase}
            onSelectAdmin={handleSelectAdmin}
            onOpenHelp={handleOpenHelp}
            onOpenSettings={handleOpenSettings}
            onLogout={handleLogout}
            canAccessAdmin={Boolean(user && isAdmin)}
            onOpenLauncher={handleShowGlobalMenu}
            onToggleCollapse={handleToggleSidebar}
            isCollapsed={isSidebarCollapsed}
          />
        </Suspense>
        <main className="app-shell__main">
          {statusMessage ? <div className="app-shell__notice">{statusMessage}</div> : null}
          <ErrorBoundary>
            <div className="app-shell__content">{renderContent()}</div>
          </ErrorBoundary>
        </main>
      </div>
    </div>
  );

  const renderDashboardShell = () => (
    <div className="dashboard-wrapper">
      {statusMessage ? <div className="app-shell__notice dashboard-wrapper__notice">{statusMessage}</div> : null}
      <Suspense fallback={renderLoader("Cargando panel AtemiMX...")}>
        <AtemiDashboard user={user} role={role ?? null} onLogout={handleLogout} />
      </Suspense>
    </div>
  );

  return (
    <div className={`app-shell${isDashboardActive ? " app-shell--dashboard" : ""}`}>
      {isDashboardActive ? renderDashboardShell() : renderLegacyShell()}
      <Suspense fallback={null}>
        <SecurityPinScreen
          open={showSecurityPin}
          mode={pinScreenMode}
          errorMessage={pinError}
          onCancel={() => {
            setShowSecurityPin(false);
            if (requiresPinUnlock) {
              setShowSecurityPin(true);
            }
          }}
          onSubmit={handlePinSubmit}
        />
      </Suspense>
      <Suspense fallback={null}>
        <GlobalMenuModal
          open={showGlobalMenu}
          onClose={() => setShowGlobalMenu(false)}
          onOpenSase={() => {
            setShowGlobalMenu(false);
            handleSelectSase();
          }}
          onShowSecurity={() => {
            setShowGlobalMenu(false);
            handleOpenPinPreferences();
          }}
          variant="floating"
          user={user}
        />
      </Suspense>
      <Suspense fallback={null}>
        <PinPreferencesModal
          open={pinPreferencesOpen}
          pinEnabled={pinEnabled}
          onRequestSetup={handleRequestPinSetup}
          onDisable={handleDisablePin}
          onClose={() => setPinPreferencesOpen(false)}
        />
      </Suspense>
      {showIdeaIntro ? (
        <Suspense fallback={null}>
          <IdeaIntro onStart={() => setShowIdeaIntro(false)} />
        </Suspense>
      ) : null}
    </div>
  );
};

export default AppShell;



