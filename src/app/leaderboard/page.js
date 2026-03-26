'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import { motion } from 'framer-motion';
import { Filter, Trophy } from 'lucide-react';
import Sidebar from '@/components/Sidebar';
import LeaderboardTable from '@/components/LeaderboardTable';
import GlassCard from '@/components/ui/GlassCard';

const SKILL_FILTERS = ['Python', 'Machine Learning', 'UI Design', 'Data Science', 'React', 'JavaScript', 'Java', 'DevOps'];

export default function LeaderboardPage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const [leaders, setLeaders] = useState([]);
  const [skill, setSkill] = useState('');
  const [searching, setSearching] = useState(false);
  const [userBadgesMap, setUserBadgesMap] = useState({});

  useEffect(() => { if (!isLoaded || !user) router.push('/login'); }, [user, isLoaded, router]);

  const fetchLeaderboard = async (s) => {
    
    setSearching(true);
    try {
      const url = s ? `/api/leaderboard?skill=${encodeURIComponent(s)}` : '/api/leaderboard';
      const res = await fetch(url);
      const data = await res.json();
      const leaderList = data.leaders || [];
      setLeaders(leaderList);

      // Fetch badges for each leader
      const badgeMap = {};
      for (const leader of leaderList) {
        try {
          const bRes = await fetch(`/api/badges?userId=${leader._id}`);
          const bData = await bRes.json();
          badgeMap[leader._id] = bData.userBadges || [];
        } catch { badgeMap[leader._id] = []; }
      }
      setUserBadgesMap(badgeMap);
    } catch {} finally { setSearching(false); }
  };

  useEffect(() => { if (isLoaded) fetchLeaderboard(''); }, [isLoaded]);

  const handleQuickFilter = (s) => {
    setSkill(s);
    fetchLeaderboard(s);
  };

  if (!isLoaded || !user) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div></div>;

  return (
    <div className="saas-shell">
      <Sidebar />
      <main className="saas-main">
        <h1 className="saas-heading mb-1 inline-flex items-center gap-2"><Trophy className="h-7 w-7 text-amber-300" /> Skill Leaderboard</h1>
        <p className="saas-subtext mb-6">Top mentors ranked by reputation, sessions, and verified skills</p>

        {/* Quick Skill Filters */}
        <div className="flex flex-wrap gap-2 mb-4">
          {SKILL_FILTERS.map(s => (
            <button key={s} onClick={() => handleQuickFilter(s)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                skill === s ? 'bg-indigo-600 text-white' : 'bg-slate-900 border border-slate-700 text-slate-300 hover:border-indigo-400 hover:text-indigo-300'
              }`}>
              {s}
            </button>
          ))}
        </div>

        <div className="flex gap-3 mb-6">
          <input type="text" value={skill} onChange={e => setSkill(e.target.value)} placeholder="Filter by skill (e.g. Python, React...)"
            onKeyDown={e => e.key === 'Enter' && fetchLeaderboard(skill)}
            className="flex-1 px-4 py-2.5 rounded-lg border border-slate-700 bg-slate-900 text-slate-100 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-300/20 outline-none text-sm" />
          <motion.button whileTap={{ scale: 0.96 }} onClick={() => fetchLeaderboard(skill)} disabled={searching}
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-500 disabled:opacity-50">
            <Filter className="h-4 w-4" />
            {searching ? 'Loading...' : 'Filter'}
          </motion.button>
          <button onClick={() => { setSkill(''); fetchLeaderboard(''); }}
            className="px-4 py-2.5 border border-slate-700 rounded-lg text-sm hover:bg-slate-800 text-slate-200">All</button>
        </div>

        <GlassCard>
          <LeaderboardTable leaders={leaders} userBadgesMap={userBadgesMap} />
        </GlassCard>
      </main>
    </div>
  );
}


