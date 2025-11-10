import { User, UserRole, Student } from './types';

export const MOCK_USERS: User[] = [
  { id: 'teacher-1', name: 'Prof. Ana López', role: UserRole.Teacher, tutorOfGroup: { grade: '3ro', group: 'A' } },
  { id: 'guidance-1', name: 'Lic. Carlos Ruíz', role: UserRole.Guidance },
  { id: 'admin-1', name: 'Dir. Elena Torres', role: UserRole.Admin },
  { id: 'prefect-1', name: 'Pref. Jorge Salas', role: UserRole.Prefect },
];

export const MOCK_STUDENTS: Student[] = [
    { id: 'student-1', name: 'Juan Pérez', grade: '3ro', group: 'A' },
    { id: 'student-2', name: 'María García', grade: '3ro', group: 'B' },
    { id: 'student-3', name: 'Luis Hernández', grade: '2do', group: 'A' },
    { id: 'student-4', name: 'Sofía Martínez', grade: '1ro', group: 'C' },
    { id: 'student-5', name: 'Ana Morales', grade: '3ro', group: 'A' },
];

export const VIEW_TITLES: { [key: string]: string } = {
  'teacher-dashboard': 'Panel del Docente',
  'tutor-dashboard': 'Panel de Tutoría',
  'guidance-inbox': 'Bandeja de Orientación',
  'admin-dashboard': 'Panel de Coordinación y Dirección',
  'student-profile': 'Perfil del Alumno',
  'live-assistant': 'Asistente IA en Vivo',
  'prefecture-dashboard': 'Panel de Prefectura',
};