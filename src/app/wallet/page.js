'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import { motion } from 'framer-motion';
import { Activity, ArrowDownCircle, ArrowUpCircle, Wallet } from 'lucide-react';
import Sidebar from '@/components/Sidebar';
import WalletSummaryCard from '@/components/WalletSummaryCard';
import AddCoinsModal from '@/components/AddCoinsModal';
import TransactionHistoryList from '@/components/TransactionHistoryList';
import QuickActionsSection from '@/components/QuickActionsSection';
import GlassCard from '@/components/ui/GlassCard';

export default function WalletPage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const [walletData, setWalletData] = useState({ balance: 0, transactions: [] });
  const [loading, setLoading] = useState(true);
  const [transLoading, setTransLoading] = useState(false);
  const [error, setError] = useState('');
  const [isAddCoinsOpen, setIsAddCoinsOpen] = useState(false);

  useEffect(() => {
    if (isLoaded && !user) router.push('/login');
  }, [user, isLoaded, router]);

  useEffect(() => {
    if (isLoaded && user) {
      fetchWalletData();
    }
  }, [isLoaded, user]);

  const fetchWalletData = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/wallet');
      if (!res.ok) {
        throw new Error('Failed to fetch wallet data');
      }
      const data = await res.json();
      // Safely handle balance - support multiple possible field names
      const balance = data?.balance ?? data?.walletBalance ?? data?.wallet?.balance ?? 0;
      setWalletData({
        balance: Math.max(0, parseInt(balance) || 0),
        transactions: Array.isArray(data.transactions) ? data.transactions : []
      });
      setError('');
    } catch (err) {
      setError(err.message || 'Failed to load wallet');
      console.error('Wallet fetch error:', err);
      setWalletData({ balance: 0, transactions: [] });
    } finally {
      setLoading(false);
    }
  };

  const handleAddCoinsSuccess = async (amount) => {
    setIsAddCoinsOpen(false);
    // Refresh wallet data after successful purchase
    await fetchWalletData();
  };

  const handleAddCoinsClick = () => {
    setIsAddCoinsOpen(true);
  };

  if (!isLoaded || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="saas-shell">
      <Sidebar />
      <main className="saas-main">
        {/* Header */}
        <div className="mb-8">
          <h1 className="saas-heading inline-flex items-center gap-2"><Wallet className="h-7 w-7 text-cyan-300" /> Wallet</h1>
          <p className="saas-subtext mt-2">Manage your SkillCoins and track your transactions</p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 rounded-lg border border-red-400/30 bg-red-500/10 p-4 flex items-start gap-3">
            <span className="text-red-600 text-xl">⚠️</span>
            <div>
              <p className="text-red-300 font-semibold text-sm">Error</p>
              <p className="text-red-200 text-sm">{error}</p>
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className="space-y-6">
          {/* Wallet Summary Card */}
          <WalletSummaryCard
            balance={walletData.balance}
            onAddCoins={handleAddCoinsClick}
            loading={loading}
          />

          {/* Quick Actions */}
          <QuickActionsSection />

          {/* Transaction History */}
          <GlassCard className="p-8">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-slate-100 inline-flex items-center gap-2"><Activity className="h-6 w-6 text-indigo-300" /> Transaction History</h2>
              <p className="text-slate-400 text-sm mt-1">Your recent wallet activity</p>
            </div>

            {transLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-indigo-600 border-t-transparent"></div>
              </div>
            ) : (
              <TransactionHistoryList
                transactions={walletData.transactions}
                loading={false}
              />
            )}
          </GlassCard>

          {/* Info Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <GlassCard className="p-6">
              <div className="mb-3 inline-flex rounded-lg bg-cyan-500/20 p-2"><ArrowUpCircle className="h-5 w-5 text-cyan-300" /></div>
              <h3 className="font-bold text-cyan-100 mb-3">How to Earn SkillCoins</h3>
              <ul className="text-sm text-slate-300 space-y-2">
                <li className="flex gap-2"><span>✓</span> Complete mentoring sessions</li>
                <li className="flex gap-2"><span>✓</span> Get verified on skills</li>
                <li className="flex gap-2"><span>✓</span> Reach leaderboard milestones</li>
                <li className="flex gap-2"><span>✓</span> Earn badges and rewards</li>
              </ul>
            </GlassCard>

            <GlassCard className="p-6">
              <div className="mb-3 inline-flex rounded-lg bg-emerald-500/20 p-2"><ArrowDownCircle className="h-5 w-5 text-emerald-300" /></div>
              <h3 className="font-bold text-emerald-100 mb-3">How to Spend SkillCoins</h3>
              <ul className="text-sm text-slate-300 space-y-2">
                <li className="flex gap-2"><span>✓</span> Book mentoring sessions</li>
                <li className="flex gap-2"><span>✓</span> Access premium content</li>
                <li className="flex gap-2"><span>✓</span> Request skill verification</li>
                <li className="flex gap-2"><span>✓</span> Unlock learning paths</li>
              </ul>
            </GlassCard>
          </div>

          {/* FAQ Section */}
          <GlassCard className="p-6">
            <h3 className="font-bold text-slate-100 mb-4">Frequently Asked Questions</h3>
            <div className="space-y-4 text-sm">
              <div>
                <p className="font-semibold text-slate-100 mb-1">💳 What is 1 SkillCoin worth?</p>
                <p className="text-slate-400">1 SkillCoin = ₹1 | You can purchase in bulk for better rates</p>
              </div>
              <div>
                <p className="font-semibold text-slate-100 mb-1">🔄 Can I transfer SkillCoins?</p>
                <p className="text-slate-400">SkillCoins can be used for services within SkillBridge</p>
              </div>
              <div>
                <p className="font-semibold text-slate-100 mb-1">⏳ Do SkillCoins expire?</p>
                <p className="text-slate-400">No, your SkillCoins never expire. Use them anytime!</p>
              </div>
            </div>
          </GlassCard>
        </div>
      </main>

      {/* Add Coins Modal */}
      <AddCoinsModal
        isOpen={isAddCoinsOpen}
        onClose={() => setIsAddCoinsOpen(false)}
        onSuccess={handleAddCoinsSuccess}
      />
    </div>
  );
}
