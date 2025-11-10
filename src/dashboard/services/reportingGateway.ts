import {
  ReportPriority,
  ReportStatus,
  ReportType,
  type Report as DashboardReport,
} from "@/dashboard/types";
import {
  getAllReports as fetchSaseReports,
  getReportsByUser,
  type Report as SaseReport,
} from "../../../modules/sase310/firestoreService";
import { getReportsByTeacher as getMockReportsByTeacher, getAllReports as getMockAllReports } from "./mockDataService";

const CATEGORY_MAP: Record<string, ReportType> = {
  disciplina: ReportType.Disciplinary,
  disciplinario: ReportType.Disciplinary,
  socioemocional: ReportType.SocioEmotional,
  "socio-emocional": ReportType.SocioEmotional,
  academico: ReportType.Academic,
  académico: ReportType.Academic,
  asistencia: ReportType.Attendance,
};

const normalizeCategory = (value: string): ReportType => {
  const key = value.trim().toLowerCase();
  return CATEGORY_MAP[key] ?? ReportType.Disciplinary;
};

const toDashboardReport = (report: SaseReport): DashboardReport => ({
  id: report.id,
  studentId: report.ownerEmail ?? report.ownerName ?? "sin-asignar",
  teacherId: report.uid,
  date: report.date.toDate().toISOString(),
  type: normalizeCategory(report.category),
  subject: report.title,
  description: report.description,
  status: ReportStatus.InProgress,
  priority: ReportPriority.Medium,
  actionsTaken: report.description,
  comments: [],
  evidence: [],
});

export const getTeacherReports = async (teacherId: string): Promise<DashboardReport[]> => {
  try {
    const reports = await getReportsByUser(teacherId);
    return reports.map(toDashboardReport);
  } catch (error) {
    console.error("[Dashboard] Falling back to mock reports for teacher", error);
    const fallback = await getMockReportsByTeacher(teacherId);
    return fallback;
  }
};

export const getPrefectureReports = async (): Promise<DashboardReport[]> => {
  try {
    const reports = await fetchSaseReports();
    return reports.map(toDashboardReport);
  } catch (error) {
    console.error("[Dashboard] Falling back to mock reports set", error);
    const fallback = await getMockAllReports();
    return fallback;
  }
};
