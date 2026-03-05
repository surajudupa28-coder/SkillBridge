'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: '\u25EB' },
  { href: '/mentors', label: 'Find Mentors', icon: '\u26B2' },
  { href: '/sessions', label: 'Sessions', icon: '\u25A6' },
  { href: '/wallet', label: 'Wallet', icon: '\u25C8' },
  { href: '/leaderboard', label: 'Leaderboard', icon: '\u2605' },
  { href: '/profile', label: 'Profile', icon: '\u25C9' },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-gray-900 text-white flex flex-col z-50">
      <div className="p-6 border-b border-gray-800">
        <h1 className="text-xl font-bold">
          <span className="text-indigo-400">Skill</span>Bridge AI
        </h1>
        <p className="text-xs text-gray-400 mt-1">Peer-to-Peer Skill Marketplace</p>
      </div>
      <nav className="flex-1 py-4 overflow-y-auto">
        {navItems.map((item) => (
          <Link key={item.href} href={item.href}
            className={`flex items-center gap-3 px-6 py-3 text-sm transition-colors ${
              pathname === item.href ? 'bg-indigo-600 text-white' : 'text-gray-300 hover:bg-gray-800 hover:text-white'
            }`}>
            <span className="text-lg">{item.icon}</span>
            {item.label}
          </Link>
        ))}
        {user?.role === 'admin' && (
          <Link href="/admin"
            className={`flex items-center gap-3 px-6 py-3 text-sm transition-colors ${
              pathname === '/admin' ? 'bg-indigo-600 text-white' : 'text-gray-300 hover:bg-gray-800 hover:text-white'
            }`}>
            <span className="text-lg">{'\u2699'}</span>Admin
          </Link>
        )}
        {(user?.role === 'company' || user?.role === 'admin') && (
          <Link href="/talent"
            className={`flex items-center gap-3 px-6 py-3 text-sm transition-colors ${
              pathname === '/talent' ? 'bg-indigo-600 text-white' : 'text-gray-300 hover:bg-gray-800 hover:text-white'
            }`}>
            <span className="text-lg">{'\u25C6'}</span>Talent Intelligence
          </Link>
        )}
      </nav>
      <div className="p-4 border-t border-gray-800">
        {user && (
          <div className="mb-3 px-2">
            <p className="text-sm font-medium truncate">{user.name}</p>
            <p className="text-xs text-gray-400 truncate">{user.email}</p>
          </div>
        )}
        <button onClick={logout}
          className="w-full px-4 py-2 text-sm text-gray-300 hover:text-white hover:bg-gray-800 rounded transition-colors text-left">
          {'\u21AA'} Logout
        </button>
      </div>
    </aside>
  );
}
