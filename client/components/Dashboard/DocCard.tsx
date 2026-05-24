'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { DocumentType, User } from '../../types';
import { useStore } from '../../lib/store';
import {
  FileText,
  Trash2,
  Edit2,
  Check,
  X,
  Users,
  Calendar,
  ExternalLink,
  ChevronRight
} from 'lucide-react';

interface DocCardProps {
  doc: DocumentType;
  currentUser: User;
  onRefresh: () => void;
}

export const DocCard: React.FC<DocCardProps> = ({ doc, currentUser, onRefresh }) => {
  const { deleteDocument, renameDocument } = useStore();
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(doc.title);
  const [loading, setLoading] = useState(false);

  const isOwner =
    typeof doc.owner === 'object'
      ? doc.owner._id === currentUser.id
      : doc.owner === currentUser.id;

  const ownerName =
    typeof doc.owner === 'object'
      ? doc.owner._id === currentUser.id
        ? 'Me'
        : doc.owner.name
      : 'Unknown';

  const handleRename = async () => {
    if (!title.trim() || title.trim() === doc.title) {
      setIsEditing(false);
      setTitle(doc.title);
      return;
    }

    setLoading(true);
    try {
      await renameDocument(doc._id, title.trim());
      setIsEditing(false);
      onRefresh();
    } catch (err: any) {
      alert(err.message || 'Failed to rename document');
      setTitle(doc.title);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (window.confirm(`Are you sure you want to delete "${doc.title}"? This cannot be undone.`)) {
      setLoading(true);
      try {
        await deleteDocument(doc._id);
        onRefresh();
      } catch (err: any) {
        alert(err.message || 'Failed to delete document');
      } finally {
        setLoading(false);
      }
    }
  };

  // Format date nicely
  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch (e) {
      return dateStr;
    }
  };

  return (
    <div className="group relative overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950/40 p-5 transition-all duration-300 hover:border-zinc-700 hover:bg-zinc-950 hover:shadow-[0_8px_30px_rgb(0,0,0,0.4)]">
      
      {/* Top Banner Accent */}
      <div className={`absolute top-0 left-0 right-0 h-[2px] transition-all duration-300 ${
        isOwner 
          ? 'bg-indigo-500 shadow-[0_1px_10px_rgba(99,102,241,0.5)]' 
          : 'bg-emerald-500 shadow-[0_1px_10px_rgba(16,185,129,0.5)]'
      }`} />

      {/* Header Info */}
      <div className="flex items-start justify-between">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-zinc-800 bg-zinc-900/50 text-indigo-400 group-hover:scale-105 transition-all duration-300">
          <FileText className="h-5.5 w-5.5" />
        </div>

        <div className="flex items-center gap-2">
          {/* Owner Badge */}
          <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-semibold tracking-wide uppercase border ${
            isOwner
              ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'
              : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
          }`}>
            {isOwner ? 'Owner' : 'Collaborator'}
          </span>
        </div>
      </div>

      {/* Title / Input */}
      <div className="mt-4 min-h-[48px]">
        {isEditing ? (
          <div className="flex items-center gap-2 w-full">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleRename();
                if (e.key === 'Escape') {
                  setIsEditing(false);
                  setTitle(doc.title);
                }
              }}
              autoFocus
              className="w-full rounded-lg border border-indigo-500 bg-zinc-900 px-2.5 py-1 text-sm font-semibold text-white outline-none focus:ring-1 focus:ring-indigo-500"
            />
            <button
              onClick={handleRename}
              disabled={loading}
              className="rounded p-1 text-emerald-400 hover:bg-zinc-800 hover:text-emerald-300 cursor-pointer"
            >
              <Check className="h-4 w-4" />
            </button>
            <button
              onClick={() => {
                setIsEditing(false);
                setTitle(doc.title);
              }}
              disabled={loading}
              className="rounded p-1 text-red-400 hover:bg-zinc-800 hover:text-red-300 cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <h3 className="text-base font-bold text-zinc-100 group-hover:text-indigo-400 transition-colors line-clamp-1">
            <Link href={`/editor/${doc._id}`}>{doc.title}</Link>
          </h3>
        )}
        <p className="text-xs text-zinc-400 mt-1 flex items-center gap-1.5">
          <span className="font-semibold text-zinc-300">By:</span> {ownerName}
        </p>
      </div>

      {/* Meta Footer */}
      <div className="mt-5 flex items-center justify-between border-t border-zinc-900 pt-4 text-[11px] text-zinc-400">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1">
            <Calendar className="h-3.5 w-3.5" />
            {formatDate(doc.updatedAt)}
          </span>
          {doc.collaborators.length > 0 && (
            <span className="flex items-center gap-1">
              <Users className="h-3.5 w-3.5" />
              {doc.collaborators.length}
            </span>
          )}
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1">
          {isOwner && (
            <>
              <button
                onClick={() => setIsEditing(true)}
                disabled={loading}
                className="rounded-lg p-1.5 hover:bg-zinc-800 hover:text-white transition-all cursor-pointer"
                title="Rename Document"
              >
                <Edit2 className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={handleDelete}
                disabled={loading}
                className="rounded-lg p-1.5 hover:bg-zinc-800 hover:text-red-400 transition-all cursor-pointer"
                title="Delete Document"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </>
          )}
          <Link
            href={`/editor/${doc._id}`}
            className="rounded-lg p-1.5 text-indigo-400 hover:bg-zinc-800 hover:text-indigo-300 transition-all"
            title="Open Editor"
          >
            <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>
  );
};

export default DocCard;
