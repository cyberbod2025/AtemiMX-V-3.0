import React, { useMemo, useState } from "react";
import type { LucideIcon } from "lucide-react";
import {
  AlarmClockCheck,
  BellRing,
  CalendarClock,
  Grid,
  Grid2x2,
  Layers3,
  LifeBuoy,
  Lock,
  NotebookTabs,
  ShieldCheck,
  UploadCloud,
  UserCircle2,
  X,
} from "lucide-react";
import type { User } from "firebase/auth";

interface GlobalMenuModalProps {
  open: boolean;
  user: User | null;
  onClose: () => void;
  onOpenSase: () => void;
  onShowSecurity: () => void;
  variant?: "modal" | "floating";
}

type MenuItem = {
  id: string;
  label: string;
  description: string;
  icon: LucideIcon;
  action?: () => void;
  accent?: "jade" | "magenta" | "gold";
  disabled?: boolean;
};

export const GlobalMenuModal: React.FC<GlobalMenuModalProps> = ({
  open,
  onClose,
  user,
  onOpenSase,
  onShowSecurity,
  variant = "modal",
}) => {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const isFloating = variant === "floating";

  const menuItems = useMemo<MenuItem[]>(
    () => [
      {
        id: "reports",
        label: "Reportes",
        description: "Bitácora integral",
        icon: ShieldCheck,
        accent: "jade",
      },
      {
        id: "planner",
        label: "Planeador",
        description: "Rutas y evidencias",
        icon: Layers3,
      },
      {
        id: "calendar",
        label: "Horario",
        description: "Semana docente",
        icon: CalendarClock,
      },
      {
        id: "notes",
        label: "Notas",
        description: "Seguimiento rápido",
        icon: NotebookTabs,
      },
      {
        id: "backup",
        label: "Backup & Sync",
        description: "Google Drive",
        icon: UploadCloud,
        accent: "gold",
      },
      {
        id: "alerts",
        label: "Avisos",
        description: "Recordatorios",
        icon: BellRing,
      },
      {
        id: "security",
        label: "Seguridad",
        description: "PIN / Biométrico",
        icon: Lock,
        action: onShowSecurity,
      },
      {
        id: "support",
        label: "Soporte Ateni",
        description: "Tutoriales",
        icon: LifeBuoy,
      },
      {
        id: "sessions",
        label: "Sesiones",
        description: "Historial",
        icon: AlarmClockCheck,
        disabled: true,
      },
      {
        id: "sase",
        label: "Módulo SASE-310",
        description: "Entrar ahora",
        icon: UserCircle2,
        accent: "magenta",
        action: onOpenSase,
      },
    ],
    [onOpenSase, onShowSecurity],
  );

  if (!open) {
    return null;
  }

  return (
    <div
      className={`global-menu ${isFloating ? "global-menu--floating" : ""}`}
      role="dialog"
      aria-modal={!isFloating}
      aria-label="Menú general AtemiMX"
    >
      {!isFloating ? <div className="global-menu__backdrop" onClick={onClose} aria-hidden="true" /> : null}
      <div className="global-menu__panel">
        <header className="global-menu__header">
          <div className="global-menu__heading">
            <p>AtemiMX</p>
            <h2>Menú general</h2>
          </div>
          <div className="global-menu__header-actions">
            <button
              type="button"
              className={`global-menu__toggle ${viewMode === "grid" ? "is-active" : ""}`}
              aria-label="Vista en cuadrícula"
              onClick={() => setViewMode("grid")}
            >
              <Grid size={18} aria-hidden />
            </button>
            <button
              type="button"
              className={`global-menu__toggle ${viewMode === "list" ? "is-active" : ""}`}
              aria-label="Vista en lista"
              onClick={() => setViewMode("list")}
            >
              <Grid2x2 size={18} aria-hidden />
            </button>
            <button type="button" className="global-menu__close" onClick={onClose} aria-label="Cerrar menú">
              <X size={18} aria-hidden />
            </button>
          </div>
        </header>

        <div className={`global-menu__content global-menu__content--${viewMode}`}>
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                type="button"
                className={`global-menu__item global-menu__item--${item.accent ?? "default"}`}
                onClick={() => (item.action ? item.action() : null)}
                disabled={item.disabled}
              >
                <span className="global-menu__icon">
                  <Icon size={24} aria-hidden />
                </span>
                <span className="global-menu__label">
                  <strong>{item.label}</strong>
                  <small>{item.description}</small>
                </span>
              </button>
            );
          })}
        </div>

        <footer className="global-menu__footer">
          <div className="global-menu__status">
            <span />
            <p>
              {user ? `Sesión activa · ${user.email ?? user.displayName ?? "Docente"}` : "Inicia sesión para acceder a SASE-310"}
            </p>
          </div>
          <button type="button" className="global-menu__cta" onClick={onOpenSase}>
            Entrar al módulo SASE-310
          </button>
        </footer>
      </div>
    </div>
  );
};

export default GlobalMenuModal;
