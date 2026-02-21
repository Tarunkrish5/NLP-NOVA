import { motion } from 'framer-motion';
import { ShieldAlert } from 'lucide-react';

export const SafetyOverlay = ({ isConnected }: { isConnected: boolean }) => {
    if (isConnected) return null;

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 z-[200] pointer-events-none"
        >
            {/* Red Border Flash */}
            <div className="absolute inset-0 border-[12px] border-nova-red/40 animate-pulse" />

            {/* Banner */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-6">
                <div className="bg-nova-red p-6 rounded-full shadow-[0_0_50px_rgba(255,62,62,0.5)] animate-bounce">
                    <ShieldAlert className="w-16 h-16 text-white" />
                </div>
                <div className="glass-panel px-12 py-6 rounded-2xl border-nova-red/40 backdrop-blur-2xl">
                    <h2 className="text-4xl font-orbitron font-black tracking-tighter text-nova-red mb-2 text-center">SYSTEM OFFLINE</h2>
                    <p className="text-white/60 font-bold uppercase tracking-[0.5em] text-center text-xs">Revert to Manual Procedures Immediately</p>
                </div>
            </div>

            {/* Screen tint */}
            <div className="absolute inset-0 bg-nova-red/5" />
        </motion.div>
    );
};
