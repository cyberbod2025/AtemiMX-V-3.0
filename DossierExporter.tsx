import React, { useState } from "react";

import { getProfile, loadData } from "./services/storageService";
import { fetchGuardianReports } from "./services/guardianReportsService";
import type { GuardianReport, PerfilDocente } from "./types";

interface Props {
    profile: PerfilDocente;
}

const DossierExporter: React.FC<Props> = ({ profile }) => {
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  const handleExport = async () => {
    if (exporting) {
      return;
    }
    setExporting(true);
    setExportError(null);
    try {
      // 1. Gather all data
      const projects = loadData<any[]>("projects") || [];
      const tasks = loadData<string[]>("tasks") || [];
      const agendaNotes = loadData<string>("agenda_notes") || "";
      let guardianReports: GuardianReport[] = [];
      try {
        guardianReports = await fetchGuardianReports();
      } catch (reportError) {
        console.error("[Dossier] Reportes cifrados no disponibles", reportError);
        setExportError("No pudimos incluir los reportes cifrados de Ángel Guardián en este dossier.");
      }
    
    // 2. Format the data into a string
    let content = `========================================\n`;
    content += `        DOSSIER DOCENTE - AtemiMX\n`;
    content += `========================================\n\n`;
    
    // Carátula
    content += `--- PERFIL ---\n`;
    content += `Docente: ${profile.nombre}\n`;
    content += `Escuela/CCT: ${profile.escuela}\n`;
    content += `Ciclo Escolar: ${profile.cicloEscolar}\n`;
    content += `Nivel: ${profile.nivel}\n`;
    if (profile.materia) {
        content += `Materia: ${profile.materia}\n`;
    }
    content += `Campo(s) Formativo(s): ${Array.isArray(profile.campoFormativo) ? profile.campoFormativo.join(', ') : profile.campoFormativo}\n`;
    content += `Fecha de exportación: ${new Date().toLocaleString()}\n\n`;

    // Cuerpo
    if (projects.length > 0) {
        content += `--- PROYECTOS ---\n`;
        projects.forEach(p => {
            content += `- Título: ${p.title}\n`;
            content += `  Fase: ${p.fase}, Campo: ${p.campo}\n\n`;
        });
    }
    
    if (tasks.length > 0) {
        content += `--- TAREAS PENDIENTES ---\n`;
        tasks.forEach(t => {
            content += `- ${t}\n`;
        });
        content += `\n`;
    }
    
    if (agendaNotes) {
        content += `--- NOTAS DE AGENDA ---\n`;
        content += `${agendaNotes}\n\n`;
    }

      if (guardianReports.length > 0) {
        content += `--- REPORTES ÁNGEL GUARDIÁN (DESCIFRADOS LOCALMENTE) ---\n`;
        guardianReports.forEach((report, index) => {
            content += `Reporte ${index + 1} (${new Date(report.date).toLocaleString('es-MX')}):\n`;
            content += `  Título: ${report.title}\n`;
            content += `  Resumen: ${report.summary}\n`;
            content += `  Transcripción:\n${report.transcript}\n\n`;
        });
      }

      content += `========================================\n`;
      content += `      Fin del reporte\n`;
      content += `========================================\n`;
      
      // 3. Create and download the file
      const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Dossier_${profile.nombre.replace(' ', '_')}_${new Date().toISOString().split('T')[0]}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("[Dossier] No fue posible exportar el dossier completo", error);
      setExportError("Ocurrió un error al generar el dossier.");
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="mt-12 text-center">
      {exportError && <p className="text-sm text-red-400 mb-2">{exportError}</p>}
      <button className="btn btn-secondary" onClick={handleExport} disabled={exporting}>
        {exporting ? "Generando..." : "Exportar Dossier (.txt)"}
      </button>
    </div>
  );
};

export default DossierExporter;
