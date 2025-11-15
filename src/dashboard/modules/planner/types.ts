export interface PlannerEntry {
  id: string;
  teacherId: string;
  dateISO: string;
  subject: string;
  field: string;
  objective: string;
  activities: string;
  resources?: string;
  evaluationNotes?: string;
  updatedAtISO: string;
  campoFormativoId: string;
  pdaId: string;
}

export interface PlannerDraft extends Omit<PlannerEntry, "id" | "updatedAtISO"> {
  id?: string;
}
