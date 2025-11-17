import React, { useEffect, useState } from "react";
import type { User } from "firebase/auth";
import { onAuthStateChanged } from "firebase/auth";

import { auth } from "@/services/firebase";
import LoginView from "./LoginView";
import IntroScreen from "./IntroScreen";

const FullscreenMessage: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="h-screen bg-[#0b0f19] text-white flex items-center justify-center text-xl">{children}</div>
);

interface AuthRouterProps {
  children: React.ReactNode;
}

const AuthRouter: React.FC<AuthRouterProps> = ({ children }) => {
  const [firebaseUser, setFirebaseUser] = useState<User | null>(auth.currentUser);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [introDone, setIntroDone] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setFirebaseUser(user);
      setCheckingAuth(false);
    });

    return () => unsubscribe();
  }, []);

  if (!introDone) {
    return <IntroScreen onFinish={() => setIntroDone(true)} />;
  }

  if (checkingAuth) {
    return <FullscreenMessage>Cargando…</FullscreenMessage>;
  }

  if (!firebaseUser) {
    return <LoginView onLoginSuccess={(user) => setFirebaseUser(user)} />;
  }

  return <>{children}</>;
};

export default AuthRouter;
