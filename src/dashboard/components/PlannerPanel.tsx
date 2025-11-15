import React, { useEffect, useState } from "react";

import type { User } from "@/dashboard/types";
import { usePlanner } from "@/dashboard/modules/planner/usePlanner";
import type { PlannerDraft } from "@/dashboard/modules/planner/types";
import { useAuth } from "@/hooks/useAuth";
import { useNemCatalog } from "@/hooks/useNemCatalog";

interface PlannerPanelProps {
  teacher: User;
}

const INITIAL_DRAFT: PlannerDraft = {
  teacherId: "",
  dateISO: new Date().toISOString().split("T")[0],
  subject: "",
  field: "",
  objective: "",
  activities: "",
  resources: "",
  evaluationNotes: "",
  campoFormativoId: "",
  pdaId: "",
};

const AUTH_WARNING_MESSAGE = "Inicia sesión en SASE-310 con tu cuenta docente para sincronizar tu planner.";

const formatDate = (iso: string) => {
  try {
    return new Intl.DateTimeFormat("es-MX", { dateStyle: "long" }).format(new Date(iso));
  } catch {
    return iso;
  }
};

export const PlannerPanel: React.FC<PlannerPanelProps> = ({ teacher }) => {
  const { user } = useAuth();
  const plannerTeacherId = user?.uid === teacher.id ? teacher.id : null;
  const canSyncPlanner = Boolean(plannerTeacherId);
  const { entries, loading, error, addEntry } = usePlanner({ teacherId: plannerTeacherId ?? undefined });
  const {
    getFases,
    getCamposPorFase,
    getCampo,
    getPdasPorCampo,
    findPda,
  } = useNemCatalog();
  const fases = getFases();
  const [draft, setDraft] = useState<PlannerDraft>({
    ...INITIAL_DRAFT,
    teacherId: teacher.id,
  });
  const [faseId, setFaseId] = useState("");
  const [campoId, setCampoId] = useState("");
  const [pdaId, setPdaId] = useState("");
  const [saving, setSaving] = useState(false);
  const [metadataError, setMetadataError] = useState<string | null>(null);

  useEffect(() => {
    setDraft((prev) => ({ ...prev, teacherId: teacher.id }));
  }, [teacher.id]);

  useEffect(() => {
    if (!fases.length) {
      return;
    }
    setFaseId((prev) => (prev && fases.some((fase) => fase.faseId === prev) ? prev : fases[0].faseId));
  }, [fases]);

  useEffect(() => {
    if (!faseId) {
      return;
    }
    const nextCampos = getCamposPorFase(faseId);
    setCampoId((prev) =>
      prev && nextCampos.some((campo) => campo.campoId === prev) ? prev : nextCampos[0]?.campoId ?? "",
    );
  }, [faseId, getCamposPorFase]);

  useEffect(() => {
    if (!campoId) {
      setPdaId("");
      return;
    }
    const pdas = getPdasPorCampo(campoId);
    setPdaId((prev) =>
      prev && pdas.some((pda) => pda.pdaId === prev) ? prev : pdas[0]?.pdaId ?? "",
    );
  }, [campoId, getPdasPorCampo]);

  useEffect(() => {
    if (!campoId || !pdaId) {
      return;
    }
    const campo = getCampo(campoId);
    setDraft((prev) => ({
      ...prev,
      campoFormativoId: campoId,
      pdaId,
      field: campo?.nombre ?? prev.field,
    }));
  }, [campoId, pdaId, getCampo]);

  useEffect(() => {
    if (metadataError && campoId && pdaId) {
      setMetadataError(null);
    }
  }, [campoId, pdaId, metadataError]);

  useEffect(() => {
    if (canSyncPlanner && metadataError === AUTH_WARNING_MESSAGE) {
      setMetadataError(null);
    }
  }, [canSyncPlanner, metadataError]);

  const selectedCampo = campoId ? getCampo(campoId) : undefined;
  const selectedPda = pdaId ? findPda(pdaId) : undefined;

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!campoId || !pdaId) {
      setMetadataError("Selecciona un campo formativo y un PDA antes de guardar.");
      return;
    }
    if (!canSyncPlanner) {
      setMetadataError(AUTH_WARNING_MESSAGE);
      return;
    }
    setSaving(true);
    setMetadataError(null);
    try {
      await addEntry({
        ...draft,
        campoFormativoId: campoId,
        pdaId,
        field: selectedCampo?.nombre ?? draft.field,
      });
      setDraft({
        ...INITIAL_DRAFT,
        teacherId: teacher.id,
        campoFormativoId: campoId,
        pdaId,
        field: selectedCampo?.nombre ?? "",
      });
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
        {!canSyncPlanner ? (
          <span className="planner__status planner__status--warning">Modo demo: inicia sesión para sincronizar.</span>
        ) : null}
      </header>

      {!canSyncPlanner ? (
        <div className="app-shell__notice">
          Solo la cuenta autenticada puede guardar planeaciones. Usa tu cuenta de SASE-310 para sincronizar este módulo.
        </div>
      ) : null}
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
            Fase educativa
            <select value={faseId} onChange={(event) => setFaseId(event.target.value)}>
              {fases.map((fase) => (
                <option key={fase.faseId} value={fase.faseId}>
                  {fase.nombre}
                </option>
              ))}
            </select>
          </label>
          <label>
            Campo formativo
              <select value={campoId} onChange={(event) => setCampoId(event.target.value)} required>
                {getCamposPorFase(faseId).map((campo) => (
                <option key={campo.campoId} value={campo.campoId}>
                  {campo.nombre}
                </option>
              ))}
            </select>
          </label>
          <label>
            Proceso de Desarrollo de Aprendizaje (PDA)
            <select value={pdaId} onChange={(event) => setPdaId(event.target.value)} required>
              {pdaId === "" ? (
                <option value="">Selecciona un PDA</option>
              ) : null}
              {pdaId !== "" && (
                <>
                  {selectedPda ? (
                    <option value={selectedPda.pdaId}>{selectedPda.nombre}</option>
                  ) : null}
                </>
              )}
              {pdaId !== "" && getPdasPorCampo(campoId).map((pda) => (
                <option key={pda.pdaId} value={pda.pdaId}>
                  {pda.nombre}
                </option>
              ))}
            </select>
          </label>
        </div>

        {selectedPda ? (
          <div className="planner__metadata-preview">
            <p>
              <strong>Descriptor:</strong> {selectedPda.descriptor}
            </p>
            <p>
              <strong>Competencias:</strong> {selectedPda.competencias.join(", ")}
            </p>
          </div>
        ) : (
          <p className="planner__metadata-preview planner__metadata-preview--error">
            Selecciona un PDA para que la planeación tenga trazabilidad curricular antes de guardar.
          </p>
        )}
        {metadataError ? <div className="app-shell__notice">{metadataError}</div> : null}

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

        <button type="submit" className="planner__submit" disabled={saving || !canSyncPlanner}>
          {saving ? "Guardando..." : "Guardar planeación"}
        </button>
      </form>

      <div className="planner__list">
        {entries.map((entry) => {
          const entryCampo = entry.campoFormativoId ? getCampo(entry.campoFormativoId) : undefined;
          const entryPda = entry.pdaId ? findPda(entry.pdaId) : undefined;
          return (
            <article key={entry.id} className="planner__card">
              <header>
                <span className="planner__date">{formatDate(entry.dateISO)}</span>
                <h4>{entry.subject}</h4>
                <p className="planner__field">{entryCampo?.nombre ?? entry.field}</p>
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
                {entryPda ? (
                  <div className="planner__metadata-preview">
                    <p>
                      <strong>Descriptor:</strong> {entryPda.descriptor}
                    </p>
                    <p>
                      <strong>Competencias:</strong> {entryPda.competencias.join(", ")}
                    </p>
                  </div>
                ) : null}
              </div>
              <footer>
                <small>Última actualización: {formatDate(entry.updatedAtISO)}</small>
              </footer>
            </article>
          );
        })}
        {entries.length === 0 && !loading ? <p className="planner__empty">Aún no tienes planeaciones registradas.</p> : null}
      </div>
    </section>
  );
};

export default PlannerPanel;
