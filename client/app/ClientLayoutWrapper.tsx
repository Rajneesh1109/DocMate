'use client';

import React, { useEffect } from 'react';
import { useStore } from '../lib/store';
import Navbar from '../components/Shared/Navbar';

export default function ClientLayoutWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const initializeAuth = useStore((state) => state.initializeAuth);

  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  return (
    <div className="flex min-h-screen flex-col bg-zinc-950 text-zinc-100 selection:bg-indigo-500/30">
      <Navbar />
      <main className="flex-1 flex flex-col">{children}</main>
    </div>
  );
}
