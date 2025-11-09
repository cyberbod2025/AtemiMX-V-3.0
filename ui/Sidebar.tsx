import React from "react";
import {
  CalendarClock,
  ChevronsLeft,
  ChevronsRight,
  HelpCircle,
  LayoutDashboard,
  LogOut,
  Menu,
  Notebook,
  Settings,
  ShieldCheck,
  Users2,
} from "lucide-react";

type ActiveView = "none" | "menu" | "sase310" | "admin";

interface SidebarProps {
  activeView: ActiveView;
  hasSession: boolean;
  logoutPending?: boolean;
  onSelectHome: () => void;
  onResetView: () => void;
  onSelectSase: () => void;
  onSelectAdmin: () => void;
  onOpenHelp: () => void;
  onOpenSettings: () => void;
  onLogout: () => void;
  canAccessAdmin?: boolean;
  onOpenLauncher: () => void;
  onToggleCollapse: () => void;
  isCollapsed: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeView,
  hasSession,
  logoutPending = false,
  onSelectHome,
  onResetView,
  onSelectSase,
  onSelectAdmin,
  onOpenHelp,
  onOpenSettings,
  onLogout,
  canAccessAdmin = false,
  onOpenLauncher,
  onToggleCollapse,
  isCollapsed,
}) => {
  return (
    <aside className={`sidebar ${isCollapsed ? "sidebar--collapsed" : ""}`}>
      <div>
        <div className="sidebar__brand-row">
          <button
            type="button"
            className="sidebar__collapse"
            onClick={onToggleCollapse}
            aria-label={isCollapsed ? "Expandir panel lateral" : "Contraer panel lateral"}
          >
            {isCollapsed ? <ChevronsRight size={18} aria-hidden /> : <ChevronsLeft size={18} aria-hidden />}
          </button>
          <button
            type="button"
            className="sidebar__brand"
            onClick={onResetView}
            aria-label="Volver al panel base AtemiMX"
          >
            <span className="sidebar__brand-text">
              <span className="sidebar__brand-accent">Atemi</span>MX
            </span>
            <span className="sidebar__brand-badge">v3.6</span>
          </button>
        </div>
        <nav className="sidebar__nav">
          <button
            type="button"
            className="sidebar__nav-item"
            onClick={onOpenLauncher}
            aria-label="Abrir menú general AtemiMX"
          >
            <Menu size={18} aria-hidden />
            <span>Menú general</span>
          </button>
          <button
            type="button"
            className={`sidebar__nav-item ${activeView === "menu" ? "is-active" : ""}`}
            onClick={onSelectHome}
            aria-label="Panel principal AtemiMX"
          >
            <LayoutDashboard size={18} aria-hidden />
            <span>Panel principal</span>
          </button>
          <button type="button" className="sidebar__nav-item is-disabled" disabled>
            <Notebook size={18} aria-hidden />
            <span>Cuaderno</span>
            <span className="sidebar__pill">Pronto</span>
          </button>
          <button type="button" className="sidebar__nav-item is-disabled" disabled>
            <CalendarClock size={18} aria-hidden />
            <span>Planeaciones</span>
            <span className="sidebar__pill">Pronto</span>
          </button>
          <button
            type="button"
            className={`sidebar__nav-item ${activeView === "sase310" ? "is-active" : ""}`}
            onClick={onSelectSase}
            aria-label="Ir al módulo SASE-310"
          >
            <ShieldCheck size={18} aria-hidden />
            <span>SASE-310</span>
            {!hasSession ? <span className="sidebar__pill">Login</span> : null}
          </button>
          {canAccessAdmin ? (
            <button
              type="button"
              className={`sidebar__nav-item ${activeView === "admin" ? "is-active" : ""}`}
              onClick={onSelectAdmin}
              aria-label="Panel de administración"
            >
              <Users2 size={18} aria-hidden />
              <span>Administración</span>
            </button>
          ) : null}
        </nav>
      </div>

      <div className="sidebar__actions">
        <button type="button" className="sidebar__action" onClick={onOpenHelp}>
          <HelpCircle size={18} aria-hidden />
          <span>Ayuda</span>
        </button>
        <button type="button" className="sidebar__action" onClick={onOpenSettings}>
          <Settings size={18} aria-hidden />
          <span>Configuración</span>
        </button>
        <button
          type="button"
          className="sidebar__action sidebar__action--danger"
          disabled={logoutPending || !hasSession}
          onClick={onLogout}
        >
          <LogOut size={18} aria-hidden />
          <span>{logoutPending ? "Saliendo..." : "Salir"}</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
