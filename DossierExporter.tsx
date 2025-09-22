import React from 'react';
import { getProfile, loadData } from './services/storageService';
import { PerfilDocente } from './types';

interface Props {
    profile: PerfilDocente;
}

const DossierExporter: React.FC<Props> = ({ profile }) => {
  
  const handleExport = () => {
    // 1. Gather all data
    const projects = loadData<any[]>('projects') || [];
    const tasks = loadData<string[]>('tasks') || [];
    const agendaNotes = loadData<string>('agenda_notes') || '';
    
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
  };

  return (
    <div className="mt-12 text-center">
      <button className="btn btn-secondary" onClick={handleExport}>
        Exportar Dossier (.txt)
      </button>
    </div>
  );
};

export default DossierExporter;
