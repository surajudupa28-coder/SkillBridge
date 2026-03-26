'use client';
import { motion } from 'framer-motion';

export default function StatsCard({ title, value, subtitle, icon: Icon, accent = 'indigo' }) {
  const accents = {
    indigo: 'from-indigo-500/30 to-indigo-400/10 text-indigo-200 border-indigo-400/20',
    cyan: 'from-cyan-500/30 to-cyan-400/10 text-cyan-200 border-cyan-400/20',
    emerald: 'from-emerald-500/30 to-emerald-400/10 text-emerald-200 border-emerald-400/20',
    amber: 'from-amber-500/30 to-amber-400/10 text-amber-200 border-amber-400/20'
  };

  return (
    <motion.div whileHover={{ scale: 1.03 }} transition={{ duration: 0.2 }} className={`rounded-2xl border bg-gradient-to-br p-5 shadow-lg ${accents[accent] || accents.indigo}`}>
      <div className="mb-3 flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-300">{title}</p>
        {Icon ? <Icon className="h-5 w-5" /> : null}
      </div>
      <p className="text-3xl font-bold text-white">{value}</p>
      {subtitle ? <p className="mt-1 text-xs text-slate-300">{subtitle}</p> : null}
    </motion.div>
  );
}
