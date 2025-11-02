import React, { useEffect, useMemo, useState } from "react";

const LOGO_PATH = "/branding/atemimx-splash.png?v=20251031";

interface SplashScreenProps {
  title?: string;
  message?: string;
  statusHint?: string | null;
  showSpinner?: boolean;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({
  title = "Shell iDoceo",
  message = "Inicializando entorno seguro...",
  statusHint = null,
  showSpinner = true,
}) => <SplashInner title={title} message={message} statusHint={statusHint} showSpinner={showSpinner} />;

interface SplashInnerProps extends Required<Omit<SplashScreenProps, "statusHint">> {
  statusHint: string | null;
}

const SplashInner: React.FC<SplashInnerProps> = ({ title, message, statusHint, showSpinner }) => {
  const [logoAvailable, setLogoAvailable] = useState(true);
  const fallbackLabel = useMemo(() => title ?? "AtemiMX", [title]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    const preload = new Image();
    preload.src = LOGO_PATH;
  }, []);

  return (
    <div className="splash-screen">
      <div className="splash-screen__content">
        <div className="splash-screen__orbital">
          <div className="splash-screen__orbital-bg" aria-hidden="true" />
          <div className="splash-screen__logo-ring">
            {logoAvailable ? (
              <img src={LOGO_PATH} alt={fallbackLabel} className="splash-screen__logo" onError={() => setLogoAvailable(false)} />
            ) : (
              <div className="splash-screen__logo-fallback" role="img" aria-label={fallbackLabel}>
                <span>{fallbackLabel}</span>
              </div>
            )}
          </div>
        </div>
        <p className="splash-screen__title">{title}</p>
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
