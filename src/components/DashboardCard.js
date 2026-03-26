'use client';
import { motion } from 'framer-motion';

export default function DashboardCard({ title, value, subtitle, icon, color = 'indigo', isLoading = false }) {
  const colors = {
    indigo: 'bg-indigo-500/20 text-indigo-200',
    green: 'bg-emerald-500/20 text-emerald-200',
    blue: 'bg-cyan-500/20 text-cyan-200',
    amber: 'bg-amber-500/20 text-amber-200',
    rose: 'bg-rose-500/20 text-rose-200',
  };

  if (isLoading) {
    return (
      <div className="glass-card p-6 animate-pulse">
        <div className="flex items-center justify-between mb-4">
          <div className="h-4 bg-slate-700 rounded w-24"></div>
          <div className={`w-10 h-10 rounded-lg ${colors[color]}`}></div>
        </div>
        <div className="h-8 bg-slate-700 rounded w-16 mb-2"></div>
        <div className="h-4 bg-slate-700 rounded w-20"></div>
      </div>
    );
  }

  return (
    <motion.div whileHover={{ scale: 1.03 }} transition={{ duration: 0.2 }} className="glass-card p-6">
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm font-medium text-slate-400">{title}</p>
        {icon && <span className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg ${colors[color]}`}>{icon}</span>}
      </div>
      <p className="text-3xl font-bold text-slate-100">{value}</p>
      {subtitle && <p className="text-sm text-slate-400 mt-1">{subtitle}</p>}
    </motion.div>
  );
}
