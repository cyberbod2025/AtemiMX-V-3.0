export type GradeColumnType = "numeric" | "text" | "icon" | "formula";

export interface ColorRule {
  min: number;
  max: number;
  bg: string;
  fg?: string;
}

export interface GradebookColumn {
  id: string;
  label: string;
  type: GradeColumnType;
  weight?: number;
  campoFormativoId?: string;
  pdaId?: string;
  evidenciasRequeridas?: boolean;
  config?: {
    min?: number;
    max?: number;
    colorRules?: ColorRule[];
    icons?: Array<{ value: string; label: string; points?: number }>;
    formula?: "average" | "sum" | "badgeMaker";
    fromColumns?: string[];
  };
}

export interface GradebookTab {
  id: string;
  label: string;
  columns: GradebookColumn[];
  notes?: string;
}

export interface GradeCell {
  studentId: string;
  columnId: string;
  value: number | string | null;
  meta?: Record<string, unknown>;
}

export interface GradebookModel {
  tabs: GradebookTab[];
  rows: Array<{
    studentId: string;
    displayName: string;
  }>;
  cells: Record<string, Record<string, GradeCell>>;
}
