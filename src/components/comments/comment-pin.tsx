/**
 * This file is part of the SchemaVis project.
 * Copyright (C) 2025 Akshat Kotpalliwar (IntegerAlex)
 * Licensed under the GNU Affero General Public License v3.0 or later.
 */
'use client';

import * as React from 'react';
import { MessageCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { CommentData } from '@/lib/collaboration/types';
import { getUserColor } from '@/lib/collaboration/types';

interface CommentPinProps {
  comment: CommentData;
  replies: CommentData[];
  isSelected: boolean;
  onClick: () => void;
}

export function CommentPin({ comment, replies, isSelected, onClick }: CommentPinProps) {
  const color = getUserColor(comment.userId);
  const totalCount = 1 + replies.length;
  const isResolved = comment.resolved;

  return (
    <button
      onClick={onClick}
      className={cn(
        'absolute flex items-center justify-center',
        'w-10 h-10 rounded-xl',
        'transition-all duration-300',
        'backdrop-blur-xl backdrop-saturate-150',
        'border-2',
        'shadow-lg',
        'hover:scale-110 hover:shadow-xl',
        'animate-in fade-in-0 zoom-in-95 duration-300',
        isSelected
          ? 'ring-2 ring-blue-400 ring-offset-2 ring-offset-slate-900 scale-110 shadow-blue-500/50'
          : '',
        isResolved
          ? 'opacity-60 hover:opacity-100 border-white/20 bg-white/5'
          : 'opacity-100 border-white/30 bg-white/10',
        !isResolved && 'animate-pulse'
      )}
      style={{
        left: comment.x,
        top: comment.y,
        transform: 'translate(-50%, -50%)',
        boxShadow: isResolved
          ? '0 4px 12px rgba(0,0,0,0.2)'
          : `0 4px 16px ${color}40, 0 2px 8px rgba(0,0,0,0.3)`,
      }}
      aria-label={`Comment by ${comment.userName || 'Unknown'}: ${comment.content.slice(0, 50)}${comment.content.length > 50 ? '...' : ''}`}
    >
      <div
        className={cn(
          'flex items-center justify-center',
          'w-full h-full rounded-lg',
          'transition-colors duration-200'
        )}
        style={{
          backgroundColor: isResolved ? 'transparent' : `${color}20`,
        }}
      >
        <MessageCircle
          className={cn(
            'size-5 transition-colors duration-200',
            isResolved ? 'text-zinc-400' : 'text-white'
          )}
          style={{
            filter: isResolved ? 'none' : `drop-shadow(0 0 2px ${color})`,
          }}
        />
      </div>
      {totalCount > 1 && (
        <span
          className={cn(
            'absolute -top-1.5 -right-1.5',
            'flex items-center justify-center',
            'min-w-[20px] h-5 px-1.5',
            'rounded-full',
            'text-[10px] font-bold',
            'backdrop-blur-sm',
            'border border-white/30',
            'shadow-md',
            'transition-all duration-200',
            isSelected && 'scale-110'
          )}
          style={{
            backgroundColor: color,
            color: 'white',
            boxShadow: `0 2px 8px ${color}60, 0 0 4px ${color}40`,
          }}
          aria-label={`${totalCount} comments in thread`}
        >
          {totalCount > 9 ? '9+' : totalCount}
        </span>
      )}
      {!isResolved && (
        <span
          className="absolute inset-0 rounded-xl animate-ping opacity-20"
          style={{ backgroundColor: color }}
        />
      )}
    </button>
  );
}

// Component to render all comment pins on canvas
interface CommentPinsLayerProps {
  comments: CommentData[];
  selectedCommentId: number | null;
  onSelectComment: (commentId: number | null) => void;
  viewport?: { x: number; y: number; zoom: number };
}

export function CommentPinsLayer({
  comments,
  selectedCommentId,
  onSelectComment,
  viewport = { x: 0, y: 0, zoom: 1 },
}: CommentPinsLayerProps) {
  // Group comments by parent (null parent = root comment)
  const commentGroups = React.useMemo(() => {
    const rootComments: CommentData[] = [];
    const repliesMap = new Map<number, CommentData[]>();

    for (const comment of comments) {
      if (comment.parentId === null) {
        rootComments.push(comment);
      } else {
        const replies = repliesMap.get(comment.parentId) || [];
        replies.push(comment);
        repliesMap.set(comment.parentId, replies);
      }
    }

    return { rootComments, repliesMap };
  }, [comments]);

  const handlePinClick = React.useCallback(
    (commentId: number) => {
      onSelectComment(selectedCommentId === commentId ? null : commentId);
    },
    [selectedCommentId, onSelectComment]
  );

  return (
    <div className="absolute inset-0 pointer-events-none z-40">
      {commentGroups.rootComments.map((comment) => {
        // Transform position based on viewport
        const transformedX = comment.x * viewport.zoom + viewport.x;
        const transformedY = comment.y * viewport.zoom + viewport.y;
        const replies = commentGroups.repliesMap.get(comment.id) || [];

        return (
          <div
            key={comment.id}
            className="pointer-events-auto"
            style={{
              position: 'absolute',
              left: transformedX,
              top: transformedY,
            }}
          >
            <CommentPin
              comment={comment}
              replies={replies}
              isSelected={selectedCommentId === comment.id}
              onClick={() => handlePinClick(comment.id)}
            />
          </div>
        );
      })}
    </div>
  );
}

