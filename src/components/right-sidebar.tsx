/**
 * This file is part of the SchemaVis project.
 * Copyright (C) 2025 Akshat Kotpalliwar (IntegerAlex)
 * Licensed under the GNU Affero General Public License v3.0 or later.
 */
'use client';

import * as React from 'react';
import { MessageCircle, Share2, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useOptionalCollaboration } from '@/context/collaboration-context';

interface RightSidebarProps {
  onCommentsClick: () => void;
  onShareClick: () => void;
  onAddCommentClick: () => void;
  isCommentsOpen: boolean;
  isCommentMode: boolean;
  showShare?: boolean;
  className?: string;
}

export function RightSidebar({
  onCommentsClick,
  onShareClick,
  onAddCommentClick,
  isCommentsOpen,
  isCommentMode,
  showShare = false,
  className,
}: RightSidebarProps) {
  const collaboration = useOptionalCollaboration();
  const unresolvedCount = collaboration?.comments
    ? collaboration.comments.filter((c) => !c.resolved && c.parentId === null).length
    : 0;

  return (
    <aside
      className={cn(
        'flex flex-col items-center gap-2 p-3',
        'bg-white/5 dark:bg-slate-900/30',
        'backdrop-blur-xl backdrop-saturate-150',
        'border-l border-white/10',
        'rounded-l-2xl',
        'shadow-[0_8px_32px_0_rgba(0,0,0,0.37)]',
        className
      )}
      aria-label="Right sidebar actions"
    >
      {/* Add Comment Button */}
      <button
        onClick={onAddCommentClick}
        className={cn(
          'flex items-center justify-center',
          'w-11 h-11 rounded-xl',
          'transition-all duration-200',
          'bg-white/5 hover:bg-white/10',
          'backdrop-blur-sm',
          'border border-white/10 hover:border-white/20',
          'text-zinc-400 hover:text-white',
          'shadow-sm hover:shadow-md',
          isCommentMode && 'bg-blue-500/20 text-blue-400 border-blue-500/40 shadow-blue-500/20'
        )}
        aria-label={isCommentMode ? 'Exit comment mode' : 'Add comment'}
        title={isCommentMode ? 'Click on canvas to add comment' : 'Enable comment mode'}
      >
        <Plus className="size-5" />
      </button>

      {/* Comments Button */}
      <button
        onClick={onCommentsClick}
        className={cn(
          'relative flex items-center justify-center',
          'w-11 h-11 rounded-xl',
          'transition-all duration-200',
          'bg-white/5 hover:bg-white/10',
          'backdrop-blur-sm',
          'border border-white/10 hover:border-white/20',
          'text-zinc-400 hover:text-white',
          'shadow-sm hover:shadow-md',
          isCommentsOpen && 'bg-white/10 text-white border-white/20'
        )}
        aria-label={`Open comments panel${unresolvedCount > 0 ? ` (${unresolvedCount} unresolved)` : ''}`}
        title={`Comments${unresolvedCount > 0 ? ` (${unresolvedCount} unresolved)` : ''}`}
      >
        <MessageCircle className="size-5" />
        {unresolvedCount > 0 && (
          <span
            className="absolute -top-1 -right-1 flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-blue-500 text-[10px] font-bold text-white shadow-lg border border-blue-400/30"
            aria-label={`${unresolvedCount} unresolved comments`}
          >
            {unresolvedCount > 9 ? '9+' : unresolvedCount}
          </span>
        )}
      </button>

      {/* Share Button */}
      {showShare && (
        <button
          onClick={onShareClick}
          className={cn(
            'flex items-center justify-center',
            'w-11 h-11 rounded-xl',
            'transition-all duration-200',
            'bg-white/5 hover:bg-white/10',
            'backdrop-blur-sm',
            'border border-white/10 hover:border-white/20',
            'text-zinc-400 hover:text-white',
            'shadow-sm hover:shadow-md'
          )}
          aria-label="Share diagram"
          title="Share diagram"
        >
          <Share2 className="size-5" />
        </button>
      )}
    </aside>
  );
}

