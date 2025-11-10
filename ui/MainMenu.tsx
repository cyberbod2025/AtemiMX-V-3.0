import React from "react";
import type { User } from "firebase/auth";

interface MainMenuProps {
  user: User | null;
  isAuthLoading: boolean;
  onOpenSase: () => void;
  onShowSecurity: () => void;
  onShowGlobalMenu: () => void;
}

const NAV_ITEMS = [
  { id: "panel", label: "Panel principal", badge: null },
  { id: "cuaderno", label: "Cuaderno", badge: "PRONTO" },
  { id: "planeaciones", label: "Planeaciones", badge: "PRONTO" },
];

export const MainMenu: React.FC<MainMenuProps> = ({
  user,
  isAuthLoading,
  onOpenSase,
  onShowSecurity,
  onShowGlobalMenu,
}) => {
  const authStatus = isAuthLoading
    ? "Validando sesión en curso..."
    : user
      ? `Sesión activa como ${user.displayName ?? user.email ?? "usuario"}.`
      : "Inicia sesión dentro del módulo SASE-310 para continuar.";

  return (
    <div className="landing-shell">
      <aside className="landing-sidebar">
        <div>
          <div className="landing-brand">
            <div>
              <p className="landing-brand__eyebrow">Atemi</p>
              <h2 className="landing-brand__name">MX</h2>
            </div>
            <span className="landing-brand__version">v3.6</span>
          </div>
          <nav className="landing-nav">
            {NAV_ITEMS.map((item) => (
              <button key={item.id} type="button" className="landing-nav__item landing-nav__item--disabled">
                <span>{item.label}</span>
                {item.badge ? <span className="landing-nav__badge">{item.badge}</span> : null}
              </button>
            ))}
            <div className="landing-nav__divider" />
            <button type="button" className="landing-nav__item landing-nav__item--accent" onClick={onOpenSase}>
              <span>SASE-310</span>
              <span className="landing-nav__badge landing-nav__badge--accent">LOGIN</span>
            </button>
          </nav>
        </div>
        <footer className="landing-sidebar__footer">
          <p className="landing-sidebar__status">{authStatus}</p>
          <div className="landing-sidebar__actions">
            <button type="button" className="landing-sidebar__ghost" onClick={onShowSecurity}>
              Ver pantalla PIN
            </button>
            <button type="button" className="landing-sidebar__ghost" onClick={onShowGlobalMenu}>
              Menú general AtemiMX
            </button>
          </div>
          <button type="button" className="landing-sidebar__cta" onClick={onOpenSase}>
            Ingresar con cuenta institucional
          </button>
        </footer>
      </aside>

      <section className="landing-stage">
        <div className="landing-stage__card">
          <header className="landing-stage__header">
            <div className="landing-stage__logo">
              <span>AM</span>
            </div>
            <div className="landing-stage__label">
              <p>ARQUITECTURA S-SDLC</p>
              <span>SASE-310 · ATEMIMX</span>
            </div>
          </header>
          <div className="landing-stage__body">
            <h1>Gestiona el bienestar escolar con trazabilidad total</h1>
            <p>
              Centraliza reportes socioemocionales, disciplina y seguimiento institucional en un hub diseñado para la comunidad
              educativa.
            </p>
          </div>
          <div className="landing-stage__actions">
            <button type="button" className="landing-stage__primary" onClick={onOpenSase}>
              Entrar al módulo SASE-310
            </button>
            <button type="button" className="landing-stage__ghost" onClick={onShowGlobalMenu}>
              Explorar novedades
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default MainMenu;
