
import React, { useState, useRef, useEffect, useCallback } from 'react';
// FIX: Corrected import paths for services and icons.
import { setupLiveConversation, closeLiveConversation } from '../../services/geminiService';
import { LiveServerMessage } from '@google/genai';
import { MicIcon, StopCircleIcon, ChatBubbleLeftRightIcon, UserIcon, CpuChipIcon } from '../icons/SolidIcons';

type TranscriptionEntry = {
    speaker: 'user' | 'model';
    text: string;
};

const LiveAssistantView: React.FC = () => {
    const [isRecording, setIsRecording] = useState(false);
    const [isConnecting, setIsConnecting] = useState(false);
    const [transcriptionHistory, setTranscriptionHistory] = useState<TranscriptionEntry[]>([]);
    const [currentInput, setCurrentInput] = useState('');
    const [currentOutput, setCurrentOutput] = useState('');

    // FIX: The LiveSession type is not exported from @google/genai.
    // We can use ReturnType<typeof setupLiveConversation> to get the type of the session promise.
    const sessionPromiseRef = useRef<ReturnType<typeof setupLiveConversation> | null>(null);

    // FIX: Use refs to accumulate the full transcription for a turn to avoid stale closures in the onMessage callback.
    const currentInputRef = useRef('');
    const currentOutputRef = useRef('');

    const onMessage = useCallback((message: LiveServerMessage) => {
        if (message.serverContent?.outputTranscription) {
            const text = message.serverContent.outputTranscription.text;
            currentOutputRef.current += text;
            setCurrentOutput(prev => prev + text);
        } else if (message.serverContent?.inputTranscription) {
            const text = message.serverContent.inputTranscription.text;
            currentInputRef.current += text;
            setCurrentInput(prev => prev + text);
        }

        if (message.serverContent?.turnComplete) {
            setTranscriptionHistory(prev => {
                const newHistory = [...prev];
                const fullInput = currentInputRef.current;
                const fullOutput = currentOutputRef.current;
                if (fullInput.trim()) {
                   newHistory.push({ speaker: 'user', text: fullInput });
                }
                if (fullOutput.trim()) {
                   newHistory.push({ speaker: 'model', text: fullOutput });
                }
                return newHistory;
            });

            currentInputRef.current = '';
            currentOutputRef.current = '';
            setCurrentInput('');
            setCurrentOutput('');
        }
    }, []);
    
    const onError = (e: ErrorEvent) => {
        console.error('Live session error:', e);
        alert('Ocurrió un error en la sesión. La conexión se cerrará.');
        stopConversation();
    };

    const onClose = () => {
        console.log('Live session closed');
        // No need to call stopConversation again if it's already being handled in the session's own close logic
    };

    const startConversation = async () => {
        setIsConnecting(true);
        setTranscriptionHistory([]);
        setCurrentInput('');
        setCurrentOutput('');
        currentInputRef.current = '';
        currentOutputRef.current = '';


        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            sessionPromiseRef.current = setupLiveConversation({ onMessage, onError, onClose, stream });
            await sessionPromiseRef.current;
            setIsRecording(true);
        } catch (error) {
            console.error('Failed to start conversation:', error);
            alert('No se pudo iniciar la conversación. Asegúrate de permitir el acceso al micrófono.');
        } finally {
            setIsConnecting(false);
        }
    };

    const stopConversation = useCallback(() => {
        if (isRecording || isConnecting) {
             if (sessionPromiseRef.current) {
                closeLiveConversation(sessionPromiseRef.current);
                sessionPromiseRef.current = null;
            }
            setIsRecording(false);
            setIsConnecting(false);
        }
    }, [isRecording, isConnecting]);

    useEffect(() => {
        return () => {
           stopConversation();
        };
    }, [stopConversation]);

    return (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold flex items-center mb-4 text-gray-800 dark:text-white">
                <ChatBubbleLeftRightIcon className="h-7 w-7 mr-3" />
                Asistente Conversacional IA
            </h2>
            <p className="mb-6 text-gray-600 dark:text-gray-300">
                Presiona "Iniciar Conversación" para hablar con el asistente en tiempo real. Puedes dictar reportes, pedir resúmenes o consultar información.
            </p>

            <div className="flex justify-center mb-6">
                {!isRecording ? (
                    <button
                        onClick={startConversation}
                        disabled={isConnecting}
                        className="flex items-center justify-center bg-green-600 text-white font-semibold px-6 py-3 rounded-full shadow-lg hover:bg-green-700 transition-all duration-200 disabled:bg-gray-400 disabled:cursor-not-allowed w-52"
                    >
                        <MicIcon className="h-6 w-6 mr-2" />
                        {isConnecting ? 'Conectando...' : 'Iniciar Conversación'}
                    </button>
                ) : (
                    <button
                        onClick={stopConversation}
                        className="flex items-center justify-center bg-red-600 text-white font-semibold px-6 py-3 rounded-full shadow-lg hover:bg-red-700 transition-all duration-200 w-52"
                    >
                        <StopCircleIcon className="h-6 w-6 mr-2" />
                        Detener Conversación
                    </button>
                )}
            </div>
            
            <div className="bg-gray-100 dark:bg-gray-900 rounded-lg p-4 min-h-[300px] max-h-[50vh] overflow-y-auto space-y-4">
                {transcriptionHistory.length === 0 && !isRecording && (
                    <div className="flex justify-center items-center h-full text-gray-500">
                        La transcripción aparecerá aquí...
                    </div>
                )}
                {transcriptionHistory.map((entry, index) => (
                    <div key={index} className={`flex items-start gap-3 ${entry.speaker === 'user' ? 'justify-end' : ''}`}>
                        {entry.speaker === 'model' && <CpuChipIcon className="h-6 w-6 text-blue-500 flex-shrink-0 mt-1" />}
                        <div className={`p-3 rounded-lg max-w-lg ${entry.speaker === 'user' ? 'bg-blue-500 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200'}`}>
                            {entry.text}
                        </div>
                         {entry.speaker === 'user' && <UserIcon className="h-6 w-6 text-gray-500 flex-shrink-0 mt-1" />}
                    </div>
                ))}
                {isRecording && currentInput && (
                    <div className="text-gray-500 italic">{currentInput}</div>
                )}
                 {isRecording && currentOutput && (
                    <div className="text-blue-400 italic">{currentOutput}</div>
                )}
                {isRecording && !currentInput && !currentOutput && (
                     <div className="text-gray-500 italic animate-pulse">Escuchando...</div>
                )}
            </div>
        </div>
    );
};

export default LiveAssistantView;
