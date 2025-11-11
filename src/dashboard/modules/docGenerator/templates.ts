export type DocumentType = "FORM_911" | "BOLETA" | "CONSTANCIA" | "RM_08" | "ACTA_HECHOS";

export interface DocumentSection {
  id: string;
  title: string;
  fields: Array<{
    key: string;
    label: string;
    description?: string;
    required?: boolean;
  }>;
}

export interface DocumentTemplate {
  type: DocumentType;
  title: string;
  description: string;
  sections: DocumentSection[];
  outputs: Array<"PDF" | "XLS" | "JSON">;
}

export const DOCUMENT_TEMPLATES: DocumentTemplate[] = [
  {
    type: "FORM_911",
    title: "Formato 911 · Estadística y Censo Escolar",
    description: "Reúne matrícula, personal e infraestructura para los reportes estadísticos oficiales.",
    outputs: ["XLS", "JSON"],
    sections: [
      {
        id: "general",
        title: "Datos Generales del Plantel",
        fields: [
          { key: "cct", label: "CCT", required: true },
          { key: "schoolName", label: "Nombre del plantel", required: true },
          { key: "turno", label: "Turno", required: true },
          { key: "nivel", label: "Nivel educativo", required: true },
        ],
      },
      {
        id: "matricula",
        title: "Matrícula y Grupos",
        fields: [
          { key: "totalStudents", label: "Total de alumnos", required: true },
          { key: "groupsByGrade", label: "Grupos por grado", description: "Distribución por grado y grupo." },
        ],
      },
      {
        id: "personal",
        title: "Personal",
        fields: [
          { key: "teachers", label: "Docentes frente a grupo" },
          { key: "supportStaff", label: "Personal de apoyo" },
        ],
      },
      {
        id: "infraestructura",
        title: "Infraestructura",
        fields: [
          { key: "classrooms", label: "Aulas disponibles" },
          { key: "laboratories", label: "Laboratorios / Talleres" },
        ],
      },
    ],
  },
  {
    type: "BOLETA",
    title: "Boleta de Evaluación",
    description: "Genera la boleta oficial basada en el cuaderno Atemi (por campo formativo y fase).",
    outputs: ["PDF", "JSON"],
    sections: [
      {
        id: "alumno",
        title: "Datos del alumno",
        fields: [
          { key: "studentName", label: "Nombre completo", required: true },
          { key: "gradeGroup", label: "Grado y grupo", required: true },
          { key: "tutor", label: "Tutor(a)", required: false },
        ],
      },
      {
        id: "calificaciones",
        title: "Resultados por Campo Formativo",
        fields: [
          { key: "fields", label: "Tabla de campos", description: "Valoraciones numéricas y cualitativas." },
        ],
      },
      {
        id: "asistencias",
        title: "Asistencia y observaciones",
        fields: [
          { key: "attendance", label: "Porcentaje de asistencia" },
          { key: "teacherNotes", label: "Observaciones del docente" },
          { key: "insignias", label: "Insignias / puntos (BadgeMaker)" },
        ],
      },
    ],
  },
  {
    type: "RM_08",
    title: "Diagnóstico RM-08 · Infraestructura",
    description: "Plantilla para el diagnóstico participativo y reportes RM-08.",
    outputs: ["PDF", "JSON"],
    sections: [
      {
        id: "situacion",
        title: "Situación reportada",
        fields: [
          { key: "area", label: "Área afectada", required: true },
          { key: "riskDescription", label: "Descripción del problema / riesgos", required: true },
          { key: "evidence", label: "Evidencia fotográfica (urls)", required: false },
          { key: "intervention", label: "Intervención solicitada", required: true },
        ],
      },
    ],
  },
];
