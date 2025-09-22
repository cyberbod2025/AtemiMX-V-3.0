import React, { useState, useEffect } from 'react';
import { saveData, loadData } from './services/storageService';

type ActiveModule = 'tareas' | 'agenda' | 'calificaciones' | 'asientos';

// Tareas Module
const TareasModule: React.FC = () => {
    const [tasks, setTasks] = useState<string[]>(() => loadData<string[]>('tasks') || []);
    const [newTask, setNewTask] = useState('');

    const handleAddTask = (e: React.FormEvent) => {
        e.preventDefault();
        if (newTask.trim()) {
            const updatedTasks = [...tasks, newTask.trim()];
            setTasks(updatedTasks);
            saveData('tasks', updatedTasks);
            setNewTask('');
        }
    };
    
    return (
        <div>
            <h3 className="text-xl font-bold font-display mb-4">Checklist de Tareas</h3>
            <form onSubmit={handleAddTask} className="flex gap-2 mb-4">
                <input type="text" value={newTask} onChange={(e) => setNewTask(e.target.value)} className="input-field flex-grow" placeholder="Nueva tarea..." />
                <button type="submit" className="btn btn-primary">Agregar</button>
            </form>
            <ul className="space-y-2">
                {tasks.map((task, index) => <li key={index} className="bg-black/20 p-3 rounded-md">{task}</li>)}
            </ul>
        </div>
    );
};

// Agenda Module
const AgendaModule: React.FC = () => {
    const [notes, setNotes] = useState<string>(() => loadData<string>('agenda_notes') || '');
    useEffect(() => {
        saveData('agenda_notes', notes);
    }, [notes]);
    return (
        <div>
            <h3 className="text-xl font-bold font-display mb-4">Agenda / Notas</h3>
            <textarea className="input-field w-full h-48" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Escribe tus notas aquí..."></textarea>
        </div>
    );
};

const Modules: React.FC = () => {
  const [activeModule, setActiveModule] = useState<ActiveModule>('tareas');

  const renderModule = () => {
    switch(activeModule) {
      case 'tareas': return <TareasModule />;
      case 'agenda': return <AgendaModule />;
      // Add other modules here as placeholders
      default: return <p>Módulo no implementado.</p>;
    }
  };

  const ModuleButton: React.FC<{module: ActiveModule, label: string}> = ({module, label}) => (
      <button 
        onClick={() => setActiveModule(module)}
        className={`px-4 py-2 rounded-t-lg text-sm font-medium transition-colors border-b-2 ${activeModule === module ? 'text-[var(--accent-1)] border-[var(--accent-1)]' : 'text-gray-400 border-transparent hover:border-gray-500'}`}
      >
        {label}
      </button>
  );

  return (
    <div className="card">
      <div className="border-b border-gray-700 mb-6">
          <nav className="-mb-px flex space-x-4">
              <ModuleButton module="tareas" label="Tareas" />
              <ModuleButton module="agenda" label="Agenda" />
              <ModuleButton module="calificaciones" label="Calificaciones (Próximamente)" />
              <ModuleButton module="asientos" label="Plano de Asientos (Próximamente)" />
          </nav>
      </div>
      <div>{renderModule()}</div>
    </div>
  );
};

export default Modules;