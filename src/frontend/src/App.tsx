import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Terminal,
  Camera,
  Cpu,
  Unplug
} from 'lucide-react';
import { useStore } from './store';

// Modular Components
import { Scene } from './components/Canvas/Scene';
import { AppSidebar } from './components/HUD/AppSidebar';
import { MetricsPanel } from './components/HUD/MetricsPanel';
import { SafetyOverlay } from './components/HUD/SafetyOverlay';

// Hooks
import { useTelemetry } from './hooks/useTelemetry';
import { useMediaPipe } from './hooks/useMediaPipe';
import { useVoiceControl } from './hooks/useVoiceControl';

const App = () => {
  // 1. Core State (Zustand)
  const gesture = useStore((state) => state.gesture);
  const isConnected = useStore((state) => state.isConnected);

  // 2. Local View State
  const [activeLayers] = useState({
    vascular: true,
    muscular: true,
    skeletal: true,
    nervous: true
  });

  const [opacities] = useState({
    vascular: 100,
    muscular: 40,
    skeletal: 30,
    nervous: 40
  });

  const [surgicalLog, setSurgicalLog] = useState<any[]>([]);
  const [isMriActive, setIsMriActive] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  // 3. Hardware Interfacing (Hooks)
  const vitals = useTelemetry();
  useMediaPipe(videoRef);

  useVoiceControl({
    onCommand: (action, data) => syncAction(action, data)
  });

  // 4. Action Synchronization
  const syncAction = async (action: string, text?: string) => {
    try {
      await fetch('http://localhost:8000/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, text })
      });
      refreshLogs();
    } catch (err) {
      console.error("Action Sync Failure:", err);
    }
  };

  const refreshLogs = async () => {
    try {
      const res = await fetch('http://localhost:8000/logs');
      const data = await res.json();
      setSurgicalLog(data);
    } catch (err) {
      console.error("Log Fetch Failure:", err);
    }
  };

  useEffect(() => {
    const interval = setInterval(refreshLogs, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex h-screen w-full bg-[#05070A] text-white overflow-hidden font-inter select-none">
      {/* 🛡️ Medical Compliance Overlay */}
      <SafetyOverlay isConnected={isConnected} />

      {/* Restored Layering Architecture */}
      <AppSidebar />

      <main className="flex-1 relative flex">
        <div className="flex-1 relative">
          <div className="absolute top-8 left-8 z-20">
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
              <h1 className="text-4xl font-orbitron font-black tracking-tighter text-white">
                NOVA <span className="text-nova-blue">S-1</span>
              </h1>
              <div className="flex items-center gap-2 text-white/40 text-[10px] font-bold tracking-[0.3em] uppercase mt-1">
                <Cpu className="w-3 h-3" />
                <span>Neuro-Surgical HUD Engine v2.5</span>
              </div>
            </motion.div>
          </div>

          {/* 3D Viewport Layer */}
          <div className="w-full h-full">
            <Scene activeLayers={activeLayers} opacities={opacities} />
          </div>

          {/* Interaction Feedback Overlay */}
          <div className="absolute bottom-12 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-4">
            <AnimatePresence mode="wait">
              <motion.div
                key={gesture}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="px-6 py-2 rounded-full border border-nova-blue/20 bg-nova-blue/5 backdrop-blur-md flex items-center gap-3"
              >
                <div className={`w-2 h-2 rounded-full ${gesture !== 'IDLE' ? 'bg-nova-blue animate-pulse shadow-[0_0_10px_rgba(0,210,255,1)]' : 'bg-white/20'}`} />
                <span className="text-[10px] font-black tracking-widest uppercase">
                  {gesture === 'IDLE' ? 'Awaiting Gesture...' : `Gesture: ${gesture}`}
                </span>
              </motion.div>
            </AnimatePresence>

            <div className="flex items-center gap-6 px-4 py-2 rounded-xl bg-black/40 border border-white/5 text-[9px] font-bold text-white/40 tracking-wider">
              <div className="flex items-center gap-2">
                <span className="px-1.5 py-0.5 rounded border border-white/10">PINCH</span>
                <span>ORBIT</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-1.5 py-0.5 rounded border border-white/10">PALM</span>
                <span>ZOOM</span>
              </div>
            </div>
          </div>

          {/* Hidden Video Input for Hand Tracking */}
          <video ref={videoRef} className="hidden" autoPlay playsInline muted />
        </div>

        {/* Right Analytics Sidebar */}
        <div className="w-[420px] bg-black/20 backdrop-blur-3xl border-l border-white/5 p-8 flex flex-col gap-8 z-30">
          <MetricsPanel vitals={vitals} />

          {/* MRI Slice Toggle Section */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2 text-white/50">
                <Camera className="w-4 h-4" />
                <span className="text-[10px] font-black tracking-widest uppercase">MRI Slice View</span>
              </div>
              <button
                onClick={() => setIsMriActive(!isMriActive)}
                className={`px-4 py-1.5 rounded-lg text-[9px] font-black transition-all ${isMriActive ? 'bg-nova-blue text-black' : 'bg-white/5 text-white/50 border border-white/10 hover:bg-white/10'}`}
              >
                {isMriActive ? 'DISABLE STREAM' : 'ACTIVATE MRI'}
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 h-48">
              {[1, 2].map((i) => (
                <div key={i} className="glass-panel overflow-hidden relative group">
                  {!isMriActive ? (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                      <Unplug className="w-6 h-6 text-white/10 group-hover:text-white/20 transition-colors" />
                    </div>
                  ) : (
                    <div className="absolute inset-0 bg-mri-gradient opacity-40 animate-noise" />
                  )}
                  <div className="absolute bottom-2 left-2 text-[8px] font-mono text-white/30">SLICE_{i * 42}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Surgical Event Log */}
          <div className="flex-1 min-h-0 flex flex-col">
            <div className="flex items-center gap-2 text-white/50 mb-4">
              <Terminal className="w-4 h-4" />
              <span className="text-[10px] font-black tracking-widest uppercase">Surgical Event Log</span>
            </div>
            <div className="flex-1 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
              {surgicalLog.map((log: any, i: number) => (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  key={i}
                  className="p-3 bg-white/5 rounded-lg border border-white/5 flex items-start gap-4 group"
                >
                  <span className="text-[8px] font-mono text-nova-blue font-bold px-1.5 py-0.5 rounded bg-nova-blue/10 min-w-[50px] text-center">{log.timestamp}</span>
                  <div className="flex-1">
                    <p className="text-[11px] font-bold text-white/80 group-hover:text-white transition-colors uppercase leading-tight">{log.action}</p>
                    <p className="text-[9px] text-white/30 font-medium tracking-wide mt-0.5">{log.payload}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </main>

      {/* Global HUD Layer Footer */}
      <div className="fixed bottom-0 left-0 right-0 h-10 bg-[#05070A] border-t border-white/5 flex items-center justify-between px-8 z-[100]">
        <div className="flex items-center gap-8 text-[9px] font-bold tracking-widest uppercase">
          <div className="flex items-center gap-2">
            <div className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-nova-blue shadow-[0_0_8px_rgba(0,210,255,0.8)]' : 'bg-nova-red animate-pulse'}`} />
            <span className={isConnected ? 'text-nova-blue/80' : 'text-nova-red'}>{isConnected ? 'Telemetry Stable' : 'Link Lost'}</span>
          </div>
          <div className="text-white/20">Latency: <span className="text-white/40">12ms</span></div>
          <div className="text-white/20">Protocol: <span className="text-white/40">WSS-Secure</span></div>
        </div>
        <div className="text-[10px] font-black text-white/30 tracking-[0.2em] font-orbitron">
          NEURAL-OPTIMIZED VIRTUAL ASSISTANT
        </div>
      </div>
    </div>
  );
};

export default App;
