'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '../../lib/store';
import DocCard from '../../components/Dashboard/DocCard';
import { Plus, RefreshCw, FileText, Search, Loader2 } from 'lucide-react';

export default function DashboardPage() {
  const {
    user,
    isAuthenticated,
    isAuthLoading,
    documents,
    isDocsLoading,
    docsError,
    fetchDocuments,
    createDocument,
  } = useStore();
  const router = useRouter();

  const [searchQuery, setSearchQuery] = useState('');
  const [creating, setCreating] = useState(false);

  // Authenticated route protection
  useEffect(() => {
    if (!isAuthLoading && !isAuthenticated) {
      router.replace('/login');
    }
  }, [isAuthenticated, isAuthLoading, router]);

  // Fetch documents on mount
  useEffect(() => {
    if (isAuthenticated) {
      fetchDocuments();
    }
  }, [isAuthenticated, fetchDocuments]);

  const handleCreateDocument = async () => {
    setCreating(true);
    try {
      const doc = await createDocument('Untitled Document');
      if (doc) {
        router.push(`/editor/${doc._id}`);
      }
    } catch (e) {
      console.error(e);
      alert('Failed to create new document');
    } finally {
      setCreating(false);
    }
  };

  // Filter docs by title
  const filteredDocs = documents.filter((doc) =>
    doc.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isAuthLoading || !isAuthenticated || !user) {
    return (
      <div className="flex flex-1 items-center justify-center bg-zinc-950">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-indigo-500" />
          <p className="text-sm text-zinc-500">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8 flex-1 flex flex-col">
      {/* Dashboard Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-zinc-900 pb-6 mb-8">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white">
            My Documents
          </h1>
          <p className="text-sm text-zinc-400 mt-1">
            Create, collaborate, and manage all your documents in one workspace.
          </p>
        </div>

        <button
          onClick={handleCreateDocument}
          disabled={creating || isDocsLoading}
          className="flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white transition-all hover:bg-indigo-500 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none cursor-pointer shadow-[0_4px_12px_rgba(99,102,241,0.25)] sm:w-auto w-full"
        >
          {creating ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Plus className="h-4.5 w-4.5" />
          )}
          <span>New Document</span>
        </button>
      </div>

      {/* Toolbar & Search */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between mb-6">
        <div className="relative w-full sm:max-w-xs">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-zinc-500">
            <Search className="h-4 w-4" />
          </span>
          <input
            type="text"
            placeholder="Search documents..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-zinc-900 bg-zinc-900/30 pl-9 pr-4 py-2.5 text-sm text-white placeholder-zinc-500 outline-none transition-all focus:border-indigo-500 focus:bg-zinc-900/60 focus:ring-1 focus:ring-indigo-500"
          />
        </div>

        <button
          onClick={() => fetchDocuments()}
          disabled={isDocsLoading}
          className="flex h-10 items-center justify-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900/30 px-4 text-xs font-semibold text-zinc-400 hover:bg-zinc-900 hover:text-white transition-all duration-200 cursor-pointer sm:w-auto w-full"
          title="Refresh List"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isDocsLoading ? 'animate-spin text-indigo-400' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Docs Grid / Skeleton */}
      {isDocsLoading && documents.length === 0 ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="animate-pulse rounded-2xl border border-zinc-900 bg-zinc-900/10 p-5 space-y-4">
              <div className="flex justify-between">
                <div className="h-11 w-11 rounded-xl bg-zinc-900" />
                <div className="h-5 w-16 rounded bg-zinc-900" />
              </div>
              <div className="space-y-2 mt-4">
                <div className="h-4 w-3/4 rounded bg-zinc-900" />
                <div className="h-3 w-1/2 rounded bg-zinc-900" />
              </div>
              <div className="border-t border-zinc-900/60 pt-4 flex justify-between">
                <div className="h-3 w-20 rounded bg-zinc-900" />
                <div className="h-6 w-6 rounded-lg bg-zinc-900" />
              </div>
            </div>
          ))}
        </div>
      ) : docsError ? (
        <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-6 text-center">
          <p className="text-sm font-semibold text-red-400">Error: {docsError}</p>
          <button
            onClick={() => fetchDocuments()}
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-zinc-900 px-4 py-2.5 text-xs font-semibold text-white hover:bg-zinc-800 transition-colors border border-zinc-800 cursor-pointer"
          >
            Retry
          </button>
        </div>
      ) : filteredDocs.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-800 bg-zinc-950/20 px-4 py-16 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-zinc-900/50 text-zinc-500">
            <FileText className="h-7 w-7" />
          </div>
          <h3 className="mt-4 text-base font-bold text-zinc-200">No documents found</h3>
          <p className="mt-1 text-sm text-zinc-500 max-w-sm">
            {searchQuery
              ? 'No documents matches your search terms. Try searching for a different title.'
              : 'Get started by creating your first document in DocMate.'}
          </p>
          {!searchQuery && (
            <button
              onClick={handleCreateDocument}
              disabled={creating}
              className="mt-6 flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-semibold text-white hover:bg-indigo-500 transition-all cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              Create Document
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredDocs.map((doc) => (
            <DocCard
              key={doc._id}
              doc={doc}
              currentUser={user}
              onRefresh={fetchDocuments}
            />
          ))}
        </div>
      )}
    </div>
  );
}
