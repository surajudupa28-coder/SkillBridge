'use client';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Sidebar from '@/components/Sidebar';
import SessionCard from '@/components/SessionCard';

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
    if (!token) return;
    try {
      const res = await fetch('/api/sessions', { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      setSessions(data.sessions || []);
    } catch {} finally { setLoadingSessions(false); }
  }, [token]);

  useEffect(() => { fetchSessions(); }, [fetchSessions]);

  const filtered = filter === 'all' ? sessions : sessions.filter(s => s.status === filter);

  const handleComplete = async (id) => {
    try {
      const res = await fetch(`/api/sessions/${id}/complete`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
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
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
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
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
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
      await fetch(`/api/sessions/${id}/report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ reason }),
      });
      setActionMsg('Report submitted');
    } catch (err) { setActionMsg(err.message); }
  };

  if (loading || !user) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div></div>;

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      <main className="ml-64 p-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">My Sessions</h1>
        {actionMsg && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 text-blue-700 rounded-lg text-sm flex justify-between">
            {actionMsg} <button onClick={() => setActionMsg('')} className="text-blue-400 hover:text-blue-600">×</button>
          </div>
        )}
        <div className="flex gap-2 mb-6">
          {['all', 'scheduled', 'completed', 'cancelled'].map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium ${filter === f ? 'bg-indigo-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
        {loadingSessions ? <p className="text-gray-400">Loading sessions...</p> : filtered.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filtered.map(s => (
              <SessionCard key={s._id} session={s} currentUserId={user._id}
                onComplete={handleComplete} onCancel={handleCancel} onRate={setRatingSession} onReport={handleReport} />
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-100 p-12 text-center">
            <p className="text-gray-400">No sessions found</p>
          </div>
        )}

        {ratingSession && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl p-6 w-full max-w-md">
              <h3 className="text-lg font-semibold mb-4">Rate Session</h3>
              <p className="text-sm text-gray-500 mb-3">{ratingSession.skill} with {ratingSession.mentor?.name}</p>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Rating</label>
                <div className="flex gap-2">
                  {[1,2,3,4,5].map(v => (
                    <button key={v} onClick={() => setRatingValue(v)}
                      className={`text-2xl ${v <= ratingValue ? 'text-amber-400' : 'text-gray-300'}`}>★</button>
                  ))}
                </div>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Review (optional)</label>
                <textarea value={reviewText} onChange={e => setReviewText(e.target.value)} rows={3}
                  className="w-full px-3 py-2 border rounded-lg text-sm" placeholder="Share your experience..." />
              </div>
              <div className="flex gap-3">
                <button onClick={() => { setRatingSession(null); setRatingValue(5); setReviewText(''); }}
                  className="flex-1 px-4 py-2 border rounded-lg text-sm">Cancel</button>
                <button onClick={handleRate} className="flex-1 px-4 py-2 bg-amber-500 text-white rounded-lg text-sm hover:bg-amber-600">Submit Rating</button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
