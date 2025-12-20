/**
 * This file is part of the SchemaVis project.
 * Copyright (C) 2025 Akshat Kotpalliwar (IntegerAlex)
 * Licensed under the GNU Affero General Public License v3.0 or later.
 */
'use client';

import * as React from 'react';
import {
  X,
  MessageCircle,
  Check,
  Filter,
  ChevronRight,
  Loader2,
} from 'lucide-react';
import { Button } from '../ui/button';
import { cn } from '@/lib/utils';
import type { CommentData } from '@/lib/collaboration/types';
import { getUserColor } from '@/lib/collaboration/types';
import { useOptionalCollaboration } from '@/context/collaboration-context';

interface CommentsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateToComment: (comment: CommentData) => void;
}

type FilterType = 'all' | 'open' | 'resolved';

export function CommentsPanel({
  isOpen,
  onClose,
  onNavigateToComment,
}: CommentsPanelProps) {
  const [filter, setFilter] = React.useState<FilterType>('all');
  const collaboration = useOptionalCollaboration();

  if (!isOpen) return null;

  const comments = collaboration?.comments || [];
  const isLoading = collaboration?.isLoadingComments || false;

  // Group comments by parent and filter
  const { rootComments, repliesMap, counts } = React.useMemo(() => {
    const rootComments: CommentData[] = [];
    const repliesMap = new Map<number, CommentData[]>();
    let openCount = 0;
    let resolvedCount = 0;

    for (const comment of comments) {
      if (comment.parentId === null) {
        rootComments.push(comment);
        if (comment.resolved) {
          resolvedCount++;
        } else {
          openCount++;
        }
      } else {
        const replies = repliesMap.get(comment.parentId) || [];
        replies.push(comment);
        repliesMap.set(comment.parentId, replies);
      }
    }

    return {
      rootComments: rootComments.filter((c) => {
        if (filter === 'open') return !c.resolved;
        if (filter === 'resolved') return c.resolved;
        return true;
      }),
      repliesMap,
      counts: { all: rootComments.length, open: openCount, resolved: resolvedCount },
    };
  }, [comments, filter]);

  return (
    <div
      className={cn(
        'fixed right-0 top-0 h-full w-80',
        'bg-slate-900/95 backdrop-blur-xl',
        'border-l border-white/10',
        'shadow-[-10px_0_40px_-10px_rgba(0,0,0,0.3)]',
        'flex flex-col z-50',
        'animate-in slide-in-from-right duration-300'
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-white/10">
        <div className="flex items-center gap-2">
          <MessageCircle className="size-5 text-blue-400" />
          <h2 className="text-lg font-semibold text-white">Comments</h2>
          <span className="px-2 py-0.5 bg-zinc-800 rounded-full text-xs text-zinc-400">
            {counts.all}
          </span>
        </div>
        <button
          onClick={onClose}
          className="text-zinc-400 hover:text-white transition-colors"
          aria-label="Close comments panel"
        >
          <X className="size-5" />
        </button>
      </div>

      {/* Filter tabs */}
      <div className="flex items-center gap-1 p-2 border-b border-white/10">
        <FilterButton
          active={filter === 'all'}
          onClick={() => setFilter('all')}
          count={counts.all}
          label="All"
        />
        <FilterButton
          active={filter === 'open'}
          onClick={() => setFilter('open')}
          count={counts.open}
          label="Open"
        />
        <FilterButton
          active={filter === 'resolved'}
          onClick={() => setFilter('resolved')}
          count={counts.resolved}
          label="Resolved"
        />
      </div>

      {/* Comments list */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="size-6 animate-spin text-zinc-400" />
          </div>
        ) : rootComments.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
            <MessageCircle className="size-12 text-zinc-700 mb-3" />
            <p className="text-zinc-400 text-sm">
              {filter === 'all'
                ? 'No comments yet'
                : filter === 'open'
                  ? 'No open comments'
                  : 'No resolved comments'}
            </p>
            <p className="text-zinc-500 text-xs mt-1">
              Click anywhere on the canvas to add a comment
            </p>
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {rootComments.map((comment) => (
              <CommentItem
                key={comment.id}
                comment={comment}
                replies={repliesMap.get(comment.id) || []}
                onClick={() => onNavigateToComment(comment)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

interface FilterButtonProps {
  active: boolean;
  onClick: () => void;
  count: number;
  label: string;
}

function FilterButton({ active, onClick, count, label }: FilterButtonProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-colors',
        active
          ? 'bg-blue-600/20 text-blue-400'
          : 'text-zinc-400 hover:text-white hover:bg-white/5'
      )}
    >
      {label}
      <span
        className={cn(
          'px-1.5 py-0.5 rounded text-xs',
          active ? 'bg-blue-600/30' : 'bg-zinc-800'
        )}
      >
        {count}
      </span>
    </button>
  );
}

interface CommentItemProps {
  comment: CommentData;
  replies: CommentData[];
  onClick: () => void;
}

function CommentItem({ comment, replies, onClick }: CommentItemProps) {
  const color = getUserColor(comment.userId);

  return (
    <button
      onClick={onClick}
      className="w-full p-4 text-left hover:bg-white/5 transition-colors group"
    >
      <div className="flex items-start gap-3">
        {comment.userImageUrl ? (
          <img
            src={comment.userImageUrl}
            alt={comment.userName || ''}
            className="size-8 rounded-full shrink-0"
          />
        ) : (
          <div
            className="size-8 rounded-full flex items-center justify-center text-xs font-medium text-white shrink-0"
            style={{ backgroundColor: color }}
          >
            {(comment.userName || '??').slice(0, 2).toUpperCase()}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-medium text-white truncate">
              {comment.userName || 'Unknown'}
            </span>
            <span className="text-xs text-zinc-500">
              {formatTimeAgo(new Date(comment.createdAt))}
            </span>
            {comment.resolved && (
              <span className="flex items-center gap-0.5 text-xs text-green-500">
                <Check className="size-3" />
                Resolved
              </span>
            )}
          </div>
          <p className="text-sm text-zinc-300 line-clamp-2">{comment.content}</p>
          {replies.length > 0 && (
            <div className="flex items-center gap-1 mt-2 text-xs text-zinc-500">
              <MessageCircle className="size-3" />
              {replies.length} {replies.length === 1 ? 'reply' : 'replies'}
            </div>
          )}
        </div>
        <ChevronRight className="size-4 text-zinc-600 shrink-0 group-hover:text-zinc-400 transition-colors" />
      </div>
    </button>
  );
}

function formatTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

