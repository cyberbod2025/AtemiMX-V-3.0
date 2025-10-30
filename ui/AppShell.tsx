import React, { useEffect, useState } from "react";

import { useAuth } from "../hooks/useAuth";
import Sase310Module from "../modules/sase310/Sase310Module";
import { logoutUser } from "../services/authService";
import { ErrorBoundary } from "./ErrorBoundary";
import { MainMenu } from "./MainMenu";
import { Sidebar } from "./Sidebar";
import { SplashScreen } from "./SplashScreen";
import "./styles/theme.css";

type ActiveView = "menu" | "sase310";

const getInitialView = (): ActiveView => {
  if (typeof window === "undefined") {
    return "menu";
  }
  return window.location.pathname === "/sase310" ? "sase310" : "menu";
};

const resolvePath = (view: ActiveView): string => (view === "sase310" ? "/sase310" : "/");

export const AppShell: React.FC = () => {
  const { user, loading } = useAuth();
  const [activeView, setActiveView] = useState<ActiveView>(() => getInitialView());
  const [minSplashElapsed, setMinSplashElapsed] = useState(false);
  const [forceHideSplash, setForceHideSplash] = useState(false);
  const [logoutPending, setLogoutPending] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  useEffect(() => {
    const minTimer = window.setTimeout(() => setMinSplashElapsed(true), 10000);
    const maxTimer = window.setTimeout(() => setForceHideSplash(true), 13000);
    return () => {
      window.clearTimeout(minTimer);
      window.clearTimeout(maxTimer);
    };
  }, []);

  useEffect(() => {
    if (!statusMessage) {
      return undefined;
    }
    const timeoutId = window.setTimeout(() => setStatusMessage(null), 4000);
    return () => window.clearTimeout(timeoutId);
  }, [statusMessage]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    const currentPath = window.location.pathname;
    if (currentPath === "/sase310") {
      if (user) {
        setActiveView("sase310");
      } else {
        setActiveView("menu");
        window.history.replaceState({}, "", "/");
      }
    }
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
    if (forceHideSplash && loading) {
      setStatusMessage("No pudimos confirmar la sesion. Intenta iniciar sesion desde el modulo SASE-310.");
    }
  }, [forceHideSplash, loading]);

  const handleSelectMenu = () => {
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

  const handleOpenHelp = () => {
    setStatusMessage("Consulta la documentacion AtemiMX o contacta al equipo para asistencia.");
  };

  const handleOpenSettings = () => {
    setStatusMessage("La configuracion personalizada estara disponible proximamente.");
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

  const showSplash = (!minSplashElapsed || loading) && !forceHideSplash;

  const renderContent = () => {
    if (activeView === "sase310") {
      return <Sase310Module onNavigateHome={handleSelectMenu} />;
    }
    return <MainMenu isAuthLoading={loading} onOpenSase={handleSelectSase} user={user} />;
  };

  return (
    <div className="app-shell">
      <div className="app-shell__background">
        <div className="app-shell__background-layer app-shell__background-layer--gradient" />
        <div className="app-shell__background-layer app-shell__background-layer--circuit" />
      </div>
      <div className="app-shell__layer">
        {showSplash ? (
          <SplashScreen />
        ) : (
          <div className="app-shell__layout">
            <Sidebar
              activeView={activeView}
              hasSession={Boolean(user)}
              logoutPending={logoutPending}
              onSelectHome={handleSelectMenu}
              onSelectSase={handleSelectSase}
              onOpenHelp={handleOpenHelp}
              onOpenSettings={handleOpenSettings}
              onLogout={handleLogout}
            />
            <main className="app-shell__main">
              {statusMessage ? <div className="app-shell__notice">{statusMessage}</div> : null}
              <ErrorBoundary>
                <div className="app-shell__content">{renderContent()}</div>
              </ErrorBoundary>
            </main>
          </div>
        )}
      </div>
    </div>
  );
};

export default AppShell;


