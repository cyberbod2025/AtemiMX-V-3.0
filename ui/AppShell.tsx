import React, { useEffect, useMemo, useState } from "react";

import { useAuth } from "../hooks/useAuth";
import AdminPanel from "../modules/sase310/auth/components/AdminPanel";
import Sase310Module from "../modules/sase310/Sase310Module";
import { logoutUser } from "../services/authService";
import { applyRoleTheme } from "@/services/authRole";
import { ErrorBoundary } from "./ErrorBoundary";
import { MainMenu } from "./MainMenu";
import { Sidebar } from "./Sidebar";
import { SplashScreen } from "./SplashScreen";
import "./styles/theme.css";

type ActiveView = "menu" | "sase310" | "admin";

const getInitialView = (): ActiveView => {
  if (typeof window === "undefined") {
    return "menu";
  }
  if (window.location.pathname.startsWith("/sase310/admin")) {
    return "admin";
  }
  return window.location.pathname === "/sase310" ? "sase310" : "menu";
};

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
  const { user, loading } = useAuth();
  const [activeView, setActiveView] = useState<ActiveView>(() => getInitialView());
  const [minSplashElapsed, setMinSplashElapsed] = useState(false);
  const [splashDeadlineElapsed, setSplashDeadlineElapsed] = useState(false);
  const [logoutPending, setLogoutPending] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [roleClaim, setRoleClaim] = useState<string | null>(null);
  const [claimsLoading, setClaimsLoading] = useState(false);

  const isAuthPending = loading || claimsLoading;

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    if (!isAuthPending) {
      setMinSplashElapsed(true);
      setSplashDeadlineElapsed(true);
      return;
    }
    setMinSplashElapsed(false);
    setSplashDeadlineElapsed(false);
    const minTimer = window.setTimeout(() => setMinSplashElapsed(true), 1500);
    const deadlineTimer = window.setTimeout(() => setSplashDeadlineElapsed(true), 8000);
    return () => {
      window.clearTimeout(minTimer);
      window.clearTimeout(deadlineTimer);
    };
  }, [isAuthPending]);

  useEffect(() => {
    if (!statusMessage) {
      return undefined;
    }
    const timeoutId = window.setTimeout(() => setStatusMessage(null), 4000);
    return () => window.clearTimeout(timeoutId);
  }, [statusMessage]);

  useEffect(() => {
    let cancelled = false;
    if (!user) {
      setRoleClaim(null);
      setClaimsLoading(false);
      return () => {
        cancelled = true;
      };
    }

    setClaimsLoading(true);
    void user
      .getIdTokenResult(true)
      .then((token) => {
        if (!cancelled) {
          const nextRole = typeof token.claims.role === "string" ? (token.claims.role as string) : null;
          setRoleClaim(nextRole);
        }
      })
      .catch((error) => {
        console.error("[UI] No fue posible recuperar los claims del usuario", error);
        if (!cancelled) {
          setStatusMessage("No pudimos recuperar tus permisos. Intenta volver a iniciar sesi�n.");
        }
      })
      .finally(() => {
        if (!cancelled) {
          setClaimsLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [user]);

  useEffect(() => {
    applyRoleTheme(roleClaim);
    return () => {
      applyRoleTheme(null);
    };
  }, [roleClaim]);

  useEffect(() => {
    if (typeof window === "undefined") {
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
    if (currentPath === "/") {
      setActiveView("menu");
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
    if (splashDeadlineElapsed && isAuthPending) {
      setStatusMessage("No pudimos confirmar la sesion. Intenta iniciar sesion desde el modulo SASE-310.");
    }
  }, [isAuthPending, splashDeadlineElapsed]);

  useEffect(() => {
    if (!user && activeView === "admin") {
      setActiveView("menu");
    }
  }, [user, activeView]);

  const isAdmin = useMemo(() => roleClaim === "admin", [roleClaim]);

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

  const splashMessage = useMemo(() => {
    if (!minSplashElapsed) {
      return "Preparando experiencia AtemiMX...";
    }
    if (claimsLoading) {
      return "Sincronizando permisos docentes...";
    }
    if (loading) {
      return user ? "Cargando tu perfil SASE-310..." : "Inicializando entorno seguro...";
    }
    return "Listo para iniciar.";
  }, [claimsLoading, loading, minSplashElapsed, user]);

  const splashStatusHint = useMemo(() => {
    if (!user?.email) {
      return null;
    }
    if (claimsLoading) {
      return `Cuenta institucional: ${user.email}`;
    }
    if (loading) {
      return `Iniciando sesion para ${user.email}`;
    }
    return null;
  }, [claimsLoading, loading, user]);

  const showSplash = (!minSplashElapsed || (isAuthPending && !splashDeadlineElapsed));

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
    return <MainMenu isAuthLoading={isAuthPending} onOpenSase={handleSelectSase} user={user} />;
  };

  return (
    <div className="app-shell">
      <div className="app-shell__layer">
        {showSplash ? (
          <SplashScreen message={splashMessage} statusHint={splashStatusHint} />
        ) : (
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
        )}
      </div>
    </div>
  );
};

export default AppShell;



