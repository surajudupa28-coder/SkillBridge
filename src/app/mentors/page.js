'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Sidebar from '@/components/Sidebar';
import MentorCard from '@/components/MentorCard';

export default function MentorsPage() {
  const { user, token, loading } = useAuth();
  const router = useRouter();
  const [skill, setSkill] = useState('');
  const [mentors, setMentors] = useState([]);
  const [searching, setSearching] = useState(false);
  const [bookingMentor, setBookingMentor] = useState(null);
  const [bookingData, setBookingData] = useState({ scheduledAt: '', price: 30 });
  const [bookingError, setBookingError] = useState('');

  useEffect(() => { if (!loading && !user) router.push('/login'); }, [user, loading, router]);

  const search = async () => {
    if (!token) return;
    setSearching(true);
    try {
      const res = await fetch(`/api/matching?skill=${encodeURIComponent(skill)}`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      setMentors(data.mentors || []);
    } catch {} finally { setSearching(false); }
  };

  const bookSession = async () => {
    setBookingError('');
    if (!bookingData.scheduledAt) { setBookingError('Please select a date and time'); return; }
    try {
      const res = await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ mentorId: bookingMentor._id, skill: skill || bookingMentor.skills?.[0]?.name || 'General', scheduledAt: bookingData.scheduledAt, price: bookingData.price }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setBookingMentor(null);
      router.push('/sessions');
    } catch (err) { setBookingError(err.message); }
  };

  if (loading || !user) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div></div>;

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      <main className="ml-64 p-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Find Mentors</h1>
        <div className="flex gap-3 mb-8">
          <input type="text" value={skill} onChange={e => setSkill(e.target.value)} placeholder="Search by skill (e.g. Python, React, ML...)"
            onKeyDown={e => e.key === 'Enter' && search()}
            className="flex-1 px-4 py-2.5 rounded-lg border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none text-sm" />
          <button onClick={search} disabled={searching}
            className="px-6 py-2.5 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors text-sm">
            {searching ? 'Searching...' : 'Search'}
          </button>
        </div>
        {mentors.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {mentors.map(m => <MentorCard key={m._id} mentor={m} onBook={setBookingMentor} />)}
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-100 p-12 text-center">
            <p className="text-gray-400 text-lg">Search for a skill to find matched mentors</p>
          </div>
        )}

        {bookingMentor && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl p-6 w-full max-w-md">
              <h3 className="text-lg font-semibold mb-1">Book Session</h3>
              <p className="text-sm text-gray-500 mb-4">with {bookingMentor.name}</p>
              {bookingError && <div className="mb-3 p-2 bg-red-50 text-red-600 rounded text-sm">{bookingError}</div>}
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date & Time</label>
                  <input type="datetime-local" value={bookingData.scheduledAt} onChange={e => setBookingData({ ...bookingData, scheduledAt: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Price (SkillCoins)</label>
                  <input type="number" value={bookingData.price} onChange={e => setBookingData({ ...bookingData, price: parseInt(e.target.value) || 30 })}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm" />
                </div>
                <p className="text-xs text-gray-400">Coins will be held in escrow until session completion.</p>
              </div>
              <div className="flex gap-3 mt-5">
                <button onClick={() => setBookingMentor(null)} className="flex-1 px-4 py-2 border border-gray-200 rounded-lg text-sm hover:bg-gray-50">Cancel</button>
                <button onClick={bookSession} className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700">Confirm Booking</button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
