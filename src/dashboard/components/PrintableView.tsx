import React from 'react';
import { Report } from '../types';
import { MOCK_STUDENTS, MOCK_USERS } from '../constants';

interface PrintableViewProps {
  report: Report;
  student: string;
  teacher: string;
}

const PrintableView: React.FC<PrintableViewProps> = ({ report, student, teacher }) => {
    const studentDetails = MOCK_STUDENTS.find(s => s.id === report.studentId);
    const resolvedBy = MOCK_USERS.find(u => u.id === report.resolvedById)?.name || 'N/A';

    return (
        <div className="p-8 font-sans bg-white text-gray-900">
            <header className="text-center mb-8 border-b-2 pb-4 border-gray-900">
                <h1 className="text-3xl font-bold">Reporte de Incidencia Escolar</h1>
                <p className="text-lg">Secundaria Técnica No. 310 "Atemi"</p>
            </header>

            <section className="mb-6">
                <h2 className="text-xl font-semibold border-b pb-2 mb-3">Detalles del Reporte</h2>
                <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm">
                    <div><strong>Fecha del Reporte:</strong> {new Date(report.date).toLocaleString()}</div>
                    <div><strong>Estado:</strong> {report.status}</div>
                    <div><strong>Alumno:</strong> {student}</div>
                    <div><strong>Grado y Grupo:</strong> {studentDetails?.grade}° "{studentDetails?.group}"</div>
                    <div><strong>Reportado por:</strong> {teacher}</div>
                    <div><strong>Tipo de Incidencia:</strong> {report.type}</div>
                    <div className="col-span-2"><strong>Asignatura/Motivo:</strong> {report.subject}</div>
                </div>
            </section>

            <section className="mb-6">
                <h2 className="text-xl font-semibold border-b pb-2 mb-3">Descripción de Hechos</h2>
                <p className="text-sm leading-relaxed">{report.description}</p>
            </section>
            
            <section className="mb-6">
                <h2 className="text-xl font-semibold border-b pb-2 mb-3">Acciones Inmediatas</h2>
                <p className="text-sm leading-relaxed">{report.actionsTaken}</p>
            </section>

            {report.comments.length > 0 && (
                 <section className="mb-6">
                    <h2 className="text-xl font-semibold border-b pb-2 mb-3">Historial de Seguimiento</h2>
                    <div className="space-y-3">
                        {report.comments.map(comment => (
                            <div key={comment.id} className="text-sm border-l-2 pl-3">
                                <p><strong>{comment.userName}</strong> ({new Date(comment.date).toLocaleString()})</p>
                                <p className="mt-1">{comment.text}</p>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {report.status === 'Resuelto' && (
                 <section className="mb-6 bg-gray-100 p-4 rounded">
                    <h2 className="text-xl font-semibold border-b pb-2 mb-3">Resolución del Caso</h2>
                    <div className="text-sm">
                        <p><strong>Fecha de Resolución:</strong> {new Date(report.resolvedDate!).toLocaleString()}</p>
                        <p><strong>Resuelto por:</strong> {resolvedBy}</p>
                        <p className="mt-2"><strong>Acuerdos y Notas Finales:</strong></p>
                        <p className="mt-1 leading-relaxed">{report.resolutionNotes}</p>
                    </div>
                </section>
            )}

            <footer className="mt-24 pt-8">
                <h2 className="text-xl font-semibold border-b pb-2 mb-12 text-center">Firmas de Enterado y Acuerdos</h2>
                <div className="grid grid-cols-3 gap-12 text-center text-sm">
                    <div>
                        <div className="border-t border-gray-700 pt-2">Firma del Alumno(a)</div>
                        <div className="mt-1">{student}</div>
                    </div>
                    <div>
                        <div className="border-t border-gray-700 pt-2">Firma del Padre, Madre o Tutor</div>
                    </div>
                    <div>
                        <div className="border-t border-gray-700 pt-2">Firma del Personal Escolar</div>
                         <div className="mt-1">{resolvedBy !== 'N/A' ? resolvedBy : teacher}</div>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default PrintableView;
