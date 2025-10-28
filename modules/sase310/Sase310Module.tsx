import React, { useCallback, useEffect, useMemo, useState } from "react";

import { useAuth } from "../../hooks/useAuth";
import {
  createReport,
  deleteReport,
  getReportsByUser,
  type Report,
  type ReportInput,
} from "./firestoreService";
import { loginUser, logoutUser, registerUser } from "../../services/authService";
import { ensureUserProfile, observeUserProfile, type UserProfile } from "./auth/services/userService";

type AuthMode = "login" | "register";

interface AuthFormState {
  email: string;
  password: string;
}

interface ReportFormState {
  title: string;
  description: string;
  category: string;
  date: string;
}

const emptyAuthForm: AuthFormState = { email: "", password: "" };
const emptyReportForm: ReportFormState = { title: "", description: "", category: "", date: "" };

const CATEGORIES = ["Seguimiento", "Incidencia", "Planeacion", "Otro"];
const INSTITUTIONAL_EMAIL_REGEX = /@institucion\.mx$/i;

const Sase310Module: React.FC = () => {
  const { user, loading: authLoading } = useAuth();

  const [authForm, setAuthForm] = useState<AuthFormState>(emptyAuthForm);
  const [authMode, setAuthMode] = useState<AuthMode>("login");
  const [authSubmitting, setAuthSubmitting] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authInfo, setAuthInfo] = useState<string | null>(null);

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);

  const [reports, setReports] = useState<Report[]>([]);
  const [reportsLoading, setReportsLoading] = useState(false);
  const [reportsError, setReportsError] = useState<string | null>(null);

  const [reportForm, setReportForm] = useState<ReportFormState>(emptyReportForm);
  const [reportSubmitting, setReportSubmitting] = useState(false);
  const [reportError, setReportError] = useState<string | null>(null);
  const [reportSuccess, setReportSuccess] = useState<string | null>(null);

  const isBusy = useMemo(
    () => authLoading || authSubmitting || reportSubmitting,
    [authLoading, authSubmitting, reportSubmitting],
  );
  const isAuthorized = profile?.autorizado === true;

  const clearReportFeedback = useCallback(() => {
    setReportError(null);
    setReportSuccess(null);
  }, []);

  const handleAuthInputChange = (field: keyof AuthFormState) => (event: React.ChangeEvent<HTMLInputElement>) => {
    setAuthError(null);
    setAuthInfo(null);
    setAuthForm((previous) => ({ ...previous, [field]: event.target.value }));
  };

  const handleAuthModeChange = (mode: AuthMode) => {
    setAuthMode(mode);
    setAuthError(null);
    setAuthInfo(null);
  };

  const handleReportInputChange =
    (field: keyof ReportFormState) => (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      clearReportFeedback();
      setReportForm((previous) => ({ ...previous, [field]: event.target.value }));
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
      console.error("[SASE-310] Failed to load reports:", error);
      setReportsError("No fue posible cargar los reportes. Intenta de nuevo.");
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
      () => {
        setProfileError("No se pudo cargar tu perfil docente. Intenta nuevamente.");
        setProfileLoading(false);
      },
    );

    return () => {
      unsubscribe();
    };
  }, [user?.uid]);

  useEffect(() => {
    if (!user || profileLoading || profile || !user.email) {
      return;
    }
    void ensureUserProfile(user.uid, user.email).catch((error: unknown) => {
      console.error("[SASE-310] Sincronizacion de perfil docente fallida:", error);
      setProfileError(
        error instanceof Error ? error.message : "No fue posible sincronizar tu perfil docente.",
      );
    });
  }, [user, profile, profileLoading]);

  const handleAuthSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setAuthError(null);
    setAuthInfo(null);
    setAuthSubmitting(true);

    const normalizedEmail = authForm.email.trim().toLowerCase();
    const { password } = authForm;

    if (authMode === "register" && !INSTITUTIONAL_EMAIL_REGEX.test(normalizedEmail)) {
      setAuthSubmitting(false);
      setAuthError("El registro docente solo acepta correos @institucion.mx.");
      return;
    }

    try {
      if (authMode === "login") {
        const account = await loginUser(normalizedEmail, password);
        await ensureUserProfile(account.uid, account.email ?? normalizedEmail);
      } else {
        const account = await registerUser(normalizedEmail, password);
        await ensureUserProfile(account.uid, account.email ?? normalizedEmail);
        setAuthInfo("Registro enviado. Un administrador revisara tu solicitud y te notificara al autorizarte.");
      }
      setAuthForm(emptyAuthForm);
    } catch (error) {
      console.error("[SASE-310] Auth action failed:", error);
      setAuthError(error instanceof Error ? error.message : "Ocurrio un error de autenticacion.");
    } finally {
      setAuthSubmitting(false);
    }
  };

  const handleLogout = async () => {
    setAuthError(null);
    setAuthInfo(null);
    setProfileError(null);
    setAuthSubmitting(true);
    try {
      await logoutUser();
    } catch (error) {
      console.error("[SASE-310] Logout failed:", error);
      setAuthError("No fue posible cerrar la sesion. Revisa tu conexion.");
    } finally {
      setAuthSubmitting(false);
    }
  };

  const handleCreateReport = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!user) {
      setReportError("Necesitas iniciar sesion para crear reportes.");
      return;
    }

    if (!isAuthorized) {
      setReportError("Tu cuenta docente aun no ha sido autorizada para crear reportes.");
      return;
    }

    setReportSubmitting(true);
    clearReportFeedback();

    try {
      const payload: ReportInput = {
        title: reportForm.title.trim(),
        description: reportForm.description.trim(),
        category: reportForm.category.trim(),
        date: reportForm.date.trim(),
        uid: user.uid,
      };
      await createReport(payload);
      setReportSuccess("Reporte creado correctamente.");
      setReportForm({ ...emptyReportForm, category: payload.category });
      await fetchReports();
    } catch (error) {
      console.error("[SASE-310] Report creation failed:", error);
      setReportError(error instanceof Error ? error.message : "No se pudo crear el reporte. Intenta mas tarde.");
    } finally {
      setReportSubmitting(false);
    }
  };

  const handleDeleteReport = async (reportId: string) => {
    if (isBusy) {
      return;
    }

    if (!user || !isAuthorized) {
      setReportError("No cuentas con permisos para eliminar reportes.");
      return;
    }

    setReportSubmitting(true);
    clearReportFeedback();

    try {
      await deleteReport(reportId);
      setReportSuccess("Reporte eliminado.");
      await fetchReports();
    } catch (error) {
      console.error("[SASE-310] Report deletion failed:", error);
      setReportError("No se pudo eliminar el reporte. Intenta mas tarde.");
    } finally {
      setReportSubmitting(false);
    }
  };

  const renderAuthForm = () => (
    <div className="card">
      <header className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-display">Acceso Docente SASE-310</h2>
        <div className="flex gap-2">
          <button
            type="button"
            className={`btn ${authMode === "login" ? "btn-primary" : "btn-secondary"}`}
            onClick={() => handleAuthModeChange("login")}
            disabled={isBusy}
          >
            Iniciar sesion
          </button>
          <button
            type="button"
            className={`btn ${authMode === "register" ? "btn-primary" : "btn-secondary"}`}
            onClick={() => handleAuthModeChange("register")}
            disabled={isBusy}
          >
            Registrar
          </button>
        </div>
      </header>

      <form onSubmit={handleAuthSubmit} className="space-y-4">
        <div>
          <label className="block mb-1 text-sm text-gray-300" htmlFor="sase-auth-email">
            Correo institucional
          </label>
          <input
            id="sase-auth-email"
            type="email"
            className="input-field w-full"
            placeholder="docente@institucion.mx"
            value={authForm.email}
            onChange={handleAuthInputChange("email")}
            disabled={isBusy}
            required
            autoComplete="email"
          />
        </div>

        <div>
          <label className="block mb-1 text-sm text-gray-300" htmlFor="sase-auth-password">
            Contrasena
          </label>
          <input
            id="sase-auth-password"
            type="password"
            className="input-field w-full"
            placeholder="Tu contrasena segura"
            value={authForm.password}
            onChange={handleAuthInputChange("password")}
            disabled={isBusy}
            required
            autoComplete={authMode === "login" ? "current-password" : "new-password"}
          />
        </div>

        {authError ? <p className="text-sm text-red-400">{authError}</p> : null}
        {authInfo ? <p className="text-sm text-emerald-400">{authInfo}</p> : null}

        <button
          type="submit"
          className="btn btn-primary w-full"
          disabled={isBusy || !authForm.email || !authForm.password}
        >
          {authSubmitting ? "Procesando..." : authMode === "login" ? "Entrar" : "Crear cuenta"}
        </button>
      </form>

      {authLoading ? (
        <p className="text-xs text-gray-400 mt-4">Sincronizando sesion...</p>
      ) : (
        <p className="text-xs text-gray-500 mt-4">
          Accede con tu correo docente para gestionar reportes vinculados a estudiantes.
        </p>
      )}
    </div>
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
        <p className="text-xs text-gray-500 mt-3">
          Si el problema persiste, contacta al administrador para confirmar tu registro.
        </p>
      </div>
      <div className="card flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <p className="text-sm text-gray-400">Puedes cerrar sesion e intentarlo mas tarde.</p>
        <button
          type="button"
          className="btn btn-secondary md:w-auto w-full"
          onClick={handleLogout}
          disabled={isBusy}
        >
          {authSubmitting ? "Cerrando sesion..." : "Cerrar sesion"}
        </button>
      </div>
    </section>
  );

  const renderProfileUnavailable = () => (
    <section className="space-y-6">
      <div className="card">
        <h3 className="text-lg font-display mb-2">Perfil docente en preparación</h3>
        <p className="text-sm text-gray-400">
          Estamos sincronizando tu registro con el sistema de reportes. Recarga la pagina en unos momentos.
        </p>
      </div>
      <div className="card flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <p className="text-sm text-gray-400">Si ya paso un tiempo considerable, avisa a tu administrador.</p>
        <button
          type="button"
          className="btn btn-secondary md:w-auto w-full"
          onClick={handleLogout}
          disabled={isBusy}
        >
          {authSubmitting ? "Cerrando sesion..." : "Cerrar sesion"}
        </button>
      </div>
    </section>
  );

  const renderPendingAuthorization = () => (
    <section className="space-y-6">
      <div className="card">
        <h3 className="text-lg font-display mb-2">Tu cuenta esta en revisión</h3>
        <p className="text-sm text-gray-400">
          Recibimos tu solicitud. Un administrador validara tu correo institucional antes de habilitar el acceso.
        </p>
        <div className="mt-4 text-xs text-gray-500 space-y-1">
          <p>
            <span className="font-semibold text-white">Correo:</span> {user?.email ?? "Sin correo"}
          </p>
          <p>
            <span className="font-semibold text-white">Rol asignado:</span> {profile?.rol ?? "docente"}
          </p>
        </div>
        {authInfo ? <p className="text-sm text-emerald-400 mt-4">{authInfo}</p> : null}
      </div>
      <div className="card flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <p className="text-sm text-gray-400">
          Te notificaremos en cuanto tu cuenta quede autorizada. Puedes cerrar sesion y regresar mas tarde.
        </p>
        <button
          type="button"
          className="btn btn-secondary md:w-auto w-full"
          onClick={handleLogout}
          disabled={isBusy}
        >
          {authSubmitting ? "Cerrando sesion..." : "Cerrar sesion"}
        </button>
      </div>
    </section>
  );

  const renderHeader = () => (
    <header className="card flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
      <div>
        <h2 className="text-xl font-display text-[var(--accent-1)]">SASE-310 Reportes</h2>
        <p className="text-sm text-gray-400">
          Gestiona reportes vinculados a tu cuenta de Firebase Authentication.
        </p>
      </div>
      <div className="flex flex-col items-start gap-2 md:items-end">
        <div className="text-sm text-gray-300">
          <span className="font-semibold text-white">{user?.email ?? "Sin correo"}</span>
          <span className="block text-xs text-gray-500">Rol: {profile?.rol ?? "Sin rol"}</span>
        </div>
        <button type="button" className="btn btn-secondary" onClick={handleLogout} disabled={isBusy}>
          {authSubmitting ? "Cerrando sesion..." : "Cerrar sesion"}
        </button>
      </div>
    </header>
  );

  const renderReportForm = () => (
    <div className="card">
      <h3 className="text-lg font-display mb-4">Crear nuevo reporte</h3>
      <form onSubmit={handleCreateReport} className="space-y-4">
        <div>
          <label className="block mb-1 text-sm text-gray-300" htmlFor="sase-report-title">
            Titulo del reporte
          </label>
          <input
            id="sase-report-title"
            type="text"
            className="input-field w-full"
            placeholder="Ej. Seguimiento de clase SASE-310"
            value={reportForm.title}
            onChange={handleReportInputChange("title")}
            disabled={isBusy}
            required
          />
        </div>

        <div>
          <label className="block mb-1 text-sm text-gray-300" htmlFor="sase-report-description">
            Descripcion
          </label>
          <textarea
            id="sase-report-description"
            className="input-field w-full h-32"
            placeholder="Describe hallazgos, acuerdos y acciones del reporte."
            value={reportForm.description}
            onChange={handleReportInputChange("description")}
            disabled={isBusy}
            required
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="block mb-1 text-sm text-gray-300" htmlFor="sase-report-category">
              Categoria
            </label>
            <select
              id="sase-report-category"
              className="input-field w-full"
              value={reportForm.category}
              onChange={handleReportInputChange("category")}
              disabled={isBusy}
              required
            >
              <option value="">Selecciona una categoria</option>
              {CATEGORIES.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block mb-1 text-sm text-gray-300" htmlFor="sase-report-date">
              Fecha
            </label>
            <input
              id="sase-report-date"
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
        <p className="text-sm text-gray-400">Aun no has generado reportes para SASE-310.</p>
      ) : null}

      <ul className="space-y-3">
        {reports.map((report) => (
          <li key={report.id} className="bg-black/30 border border-gray-800 rounded-lg p-3">
            <header className="flex items-start justify-between gap-3">
              <div>
                <h4 className="text-base font-semibold text-white">{report.title}</h4>
                <p className="text-xs text-gray-500">
                  Creado: {report.createdAt.toDate().toLocaleString()} | Ultima actualizacion:{" "}
                  {report.updatedAt.toDate().toLocaleString()}
                </p>
                <p className="text-xs text-gray-500">
                  Categoria: {report.category} | Fecha de aplicacion: {report.date.toDate().toLocaleDateString()}
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
    return (
      <section className="space-y-6">
        {renderAuthForm()}
        <div className="card">
          <p className="text-sm text-gray-400">
            Una vez autenticado podras crear reportes y vincularlos automaticamente con tu cuenta docente.
          </p>
        </div>
      </section>
    );
  }

  if (profileLoading) {
    return renderProfileLoading();
  }

  if (profileError) {
    return renderProfileError();
  }

  if (!profile) {
    return renderProfileUnavailable();
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
