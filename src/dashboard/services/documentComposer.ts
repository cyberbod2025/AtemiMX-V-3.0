import { fetchPlannerEntries } from "@/dashboard/services/plannerService";
import { fetchGradebookModel } from "@/dashboard/services/gradebookService";
import { fetchAllIncidentMetadata } from "@/dashboard/services/incidentMetaService";
import type { GradebookModel } from "@/dashboard/modules/gradebook/types";
import type { PlannerEntry } from "@/dashboard/modules/planner/types";
import type { Report } from "@/dashboard/types";
import { DOCUMENT_TEMPLATES, type DocumentType } from "@/dashboard/modules/docGenerator/templates";

export interface SchoolProfile {
  cct: string;
  schoolName: string;
  turno: string;
  nivel: string;
}

export interface DocumentArtifact {
  template: DocumentType;
  generatedAtISO: string;
  payload: Record<string, unknown>;
}

const aggregateMatricula = (gradebook: GradebookModel | null): Record<string, unknown> => {
  if (!gradebook) {
    return { totalStudents: 0, groupsByGrade: [] };
  }
  const totalStudents = gradebook.rows.length;
  const groupsByGrade = Object.entries(
    gradebook.rows.reduce<Record<string, number>>((acc, row) => {
      acc[row.displayName] = (acc[row.displayName] ?? 0) + 1;
      return acc;
    }, {}),
  ).map(([grade, total]) => ({ grade, total }));
  return { totalStudents, groupsByGrade };
};

export const buildFormat911Payload = async (profile: SchoolProfile): Promise<DocumentArtifact> => {
  const [incidents, gradebook] = await Promise.all([fetchAllIncidentMetadata(), fetchGradebookModel(profile.cct)]);
  const matricula = aggregateMatricula(gradebook);
  const plantilla = DOCUMENT_TEMPLATES.find((tpl) => tpl.type === "FORM_911");
  return {
    template: "FORM_911",
    generatedAtISO: new Date().toISOString(),
    payload: {
      profile,
      matricula,
      incidentSummary: incidents.length,
    },
    ...(plantilla ? { blueprint: plantilla } : {}),
  };
};

export const buildBoletaPayload = async (studentId: string, teacherId: string): Promise<DocumentArtifact> => {
  const [gradebook, planner] = await Promise.all([
    fetchGradebookModel(teacherId),
    fetchPlannerEntries(teacherId),
  ]);
  const studentGrades = gradebook?.rows.find((row) => row.studentId === studentId);
  return {
    template: "BOLETA",
    generatedAtISO: new Date().toISOString(),
    payload: {
      student: studentGrades ?? { studentId, displayName: studentId },
      plannerHighlights: planner.slice(-3),
    },
  };
};

export const buildRm08Payload = async (teacherId: string): Promise<DocumentArtifact> => {
  const incidents = await fetchAllIncidentMetadata();
  const infraReports = incidents.filter((report) => report.type === "Asistencia");
  return {
    template: "RM_08",
    generatedAtISO: new Date().toISOString(),
    payload: {
      entries: infraReports,
      total: infraReports.length,
    },
  };
};
