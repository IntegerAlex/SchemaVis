/**
 * This file is part of the SchemaVis project.
 * Copyright (C) 2025 Akshat Kotpalliwar (IntegerAlex)
 * Licensed under the GNU Affero General Public License v3.0 or later.
 */
'use client';

import * as React from 'react';
import { X, AlertTriangle, Trash2, Loader2 } from 'lucide-react';
import { Button } from './ui/button';
import { cn } from '@/lib/utils';

export type DeleteType = 'file' | 'diagram' | 'comment' | 'reply' | 'permission';

interface DeleteConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  type?: DeleteType;
  title?: string;
  itemName?: string;
  description?: string;
  isLoading?: boolean;
  dangerText?: string;
}

const deleteConfig: Record<DeleteType, { title: string; description: string; icon: typeof Trash2 }> = {
  file: {
    title: 'Delete SQL File',
    description: 'This file will be moved to trash. You can restore it later if needed.',
    icon: Trash2,
  },
  diagram: {
    title: 'Delete Diagram',
    description: 'This diagram will be moved to trash. Shared links will become invalid.',
    icon: Trash2,
  },
  comment: {
    title: 'Delete Comment',
    description: 'This comment and all its replies will be permanently deleted.',
    icon: Trash2,
  },
  reply: {
    title: 'Delete Reply',
    description: 'This reply will be permanently deleted.',
    icon: Trash2,
  },
  permission: {
    title: 'Remove Access',
    description: 'This user will no longer have access to this diagram.',
    icon: X,
  },
};

export function DeleteConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  type = 'file',
  title,
  itemName,
  description,
  isLoading = false,
  dangerText,
}: DeleteConfirmDialogProps) {
  const config = deleteConfig[type];
  const finalTitle = title || config.title;
  const finalDescription = description || config.description;
  const Icon = config.icon;

  // Handle escape key
  React.useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isLoading) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, isLoading, onClose]);

  // Prevent body scroll when open
  React.useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-dialog-title"
      aria-describedby="delete-dialog-description"
    >
      {/* Backdrop with blur */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
        aria-hidden="true"
      />

      {/* Dialog */}
      <div
        className={cn(
          'relative z-50 w-full max-w-md',
          'bg-white/10 dark:bg-slate-900/40',
          'backdrop-blur-2xl backdrop-saturate-150',
          'border border-white/20 dark:border-white/10',
          'rounded-2xl shadow-[0_20px_70px_-30px_rgba(0,0,0,0.5)]',
          'p-6',
          'animate-in fade-in-0 zoom-in-95 duration-200'
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          disabled={isLoading}
          className={cn(
            'absolute top-4 right-4',
            'text-zinc-400 hover:text-white',
            'transition-colors',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            'focus:outline-none focus:ring-2 focus:ring-white/20 focus:ring-offset-2 focus:ring-offset-slate-900 rounded'
          )}
          aria-label="Close dialog"
        >
          <X className="size-5" />
        </button>

        {/* Icon and Title */}
        <div className="flex items-start gap-4 mb-4">
          <div
            className={cn(
              'flex items-center justify-center',
              'w-12 h-12 rounded-xl',
              'bg-red-500/20 border border-red-500/30',
              'shrink-0'
            )}
          >
            <AlertTriangle className="size-6 text-red-400 animate-shake" />
          </div>
          <div className="flex-1 min-w-0">
            <h3
              id="delete-dialog-title"
              className="text-lg font-semibold text-white mb-1"
            >
              {finalTitle}
            </h3>
            <p
              id="delete-dialog-description"
              className="text-sm text-zinc-300 leading-relaxed"
            >
              {itemName && (
                <>
                  Are you sure you want to delete{' '}
                  <span className="font-medium text-white">{itemName}</span>?
                </>
              )}
              {!itemName && finalDescription}
            </p>
            {itemName && (
              <p className="text-xs text-zinc-400 mt-2">{finalDescription}</p>
            )}
          </div>
        </div>

        {/* Danger text */}
        {dangerText && (
          <div
            className={cn(
              'mb-4 p-3 rounded-lg',
              'bg-red-500/10 border border-red-500/20',
              'text-sm text-red-300'
            )}
            role="alert"
          >
            {dangerText}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-3 pt-2">
          <Button
            variant="ghost"
            onClick={onClose}
            disabled={isLoading}
            className={cn(
              'flex-1',
              'border border-white/10 text-zinc-300',
              'hover:text-white hover:bg-white/10',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              'transition-all duration-200'
            )}
          >
            Cancel
          </Button>
          <Button
            onClick={onConfirm}
            disabled={isLoading}
            className={cn(
              'flex-1',
              'bg-red-600 hover:bg-red-700',
              'text-white border border-red-700',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              'transition-all duration-200',
              'focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-slate-900'
            )}
          >
            {isLoading ? (
              <>
                <Loader2 className="size-4 mr-2 animate-spin" />
                Deleting...
              </>
            ) : (
              <>
                <Icon className="size-4 mr-2" />
                Delete
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
