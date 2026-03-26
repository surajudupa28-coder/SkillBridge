'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import Sidebar from '@/components/Sidebar';
import { handlePayment } from '@/lib/paymentHandler';

export default function PlacementsPage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const [subscription, setSubscription] = useState(null);
  const [upgrading, setUpgrading] = useState(false);
  const [message, setMessage] = useState('');
  const [paymentState, setPaymentState] = useState({ open: false, paymentId: '', amount: 499 });

  useEffect(() => { if (!isLoaded || !user) router.push('/login'); }, [user, isLoaded, router]);

  useEffect(() => {
    if (isLoaded) fetchSubscription();
  }, [isLoaded]);

  const fetchSubscription = async () => {
    try {
      const res = await fetch('/api/subscriptions/user');
      const data = await res.json();
      if (res.ok) setSubscription(data);
    } catch {}
  };

  const handleUpgrade = async (planType) => {
    setUpgrading(true);
    setMessage('');

    if (planType === 'pro') {
      await handlePayment({
        amount: 499,
        purpose: 'subscription',
        metadata: {
          planType,
          userName: user?.fullName || user?.firstName || '',
          userEmail: user?.primaryEmailAddress?.emailAddress || ''
        },
        onSuccess: async (result) => {
          setPaymentState({ open: true, paymentId: result.paymentId || '', amount: 499 });
          setMessage('Successfully upgraded to Premium! You are now visible to recruiters.');
          await fetchSubscription();
          setUpgrading(false);
          setTimeout(() => setPaymentState({ open: false, paymentId: '', amount: 499 }), 1200);
        },
        onError: (error) => {
          setMessage(error.error || 'Payment failed');
          setUpgrading(false);
        }
      });

      return;
    }

    try {
      const res = await fetch('/api/subscriptions/user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planType }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage(planType === 'pro' ? 'Successfully upgraded to Premium! You are now visible to recruiters.' : 'Switched to Free plan.');
        fetchSubscription();
      } else {
        setMessage(data.error || 'Failed to update subscription');
      }
    } catch {
      setMessage('Network error');
    } finally {
      setUpgrading(false);
    }
  };

  if (!isLoaded || !user) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div></div>;

  const isPro = subscription?.planType === 'pro';
  const readinessScore = Math.min(100, (user.verifiedSkills?.length || 0) * 15 + (user.sessionsCompleted || 0) * 1 + (user.averageRating || 0) * 5);

  const freeFeatures = [
    { label: 'Learning access', included: true },
    { label: 'Teaching access', included: true },
    { label: 'Basic profile', included: true },
    { label: 'Recruiter visibility', included: false },
    { label: 'Placement access', included: false },
    { label: 'Career analytics', included: false },
  ];

  const premiumFeatures = [
    { label: 'Learning access', included: true },
    { label: 'Teaching access', included: true },
    { label: 'Basic profile', included: true },
    { label: 'Recruiter visibility', included: true },
    { label: 'Placement access', included: true },
    { label: 'Career analytics', included: true },
  ];

  const benefits = [
    { title: 'Recruiter Visibility', description: 'Your profile appears in company talent searches' },
    { title: 'Placement Opportunities', description: 'Access exclusive job and internship listings' },
    { title: 'Career Analytics', description: 'Track your placement readiness score' },
    { title: 'Priority Ranking', description: 'Higher visibility in talent leaderboard' },
  ];

  return (
    <div className="saas-shell">
      <Sidebar />
      <main className="saas-main">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-100">Placements & Career</h1>
          <p className="text-slate-400 mt-1">Unlock recruiter visibility and career placement features</p>
        </div>

        {/* Success / Info Message */}
        {message && (
          <div className="mb-6 p-4 rounded-lg bg-green-50 border border-green-200 text-green-700 text-sm">
            {message}
          </div>
        )}

        {/* Current Plan Status */}
        <div className="mb-8 glass-card p-6 flex items-center justify-between">
          <div>
            <p className="text-sm text-slate-400">Current Plan</p>
            <p className="text-lg font-semibold text-slate-100 mt-1">{isPro ? 'Premium 👑' : 'Free Plan'}</p>
          </div>
          <span className={`px-3 py-1 rounded-full text-xs font-medium ${isPro ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-800 text-slate-300'}`}>
            {isPro ? 'Active' : 'Free Tier'}
          </span>
        </div>

        {/* Plan Comparison Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Free Plan Card */}
          <div className="glass-card p-6">
            <h3 className="text-lg font-semibold text-slate-100">Free Plan</h3>
            <p className="text-3xl font-bold text-slate-100 mt-3">₹0<span className="text-sm font-normal text-slate-500">/month</span></p>
            <p className="text-sm text-slate-400 mt-1">Basic access to the platform</p>
            <ul className="mt-6 space-y-3">
              {freeFeatures.map((f) => (
                <li key={f.label} className="flex items-center gap-2 text-sm">
                  {f.included ? (
                    <span className="text-green-500 font-bold">{'\u2713'}</span>
                  ) : (
                    <span className="text-gray-300 font-bold">{'\u2717'}</span>
                  )}
                  <span className={f.included ? 'text-slate-300' : 'text-slate-500'}>{f.label}</span>
                </li>
              ))}
            </ul>
            <button disabled={!isPro || upgrading} onClick={() => handleUpgrade('free')}
              className="mt-6 w-full px-4 py-2.5 rounded-lg text-sm font-medium border border-slate-700 text-slate-300 hover:bg-slate-900/40 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
              {!isPro ? 'Current Plan' : 'Downgrade to Free'}
            </button>
          </div>

          {/* Premium Plan Card */}
          <div className="glass-card border-2 border-indigo-500/60 p-6 relative">
            <span className="absolute -top-3 left-6 bg-indigo-600 text-white text-xs font-medium px-3 py-1 rounded-full">Recommended</span>
            <h3 className="text-lg font-semibold text-slate-100">Premium 👑</h3>
            <p className="text-3xl font-bold text-slate-100 mt-3">₹499<span className="text-sm font-normal text-slate-500">/month</span></p>
            <p className="text-sm text-slate-400 mt-1">Full career placement features</p>
            <ul className="mt-6 space-y-3">
              {premiumFeatures.map((f) => (
                <li key={f.label} className="flex items-center gap-2 text-sm">
                  <span className="text-green-500 font-bold">{'\u2713'}</span>
                  <span className="text-slate-300">{f.label}</span>
                </li>
              ))}
            </ul>
            <button disabled={isPro || upgrading} onClick={() => handleUpgrade('pro')}
              className={`mt-6 w-full px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isPro
                  ? 'bg-indigo-100 text-indigo-600 cursor-not-allowed'
                  : 'bg-indigo-600 text-white hover:bg-indigo-700'
              } disabled:opacity-70`}>
              {upgrading ? 'Processing...' : isPro ? 'Current Plan' : 'Upgrade to Premium'}
            </button>
          </div>
        </div>

        {/* Benefits Grid */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-slate-100 mb-4">What Premium Gets You</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {benefits.map((b) => (
              <div key={b.title} className="glass-card p-5">
                <div className="w-10 h-10 rounded-lg bg-indigo-500/20 flex items-center justify-center mb-3">
                  <span className="text-indigo-600 text-lg font-bold">{b.title.charAt(0)}</span>
                </div>
                <h4 className="text-sm font-semibold text-slate-100 mb-1">{b.title}</h4>
                <p className="text-xs text-slate-400 leading-relaxed">{b.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Placement Readiness (Pro Only) */}
        {isPro && (
          <div className="glass-card p-6">
            <h2 className="text-lg font-semibold text-slate-100 mb-4">Placement Readiness</h2>
            <div className="flex items-center gap-6">
              <div className="relative w-28 h-28 flex-shrink-0">
                <svg className="w-28 h-28 -rotate-90" viewBox="0 0 120 120">
                  <circle cx="60" cy="60" r="50" fill="none" stroke="#e5e7eb" strokeWidth="10" />
                  <circle cx="60" cy="60" r="50" fill="none" stroke="#4f46e5" strokeWidth="10"
                    strokeDasharray={`${readinessScore * 3.14} ${314 - readinessScore * 3.14}`}
                    strokeLinecap="round" />
                </svg>
                <span className="absolute inset-0 flex items-center justify-center text-xl font-bold text-slate-100">{readinessScore}%</span>
              </div>
              <div className="flex-1">
                <p className="text-sm text-slate-400 mb-3">Your readiness score is based on your verified skills, completed sessions, and average rating.</p>
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center p-3 bg-slate-900/40 rounded-lg">
                    <p className="text-lg font-bold text-slate-100">{user.verifiedSkills?.length || 0}</p>
                    <p className="text-xs text-slate-400">Verified Skills</p>
                  </div>
                  <div className="text-center p-3 bg-slate-900/40 rounded-lg">
                    <p className="text-lg font-bold text-slate-100">{user.sessionsCompleted || 0}</p>
                    <p className="text-xs text-slate-400">Sessions</p>
                  </div>
                  <div className="text-center p-3 bg-slate-900/40 rounded-lg">
                    <p className="text-lg font-bold text-slate-100">{user.averageRating?.toFixed(1) || '0.0'}</p>
                    <p className="text-xs text-slate-400">Avg Rating</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {paymentState.open && (
        <div className="fixed inset-0 z-[70] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 text-center shadow-2xl">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100 text-2xl text-green-600">✓</div>
            <h3 className="text-lg font-semibold text-slate-900">Razorpay Payment Successful</h3>
            <p className="mt-1 text-sm text-slate-600">Premium subscription activated.</p>
            <p className="mt-2 text-xs text-slate-500">Payment ID: {paymentState.paymentId}</p>
          </div>
        </div>
      )}
    </div>
  );
}




