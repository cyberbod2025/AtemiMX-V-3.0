import { type FormEvent, useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import type { User } from "firebase/auth";
import { signInWithEmailAndPassword } from "firebase/auth";

import { auth } from "@/services/firebase";

interface LoginViewProps {
  onLoginSuccess: (user: User) => void;
}

const MAX_ATTEMPTS = 5;
const LOCK_DURATION_MS = 60_000;

const LoginView = ({ onLoginSuccess }: LoginViewProps) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [lockExpiresAt, setLockExpiresAt] = useState<number | null>(null);
  const [lockRemaining, setLockRemaining] = useState(0);

  useEffect(() => {
    if (!lockExpiresAt) {
      setLockRemaining(0);
      return;
    }
    const tick = () => {
      const remaining = Math.max(0, lockExpiresAt - Date.now());
      setLockRemaining(Math.ceil(remaining / 1000));
      if (remaining <= 0) {
        setLockExpiresAt(null);
        setFailedAttempts(0);
      }
    };
    tick();
    const intervalId = window.setInterval(tick, 1000);
    return () => window.clearInterval(intervalId);
  }, [lockExpiresAt]);

  const handleLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (lockExpiresAt && Date.now() < lockExpiresAt) {
      setErrorMsg(`Espera ${lockRemaining || 1} segundos antes de intentar de nuevo.`);
      return;
    }

    setLoading(true);
    setErrorMsg("");

    try {
      const credential = await signInWithEmailAndPassword(auth, email.trim(), password);
      onLoginSuccess(credential.user);
      setFailedAttempts(0);
    } catch (error) {
      console.error("[Auth] Unable to login user", error);
      const nextAttempts = failedAttempts + 1;
      setFailedAttempts(nextAttempts);
      if (nextAttempts >= MAX_ATTEMPTS) {
        const nextLock = Date.now() + LOCK_DURATION_MS;
        setLockExpiresAt(nextLock);
        setErrorMsg("Demasiados intentos fallidos. Espera un momento antes de reintentar.");
      } else {
        setErrorMsg(`Correo o contraseña incorrectos. Intentos restantes: ${MAX_ATTEMPTS - nextAttempts}.`);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0b0f19] flex items-center justify-center p-4">
      <div className="bg-[#111827] rounded-xl p-8 shadow-xl w-full max-w-md border border-[#1f2937]">
        <h1 className="text-2xl font-bold text-white mb-6 text-center">AtemiMX — Iniciar sesión</h1>

        <form onSubmit={handleLogin} className="flex flex-col gap-4">
          <input
            type="email"
            className="p-3 rounded bg-[#1f2937] text-white outline-none border border-transparent focus:border-blue-500 transition"
            placeholder="Correo institucional"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />

          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              className="p-3 rounded bg-[#1f2937] text-white outline-none border border-transparent focus:border-blue-500 transition w-full pr-20"
              placeholder="Contraseña"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-sm text-blue-400 hover:text-blue-300 focus:outline-none"
            >
              {showPassword ? "Ocultar" : "Mostrar"}
            </button>
          </div>

          {lockRemaining > 0 ? (
            <p className="text-yellow-400 text-sm text-center">
              Reintenta en {lockRemaining} segundo{lockRemaining === 1 ? "" : "s"}.
            </p>
          ) : null}
          {errorMsg ? <p className="text-red-400 text-sm text-center">{errorMsg}</p> : null}

          <button
            type="submit"
            disabled={loading || (lockExpiresAt ? Date.now() < lockExpiresAt : false)}
            className="bg-blue-600 hover:bg-blue-700 text-white py-3 rounded transition flex items-center justify-center disabled:opacity-70"
          >
            {loading ? <Loader2 className="animate-spin" /> : "Entrar"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default LoginView;
