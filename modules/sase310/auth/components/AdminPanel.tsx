import React, { useMemo, useState } from "react";

import { useAuthAdmin } from "../hooks/useAuthAdmin";
import type { AssignableRole, UserProfile } from "../services/userService";

interface AdminPanelProps {
  onRefreshRequested?: () => void;
}

const ROLE_OPTIONS: Array<{ value: AssignableRole; label: string }> = [
  { value: "teacher", label: "Docente" },
  { value: "guidance", label: "Orientacion" },
  { value: "prefect", label: "Prefectura" },
  { value: "medical", label: "Servicio Medico" },
  { value: "socialWork", label: "Trabajo Social" },
  { value: "clerk", label: "Secretaria" },
];

const getRoleLabel = (role: UserProfile["rol"]): string => {
  if (role === "admin") {
    return "Direccion";
  }
  const match = ROLE_OPTIONS.find((option) => option.value === role);
  return match?.label ?? role;
};

const getDefaultRole = (profile: UserProfile): AssignableRole => {
  if (profile.rol === "admin") {
    return "teacher";
  }
  if (
    ROLE_OPTIONS.some((option) => option.value === profile.rol)
  ) {
    return profile.rol as AssignableRole;
  }
  return "teacher";
};

export const AdminPanel: React.FC<AdminPanelProps> = ({ onRefreshRequested }) => {
  const { pending, loading, error, approve, refresh } = useAuthAdmin();
  const [selectedRoles, setSelectedRoles] = useState<Record<string, AssignableRole>>({});
  const [submitting, setSubmitting] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleRoleChange = (uid: string, role: AssignableRole) => {
    setSelectedRoles((previous) => ({
      ...previous,
      [uid]: role,
    }));
  };

  const resolveRoleForUser = (profile: UserProfile): AssignableRole => {
    return selectedRoles[profile.id] ?? getDefaultRole(profile);
  };

  const handleApprove = async (profile: UserProfile) => {
    const role = resolveRoleForUser(profile);
    setSubmitting(profile.id);
    setSuccessMessage(null);
    try {
      await approve(profile.id, role);
      setSuccessMessage(`Usuario ${profile.email} aprobado como ${getRoleLabel(role)}.`);
      setSelectedRoles((previous) => {
        const next = { ...previous };
        delete next[profile.id];
        return next;
      });
      onRefreshRequested?.();
    } catch (err) {
      console.error("[AdminPanel] Error al aprobar usuario:", err);
    } finally {
      setSubmitting(null);
    }
  };

  const handleRefresh = async () => {
    setSuccessMessage(null);
    await refresh();
  };

  const sortedPending = useMemo(
    () =>
      pending.slice().sort((a, b) => {
        if (a.fechaRegistro && b.fechaRegistro) {
          return b.fechaRegistro.toMillis() - a.fechaRegistro.toMillis();
        }
        return a.email.localeCompare(b.email);
      }),
    [pending],
  );

  return (
    <section className="space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-display text-white">Panel de aprobación</h2>
          <p className="text-sm text-gray-400">
            Autoriza cuentas docentes y asigna el rol operativo correspondiente.
          </p>
        </div>
        <button type="button" className="btn btn-secondary sm:w-auto w-full" onClick={handleRefresh} disabled={loading}>
          {loading ? "Actualizando..." : "Actualizar lista"}
        </button>
      </header>

      {error ? <p className="text-sm text-red-400">{error}</p> : null}
      {successMessage ? <p className="text-sm text-emerald-400">{successMessage}</p> : null}

      <div className="card">
        {loading ? <p className="text-sm text-gray-400">Cargando usuarios pendientes...</p> : null}
        {!loading && sortedPending.length === 0 ? (
          <p className="text-sm text-gray-400">No hay usuarios pendientes por autorizar.</p>
        ) : null}

        <ul className="space-y-4">
          {sortedPending.map((profile) => {
            const role = resolveRoleForUser(profile);
            return (
              <li key={profile.id} className="bg-black/30 border border-gray-800 rounded-lg p-4">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="text-base font-semibold text-white">{profile.nombreCompleto}</p>
                    <p className="text-sm text-gray-400">{profile.email}</p>
                    {profile.fechaRegistro ? (
                      <p className="text-xs text-gray-500">
                        Registrado: {profile.fechaRegistro.toDate().toLocaleString()}
                      </p>
                    ) : null}
                  </div>
                  <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
                    <label className="text-sm text-gray-300">
                      Rol asignado
                      <select
                        className="input-field mt-1 w-full"
                        value={role}
                        onChange={(event) => handleRoleChange(profile.id, event.target.value as AssignableRole)}
                        disabled={submitting === profile.id}
                      >
                        {ROLE_OPTIONS.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </label>
                    <button
                      type="button"
                      className="btn btn-primary sm:w-auto w-full"
                      onClick={() => void handleApprove(profile)}
                      disabled={submitting === profile.id}
                    >
                      {submitting === profile.id ? "Aprobando..." : "Aprobar"}
                    </button>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
};

export default AdminPanel;

