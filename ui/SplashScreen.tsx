import React from "react";

import { DEPARTMENT_BRANDS, GENERAL_BRANDING } from "../branding";

const DEFAULT_BRAND_IMAGE = GENERAL_BRANDING.image;
const DEFAULT_BRAND_LABEL = GENERAL_BRANDING.label;

interface SplashScreenProps {
  title?: string;
  message?: string;
  statusHint?: string | null;
  showSpinner?: boolean;
  brandImage?: string | null;
  brandLabel?: string | null;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({
  title = "SASE-310 AtemiMX",
  message = "Preparando tu entorno docente seguro...",
  statusHint = null,
  showSpinner = true,
  brandImage = DEFAULT_BRAND_IMAGE,
  brandLabel = DEFAULT_BRAND_LABEL,
}) => {
  return (
    <div className="splash-screen">
      <div className="splash-screen__panel">
        <span className="splash-screen__eyebrow">SASE-310 • AtemiMX</span>
        <h1 className="splash-screen__title">{title}</h1>
        <p className="splash-screen__message" aria-live="polite">
          {message}
        </p>
        {statusHint ? (
          <p className="splash-screen__status-hint" aria-live="polite">
            {statusHint}
          </p>
        ) : null}
        {showSpinner ? <div className="splash-screen__spinner" role="status" aria-label="Cargando" /> : null}
      </div>
      {brandImage ? (
        <figure className="splash-screen__signature">
          <img src={brandImage} alt={brandLabel ?? "Marca"} />
          {brandLabel ? <figcaption>{brandLabel}</figcaption> : null}
        </figure>
      ) : null}
      <div className="splash-screen__brand-strip" aria-label="Departamentos Atemi">
        {DEPARTMENT_BRANDS.map((brand) => (
          <img key={brand.key} src={brand.image} alt={brand.label} />
        ))}
      </div>
    </div>
  );
};

export default SplashScreen;
