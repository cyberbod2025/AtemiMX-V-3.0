import React, { useState, useEffect, useRef } from 'react';
import { Report, User, UserRole, ReportStatus, Comment, Evidence } from '../types';
import { getStudentById, getTeacherById, addCommentToReport, addEvidenceToReport, resolveReport } from '../services/mockDataService';
import { MOCK_USERS } from '../constants';
import { UserCircleIcon, CalendarDaysIcon, ChatBubbleBottomCenterTextIcon, PencilSquareIcon, ChevronDownIcon, ChevronUpIcon, PaperClipIcon, CameraIcon, CheckCircleIcon, PrinterIcon } from './icons/SolidIcons';
import AudioRecorder from './AudioRecorder';
import PrintableView from './PrintableView';

interface ReportCardProps {
  report: Report;
  viewStudentProfile: (studentId: string) => void;
  onReportUpdate: (updatedReport: Report) => void;
  currentUser: User;
  isStudentProfileView?: boolean;
  isGuidanceView?: boolean;
}

const ReportCard: React.FC<ReportCardProps> = ({ report, viewStudentProfile, onReportUpdate, currentUser, isStudentProfileView }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const [teacherName, setTeacherName] = useState('Cargando...');
    const [studentName, setStudentName] = useState('Cargando...');
    const [newComment, setNewComment] = useState('');
    const [isResolving, setIsResolving] = useState(false);
    const [resolutionNotes, setResolutionNotes] = useState('');
    const photoInputRef = useRef<HTMLInputElement>(null);

    // Draft saving for comments
    useEffect(() => {
        const draft = localStorage.getItem(`draft-comment-${report.id}`);
        if(draft) setNewComment(draft);
    }, [report.id]);

    const handleCommentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setNewComment(e.target.value);
        localStorage.setItem(`draft-comment-${report.id}`, e.target.value);
    };

    useEffect(() => {
        const fetchNames = async () => {
            const student = await getStudentById(report.studentId);
            const teacher = await getTeacherById(report.teacherId);
            setStudentName(student?.name || 'Desconocido');
            setTeacherName(teacher?.name || 'Desconocido');
        };
        fetchNames();
    }, [report.studentId, report.teacherId]);
    
    const handleToggleExpand = () => setIsExpanded(!isExpanded);
    
    const handleAddComment = async () => {
        if (newComment.trim() === '') return;
        const comment: Omit<Comment, 'id'> = {
            userId: currentUser.id,
            userName: currentUser.name,
            text: newComment,
            date: new Date().toISOString(),
        };
        const updatedReport = await addCommentToReport(report.id, comment);
        if (updatedReport) {
            onReportUpdate(updatedReport);
            setNewComment('');
            localStorage.removeItem(`draft-comment-${report.id}`);
        }
    };
    
    const handleAddEvidence = async (file: File | Blob, type: 'photo' | 'audio') => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = async () => {
            const evidence: Omit<Evidence, 'id'> = {
                type,
                url: reader.result as string,
                fileName: type === 'photo' ? (file as File).name : `grabacion-${new Date().toISOString()}.webm`,
                date: new Date().toISOString(),
            };
            const updatedReport = await addEvidenceToReport(report.id, evidence);
            if(updatedReport) onReportUpdate(updatedReport);
        };
    };
    
    const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if(e.target.files && e.target.files[0]) {
            handleAddEvidence(e.target.files[0], 'photo');
        }
    };

    const handleAudioUpload = (audioBlob: Blob) => {
        handleAddEvidence(audioBlob, 'audio');
    };
    
    const handleResolve = async () => {
        if(resolutionNotes.trim() === '') return;
        const updatedReport = await resolveReport(report.id, currentUser.id, resolutionNotes);
        if(updatedReport) {
            onReportUpdate(updatedReport);
            setIsResolving(false);
            setResolutionNotes('');
        }
    };

    const handlePrint = () => {
        const printWindow = window.open('', '_blank');
        if (printWindow) {
            const reportHtml = document.getElementById(`printable-${report.id}`)?.innerHTML;
            printWindow.document.write(`<html><head><title>Reporte de Incidencia</title><script src="https://cdn.tailwindcss.com"></script></head><body>${reportHtml}</body></html>`);
            printWindow.document.close();
            setTimeout(() => { // Timeout necessary for content to load
              printWindow.print();
            }, 500);
        }
    };

    const resolvedBy = MOCK_USERS.find(u => u.id === report.resolvedById)?.name || 'Desconocido';

    const canModify = [UserRole.Guidance, UserRole.Admin].includes(currentUser.role);
    
    const statusColor = {
        [ReportStatus.New]: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
        [ReportStatus.InProgress]: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
        [ReportStatus.Resolved]: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
    };

    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
            <div className="p-4 cursor-pointer" onClick={handleToggleExpand}>
                 <div className="flex justify-between items-start">
                    <div>
                        <h4 className="font-bold text-lg text-gray-800 dark:text-white">{report.subject}</h4>
                        <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 mt-1">
                            {!isStudentProfileView && (
                                <>
                                    <UserCircleIcon className="h-4 w-4 mr-1"/>
                                    <button onClick={(e) => { e.stopPropagation(); viewStudentProfile(report.studentId); }} className="hover:underline font-semibold">{studentName}</button>
                                    <span className="mx-2">|</span>
                                </>
                            )}
                            <CalendarDaysIcon className="h-4 w-4 mr-1"/>
                            <span>{new Date(report.date).toLocaleDateString()}</span>
                        </div>
                    </div>
                    <div className="flex items-center space-x-2">
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${statusColor[report.status]}`}>{report.status}</span>
                         <button className="text-gray-500 hover:text-gray-700">
                            {isExpanded ? <ChevronUpIcon className="h-5 w-5"/> : <ChevronDownIcon className="h-5 w-5"/>}
                        </button>
                    </div>
                </div>
            </div>

            {isExpanded && (
                <div className="p-4 border-t border-gray-200 dark:border-gray-700 animate-fade-in-down space-y-4">
                    {/* Report Details */}
                    <div className="space-y-4">
                        <p><strong className="text-gray-600 dark:text-gray-300">Reportado por:</strong> {teacherName}</p>
                        <div>
                            <h5 className="font-semibold flex items-center"><ChatBubbleBottomCenterTextIcon className="h-5 w-5 mr-2" />Descripción</h5>
                            <p className="text-gray-600 dark:text-gray-300 mt-1">{report.description}</p>
                        </div>
                         <div>
                            <h5 className="font-semibold flex items-center"><PencilSquareIcon className="h-5 w-5 mr-2" />Acciones Tomadas</h5>
                            <p className="text-gray-600 dark:text-gray-300 mt-1">{report.actionsTaken}</p>
                        </div>
                    </div>

                    {/* Evidence Section */}
                    <div className="pt-4 border-t">
                        <h5 className="font-semibold flex items-center mb-2"><PaperClipIcon className="h-5 w-5 mr-2"/>Evidencia Adjunta</h5>
                        <div className="space-y-2">
                            {report.evidence.map(ev => (
                                <div key={ev.id} className="flex items-center bg-gray-100 dark:bg-gray-700 p-2 rounded-md">
                                    {ev.type === 'photo' ? <CameraIcon className="h-5 w-5 mr-2"/> : <UserCircleIcon className="h-5 w-5 mr-2" />}
                                    <a href={ev.url} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline text-sm">{ev.fileName}</a>
                                </div>
                            ))}
                        </div>
                        {canModify && report.status !== ReportStatus.Resolved && (
                            <div className="mt-2 flex items-center gap-2">
                                <input type="file" accept="image/*" ref={photoInputRef} onChange={handlePhotoUpload} className="hidden" />
                                <button onClick={() => photoInputRef.current?.click()} className="flex items-center text-sm bg-gray-200 px-3 py-1 rounded hover:bg-gray-300"><CameraIcon className="h-4 w-4 mr-1"/>Adjuntar Foto</button>
                                <AudioRecorder onRecordingComplete={handleAudioUpload} />
                            </div>
                        )}
                    </div>

                    {/* Communication History */}
                    <div className="pt-4 border-t">
                        <h5 className="font-semibold mb-2">Historial de Comunicación</h5>
                        <div className="space-y-3 max-h-48 overflow-y-auto">
                            {report.comments.map(comment => (
                                <div key={comment.id} className="text-sm">
                                    <p className="font-semibold">{comment.userName} <span className="text-xs text-gray-500">({new Date(comment.date).toLocaleString()})</span></p>
                                    <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{comment.text}</p>
                                </div>
                            ))}
                        </div>
                        {canModify && report.status !== ReportStatus.Resolved && (
                            <div className="mt-4">
                                <textarea value={newComment} onChange={handleCommentChange} rows={3} placeholder="Añadir comentario o nota de seguimiento..." className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"></textarea>
                                <button onClick={handleAddComment} className="mt-2 bg-blue-600 text-white px-3 py-1 rounded text-sm font-semibold hover:bg-blue-700">Publicar</button>
                            </div>
                        )}
                    </div>

                    {/* Resolution Section */}
                    {report.status === ReportStatus.Resolved && (
                        <div className="pt-4 border-t bg-green-50 dark:bg-green-900/20 p-3 rounded-md">
                            <h5 className="font-semibold flex items-center text-green-800 dark:text-green-300"><CheckCircleIcon className="h-5 w-5 mr-2"/>Caso Resuelto</h5>
                            <p className="text-sm mt-1"><strong className="block">Resuelto por:</strong> {resolvedBy} el {new Date(report.resolvedDate!).toLocaleDateString()}</p>
                            <p className="text-sm mt-2"><strong className="block">Notas de Resolución:</strong> {report.resolutionNotes}</p>
                        </div>
                    )}
                    
                    {/* Actions: Resolve and Print */}
                    <div className="pt-4 border-t flex justify-between items-start">
                        {canModify && report.status !== ReportStatus.Resolved && (
                            <div>
                                {!isResolving && <button onClick={() => setIsResolving(true)} className="bg-green-600 text-white px-3 py-1 rounded text-sm font-semibold hover:bg-green-700">Resolver Caso</button>}
                                {isResolving && (
                                    <div className="animate-fade-in-down">
                                        <textarea value={resolutionNotes} onChange={(e) => setResolutionNotes(e.target.value)} rows={3} placeholder="Añadir notas finales de la resolución del caso..." className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"></textarea>
                                        <div className="mt-2 space-x-2">
                                            <button onClick={handleResolve} className="bg-green-600 text-white px-3 py-1 rounded text-sm font-semibold hover:bg-green-700">Confirmar Resolución</button>
                                            <button onClick={() => setIsResolving(false)} className="bg-gray-300 px-3 py-1 rounded text-sm">Cancelar</button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                        <button onClick={handlePrint} className="flex items-center text-sm bg-gray-200 dark:bg-gray-600 px-3 py-1 rounded hover:bg-gray-300"><PrinterIcon className="h-4 w-4 mr-1"/>Imprimir</button>
                    </div>

                    {/* Hidden printable view */}
                    <div id={`printable-${report.id}`} className="hidden">
                        <PrintableView report={report} student={studentName} teacher={teacherName} />
                    </div>
                </div>
            )}
        </div>
    );
};

export default ReportCard;