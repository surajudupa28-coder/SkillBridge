'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { BarChart3, BadgeCheck, Compass, Crown, LayoutDashboard, Sparkles, Trophy, UserCircle2, Users, Wallet2 } from 'lucide-react';

const sections = [
  {
    title: 'Core',
    items: [
      { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { href: '/profile', label: 'Profile', icon: UserCircle2 },
      { href: '/sessions', label: 'Sessions', icon: BadgeCheck }
    ]
  },
  {
    title: 'Growth',
    items: [
      { href: '/mentors', label: 'Find Mentors', icon: Users },
      { href: '/wallet', label: 'Wallet', icon: Wallet2 },
      { href: '/leaderboard', label: 'Leaderboard', icon: Trophy },
      { href: '/career-insights', label: 'Career Insights', icon: Sparkles }
    ]
  },
  {
    title: 'Explore',
    items: [
      { href: '/placements', label: 'Premium', icon: Crown },
      { href: '/dashboard/trending-skills', label: 'Trending Skills', icon: BarChart3 },
      { href: '/badges', label: 'Badges', icon: Compass }
    ]
  }
];

export default function SidebarNavigation({ onNavigate }) {
  const pathname = usePathname();

  return (
    <div className="space-y-6">
      {sections.map((section) => (
        <div key={section.title}>
          <p className="mb-2 px-4 text-[11px] font-semibold uppercase tracking-wider text-slate-500">{section.title}</p>
          <div className="space-y-1">
            {section.items.map((item) => {
              const Icon = item.icon;
              const active = pathname === item.href;
              return (
                <motion.div key={item.href} whileHover={{ x: 3 }} transition={{ duration: 0.15 }}>
                  <Link
                    href={item.href}
                    onClick={onNavigate}
                    className={`flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm transition-colors ${
                      active
                        ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30'
                        : 'text-slate-300 hover:bg-slate-900 hover:text-white border border-transparent'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                </motion.div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
