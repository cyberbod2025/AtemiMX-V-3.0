import React, { useState, useRef } from 'react';
// FIX: Corrected import path for geminiService.
import { transcribeAudioWithGemini } from '../services/geminiService';
import { blobToBase64 } from '../services/audioUtils';
// FIX: Corrected import path for SolidIcons.
import { MicIcon, ArrowPathIcon } from './icons/SolidIcons';

interface AudioTranscriptionButtonProps {
    onTranscription: (text: string) => void;
    disabled?: boolean;
}

const AudioTranscriptionButton: React.FC<AudioTranscriptionButtonProps> = ({ onTranscription, disabled }) => {
    const [isRecording, setIsRecording] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);
    const streamRef = useRef<MediaStream | null>(null);

    const stopRecording = () => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
            mediaRecorderRef.current.stop();
        }
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
        setIsRecording(false);
        setIsLoading(true);
    };

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            streamRef.current = stream;
            const recorder = new MediaRecorder(stream);
            mediaRecorderRef.current = recorder;
            audioChunksRef.current = [];

            recorder.ondataavailable = (event) => {
                audioChunksRef.current.push(event.data);
            };

            recorder.onstop = async () => {
                const mimeType = mediaRecorderRef.current?.mimeType || 'audio/webm';
                const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });

                try {
                    const base64Audio = await blobToBase64(audioBlob);
                    const transcribedText = await transcribeAudioWithGemini(base64Audio, mimeType);
                    onTranscription(transcribedText);
                } catch (error) {
                    console.error("Transcription failed:", error);
                    alert("No se pudo transcribir el audio.");
                } finally {
                    setIsLoading(false);
                    audioChunksRef.current = [];
                }
            };

            recorder.start();
            setIsRecording(true);
        } catch (error) {
            console.error("Could not start recording:", error);
            alert("No se pudo acceder al micrófono. Por favor, verifica los permisos.");
        }
    };
    
    const handleClick = () => {
        if (disabled || isLoading) return;
        if (isRecording) {
            stopRecording();
        } else {
            startRecording();
        }
    };

    const buttonClasses = isRecording 
        ? "text-red-500 animate-pulse" 
        : "text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400";

    return (
        <button
            type="button"
            onClick={handleClick}
            disabled={disabled || isLoading}
            className={`p-1 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${buttonClasses}`}
            aria-label={isRecording ? 'Detener dictado' : 'Iniciar dictado'}
        >
            {isLoading ? (
                <ArrowPathIcon className="h-5 w-5 animate-spin" />
            ) : (
                <MicIcon className="h-5 w-5" />
            )}
        </button>
    );
};

export default AudioTranscriptionButton;