'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Sidebar from '@/components/Sidebar';

export default function TalentPage() {
  const { user, token, loading } = useAuth();
  const router = useRouter();
  const [talent, setTalent] = useState([]);
  const [skillDist, setSkillDist] = useState([]);
  const [skill, setSkill] = useState('');
  const [searching, setSearching] = useState(false);

  useEffect(() => { if (!loading && !user) router.push('/login'); }, [user, loading, router]);

  const fetchTalent = async (s) => {
    if (!token) return;
    setSearching(true);
    try {
      const url = s ? `/api/talent?skill=${encodeURIComponent(s)}` : '/api/talent';
      const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      setTalent(data.talent || []);
      setSkillDist(data.skillDistribution || []);
    } catch {} finally { setSearching(false); }
  };

  useEffect(() => { if (token && (user?.role === 'company' || user?.role === 'admin')) fetchTalent(''); }, [token, user]);

  if (loading || !user) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div></div>;

  if (user.role !== 'company' && user.role !== 'admin') {
    return (
      <div className="min-h-screen bg-gray-50">
        <Sidebar />
        <main className="ml-64 p-8">
          <div className="bg-white rounded-xl border border-gray-100 p-12 text-center">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Talent Intelligence</h2>
            <p className="text-gray-500 mb-4">This dashboard is available for company accounts.</p>
            <p className="text-sm text-gray-400">Contact us to upgrade your account for recruiter access.</p>
          </div>
        </main>
      </div>
    );
  }

  const levelColors = { community: 'bg-gray-100 text-gray-700', verified: 'bg-blue-100 text-blue-700', expert: 'bg-purple-100 text-purple-700' };

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      <main className="ml-64 p-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Talent Intelligence</h1>
        <p className="text-gray-500 mb-6">Discover top-performing mentors and skill leaders</p>
        <div className="flex gap-3 mb-6">
          <input type="text" value={skill} onChange={e => setSkill(e.target.value)} placeholder="Filter by skill..."
            onKeyDown={e => e.key === 'Enter' && fetchTalent(skill)}
            className="flex-1 px-4 py-2.5 rounded-lg border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none text-sm" />
          <button onClick={() => fetchTalent(skill)} disabled={searching}
            className="px-6 py-2.5 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50">
            {searching ? 'Searching...' : 'Search'}
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Top Performers</h3>
            {talent.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-2 px-3 font-medium text-gray-500">#</th>
                      <th className="text-left py-2 px-3 font-medium text-gray-500">Name</th>
                      <th className="text-left py-2 px-3 font-medium text-gray-500">Sessions</th>
                      <th className="text-left py-2 px-3 font-medium text-gray-500">Avg Rating</th>
                      <th className="text-left py-2 px-3 font-medium text-gray-500">Completion</th>
                      <th className="text-left py-2 px-3 font-medium text-gray-500">Consistency</th>
                      <th className="text-left py-2 px-3 font-medium text-gray-500">Level</th>
                    </tr>
                  </thead>
                  <tbody>
                    {talent.map((t, i) => (
                      <tr key={t._id} className="border-b border-gray-50 hover:bg-gray-50">
                        <td className="py-2 px-3 font-bold text-gray-400">{i + 1}</td>
                        <td className="py-2 px-3 font-medium">{t.name}</td>
                        <td className="py-2 px-3">{t.sessionsTaught}</td>
                        <td className="py-2 px-3">★ {t.averageRating?.toFixed(1)}</td>
                        <td className="py-2 px-3">{t.completionRate}%</td>
                        <td className="py-2 px-3">
                          <div className="flex items-center gap-2">
                            <div className="w-16 bg-gray-100 rounded-full h-1.5">
                              <div className="bg-indigo-500 h-1.5 rounded-full" style={{ width: `${t.skillConsistency}%` }}></div>
                            </div>
                            <span className="text-xs">{t.skillConsistency}%</span>
                          </div>
                        </td>
                        <td className="py-2 px-3">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${levelColors[t.mentorLevel]}`}>{t.mentorLevel}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : <p className="text-gray-400 text-sm">No talent data available</p>}
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Skill Distribution</h3>
            {skillDist.length > 0 ? (
              <div className="space-y-3">
                {skillDist.map((s, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <span className="text-sm text-gray-700 truncate flex-1">{s._id}</span>
                    <div className="flex items-center gap-2 ml-2">
                      <div className="w-20 bg-gray-100 rounded-full h-2">
                        <div className="bg-indigo-500 h-2 rounded-full" style={{ width: `${Math.min((s.count / (skillDist[0]?.count || 1)) * 100, 100)}%` }}></div>
                      </div>
                      <span className="text-xs text-gray-500 w-6 text-right">{s.count}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : <p className="text-gray-400 text-sm">No skill data</p>}
          </div>
        </div>
      </main>
    </div>
  );
}
