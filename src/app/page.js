'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) router.push('/dashboard');
  }, [user, loading, router]);

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div></div>;

  if (user) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-blue-50">
      <nav className="px-8 py-4 flex items-center justify-between max-w-7xl mx-auto">
        <h1 className="text-2xl font-bold"><span className="text-indigo-600">Skill</span>Bridge AI</h1>
        <div className="flex gap-3">
          <Link href="/login" className="px-5 py-2 text-sm font-medium text-gray-700 hover:text-indigo-600 transition-colors">Log In</Link>
          <Link href="/register" className="px-5 py-2 text-sm font-medium bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">Get Started</Link>
        </div>
      </nav>
      <main className="max-w-7xl mx-auto px-8 pt-20 pb-32">
        <div className="text-center max-w-3xl mx-auto">
          <h2 className="text-5xl font-bold text-gray-900 leading-tight mb-6">Learn from peers.<br /><span className="text-indigo-600">Teach what you know.</span></h2>
          <p className="text-xl text-gray-500 mb-10">SkillBridge AI connects students for peer-to-peer skill sessions. Teach, learn, and earn SkillCoins in a collaborative marketplace powered by AI matching.</p>
          <div className="flex gap-4 justify-center">
            <Link href="/register" className="px-8 py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors text-lg">Start Learning</Link>
            <Link href="/register" className="px-8 py-3 border-2 border-gray-200 text-gray-700 rounded-lg font-medium hover:border-indigo-300 transition-colors text-lg">Start Teaching</Link>
          </div>
        </div>
        <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 text-center">
            <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center text-2xl mx-auto mb-4">&#x26B2;</div>
            <h3 className="font-semibold text-gray-900 mb-2">AI Matching</h3>
            <p className="text-sm text-gray-500">Smart algorithm matches you with the best mentors for your learning goals.</p>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 text-center">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center text-2xl mx-auto mb-4">&#x25C8;</div>
            <h3 className="font-semibold text-gray-900 mb-2">SkillCoins Economy</h3>
            <p className="text-sm text-gray-500">Earn coins by teaching, spend them learning. A fair internal currency system.</p>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 text-center">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center text-2xl mx-auto mb-4">&#x2605;</div>
            <h3 className="font-semibold text-gray-900 mb-2">Verified Mentors</h3>
            <p className="text-sm text-gray-500">Reputation system ensures quality. Earn badges and climb mentor levels.</p>
          </div>
        </div>
      </main>
    </div>
  );
}
