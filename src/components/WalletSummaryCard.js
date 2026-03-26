'use client';
import { motion } from 'framer-motion';
import { ArrowUpRight, Coins, Wallet } from 'lucide-react';

export default function WalletSummaryCard({ balance = 0, onAddCoins, loading = false }) {
  // Convert SkillCoins to approximate currency (1 SC = ₹1 for this demo)
  const currencyValue = balance;

  if (loading) {
    return (
      <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-indigo-600/70 to-cyan-500/50 p-8 text-white shadow-lg animate-pulse">
        <div className="h-4 bg-indigo-300/30 rounded w-24 mb-4"></div>
        <div className="h-12 bg-indigo-300/30 rounded w-48 mb-4"></div>
        <div className="h-4 bg-indigo-300/30 rounded w-32"></div>
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-indigo-600 via-indigo-600 to-cyan-500 p-8 text-white shadow-2xl">
      {/* Decorative elements */}
      <Wallet className="absolute right-4 top-4 h-16 w-16 text-indigo-200/20" />

      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <p className="text-indigo-100 text-sm font-medium mb-2">Total Balance</p>
            <div className="flex items-baseline gap-2">
              <span className="text-5xl font-bold">{balance}</span>
              <span className="text-2xl text-indigo-100">SC</span>
            </div>
          </div>
          <div className="text-right">
            <p className="inline-flex items-center gap-1 text-indigo-100 text-xs font-medium"><Coins className="h-3 w-3" /> ₹ {currencyValue}</p>
            <p className="text-indigo-200 text-10px">Equivalent</p>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8 pb-8 border-b border-indigo-500">
          <div>
            <p className="text-indigo-100 text-xs uppercase tracking-wider mb-1">Earned</p>
            <p className="text-2xl font-bold">+0</p>
          </div>
          <div>
            <p className="text-indigo-100 text-xs uppercase tracking-wider mb-1">Spent</p>
            <p className="text-2xl font-bold">-0</p>
          </div>
          <div>
            <p className="text-indigo-100 text-xs uppercase tracking-wider mb-1">Available</p>
            <p className="text-2xl font-bold">{balance}</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <motion.button
            whileTap={{ scale: 0.96 }}
            onClick={onAddCoins}
            className="flex-1 bg-white text-indigo-700 font-semibold py-3 rounded-lg hover:bg-indigo-50 transition-colors duration-200 flex items-center justify-center gap-2"
          >
            <ArrowUpRight className="h-4 w-4" /> Add SkillCoins
          </motion.button>
        </div>
      </div>
    </div>
  );
}
