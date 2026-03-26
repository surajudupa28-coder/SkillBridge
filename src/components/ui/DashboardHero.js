'use client';
import { motion } from 'framer-motion';
import { Wallet, ShieldCheck, Star, BookOpen } from 'lucide-react';
import StatsCard from './StatsCard';

export default function DashboardHero({ userName, walletBalance = 0, verifiedSkills = 0, reputation = 0, sessions = 0 }) {
  return (
    <motion.section initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="mb-8 rounded-3xl border border-white/10 bg-gradient-to-r from-indigo-600 to-cyan-500 p-6 shadow-2xl sm:p-8">
      <p className="text-xs uppercase tracking-[0.2em] text-indigo-100">Dashboard</p>
      <h1 className="mt-2 text-3xl font-bold text-white sm:text-4xl">Welcome back, {userName}</h1>
      <p className="mt-2 max-w-2xl text-sm text-indigo-100">Track your mentorship growth, skills verification progress, and wallet activity in one place.</p>
      <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatsCard title="Wallet Balance" value={`${walletBalance} SC`} subtitle="SkillCoins available" icon={Wallet} accent="emerald" />
        <StatsCard title="Verified Skills" value={verifiedSkills} subtitle="Skill badges earned" icon={ShieldCheck} accent="cyan" />
        <StatsCard title="Reputation Score" value={Number(reputation || 0).toFixed(1)} subtitle="Out of 10" icon={Star} accent="indigo" />
        <StatsCard title="Sessions Completed" value={sessions} subtitle="Mentoring milestones" icon={BookOpen} accent="amber" />
      </div>
    </motion.section>
  );
}
