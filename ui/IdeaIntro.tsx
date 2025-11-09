import React from "react";
import Typewriter from "../Typewriter";

interface IdeaIntroProps {
  onStart: () => void;
}

export const IdeaIntro: React.FC<IdeaIntroProps> = ({ onStart }) => (
  <section className="idea-intro" aria-label="Introducción AtemiMX">
    <div className="idea-intro__glow" aria-hidden="true" />
    <div className="idea-intro__content">
      <p className="idea-intro__eyebrow">Idea en prototipo</p>
      <Typewriter className="idea-intro__title" text="AtemiMX" speed={120} />
      <p className="idea-intro__subtitle">Arquitectura S-SDLC para bienestar escolar.</p>
      <p className="idea-intro__description">
        Imagina la experiencia completa: entrevista inicial, feria de bases, Ángel Guardián y el módulo SASE-310,
        todo orquestado desde un solo espacio.
      </p>
      <button type="button" className="idea-intro__cta" onClick={onStart}>
        Empezar
      </button>
    </div>
  </section>
);

export default IdeaIntro;
