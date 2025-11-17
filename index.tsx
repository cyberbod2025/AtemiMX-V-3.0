import React, { useEffect, useState } from "react";
import ReactDOM from "react-dom/client";

import AuthRouter from "@/auth/AuthRouter";
import App from "./App";
import { AuthProvider } from "@/contexts/AuthContext";
import OnboardingLegal from "./OnboardingLegal";
import "@/assets/css/atemi-legal.css";

const CONSENT_KEY = "atemi:legalConsent:v1";

const AppGate: React.FC = () => {
  const [hasConsent, setHasConsent] = useState(() => {
    if (typeof window === "undefined") {
      return true;
    }
    return window.localStorage.getItem(CONSENT_KEY) === "accepted";
  });

  useEffect(() => {
    if (hasConsent && typeof window !== "undefined") {
      window.localStorage.setItem(CONSENT_KEY, "accepted");
    }
  }, [hasConsent]);

  if (!hasConsent) {
    return <OnboardingLegal onAccept={() => setHasConsent(true)} />;
  }

  return (
    <AuthProvider>
      <App />
    </AuthProvider>
  );
};

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <AuthRouter>
      <AppGate />
    </AuthRouter>
  </React.StrictMode>,
);
