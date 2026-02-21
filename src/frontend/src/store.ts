import { create } from 'zustand';

interface NovaState {
    gesture: 'IDLE' | 'PINCH' | 'PALM_OPEN';
    coords: { x: number; y: number };
    viewMode: 'TELEMETRY' | 'MRI';
    rotation: number;
    zoom: number;
    isConnected: boolean;

    // Actions
    setGesture: (gesture: 'IDLE' | 'PINCH' | 'PALM_OPEN') => void;
    setCoords: (coords: { x: number; y: number }) => void;
    setViewMode: (mode: 'TELEMETRY' | 'MRI') => void;
    setRotation: (val: number | ((prev: number) => number)) => void;
    setZoom: (val: number) => void;
    setConnected: (status: boolean) => void;
}

export const useStore = create<NovaState>((set) => ({
    gesture: 'IDLE',
    coords: { x: 0.5, y: 0.5 },
    viewMode: 'TELEMETRY',
    rotation: 0,
    zoom: 1,
    isConnected: false,

    setGesture: (gesture) => set({ gesture }),
    setCoords: (coords) => set({ coords }),
    setViewMode: (viewMode) => set({ viewMode }),
    setRotation: (val) => set((state) => ({
        rotation: typeof val === 'function' ? val(state.rotation) : val
    })),
    setZoom: (zoom) => set({ zoom }),
    setConnected: (isConnected) => set({ isConnected }),
}));
