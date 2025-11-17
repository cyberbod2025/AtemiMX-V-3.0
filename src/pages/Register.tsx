import { useState } from "react";
import { createUserWithEmailAndPassword } from "firebase/auth";

import { auth } from "@/lib/firebase";

const Register: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (loading) {
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      await createUserWithEmailAndPassword(auth, email.trim(), password);
      setSuccess("Cuenta creada. Puedes iniciar sesión.");
    } catch {
      setError("Ese correo ya está registrado o es inválido.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050c1b] flex items-center justify-center p-4">
      <div className="login-wrapper w-full max-w-md bg-[#0f172a] rounded-2xl border border-[#1f2937] px-8 py-10 shadow-2xl text-white space-y-6">
        <header className="text-center space-y-1">
          <p className="text-sm uppercase tracking-[0.3em] text-blue-400">AtemiMX</p>
          <h1 className="text-2xl font-semibold">Crear cuenta</h1>
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
        {success ? <p className="text-sm text-green-400 text-center">{success}</p> : null}

        <button
          type="button"
          onClick={handleRegister}
          disabled={loading}
          className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-60 transition font-semibold"
        >
          {loading ? "Registrando…" : "Registrar"}
        </button>

        <p className="text-center text-sm text-blue-300">
          ¿Ya tienes cuenta?{" "}
          <a href="/login" className="hover:text-white transition">
            Inicia sesión
          </a>
        </p>
      </div>
    </div>
  );
};

export default Register;
