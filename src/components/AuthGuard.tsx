import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import type { User } from "firebase/auth";
import { onAuthStateChanged } from "firebase/auth";

import { auth } from "@/lib/firebase";

interface AuthGuardProps {
  children: ReactNode;
}

const AuthGuard: React.FC<AuthGuardProps> = ({ children }) => {
  const [checking, setChecking] = useState(true);
  const [currentUser, setCurrentUser] = useState<User | null>(auth.currentUser);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setChecking(false);
      if (!user) {
        window.location.href = "/login";
      }
    });

    return () => unsubscribe();
  }, []);

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#05070f] text-white">
        Validando sesión…
      </div>
    );
  }

  if (!currentUser) {
    return null;
  }

  return <>{children}</>;
};

export default AuthGuard;
