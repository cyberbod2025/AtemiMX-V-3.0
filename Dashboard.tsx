import React, { useState, useEffect } from 'react';
import { loadData, saveData } from './services/storageService';

interface Project {
  id: string;
  title: string;
  lastModified: string;
  fase: string;
  campo: string;
}

const Dashboard: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);

  useEffect(() => {
    const savedProjects = loadData<Project[]>('projects');
    if (savedProjects) {
      setProjects(savedProjects);
    } else {
      // Create mock data if none exists
      const mockProjects: Project[] = [
        { id: 'proj1', title: 'Proyecto: El ciclo del agua', lastModified: new Date().toLocaleDateString(), fase: '4', campo: 'Saberes y Pensamiento Científico' },
        { id: 'proj2', title: 'Planeación: Cuentos de mi comunidad', lastModified: new Date().toLocaleDateString(), fase: '3', campo: 'Lenguajes' },
      ];
      setProjects(mockProjects);
      saveData('projects', mockProjects);
    }
  }, []);
  
  const createNewProject = () => {
      const newProject: Project = {
          id: `proj${Date.now()}`,
          title: 'Nuevo Proyecto sin título',
          lastModified: new Date().toLocaleDateString(),
          fase: 'Sin asignar',
          campo: 'Sin asignar',
      };
      const updatedProjects = [...projects, newProject];
      setProjects(updatedProjects);
      saveData('projects', updatedProjects);
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Mis Proyectos</h2>
        <button className="btn btn-primary" onClick={createNewProject}>+ Nuevo Proyecto</button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {projects.map(project => (
          <div key={project.id} className="card flex flex-col justify-between">
            <div>
              <h3 className="font-bold text-lg text-[#39FF14]">{project.title}</h3>
              <p className="text-sm text-gray-400 mt-1">{project.campo} - Fase {project.fase}</p>
            </div>
            <p className="text-xs text-gray-500 mt-4">Última modificación: {project.lastModified}</p>
          </div>
        ))}
        {projects.length === 0 && (
            <p className="text-gray-400">No tienes proyectos. ¡Crea uno para empezar!</p>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
