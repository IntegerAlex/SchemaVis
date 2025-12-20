/**
 * This file is part of the SchemaVis project.
 * Copyright (C) 2025 Akshat Kotpalliwar (IntegerAlex)
 * Licensed under the GNU Affero General Public License v3.0 or later.
 */
'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { useOptionalCollaboration } from '@/context/collaboration-context';
import { getUserColor } from '@/lib/collaboration/types';

interface PresenceAvatarsProps {
  className?: string;
  maxVisible?: number;
}

export function PresenceAvatars({ className, maxVisible = 5 }: PresenceAvatarsProps) {
  const collaboration = useOptionalCollaboration();
  
  if (!collaboration || collaboration.activeUsers.length <= 1) {
    return null;
  }

  // Filter out current user and show others
  const otherUsers = collaboration.activeUsers.filter(
    (user) => user.id !== collaboration.currentUser?.id
  );

  if (otherUsers.length === 0) {
    return null;
  }

  const visibleUsers = otherUsers.slice(0, maxVisible);
  const remainingCount = Math.max(0, otherUsers.length - maxVisible);

  return (
    <div
      className={cn('flex items-center -space-x-2', className)}
      aria-label={`${otherUsers.length} other ${otherUsers.length === 1 ? 'user' : 'users'} viewing`}
    >
      {visibleUsers.map((user, index) => (
        <UserAvatar
          key={user.id}
          user={user}
          style={{ zIndex: visibleUsers.length - index }}
        />
      ))}
      {remainingCount > 0 && (
        <div
          className="relative flex items-center justify-center size-8 rounded-full bg-zinc-700 border-2 border-slate-900 text-xs font-medium text-white"
          style={{ zIndex: 0 }}
          aria-label={`${remainingCount} more users`}
        >
          +{remainingCount}
        </div>
      )}
    </div>
  );
}

interface UserAvatarProps {
  user: {
    id: string;
    name: string | null;
    email: string | null;
    imageUrl: string | null;
    role: 'owner' | 'editor' | 'viewer';
  };
  style?: React.CSSProperties;
}

function UserAvatar({ user, style }: UserAvatarProps) {
  const color = getUserColor(user.id);
  const initials = getInitials(user.name, user.email);
  const displayName = user.name || user.email || 'Unknown user';
  const roleLabel = user.role === 'owner' ? 'Owner' : user.role === 'editor' ? 'Editor' : 'Viewer';

  return (
    <div className="relative group" style={style}>
      {user.imageUrl ? (
        <img
          src={user.imageUrl}
          alt={displayName}
          className="size-8 rounded-full border-2 border-slate-900 object-cover"
          style={{ boxShadow: `0 0 0 2px ${color}` }}
        />
      ) : (
        <div
          className="flex items-center justify-center size-8 rounded-full border-2 border-slate-900 text-xs font-medium text-white"
          style={{ backgroundColor: color }}
          aria-label={displayName}
        >
          {initials}
        </div>
      )}
      
      {/* Tooltip */}
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
        <div className="bg-slate-800 text-white text-xs px-2 py-1 rounded-lg whitespace-nowrap border border-white/10">
          <div className="font-medium">{displayName}</div>
          <div className="text-zinc-400 text-[10px]">{roleLabel}</div>
        </div>
        <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1">
          <div className="border-4 border-transparent border-t-slate-800" />
        </div>
      </div>
      
      {/* Online indicator */}
      <div
        className="absolute -bottom-0.5 -right-0.5 size-3 rounded-full border-2 border-slate-900"
        style={{ backgroundColor: '#22c55e' }}
        aria-label="Online"
      />
    </div>
  );
}

function getInitials(name: string | null, email: string | null): string {
  if (name) {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  }
  if (email) {
    return email.slice(0, 2).toUpperCase();
  }
  return '??';
}

// Connection status indicator
export function ConnectionStatus() {
  const collaboration = useOptionalCollaboration();

  if (!collaboration) {
    return null;
  }

  const { connectionState } = collaboration;

  // Check if SSE is enabled
  const useSSE =
    typeof window !== 'undefined' &&
    window.EventSource &&
    process.env.NEXT_PUBLIC_USE_SSE === 'true' &&
    localStorage.getItem('schema-vis:sse-disabled') !== 'true';

  const statusConfig = {
    connected: { color: '#22c55e', label: 'Connected' },
    connecting: { color: '#f59e0b', label: 'Connecting...' },
    reconnecting: { color: '#f59e0b', label: 'Reconnecting...' },
    disconnected: { color: '#6b7280', label: 'Disconnected' },
    error: { color: '#ef4444', label: 'Connection error' },
  };

  const status = statusConfig[connectionState];
  const mode = useSSE ? 'Real-time (SSE)' : 'Polling';

  return (
    <div className="flex items-center gap-2 text-xs text-zinc-400">
      <div
        className="size-2 rounded-full"
        style={{ backgroundColor: status.color }}
        aria-label={`${status.label} - ${mode}`}
      />
      <span>{status.label}</span>
      <span className="text-zinc-500">•</span>
      <span className="text-zinc-500">{mode}</span>
    </div>
  );
}

