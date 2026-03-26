'use client';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { motion } from 'framer-motion';
import { CalendarClock, SearchX } from 'lucide-react';
import Sidebar from '@/components/Sidebar';
import SessionCard from '@/components/SessionCard';
import GlassCard from '@/components/ui/GlassCard';
import SkeletonLoader from '@/components/ui/SkeletonLoader';

export default function SessionsPage() {
  const { user, token, loading, updateUser } = useAuth();
  const router = useRouter();
  const [sessions, setSessions] = useState([]);
  const [filter, setFilter] = useState('all');
  const [loadingSessions, setLoadingSessions] = useState(true);
  const [ratingSession, setRatingSession] = useState(null);
  const [ratingValue, setRatingValue] = useState(5);
  const [reviewText, setReviewText] = useState('');
  const [actionMsg, setActionMsg] = useState('');

  useEffect(() => { if (!loading && !user) router.push('/login'); }, [user, loading, router]);

  const fetchSessions = useCallback(async () => {
    
    try {
      const res = await fetch('/api/sessions');
      const data = await res.json();
      setSessions(data.sessions || []);
    } catch {} finally { setLoadingSessions(false); }
  }, []);

  useEffect(() => { fetchSessions(); }, [fetchSessions]);

  const filtered = filter === 'all' ? sessions : sessions.filter(s => s.status === filter);

  const handleComplete = async (id) => {
    try {
      const res = await fetch(`/api/sessions/${id}/complete`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) { setActionMsg(data.error); return; }
      setActionMsg(`Session completed! Earned ${data.mentorPayment} SC`);
      fetchSessions();
      updateUser();
    } catch (err) { setActionMsg(err.message); }
  };

  const handleCancel = async (id) => {
    try {
      const res = await fetch(`/api/sessions/${id}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cancelledBy: 'cancel' }),
      });
      if (!res.ok) { const d = await res.json(); setActionMsg(d.error); return; }
      setActionMsg('Session cancelled');
      fetchSessions();
      updateUser();
    } catch (err) { setActionMsg(err.message); }
  };

  const handleRate = async () => {
    if (!ratingSession) return;
    try {
      const res = await fetch(`/api/sessions/${ratingSession._id}/rate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating: ratingValue, review: reviewText }),
      });
      const data = await res.json();
      if (!res.ok) { setActionMsg(data.error); return; }
      setActionMsg(data.suspicious ? 'Rating submitted (flagged for review)' : 'Rating submitted!');
      setRatingSession(null);
      setRatingValue(5);
      setReviewText('');
      fetchSessions();
    } catch (err) { setActionMsg(err.message); }
  };

  const handleReport = async (id) => {
    const reason = prompt('Enter reason for report:');
    if (!reason) return;
    try {
      const res = await fetch(`/api/sessions/${id}/report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Report failed');
      }
      setActionMsg('Report submitted');
    } catch (err) { setActionMsg(err.message); }
  };

  if (loading || !user) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div></div>;

  return (
    <div className="saas-shell">
      <Sidebar />
      <main className="saas-main">
        <h1 className="saas-heading mb-6 inline-flex items-center gap-2"><CalendarClock className="h-7 w-7 text-cyan-300" /> My Sessions</h1>
        {actionMsg && (
          <div className="mb-4 p-3 bg-blue-500/10 border border-blue-400/20 text-blue-200 rounded-lg text-sm flex justify-between">
            {actionMsg} <button onClick={() => setActionMsg('')} className="text-blue-300 hover:text-blue-100">×</button>
          </div>
        )}
        <div className="flex gap-2 mb-6">
          {['all', 'scheduled', 'completed', 'cancelled'].map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium ${filter === f ? 'bg-indigo-600 text-white' : 'bg-slate-900 border border-slate-700 text-slate-300 hover:bg-slate-800'}`}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>

        {loadingSessions ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <GlassCard><SkeletonLoader lines={5} /></GlassCard>
            <GlassCard><SkeletonLoader lines={5} /></GlassCard>
          </div>
        ) : filtered.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filtered.map(s => (
              <SessionCard key={s._id} session={s} currentUserId={user._id}
                onComplete={handleComplete} onCancel={handleCancel} onRate={setRatingSession} onReport={handleReport} />
            ))}
          </div>
        ) : (
          <GlassCard className="p-12 text-center">
            <SearchX className="mx-auto h-8 w-8 text-slate-400 mb-2" />
            <p className="text-slate-300">No sessions yet</p>
            <button onClick={() => router.push('/mentors')} className="mt-4 rounded-lg bg-indigo-600 px-4 py-2 text-sm text-white hover:bg-indigo-500">Find Mentors</button>
          </GlassCard>
        )}

        {ratingSession && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="glass-card bg-slate-900 rounded-2xl p-6 w-full max-w-md">
              <h3 className="text-lg font-semibold mb-4">Rate Session</h3>
              <p className="text-sm text-slate-400 mb-3">{ratingSession.skill} with {ratingSession.mentor?.name}</p>
              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-300 mb-2">Rating</label>
                <div className="flex gap-2">
                  {[1,2,3,4,5].map(v => (
                    <button key={v} onClick={() => setRatingValue(v)}
                      className={`text-2xl ${v <= ratingValue ? 'text-amber-400' : 'text-slate-500'}`}>★</button>
                  ))}
                </div>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-300 mb-1">Review (optional)</label>
                <textarea value={reviewText} onChange={e => setReviewText(e.target.value)} rows={3}
                  className="w-full px-3 py-2 border border-slate-700 bg-slate-900 rounded-lg text-sm" placeholder="Share your experience..." />
              </div>
              <div className="flex gap-3">
                <button onClick={() => { setRatingSession(null); setRatingValue(5); setReviewText(''); }}
                  className="flex-1 px-4 py-2 border border-slate-700 rounded-lg text-sm text-slate-200">Cancel</button>
                <motion.button whileTap={{ scale: 0.96 }} onClick={handleRate} className="flex-1 px-4 py-2 bg-amber-500 text-white rounded-lg text-sm hover:bg-amber-600">Submit Rating</motion.button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}


