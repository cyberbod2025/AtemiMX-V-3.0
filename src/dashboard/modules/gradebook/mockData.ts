import { MOCK_STUDENTS } from "@/dashboard/constants";
import type { GradebookModel, GradebookTab } from "./types";

const colorRules = [
  { min: 0, max: 5.9, bg: "#fee2e2", fg: "#991b1b" },
  { min: 6, max: 7.9, bg: "#fef9c3", fg: "#92400e" },
  { min: 8, max: 10, bg: "#dcfce7", fg: "#14532d" },
];

export const buildMockGradebook = (): GradebookModel => {
  const rows = MOCK_STUDENTS.map((student) => ({
    studentId: student.id,
    displayName: student.name,
  }));

  const tabs: GradebookTab[] = [
    {
      id: "unidad1",
      label: "Unidad 1 · Diagnóstico",
      columns: [
        {
          id: "diag",
          label: "Diagnóstico (10)",
          type: "numeric" as const,
          weight: 0.2,
          campoFormativoId: "campo-saberes",
          pdaId: "pda-razonamiento",
          config: { min: 0, max: 10, colorRules },
        },
        {
          id: "participacion",
          label: "Participación",
          type: "icon" as const,
          weight: 0.1,
          campoFormativoId: "campo-lenguajes",
          pdaId: "pda-dialogo",
          config: {
            icons: [
              { value: "⭐️", label: "Sobresaliente", points: 10 },
              { value: "✅", label: "Cumple", points: 8 },
              { value: "⚠️", label: "Atender", points: 6 },
            ],
          },
        },
        {
          id: "producto1",
          label: "Producto integrador",
          type: "numeric" as const,
          weight: 0.4,
          campoFormativoId: "campo-saberes",
          pdaId: "pda-modelacion",
          config: { min: 0, max: 100, colorRules },
        },
        {
          id: "resumen",
          label: "Resumen autoevaluación",
          type: "text" as const,
          campoFormativoId: "campo-lenguajes",
          pdaId: "pda-argumentacion",
        },
        {
          id: "promedio_u1",
          label: "Promedio U1",
          type: "formula" as const,
          config: {
            formula: "average" as const,
            fromColumns: ["diag", "producto1"],
          },
          campoFormativoId: "campo-lenguajes",
          pdaId: "pda-argumentacion",
        },
      ],
    },
    {
      id: "unidad2",
      label: "Unidad 2 · Proyecto",
      columns: [
        {
          id: "investigacion",
          label: "Investigación",
          type: "numeric" as const,
          weight: 0.35,
          campoFormativoId: "campo-saberes",
          pdaId: "pda-modelacion",
          config: { min: 0, max: 10, colorRules },
        },
        {
          id: "rubrica",
          label: "Rúbrica Equipo",
          type: "numeric" as const,
          weight: 0.35,
          campoFormativoId: "campo-lenguajes",
          pdaId: "pda-argumentacion",
          config: { min: 0, max: 4, colorRules: [
            { min: 0, max: 1.9, bg: "#fee2e2", fg: "#991b1b" },
            { min: 2, max: 2.9, bg: "#fef9c3", fg: "#92400e" },
            { min: 3, max: 4, bg: "#dcfce7", fg: "#14532d" },
          ] },
        },
        {
          id: "badgeMaker",
          label: "Insignias",
          type: "formula" as const,
          config: {
            formula: "badgeMaker" as const,
            fromColumns: ["participacion"],
          },
          campoFormativoId: "campo-humano",
          pdaId: "pda-proyecto",
        },
      ],
    },
  ];

  const buildCell = (studentId: string, columnId: string, value: number | string | null) => ({
    studentId,
    columnId,
    value,
  });

  const cells: GradebookModel["cells"] = {};

  rows.forEach((row, idx) => {
    cells[row.studentId] = {};
    cells[row.studentId]["diag"] = buildCell(row.studentId, "diag", 6 + (idx % 5));
    cells[row.studentId]["participacion"] = buildCell(row.studentId, "participacion", idx % 2 === 0 ? "⭐️" : "✅");
    cells[row.studentId]["producto1"] = buildCell(row.studentId, "producto1", 70 + idx * 3);
    cells[row.studentId]["resumen"] = buildCell(row.studentId, "resumen", "Entrega puntual y participa.");
    cells[row.studentId]["investigacion"] = buildCell(row.studentId, "investigacion", 7 + (idx % 3));
    cells[row.studentId]["rubrica"] = buildCell(row.studentId, "rubrica", 2 + (idx % 3));
  });

  return {
    tabs,
    rows,
    cells,
  };
};
