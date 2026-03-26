'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import Sidebar from '@/components/Sidebar';
import SkillCard from '@/components/SkillCard.jsx';

export default function TrendingSkillsPage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();

  const [goal, setGoal] = useState('');
  const [items, setItems] = useState([]);
  const [loadingSkills, setLoadingSkills] = useState(false);
  const [error, setError] = useState('');

  const fetchTrendingSkills = useCallback(async () => {
    if (!user) return;

    setLoadingSkills(true);
    setError('');

    try {
      const userSkills = Array.isArray(user.skills)
        ? user.skills.map((s) => (typeof s === 'string' ? s : s?.name)).filter(Boolean)
        : [];

      const experienceLevel = userSkills.length >= 8 ? 'advanced' : userSkills.length >= 4 ? 'intermediate' : 'beginner';

      const res = await fetch('/api/ai/trending-skills', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          skills: userSkills,
          goal,
          experienceLevel,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || 'Unable to load trending skills right now.');
      }

      setItems(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || 'Unable to fetch trending skills. Showing fallback suggestions if available.');
      setItems([]);
    } finally {
      setLoadingSkills(false);
    }
  }, [goal, user]);

  useEffect(() => {
    if (!isLoaded || !user) router.push('/login');
  }, [isLoaded, user, router]);

  useEffect(() => {
    if ( user) {
      fetchTrendingSkills();
    }
  }, [user, fetchTrendingSkills]);

  if (!isLoaded || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="saas-shell">
      <Sidebar />
      <main className="saas-main">
        <div className="mx-auto max-w-6xl">
          <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-100">Trending Skills</h1>
              <p className="mt-1 text-slate-400">AI-powered daily skill trends personalized to your profile.</p>
            </div>

            <button
              type="button"
              onClick={fetchTrendingSkills}
              disabled={loadingSkills}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loadingSkills ? 'Refreshing...' : 'Refresh Suggestions'}
            </button>
          </div>

          <div className="mb-6 glass-card p-4">
            <label className="mb-2 block text-sm font-medium text-slate-300">Career Goal (optional)</label>
            <div className="flex flex-col gap-3 md:flex-row">
              <input
                type="text"
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
                placeholder="Example: Become a cloud-native full-stack engineer"
                className="flex-1 rounded-lg border border-slate-700 bg-slate-900/40 px-4 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <button
                type="button"
                onClick={fetchTrendingSkills}
                disabled={loadingSkills}
                className="rounded-lg border border-indigo-500/40 bg-indigo-500/10 px-4 py-2 text-sm font-medium text-indigo-300 hover:bg-indigo-500/20 disabled:opacity-60"
              >
                Apply Goal
              </button>
            </div>
          </div>

          {error && (
            <div className="mb-5 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              {error}
            </div>
          )}

          {loadingSkills ? (
            <div className="flex min-h-[220px] items-center justify-center glass-card">
              <div className="text-center">
                <div className="mx-auto h-8 w-8 animate-spin rounded-full border-b-2 border-indigo-600"></div>
                <p className="mt-3 text-sm text-slate-400">Analyzing live market trends and matching mentors...</p>
              </div>
            </div>
          ) : items.length > 0 ? (
            <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
              {items.map((item, index) => (
                <SkillCard
                  key={`${item.skill}-${index}`}
                  item={item}
                  onBook={() => router.push('/sessions')}
                />
              ))}
            </div>
          ) : (
            <div className="glass-card p-10 text-center">
              <p className="text-slate-300">No suggestions available right now. Try refreshing in a moment.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}


