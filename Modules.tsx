import React, { useState, useEffect } from 'react';
import { saveData, loadData } from './services/storageService';

type ActiveModule = 'tareas' | 'agenda' | 'calificaciones' | 'asientos';

type SeatStatus = 'pending' | 'present' | 'absent';

interface Seat {
  id: string;
  row: number;
  column: number;
  student: string;
  status: SeatStatus;
  note: string;
}

interface SeatingPlan {
  rows: number;
  columns: number;
  seats: Seat[];
}

const clampValue = (value: number, min = 1, max = 10) => {
  if (!Number.isFinite(value)) {
    return min;
  }
  return Math.min(max, Math.max(min, value));
};

const buildSeatingPlan = (rows: number, columns: number, previousSeats: Seat[] = []): SeatingPlan => {
  const prevMap = new Map(previousSeats.map((seat) => [seat.id, seat]));
  const seats: Seat[] = [];

  for (let row = 1; row <= rows; row += 1) {
    for (let column = 1; column <= columns; column += 1) {
      const id = `r${row}c${column}`;
      const previous = prevMap.get(id);
      seats.push(
        previous ?? {
          id,
          row,
          column,
          student: '',
          status: 'pending',
          note: '',
        },
      );
    }
  }

  return { rows, columns, seats };
};

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
        <input
          id="checklist-new-task"
          name="checklist-new-task"
          type="text"
          value={newTask}
          onChange={(e) => setNewTask(e.target.value)}
          className="input-field flex-grow"
          placeholder="Nueva tarea..."
          aria-label="Nueva tarea"
        />
        <button type="submit" className="btn btn-primary">Agregar</button>
      </form>
      <ul className="space-y-2">
        {tasks.map((task, index) => (
          <li key={index} className="bg-black/20 p-3 rounded-md">
            {task}
          </li>
        ))}
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
      <textarea
        id="agenda-notes"
        name="agenda-notes"
        className="input-field w-full h-48"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="Escribe tus notas aqui..."
        aria-label="Notas de agenda"
      ></textarea>
    </div>
  );
};

const SeatingModule: React.FC = () => {
  const [plan, setPlan] = useState<SeatingPlan>(() => {
    const stored = loadData<SeatingPlan>('seating_plan');
    if (stored && stored.rows && stored.columns && Array.isArray(stored.seats)) {
      return buildSeatingPlan(stored.rows, stored.columns, stored.seats);
    }
    return buildSeatingPlan(4, 4);
  });
  const [rowsInput, setRowsInput] = useState(plan.rows);
  const [columnsInput, setColumnsInput] = useState(plan.columns);
  const [rosterText, setRosterText] = useState('');
  const [selectedSeatId, setSelectedSeatId] = useState<string | null>(null);

  useEffect(() => {
    saveData('seating_plan', plan);
  }, [plan]);

  const selectedSeat = plan.seats.find((seat) => seat.id === selectedSeatId) ?? null;

  const persistPlan = (next: SeatingPlan) => {
    setPlan(next);
    if (next.seats.every((seat) => seat.id !== selectedSeatId)) {
      setSelectedSeatId(null);
    }
  };

  const handleResize = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextRows = clampValue(rowsInput);
    const nextColumns = clampValue(columnsInput);
    setRowsInput(nextRows);
    setColumnsInput(nextColumns);
    persistPlan(buildSeatingPlan(nextRows, nextColumns, plan.seats));
  };

  const handleRosterAssign = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const names = rosterText
      .split('\n')
      .map((name) => name.trim())
      .filter((name) => name.length > 0);
    if (!names.length) {
      return;
    }
    setPlan((prev) => ({
      ...prev,
      seats: prev.seats.map((seat, index) => ({
        ...seat,
        student: names[index] ?? seat.student,
      })),
    }));
  };

  const updateSeat = (seatId: string, changes: Partial<Seat>) => {
    setPlan((prev) => ({
      ...prev,
      seats: prev.seats.map((seat) => (seat.id === seatId ? { ...seat, ...changes } : seat)),
    }));
  };

  const markSeat = (seatId: string, status: SeatStatus) => {
    updateSeat(seatId, { status });
  };

  const clearSeat = (seatId: string) => {
    updateSeat(seatId, { student: '', note: '', status: 'pending' });
  };

  const selectedStatusLabel =
    selectedSeat?.status === 'present'
      ? 'Presente'
      : selectedSeat?.status === 'absent'
        ? 'Ausente'
        : 'Sin marcar';

  return (
    <div>
      <h3 className="text-xl font-bold font-display mb-4">Plano de Asientos</h3>
      <div className="seating-config">
        <form onSubmit={handleResize} className="seating-config__card">
          <h4>Distribución</h4>
          <label>
            Filas
            <input
              type="number"
              min={1}
              max={10}
              value={rowsInput}
              onChange={(event) => setRowsInput(Number(event.target.value))}
            />
          </label>
          <label>
            Columnas
            <input
              type="number"
              min={1}
              max={10}
              value={columnsInput}
              onChange={(event) => setColumnsInput(Number(event.target.value))}
            />
          </label>
          <button type="submit" className="btn btn-primary">
            Actualizar
          </button>
        </form>

        <form onSubmit={handleRosterAssign} className="seating-config__card">
          <h4>Lista de estudiantes</h4>
          <textarea
            value={rosterText}
            onChange={(event) => setRosterText(event.target.value)}
            placeholder="Escribe un alumno por línea"
          />
          <button type="submit" className="btn btn-secondary">
            Asignar asientos
          </button>
        </form>
      </div>

      <div
        className="seating-grid"
        style={{ gridTemplateColumns: `repeat(${plan.columns}, minmax(120px, 1fr))` }}
      >
        {plan.seats.map((seat) => (
          <button
            key={seat.id}
            type="button"
            className={`seat-card ${selectedSeatId === seat.id ? 'seat-card--selected' : ''}`}
            onClick={() => setSelectedSeatId(seat.id)}
          >
            <span className="seat-card__label">
              F{seat.row}-C{seat.column}
            </span>
            <strong className="seat-card__name">
              {seat.student || 'Asiento libre'}
            </strong>
            <span className={`seat-card__status seat-card__status--${seat.status}`}>
              {seat.status === 'present'
                ? 'Presente'
                : seat.status === 'absent'
                  ? 'Ausente'
                  : 'Sin marcar'}
            </span>
            {seat.note ? <p className="seat-card__note">{seat.note}</p> : null}
            <div className="seat-card__actions">
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  markSeat(seat.id, 'present');
                }}
                className="seat-card__action seat-card__action--present"
              >
                Presente
              </button>
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  markSeat(seat.id, 'absent');
                }}
                className="seat-card__action seat-card__action--absent"
              >
                Ausente
              </button>
            </div>
          </button>
        ))}
      </div>

      <div className="seat-panel">
        {selectedSeat ? (
          <>
            <header className="seat-panel__header">
              <div>
                <strong>
                  Asiento F{selectedSeat.row} · C{selectedSeat.column}
                </strong>
                <p className="seat-panel__status">{selectedStatusLabel}</p>
              </div>
              <button type="button" className="btn btn-tertiary" onClick={() => clearSeat(selectedSeat.id)}>
                Liberar asiento
              </button>
            </header>
            <label>
              Estudiante
              <input
                type="text"
                value={selectedSeat.student}
                onChange={(event) => updateSeat(selectedSeat.id, { student: event.target.value })}
                placeholder="Nombre del alumno"
              />
            </label>
            <label>
              Nota rápida
              <textarea
                value={selectedSeat.note}
                onChange={(event) => updateSeat(selectedSeat.id, { note: event.target.value })}
                placeholder="Comentarios, recordatorios o incidentes"
              />
            </label>
            <div className="seat-panel__status-buttons">
              <button
                type="button"
                className={`seat-panel__status-button ${
                  selectedSeat.status === 'present' ? 'seat-panel__status-button--active' : ''
                }`}
                onClick={() => markSeat(selectedSeat.id, 'present')}
              >
                Marcar presente
              </button>
              <button
                type="button"
                className={`seat-panel__status-button ${
                  selectedSeat.status === 'absent' ? 'seat-panel__status-button--active' : ''
                }`}
                onClick={() => markSeat(selectedSeat.id, 'absent')}
              >
                Marcar ausente
              </button>
              <button
                type="button"
                className={`seat-panel__status-button ${
                  selectedSeat.status === 'pending' ? 'seat-panel__status-button--active' : ''
                }`}
                onClick={() => markSeat(selectedSeat.id, 'pending')}
              >
                Sin marcar
              </button>
            </div>
          </>
        ) : (
          <p className="text-sm text-gray-400">Selecciona un asiento para editarlo.</p>
        )}
      </div>
    </div>
  );
};

const Modules: React.FC = () => {
  const [activeModule, setActiveModule] = useState<ActiveModule>('tareas');

  const renderModule = () => {
    switch (activeModule) {
      case 'tareas':
        return <TareasModule />;
      case 'agenda':
        return <AgendaModule />;
      case 'asientos':
        return <SeatingModule />;
      // Add other modules here as placeholders
      default:
        return <p>Modulo no implementado.</p>;
    }
  };

  const ModuleButton: React.FC<{ module: ActiveModule; label: string }> = ({ module, label }) => (
    <button
      onClick={() => setActiveModule(module)}
      className={`px-4 py-2 rounded-t-lg text-sm font-medium transition-colors border-b-2 ${
        activeModule === module
          ? 'text-[var(--accent-1)] border-[var(--accent-1)]'
          : 'text-gray-400 border-transparent hover:border-gray-500'
      }`}
      type="button"
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
          <ModuleButton module="calificaciones" label="Calificaciones (Proximamente)" />
          <ModuleButton module="asientos" label="Plano de Asientos" />
        </nav>
      </div>
      <div>{renderModule()}</div>
    </div>
  );
};

export default Modules;
