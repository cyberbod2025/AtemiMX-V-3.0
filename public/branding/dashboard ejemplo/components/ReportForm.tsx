import React, { useState } from 'react';
import { User, Report, ReportType, ReportStatus, ReportPriority } from '../types';
import { MOCK_STUDENTS } from '../constants';
import AudioTranscriptionButton from './AudioTranscriptionButton';

interface ReportFormProps {
  currentUser: User;
  onReportSubmit: (report: Report) => void;
}

const ReportForm: React.FC<ReportFormProps> = ({ currentUser, onReportSubmit }) => {
  const [studentId, setStudentId] = useState('');
  const [subject, setSubject] = useState('');
  const [reportType, setReportType] = useState<ReportType>(ReportType.Disciplinary);
  const [description, setDescription] = useState('');
  const [actionsTaken, setActionsTaken] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // FIX: Added subject to the validation to ensure it's not empty.
    if (!studentId || !subject || !description || !actionsTaken) {
      alert('Por favor completa todos los campos.');
      return;
    }

    // FIX: Added 'subject' property to the new report object to match the Report interface.
    // FIX: Added missing 'comments' and 'evidence' properties to satisfy the Report interface.
    const newReport: Report = {
      id: `report-${Date.now()}`,
      studentId,
      teacherId: currentUser.id,
      date: new Date().toISOString(),
      type: reportType,
      subject: subject,
      description,
      status: ReportStatus.New,
      priority: ReportPriority.Medium, // Default priority, could be determined by Gemini later
      actionsTaken,
      comments: [],
      evidence: [],
    };

    onReportSubmit(newReport);
    // Reset form
    setStudentId('');
    setSubject('');
    setReportType(ReportType.Disciplinary);
    setDescription('');
    setActionsTaken('');
  };

  const handleDescriptionTranscription = (text: string) => {
      setDescription(prev => (prev ? prev + ' ' : '') + text);
  };
  
  const handleActionsTranscription = (text: string) => {
      setActionsTaken(prev => (prev ? prev + ' ' : '') + text);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h3 className="text-lg font-semibold border-b pb-2">Registrar Nueva Incidencia</h3>
      <div>
        <label htmlFor="student" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Alumno</label>
        <select
          id="student"
          value={studentId}
          onChange={(e) => setStudentId(e.target.value)}
          className="mt-1 block w-full p-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="">Selecciona un alumno</option>
          {MOCK_STUDENTS.map((student) => (
            <option key={student.id} value={student.id}>{student.name}</option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="reportType" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Tipo de Reporte</label>
        <select
          id="reportType"
          value={reportType}
          onChange={(e) => setReportType(e.target.value as ReportType)}
          className="mt-1 block w-full p-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
        >
          <option value={ReportType.Disciplinary}>Disciplinario</option>
          <option value={ReportType.SocioEmotional}>Socio-emocional</option>
        </select>
      </div>

      <div>
        <label htmlFor="subject" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Asignatura</label>
        <input
          type="text"
          id="subject"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          className="mt-1 block w-full p-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          placeholder="Ej. Matemáticas, Historia"
        />
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Descripción de la Incidencia</label>
        <div className="relative w-full">
            <textarea
            id="description"
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="mt-1 block w-full p-2 pr-10 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            placeholder="Describe detalladamente lo que sucedió o usa el micrófono para dictar..."
            ></textarea>
            <div className="absolute top-1 right-0 mt-1 mr-2">
                <AudioTranscriptionButton onTranscription={handleDescriptionTranscription} />
            </div>
        </div>
      </div>

      <div>
        <label htmlFor="actionsTaken" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Acciones Tomadas Inmediatamente</label>
         <div className="relative w-full">
            <textarea
                id="actionsTaken"
                rows={2}
                value={actionsTaken}
                onChange={(e) => setActionsTaken(e.target.value)}
                className="mt-1 block w-full p-2 pr-10 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="¿Qué acciones se tomaron en el momento? Puedes dictar..."
            ></textarea>
            <div className="absolute top-1 right-0 mt-1 mr-2">
                <AudioTranscriptionButton onTranscription={handleActionsTranscription} />
            </div>
        </div>
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          className="bg-blue-600 text-white font-semibold px-4 py-2 rounded-lg shadow-md hover:bg-blue-700 transition-colors"
        >
          Enviar Reporte
        </button>
      </div>
    </form>
  );
};

export default ReportForm;