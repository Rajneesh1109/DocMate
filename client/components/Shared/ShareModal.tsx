'use client';

import React, { useState } from 'react';
import { useStore } from '../../lib/store';
import { X, Send, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { Collaborator } from '../../types';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  docId: string;
  docTitle: string;
  collaboratorsList?: Collaborator[];
  onCollaboratorAdded?: () => void;
}

export const ShareModal: React.FC<ShareModalProps> = ({
  isOpen,
  onClose,
  docId,
  docTitle,
  collaboratorsList = [],
  onCollaboratorAdded
}) => {
  const { shareDocument } = useStore();
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'editor' | 'viewer'>('editor');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      await shareDocument(docId, email.trim().toLowerCase(), role);
      setSuccess(`Successfully invited ${email} as ${role}!`);
      setEmail('');
      if (onCollaboratorAdded) {
        onCollaboratorAdded();
      }
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to share document.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-md overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950 shadow-[0_0_50px_rgba(99,102,241,0.15)] transition-all duration-300">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800 px-6 py-4">
          <div>
            <h3 className="text-lg font-bold text-white">Share Document</h3>
            <p className="text-xs text-zinc-400 mt-0.5 truncate max-w-[280px]">
              Invite others to collaborate on <span className="text-indigo-400 font-semibold">{docTitle}</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="flex items-start gap-2.5 rounded-xl border border-red-500/20 bg-red-500/5 p-3.5 text-sm text-red-400">
              <ShieldAlert className="h-5 w-5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="flex items-start gap-2.5 rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3.5 text-sm text-emerald-400">
              <CheckCircle2 className="h-5 w-5 shrink-0" />
              <span>{success}</span>
            </div>
          )}

          <div>
            <label htmlFor="email" className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
              Email Address
            </label>
            <input
              type="email"
              id="email"
              placeholder="collaborator@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm text-white placeholder-zinc-500 outline-none transition-all focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
              Permission Role
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setRole('editor')}
                className={`flex flex-col items-start gap-1 rounded-xl border px-4 py-3 text-left transition-all cursor-pointer ${
                  role === 'editor'
                    ? 'border-indigo-500 bg-indigo-500/10 text-white'
                    : 'border-zinc-800 bg-zinc-900/40 text-zinc-400 hover:border-zinc-700'
                }`}
              >
                <span className="text-sm font-semibold">Editor</span>
                <span className="text-[10px] opacity-70">Can view, edit & format text</span>
              </button>
              <button
                type="button"
                onClick={() => setRole('viewer')}
                className={`flex flex-col items-start gap-1 rounded-xl border px-4 py-3 text-left transition-all cursor-pointer ${
                  role === 'viewer'
                    ? 'border-indigo-500 bg-indigo-500/10 text-white'
                    : 'border-zinc-800 bg-zinc-900/40 text-zinc-400 hover:border-zinc-700'
                }`}
              >
                <span className="text-sm font-semibold">Viewer</span>
                <span className="text-[10px] opacity-70">Read only, cannot write</span>
              </button>
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading || !email}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white transition-all hover:bg-indigo-500 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none cursor-pointer shadow-[0_4px_12px_rgba(99,102,241,0.25)]"
            >
              {loading ? (
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  <span>Send Invitation</span>
                </>
              )}
            </button>
          </div>
        </form>

        {/* Collaborators List */}
        {collaboratorsList.length > 0 && (
          <div className="border-t border-zinc-900 bg-zinc-900/20 px-6 py-4">
            <h4 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2.5">
              Active Collaborators ({collaboratorsList.length})
            </h4>
            <div className="max-h-36 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
              {collaboratorsList.map((collab, index) => (
                <div key={index} className="flex items-center justify-between rounded-lg border border-zinc-900 bg-zinc-950 px-3 py-2 text-xs">
                  <span className="font-medium text-zinc-300 truncate max-w-[250px]">{collab.email}</span>
                  <span className={`rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
                    collab.role === 'editor'
                      ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                      : 'bg-zinc-800 text-zinc-400 border border-zinc-700/30'
                  }`}>
                    {collab.role}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ShareModal;
