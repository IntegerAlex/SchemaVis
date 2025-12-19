/**
 * This file is part of the SchemaVis project.
 * Copyright (C) 2025 Akshat Kotpalliwar (IntegerAlex)
 * Licensed under the GNU Affero General Public License v3.0 or later.
 */
'use client';

import * as React from 'react';
import { X } from 'lucide-react';
import { Button } from './ui/button';
import { cn } from '@/lib/utils';

interface DeleteConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  fileName?: string;
  isLoading?: boolean;
}

export function DeleteConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  fileName,
  isLoading = false,
}: DeleteConfirmDialogProps) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      
      {/* Dialog */}
      <div
        className={cn(
          'relative z-50 w-full max-w-sm mx-4',
          'bg-white/5 backdrop-blur-2xl border border-white/10',
          'rounded-2xl shadow-[0_20px_70px_-30px_rgba(59,130,246,0.45)]',
          'p-6'
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-zinc-400 hover:text-white transition-colors"
          aria-label="Close"
        >
          <X className="size-4" />
        </button>

        {/* Content */}
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold text-white mb-1">
              Delete SQL File
            </h3>
            <p className="text-sm text-zinc-300">
              Are you sure you want to delete{' '}
              {fileName ? (
                <span className="font-medium text-white">{fileName}</span>
              ) : (
                'this file'
              )}
              ? This action cannot be undone.
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 pt-2">
            <Button
              variant="ghost"
              onClick={onClose}
              disabled={isLoading}
              className="flex-1 border border-white/10 text-zinc-300 hover:text-white hover:bg-white/10"
            >
              Cancel
            </Button>
            <Button
              onClick={onConfirm}
              disabled={isLoading}
              className="flex-1 bg-red-600 hover:bg-red-700 text-white border border-red-700"
            >
              {isLoading ? 'Deleting...' : 'Delete'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

