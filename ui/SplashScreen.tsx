import React, { useState } from "react";

const LOGO_PATH = "/branding/atemimx-interface.png";

export const SplashScreen: React.FC = () => (
  <SplashInner />
);

const SplashInner: React.FC = () => {
  const [logoAvailable, setLogoAvailable] = useState(true);

  return (
    <div className="splash-screen">
      <div className="splash-screen__content">
        <div className="splash-screen__orbital">
          <div className="splash-screen__orbital-bg" aria-hidden="true" />
          <div className="splash-screen__logo-ring">
            {logoAvailable ? (
              <img
                src={LOGO_PATH}
                alt="Logotipo AtemiMX"
                className="splash-screen__logo"
                onError={() => setLogoAvailable(false)}
              />
            ) : (
              <div className="splash-screen__logo-fallback" aria-hidden="true">
                AtemiMX
              </div>
            )}
          </div>
        </div>
        <p className="splash-screen__title">Shell iDoceo</p>
        <p className="splash-screen__message">Inicializando entorno seguro...</p>
        <div className="splash-screen__spinner" aria-hidden="true" />
      </div>
    </div>
  );
};

export default SplashScreen;
