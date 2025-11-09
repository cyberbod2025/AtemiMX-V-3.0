import React, { useEffect, useMemo, useState } from "react";

import { useAuth } from "../hooks/useAuth";
import AdminPanel from "../modules/sase310/auth/components/AdminPanel";
import Sase310Module from "../modules/sase310/Sase310Module";
import { logoutUser } from "../services/authService";
import { ErrorBoundary } from "./ErrorBoundary";
import { GlobalMenuModal } from "./GlobalMenuModal";
import { MainMenu } from "./MainMenu";
import { Sidebar } from "./Sidebar";
import { SecurityPinScreen } from "./SecurityPinScreen";
import "./styles/theme.css";

type ActiveView = "menu" | "sase310" | "admin";

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
  const [showGlobalMenu, setShowGlobalMenu] = useState(false);

  const isAuthPending = loading || claimsLoading;

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
    if (!user && activeView === "admin") {
      setActiveView("menu");
    }
  }, [user, activeView]);

  const isAdmin = useMemo(() => (role ?? "").toLowerCase() === "admin", [role]);

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

  const handleSelectAdmin = () => {
    if (!isAdmin) {
      setStatusMessage("No cuentas con permisos de administraci�n para acceder a esta secci�n.");
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

  const handleShowSecurityPin = () => {
    setShowSecurityPin(true);
  };

  const handleShowGlobalMenu = () => {
    setShowGlobalMenu(true);
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

  const renderContent = () => {
    if (activeView === "admin") {
      if (!user || !isAdmin) {
        return (
          <section className="card">
            <h2 className="text-lg font-display text-white">Acceso restringido</h2>
            <p className="text-sm text-gray-400">
              Necesitas permisos de administraci�n para ingresar a este panel.
            </p>
          </section>
        );
      }
      return <AdminPanel />;
    }
    if (activeView === "sase310") {
      return <Sase310Module onNavigateHome={handleSelectMenu} />;
    }
    return (
      <MainMenu
        isAuthLoading={isAuthPending}
        onOpenSase={handleSelectSase}
        onShowSecurity={handleShowSecurityPin}
        onShowGlobalMenu={handleShowGlobalMenu}
        user={user}
      />
    );
  };

  return (
    <div className="app-shell">
      <div className="app-shell__layer">
        <div className="app-shell__layout">
          <Sidebar
            activeView={activeView}
            hasSession={Boolean(user)}
            logoutPending={logoutPending}
            onSelectHome={handleSelectMenu}
            onSelectSase={handleSelectSase}
            onSelectAdmin={handleSelectAdmin}
            onOpenHelp={handleOpenHelp}
            onOpenSettings={handleOpenSettings}
            onLogout={handleLogout}
            canAccessAdmin={Boolean(user && isAdmin)}
          />
          <main className="app-shell__main">
            {statusMessage ? <div className="app-shell__notice">{statusMessage}</div> : null}
            <ErrorBoundary>
              <div className="app-shell__content">{renderContent()}</div>
            </ErrorBoundary>
          </main>
        </div>
      </div>
      <SecurityPinScreen
        open={showSecurityPin}
        onCancel={() => setShowSecurityPin(false)}
        onAuthenticate={() => {
          setStatusMessage("PIN demo capturado correctamente.");
          setShowSecurityPin(false);
        }}
      />
      <GlobalMenuModal
        open={showGlobalMenu}
        onClose={() => setShowGlobalMenu(false)}
        onOpenSase={() => {
          setShowGlobalMenu(false);
          handleSelectSase();
        }}
        onShowSecurity={() => {
          setShowGlobalMenu(false);
          handleShowSecurityPin();
        }}
        user={user}
      />
    </div>
  );
};

export default AppShell;



