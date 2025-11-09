export interface DashboardMetric {
  id: string;
  label: string;
  value: string;
  detail: string;
  trend: {
    label: string;
    value: string;
    direction: "up" | "down" | "stable";
  };
}

export interface DashboardAlert {
  id: string;
  title: string;
  description: string;
  owner: string;
  severity: "low" | "medium" | "high";
}

export interface DashboardAction {
  id: string;
  label: string;
  description: string;
  badge?: string;
}

export interface FocusStudent {
  id: string;
  name: string;
  grade: string;
  status: string;
  pulse: number;
}

export interface TimelineItem {
  id: string;
  title: string;
  owner: string;
  time: string;
  area: string;
}

export interface FollowUpGoal {
  id: string;
  label: string;
  due: string;
  status: "delayed" | "ontrack" | "done";
}

export const DASHBOARD_METRICS: DashboardMetric[] = [
  {
    id: "attendance",
    label: "Asistencias verificada",
    value: "92%",
    detail: "Cobertura semanal",
    trend: { label: "+4 grupos", value: "+3%", direction: "up" },
  },
  {
    id: "reports",
    label: "Reportes canalizados",
    value: "36",
    detail: "Últimos 7 días",
    trend: { label: "IA priorizó", value: "11 casos", direction: "up" },
  },
  {
    id: "followups",
    label: "Seguimientos activos",
    value: "18",
    detail: "Acompañamiento integral",
    trend: { label: "Resueltos", value: "5", direction: "down" },
  },
  {
    id: "alerts",
    label: "Alertas tempranas",
    value: "7",
    detail: "Multidepartamental",
    trend: { label: "Criticas", value: "2", direction: "stable" },
  },
];

export const DASHBOARD_ALERTS: DashboardAlert[] = [
  {
    id: "prefectura",
    title: "Prefectura · Incidencia recurrente",
    description: "3 retardos para 3°A. Prefectura propone canalizar a orientación.",
    owner: "Pref. Jorge",
    severity: "medium",
  },
  {
    id: "orientacion",
    title: "Orientación · Entrevista familiar",
    description: "Se agenda visita para tutora de Juan Pérez a las 10:30 hrs.",
    owner: "Lic. Torres",
    severity: "high",
  },
  {
    id: "tsocial",
    title: "Trabajo social · Ruta de apoyo",
    description: "Se liberó oficio para gestión de beca socioemocional.",
    owner: "TS. Arriaga",
    severity: "low",
  },
];

export const DASHBOARD_ACTIONS: DashboardAction[] = [
  {
    id: "launcher",
    label: "Lanzar menú Atemi",
    description: "Abrir accesos de módulos y herramientas compartidas.",
    badge: "Cmd + K",
  },
  {
    id: "sase310",
    label: "Ingresar a SASE-310",
    description: "Supervisa incidentes y reportes disciplinarios en tiempo real.",
  },
  {
    id: "admin",
    label: "Panel de dirección",
    description: "Estadísticas ejecutivas y aprobaciones institucionales.",
  },
];

export const FOCUS_STUDENTS: FocusStudent[] = [
  { id: "stu-1", name: "Juan Pérez", grade: "3°A", status: "Seguimiento integral", pulse: 82 },
  { id: "stu-2", name: "Sofía Martínez", grade: "2°B", status: "Canalizado a orientación", pulse: 68 },
  { id: "stu-3", name: "Diego Herrera", grade: "1°C", status: "Regularizado", pulse: 92 },
];

export const LIVE_TIMELINE: TimelineItem[] = [
  {
    id: "event-1",
    title: "Prefectura liberó reporte",
    owner: "Pref. Salas",
    time: "08:42",
    area: "prefectura",
  },
  {
    id: "event-2",
    title: "Orientación asignó acompañamiento",
    owner: "Lic. Ruiz",
    time: "09:15",
    area: "orientacion",
  },
  {
    id: "event-3",
    title: "Dirección validó suspensión",
    owner: "Dir. Torres",
    time: "09:40",
    area: "direccion",
  },
];

export const FOLLOWUP_GOALS: FollowUpGoal[] = [
  { id: "goal-1", label: "Cierre de ciclo SASE-310", due: "Mié 12:00", status: "ontrack" },
  { id: "goal-2", label: "Entrega de acuerdos familiares", due: "Jue 09:30", status: "delayed" },
  { id: "goal-3", label: "Reporte ejecutivo semanal", due: "Vie 13:00", status: "done" },
];
