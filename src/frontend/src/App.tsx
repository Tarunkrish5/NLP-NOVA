import { useState, useEffect } from 'react';
import {
  Heart,
  Activity,
  Layers,
  Search,
  Settings,
  User,
  Mic,
  Maximize2,
  Minimize2,
  RefreshCw,
  AlertTriangle,
  XCircle,
  Terminal,
  Bell
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import { HeartModel } from './components/HeartModel';
import { useTelemetry } from './hooks/useTelemetry';
import { useVoiceControl } from './hooks/useVoiceControl';
import { useMediaPipe } from './hooks/useMediaPipe';
import { useToast } from './hooks/useToast';
import { AppSidebar } from './components/AppSidebar.tsx';

// --- Sub-components ---
const MetricCard = ({ label, value, unit, icon: Icon, colorClass, animationDelay = 0 }: any) => {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    let start = 0;
    const end = parseInt(value);
    if (isNaN(end) || start === end) return;

    let totalDuration = 2000;
    let incrementTime = Math.max(10, totalDuration / end);

    let timer = setInterval(() => {
      start += 1;
      setDisplayValue(start);
      if (start >= end) clearInterval(timer);
    }, incrementTime);

    return () => clearInterval(timer);
  }, [value]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: animationDelay }}
      className="glass-panel p-4 rounded-xl flex flex-col gap-2 relative overflow-hidden group"
    >
      <div className={`absolute top-0 right-0 w-24 h-24 -mr-8 -mt-8 rounded-full opacity-5 ${colorClass}`} />
      <div className="flex justify-between items-center z-10">
        <span className="text-xs font-semibold text-white/50 tracking-wider uppercase">{label}</span>
        <Icon className={`w-4 h-4 ${colorClass.replace('bg-', 'text-')}`} />
      </div>
      <div className="flex items-baseline gap-1 z-10">
        <span className="text-3xl font-bold tracking-tighter">
          {displayValue}
        </span>
        <span className={`text-[10px] font-bold ${colorClass.replace('bg-', 'text-')}`}>{unit}</span>
      </div>
      <div className="w-full bg-white/5 h-1 rounded-full overflow-hidden mt-1">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${Math.min(100, (displayValue / (label.includes('O2') ? 100 : 150)) * 100)}%` }}
          className={`h-full ${colorClass}`}
        />
      </div>
    </motion.div>
  );
};

const LayerSwitch = ({ label, icon: Icon, active, onToggle, opacity, onOpacityChange }: any) => (
  <div className={`glass-panel p-3 rounded-xl flex flex-col gap-3 transition-all duration-300 ${active ? 'border-nova-blue/40 shadow-[0_0_20px_rgba(0,210,255,0.1)]' : 'opacity-60'}`}>
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-lg ${active ? 'bg-nova-blue text-background' : 'bg-white/5 text-white/80'}`}>
          <Icon className="w-5 h-5" />
        </div>
        <span className="font-semibold text-sm">{label}</span>
      </div>
      <button
        onClick={onToggle}
        className="w-10 h-5 rounded-full relative transition-colors bg-white/10"
      >
        <div className={`absolute inset-0 rounded-full transition-colors ${active ? 'bg-nova-blue' : 'bg-white/10'}`} />
        <motion.div
          animate={{ x: active ? 20 : 2 }}
          className="absolute top-1 left-0 w-3 h-3 bg-white rounded-full shadow-lg z-10"
        />
      </button>
    </div>
    {active && (
      <div className="px-1 space-y-2">
        <div className="flex justify-between text-[10px] text-white/40 uppercase">
          <span>Opacity</span>
          <span>{opacity}%</span>
        </div>
        <input
          type="range"
          value={opacity}
          onChange={(e) => onOpacityChange(Number(e.target.value))}
          className="w-full h-1 bg-white/10 rounded-full appearance-none accent-nova-blue cursor-pointer"
        />
      </div>
    )}
  </div>
);

function App() {
  const { videoRef, canvasRef, gesture, coords } = useMediaPipe();
  const vitals = useTelemetry();
  const { toasts, showToast, removeToast } = useToast();

  const [activeLayers, setActiveLayers] = useState({
    vascular: true,
    skeletal: false,
    muscular: false,
    nervous: false
  });
  const [opacities, setOpacities] = useState<any>({
    vascular: 57,
    skeletal: 80,
    muscular: 40,
    nervous: 100
  });

  const [showMRI, setShowMRI] = useState(false);
  const [controlMode, setControlMode] = useState<'telemetry' | 'mri'>('telemetry');

  // Sync action to backend
  const syncAction = async (action: string, text?: string) => {
    try {
      await fetch('http://localhost:8000/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, text })
      });
    } catch (e) {
      console.warn("Failed to sync action to backend");
    }
  };

  const setVascularOpacity = (value: number) => {
    setOpacities((prev: any) => ({ ...prev, vascular: value }));
  };

  const handleGesture = (gesture: string) => {
    switch (gesture) {
      case 'PINCH':
        setVascularOpacity(50);
        syncAction('GESTURE_PINCH', 'Layer Adjust');
        break;
      case 'PALM_OPEN':
        setVascularOpacity(100);
        syncAction('GESTURE_PALM', 'Layer Reset');
        break;
    }
  };

  const handleVoiceCommand = (command: string) => {
    switch (command) {
      case 'TOGGLE_MRI':
        setControlMode(prev => prev === 'mri' ? 'telemetry' : 'mri');
        syncAction('VOICE_COMMAND', 'Toggle MRI View');
        break;
      case 'RESET_VIEW':
        setControlMode('telemetry');
        syncAction('VOICE_COMMAND', 'System Reset');
        break;
    }
  };

  useEffect(() => {
    setShowMRI(controlMode === 'mri');
  }, [controlMode]);

  useEffect(() => {
    if (gesture !== 'IDLE') {
      handleGesture(gesture);
    }
  }, [gesture]);

  const { isListening } = useVoiceControl(handleVoiceCommand);

  // Surgical Safety Monitoring
  useEffect(() => {
    if (vitals.status === "Critical" || vitals.hr > 120) {
      showToast("Critical Patient Status Detected", "ERROR");
    }
  }, [vitals.hr, vitals.status]);

  return (
    <div className="h-screen w-screen bg-background text-white flex flex-col overflow-hidden font-inter selection:bg-nova-blue/30">
      {/* Toast System */}
      <div className="fixed top-24 right-8 z-[100] flex flex-col gap-4 pointer-events-none">
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, x: 100, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 100, scale: 0.9 }}
              className={`pointer-events-auto glass-panel p-4 rounded-xl border-l-4 flex items-center gap-4 min-w-[300px] shadow-2xl ${toast.type === 'ERROR' ? 'border-l-nova-red bg-nova-red/10' :
                toast.type === 'WARNING' ? 'border-l-amber-500 bg-amber-500/10' :
                  'border-l-nova-blue bg-nova-blue/10'
                }`}
            >
              {toast.type === 'ERROR' && <XCircle className="text-nova-red w-6 h-6" />}
              {toast.type === 'WARNING' && <AlertTriangle className="text-amber-500 w-6 h-6" />}
              {toast.type === 'INFO' && <Bell className="text-nova-blue w-6 h-6" />}
              <div className="flex-1">
                <h4 className="text-[10px] font-black uppercase tracking-widest text-white/40">Surgical Safety Alert</h4>
                <p className="text-xs font-bold">{toast.message}</p>
              </div>
              <button onClick={() => removeToast(toast.id)} className="text-white/20 hover:text-white">
                <Maximize2 className="w-4 h-4 rotate-45" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Background Grid/Effect */}
      <div className="fixed inset-0 pointer-events-none opacity-20">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,#00d2ff_0,transparent_50%)] opacity-10" />
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10" />
        <div className="absolute top-0 bottom-0 left-1/2 w-[1px] bg-nova-blue/20" />
        <div className="absolute left-0 right-0 top-1/2 h-[1px] bg-nova-blue/20" />
      </div>

      {/* Hidden processing elements for MediaPipe */}
      <video ref={videoRef} className="hidden" playsInline muted />
      <canvas ref={canvasRef} className="fixed top-4 right-4 w-48 h-36 glass-panel rounded-lg z-50 border-white/20 opacity-40 hover:opacity-100 transition-opacity" />

      {/* Header */}
      <header className="flex items-center justify-between px-8 py-4 z-50 glass-panel border-t-0 border-x-0">
        <div className="flex items-center gap-4">
          <div className="bg-nova-blue p-2 rounded-lg shadow-[0_0_15px_rgba(0,210,255,0.4)]">
            <Activity className="text-background w-6 h-6" />
          </div>
          <div>
            <h1 className="font-orbitron font-black text-xl tracking-wider">NOVA SURGICAL COCKPIT</h1>
            <p className="text-[10px] text-nova-blue font-bold tracking-[0.2em] opacity-80">SESSION ID: #8821-X</p>
          </div>
        </div>

        <nav className="flex items-center gap-12">
          {['Dashboard', 'Patient Vitals', 'Imaging', 'Settings'].map((item, i: number) => (
            <button key={item} className={`font-orbitron text-xs font-bold tracking-widest uppercase relative transition-all hover:text-nova-blue ${i === 2 ? 'text-nova-blue' : 'text-white/60'}`}>
              {item}
              {i === 2 && <motion.div layoutId="nav-underline" className="absolute -bottom-6 left-0 right-0 h-1 bg-nova-blue shadow-[0_0_10px_rgba(0,210,255,0.5)]" />}
            </button>
          ))}
        </nav>

        <div className="flex items-center gap-6">
          <Settings className="w-5 h-5 text-white/40 hover:text-white cursor-pointer transition-colors" />
          <User className="w-5 h-5 text-white/40 hover:text-white cursor-pointer transition-colors" />
        </div>
      </header>

      <main className="flex-1 flex overflow-hidden relative">
        <AppSidebar />
        <div className="flex-1 flex overflow-hidden p-8 gap-8">
          {/* Left Sidebar: Layer Control */}
          <motion.aside
            initial={{ x: -100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            className="w-80 flex flex-col gap-8 z-40"
          >
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-white/50 mb-6">
                <Layers className="w-4 h-4" />
                <h2 className="font-orbitron text-xs font-black tracking-widest uppercase">Layer Control</h2>
              </div>

              <LayerSwitch
                label="Skeletal"
                icon={Activity}
                active={activeLayers.skeletal}
                onToggle={() => setActiveLayers((p: any) => ({ ...p, skeletal: !p.skeletal }))}
                opacity={opacities.skeletal}
                onOpacityChange={(v: number) => setOpacities((p: any) => ({ ...p, skeletal: v }))}
              />
              <LayerSwitch
                label="Vascular"
                icon={Heart}
                active={activeLayers.vascular}
                onToggle={() => setActiveLayers((p: any) => ({ ...p, vascular: !p.vascular }))}
                opacity={opacities.vascular}
                onOpacityChange={(v: number) => setOpacities((p: any) => ({ ...p, vascular: v }))}
              />
              <LayerSwitch
                label="Muscular"
                icon={Activity}
                active={activeLayers.muscular}
                onToggle={() => setActiveLayers((p: any) => ({ ...p, muscular: !p.muscular }))}
                opacity={opacities.muscular}
                onOpacityChange={(v: number) => setOpacities((p: any) => ({ ...p, muscular: v }))}
              />
              <LayerSwitch
                label="Nervous"
                icon={Activity}
                active={activeLayers.nervous}
                onToggle={() => setActiveLayers((p: any) => ({ ...p, nervous: !p.nervous }))}
                opacity={opacities.nervous}
                onOpacityChange={(v: number) => setOpacities((p: any) => ({ ...p, nervous: v }))}
              />
            </div>

            <div className="mt-auto">
              <div className="flex items-center gap-2 text-white/50 mb-4">
                <h2 className="font-orbitron text-xs font-black tracking-widest uppercase">Active Visualization</h2>
              </div>
              <div className="glass-panel p-4 rounded-xl border-l-4 border-l-nova-blue bg-nova-blue/5">
                <p className="text-xs leading-relaxed text-white/80 font-medium italic">
                  "Semi-transparent heart model with highlighted coronary arteries. Current view: <span className="text-nova-blue font-bold">Anterior</span>."
                </p>
              </div>
            </div>
          </motion.aside>

          {/* Center: 3D Viewport */}
          <section className="flex-1 relative flex flex-col items-center justify-center">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className={`absolute top-0 flex items-center gap-4 py-3 px-6 rounded-full glass-panel border-nova-blue/20 z-10 ${isListening ? 'border-nova-blue/40 shadow-[0_0_30px_rgba(0,210,255,0.1)]' : ''}`}
            >
              <div className="relative">
                <Mic className={`w-5 h-5 ${isListening ? 'text-nova-blue animate-pulse' : 'text-white/20'}`} />
                {isListening && <div className="absolute inset-0 animate-ping bg-nova-blue rounded-full opacity-40 scale-150" />}
              </div>
              <div className="text-left">
                <p className="text-[8px] font-black uppercase tracking-[0.3em] text-nova-blue">{isListening ? 'Voice Active' : 'Voice Standby'}</p>
                <p className="text-xs font-bold italic text-white/80 whitespace-nowrap">"Nova, {showMRI ? 'Hide' : 'Show'} MRI View"</p>
              </div>
            </motion.div>

            {/* 3D Canvas Viewport */}
            <div className="w-full h-full flex items-center justify-center relative">
              <Canvas className="w-full h-full">
                <PerspectiveCamera makeDefault position={[0, 0, 8]} />
                <OrbitControls
                  enableZoom={gesture === 'PALM_OPEN'}
                  enableRotate={gesture === 'PINCH'}
                  rotateSpeed={0.5}
                />
                <ambientLight intensity={0.2} />
                <pointLight
                  position={[(coords.x - 0.5) * 20, -(coords.y - 0.5) * 20, 10]}
                  intensity={1.5}
                  color="#00d2ff"
                />
                <spotLight position={[-10, 10, 10]} angle={0.15} penumbra={1} intensity={1} color="#ff3e3e" />
                <HeartModel activeLayers={activeLayers} opacities={opacities} />
              </Canvas>

              <AnimatePresence>
                {showMRI && (
                  <motion.div
                    initial={{ opacity: 0, scale: 1.1 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="absolute inset-0 z-30 pointer-events-none flex items-center justify-center p-12"
                  >
                    <div className="w-full h-full border-2 border-nova-blue/30 rounded-3xl bg-blue-900/10 backdrop-blur-md relative overflow-hidden">
                      <div className="absolute inset-0 bg-[repeating-linear-gradient(0deg,transparent,transparent_40px,rgba(0,210,255,0.05)_41px)]" />
                      <div className="absolute top-8 left-8 flex items-center gap-3">
                        <Search className="w-5 h-5 text-nova-blue" />
                        <span className="font-orbitron font-black text-sm tracking-widest text-nova-blue">MRI OVERLAY ACTIVE</span>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="absolute pointer-events-none z-20 flex flex-col items-center">
                <div className="mt-72 px-4 py-2 border border-white/5 rounded backdrop-blur-sm bg-black/20">
                  <span className="text-[10px] font-orbitron tracking-widest text-nova-blue animate-pulse uppercase">Neural Stream Active</span>
                </div>
              </div>

              {/* Viewport Tools */}
              <div className="absolute bottom-10 right-0 flex flex-col gap-4 z-30">
                {[Maximize2, Minimize2, RefreshCw].map((Icon, i) => (
                  <button key={i} className="glass-panel p-3 rounded-xl nova-button text-white/60 hover:text-nova-blue cursor-pointer group">
                    <Icon className="w-5 h-5" />
                  </button>
                ))}
              </div>

              {/* Gesture Badge */}
              <AnimatePresence>
                {gesture !== 'IDLE' && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.5 }}
                    className="absolute bottom-10 left-1/2 -translate-x-1/2 glass-panel px-4 py-2 rounded-full border-nova-blue/40 text-[10px] font-bold text-nova-blue uppercase tracking-widest z-40"
                  >
                    Gesture: {gesture}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </section>

          {/* Right Sidebar: MRI & Event Log */}
          <motion.aside
            initial={{ x: 100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            className="w-80 flex flex-col gap-8 z-40"
          >
            <div className="space-y-6 flex-1 flex flex-col min-h-0">
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-2 text-white/50">
                  <Search className="w-4 h-4" />
                  <h2 className="font-orbitron text-xs font-black tracking-widest uppercase">MRI Slice View</h2>
                </div>
                <div className="flex items-center gap-2 px-2 py-1 bg-nova-blue/10 rounded border border-nova-blue/20">
                  <div className="w-1.5 h-1.5 bg-nova-blue rounded-full animate-pulse" />
                  <span className="text-[8px] font-black text-nova-blue uppercase tracking-widest">Live</span>
                </div>
              </div>

              <div className="space-y-4">
                {['Axial', 'Sagittal', 'Coronal'].map((view) => (
                  <div key={view} className="glass-panel aspect-video rounded-xl relative overflow-hidden group cursor-pointer border-white/5 hover:border-nova-blue/30 transition-all">
                    <div className="absolute inset-0 bg-blue-900/5 group-hover:bg-blue-900/10 transition-colors" />
                    <div className="absolute inset-0 opacity-10 mix-blend-overlay pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/stardust.png')]" />
                    <motion.div
                      animate={{ top: ['0%', '100%', '0%'] }}
                      transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                      className="absolute left-0 right-0 h-[1px] bg-nova-blue/30 z-10"
                    />
                    <div className="absolute top-3 left-3 px-2 py-1 glass-panel text-[10px] font-black uppercase tracking-widest z-20 border-nova-blue/20">{view}</div>
                    <div className="absolute bottom-3 right-3 text-[10px] font-mono text-white/30 z-20">Z: {(Math.random() * 20).toFixed(1)}mm</div>
                    <div className="absolute inset-0 pointer-events-none opacity-20 group-hover:opacity-40 transition-opacity">
                      <div className="w-full h-full bg-[repeating-linear-gradient(0deg,transparent,transparent_15px,rgba(0,210,255,0.03)_16px),repeating-linear-gradient(90deg,transparent,transparent_15px,rgba(0,210,255,0.03)_16px)]" />
                    </div>
                  </div>
                ))}
              </div>

              {/* Event Log */}
              <div className="flex-1 glass-panel rounded-2xl p-6 flex flex-col min-h-0 bg-black/20">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Terminal className="w-4 h-4 text-nova-blue" />
                    <h3 className="text-xs font-black uppercase tracking-widest">Surgical Event Log</h3>
                  </div>
                  <div className="w-2 h-2 bg-nova-blue rounded-full animate-pulse" />
                </div>

                <div className="flex-1 overflow-y-auto space-y-3 font-mono text-[10px] pr-2">
                  {vitals.logs?.length > 0 ? vitals.logs.map((log: any, i: number) => (
                    <div key={i} className="flex gap-3 text-white/40 border-l border-nova-blue/20 pl-3 py-1">
                      <span className="text-nova-blue/60 tabular-nums shrink-0">{log.timestamp}</span>
                      <span className="text-white/80 uppercase font-black">{log.action}:</span>
                      <span className="truncate">{log.payload}</span>
                    </div>
                  )) : (
                    <div className="h-full flex items-center justify-center text-white/20 italic text-center px-4">
                      Waiting for tactical events...
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="bg-black/40 p-6 rounded-2xl border border-white/5 space-y-6">
              <div className="flex items-center gap-2 text-white/50 mb-2">
                <Activity className="w-4 h-4" />
                <h2 className="font-orbitron text-xs font-black tracking-widest uppercase">Patient Metrics</h2>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <MetricCard
                  label="Heart Rate"
                  value={vitals.hr}
                  unit="BPM"
                  icon={Heart}
                  colorClass="bg-nova-blue"
                  animationDelay={0.4}
                />
                <MetricCard
                  label="O2 Sat"
                  value={vitals.o2}
                  unit="%"
                  icon={Activity}
                  colorClass="bg-emerald-500"
                  animationDelay={0.5}
                />
              </div>
            </div>
          </motion.aside>
        </div>
      </main>

      {/* Footer Info */}
      <footer className="px-8 py-3 z-50 glass-panel border-b-0 border-x-0 flex items-center justify-between opacity-50 text-[10px] font-bold tracking-[0.2em] uppercase">
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${vitals.isConnected ? 'bg-emerald-500' : 'bg-nova-red animate-pulse'}`} />
            <span>Live Telemetry: {vitals.isConnected ? 'Stable' : 'Lost'}</span>
          </div>
          <span>Server: US-EAST-2</span>
        </div>
        <div className="flex items-center gap-8">
          <span>Latency: {vitals.isConnected ? '12ms' : '--'}</span>
          <span>GPU: 34%</span>
          <span className={`${vitals.isConnected ? 'text-nova-blue' : 'text-white/20'} flex items-center gap-1 transition-colors`}>
            <Activity className={`w-3 h-3 ${vitals.isConnected ? 'animate-[pulse_1s_infinite]' : ''}`} />
            {vitals.isConnected ? 'Synced' : 'Offline'}
          </span>
        </div>
      </footer>
    </div>
  );
}

export default App;
