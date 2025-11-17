import { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";

import { auth } from "@/lib/firebase";

const Login: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (loading) {
      return;
    }

    setLoading(true);
    setError("");

    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
      window.location.href = "/dashboard";
    } catch {
      setError("Correo o contraseña incorrectos.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050c1b] flex items-center justify-center p-4">
      <div className="login-wrapper w-full max-w-md bg-[#0f172a] rounded-2xl border border-[#1f2937] px-8 py-10 shadow-2xl text-white space-y-6">
        <header className="text-center space-y-1">
          <p className="text-sm uppercase tracking-[0.3em] text-blue-400">AtemiMX</p>
          <h1 className="text-2xl font-semibold">Iniciar sesión</h1>
        </header>

        <label className="flex flex-col gap-2 text-sm">
          Correo institucional
          <input
            type="email"
            placeholder="docente@institucion.mx"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="p-3 rounded-xl bg-[#0b1121] border border-transparent focus:border-blue-500 outline-none transition"
          />
        </label>

        <label className="flex flex-col gap-2 text-sm">
          Contraseña
          <input
            type="password"
            placeholder="********"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="p-3 rounded-xl bg-[#0b1121] border border-transparent focus:border-blue-500 outline-none transition"
          />
        </label>

        {error ? <p className="text-sm text-red-400 text-center">{error}</p> : null}

        <button
          type="button"
          onClick={handleLogin}
          disabled={loading}
          className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-60 transition font-semibold"
        >
          {loading ? "Validando…" : "Entrar"}
        </button>

        <div className="flex flex-col gap-2 text-sm text-center text-blue-300">
          <a href="/recuperar" className="hover:text-white transition">
            ¿Olvidaste tu contraseña?
          </a>
          <a href="/registro" className="hover:text-white transition">
            Crear una cuenta
          </a>
        </div>
      </div>
    </div>
  );
};

export default Login;
