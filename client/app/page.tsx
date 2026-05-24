'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '../lib/store';

export default function Home() {
  const { isAuthenticated, isAuthLoading } = useStore();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthLoading) {
      if (isAuthenticated) {
        router.replace('/dashboard');
      } else {
        router.replace('/login');
      }
    }
  }, [isAuthenticated, isAuthLoading, router]);

  return (
    <div className="flex flex-1 items-center justify-center bg-zinc-950">
      <div className="flex flex-col items-center gap-4">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent" />
        <p className="text-sm text-zinc-500">Loading DocMate...</p>
      </div>
    </div>
  );
}
