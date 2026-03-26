'use client';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ShieldCheck, Star, Wallet2 } from 'lucide-react';

export default function MentorCard({ mentor, onBook }) {
  const router = useRouter();
  const levelColors = {
    community: 'bg-slate-700/60 text-slate-200',
    verified: 'bg-cyan-500/20 text-cyan-200',
    expert: 'bg-indigo-500/20 text-indigo-200',
  };

  return (
    <motion.div whileHover={{ scale: 1.03 }} transition={{ duration: 0.2 }} className="glass-card p-6">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="text-lg font-semibold text-slate-100">{mentor.name}</h3>
          <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium mt-1 ${levelColors[mentor.mentorLevel] || levelColors.community}`}>
            {mentor.mentorLevel?.charAt(0).toUpperCase() + mentor.mentorLevel?.slice(1)} Mentor
          </span>
        </div>
        {mentor.matchScore !== undefined && (
          <div className="text-right">
            <p className="text-2xl font-bold text-cyan-300">{Math.round(mentor.matchScore * 100)}%</p>
            <p className="text-xs text-slate-400">match</p>
          </div>
        )}
      </div>
      <div className="flex flex-wrap gap-1.5 mb-3">
        {mentor.skills?.slice(0, 5).map((s, i) => (
          <span key={i} className="px-2 py-0.5 bg-indigo-500/20 text-indigo-200 rounded text-xs font-medium">
            {typeof s === 'string' ? s : s.name}
          </span>
        ))}
      </div>
      <div className="flex items-center gap-4 text-sm text-slate-300 mb-4">
        <span className="inline-flex items-center gap-1"><Star className="h-4 w-4 text-amber-300" /> {mentor.averageRating?.toFixed(1)}</span>
        <span>{mentor.sessionsCompleted} sessions</span>
        <span className="inline-flex items-center gap-1"><ShieldCheck className="h-4 w-4 text-emerald-300" /> {mentor.reputationScore?.toFixed(1)}</span>
      </div>
      <div className="flex gap-2">
        <button onClick={() => router.push(`/profile/${mentor._id}`)}
          className="flex-1 px-4 py-2 text-sm border border-slate-700 rounded-lg hover:bg-slate-800 transition-colors text-slate-200">
          View Profile
        </button>
        <motion.button whileTap={{ scale: 0.96 }} onClick={() => onBook && onBook(mentor)}
          className="flex-1 inline-flex items-center justify-center gap-1 px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-500 transition-colors">
          <Wallet2 className="h-4 w-4" />
          Book Session
        </motion.button>
      </div>
    </motion.div>
  );
}
