'use client';
import { Star, Trophy } from 'lucide-react';

export default function LeaderboardTable({ leaders, userBadgesMap }) {
  if (!leaders || leaders.length === 0) {
    return <p className="text-gray-400 text-sm py-4">No leaders found.</p>;
  }

  const levelColors = {
    community: 'bg-slate-700/60 text-slate-200',
    verified: 'bg-cyan-500/20 text-cyan-200',
    expert: 'bg-indigo-500/20 text-indigo-200',
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-white/10">
            <th className="text-left py-3 px-4 font-medium text-slate-400">#</th>
            <th className="text-left py-3 px-4 font-medium text-slate-400">Name</th>
            <th className="text-left py-3 px-4 font-medium text-slate-400">Skills</th>
            <th className="text-left py-3 px-4 font-medium text-slate-400">Reputation</th>
            <th className="text-left py-3 px-4 font-medium text-slate-400">Rating</th>
            <th className="text-left py-3 px-4 font-medium text-slate-400">Sessions</th>
            <th className="text-left py-3 px-4 font-medium text-slate-400">Level</th>
            <th className="text-left py-3 px-4 font-medium text-slate-400">Badges</th>
          </tr>
        </thead>
        <tbody>
          {leaders.map((leader, i) => {
            const badges = userBadgesMap?.[leader._id] || [];
            return (
              <tr key={leader._id} className="border-b border-white/5 hover:bg-slate-900/40">
                <td className="py-3 px-4 font-bold text-slate-500 inline-flex items-center gap-1">{i < 3 ? <Trophy className="h-3.5 w-3.5 text-amber-300" /> : null}{i + 1}</td>
                <td className="py-3 px-4 font-medium text-slate-100">{leader.name}</td>
                <td className="py-3 px-4">
                  <div className="flex flex-wrap gap-1">
                    {leader.skills?.slice(0, 3).map((s, j) => (
                      <span key={j} className="px-1.5 py-0.5 bg-indigo-500/20 text-indigo-200 rounded text-xs">
                        {typeof s === 'string' ? s : s.name}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="py-3 px-4 font-semibold text-cyan-300">{leader.reputationScore?.toFixed(1)}</td>
                <td className="py-3 px-4 text-slate-200 inline-flex items-center gap-1"><Star className="h-4 w-4 text-amber-300" /> {leader.averageRating?.toFixed(1)}</td>
                <td className="py-3 px-4 text-slate-300">{leader.sessionsCompleted}</td>
                <td className="py-3 px-4">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${levelColors[leader.mentorLevel] || levelColors.community}`}>
                    {leader.mentorLevel}
                  </span>
                </td>
                <td className="py-3 px-4">
                  <div className="flex gap-0.5">
                    {badges.length > 0 ? badges.slice(0, 3).map((b, j) => (
                      <span key={j} title={b.badge?.badgeName || ''} className="text-base cursor-default">{b.badge?.icon || '\uD83C\uDFC5'}</span>
                    )) : <span className="text-gray-300 text-xs">-</span>}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
