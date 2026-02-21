import { motion } from 'framer-motion';
import {
    Dna,
    ShieldCheck,
    Activity,
    Settings,
    History,
    AlertCircle
} from 'lucide-react';

export const AppSidebar = () => {
    return (
        <motion.div
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            className="w-16 h-full glass-panel border-r-0 border-y-0 flex flex-col items-center py-8 gap-8 z-50"
        >
            <div className="w-10 h-10 bg-nova-blue/20 rounded-xl flex items-center justify-center border border-nova-blue/30 shadow-[0_0_15px_rgba(0,210,255,0.1)]">
                <Dna className="w-6 h-6 text-nova-blue" />
            </div>

            <div className="flex-1 flex flex-col gap-6 w-full items-center">
                {[
                    { icon: Activity, label: 'Live' },
                    { icon: ShieldCheck, label: 'Safety' },
                    { icon: History, label: 'Logs' },
                    { icon: AlertCircle, label: 'Alerts' },
                ].map((item, i) => (
                    <div
                        key={i}
                        className="group relative cursor-pointer"
                    >
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white/40 hover:text-nova-blue hover:bg-nova-blue/10 transition-all border border-transparent hover:border-nova-blue/20">
                            <item.icon className="w-5 h-5" />
                        </div>

                        {/* Tooltip */}
                        <div className="absolute left-full ml-4 px-2 py-1 bg-black/80 border border-white/5 rounded text-[8px] font-black uppercase tracking-widest text-nova-blue opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-[100]">
                            {item.label}
                        </div>
                    </div>
                ))}
            </div>

            <div className="mt-auto">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white/20 hover:text-white cursor-pointer transition-colors">
                    <Settings className="w-5 h-5" />
                </div>
            </div>
        </motion.div>
    );
};
