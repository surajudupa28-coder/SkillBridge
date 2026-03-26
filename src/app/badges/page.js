'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import Sidebar from '@/components/Sidebar';

export default function BadgesPage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const [badges, setBadges] = useState([]);
  const [userBadges, setUserBadges] = useState([]);
  const [loadingBadges, setLoadingBadges] = useState(true);

  useEffect(() => { if (isLoaded && !user) router.push('/login'); }, [user, isLoaded, router]);

  useEffect(() => { if (isLoaded) fetchBadges(); }, [isLoaded]);

  const fetchBadges = async () => {
    try {
      const res = await fetch('/api/badges');
      const data = await res.json();
      setBadges(data.badges || []);
      setUserBadges(data.userBadges || []);
    } catch (err) { console.error(err); }
    setLoadingBadges(false);
  };

  const earnedBadgeIds = new Set(userBadges.map(ub => ub.badge?._id));

  const howToEarn = [
    { emoji: '🏆', title: 'Top Mentor', desc: 'Complete 50+ sessions with a 4.5+ average rating' },
    { emoji: '🌱', title: 'Rising Mentor', desc: 'Complete 10+ mentoring sessions' },
    { emoji: '🎯', title: 'Skill Master', desc: 'Get a verified expert-level skill endorsement' },
    { emoji: '⭐', title: 'Highly Rated', desc: 'Maintain a 4.8+ average rating across all sessions' },
    { emoji: '🤝', title: 'Community Builder', desc: 'Have the most repeat learners on the platform' },
  ];

  if (isLoaded && !user) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div></div>;

  return (
    <div className="saas-shell">
      <Sidebar />
      <main className="saas-main">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-100">Achievements & Badges</h1>
          <p className="text-sm text-slate-400 mt-1">Track your progress and showcase your accomplishments on SkillBridge.</p>
        </div>

        {/* My Badges Section */}
        <section className="mb-10">
          <h2 className="text-lg font-semibold text-slate-100 mb-4">My Badges</h2>
          {loadingBadges ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            </div>
          ) : userBadges.length === 0 ? (
            <div className="glass-card p-8 text-center">
              <p className="text-4xl mb-3">🏅</p>
              <p className="text-slate-400 text-sm">No badges earned yet. Complete more sessions and verify your skills to earn badges!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {userBadges.map((ub, i) => {
                const badge = ub.badge || {};
                return (
                  <div key={ub._id || i} className="glass-card p-6 flex flex-col items-center text-center">
                    <span className="text-5xl mb-3">{badge.icon || '🏅'}</span>
                    <h3 className="font-semibold text-slate-100 text-lg">{badge.name || 'Badge'}</h3>
                    <p className="text-sm text-slate-400 mt-1">{badge.description || ''}</p>
                    <div className="mt-4 w-full border-t border-slate-800/80 pt-3 space-y-1">
                      <p className="text-xs text-slate-500">
                        Awarded {ub.awardedAt ? new Date(ub.awardedAt).toLocaleDateString() : 'N/A'}
                      </p>
                      {(ub.awardReason || ub.reason) && <p className="text-xs text-indigo-600 font-medium">{ub.awardReason || ub.reason}</p>}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* All Available Badges Section */}
        <section className="mb-10">
          <h2 className="text-lg font-semibold text-slate-100 mb-4">All Available Badges</h2>
          {loadingBadges ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            </div>
          ) : badges.length === 0 ? (
            <div className="glass-card p-8 text-center">
              <p className="text-slate-400 text-sm">No badge definitions found.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {badges.map((badge, i) => {
                const earned = earnedBadgeIds.has(badge._id);
                return (
                  <div key={badge._id || i} className={`relative rounded-xl border p-5 flex flex-col items-center text-center ${earned ? 'border-indigo-400/60 bg-indigo-500/10' : 'border-slate-700/70 bg-slate-900/40'}`}>
                    {earned && (
                      <span className="absolute top-3 right-3 bg-green-100 text-green-700 text-xs font-semibold px-2 py-0.5 rounded-full flex items-center gap-1">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                        Earned
                      </span>
                    )}
                    <span className="text-4xl mb-2">{badge.icon || '🏅'}</span>
                    <h3 className="font-semibold text-slate-100 text-sm">{badge.name}</h3>
                    <p className="text-xs text-slate-400 mt-1">{badge.description}</p>
                    {badge.criteria && <p className="text-xs text-slate-500 mt-2 italic">{badge.criteria}</p>}
                    {badge.category && (
                      <span className="mt-3 inline-block bg-slate-800 text-slate-300 text-xs font-medium px-2.5 py-0.5 rounded-full">
                        {badge.category}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* How to Earn Badges Section */}
        <section>
          <h2 className="text-lg font-semibold text-slate-100 mb-4">How to Earn Badges</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {howToEarn.map((item, i) => (
              <div key={i} className="glass-card p-5 flex items-start gap-4">
                <span className="text-3xl flex-shrink-0">{item.emoji}</span>
                <div>
                  <h3 className="font-semibold text-slate-100 text-sm">{item.title}</h3>
                  <p className="text-xs text-slate-400 mt-1">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}


