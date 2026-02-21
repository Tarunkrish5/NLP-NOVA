import { useEffect, useRef, useCallback } from 'react';
import { FilesetResolver, HandLandmarker } from '@mediapipe/tasks-vision';
import { useStore } from '../store';

export const useMediaPipe = (videoRef: React.RefObject<HTMLVideoElement | null>) => {
    const setGesture = useStore((state) => state.setGesture);
    const setCoords = useStore((state) => state.setCoords);
    const setRotation = useStore((state) => state.setRotation);
    const handLandmarkerRef = useRef<HandLandmarker | null>(null);

    const initializeMediaPipe = useCallback(async () => {
        const vision = await FilesetResolver.forVisionTasks(
            "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0/wasm"
        );
        handLandmarkerRef.current = await HandLandmarker.createFromOptions(vision, {
            baseOptions: {
                modelAssetPath: "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task",
                delegate: "GPU"
            },
            runningMode: "VIDEO",
            numHands: 1
        });
    }, []);

    useEffect(() => {
        initializeMediaPipe();

        const detect = () => {
            if (videoRef.current && handLandmarkerRef.current) {
                const results = handLandmarkerRef.current.detectForVideo(videoRef.current, performance.now());
                if (results.landmarks && results.landmarks.length > 0) {
                    const landmarks = results.landmarks[0];
                    const indexFinger = landmarks[8];
                    const thumb = landmarks[4];
                    const middleFinger = landmarks[12];

                    // Map primary coordinates
                    setCoords({ x: indexFinger.x, y: indexFinger.y });

                    // Gesture Logic
                    const touchDistance = Math.hypot(indexFinger.x - thumb.x, indexFinger.y - thumb.y);
                    const palmOpen = middleFinger.y < landmarks[9].y; // Middle tip above knuckle

                    if (touchDistance < 0.05) {
                        setGesture('PINCH');
                        // Horizontal movement maps to rotation
                        setRotation((prev: number) => prev + (indexFinger.x - 0.5) * 0.1);
                    } else if (palmOpen) {
                        setGesture('PALM_OPEN');
                    } else {
                        setGesture('IDLE');
                    }
                } else {
                    setGesture('IDLE');
                }
            }
            requestAnimationFrame(detect);
        };

        const animationId = requestAnimationFrame(detect);
        return () => cancelAnimationFrame(animationId);
    }, [videoRef, initializeMediaPipe, setGesture, setCoords, setRotation]);
};
