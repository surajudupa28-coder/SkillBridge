'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import { motion } from 'framer-motion';
import { Brain, Sparkles, Users } from 'lucide-react';
import Sidebar from '@/components/Sidebar';
import DashboardCard from '@/components/DashboardCard';
import DashboardHero from '@/components/ui/DashboardHero';

export default function DashboardPage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const [walletBalance, setWalletBalance] = useState(0);
  const [loadingWallet, setLoadingWallet] = useState(true);

  useEffect(() => {
    if (isLoaded && !user) router.push('/login');
  }, [user, isLoaded, router]);

  useEffect(() => {
    if (isLoaded && user) {
      fetchWalletBalance();
    }
  }, [isLoaded, user]);

  const fetchWalletBalance = async () => {
    try {
      setLoadingWallet(true);
      const res = await fetch('/api/wallet');
      if (res.ok) {
        const data = await res.json();
        // Safely extract balance from multiple possible field names
        const balance = data?.balance ?? data?.walletBalance ?? data?.wallet?.balance ?? 0;
        setWalletBalance(Math.max(0, parseInt(balance) || 0));
      } else {
        setWalletBalance(0);
      }
    } catch (err) {
      console.error('Failed to fetch wallet balance:', err);
      setWalletBalance(0);
    } finally {
      setLoadingWallet(false);
    }
  };

  if (!isLoaded || !user) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div></div>;

  return (
    <div className="saas-shell">
      <Sidebar />
      <main className="saas-main">
        <DashboardHero
          userName={user.name || user.firstName || 'Learner'}
          walletBalance={walletBalance}
          verifiedSkills={user.verifiedSkills?.length || 0}
          reputation={user.reputationScore || 0}
          sessions={user.sessionsCompleted || 0}
        />

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }} className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 mb-8">
          <DashboardCard title="Reputation" value={user.reputationScore?.toFixed(1) ?? '0'} subtitle="out of 10" icon={<Brain className="h-5 w-5" />} color="indigo" />
          <DashboardCard title="Sessions" value={user.sessionsCompleted ?? 0} subtitle="completed" icon={<Users className="h-5 w-5" />} color="blue" />
          <DashboardCard title="Avg Rating" value={user.averageRating?.toFixed(1) ?? '0'} subtitle="out of 5.0" icon={<Sparkles className="h-5 w-5" />} color="amber" />
        </motion.div>
      </main>
    </div>
  );
}
