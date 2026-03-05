'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Sidebar from '@/components/Sidebar';
import LeaderboardTable from '@/components/LeaderboardTable';

export default function LeaderboardPage() {
  const { user, token, loading } = useAuth();
  const router = useRouter();
  const [leaders, setLeaders] = useState([]);
  const [skill, setSkill] = useState('');
  const [searching, setSearching] = useState(false);

  useEffect(() => { if (!loading && !user) router.push('/login'); }, [user, loading, router]);

  const fetchLeaderboard = async (s) => {
    if (!token) return;
    setSearching(true);
    try {
      const url = s ? `/api/leaderboard?skill=${encodeURIComponent(s)}` : '/api/leaderboard';
      const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      setLeaders(data.leaders || []);
    } catch {} finally { setSearching(false); }
  };

  useEffect(() => { if (token) fetchLeaderboard(''); }, [token]);

  if (loading || !user) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div></div>;

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      <main className="ml-64 p-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Skill Leaderboard</h1>
        <div className="flex gap-3 mb-6">
          <input type="text" value={skill} onChange={e => setSkill(e.target.value)} placeholder="Filter by skill (e.g. Python, React...)"
            onKeyDown={e => e.key === 'Enter' && fetchLeaderboard(skill)}
            className="flex-1 px-4 py-2.5 rounded-lg border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none text-sm" />
          <button onClick={() => fetchLeaderboard(skill)} disabled={searching}
            className="px-6 py-2.5 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50">
            {searching ? 'Loading...' : 'Filter'}
          </button>
          <button onClick={() => { setSkill(''); fetchLeaderboard(''); }}
            className="px-4 py-2.5 border border-gray-200 rounded-lg text-sm hover:bg-gray-50">All</button>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <LeaderboardTable leaders={leaders} />
        </div>
      </main>
    </div>
  );
}
