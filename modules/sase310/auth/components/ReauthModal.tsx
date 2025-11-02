import React, { useEffect, useState } from "react";

import { EmailAuthProvider, reauthenticateWithCredential } from "firebase/auth";

import { auth } from "../../../../services/firebase";
import { logSensitiveAccess, type SensitiveAccessPayload } from "../services/securityService";

interface ReauthModalProps {
  isOpen: boolean;
  email: string;
  resource: SensitiveAccessPayload["resource"];
  reason?: SensitiveAccessPayload["reason"];
  onClose: () => void;
  onReauthenticated: () => void;
}

export const ReauthModal: React.FC<ReauthModalProps> = ({ isOpen, email, resource, reason, onClose, onReauthenticated }) => {
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setPassword("");
      setError(null);
    }
  }, [isOpen]);

  if (!isOpen) {
    return null;
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    if (!auth.currentUser) {
      setError("No hay una sesion activa para validar.");
      return;
    }

    setSubmitting(true);
    try {
      const credential = EmailAuthProvider.credential(email, password);
      await reauthenticateWithCredential(auth.currentUser, credential);
      await logSensitiveAccess({ resource, reason });
      onReauthenticated();
      onClose();
    } catch (err) {
      console.error("[SASE-310] Reautenticacion fallida:", err);
      setError(err instanceof Error ? err.message : "No fue posible validar la reautenticacion.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="reauth-modal__backdrop" role="dialog" aria-modal="true">
      <div className="reauth-modal card">
        <header className="reauth-modal__header">
          <h2 className="text-lg font-display text-white">Confirmar identidad</h2>
          <p className="text-sm text-gray-400">
            Este dato requiere una validacion adicional. Ingresa tu contraseña institucional para continuar.
          </p>
        </header>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="block mb-1 text-sm text-gray-300" htmlFor="reauth-email">
              Correo
            </label>
            <input id="reauth-email" type="email" className="input-field w-full" value={email} disabled readOnly />
          </div>
          <div>
            <label className="block mb-1 text-sm text-gray-300" htmlFor="reauth-password">
              Contraseña
            </label>
            <input
              id="reauth-password"
              type="password"
              className="input-field w-full"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="current-password"
              required
              minLength={10}
              disabled={submitting}
            />
          </div>
          {error ? <p className="text-sm text-red-400">{error}</p> : null}
          <div className="reauth-modal__actions">
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={submitting}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary" disabled={submitting || password.length === 0}>
              {submitting ? "Validando..." : "Confirmar acceso"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ReauthModal;
