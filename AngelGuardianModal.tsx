import React, { useEffect, useRef, useState } from "react";

import { GuardianGenAIClient } from "./services/genaiClient";
import type { GuardianReport } from "./types";
import type { GuardianReportDraft } from "./services/guardianReportsService";

// FIX: Add declarations for Web Speech API to prevent TypeScript errors
// as these properties are not part of the standard DOM library typings.
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

// Check for browser support (Vitest usa entorno Node, por eso validamos `window`).
const speechRecognitionGlobal = typeof window !== 'undefined'
  ? window.SpeechRecognition || window.webkitSpeechRecognition
  : null;
const isSpeechRecognitionSupported = !!speechRecognitionGlobal;

const aiClient = new GuardianGenAIClient({
  apiKey: import.meta.env.VITE_GEMINI_API_KEY
});

interface Props {
  onClose: () => void;
  onSaveReport: (draft: GuardianReportDraft) => Promise<GuardianReport>;
  onSaved?: (report: GuardianReport) => void;
}

const AngelGuardianModal: React.FC<Props> = ({ onClose, onSaveReport, onSaved }) => {
  const [stage, setStage] = useState<'idle' | 'recording' | 'processing' | 'review'>('idle');
  const [error, setError] = useState<string | null>(null);
  const [transcript, setTranscript] = useState('');
  const [finalTranscript, setFinalTranscript] = useState('');
  const [generatedReport, setGeneratedReport] = useState<{ title: string; summary: string } | null>(null);
  // FIX: Changed SpeechRecognition type to `any`. The `SpeechRecognition` name is
  // used as a variable for the constructor, so it cannot be used as a type here.
  const recognitionRef = useRef<any | null>(null);
  const [timer, setTimer] = useState(0);
  const timerIntervalRef = useRef<number | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    // FIX: This effect should only run once on mount. The original implementation
    // did not correctly handle re-renders, causing the speech recognition event
    // listeners to be attached multiple times, which led to duplicated text.
    // By keeping the effect self-contained and running only once, we ensure
    // that the transcript is processed correctly.
    if (!isSpeechRecognitionSupported) {
      setError("Tu navegador no soporta el reconocimiento de voz. Por favor, intenta con Google Chrome.");
      return;
    }

    const recognition = speechRecognitionGlobal
      ? new (speechRecognitionGlobal as any)()
      : null;

    if (!recognition) {
      setError('Tu navegador no expone la API de voz.');
      return;
    }
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'es-MX';

    recognition.onresult = (event: any) => {
      let final_transcript = '';
      let interim_transcript = '';

      // Rebuild the transcript from the results array on each event
      for (let i = 0; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          final_transcript += event.results[i][0].transcript;
        } else {
          interim_transcript += event.results[i][0].transcript;
        }
      }
      setFinalTranscript(final_transcript);
      setTranscript(final_transcript + interim_transcript);
    };
    
    recognition.onerror = (event: any) => {
        setError(`Error de reconocimiento: ${event.error}`);
        stopRecording();
    };

    recognitionRef.current = recognition;

    return () => {
      recognition.stop();
      if(timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const startRecording = () => {
    setTranscript('');
    setFinalTranscript('');
    setTimer(0);
    setError(null);
    if (recognitionRef.current) {
      try {
        recognitionRef.current.start();
        setStage('recording');
        timerIntervalRef.current = window.setInterval(() => setTimer(t => t + 1), 1000);
      } catch(e) {
          setError("La grabación no pudo iniciar. Intenta de nuevo.");
      }
    }
  };

  const stopRecording = async () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    setStage('processing');

    try {
        const reportData = await aiClient.generateStructuredSummary(finalTranscript);
        setGeneratedReport({ title: reportData.title, summary: reportData.summary });
        setStage('review');
    } catch (apiError) {
        console.error(apiError);
        setError(apiError instanceof Error ? apiError.message : "Error al generar el reporte con la IA. Por favor, intenta de nuevo.");
        setStage('idle');
    }
  };
  
  const persistReport = async () => {
    if (!generatedReport) {
      return;
    }
    const sanitizedTranscript = finalTranscript.trim();
    if (!sanitizedTranscript) {
      setError("No hay transcripción final para guardar.");
      return;
    }
    setIsSaving(true);
    try {
      const draft: GuardianReportDraft = {
        title: generatedReport.title.trim() || "Reporte sin título",
        summary: generatedReport.summary.trim(),
        transcript: sanitizedTranscript,
        date: new Date().toISOString(),
      };
      const saved = await onSaveReport(draft);
      onSaved?.(saved);
      onClose();
    } catch (saveError) {
      console.error("[AngelGuardian] No se pudo guardar el reporte cifrado", saveError);
      setError(saveError instanceof Error ? saveError.message : "No fue posible guardar el reporte. Intenta de nuevo.");
      setStage("review");
    } finally {
      setIsSaving(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
    const secs = (seconds % 60).toString().padStart(2, '0');
    return `${mins}:${secs}`;
  };

  const renderContent = () => {
    if (error) {
        return (
            <div className="text-center">
                <h2 className="text-xl font-bold font-display text-[var(--error)] mb-4">Ocurrió un Error</h2>
                <p className="text-gray-300">{error}</p>
                <button className="btn btn-secondary mt-6" onClick={onClose}>Cerrar</button>
            </div>
        );
    }

    switch (stage) {
      case 'idle':
        return (
          <>
            <h2 className="text-xl sm:text-2xl font-bold font-display text-[var(--accent-1)] mb-4">Activar Ángel Guardián</h2>
            <p className="text-gray-300 mb-6">
              La grabación se transcribe en tu navegador y se cifra con AES-GCM antes de enviarse a Firestore. Solo tu
              sesión autenticada puede descifrarlo nuevamente.
            </p>
            <button className="btn btn-primary w-full" onClick={startRecording}>Comenzar Grabación</button>
          </>
        );
      case 'recording':
        return (
          <>
            <div className="flex items-center justify-center mb-4">
                <div className="w-4 h-4 rounded-full bg-[var(--error)] animate-pulse mr-3"></div>
                <h2 className="text-xl sm:text-2xl font-bold font-display text-[var(--error)]">Grabando... {formatTime(timer)}</h2>
            </div>
            <p className="text-gray-300 bg-black/30 p-4 rounded-lg min-h-[150px] max-h-[300px] overflow-y-auto">{transcript || 'Escuchando...'}</p>
            <button className="btn btn-secondary w-full mt-6 !border-[var(--error)] hover:!bg-[var(--error)]" onClick={stopRecording}>Detener y Generar Reporte</button>
          </>
        );
      case 'processing':
        return <div className="text-center"><p className="text-lg text-[var(--accent-1)]">Procesando y generando reporte con IA...</p></div>;
      case 'review':
        return (
            <>
                <h2 className="text-xl sm:text-2xl font-bold font-display text-[var(--accent-1)] mb-4">Revisar Reporte</h2>
                {generatedReport && (
                    <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                        <div>
                            <label className="font-bold text-gray-400">Título Sugerido</label>
                            <input type="text" className="input-field mt-1" value={generatedReport.title} onChange={(e) => setGeneratedReport(gr => gr ? {...gr, title: e.target.value} : null)} />
                        </div>
                         <div>
                            <label className="font-bold text-gray-400">Resumen por IA</label>
                            <textarea className="input-field mt-1 h-24" value={generatedReport.summary} onChange={(e) => setGeneratedReport(gr => gr ? {...gr, summary: e.target.value} : null)}></textarea>
                        </div>
                        <div>
                            <p className="font-bold text-gray-400 mb-1">Transcripción Completa</p>
                             <p className="text-sm text-gray-300 bg-black/30 p-2 rounded-md whitespace-pre-wrap">{finalTranscript}</p>
                        </div>
                    </div>
                )}
                <div className="flex gap-4 mt-6">
                    <button className="btn btn-primary flex-1 disabled:opacity-60" onClick={persistReport} disabled={isSaving}>
                      {isSaving ? "Guardando..." : "Guardar Reporte"}
                    </button>
                    <button className="btn btn-secondary flex-1" onClick={() => setStage('idle')} disabled={isSaving}>Descartar</button>
                </div>
            </>
        );
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
      style={{ animation: 'fadeIn 0.3s ease-out' }}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="bg-surface-800/60 backdrop-blur-lg border border-[var(--accent-2)]/50 rounded-2xl p-6 sm:p-8 w-full max-w-2xl shadow-2xl shadow-[var(--accent-1)]/10"
        style={{ animation: 'slideInUp 0.3s ease-out' }}
      >
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white">&times;</button>
        {renderContent()}
      </div>
    </div>
  );
};

export default AngelGuardianModal;
