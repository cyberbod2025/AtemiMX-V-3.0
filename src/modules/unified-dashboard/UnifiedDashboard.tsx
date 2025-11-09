import React, { useMemo } from "react";

import type { UserRole } from "@/services/authRole";
import {
  DASHBOARD_ACTIONS,
  DASHBOARD_ALERTS,
  DASHBOARD_METRICS,
  FOLLOWUP_GOALS,
  FOCUS_STUDENTS,
  LIVE_TIMELINE,
  type DashboardAction,
  type DashboardAlert,
} from "./data";
import "./dashboard.css";

type RoleTheme = {
  label: string;
  accent: string;
  description: string;
};

const ROLE_THEMES: Record<UserRole, RoleTheme> = {
  docentes: {
    label: "Docentes",
    accent: "#0ea5a5",
    description: "Seguimiento académico y socioemocional para tus grupos.",
  },
  prefectura: {
    label: "Prefectura",
    accent: "#f97316",
    description: "Control de incidencias y reportes disciplinarios en vivo.",
  },
  direccion: {
    label: "Dirección",
    accent: "#fcd34d",
    description: "Visión ejecutiva del ecosistema Atemi y aprobación de acciones.",
  },
  orientacion: {
    label: "Orientación",
    accent: "#f472b6",
    description: "Casos priorizados por IA y rutas de acompañamiento familiar.",
  },
  tsocial: {
    label: "Trabajo social",
    accent: "#a5b4fc",
    description: "Gestión de recursos, becas y documentación colaborativa.",
  },
  enfermeria: {
    label: "Enfermería",
    accent: "#34d399",
    description: "Bitácoras de salud y seguimiento con prefectura y orientación.",
  },
  none: {
    label: "AtemiMX",
    accent: "#0ea5a5",
    description: "Conecta módulos académicos, operativos y de seguridad.",
  },
};

const SEVERITY_LABEL: Record<DashboardAlert["severity"], string> = {
  high: "Crítica",
  medium: "Media",
  low: "Baja",
};

interface UnifiedDashboardProps {
  displayName?: string | null;
  visualRole: UserRole;
  onOpenLauncher: () => void;
  onOpenSase: () => void;
  onOpenAdmin: () => void;
}

export const UnifiedDashboard: React.FC<UnifiedDashboardProps> = ({
  displayName,
  visualRole,
  onOpenLauncher,
  onOpenSase,
  onOpenAdmin,
}) => {
  const roleTheme = ROLE_THEMES[visualRole] ?? ROLE_THEMES.none;

  const heroTitle = useMemo(() => {
    if (!displayName) {
      return "Bienvenido al panel Atemi";
    }
    return `Hola ${displayName}.`;
  }, [displayName]);

  return (
    <section
      className="unified-dashboard"
      style={{ "--dashboard-accent": roleTheme.accent } as React.CSSProperties}
    >
      <header className="unified-dashboard__hero">
        <div className="unified-dashboard__hero-content">
          <div className="unified-dashboard__hero-titles">
            <p className="unified-dashboard__hero-eyebrow">{roleTheme.label} · AtemiMX</p>
            <h1>{heroTitle}</h1>
            <p>{roleTheme.description}</p>
          </div>
          <div className="unified-dashboard__hero-actions">
            <button type="button" className="unified-dashboard__hero-btn" onClick={onOpenLauncher}>
              Abrir menú general
              <br />
              <small>Comandos rápidos y módulos complementarios</small>
            </button>
            <button type="button" className="btn btn-primary" onClick={onOpenSase}>
              Entrar a SASE-310
            </button>
            <button type="button" className="btn" onClick={onOpenAdmin}>
              Panel de dirección
            </button>
          </div>
        </div>
      </header>

      <div className="unified-dashboard__grid">
        {DASHBOARD_METRICS.map((metric) => (
          <article key={metric.id} className="unified-dashboard__card">
            <span className="text-sm text-gray-400">{metric.label}</span>
            <p className="unified-dashboard__metric-value">{metric.value}</p>
            <p className="unified-dashboard__metric-detail">{metric.detail}</p>
            <div className="unified-dashboard__metric-trend">
              <span>{metric.trend.label}</span>
              <strong>{metric.trend.value}</strong>
            </div>
          </article>
        ))}
      </div>

      <div className="unified-dashboard__grid unified-dashboard__grid--panels">
        <section className="unified-dashboard__panel">
          <div className="unified-dashboard__panel-header">
            <h3 className="unified-dashboard__panel-title">Alertas coordinadas</h3>
            <span className="text-sm text-gray-400">Sincronizadas por IA</span>
          </div>
          {DASHBOARD_ALERTS.map((alert) => (
            <article key={alert.id} className="unified-dashboard__alert">
              <h4 className="unified-dashboard__alert-title">{alert.title}</h4>
              <p>{alert.description}</p>
              <div className="unified-dashboard__alert-meta">
                <span>{alert.owner}</span>
                <span>{SEVERITY_LABEL[alert.severity]}</span>
              </div>
            </article>
          ))}
        </section>

        <section className="unified-dashboard__panel">
          <div className="unified-dashboard__panel-header">
            <h3 className="unified-dashboard__panel-title">Alumnos en seguimiento</h3>
            <span className="text-sm text-gray-400">Corte semanal</span>
          </div>
          <div className="unified-dashboard__students">
            {FOCUS_STUDENTS.map((student) => (
              <article key={student.id} className="unified-dashboard__student">
                <div>
                  <h4>{student.name}</h4>
                  <span>{student.grade} · {student.status}</span>
                </div>
                <div className="unified-dashboard__pulse">{student.pulse}%</div>
              </article>
            ))}
          </div>
        </section>
      </div>

      <div className="unified-dashboard__grid unified-dashboard__grid--panels">
        <section className="unified-dashboard__panel">
          <div className="unified-dashboard__panel-header">
            <h3 className="unified-dashboard__panel-title">Línea de tiempo</h3>
            <span className="text-sm text-gray-400">Activaciones recientes</span>
          </div>
          <div className="unified-dashboard__timeline">
            {LIVE_TIMELINE.map((item) => (
              <article key={item.id} className="unified-dashboard__timeline-item">
                <strong>{item.time}</strong>
                <div>
                  <p className="m-0">{item.title}</p>
                  <small>{item.owner}</small>
                </div>
                <span className={`unified-dashboard__chip unified-dashboard__chip--${item.area}`}>
                  {item.area}
                </span>
              </article>
            ))}
          </div>
        </section>
        <section className="unified-dashboard__panel">
          <div className="unified-dashboard__panel-header">
            <h3 className="unified-dashboard__panel-title">Objetivos de seguimiento</h3>
            <span className="text-sm text-gray-400">Ruta S-SDLC</span>
          </div>
          <div className="unified-dashboard__goals">
            {FOLLOWUP_GOALS.map((goal) => (
              <article key={goal.id} className="unified-dashboard__goal">
                <div>
                  <strong>{goal.label}</strong>
                  <br />
                  <small>{goal.due}</small>
                </div>
                <span className="unified-dashboard__goal-status" data-status={goal.status}>
                  {goal.status === "ontrack" && "En progreso"}
                  {goal.status === "delayed" && "Atención"}
                  {goal.status === "done" && "Listo"}
                </span>
              </article>
            ))}
          </div>
          <div className="unified-dashboard__panel-header" style={{ marginTop: "1.5rem" }}>
            <h3 className="unified-dashboard__panel-title">Acciones rápidas</h3>
            <span className="text-sm text-gray-400">Todo el ecosistema</span>
          </div>
          <div className="unified-dashboard__actions">
            {DASHBOARD_ACTIONS.map((action) => (
              <article key={action.id} className="unified-dashboard__action">
                <h4>
                  {action.label}
                  {action.badge ? <span className="sidebar__pill" style={{ marginLeft: "0.5rem" }}>{action.badge}</span> : null}
                </h4>
                <p>{action.description}</p>
              </article>
            ))}
          </div>
        </section>
      </div>
    </section>
  );
};

export default UnifiedDashboard;
