import { useState, useEffect, useCallback } from 'react';

export const useVoiceControl = (callback: (command: string) => void) => {
    const [isListening, setIsListening] = useState(false);
    const [lastTranscript, setLastTranscript] = useState('');

    const startListening = useCallback(() => {
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (!SpeechRecognition) {
            console.warn("Speech recognition not supported in this browser.");
            return;
        }

        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        recognition.onstart = () => setIsListening(true);
        recognition.onend = () => setIsListening(false);
        recognition.onerror = (event: any) => console.error("Speech recognition error:", event.error);

        recognition.onresult = (event: any) => {
            const transcript = Array.from(event.results)
                .map((result: any) => result[0])
                .map((result: any) => result.transcript)
                .join('');

            setLastTranscript(transcript);

            // Simple command matching
            const lower = transcript.toLowerCase();
            if (lower.includes('nova')) {
                if (lower.includes('switch view') || lower.includes('toggle mri')) {
                    callback('TOGGLE_MRI');
                } else if (lower.includes('reset view')) {
                    callback('RESET_VIEW');
                } else if (lower.includes('screenshot') || lower.includes('capture')) {
                    callback('SCREENSHOT');
                }
            }
        };

        recognition.start();
        return recognition;
    }, [callback]);

    useEffect(() => {
        const recognition = startListening();
        return () => {
            if (recognition) recognition.stop();
        };
    }, [startListening]);

    return { isListening, lastTranscript };
};
