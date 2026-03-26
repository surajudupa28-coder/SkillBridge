'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import Link from 'next/link';

export default function Home() {
  const { user, isLoaded } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (isLoaded && user) router.push('/dashboard');
  }, [user, isLoaded, router]);

  if (!isLoaded) return <div className="min-h-screen flex items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-b-2 border-cyan-400"></div></div>;

  if (user) return null;

  return (
    <div className="min-h-screen bg-transparent">
      <nav className="mx-auto flex w-full max-w-7xl items-center justify-between px-6 py-5 sm:px-8">
        <h1 className="text-2xl font-bold text-slate-100"><span className="text-indigo-400">Skill</span><span className="text-slate-400">Bridge AI</span></h1>
        <div className="flex gap-3">
          <Link href="/login" className="rounded-lg px-5 py-2 text-sm font-medium text-slate-300 transition-colors hover:text-indigo-300">Log In</Link>
          <Link href="/register" className="rounded-lg border border-indigo-400/40 bg-indigo-500/90 px-5 py-2 text-sm font-medium text-white transition hover:bg-indigo-400">Get Started</Link>
        </div>
      </nav>
      <main className="mx-auto max-w-7xl px-6 pb-32 pt-16 sm:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="mb-6 text-5xl font-bold leading-tight text-slate-100">Learn from peers.<br /><span className="text-indigo-400">Teach what you know.</span></h2>
          <p className="mb-10 text-xl text-slate-300">SkillBridge AI connects students for peer-to-peer skill sessions. Teach, learn, and earn SkillCoins in a collaborative marketplace powered by AI matching.</p>
          <div className="flex gap-4 justify-center">
            <Link href="/register" className="rounded-xl border border-indigo-400/40 bg-indigo-500/90 px-8 py-3 text-lg font-medium text-white transition hover:bg-indigo-400">Start Learning</Link>
            <Link href="/register" className="rounded-xl border-2 border-slate-700 bg-slate-900/50 px-8 py-3 text-lg font-medium text-slate-200 transition hover:border-indigo-400/60">Start Teaching</Link>
          </div>
        </div>
        <div className="mx-auto mt-20 grid max-w-4xl grid-cols-1 gap-8 md:grid-cols-3">
          <div className="glass-card p-6 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-indigo-500/20 text-2xl text-indigo-300">&#x26B2;</div>
            <h3 className="mb-2 font-semibold text-slate-100">AI Matching</h3>
            <p className="text-sm text-slate-400">Smart algorithm matches you with the best mentors for your learning goals.</p>
          </div>
          <div className="glass-card p-6 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-emerald-500/20 text-2xl text-emerald-300">&#x25C8;</div>
            <h3 className="mb-2 font-semibold text-slate-100">SkillCoins Economy</h3>
            <p className="text-sm text-slate-400">Earn coins by teaching, spend them learning. A fair internal currency system.</p>
          </div>
          <div className="glass-card p-6 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-cyan-500/20 text-2xl text-cyan-300">&#x2605;</div>
            <h3 className="mb-2 font-semibold text-slate-100">Verified Mentors</h3>
            <p className="text-sm text-slate-400">Reputation system ensures quality. Earn badges and climb mentor levels.</p>
          </div>
        </div>
      </main>
    </div>
  );
}