
import React, { useState } from 'react';
// FIX: Corrected import path for geminiService.
import { generateSpeech } from '../services/geminiService';
// FIX: Corrected import path for SolidIcons.
import { SpeakerWaveIcon, ArrowPathIcon } from './icons/SolidIcons';

interface TTSButtonProps {
    textToSpeak: string;
}

const TTSButton: React.FC<TTSButtonProps> = ({ textToSpeak }) => {
    const [isPlaying, setIsPlaying] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const handlePlay = async () => {
        if (isPlaying || isLoading || !textToSpeak) return;
        setIsLoading(true);
        try {
            const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
            const audioBuffer = await generateSpeech(textToSpeak, audioContext);
            const source = audioContext.createBufferSource();
            source.buffer = audioBuffer;
            source.connect(audioContext.destination);
            source.onended = () => {
                setIsPlaying(false);
                if (audioContext.state !== 'closed') {
                    audioContext.close();
                }
            };
            source.start();
            setIsPlaying(true);
        } catch (error) {
            console.error("Error generating or playing speech:", error);
            alert("No se pudo reproducir el audio.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <button
            onClick={handlePlay}
            disabled={isLoading || isPlaying || !textToSpeak}
            className="p-2 rounded-full bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-500 disabled:opacity-50 transition"
            aria-label="Escuchar texto"
        >
            {isLoading ? (
                <ArrowPathIcon className="h-5 w-5 animate-spin" />
            ) : (
                <SpeakerWaveIcon className="h-5 w-5" />
            )}
        </button>
    );
};

export default TTSButton;
