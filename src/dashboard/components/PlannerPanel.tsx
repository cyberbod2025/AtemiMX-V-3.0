import React, { useState } from "react";

import type { User } from "@/dashboard/types";
import type { PlannerDraft } from "@/dashboard/modules/planner/types";
import { usePlanner } from "@/dashboard/modules/planner/usePlanner";

interface PlannerPanelProps {
  teacher: User;
}

const formatDate = (iso: string) => {
  try {
    return new Intl.DateTimeFormat("es-MX", { dateStyle: "long" }).format(new Date(iso));
  } catch {
    return iso;
  }
};

const INITIAL_DRAFT: PlannerDraft = {
  teacherId: "",
  dateISO: new Date().toISOString().split("T")[0],
  subject: "",
  field: "",
  objective: "",
  activities: "",
  resources: "",
  evaluationNotes: "",
};

export const PlannerPanel: React.FC<PlannerPanelProps> = ({ teacher }) => {
  const { entries, loading, error, addEntry } = usePlanner({ teacherId: teacher.id });
  const [draft, setDraft] = useState<PlannerDraft>({ ...INITIAL_DRAFT, teacherId: teacher.id });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    try {
      await addEntry(draft);
      setDraft({ ...INITIAL_DRAFT, teacherId: teacher.id });
    } catch (err) {
      console.error("[Planner] no se pudo guardar la planeación", err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="planner">
      <header className="planner__header">
        <div>
          <p className="planner__eyebrow">Planner Atemi</p>
          <h3>Registro semanal</h3>
        </div>
        {loading ? <span className="planner__status">Sincronizando...</span> : null}
        {saving ? <span className="planner__status">Guardando...</span> : null}
      </header>

      {error ? <div className="app-shell__notice">{error}</div> : null}

      <form className="planner__form" onSubmit={handleSubmit}>
        <div className="planner__form-grid">
          <label>
            Fecha
            <input
              type="date"
              required
              value={draft.dateISO}
              onChange={(event) => setDraft((prev) => ({ ...prev, dateISO: event.target.value }))}
            />
          </label>
          <label>
            Campo Formativo
            <input
              type="text"
              required
              placeholder="Ej. Saberes y Pensamiento Científico"
              value={draft.field}
              onChange={(event) => setDraft((prev) => ({ ...prev, field: event.target.value }))}
            />
          </label>
          <label>
            Asignatura / Proyecto
            <input
              type="text"
              required
              placeholder="Matemáticas, Proyecto 2"
              value={draft.subject}
              onChange={(event) => setDraft((prev) => ({ ...prev, subject: event.target.value }))}
            />
          </label>
        </div>

        <label>
          Objetivo de la sesión
          <textarea
            required
            placeholder="Describe el objetivo o propósito de aprendizaje..."
            value={draft.objective}
            onChange={(event) => setDraft((prev) => ({ ...prev, objective: event.target.value }))}
          />
        </label>

        <label>
          Actividades clave
          <textarea
            required
            placeholder="Secuencia de actividades, integración NEM, atención a la diversidad..."
            value={draft.activities}
            onChange={(event) => setDraft((prev) => ({ ...prev, activities: event.target.value }))}
          />
        </label>

        <label>
          Recursos
          <textarea
            placeholder="Materiales, tecnología, recursos Atemi..."
            value={draft.resources}
            onChange={(event) => setDraft((prev) => ({ ...prev, resources: event.target.value }))}
          />
        </label>

        <label>
          Observaciones / Evaluación formativa
          <textarea
            placeholder="Notas rápidas para reforzar la autoevaluación y coevaluación..."
            value={draft.evaluationNotes}
            onChange={(event) => setDraft((prev) => ({ ...prev, evaluationNotes: event.target.value }))}
          />
        </label>

        <button type="submit" className="planner__submit" disabled={saving}>
          {saving ? "Guardando..." : "Guardar planeación"}
        </button>
      </form>

      <div className="planner__list">
        {entries.map((entry) => (
          <article key={entry.id} className="planner__card">
            <header>
              <span className="planner__date">{formatDate(entry.dateISO)}</span>
              <h4>{entry.subject}</h4>
              <p className="planner__field">{entry.field}</p>
            </header>
            <div className="planner__body">
              <p>
                <strong>Objetivo:</strong> {entry.objective}
              </p>
              <p>
                <strong>Actividades:</strong> {entry.activities}
              </p>
              {entry.resources ? (
                <p>
                  <strong>Recursos:</strong> {entry.resources}
                </p>
              ) : null}
              {entry.evaluationNotes ? (
                <p>
                  <strong>Observaciones:</strong> {entry.evaluationNotes}
                </p>
              ) : null}
            </div>
            <footer>
              <small>Última actualización: {formatDate(entry.updatedAtISO)}</small>
            </footer>
          </article>
        ))}
        {entries.length === 0 && !loading ? <p className="planner__empty">Aún no tienes planeaciones registradas.</p> : null}
      </div>
    </section>
  );
};
