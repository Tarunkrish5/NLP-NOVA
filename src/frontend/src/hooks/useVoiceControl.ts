import { useEffect, useCallback } from 'react';
import { useStore } from '../store';

export const useVoiceControl = (handlers: { onCommand: (cmd: string, data?: string) => void }) => {
    const setViewMode = useStore((state) => state.setViewMode);
    const setRotation = useStore((state) => state.setRotation);

    const processCommand = useCallback((text: string) => {
        console.log("🎤 Voice Engine Processing:", text);
        const lowerText = text.toLowerCase();

        if (lowerText.includes('toggle mri') || lowerText.includes('switch to mri')) {
            setViewMode('MRI');
            handlers.onCommand('TOGGLE_MRI');
        } else if (lowerText.includes('show telemetry') || lowerText.includes(' cockpit')) {
            setViewMode('TELEMETRY');
            handlers.onCommand('SHOW_TELEMETRY');
        } else if (lowerText.includes('reset view') || lowerText.includes('center')) {
            setRotation(0);
            handlers.onCommand('RESET_VIEW');
        }
    }, [handlers, setViewMode, setRotation]);

    useEffect(() => {
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (!SpeechRecognition) return;

        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = false;
        recognition.lang = 'en-US';

        recognition.onresult = (event: any) => {
            const transcript = event.results[event.results.length - 1][0].transcript;
            processCommand(transcript);
        };

        recognition.start();
        return () => recognition.stop();
    }, [processCommand]);
};
