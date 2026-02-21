import { useState, useEffect, useCallback } from 'react';
import { useStore } from '../store';

export const useTelemetry = () => {
    const [vitals, setVitals] = useState({
        hr: 72,
        o2: 98,
        bp: "120/80",
        temp: 36.6,
        status: "Stable"
    });
    const setConnected = useStore((state) => state.setConnected);

    const updateVitals = useCallback((data: any) => {
        setVitals(data);
    }, []);

    useEffect(() => {
        let socket: WebSocket | null = null;
        let pollInterval: number;

        const connect = () => {
            socket = new WebSocket('ws://localhost:8000/ws');

            socket.onopen = () => {
                setConnected(true);
                console.log("📡 HUD Synchronized with Medical Core");
            };

            socket.onmessage = (event) => {
                const msg = JSON.parse(event.data);
                if (msg.type === "TELEMETRY") {
                    updateVitals(msg.data);
                }
            };

            socket.onclose = () => {
                setConnected(false);
                setTimeout(connect, 3000);
            };

            socket.onerror = (err) => {
                console.error("Telemetry Link Failure:", err);
                socket?.close();
            };
        };

        const startPolling = () => {
            pollInterval = window.setInterval(async () => {
                try {
                    const res = await fetch('http://localhost:8000/telemetry');
                    const data = await res.json();
                    updateVitals(data);
                    setConnected(true);
                } catch {
                    setConnected(false);
                }
            }, 2000);
        };

        connect();
        startPolling();

        return () => {
            socket?.close();
            clearInterval(pollInterval);
        };
    }, [updateVitals, setConnected]);

    return vitals;
};
