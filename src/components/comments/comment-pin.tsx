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
        'w-8 h-8 rounded-full',
        'transition-all duration-200',
        'hover:scale-110',
        isSelected && 'ring-2 ring-white ring-offset-2 ring-offset-slate-900 scale-110',
        isResolved ? 'opacity-50 hover:opacity-100' : 'opacity-100'
      )}
      style={{
        left: comment.x,
        top: comment.y,
        transform: 'translate(-50%, -50%)',
        backgroundColor: color,
        boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
      }}
      aria-label={`Comment by ${comment.userName || 'Unknown'}: ${comment.content.slice(0, 50)}${comment.content.length > 50 ? '...' : ''}`}
    >
      <MessageCircle className="size-4 text-white" />
      {totalCount > 1 && (
        <span
          className="absolute -top-1 -right-1 flex items-center justify-center w-5 h-5 rounded-full bg-white text-xs font-bold"
          style={{ color }}
        >
          {totalCount}
        </span>
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

