'use client';
import { motion } from 'framer-motion';

export default function GlassCard({ children, className = '', hover = false }) {
  const base = 'rounded-2xl border border-white/10 bg-white/5 p-6 shadow-xl backdrop-blur-md';
  if (hover) {
    return (
      <motion.div whileHover={{ y: -4, scale: 1.01 }} transition={{ duration: 0.2 }} className={`${base} ${className}`}>
        {children}
      </motion.div>
    );
  }

  return <div className={`${base} ${className}`}>{children}</div>;
}
