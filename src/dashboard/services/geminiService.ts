import { GoogleGenAI, LiveServerMessage, Modality } from "@google/genai";
import { decode, decodeAudioData, createPcmBlob } from "./audioUtils";

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
if (!API_KEY) {
  throw new Error("Configura VITE_GEMINI_API_KEY en tu archivo .env para usar Gemini.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

// --- Text-based Generation ---

export const summarizeText = async (text: string): Promise<string> => {
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Resume el siguiente reporte de incidencia escolar en un párrafo conciso:\n\n"${text}"`,
        });
        return response.text;
    } catch (error) {
        console.error("Error summarizing text:", error);
        return "No se pudo generar el resumen.";
    }
};

export const suggestNextSteps = async (text: string, reportType: string): Promise<string> => {
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Basado en el siguiente reporte de tipo "${reportType}", sugiere 3 próximos pasos claros y accionables para el personal de orientación escolar:\n\n"${text}"`,
        });
        return response.text;
    } catch (error) {
        console.error("Error suggesting next steps:", error);
        return "No se pudieron generar sugerencias.";
    }
};

// --- Audio Transcription ---

export const transcribeAudioWithGemini = async (base64Audio: string, mimeType: string): Promise<string> => {
    try {
        const audioPart = {
            inlineData: {
                data: base64Audio,
                mimeType: mimeType,
            },
        };
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: { parts: [audioPart, { text: "Transcribe este audio." }] },
        });
        return response.text;
    } catch (error) {
        console.error("Error transcribing audio:", error);
        return "";
    }
};

// --- Text-to-Speech ---

export const generateSpeech = async (text: string, audioContext: AudioContext): Promise<AudioBuffer> => {
    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text: `Say with a neutral and clear tone: ${text}` }] }],
        config: {
            responseModalities: [Modality.AUDIO],
            speechConfig: {
                voiceConfig: {
                    prebuiltVoiceConfig: { voiceName: 'Kore' }, // A neutral, professional voice
                },
            },
        },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) {
        throw new Error("No audio data received from API.");
    }
    const audioBytes = decode(base64Audio);
    return await decodeAudioData(audioBytes, audioContext, 24000, 1);
};


// --- Live Conversation ---
interface LiveCallbacks {
    onMessage: (message: LiveServerMessage) => void;
    onError: (e: ErrorEvent) => void;
    onClose: () => void;
    stream: MediaStream;
}

// FIX: Exporting the session type to be used in components.
export type LiveSession = Awaited<ReturnType<typeof ai.live.connect>>;
let activeSession: LiveSession | null = null;
let inputAudioContext: AudioContext | null = null;
let scriptProcessor: ScriptProcessorNode | null = null;
let mediaStreamSource: MediaStreamAudioSourceNode | null = null;

export const setupLiveConversation = async ({ onMessage, onError, onClose, stream }: LiveCallbacks): Promise<LiveSession> => {
    if (activeSession) {
        console.warn("An active session already exists. Closing the old one.");
        closeLiveConversation(Promise.resolve(activeSession));
    }
    
    inputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
    
    const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        callbacks: {
            onopen: () => {
                mediaStreamSource = inputAudioContext!.createMediaStreamSource(stream);
                scriptProcessor = inputAudioContext!.createScriptProcessor(4096, 1, 1);
                
                scriptProcessor.onaudioprocess = (audioProcessingEvent) => {
                    const inputData = audioProcessingEvent.inputBuffer.getChannelData(0);
                    const pcmBlob = createPcmBlob(inputData);
                    sessionPromise.then((session) => {
                        if (session) { // Check if session is still valid
                            session.sendRealtimeInput({ media: pcmBlob });
                        }
                    });
                };
                mediaStreamSource.connect(scriptProcessor);
                scriptProcessor.connect(inputAudioContext!.destination);
            },
            onmessage: onMessage,
            onerror: onError,
            onclose: onClose,
        },
        config: {
            responseModalities: [Modality.AUDIO],
            outputAudioTranscription: {},
            inputAudioTranscription: {},
            systemInstruction: 'Eres un asistente de IA para personal escolar. Sé conciso, profesional y servicial.',
        },
    });

    activeSession = await sessionPromise;
    return activeSession;
};

export const closeLiveConversation = (sessionPromise: Promise<LiveSession | null>) => {
    sessionPromise.then(session => {
        if(session) {
            session.close();
        }
        if (scriptProcessor) {
            scriptProcessor.disconnect();
            scriptProcessor = null;
        }
        if(mediaStreamSource) {
            mediaStreamSource.disconnect();
            mediaStreamSource = null;
        }
        if (inputAudioContext && inputAudioContext.state !== 'closed') {
            inputAudioContext.close();
            inputAudioContext = null;
        }
        activeSession = null;
    });
};
