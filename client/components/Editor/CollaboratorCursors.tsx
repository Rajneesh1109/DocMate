'use client';

import React from 'react';
import { UserPresence } from '../../types';

interface CollaboratorCursorsProps {
  users: UserPresence[];
  currentUserSocketId: string | null;
}

export const CollaboratorCursors: React.FC<CollaboratorCursorsProps> = ({
  users,
  currentUserSocketId,
}) => {
  // Exclude current user from counting or display, or display them separately
  const activeCollaborators = users.filter((u) => u.socketId !== currentUserSocketId);

  return (
    <div className="flex items-center gap-1.5">
      <div className="flex -space-x-2.5 overflow-hidden">
        {users.map((collab) => {
          const initials = collab.name
            ? collab.name
                .split(' ')
                .map((n) => n[0])
                .join('')
                .toUpperCase()
                .slice(0, 2)
            : 'U';

          const isMe = collab.socketId === currentUserSocketId;

          return (
            <div
              key={collab.socketId}
              className="relative group transition-transform duration-200 hover:-translate-y-0.5 hover:z-10"
            >
              {/* Avatar Bubble */}
              <div
                className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold text-zinc-100 border-2 select-none shadow-md transition-all duration-200"
                style={{
                  backgroundColor: collab.color,
                  borderColor: collab.color,
                }}
              >
                {initials}
              </div>

              {/* Ping Ring for online state */}
              <span
                className="absolute bottom-0 right-0 block h-2.5 w-2.5 rounded-full ring-2 ring-zinc-950"
                style={{ backgroundColor: collab.color }}
              />

              {/* Tooltip */}
              <div className="absolute top-10 right-1/2 translate-x-1/2 scale-0 group-hover:scale-100 transition-all duration-200 origin-top pointer-events-none z-50 bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-1.5 shadow-[0_4px_12px_rgba(0,0,0,0.5)] text-center text-xs font-semibold text-white whitespace-nowrap">
                <p className="flex items-center gap-1">
                  <span>{collab.name}</span>
                  {isMe && <span className="text-[10px] text-zinc-400 font-normal">(You)</span>}
                </p>
                <p className="text-[10px] text-zinc-400 font-normal mt-0.5">{collab.email}</p>
              </div>
            </div>
          );
        })}
      </div>
      
      {users.length > 0 && (
        <span className="text-xs font-semibold text-zinc-400 ml-1.5 hidden sm:inline">
          {users.length} active user{users.length > 1 ? 's' : ''}
        </span>
      )}
    </div>
  );
};

export default CollaboratorCursors;
