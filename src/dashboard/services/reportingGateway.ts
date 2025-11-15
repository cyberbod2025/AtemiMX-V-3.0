import { ReportPriority, ReportStatus, ReportType, UserRole as DashboardUserRole } from "@/dashboard/types";
import type { Report as DashboardReport, User } from "@/dashboard/types";
import {
  createReport as createSaseReport,
  getAllReports as fetchSaseReports,
  getReportsByUser,
  type Report as SaseReport,
} from "../../../modules/sase310/firestoreService";
import type { UserRole as SaseUserRole } from "../../../modules/sase310/auth/services/userService";
import {
  fetchIncidentMetadataByTeacher,
  fetchAllIncidentMetadata,
  upsertIncidentMetadata,
} from "./incidentMetaService";
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

const DASHBOARD_TO_SASE_ROLE: Record<DashboardUserRole, SaseUserRole | null> = {
  [DashboardUserRole.Teacher]: "teacher",
  [DashboardUserRole.Guidance]: "guidance",
  [DashboardUserRole.Admin]: "admin",
  [DashboardUserRole.Prefect]: "prefect",
  [DashboardUserRole.Student]: null,
};

const mapDashboardRoleToSase = (role: DashboardUserRole): SaseUserRole => {
  const resolved = DASHBOARD_TO_SASE_ROLE[role] ?? null;
  if (!resolved) {
    throw new Error("El rol actual no puede generar reportes en SASE-310.");
  }
  return resolved;
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

export const submitIncidentReport = async (payload: {
  teacher: User;
  studentId: string;
  studentName: string;
  subject: string;
  description: string;
  actionsTaken: string;
  type: ReportType;
}): Promise<DashboardReport> => {
  const nowISO = new Date().toISOString();
  const reporterRole = mapDashboardRoleToSase(payload.teacher.role);
  const saseReport = await createSaseReport(
    {
      title: payload.subject || payload.type,
      description: `${payload.description}\n\nAcciones inmediatas: ${payload.actionsTaken}`,
      date: nowISO,
      category: payload.type,
      uid: payload.teacher.id,
    },
    {
      name: payload.teacher.name,
      email: (payload as unknown as { email?: string }).email ?? null,
      role: reporterRole,
    },
  );

  const dashboardReport: DashboardReport = {
    id: saseReport.id,
    studentId: payload.studentId,
    teacherId: payload.teacher.id,
    date: nowISO,
    type: payload.type,
    subject: payload.subject,
    description: payload.description,
    status: ReportStatus.New,
    priority: ReportPriority.Medium,
    actionsTaken: payload.actionsTaken,
    comments: [],
    evidence: [],
  };

  await upsertIncidentMetadata(dashboardReport);
  return dashboardReport;
};

export const getTeacherReports = async (teacherId: string): Promise<DashboardReport[]> => {
  try {
    const [metadata, saseReports] = await Promise.all([
      fetchIncidentMetadataByTeacher(teacherId),
      getReportsByUser(teacherId),
    ]);
    const metaMap = new Map(metadata.map((report) => [report.id, report]));
    const merged = saseReports.map((report) => metaMap.get(report.id) ?? toDashboardReport(report));
    const mergedIds = new Set(saseReports.map((report) => report.id));
    const extras = metadata.filter((report) => !mergedIds.has(report.id));
    return [...extras, ...merged];
  } catch (error) {
    console.error("[Dashboard] Falling back to mock reports for teacher", error);
    const fallback = await getMockReportsByTeacher(teacherId);
    return fallback;
  }
};

export const getPrefectureReports = async (): Promise<DashboardReport[]> => {
  try {
    const [metadata, saseReports] = await Promise.all([fetchAllIncidentMetadata(), fetchSaseReports()]);
    const metaMap = new Map(metadata.map((report) => [report.id, report]));
    const merged = saseReports.map((report) => metaMap.get(report.id) ?? toDashboardReport(report));
    const mergedIds = new Set(saseReports.map((report) => report.id));
    const extras = metadata.filter((report) => !mergedIds.has(report.id));
    return [...extras, ...merged];
  } catch (error) {
    console.error("[Dashboard] Falling back to mock reports set", error);
    const fallback = await getMockAllReports();
    return fallback;
  }
};
