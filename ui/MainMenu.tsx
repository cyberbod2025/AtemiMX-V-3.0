import React from "react";
import type { User } from "firebase/auth";
import { CalendarClock, Notebook, ShieldCheck } from "lucide-react";

interface MainMenuProps {
  user: User | null;
  isAuthLoading: boolean;
  onOpenSase: () => void;
}

export const MainMenu: React.FC<MainMenuProps> = ({ user, isAuthLoading, onOpenSase }) => {
  const authStatus = isAuthLoading
    ? "Validando sesion en curso..."
    : user
      ? `Sesion activa como ${user.displayName ?? user.email ?? "usuario"}.`
      : "Inicia sesion dentro del modulo SASE-310 para continuar.";

  return (
    <div className="main-menu">
      <header className="main-menu__header">
        <p className="main-menu__subtitle">
          Gestiona modulos certificados con navegacion segura y experiencias modulares.
        </p>
        <p className="main-menu__status">{authStatus}</p>
      </header>

      <section className="main-menu__grid">
        <article className="module-card module-card--disabled">
          <header>
            <Notebook size={28} aria-hidden />
            <span className="module-card__tag">Proximamente</span>
          </header>
          <h3>Cuaderno digital</h3>
          <p>Planea y organiza las clases con seguimiento de grupo en tiempo real.</p>
        </article>

        <article className="module-card module-card--disabled">
          <header>
            <CalendarClock size={28} aria-hidden />
            <span className="module-card__tag">Proximamente</span>
          </header>
          <h3>Planeaciones</h3>
          <p>Disena experiencias de aprendizaje con evaluacion formativa integrada.</p>
        </article>

        <article className="module-card module-card--primary">
          <header>
            <ShieldCheck size={28} aria-hidden />
            <span className="module-card__tag module-card__tag--accent">Activo</span>
          </header>
          <h3>SASE-310</h3>
          <p>Administra reportes, seguimiento y perfiles docentes del sistema SASE-310.</p>
          <button type="button" className="module-card__cta" onClick={onOpenSase}>
            Acceder al modulo
          </button>
        </article>
      </section>
    </div>
  );
};

export default MainMenu;
