'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Sidebar from '@/components/Sidebar';
import DashboardCard from '@/components/DashboardCard';
import MentorCard from '@/components/MentorCard';

export default function DashboardPage() {
  const { user, token, loading } = useAuth();
  const router = useRouter();
  const [mentors, setMentors] = useState([]);
  const [loadingMentors, setLoadingMentors] = useState(true);

  useEffect(() => {
    if (!loading && !user) router.push('/login');
  }, [user, loading, router]);

  useEffect(() => {
    if (token) {
      fetch('/api/matching', { headers: { Authorization: `Bearer ${token}` } })
        .then(r => r.json())
        .then(data => setMentors(data.mentors || []))
        .catch(() => {})
        .finally(() => setLoadingMentors(false));
    }
  }, [token]);

  if (loading || !user) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div></div>;

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      <main className="ml-64 p-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Welcome back, {user.name}</h1>
          <p className="text-gray-500 mt-1">Here&apos;s your SkillBridge overview</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <DashboardCard title="Wallet Balance" value={`${user.walletBalance} SC`} subtitle="SkillCoins available" icon="◈" color="green" />
          <DashboardCard title="Reputation" value={user.reputationScore?.toFixed(1)} subtitle="out of 10" icon="★" color="indigo" />
          <DashboardCard title="Sessions" value={user.sessionsCompleted} subtitle="completed" icon="▦" color="blue" />
          <DashboardCard title="Avg Rating" value={user.averageRating?.toFixed(1)} subtitle="out of 5.0" icon="♥" color="amber" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Recommended Mentors</h2>
          {loadingMentors ? (
            <div className="text-gray-400 text-sm">Finding mentors...</div>
          ) : mentors.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {mentors.map(m => (
                <MentorCard key={m._id} mentor={m} onBook={(mentor) => router.push(`/profile/${mentor._id}`)} />
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-gray-100 p-8 text-center">
              <p className="text-gray-500">No mentor recommendations yet. Update your interests in your profile to get matched!</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
