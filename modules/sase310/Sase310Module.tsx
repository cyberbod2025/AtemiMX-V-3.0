import React, { useCallback, useEffect, useMemo, useState } from "react";

import { useAuth } from "../../hooks/useAuth";
import { loginUser, logoutUser } from "../../services/authService";
import RegisterForm, { type RegisterFormValues } from "./auth/components/RegisterForm";
import {
  ensureUserProfile,
  observeTeacherProfile,
  observeUserProfile,
  registerUserWithWhitelist,
  saveTeacherProfile,
  type TeacherProfile,
  type UserProfile,
} from "./auth/services/userService";
import { createReport, deleteReport, getReportsByUser, type Report, type ReportInput } from "./firestoreService";

type AuthStep = "chooser" | "login" | "register";

interface AuthFormState {
  email: string;
  password: string;
}

type RegisterFormState = RegisterFormValues;

interface ReportFormState {
  title: string;
  description: string;
  category: string;
  date: string;
}

interface Sase310ModuleProps {
  onNavigateHome?: () => void;
}

const EMAIL_WHITELIST_REGEX = /@institucion\.mx$/i;
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{10,}$/;
const PASSWORD_REQUIREMENTS = [
  "• Minimo 10 caracteres.",
  "• Incluye al menos una letra mayuscula.",
  "• Incluye al menos una letra minuscula.",
  "• Incluye al menos un numero."
].join("\n");
const DEFAULT_PLANTEL = "SECUNDARIA 310 PRESIDENTES DE MEXICO";
const CATEGORIES = ["Seguimiento", "Incidencia", "Planeacion", "Otro"];

const emptyAuthForm: AuthFormState = { email: "", password: "" };
const emptyRegisterForm: RegisterFormState = { nombreCompleto: "", email: "", password: "" };
const emptyReportForm: ReportFormState = { title: "", description: "", category: "", date: "" };

const chooserButtonStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  alignItems: "flex-start",
  justifyContent: "center",
  gap: "0.25rem",
  width: "100%",
  padding: "1rem 1.25rem",
  borderRadius: "14px",
  border: "1px solid var(--accent-1)",
  background: "rgba(0, 230, 118, 0.12)",
  color: "#e6e7e8",
  textAlign: "left",
  fontSize: "0.95rem",
  fontWeight: 600,
  cursor: "pointer",
  transition: "transform 0.18s ease, box-shadow 0.18s ease",
};

const chooserSecondaryButtonStyle: React.CSSProperties = {
  ...chooserButtonStyle,
  border: "1px solid rgba(255, 255, 255, 0.15)",
  background: "rgba(18, 18, 20, 0.85)",
  color: "rgba(230, 231, 232, 0.9)",
};

const Sase310Module: React.FC<Sase310ModuleProps> = ({ onNavigateHome }) => {
  const { user, loading: authLoading } = useAuth();

  const [authStep, setAuthStep] = useState<AuthStep>("chooser");
  const [authForm, setAuthForm] = useState<AuthFormState>(emptyAuthForm);
  const [registerForm, setRegisterForm] = useState<RegisterFormState>(emptyRegisterForm);
  const [authSubmitting, setAuthSubmitting] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authInfo, setAuthInfo] = useState<string | null>(null);

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);

  const [teacherProfile, setTeacherProfile] = useState<TeacherProfile | null>(null);
  const [teacherProfileLoading, setTeacherProfileLoading] = useState(false);
  const [teacherProfileError, setTeacherProfileError] = useState<string | null>(null);
  const [teacherProfileSubmitting, setTeacherProfileSubmitting] = useState(false);

  const [reports, setReports] = useState<Report[]>([]);
  const [reportsLoading, setReportsLoading] = useState(false);
  const [reportsError, setReportsError] = useState<string | null>(null);

  const [reportForm, setReportForm] = useState<ReportFormState>(emptyReportForm);
  const [reportSubmitting, setReportSubmitting] = useState(false);
  const [reportError, setReportError] = useState<string | null>(null);
  const [reportSuccess, setReportSuccess] = useState<string | null>(null);

  const normalizedAuthEmail = authForm.email.trim().toLowerCase();
  const normalizedRegisterEmail = registerForm.email.trim().toLowerCase();

  const isRegisterEmailValid = useMemo(() => {
    if (!normalizedRegisterEmail) {
      return true;
    }
    return EMAIL_WHITELIST_REGEX.test(normalizedRegisterEmail);
  }, [normalizedRegisterEmail]);

  const isAuthorized = profile?.autorizado === true;

  const isBusy = authSubmitting || reportSubmitting || teacherProfileSubmitting;

  const resetAuthMessages = () => {
    setAuthError(null);
    setAuthInfo(null);
  };

  const handleSelectStep = (step: AuthStep) => {
    setAuthStep(step);
    resetAuthMessages();
    setAuthForm(emptyAuthForm);
    setRegisterForm(emptyRegisterForm);
  };

  const handleAuthInputChange =
    (field: keyof AuthFormState) => (event: React.ChangeEvent<HTMLInputElement>) => {
      resetAuthMessages();
      setAuthForm((prev) => ({ ...prev, [field]: event.target.value }));
    };

  const handleRegisterFieldChange = (field: keyof RegisterFormState, value: string) => {
    resetAuthMessages();
    const nextValue = field === "nombreCompleto" ? value.toUpperCase() : value;
    setRegisterForm((prev) => ({ ...prev, [field]: nextValue }));
  };

  const handleLoginSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    resetAuthMessages();
    setAuthSubmitting(true);
    try {
      if (!normalizedAuthEmail || !authForm.password) {
        setAuthError("Completa tu correo y contrasena.");
        return;
      }
      const account = await loginUser(normalizedAuthEmail, authForm.password);
      await ensureUserProfile(account.uid, account.email ?? normalizedAuthEmail);
      setAuthForm(emptyAuthForm);
      setAuthStep("chooser");
    } catch (error) {
      console.error("[SASE-310] Login failed:", error);
      setAuthError(error instanceof Error ? error.message : "No fue posible iniciar sesion.");
    } finally {
      setAuthSubmitting(false);
    }
  };

  const handleRegisterSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    resetAuthMessages();

    const nombreCompleto = registerForm.nombreCompleto.trim().toUpperCase();
    if (!nombreCompleto) {
      setAuthError("Ingresa tu nombre completo tal como aparece en la plantilla autorizada.");
      return;
    }
    const passwordValue = registerForm.password.trim();
    if (!normalizedRegisterEmail || !passwordValue) {
      setAuthError("Completa tu correo institucional y una contrasena segura.");
      return;
    }
    if (!isRegisterEmailValid) {
      setAuthError("Usa un correo permitido por la institucion.");
      return;
    }
    if (!PASSWORD_REGEX.test(passwordValue)) {
      setAuthError("La contrasena debe tener al menos 10 caracteres, incluir mayuscula, minuscula y numero.");
      return;
    }

    setAuthSubmitting(true);
    try {
      const { user: createdUser, profile: createdProfile } = await registerUserWithWhitelist({
        nombreCompleto,
        email: normalizedRegisterEmail,
        password: passwordValue,
      });
      await saveTeacherProfile(createdUser.uid, {
        nombre: nombreCompleto,
        plantel: DEFAULT_PLANTEL,
      });
      setRegisterForm(emptyRegisterForm);
      setAuthInfo("Registro recibido. Vinculamos tu perfil automaticamente, espera unos segundos.");
      setProfile(createdProfile);
      setAuthStep("chooser");
    } catch (error) {
      console.error("[SASE-310] Register failed:", error);
      setAuthError(error instanceof Error ? error.message : "No fue posible completar el registro.");
    } finally {
      setAuthSubmitting(false);
    }
  };

  const handleLogout = async () => {
    setAuthSubmitting(true);
    try {
      await logoutUser();
      setAuthStep("chooser");
      setAuthForm(emptyAuthForm);
      onNavigateHome?.();
    } catch (error) {
      console.error("[SASE-310] Logout failed:", error);
      setAuthError("No fue posible cerrar sesion. Intenta nuevamente.");
    } finally {
      setAuthSubmitting(false);
    }
  };

  const fetchReports = useCallback(async () => {
    if (!user || !isAuthorized) {
      setReports([]);
      return;
    }

    setReportsLoading(true);
    setReportsError(null);
    try {
      const data = await getReportsByUser(user.uid);
      setReports(data);
    } catch (error) {
      console.error("[SASE-310] Failed to fetch reports:", error);
      setReportsError("No fue posible cargar los reportes.");
    } finally {
      setReportsLoading(false);
    }
  }, [user, isAuthorized]);

  useEffect(() => {
    void fetchReports();
  }, [fetchReports]);

  useEffect(() => {
    if (!user) {
      setProfile(null);
      setProfileLoading(false);
      setProfileError(null);
      return;
    }
    setProfileLoading(true);
    setProfileError(null);
    const unsubscribe = observeUserProfile(
      user.uid,
      (nextProfile) => {
        setProfile(nextProfile);
        setProfileLoading(false);
      },
      (error) => {
        console.error("[SASE-310] observeUserProfile error:", error);
        setProfileError("No fue posible cargar tu perfil docente.");
        setProfileLoading(false);
      },
    );
    return () => {
      unsubscribe();
    };
  }, [user]);

  useEffect(() => {
    if (!profile || isAuthorized) {
      return;
    }
    const redirectTimer = window.setTimeout(() => {
      onNavigateHome?.();
      setAuthStep("chooser");
    }, 4000);
    return () => window.clearTimeout(redirectTimer);
  }, [profile, isAuthorized, onNavigateHome]);

  useEffect(() => {
    if (!user) {
      setTeacherProfile(null);
      setTeacherProfileLoading(false);
      setTeacherProfileError(null);
      return;
    }
    setTeacherProfileLoading(true);
    setTeacherProfileError(null);
    const unsubscribe = observeTeacherProfile(
      user.uid,
      (nextProfile) => {
        setTeacherProfile(nextProfile);
        setTeacherProfileLoading(false);
      },
      (error) => {
        console.error("[SASE-310] observeTeacherProfile error:", error);
        setTeacherProfileError("No fue posible cargar tus datos docentes.");
        setTeacherProfileLoading(false);
      },
    );
    return () => {
      unsubscribe();
    };
  }, [user]);

  useEffect(() => {
    if (
      !user ||
      !profile ||
      teacherProfile ||
      teacherProfileLoading ||
      teacherProfileSubmitting
    ) {
      return;
    }

    const nombre = profile.nombreCompleto?.trim().toUpperCase() ?? profile.email?.toUpperCase() ?? "DOCENTE";

    setTeacherProfileSubmitting(true);
    setTeacherProfileError(null);
    void saveTeacherProfile(user.uid, {
      nombre,
      plantel: DEFAULT_PLANTEL,
    })
      .catch((error) => {
        console.error("[SASE-310] Auto save teacher profile failed:", error);
        setTeacherProfileError("No pudimos vincular tus datos docentes automaticamente.");
      })
      .finally(() => {
        setTeacherProfileSubmitting(false);
      });
  }, [user, profile, teacherProfile, teacherProfileLoading, teacherProfileSubmitting]);

  const handleReportInputChange =
    (field: keyof ReportFormState) =>
    (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setReportError(null);
      setReportSuccess(null);
      setReportForm((prev) => ({ ...prev, [field]: event.target.value }));
    };

  const handleCreateReport = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!user) {
      setReportError("Debes iniciar sesiAƒA³n para crear un reporte.");
      return;
    }
    if (!isAuthorized) {
      setReportError("Tu cuenta aun no ha sido autorizada.");
      return;
    }

    setReportSubmitting(true);
    setReportError(null);
    setReportSuccess(null);
    try {
      const payload: ReportInput = {
        title: reportForm.title.trim(),
        description: reportForm.description.trim(),
        category: reportForm.category.trim(),
        date: reportForm.date.trim(),
        uid: user.uid,
      };
      const ownerMeta = {
        name: profile?.nombreCompleto ?? teacherProfile?.nombre ?? null,
        email: user.email ?? null,
        role: profile?.rol ?? null,
      };
      await createReport(payload, ownerMeta);
      setReportForm({ ...emptyReportForm, category: payload.category });
      setReportSuccess("Reporte creado correctamente.");
      await fetchReports();
    } catch (error) {
      console.error("[SASE-310] Create report failed:", error);
      setReportError(error instanceof Error ? error.message : "No fue posible crear el reporte.");
    } finally {
      setReportSubmitting(false);
    }
  };

  const handleDeleteReport = async (reportId: string) => {
    setReportSubmitting(true);
    setReportError(null);
    setReportSuccess(null);
    try {
      await deleteReport(reportId);
      setReportSuccess("Reporte eliminado.");
      await fetchReports();
    } catch (error) {
      console.error("[SASE-310] Delete report failed:", error);
      setReportError("No fue posible eliminar el reporte.");
    } finally {
      setReportSubmitting(false);
    }
  };

  const renderChooser = () => (
    <section className="card space-y-4">
      <header>
        <h2 className="text-xl font-display text-white">SASE-310 Piloto</h2>
        <p className="text-sm text-gray-400">Elige cAƒA³mo deseas continuar.</p>
      </header>
      <div className="flex flex-col gap-3 md:flex-row md:gap-4">
        <button
          type="button"
          className="btn btn-primary w-full"
          onClick={() => handleSelectStep("login")}
          disabled={isBusy}
        >
          Ingresar con correo y contrasena
        </button>
        <button
          type="button"
          className="btn btn-secondary w-full"
          onClick={() => handleSelectStep("register")}
          disabled={isBusy}
        >
          Registrate (preregistro)
        </button>
      </div>
    </section>
  );

  const renderLoginForm = () => (
    <section className="card space-y-4">
      <header className="space-y-2">
        <h2 className="text-xl font-display text-white">Ingresar</h2>
        <p className="text-sm text-gray-400">
          Usa tu correo institucional u oficial. Si no tienes cuenta, vuelve y elige la opciAƒA³n de preregistro.
        </p>
      </header>
      <form onSubmit={handleLoginSubmit} className="space-y-4">
        <div>
          <label className="block mb-1 text-sm text-gray-300" htmlFor="login-email">
            Correo
          </label>
          <input
            id="login-email"
            type="email"
            className="input-field w-full"
            placeholder="ej. docente@aefcm.gob.mx"
            value={authForm.email}
            onChange={handleAuthInputChange("email")}
            disabled={isBusy}
            required
            autoComplete="email"
          />
        </div>
        <div>
          <label className="block mb-1 text-sm text-gray-300" htmlFor="login-password">
            Contrasena
          </label>
          <input
            id="login-password"
            type="password"
            className="input-field w-full"
            placeholder="Tu contrasena"
            value={authForm.password}
            onChange={handleAuthInputChange("password")}
            disabled={isBusy}
            required
            autoComplete="current-password"
          />
        </div>
        {authError ? <p className="text-sm text-red-400">{authError}</p> : null}
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <button type="button" className="btn btn-secondary md:w-auto w-full" onClick={() => handleSelectStep("chooser")}>
            Volver
          </button>
          <button type="submit" className="btn btn-primary md:w-auto w-full" disabled={isBusy || !authForm.email || !authForm.password}>
            {authSubmitting ? "Ingresando..." : "Ingresar"}
          </button>
        </div>
      </form>
    </section>
  );

  const renderRegisterForm = () => (
    <section className="card space-y-5">
      <header className="space-y-2">
        <h2 className="text-xl font-display text-white">Registro con lista blanca</h2>
        <p className="text-sm text-gray-400">
          Validamos tu nombre contra la plantilla autorizada. Si coincide y no se ha usado, tu cuenta queda activa de inmediato.
        </p>
      </header>
      <RegisterForm
        values={registerForm}
        submitting={authSubmitting}
        serverError={authError}
        isEmailValid={isRegisterEmailValid}
        passwordHint={PASSWORD_REQUIREMENTS}
        onChange={handleRegisterFieldChange}
        onSubmit={handleRegisterSubmit}
        onCancel={() => handleSelectStep("chooser")}
      />
      {authInfo ? <p className="text-sm text-emerald-400">{authInfo}</p> : null}
      <p className="text-xs text-gray-500">
        La lista blanca se gestiona desde Firestore. Cada docente cuenta con un unico acceso asignado y se vincula automaticamente al plantel {DEFAULT_PLANTEL}.
      </p>
    </section>
  );

  const renderProfileLoading = () => (
    <section className="space-y-6">
      <div className="card">
        <p className="text-sm text-gray-400">Validando permisos docentes...</p>
      </div>
    </section>
  );

  const renderProfileError = () => (
    <section className="space-y-6">
      <div className="card">
        <h3 className="text-lg font-display mb-2">No fue posible cargar tu perfil docente</h3>
        <p className="text-sm text-red-400">{profileError}</p>
        <p className="text-xs text-gray-500 mt-3">Intenta cerrar sesiAƒA³n y volver a ingresar.</p>
      </div>
      <div className="card flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <p className="text-sm text-gray-400">Puedes volver al menAƒAº principal si lo prefieres.</p>
        <button type="button" className="btn btn-secondary md:w-auto w-full" onClick={handleLogout} disabled={isBusy}>
          Cerrar sesiAƒA³n
        </button>
      </div>
    </section>
  );

  const renderTeacherProfileMissing = () => (
    <section className="space-y-6">
      <div className="card space-y-3">
        <h3 className="text-lg font-display text-white">Registrando datos docentes...</h3>
        <p className="text-sm text-gray-400">
          Estamos vinculando tu perfil con el plantel {DEFAULT_PLANTEL}. Este paso ocurre automaticamente la primera vez que ingresas.
        </p>
        {teacherProfileSubmitting ? (
          <p className="text-sm text-gray-400">Guardando informacion...</p>
        ) : null}
        {teacherProfileError ? (
          <p className="text-sm text-red-400">{teacherProfileError}</p>
        ) : (
          <p className="text-xs text-gray-500">
            Puedes permanecer en esta pantalla; en segundos te mostraremos el modulo cuando la sincronizacion finalice.
          </p>
        )}
      </div>
    </section>
  );

  const renderPendingAuthorization = () => (
    <section className="card space-y-4">
      <h3 className="text-lg font-display text-white">Preregistro recibido</h3>
      <p className="text-sm text-gray-400">
        Tu cuenta esta en validacion. Te avisaremos al correo cuando puedas ingresar al modulo.
      </p>
      <div className="rounded-md border border-gray-800 bg-black/20 p-3 text-xs text-gray-300 space-y-1">
        <p>
          <span className="font-semibold text-white">Correo:</span> {user?.email ?? "Sin correo"}
        </p>
        <p>
          <span className="font-semibold text-white">Rol asignado:</span> {profile?.rol ?? "docente"}
        </p>
      </div>
      <p className="text-xs text-gray-500">
        Te enviaremos un aviso cuando la cuenta este autorizada. Esta ventana se cerrara automaticamente.
      </p>
    </section>
  );

  const renderHeader = () => (
    <header className="card flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
      <div>
        <h2 className="text-xl font-display text-[var(--accent-1)]">SASE-310 Reportes</h2>
        <p className="text-sm text-gray-400">Gestiona reportes vinculados a tu cuenta docente.</p>
      </div>
      <div className="flex flex-col items-start gap-2 md:items-end">
        <div className="text-sm text-gray-300">
          <span className="font-semibold text-white">{user?.email ?? "Sin correo"}</span>
          <span className="block text-xs text-gray-500">Rol: {profile?.rol ?? "docente"}</span>
        </div>
        <div className="flex flex-col gap-2 md:flex-row">
          <button type="button" className="btn btn-secondary" onClick={handleLogout} disabled={isBusy}>
            {authSubmitting ? "Cerrando sesiAƒA³n..." : "Cerrar sesiAƒA³n"}
          </button>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => {
              onNavigateHome?.();
            }}
            disabled={isBusy}
          >
            Volver al menAƒAº
          </button>
        </div>
      </div>
    </header>
  );

  const renderReportForm = () => (
    <div className="card">
      <h3 className="text-lg font-display mb-4">Crear nuevo reporte</h3>
      <form onSubmit={handleCreateReport} className="space-y-4">
        <div>
          <label className="block mb-1 text-sm text-gray-300" htmlFor="report-title">
            TAƒA­tulo
          </label>
          <input
            id="report-title"
            type="text"
            className="input-field w-full"
            placeholder="Ej. Seguimiento de clase"
            value={reportForm.title}
            onChange={handleReportInputChange("title")}
            disabled={isBusy}
            required
          />
        </div>
        <div>
          <label className="block mb-1 text-sm text-gray-300" htmlFor="report-description">
            DescripciAƒA³n
          </label>
          <textarea
            id="report-description"
            className="input-field w-full h-32"
            placeholder="Describe la situaciAƒA³n o seguimiento"
            value={reportForm.description}
            onChange={handleReportInputChange("description")}
            disabled={isBusy}
            required
          />
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="block mb-1 text-sm text-gray-300" htmlFor="report-category">
              CategorAƒA­a
            </label>
            <select
              id="report-category"
              className="input-field w-full"
              value={reportForm.category}
              onChange={handleReportInputChange("category")}
              disabled={isBusy}
              required
            >
              <option value="">Selecciona una categorAƒA­a</option>
              {CATEGORIES.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block mb-1 text-sm text-gray-300" htmlFor="report-date">
              Fecha
            </label>
            <input
              id="report-date"
              type="date"
              className="input-field w-full"
              value={reportForm.date}
              onChange={handleReportInputChange("date")}
              disabled={isBusy}
              required
            />
          </div>
        </div>
        {reportError ? <p className="text-sm text-red-400">{reportError}</p> : null}
        {reportSuccess ? <p className="text-sm text-emerald-400">{reportSuccess}</p> : null}
        <button type="submit" className="btn btn-primary" disabled={isBusy}>
          {reportSubmitting ? "Guardando..." : "Guardar reporte"}
        </button>
      </form>
    </div>
  );

  const renderReportsList = () => (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-display">Historial de reportes</h3>
        <button type="button" className="btn btn-secondary" onClick={() => void fetchReports()} disabled={isBusy}>
          Recargar
        </button>
      </div>
      {reportsLoading ? <p className="text-sm text-gray-400">Cargando reportes...</p> : null}
      {reportsError ? <p className="text-sm text-red-400">{reportsError}</p> : null}
      {!reportsLoading && reports.length === 0 && !reportsError ? (
        <p className="text-sm text-gray-400">AAƒAºn no has registrado reportes.</p>
      ) : null}
      <ul className="space-y-3">
        {reports.map((report) => (
          <li key={report.id} className="bg-black/30 border border-gray-800 rounded-lg p-3">
            <header className="flex items-start justify-between gap-3">
              <div>
                <h4 className="text-base font-semibold text-white">{report.title}</h4>
                <p className="text-xs text-gray-500">
                  Creado: {report.createdAt.toDate().toLocaleString()} | AƒA¡ltima actualizaciAƒA³n:{" "}
                  {report.updatedAt.toDate().toLocaleString()}
                </p>
                <p className="text-xs text-gray-500">
                  CategorAƒA­a: {report.category} | Fecha de aplicaciAƒA³n: {report.date.toDate().toLocaleDateString()}
                </p>
              </div>
              <button
                type="button"
                className="btn btn-secondary text-xs px-2 py-1"
                onClick={() => void handleDeleteReport(report.id)}
                disabled={isBusy}
              >
                Eliminar
              </button>
            </header>
            <p className="text-sm text-gray-200 mt-2 whitespace-pre-wrap">{report.description}</p>
          </li>
        ))}
      </ul>
    </div>
  );

  if (!user) {
    if (authStep === "login") {
      return renderLoginForm();
    }
    if (authStep === "register") {
      return renderRegisterForm();
    }
    return renderChooser();
  }

  if (profileLoading || teacherProfileLoading) {
    return renderProfileLoading();
  }

  if (profileError) {
    return renderProfileError();
  }

  if (!teacherProfile) {
    return renderTeacherProfileMissing();
  }

  if (!isAuthorized) {
    return renderPendingAuthorization();
  }

  return (
    <section className="space-y-6">
      {renderHeader()}
      {renderReportForm()}
      {renderReportsList()}
    </section>
  );
};

export default Sase310Module;







