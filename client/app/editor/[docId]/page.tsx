'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useStore } from '../../../lib/store';
import getSocket from '../../../lib/socket';
import api from '../../../lib/api';
import EditorComponent from '../../../components/Editor/EditorComponent';
import CollaboratorCursors from '../../../components/Editor/CollaboratorCursors';
import ShareModal from '../../../components/Shared/ShareModal';
import { DocumentType, DocVersion, UserPresence } from '../../../types';
import {
  ChevronLeft,
  Users,
  Share2,
  History,
  CheckCircle,
  Clock,
  ArrowLeft,
  Loader2,
  Calendar,
  User as UserIcon,
  X
} from 'lucide-react';

// Pastel colors list for cursor designations
const CURSOR_COLORS = [
  '#6366f1', // Indigo
  '#ec4899', // Pink
  '#10b981', // Emerald
  '#f59e0b', // Amber
  '#3b82f6', // Blue
  '#8b5cf6', // Violet
  '#ef4444', // Red
  '#14b8a6', // Teal
];

const getColorForUser = (userId: string) => {
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = userId.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash % CURSOR_COLORS.length);
  return CURSOR_COLORS[index];
};

export default function EditorPage() {
  const { docId } = useParams() as { docId: string };
  const router = useRouter();
  const {
    user,
    isAuthenticated,
    isAuthLoading,
    roomUsers,
    setRoomUsers,
    addRoomUser,
    removeRoomUser
  } = useStore();

  const [doc, setDoc] = useState<DocumentType | null>(null);
  const [docTitle, setDocTitle] = useState('');
  const [role, setRole] = useState<'editor' | 'viewer'>('viewer');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Sharing & Versions
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [versions, setVersions] = useState<DocVersion[]>([]);
  const [selectedVersion, setSelectedVersion] = useState<DocVersion | null>(null);
  const [fetchingVersions, setFetchingVersions] = useState(false);

  // States for save status
  const [saveStatus, setSaveStatus] = useState<'Saved' | 'Saving...'>('Saved');
  const titleDebounceTimeout = useRef<NodeJS.Timeout | null>(null);

  // Socket
  const socket = getSocket();
  const userColor = user ? getColorForUser(user.id) : '#6366f1';

  // Authenticated route protection
  useEffect(() => {
    if (!isAuthLoading && !isAuthenticated) {
      router.replace('/login');
    }
  }, [isAuthenticated, isAuthLoading, router]);

  // Fetch document details & handle socket room connection
  useEffect(() => {
    if (!isAuthenticated || !user || !docId) return;

    const loadDocument = async () => {
      try {
        setLoading(true);
        setError(null);

        const res = await api.get<DocumentType>(`/docs/${docId}`);
        const document = res.data;
        setDoc(document);
        setDocTitle(document.title);

        // Determine user permission role
        const isOwner = typeof document.owner === 'object' 
          ? document.owner._id === user.id 
          : document.owner === user.id;

        if (isOwner) {
          setRole('editor');
        } else {
          const collab = document.collaborators.find(
            (c) => c.email.toLowerCase() === user.email.toLowerCase()
          );
          setRole(collab?.role || 'viewer');
        }

        // --- Socket Room Connection ---
        socket.connect();
        socket.emit('join-room', {
          docId,
          userId: user.id,
          name: user.name,
          email: user.email,
          color: userColor,
        });

      } catch (err: any) {
        console.error('[Editor Load] Error:', err);
        setError(err.response?.data?.error || 'Document not found or access denied.');
      } finally {
        setLoading(false);
      }
    };

    loadDocument();

    // Socket Event Listeners
    socket.on('room-users', (users: UserPresence[]) => {
      setRoomUsers(users);
    });

    socket.on('user-joined', (newUser: UserPresence) => {
      addRoomUser(newUser);
    });

    socket.on('user-left', ({ socketId }) => {
      removeRoomUser(socketId);
    });

    socket.on('title-updated', ({ title }: { title: string }) => {
      setDocTitle(title);
    });

    // Cleanup on unmount
    return () => {
      socket.emit('leave-room', { docId });
      socket.off('room-users');
      socket.off('user-joined');
      socket.off('user-left');
      socket.off('title-updated');
      socket.disconnect();
    };
  }, [docId, user, isAuthenticated, setRoomUsers, addRoomUser, removeRoomUser, userColor, socket]);

  // Fetch versions
  const fetchVersions = async () => {
    setFetchingVersions(true);
    try {
      const res = await api.get<DocVersion[]>(`/docs/${docId}/versions`);
      // Sort: newest first
      setVersions(res.data.reverse());
    } catch (e) {
      console.error('Failed to load version history:', e);
    } finally {
      setFetchingVersions(false);
    }
  };

  // Toggle version history sidebar
  const handleToggleHistory = () => {
    setIsHistoryOpen(!isHistoryOpen);
    if (!isHistoryOpen) {
      fetchVersions();
    }
  };

  // Handle document title updates locally + emit to server
  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (role !== 'editor') return;

    const newTitle = e.target.value;
    setDocTitle(newTitle);
    setSaveStatus('Saving...');

    // Emit live to other editors in the room
    socket.emit('title-update', { docId, title: newTitle });

    // Debounce database update
    if (titleDebounceTimeout.current) {
      clearTimeout(titleDebounceTimeout.current);
    }

    titleDebounceTimeout.current = setTimeout(async () => {
      try {
        await api.put(`/docs/${docId}`, { title: newTitle.trim() || 'Untitled Document' });
        setSaveStatus('Saved');
      } catch (err) {
        console.error('Failed to auto-save title to database:', err);
      }
    }, 1500);
  };

  // Restore version history snapshot
  const handleRestoreVersion = async (version: DocVersion) => {
    if (role !== 'editor') return;

    if (window.confirm(`Are you sure you want to restore "${version.title}" saved at ${new Date(version.savedAt).toLocaleString()}?`)) {
      try {
        setLoading(true);
        // Call restore API
        await api.post(`/docs/${docId}/versions/${version._id}/restore`);
        
        // Force full page reload to reload Tiptap Editor & Yjs content cleanly from DB
        window.location.reload();
      } catch (e: any) {
        alert(e.response?.data?.error || 'Failed to restore version');
        setLoading(false);
      }
    }
  };

  if (isAuthLoading || !isAuthenticated || !user) {
    return (
      <div className="flex flex-1 items-center justify-center bg-zinc-950">
        <Loader2 className="h-10 w-10 animate-spin text-indigo-500" />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center bg-zinc-950">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-indigo-500" />
          <p className="text-sm text-zinc-500">Loading document session...</p>
        </div>
      </div>
    );
  }

  if (error || !doc) {
    return (
      <div className="flex flex-1 items-center justify-center bg-zinc-950 p-6 text-center">
        <div className="w-full max-w-md rounded-2xl border border-red-500/20 bg-red-500/5 p-8">
          <h3 className="text-lg font-bold text-red-400">Access Error</h3>
          <p className="text-sm text-zinc-400 mt-2">{error || 'Unable to open document.'}</p>
          <Link
            href="/dashboard"
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-zinc-900 px-4 py-2.5 text-xs font-semibold text-white hover:bg-zinc-800 transition-colors border border-zinc-800 cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col bg-zinc-950 select-none">
      
      {/* Editor Header Bar */}
      <header className="border-b border-zinc-900 bg-zinc-950 px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          
          {/* Document Title Section */}
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-900 hover:text-white transition-colors border border-zinc-900"
              title="Back to Dashboard"
            >
              <ChevronLeft className="h-5 w-5" />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={docTitle}
                  onChange={handleTitleChange}
                  disabled={role !== 'editor'}
                  placeholder="Untitled Document"
                  className="bg-transparent text-lg font-bold text-white outline-none border-b border-transparent focus:border-indigo-500 transition-all max-w-[200px] sm:max-w-md truncate"
                />
                
                {/* Save Status Indicator */}
                <span className="flex items-center gap-1 text-[10px] font-semibold text-zinc-500 select-none bg-zinc-900 px-2 py-0.5 rounded border border-zinc-850">
                  {saveStatus === 'Saved' ? (
                    <>
                      <CheckCircle className="h-3 w-3 text-emerald-500" />
                      <span className="text-zinc-400">Saved</span>
                    </>
                  ) : (
                    <>
                      <Loader2 className="h-3 w-3 animate-spin text-indigo-400" />
                      <span className="text-zinc-400">Saving...</span>
                    </>
                  )}
                </span>
              </div>
              <p className="text-[10px] text-zinc-500 mt-0.5">
                Shareable document ID: <span className="font-mono text-zinc-400">{docId}</span>
              </p>
            </div>
          </div>

          {/* User Presence & Call-to-Actions */}
          <div className="flex items-center gap-3 sm:justify-end justify-between">
            {/* Online Presence Avatars */}
            <CollaboratorCursors users={roomUsers} currentUserSocketId={socket.id || null} />
            
            <div className="h-5 w-[1px] bg-zinc-900" />

            <div className="flex items-center gap-2">
              <button
                onClick={handleToggleHistory}
                className={`flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-semibold transition-all cursor-pointer ${
                  isHistoryOpen
                    ? 'border-indigo-500 bg-indigo-500/10 text-white'
                    : 'border-zinc-850 bg-zinc-900/30 text-zinc-400 hover:text-white'
                }`}
                title="Version History"
              >
                <History className="h-4 w-4" />
                <span className="sm:inline hidden">History</span>
              </button>

              <button
                onClick={() => setIsShareOpen(true)}
                className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3.5 py-2 text-xs font-semibold text-white transition-all hover:bg-indigo-500 active:scale-[0.98] cursor-pointer shadow-[0_4px_10px_rgba(99,102,241,0.2)]"
                title="Share Document"
              >
                <Share2 className="h-4 w-4" />
                <span>Share</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Workspace Area */}
      <div className="flex flex-1 overflow-hidden relative">
        <div className="flex-1 overflow-y-auto px-4 py-8 sm:px-6 lg:px-8 select-text">
          <div className="mx-auto max-w-4xl">
            <EditorComponent
              docId={docId}
              currentUser={user}
              userColor={userColor}
              role={role}
            />
          </div>
        </div>

        {/* Version History Sidebar */}
        {isHistoryOpen && (
          <aside className="w-80 border-l border-zinc-900 bg-zinc-950 flex flex-col z-30 shrink-0">
            <div className="flex items-center justify-between border-b border-zinc-900 px-5 py-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                <History className="h-4.5 w-4.5 text-indigo-400" />
                Version History
              </h3>
              <button
                onClick={() => setIsHistoryOpen(false)}
                className="rounded-lg p-1 text-zinc-400 hover:bg-zinc-900 hover:text-white transition-colors cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Version List Body */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
              {fetchingVersions ? (
                <div className="flex h-40 flex-col items-center justify-center gap-2">
                  <Loader2 className="h-6 w-6 animate-spin text-indigo-500" />
                  <span className="text-xs text-zinc-500">Fetching history...</span>
                </div>
              ) : versions.length === 0 ? (
                <div className="text-center py-8">
                  <Clock className="h-8 w-8 text-zinc-600 mx-auto" />
                  <p className="text-xs text-zinc-400 mt-2 font-medium">No snapshots saved yet.</p>
                  <p className="text-[10px] text-zinc-600 mt-1 max-w-[200px] mx-auto">
                    Versions save automatically every 60 seconds of activity.
                  </p>
                </div>
              ) : (
                versions.map((ver) => {
                  const saveDate = new Date(ver.savedAt);
                  const saverName = ver.savedBy ? (ver.savedBy as any).name : 'Owner';
                  const isCurVer = ver._id === selectedVersion?._id;

                  return (
                    <div
                      key={ver._id}
                      className={`group rounded-xl border p-3.5 transition-all text-left ${
                        isCurVer
                          ? 'border-indigo-500 bg-indigo-500/5'
                          : 'border-zinc-900 bg-zinc-950 hover:border-zinc-800'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h4 className="text-xs font-bold text-zinc-200 group-hover:text-indigo-400 transition-colors">
                            {ver.title}
                          </h4>
                          <span className="text-[10px] text-zinc-500 flex items-center gap-1 mt-1">
                            <Calendar className="h-3 w-3" />
                            {saveDate.toLocaleDateString()} at {saveDate.toLocaleTimeString()}
                          </span>
                          <span className="text-[10px] text-zinc-500 flex items-center gap-1 mt-0.5">
                            <UserIcon className="h-3 w-3" />
                            Saved by {saverName}
                          </span>
                        </div>
                      </div>

                      {/* Preview / Restore Actions */}
                      <div className="mt-3.5 flex gap-2">
                        <button
                          onClick={() => setSelectedVersion(isCurVer ? null : ver)}
                          className="flex-1 rounded-lg border border-zinc-800 bg-zinc-900 py-1.5 text-[10px] font-semibold text-zinc-300 hover:text-white transition-all cursor-pointer text-center"
                        >
                          {isCurVer ? 'Hide Preview' : 'Preview'}
                        </button>
                        {role === 'editor' && (
                          <button
                            onClick={() => handleRestoreVersion(ver)}
                            className="flex-1 rounded-lg bg-indigo-600 py-1.5 text-[10px] font-bold text-white hover:bg-indigo-500 transition-all cursor-pointer text-center"
                          >
                            Restore
                          </button>
                        )}
                      </div>

                      {/* In-Line Preview Content */}
                      {isCurVer && (
                        <div className="mt-3 rounded-lg border border-zinc-900 bg-zinc-950 p-2.5 max-h-32 overflow-y-auto text-[10px] text-zinc-400 font-mono select-text whitespace-pre-wrap">
                          {ver.content ? ver.content.replace(/<[^>]*>/g, '') : '(Empty content)'}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </aside>
        )}
      </div>

      {/* Sharing Invite Modal */}
      <ShareModal
        isOpen={isShareOpen}
        onClose={() => setIsShareOpen(false)}
        docId={docId}
        docTitle={docTitle}
        collaboratorsList={doc.collaborators}
        onCollaboratorAdded={async () => {
          // Refresh document details to get updated collaborators list
          try {
            const res = await api.get<DocumentType>(`/docs/${docId}`);
            setDoc(res.data);
          } catch (e) {
            console.error('Failed to refresh collaborators:', e);
          }
        }}
      />
    </div>
  );
}
