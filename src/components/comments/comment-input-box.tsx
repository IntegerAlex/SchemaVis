/**
 * This file is part of the SchemaVis project.
 * Copyright (C) 2025 Akshat Kotpalliwar (IntegerAlex)
 * Licensed under the GNU Affero General Public License v3.0 or later.
 */
'use client';

import * as React from 'react';
import { X, Send } from 'lucide-react';
import { Button } from '../ui/button';
import { cn } from '@/lib/utils';

interface CommentInputBoxProps {
  x: number;
  y: number;
  onClose: () => void;
  onSubmit: (content: string) => void;
  isLoading?: boolean;
}

export function CommentInputBox({
  x,
  y,
  onClose,
  onSubmit,
  isLoading = false,
}: CommentInputBoxProps) {
  const [content, setContent] = React.useState('');
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  // Focus textarea on mount
  React.useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  // Handle escape key to close
  React.useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (content.trim() && !isLoading) {
      onSubmit(content.trim());
      setContent('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Submit on Cmd/Ctrl + Enter
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      handleSubmit(e);
    }
    // Close on Escape
    if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  };

  // Calculate position with bounds checking
  const boxWidth = 320; // w-80 = 320px
  const boxHeight = 200; // approximate height
  const padding = 20;
  
  const left = Math.min(
    Math.max(x + padding, padding),
    typeof window !== 'undefined' ? window.innerWidth - boxWidth - padding : x + padding
  );
  const top = Math.min(
    Math.max(y, padding),
    typeof window !== 'undefined' ? window.innerHeight - boxHeight - padding : y
  );

  return (
    <div
      className={cn(
        'fixed z-50',
        'w-80 max-w-[calc(100vw-2rem)]',
        'bg-white/10 dark:bg-slate-900/40',
        'backdrop-blur-2xl backdrop-saturate-150',
        'border border-white/20 dark:border-white/10',
        'rounded-xl shadow-[0_20px_70px_-30px_rgba(0,0,0,0.5)]',
        'p-4',
        'animate-in fade-in-0 zoom-in-95 duration-200'
      )}
      style={{
        left: `${left}px`,
        top: `${top}px`,
      }}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-white">Add Comment</h3>
        <button
          onClick={onClose}
          disabled={isLoading}
          className={cn(
            'text-zinc-400 hover:text-white',
            'transition-colors',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            'focus:outline-none focus:ring-2 focus:ring-white/20 focus:ring-offset-2 focus:ring-offset-slate-900 rounded'
          )}
          aria-label="Close"
        >
          <X className="size-4" />
        </button>
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="space-y-3">
        <textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Write a comment..."
          disabled={isLoading}
          rows={3}
          className={cn(
            'w-full',
            'bg-white/5 border border-white/10',
            'rounded-lg px-3 py-2',
            'text-sm text-white placeholder:text-zinc-500',
            'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            'resize-none'
          )}
        />

        {/* Actions */}
        <div className="flex items-center justify-end gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onClose}
            disabled={isLoading}
            className="text-zinc-400 hover:text-white hover:bg-white/10"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            size="sm"
            disabled={!content.trim() || isLoading}
            className={cn(
              'bg-blue-600 hover:bg-blue-700',
              'text-white',
              'disabled:opacity-50 disabled:cursor-not-allowed'
            )}
          >
            {isLoading ? (
              <>
                <span className="animate-spin mr-2">⏳</span>
                Posting...
              </>
            ) : (
              <>
                <Send className="size-3 mr-2" />
                Post
              </>
            )}
          </Button>
        </div>

        {/* Hint */}
        <p className="text-xs text-zinc-500 text-center">
          Press <kbd className="px-1 py-0.5 bg-white/10 rounded text-xs">Ctrl+Enter</kbd> to submit
        </p>
      </form>
    </div>
  );
}

