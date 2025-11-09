import React, { useMemo, useState } from "react";
import { AlertCircle, Fingerprint, Lock, X } from "lucide-react";

type PinMode = "unlock" | "setup";

interface SecurityPinScreenProps {
  open: boolean;
  mode: PinMode;
  onCancel?: () => void;
  onSubmit?: (pin: string) => void;
  maxDigits?: number;
  biometricLabel?: string;
  errorMessage?: string | null;
}

const KEY_LAYOUT: Array<string | "ok" | "cancel"> = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "cancel", "0", "ok"];

export const SecurityPinScreen: React.FC<SecurityPinScreenProps> = ({
  open,
  mode,
  onCancel,
  onSubmit,
  maxDigits = 6,
  biometricLabel = "Touch ID para AtemiMX",
  errorMessage,
}) => {
  const [pin, setPin] = useState("");

  const handleDigit = (value: string | "ok" | "cancel") => {
    if (value === "cancel") {
      setPin("");
      onCancel?.();
      return;
    }
    if (value === "ok") {
      if (pin.length > 0) {
        onSubmit?.(pin);
        setPin("");
      }
      return;
    }
    if (pin.length >= maxDigits) {
      return;
    }
    setPin((prev) => prev + value);
  };

  const pinIndicators = useMemo(
    () => Array.from({ length: maxDigits }, (_, idx) => (idx < pin.length ? "filled" : "empty")),
    [maxDigits, pin.length],
  );

  const heading = mode === "setup" ? "Configura un PIN" : "Teclea tu PIN";
  const subtitle =
    mode === "setup"
      ? "Define un PIN de seguridad para los próximos ingresos en este dispositivo."
      : "Protegemos tu bitácora S-SDLC.";

  if (!open) {
    return null;
  }

  return (
    <div className="security-pin" role="dialog" aria-modal="true" aria-label="Autenticación AteniMX">
      <div className="security-pin__pattern" aria-hidden="true" />
      <div className="security-pin__panel">
        <div className="security-pin__panel-header">
          <Lock size={24} aria-hidden />
          <button type="button" className="security-pin__close" onClick={onCancel} aria-label="Cerrar">
            <X size={20} aria-hidden />
          </button>
        </div>
        <div className="security-pin__heading">
          <p className="security-pin__eyebrow">Sesión AtemiMX</p>
          <h2>{heading}</h2>
          <p>{subtitle}</p>
        </div>
        <div className="security-pin__code">
          {pinIndicators.map((state, idx) => (
            <span
              key={`pin-dot-${idx}`}
              className={`security-pin__dot security-pin__dot--${state}`}
              aria-hidden="true"
            />
          ))}
        </div>
        {errorMessage ? (
          <div className="security-pin__error" role="alert">
            <AlertCircle size={16} aria-hidden />
            <span>{errorMessage}</span>
          </div>
        ) : null}
        <div className="security-pin__biometric">
          <div className="security-pin__biometric-card">
            <Fingerprint size={28} aria-hidden />
            <span>{biometricLabel}</span>
          </div>
          <button type="button" onClick={() => setPin("")}>
            Cancelar
          </button>
        </div>
        <div className="security-pin__keypad" role="group" aria-label="Teclado numérico">
          {KEY_LAYOUT.map((value) => (
            <button
              key={value}
              type="button"
              className={`security-pin__key${
                value === "ok" ? " security-pin__key--ok" : value === "cancel" ? " security-pin__key--cancel" : ""
              }`}
              onClick={() => handleDigit(value)}
            >
              {value === "cancel" ? "Cancelar" : value === "ok" ? "OK" : value}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SecurityPinScreen;
