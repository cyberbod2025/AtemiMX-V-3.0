import { Report, ReportStatus, ReportType, ReportPriority, User, Student, Notification, Comment, Evidence } from '../types';
import { MOCK_USERS, MOCK_STUDENTS } from '../constants';

// --- MOCK DATABASE ---
let MOCK_REPORTS: Report[] = [
    {
        id: 'report-1',
        studentId: 'student-1',
        teacherId: 'teacher-1',
        date: new Date('2024-05-10T09:30:00').toISOString(),
        type: ReportType.Disciplinary,
        subject: 'Matemáticas',
        description: 'Juan interrumpió la clase en múltiples ocasiones, haciendo ruidos y molestando a sus compañeros. No respondió a las llamadas de atención verbales.',
        status: ReportStatus.InProgress,
        priority: ReportPriority.Medium,
        actionsTaken: 'Se le pidió que se sentara al frente. Se le advirtió que se notificaría a sus padres.',
        comments: [
            { id: 'c-1', userId: 'guidance-1', userName: 'Lic. Carlos Ruíz', text: 'Citado para el día 13 de Mayo. Se requiere la presencia de los padres.', date: new Date('2024-05-11T11:00:00').toISOString() }
        ],
        evidence: [],
    },
    {
        id: 'report-2',
        studentId: 'student-2',
        teacherId: 'teacher-1',
        date: new Date('2024-05-08T11:00:00').toISOString(),
        type: ReportType.SocioEmotional,
        subject: 'Historia',
        description: 'María se mostró muy aislada y triste durante la clase. No quiso participar en la actividad grupal y se le vio llorando en silencio.',
        status: ReportStatus.Resolved,
        priority: ReportPriority.High,
        actionsTaken: 'Se habló con ella en privado al final de la clase. Mencionó problemas familiares.',
        comments: [
            { id: 'c-2', userId: 'guidance-1', userName: 'Lic. Carlos Ruíz', text: 'Se tuvo una sesión con María. Se contactó a la familia para una junta.', date: new Date('2024-05-08T14:00:00').toISOString() }
        ],
        evidence: [],
        resolutionNotes: 'Se estableció un plan de seguimiento con la alumna y su familia. El estado de ánimo ha mejorado notablemente en las últimas semanas.',
        resolvedById: 'guidance-1',
        resolvedDate: new Date('2024-05-20T16:00:00').toISOString(),
    },
    {
        id: 'report-3',
        studentId: 'student-3',
        teacherId: 'teacher-1',
        date: new Date('2024-05-21T12:15:00').toISOString(),
        type: ReportType.Disciplinary,
        subject: 'Educación Física',
        description: 'Luis se negó a participar en la actividad y usó lenguaje inapropiado hacia el profesor cuando se le insistió.',
        status: ReportStatus.New,
        priority: ReportPriority.High,
        actionsTaken: 'Se le envió a la banca por el resto de la clase.',
        comments: [],
        evidence: [],
    },
     {
        id: 'report-4',
        studentId: 'student-1',
        teacherId: 'prefect-1',
        date: new Date('2024-05-20T07:05:00').toISOString(),
        type: ReportType.Attendance,
        subject: 'Retardo',
        description: 'El alumno Juan Pérez llegó 5 minutos tarde a la entrada.',
        status: ReportStatus.New,
        priority: ReportPriority.Low,
        actionsTaken: 'Se registró el retardo.',
        comments: [],
        evidence: [],
    },
    {
        id: 'report-5',
        studentId: 'student-1',
        teacherId: 'prefect-1',
        date: new Date('2024-05-21T07:10:00').toISOString(),
        type: ReportType.Attendance,
        subject: 'Retardo',
        description: 'El alumno Juan Pérez llegó 10 minutos tarde a la entrada. Es su segundo retardo esta semana.',
        status: ReportStatus.New,
        priority: ReportPriority.Low,
        actionsTaken: 'Se registró el retardo y se le dio una advertencia verbal.',
        comments: [],
        evidence: [],
    }
];

let MOCK_NOTIFICATIONS: Notification[] = [
    { id: 'notif-1', userId: 'teacher-1', message: 'Orientación ha comentado en tu reporte sobre Juan Pérez.', date: new Date().toISOString(), read: false },
    { id: 'notif-2', userId: 'admin-1', message: 'Se ha detectado reincidencia de retardos para el alumno Juan Pérez.', date: new Date().toISOString(), read: false },
    { id: 'notif-3', userId: 'guidance-1', message: 'Se ha detectado reincidencia de retardos para el alumno Juan Pérez.', date: new Date().toISOString(), read: true },
];


// --- API FUNCTIONS ---

const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

// GETTERS
export const getAllReports = async (): Promise<Report[]> => { await delay(100); return MOCK_REPORTS; };
export const getReportsByTeacher = async (teacherId: string): Promise<Report[]> => { await delay(100); return MOCK_REPORTS.filter(r => r.teacherId === teacherId); };
export const getReportsByStudent = async (studentId: string): Promise<Report[]> => { await delay(100); return MOCK_REPORTS.filter(r => r.studentId === studentId); };
export const getStudentById = async (studentId: string): Promise<Student | undefined> => { await delay(50); return MOCK_STUDENTS.find(s => s.id === studentId); };
export const getTeacherById = async (teacherId: string): Promise<User | undefined> => { await delay(50); return MOCK_USERS.find(u => u.id === teacherId); };
export const getNotificationsForUser = async (userId: string): Promise<Notification[]> => { await delay(100); return MOCK_NOTIFICATIONS.filter(n => n.userId === userId).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()); };

// SETTERS / UPDATERS
export const createReport = async (reportData: Omit<Report, 'id' | 'status' | 'priority' | 'comments' | 'evidence'>): Promise<Report> => {
  await delay(200);
  const newReport: Report = {
    ...reportData,
    id: `report-${Date.now()}`,
    status: ReportStatus.New,
    priority: ReportPriority.Medium, // Default
    comments: [],
    evidence: [],
  };
  MOCK_REPORTS.unshift(newReport);

  // Re-incidence logic for Prefecture
  if (newReport.type === ReportType.Attendance && newReport.teacherId.includes('prefect')) {
      const studentAttendanceReports = MOCK_REPORTS.filter(r => r.studentId === newReport.studentId && r.type === ReportType.Attendance);
      if (studentAttendanceReports.length >= 2) { // Example threshold
          const student = await getStudentById(newReport.studentId);
          const message = `Se ha detectado reincidencia de ${newReport.subject} para el alumno ${student?.name}.`;
          const admin = MOCK_USERS.find(u => u.role === 'admin');
          const guidance = MOCK_USERS.find(u => u.role === 'guidance');
          
          if(admin) createNotification({ userId: admin.id, message });
          if(guidance) createNotification({ userId: guidance.id, message });
      }
  }

  return newReport;
};

export const updateReportStatus = async (reportId: string, status: ReportStatus): Promise<Report | null> => {
    await delay(150);
    const reportIndex = MOCK_REPORTS.findIndex(r => r.id === reportId);
    if (reportIndex > -1) {
        MOCK_REPORTS[reportIndex].status = status;
        return { ...MOCK_REPORTS[reportIndex] };
    }
    return null;
};

export const addCommentToReport = async (reportId: string, commentData: Omit<Comment, 'id'>): Promise<Report | null> => {
    await delay(150);
    const reportIndex = MOCK_REPORTS.findIndex(r => r.id === reportId);
    if (reportIndex > -1) {
        const report = MOCK_REPORTS[reportIndex];
        const newComment: Comment = { ...commentData, id: `c-${Date.now()}`};
        report.comments.push(newComment);
        report.status = ReportStatus.InProgress; // Auto-update status
        
        // Notify the teacher who made the report
        if(report.teacherId !== commentData.userId) {
            const student = await getStudentById(report.studentId);
            createNotification({
                userId: report.teacherId,
                message: `${commentData.userName} ha comentado en tu reporte sobre ${student?.name}.`
            });
        }
        
        return { ...report };
    }
    return null;
};

export const addEvidenceToReport = async (reportId: string, evidenceData: Omit<Evidence, 'id'>): Promise<Report | null> => {
    await delay(300); // Simulate upload
    const reportIndex = MOCK_REPORTS.findIndex(r => r.id === reportId);
    if (reportIndex > -1) {
        const report = MOCK_REPORTS[reportIndex];
        const newEvidence: Evidence = { ...evidenceData, id: `ev-${Date.now()}`};
        report.evidence.push(newEvidence);
        return { ...report };
    }
    return null;
};

export const resolveReport = async (reportId: string, userId: string, notes: string): Promise<Report | null> => {
    await delay(200);
    const reportIndex = MOCK_REPORTS.findIndex(r => r.id === reportId);
    if (reportIndex > -1) {
        const report = MOCK_REPORTS[reportIndex];
        report.status = ReportStatus.Resolved;
        report.resolutionNotes = notes;
        report.resolvedById = userId;
        report.resolvedDate = new Date().toISOString();
        return { ...report };
    }
    return null;
};


export const createNotification = (notifData: Omit<Notification, 'id' | 'date' | 'read'>): Notification => {
    const newNotif: Notification = {
        ...notifData,
        id: `notif-${Date.now()}`,
        date: new Date().toISOString(),
        read: false
    };
    MOCK_NOTIFICATIONS.unshift(newNotif);
    return newNotif;
};


export const markNotificationAsRead = async (notificationId: string): Promise<boolean> => {
    await delay(50);
    const notifIndex = MOCK_NOTIFICATIONS.findIndex(n => n.id === notificationId);
    if (notifIndex > -1) {
        MOCK_NOTIFICATIONS[notifIndex].read = true;
        return true;
    }
    return false;
};
