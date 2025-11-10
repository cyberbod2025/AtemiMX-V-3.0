import React, { useState, useRef } from 'react';
import { MicIcon, StopCircleIcon, ArrowPathIcon } from './icons/SolidIcons';

interface AudioRecorderProps {
    onRecordingComplete: (audioBlob: Blob) => void;
}

const AudioRecorder: React.FC<AudioRecorderProps> = ({ onRecordingComplete }) => {
    const [isRecording, setIsRecording] = useState(false);
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

            recorder.onstop = () => {
                const mimeType = mediaRecorderRef.current?.mimeType || 'audio/webm';
                const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
                onRecordingComplete(audioBlob);
                audioChunksRef.current = [];
            };

            recorder.start();
            setIsRecording(true);
        } catch (error) {
            console.error("Could not start recording:", error);
            alert("No se pudo acceder al micrófono. Por favor, verifica los permisos.");
        }
    };
    
    const handleClick = () => {
        if (isRecording) {
            stopRecording();
        } else {
            startRecording();
        }
    };

    return (
        <button
            type="button"
            onClick={handleClick}
            className={`flex items-center text-sm px-3 py-1 rounded transition-colors ${isRecording ? 'bg-red-500 text-white hover:bg-red-600' : 'bg-gray-200 hover:bg-gray-300'}`}
        >
            {isRecording ? (
                <>
                    <StopCircleIcon className="h-4 w-4 mr-1"/>
                    Detener
                </>
            ) : (
                <>
                    <MicIcon className="h-4 w-4 mr-1"/>
                    Grabar Audio
                </>
            )}
        </button>
    );
};

export default AudioRecorder;
