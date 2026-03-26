'use client';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { BadgeCheck, Coins, Trophy, Users } from 'lucide-react';

export default function QuickActionsSection() {
  const router = useRouter();

  const actions = [
    {
      title: 'Add SkillCoins',
      description: 'Top up your wallet',
      icon: Coins,
      color: 'from-indigo-500 to-indigo-600',
      onClick: () => window.scrollTo({ top: 0, behavior: 'smooth' }) // Will trigger modal
    },
    {
      title: 'Book Mentor',
      description: 'Find a mentor',
      icon: Users,
      color: 'from-green-500 to-green-600',
      onClick: () => router.push('/mentors')
    },
    {
      title: 'Verify Skills',
      description: 'Prove your expertise',
      icon: BadgeCheck,
      color: 'from-blue-500 to-blue-600',
      onClick: () => router.push('/profile')
    },
    {
      title: 'Leaderboard',
      description: 'See top performers',
      icon: Trophy,
      color: 'from-amber-500 to-amber-600',
      onClick: () => router.push('/leaderboard')
    }
  ];

  return (
    <div>
      <h3 className="text-lg font-semibold text-slate-100 mb-4">Quick Actions</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {actions.map((action, index) => (
          <motion.button
            key={index}
            whileHover={{ y: -4, scale: 1.02 }}
            whileTap={{ scale: 0.96 }}
            onClick={action.onClick}
            className={`bg-gradient-to-br ${action.color} rounded-xl p-6 text-white shadow-lg border border-white/20`}
          >
            <div className="mb-3 inline-flex rounded-lg bg-black/15 p-2">
              <action.icon className="h-6 w-6" />
            </div>
            <h4 className="font-semibold text-sm">{action.title}</h4>
            <p className="text-xs opacity-90 mt-1">{action.description}</p>
          </motion.button>
        ))}
      </div>
    </div>
  );
}
