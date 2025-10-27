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

const Sase310Module: React.FC = () => {
  const { user, loading: authLoading } = useAuth();

  const [authForm, setAuthForm] = useState<AuthFormState>(emptyAuthForm);
  const [authMode, setAuthMode] = useState<AuthMode>("login");
  const [authSubmitting, setAuthSubmitting] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

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

  const clearReportFeedback = useCallback(() => {
    setReportError(null);
    setReportSuccess(null);
  }, []);

  const handleAuthInputChange = (field: keyof AuthFormState) => (event: React.ChangeEvent<HTMLInputElement>) => {
    setAuthForm((previous) => ({ ...previous, [field]: event.target.value }));
  };

  const handleReportInputChange =
    (field: keyof ReportFormState) => (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      clearReportFeedback();
      setReportForm((previous) => ({ ...previous, [field]: event.target.value }));
    };

  const fetchReports = useCallback(async () => {
    if (!user) {
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
  }, [user]);

  useEffect(() => {
    void fetchReports();
  }, [fetchReports]);

  const handleAuthSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setAuthError(null);
    setAuthSubmitting(true);

    const { email, password } = authForm;

    try {
      if (authMode === "login") {
        await loginUser(email, password);
      } else {
        await registerUser(email, password);
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
            onClick={() => setAuthMode("login")}
            disabled={isBusy}
          >
            Iniciar sesion
          </button>
          <button
            type="button"
            className={`btn ${authMode === "register" ? "btn-primary" : "btn-secondary"}`}
            onClick={() => setAuthMode("register")}
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

  return (
    <section className="space-y-6">
      {renderHeader()}
      {renderReportForm()}
      {renderReportsList()}
    </section>
  );
};

export default Sase310Module;
