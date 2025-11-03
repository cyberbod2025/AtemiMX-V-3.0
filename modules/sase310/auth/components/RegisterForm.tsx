import { AlertCircle, CheckCircle2 } from "lucide-react";
import React from "react";

export interface RegisterFormValues {
  nombreCompleto: string;
  email: string;
  password: string;
}

export type FieldValidationStatus = "idle" | "valid" | "error";

export interface FieldValidationState {
  status: FieldValidationStatus;
  message?: string;
}

interface RegisterFormValidation {
  nombreCompleto?: FieldValidationState;
  email?: FieldValidationState;
  password?: FieldValidationState;
}

interface RegisterFormProps {
  values: RegisterFormValues;
  submitting?: boolean;
  serverError?: string | null;
  passwordHint?: string;
  validation?: RegisterFormValidation;
  canSubmit?: boolean;
  onChange: (field: keyof RegisterFormValues, value: string) => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  onCancel?: () => void;
}

const helperCopy =
  "El sistema transforma tu nombre a mayusculas para que coincida con la plantilla autorizada.";

const defaultValidationState: FieldValidationState = { status: "idle" };

const getInputClass = (status: FieldValidationStatus): string => {
  if (status === "valid") {
    return "input-field input-field--success";
  }
  if (status === "error") {
    return "input-field input-field--error";
  }
  return "input-field";
};

const renderStatusIcon = (status: FieldValidationStatus) => {
  if (status === "valid") {
    return <CheckCircle2 size={18} className="input-status__icon input-status__icon--valid" aria-hidden />;
  }
  if (status === "error") {
    return <AlertCircle size={18} className="input-status__icon input-status__icon--error" aria-hidden />;
  }
  return null;
};

const renderFeedback = (state: FieldValidationState, helper?: string) => {
  if (state.status === "error" && state.message) {
    return (
      <>
        <p className="field-feedback field-feedback--error">{state.message}</p>
        {helper ? <p className="field-feedback field-feedback--muted">{helper}</p> : null}
      </>
    );
  }
  if (state.status === "valid" && state.message) {
    return <p className="field-feedback field-feedback--success">{state.message}</p>;
  }
  return helper ? <p className="field-feedback field-feedback--muted">{helper}</p> : null;
};

export const RegisterForm: React.FC<RegisterFormProps> = ({
  values,
  submitting = false,
  serverError = null,
  passwordHint,
  validation,
  canSubmit = true,
  onChange,
  onSubmit,
  onCancel,
}) => {
  const nameValidation = validation?.nombreCompleto ?? defaultValidationState;
  const emailValidation = validation?.email ?? defaultValidationState;
  const passwordValidation = validation?.password ?? defaultValidationState;

  return (
    <form className="space-y-4" onSubmit={onSubmit}>
      <div>
        <label className="block mb-1 text-sm text-gray-300" htmlFor="register-full-name">
          Nombre completo
        </label>
        <div className="input-status">
          <input
            id="register-full-name"
            type="text"
            className={getInputClass(nameValidation.status)}
            placeholder="Ej. HUGO SANCHEZ RESENDIZ"
            autoComplete="name"
            value={values.nombreCompleto}
            onChange={(event) => onChange("nombreCompleto", event.target.value.toUpperCase())}
            disabled={submitting}
            required
          />
          {renderStatusIcon(nameValidation.status)}
        </div>
        {renderFeedback(nameValidation, helperCopy)}
      </div>

      <div>
        <label className="block mb-1 text-sm text-gray-300" htmlFor="register-email">
          Correo institucional
        </label>
        <div className="input-status">
          <input
            id="register-email"
            type="email"
            className={getInputClass(emailValidation.status)}
            placeholder="usuario@institucion.mx"
            autoComplete="email"
            value={values.email}
            onChange={(event) => onChange("email", event.target.value)}
            disabled={submitting}
            required
          />
          {renderStatusIcon(emailValidation.status)}
        </div>
        {renderFeedback(emailValidation, "Usa un correo permitido por la institucion (termina en @institucion.mx o @aefcm.gob.mx).")}
      </div>

      <div>
        <label className="block mb-1 text-sm text-gray-300" htmlFor="register-password">
          Contrasena
        </label>
        <div className="input-status">
          <input
            id="register-password"
            type="password"
            className={getInputClass(passwordValidation.status)}
            placeholder="Debe cumplir los requisitos minimos"
            autoComplete="new-password"
            value={values.password}
            onChange={(event) => onChange("password", event.target.value)}
            disabled={submitting}
            required
          />
          {renderStatusIcon(passwordValidation.status)}
        </div>
        {passwordValidation.status === "valid" && passwordValidation.message ? (
          <p className="field-feedback field-feedback--success">{passwordValidation.message}</p>
        ) : (
          <>
            {passwordValidation.status === "error" && passwordValidation.message ? (
              <p className="field-feedback field-feedback--error">{passwordValidation.message}</p>
            ) : null}
            {passwordHint ? (
              <p className="field-feedback field-feedback--muted whitespace-pre-line">{passwordHint}</p>
            ) : null}
          </>
        )}
      </div>

      {serverError ? <p className="text-sm text-red-400">{serverError}</p> : null}

      <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
        {onCancel ? (
          <button type="button" className="btn btn-secondary sm:w-auto w-full" onClick={onCancel} disabled={submitting}>
            Cancelar
          </button>
        ) : null}
        <button type="submit" className="btn btn-primary sm:w-auto w-full" disabled={submitting || !canSubmit}>
          {submitting ? "Registrando..." : "Registrarme"}
        </button>
      </div>
    </form>
  );
};

export default RegisterForm;
