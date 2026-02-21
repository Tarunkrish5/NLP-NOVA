import { useEffect, useRef, useState } from 'react';
import { Hands, HAND_CONNECTIONS } from '@mediapipe/hands';
import { drawConnectors, drawLandmarks } from '@mediapipe/drawing_utils';

export const useMediaPipe = () => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [gesture, setGesture] = useState('IDLE');
    const [coords, setCoords] = useState({ x: 0.5, y: 0.5 }); // Normalized 0-1

    useEffect(() => {
        const hands = new Hands({
            locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
        });

        hands.setOptions({
            maxNumHands: 1,
            modelComplexity: 1,
            minDetectionConfidence: 0.5,
            minTrackingConfidence: 0.5,
        });

        hands.onResults((results) => {
            if (canvasRef.current && videoRef.current) {
                const canvasCtx = canvasRef.current.getContext('2d');
                if (!canvasCtx) return;

                canvasCtx.save();
                canvasCtx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);

                if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
                    const landmarks = results.multiHandLandmarks[0];

                    // Draw for debug
                    drawConnectors(canvasCtx, landmarks, HAND_CONNECTIONS, { color: '#00d2ff', lineWidth: 2 });
                    drawLandmarks(canvasCtx, landmarks, { color: '#ff3e3e', lineWidth: 1 });

                    // Logic for gestures
                    // 1. Index finger tip (Landmark 8) for light tracking
                    const indexTip = landmarks[8];
                    setCoords({ x: indexTip.x, y: indexTip.y });

                    // 2. Pinch detection (Index 8 and Thumb 4 distance)
                    const thumbTip = landmarks[4];
                    const dist = Math.sqrt(
                        Math.pow(indexTip.x - thumbTip.x, 2) +
                        Math.pow(indexTip.y - thumbTip.y, 2)
                    );

                    if (dist < 0.05) {
                        setGesture('PINCH');
                    } else {
                        // Palm open detection (Distance between wrist and fingertips)
                        const wrist = landmarks[0];
                        const middleTip = landmarks[12];
                        const palmDist = Math.sqrt(
                            Math.pow(middleTip.x - wrist.x, 2) +
                            Math.pow(middleTip.y - wrist.y, 2)
                        );

                        if (palmDist > 0.4) {
                            setGesture('PALM_OPEN');
                        } else {
                            setGesture('IDLE');
                        }
                    }
                }
                canvasCtx.restore();
            }
        });

        const startCamera = async () => {
            if (videoRef.current) {
                try {
                    const stream = await navigator.mediaDevices.getUserMedia({
                        video: { width: 640, height: 480 },
                    });
                    videoRef.current.srcObject = stream;
                    videoRef.current.play();

                    const processVideo = async () => {
                        if (videoRef.current) {
                            await hands.send({ image: videoRef.current });
                            requestAnimationFrame(processVideo);
                        }
                    };
                    processVideo();
                } catch (err) {
                    console.error("Camera access denied:", err);
                }
            }
        };

        startCamera();

        return () => {
            hands.close();
        };
    }, []);

    return { videoRef, canvasRef, gesture, coords };
};
