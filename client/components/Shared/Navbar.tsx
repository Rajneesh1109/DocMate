'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useStore } from '../../lib/store';
import { FileText, LogOut, User as UserIcon } from 'lucide-react';

export const Navbar = () => {
  const { user, logout, isAuthenticated } = useStore();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  if (!isAuthenticated || !user) {
    return null;
  }

  // Get initial letters for avatar
  const initials = user.name
    ? user.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : 'U';

  return (
    <nav className="sticky top-0 z-40 w-full border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-md">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <Link href="/dashboard" className="flex items-center gap-2 text-indigo-400 hover:text-indigo-300 transition-colors">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600/20 border border-indigo-500/30 shadow-[0_0_15px_rgba(99,102,241,0.15)]">
                <FileText className="h-5 w-5 text-indigo-400" />
              </div>
              <span className="text-xl font-bold tracking-tight text-white sm:block hidden">
                Doc<span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent font-extrabold">Mate</span>
              </span>
            </Link>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3 rounded-xl border border-zinc-800 bg-zinc-900/50 px-3 py-1.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-sm font-semibold text-white shadow-[0_2px_8px_rgba(99,102,241,0.3)]">
                {initials}
              </div>
              <div className="flex flex-col sm:flex hidden text-left">
                <span className="text-sm font-medium leading-none text-zinc-200">{user.name}</span>
                <span className="text-[11px] leading-none text-zinc-400 mt-1">{user.email}</span>
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="flex h-10 w-10 sm:w-auto items-center justify-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900 px-3 text-sm font-medium text-zinc-400 hover:bg-zinc-800 hover:text-white transition-all duration-200 cursor-pointer"
              title="Sign Out"
            >
              <LogOut className="h-4 w-4" />
              <span className="sm:inline hidden">Sign Out</span>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
