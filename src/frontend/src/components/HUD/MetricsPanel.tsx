import { motion } from 'framer-motion';
import { Heart, Activity } from 'lucide-react';

const MetricCard = ({ label, value, unit, icon: Icon, colorClass, animationDelay = 0 }: any) => {
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
                    {value}
                </span>
                <span className={`text-[10px] font-bold ${colorClass.replace('bg-', 'text-')}`}>{unit}</span>
            </div>
            <div className="w-full bg-white/5 h-1 rounded-full overflow-hidden mt-1">
                <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(100, (Number(value) / (label.includes('O2') ? 100 : 150)) * 100)}%` }}
                    className={`h-full ${colorClass}`}
                />
            </div>
        </motion.div>
    );
};

export const MetricsPanel = ({ vitals }: any) => {
    return (
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
    );
};
