import React from "react";

import { GENERAL_BRANDING } from "../branding";

const DEFAULT_BRAND_IMAGE = GENERAL_BRANDING.image;
const DEFAULT_BRAND_LABEL = GENERAL_BRANDING.label;
const DEFAULT_ARTWORK_VIDEO = "/branding/INTRO SPLASH.mp4?v=20251103";

interface SplashScreenProps {
  title?: string;
  message?: string;
  statusHint?: string | null;
  showSpinner?: boolean;
  brandImage?: string | null;
  brandLabel?: string | null;
  artworkImage?: string | null;
  artworkVideo?: string | null;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({
  title = "SASE-310 AtemiMX",
  message = "Preparando tu entorno docente seguro...",
  statusHint = null,
  showSpinner = true,
  brandImage = DEFAULT_BRAND_IMAGE,
  brandLabel = DEFAULT_BRAND_LABEL,
  artworkImage = null,
  artworkVideo = DEFAULT_ARTWORK_VIDEO,
}) => {
  return (
    <div className="splash-screen">
      {(artworkVideo || artworkImage) ? (
        <div className="splash-screen__artwork" aria-hidden="true">
          {artworkVideo ? (
            <video src={artworkVideo} autoPlay loop muted playsInline preload="auto" />
          ) : null}
          {!artworkVideo && artworkImage ? <img src={artworkImage} alt="" /> : null}
        </div>
      ) : null}
      <div className="splash-screen__panel">
        {brandImage ? (
          <figure className="splash-screen__badge">
            <img src={brandImage} alt={brandLabel ?? "Marca"} />
            {brandLabel ? <figcaption>{brandLabel}</figcaption> : null}
          </figure>
        ) : null}
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
    </div>
  );
};

export default SplashScreen;
