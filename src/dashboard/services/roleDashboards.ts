import { UserRole } from "@/dashboard/types";

export type DashboardDataSource = "guardianReports" | "saseReports" | "planner" | "attendance";

export interface RoleDashboardModule {
  id: string;
  title: string;
  description: string;
  dataSource: DashboardDataSource;
  requiredRoles: UserRole[];
}

const BASE_MODULES: RoleDashboardModule[] = [
  {
    id: "guardian-inbox",
    title: "Ángel Guardián",
    description: "Alertas cifradas y canalizaciones inmediatas.",
    dataSource: "guardianReports",
    requiredRoles: [UserRole.Teacher, UserRole.Guidance, UserRole.Prefect, UserRole.Admin],
  },
  {
    id: "sase-tracking",
    title: "Seguimientos SASE-310",
    description: "Reportes socioemocionales con folio y prioridad.",
    dataSource: "saseReports",
    requiredRoles: [UserRole.Teacher, UserRole.Guidance, UserRole.Prefect, UserRole.Admin],
  },
  {
    id: "prefect-attendance",
    title: "Bitácora de Prefectura",
    description: "Control de incidencias de asistencia y puntualidad.",
    dataSource: "attendance",
    requiredRoles: [UserRole.Prefect, UserRole.Guidance, UserRole.Admin],
  },
  {
    id: "planner-summary",
    title: "Planeador NEM",
    description: "Rutas de aprendizaje y evidencias capturadas.",
    dataSource: "planner",
    requiredRoles: [UserRole.Teacher, UserRole.Admin],
  },
];

const groupModulesByRole = (): Record<UserRole, RoleDashboardModule[]> => {
  const layout: Partial<Record<UserRole, RoleDashboardModule[]>> = {};
  Object.values(UserRole).forEach((role) => {
    layout[role] = BASE_MODULES.filter((module) => module.requiredRoles.includes(role));
  });
  return layout as Record<UserRole, RoleDashboardModule[]>;
};

const DASHBOARD_LAYOUT = groupModulesByRole();

export const getDashboardModulesForRole = (role: UserRole): RoleDashboardModule[] => DASHBOARD_LAYOUT[role] ?? [];
