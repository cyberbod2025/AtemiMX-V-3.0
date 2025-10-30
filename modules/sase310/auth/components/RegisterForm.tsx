import React from "react";

export interface RegisterFormValues {
  nombreCompleto: string;
  email: string;
  password: string;
}

interface RegisterFormProps {
  values: RegisterFormValues;
  submitting?: boolean;
  serverError?: string | null;
  isEmailValid?: boolean;
  onChange: (field: keyof RegisterFormValues, value: string) => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  onCancel?: () => void;
}

const helperCopy =
  "Introduce tu nombre tal como aparece en la plantilla autorizada. Cuando se valide, tu cuenta se activara automaticamente.";

export const RegisterForm: React.FC<RegisterFormProps> = ({
  values,
  submitting = false,
  serverError = null,
  isEmailValid = true,
  onChange,
  onSubmit,
  onCancel,
}) => (
  <form className="space-y-4" onSubmit={onSubmit}>
    <div>
      <label className="block mb-1 text-sm text-gray-300" htmlFor="register-full-name">
        Nombre completo
      </label>
      <input
        id="register-full-name"
        type="text"
        className="input-field w-full"
        placeholder="Ej. HUGO SANCHEZ RESENDIZ"
        autoComplete="name"
        value={values.nombreCompleto}
        onChange={(event) => onChange("nombreCompleto", event.target.value)}
        disabled={submitting}
        required
      />
      <p className="text-xs text-gray-400 mt-1">{helperCopy}</p>
    </div>

    <div>
      <label className="block mb-1 text-sm text-gray-300" htmlFor="register-email">
        Correo institucional
      </label>
      <input
        id="register-email"
        type="email"
        className="input-field w-full"
        placeholder="usuario@institucion.mx"
        autoComplete="email"
        value={values.email}
        onChange={(event) => onChange("email", event.target.value)}
        disabled={submitting}
        required
      />
      {values.email && !isEmailValid ? (
        <p className="text-xs text-red-400 mt-1">Usa un correo permitido por la institucion.</p>
      ) : null}
    </div>

    <div>
      <label className="block mb-1 text-sm text-gray-300" htmlFor="register-password">
        Contrasena
      </label>
      <input
        id="register-password"
        type="password"
        className="input-field w-full"
        placeholder="Escribe una contrasena segura"
        autoComplete="new-password"
        value={values.password}
        onChange={(event) => onChange("password", event.target.value)}
        disabled={submitting}
        required
      />
    </div>

    {serverError ? <p className="text-sm text-red-400">{serverError}</p> : null}

    <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
      {onCancel ? (
        <button type="button" className="btn btn-secondary sm:w-auto w-full" onClick={onCancel} disabled={submitting}>
          Cancelar
        </button>
      ) : null}
      <button type="submit" className="btn btn-primary sm:w-auto w-full" disabled={submitting}>
        {submitting ? "Registrando..." : "Registrarme"}
      </button>
    </div>
  </form>
);

export default RegisterForm;
