import { useState, useEffect } from 'react';

export const useTelemetry = () => {
    const [telemetry, setTelemetry] = useState({
        hr: 72,
        o2: 98,
        bp: "120/80",
        temp: 36.6,
        status: "Stable"
    });
    const [isConnected, setIsConnected] = useState(false);
    const [logs, setLogs] = useState<any[]>([]);

    useEffect(() => {
        let ws: WebSocket;
        let retryInterval: any;

        const connect = () => {
            ws = new WebSocket('ws://localhost:8000/ws');

            ws.onopen = () => {
                setIsConnected(true);
                if (retryInterval) clearInterval(retryInterval);
            };

            ws.onmessage = (event) => {
                const data = JSON.parse(event.data);
                if (data.type === 'TELEMETRY') {
                    setTelemetry(data.data);
                } else if (data.type === 'ACTION') {
                    setLogs(prev => [data.log, ...prev].slice(0, 20));
                }
            };

            ws.onclose = () => {
                setIsConnected(false);
                // Attempt to reconnect every 2 seconds
                if (!retryInterval) {
                    retryInterval = setInterval(connect, 2000);
                }
            };

            ws.onerror = () => {
                ws.close();
            };
        };

        connect();

        return () => {
            if (ws) ws.close();
            if (retryInterval) clearInterval(retryInterval);
        };
    }, []);

    return { ...telemetry, isConnected, logs };
};
