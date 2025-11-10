export enum UserRole {
  Teacher = 'teacher',
  Guidance = 'guidance',
  Admin = 'admin',
  Prefect = 'prefect',
  Student = 'student',
}

export interface User {
  id: string;
  name: string;
  role: UserRole;
  tutorOfGroup?: {
    grade: string;
    group: string;
  } | null;
}

export interface Student {
    id: string;
    name: string;
    grade: string;
    group: string;
}

export enum ReportType {
    Disciplinary = 'Disciplinario',
    SocioEmotional = 'Socio-emocional',
    Academic = 'Académico',
    Attendance = 'Asistencia',
}

export enum ReportStatus {
    New = 'Nuevo',
    InProgress = 'En Progreso',
    Resolved = 'Resuelto',
}

export enum ReportPriority {
    High = 'Alta',
    Medium = 'Media',
    Low = 'Baja',
}

export interface Comment {
    id: string;
    userId: string;
    userName: string;
    text: string;
    date: string;
}

export interface Evidence {
    id: string;
    type: 'photo' | 'audio';
    url: string; // Base64 data URL
    fileName: string;
    date: string;
}

export interface Report {
    id: string;
    studentId: string;
    teacherId: string;
    date: string;
    type: ReportType;
    subject: string;
    description: string;
    status: ReportStatus;
    priority: ReportPriority;
    actionsTaken: string;
    comments: Comment[];
    evidence: Evidence[];
    resolutionNotes?: string;
    resolvedById?: string;
    resolvedDate?: string;
}

export interface Notification {
    id: string;
    userId: string;
    message: string;
    date: string;
    read: boolean;
}