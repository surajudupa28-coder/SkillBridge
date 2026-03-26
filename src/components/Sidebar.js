'use client';
import { useState } from 'react';
import { useUser, useClerk } from '@clerk/nextjs';
import { motion } from 'framer-motion';
import { LogOut, Menu, X } from 'lucide-react';
import SidebarNavigation from '@/components/ui/SidebarNavigation';

export default function Sidebar() {
  const { user, isLoaded } = useUser();
  const { signOut } = useClerk();
  const [open, setOpen] = useState(false);

  if (!isLoaded) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed left-4 top-4 z-[60] rounded-lg border border-slate-700 bg-slate-950/90 p-2 text-slate-200 shadow-lg backdrop-blur lg:hidden"
      >
        <Menu className="h-5 w-5" />
      </button>

      {open && (
        <button
          type="button"
          aria-label="Close sidebar overlay"
          onClick={() => setOpen(false)}
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
        />
      )}

      <aside className={`fixed left-0 top-0 z-50 flex h-screen w-64 flex-col border-r border-slate-800 bg-slate-950/95 text-white backdrop-blur transition-transform duration-200 ${open ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}>
        <div className="flex items-start justify-between border-b border-slate-800 p-6">
          <div>
            <h1 className="text-xl font-bold text-slate-100">
              <span className="text-indigo-400">Skill</span>Bridge AI
            </h1>
            <p className="mt-1 text-xs text-slate-400">Peer-to-Peer Skill Marketplace</p>
          </div>
          <button type="button" onClick={() => setOpen(false)} className="rounded-md p-1 text-slate-400 hover:bg-slate-900 hover:text-slate-200 lg:hidden">
            <X className="h-4 w-4" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto p-4">
          <SidebarNavigation onNavigate={() => setOpen(false)} />
        </nav>

        <div className="border-t border-slate-800 p-4">
          {user && (
            <div className="mb-3 px-2">
              <p className="truncate text-sm font-medium">{user.firstName || user.username}</p>
              <p className="truncate text-xs text-slate-400">{user.primaryEmailAddress?.emailAddress}</p>
            </div>
          )}
          <motion.button
            whileTap={{ scale: 0.96 }}
            onClick={() => signOut({ redirectUrl: '/login' })}
            className="flex w-full items-center gap-2 rounded-lg px-4 py-2 text-left text-sm text-slate-300 transition-colors hover:bg-slate-900 hover:text-white"
          >
            <LogOut className="h-4 w-4" /> Logout
          </motion.button>
        </div>
      </aside>
    </>
  );
}
