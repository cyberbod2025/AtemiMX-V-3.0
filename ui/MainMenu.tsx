import React from "react";
import type { User } from "firebase/auth";
import { CalendarClock, Notebook, ShieldCheck } from "lucide-react";

import { DEPARTMENT_BRANDS, GENERAL_BRANDING } from "../branding";

interface MainMenuProps {
  user: User | null;
  isAuthLoading: boolean;
  onOpenSase: () => void;
}

export const MainMenu: React.FC<MainMenuProps> = ({ user, isAuthLoading, onOpenSase }) => {
  const authStatus = isAuthLoading
    ? "Validando sesión en curso..."
    : user
      ? `Sesión activa como ${user.displayName ?? user.email ?? "usuario"}.`
      : "Inicia sesión dentro del módulo SASE-310 para continuar.";

  const heroBrand = GENERAL_BRANDING;

  return (
    <div className="main-menu main-menu--landing">
      <section className="main-menu__hero">
        <figure className="main-menu__brand">
          <img src={heroBrand.image} alt={heroBrand.label} />
          <figcaption>{heroBrand.caption ?? "Arquitectura S-SDLC"}</figcaption>
        </figure>
        <div className="main-menu__hero-copy">
          <span className="main-menu__eyebrow">SASE-310 · AtemiMX</span>
          <h1 className="main-menu__headline">Gestiona el bienestar escolar con trazabilidad total</h1>
          <p className="main-menu__description">
            Centraliza reportes socioemocionales, disciplina y seguimiento institucional en un hub diseñado para la comunidad educativa.
          </p>
          <div className="main-menu__actions">
            <button type="button" className="main-menu__primary-cta" onClick={onOpenSase}>
              Entrar al módulo SASE-310
            </button>
            <span className="main-menu__status">{authStatus}</span>
          </div>
        </div>
      </section>

      <section className="department-brand-grid" aria-label="Departamentos Atemi">
        {DEPARTMENT_BRANDS.map((brand) => (
          <figure key={brand.key} className="department-brand">
            <img src={brand.image} alt={brand.label} loading="lazy" />
            <figcaption>{brand.label}</figcaption>
          </figure>
        ))}
      </section>

      <section className="main-menu__grid">
        <article className="module-card module-card--primary">
          <header>
            <ShieldCheck size={28} aria-hidden />
            <span className="module-card__tag module-card__tag--accent">SASE-310</span>
          </header>
          <h3>Reportes y seguimiento</h3>
          <p>Administra incidencias, estados y evidencia por rol con controles S-SDLC.</p>
          <button type="button" className="module-card__cta" onClick={onOpenSase}>
            Acceder al módulo
          </button>
        </article>

        <article className="module-card module-card--disabled">
          <header>
            <Notebook size={28} aria-hidden />
            <span className="module-card__tag">Próximamente</span>
          </header>
          <h3>Cuaderno digital</h3>
          <p>Planea y organiza clases con seguimiento inteligente de grupo.</p>
        </article>

        <article className="module-card module-card--disabled">
          <header>
            <CalendarClock size={28} aria-hidden />
            <span className="module-card__tag">Próximamente</span>
          </header>
          <h3>Planeaciones</h3>
          <p>Diseña experiencias de aprendizaje con evaluaciones formativas integradas.</p>
        </article>
      </section>
    </div>
  );
};

export default MainMenu;
