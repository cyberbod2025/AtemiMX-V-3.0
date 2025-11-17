import { useState } from "react";
import { sendPasswordResetEmail } from "firebase/auth";

import { auth } from "@/lib/firebase";

const Recover: React.FC = () => {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRecover = async () => {
    if (loading) {
      return;
    }
    setLoading(true);
    setMessage("");
    setError("");
    try {
      await sendPasswordResetEmail(auth, email.trim());
      setMessage("Se envió un correo para restablecer la contraseña.");
    } catch {
      setError("No pudimos enviar el correo. Verifica el email.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050c1b] flex items-center justify-center p-4">
      <div className="login-wrapper w-full max-w-md bg-[#0f172a] rounded-2xl border border-[#1f2937] px-8 py-10 shadow-2xl text-white space-y-6">
        <header className="text-center space-y-1">
          <p className="text-sm uppercase tracking-[0.3em] text-blue-400">AtemiMX</p>
          <h1 className="text-2xl font-semibold">Recuperar contraseña</h1>
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

        <button
          type="button"
          onClick={handleRecover}
          disabled={loading}
          className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-60 transition font-semibold"
        >
          {loading ? "Enviando…" : "Enviar correo"}
        </button>

        {message ? <p className="text-sm text-green-400 text-center">{message}</p> : null}
        {error ? <p className="text-sm text-red-400 text-center">{error}</p> : null}

        <p className="text-center text-sm text-blue-300">
          ¿Recordaste tu contraseña?{" "}
          <a href="/login" className="hover:text-white transition">
            Vuelve al login
          </a>
        </p>
      </div>
    </div>
  );
};

export default Recover;
