/**
 * This file is part of the SchemaVis project.
 * Copyright (C) 2025 Akshat Kotpalliwar (IntegerAlex)
 * Licensed under the GNU Affero General Public License v3.0 or later.
 */
'use client';

import * as React from 'react';
import { X, Check, Trash2, Send, CornerDownRight } from 'lucide-react';
import { Button } from '../ui/button';
import { cn } from '@/lib/utils';
import type { CommentData } from '@/lib/collaboration/types';
import { getUserColor } from '@/lib/collaboration/types';
import { useOptionalCollaboration } from '@/context/collaboration-context';

interface CommentThreadProps {
  comment: CommentData;
  replies: CommentData[];
  onClose: () => void;
  currentUserId?: string;
}

export function CommentThread({
  comment,
  replies,
  onClose,
  currentUserId,
}: CommentThreadProps) {
  const [replyContent, setReplyContent] = React.useState('');
  const collaboration = useOptionalCollaboration();

  const handleResolve = React.useCallback(() => {
    collaboration?.sendCommentResolve(comment.id);
  }, [collaboration, comment.id]);

  const handleDelete = React.useCallback(
    (commentId: number) => {
      if (confirm('Delete this comment?')) {
        collaboration?.sendCommentDelete(commentId);
        if (commentId === comment.id) {
          onClose();
        }
      }
    },
    [collaboration, comment.id, onClose]
  );

  const handleReply = React.useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (!replyContent.trim()) return;

      collaboration?.sendCommentCreate(
        replyContent.trim(),
        comment.x,
        comment.y,
        comment.id
      );
      setReplyContent('');
    },
    [collaboration, replyContent, comment]
  );

  const color = getUserColor(comment.userId);
  const canDelete = currentUserId === comment.userId || collaboration?.isOwner;

  return (
    <div
      className={cn(
        'w-80 bg-slate-900/95 backdrop-blur-xl',
        'border border-white/10 rounded-xl',
        'shadow-[0_10px_40px_-10px_rgba(0,0,0,0.5)]',
        'overflow-hidden'
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-white/10">
        <div className="flex items-center gap-2">
          {comment.userImageUrl ? (
            <img
              src={comment.userImageUrl}
              alt={comment.userName || ''}
              className="size-6 rounded-full"
            />
          ) : (
            <div
              className="size-6 rounded-full flex items-center justify-center text-xs font-medium text-white"
              style={{ backgroundColor: color }}
            >
              {(comment.userName || '??').slice(0, 2).toUpperCase()}
            </div>
          )}
          <span className="text-sm font-medium text-white">
            {comment.userName || 'Unknown'}
          </span>
          <span className="text-xs text-zinc-500">
            {formatTimeAgo(new Date(comment.createdAt))}
          </span>
        </div>
        <button
          onClick={onClose}
          className="text-zinc-400 hover:text-white transition-colors"
          aria-label="Close"
        >
          <X className="size-4" />
        </button>
      </div>

      {/* Main comment */}
      <div className="p-3">
        <p className="text-sm text-zinc-200 whitespace-pre-wrap">{comment.content}</p>
        <div className="flex items-center gap-2 mt-3">
          {!comment.resolved ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleResolve}
              className="h-7 px-2 text-xs text-zinc-400 hover:text-green-400 hover:bg-green-900/20"
            >
              <Check className="size-3 mr-1" />
              Resolve
            </Button>
          ) : (
            <span className="text-xs text-green-500 flex items-center gap-1">
              <Check className="size-3" />
              Resolved
            </span>
          )}
          {canDelete && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleDelete(comment.id)}
              className="h-7 px-2 text-xs text-zinc-400 hover:text-red-400 hover:bg-red-900/20"
            >
              <Trash2 className="size-3 mr-1" />
              Delete
            </Button>
          )}
        </div>
      </div>

      {/* Replies */}
      {replies.length > 0 && (
        <div className="border-t border-white/10">
          {replies.map((reply) => (
            <ReplyItem
              key={reply.id}
              reply={reply}
              onDelete={() => handleDelete(reply.id)}
              canDelete={currentUserId === reply.userId || collaboration?.isOwner}
            />
          ))}
        </div>
      )}

      {/* Reply input */}
      <form
        onSubmit={handleReply}
        className="p-3 border-t border-white/10 flex items-center gap-2"
      >
        <input
          type="text"
          value={replyContent}
          onChange={(e) => setReplyContent(e.target.value)}
          placeholder="Reply..."
          className="flex-1 bg-slate-800 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <Button
          type="submit"
          variant="ghost"
          size="icon"
          disabled={!replyContent.trim()}
          className="h-8 w-8 text-zinc-400 hover:text-blue-400 hover:bg-blue-900/20"
        >
          <Send className="size-4" />
        </Button>
      </form>
    </div>
  );
}

interface ReplyItemProps {
  reply: CommentData;
  onDelete: () => void;
  canDelete?: boolean;
}

function ReplyItem({ reply, onDelete, canDelete }: ReplyItemProps) {
  const color = getUserColor(reply.userId);

  return (
    <div className="p-3 hover:bg-white/5 transition-colors group">
      <div className="flex items-start gap-2">
        <CornerDownRight className="size-3 text-zinc-600 mt-1 shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            {reply.userImageUrl ? (
              <img
                src={reply.userImageUrl}
                alt={reply.userName || ''}
                className="size-5 rounded-full"
              />
            ) : (
              <div
                className="size-5 rounded-full flex items-center justify-center text-[10px] font-medium text-white"
                style={{ backgroundColor: color }}
              >
                {(reply.userName || '??').slice(0, 2).toUpperCase()}
              </div>
            )}
            <span className="text-xs font-medium text-zinc-300">
              {reply.userName || 'Unknown'}
            </span>
            <span className="text-[10px] text-zinc-500">
              {formatTimeAgo(new Date(reply.createdAt))}
            </span>
            {canDelete && (
              <button
                onClick={onDelete}
                className="ml-auto opacity-0 group-hover:opacity-100 text-zinc-500 hover:text-red-400 transition-all"
                aria-label="Delete reply"
              >
                <Trash2 className="size-3" />
              </button>
            )}
          </div>
          <p className="text-sm text-zinc-300 mt-1">{reply.content}</p>
        </div>
      </div>
    </div>
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

