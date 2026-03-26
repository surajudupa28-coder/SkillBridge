'use client';
import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Sidebar from '@/components/Sidebar';
import SkillTag from '@/components/SkillTag';

export default function UserProfilePage() {
  const { user: authUser, loading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const [profile, setProfile] = useState(null);
  const [mentorSessions, setMentorSessions] = useState([]);
  const [bookingOpen, setBookingOpen] = useState(false);
  const [bookingData, setBookingData] = useState({ scheduledAt: '', price: 30, skill: '' });
  const [bookingError, setBookingError] = useState('');

  useEffect(() => { if (!loading && !authUser) router.push('/login'); }, [authUser, loading, router]);

  useEffect(() => {
    if (authUser && params.id) {
      fetch(`/api/users/${params.id}`)
        .then(r => r.json())
        .then(data => { setProfile(data.user); setMentorSessions(data.mentorSessions || []); })
        .catch(() => {});
    }
  }, [authUser, params.id]);

  const bookSession = async () => {
    setBookingError('');
    if (!bookingData.scheduledAt) { setBookingError('Select date and time'); return; }
    try {
      const res = await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mentorId: params.id, skill: bookingData.skill || profile?.skills?.[0]?.name || 'General', scheduledAt: bookingData.scheduledAt, price: bookingData.price }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      router.push('/sessions');
    } catch (err) { setBookingError(err.message); }
  };

  if (loading || !authUser) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div></div>;

  const levelColors = { community: 'bg-slate-800 text-slate-300', verified: 'bg-blue-100 text-blue-700', expert: 'bg-purple-100 text-purple-700' };

  return (
    <div className="saas-shell">
      <Sidebar />
      <main className="saas-main">
        {!profile ? <p className="text-slate-500">Loading profile...</p> : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="glass-card p-6">
              <div className="text-center mb-4">
                <div className="w-20 h-20 bg-indigo-100 rounded-full flex items-center justify-center text-3xl font-bold text-indigo-600 mx-auto mb-3">
                  {profile.name?.charAt(0)?.toUpperCase()}
                </div>
                <h2 className="text-lg font-semibold">{profile.name}</h2>
                <span className={`inline-block mt-2 px-3 py-1 rounded-full text-xs font-medium ${levelColors[profile.mentorLevel]}`}>
                  {profile.mentorLevel?.charAt(0).toUpperCase() + profile.mentorLevel?.slice(1)} Mentor
                </span>
              </div>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between"><span className="text-slate-400">Reputation</span><span className="font-medium">{profile.reputationScore?.toFixed(1)}/10</span></div>
                <div className="flex justify-between"><span className="text-slate-400">Rating</span><span className="font-medium">★ {profile.averageRating?.toFixed(1)}</span></div>
                <div className="flex justify-between"><span className="text-slate-400">Sessions</span><span className="font-medium">{profile.sessionsCompleted}</span></div>
              </div>
              {profile._id !== authUser._id && (
                <button onClick={() => setBookingOpen(true)}
                  className="w-full mt-4 px-4 py-2.5 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 text-sm">
                  Book Session
                </button>
              )}
            </div>

            <div className="lg:col-span-2 space-y-6">
              <div className="glass-card p-6">
                <h3 className="font-semibold text-slate-100 mb-3">Skills</h3>
                <div className="flex flex-wrap gap-2">
                  {profile.skills?.map((s, i) => <SkillTag key={i} name={s.name} level={s.level} verified={profile.verifiedSkills?.includes(s.name)} />)}
                </div>
              </div>
              <div className="glass-card p-6">
                <h3 className="font-semibold text-slate-100 mb-3">Recent Sessions as Mentor</h3>
                {mentorSessions.length > 0 ? (
                  <div className="space-y-2">
                    {mentorSessions.map((s, i) => (
                      <div key={i} className="flex items-center justify-between py-2 border-b border-slate-800/70">
                        <div><span className="text-sm font-medium">{s.skill}</span> <span className="text-xs text-slate-500">with {s.learner?.name}</span></div>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${s.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-slate-800 text-slate-300'}`}>{s.status}</span>
                      </div>
                    ))}
                  </div>
                ) : <p className="text-slate-500 text-sm">No sessions yet</p>}
              </div>
              {profile.portfolioLinks?.length > 0 && (
                <div className="glass-card p-6">
                  <h3 className="font-semibold text-slate-100 mb-3">Portfolio</h3>
                  {profile.portfolioLinks.map((l, i) => <p key={i} className="text-sm text-blue-600 truncate">{l}</p>)}
                </div>
              )}
            </div>
          </div>
        )}

        {bookingOpen && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 w-full max-w-md">
              <h3 className="text-lg font-semibold mb-1">Book Session with {profile?.name}</h3>
              {bookingError && <div className="mb-3 p-2 bg-red-50 text-red-600 rounded text-sm">{bookingError}</div>}
              <div className="space-y-3 mt-3">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Skill</label>
                  <select value={bookingData.skill} onChange={e => setBookingData({ ...bookingData, skill: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border text-sm">
                    <option value="">Select skill</option>
                    {profile?.skills?.map((s, i) => <option key={i} value={s.name}>{s.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Date & Time</label>
                  <input type="datetime-local" value={bookingData.scheduledAt} onChange={e => setBookingData({ ...bookingData, scheduledAt: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Price (SkillCoins)</label>
                  <input type="number" value={bookingData.price} onChange={e => setBookingData({ ...bookingData, price: parseInt(e.target.value) || 30 })}
                    className="w-full px-3 py-2 rounded-lg border text-sm" />
                </div>
              </div>
              <div className="flex gap-3 mt-5">
                <button onClick={() => setBookingOpen(false)} className="flex-1 px-4 py-2 border rounded-lg text-sm">Cancel</button>
                <button onClick={bookSession} className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700">Confirm</button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

