'use client';

/**
 * This file is part of the SchemaVis project.
 * Copyright (C) 2025 Akshat Kotpalliwar (IntegerAlex)
 * Licensed under the GNU Affero General Public License v3.0 or later.
 */

import * as React from 'react';
import { X, Loader2 } from 'lucide-react';
import { Button } from './ui/button';
import { cn } from '@/lib/utils';

interface RenameDiagramDialogProps {
  isOpen: boolean;
  onClose: () => void;
  currentName: string;
  onRename: (newName: string) => void;
  isLoading?: boolean;
}

export function RenameDiagramDialog({
  isOpen,
  onClose,
  currentName,
  onRename,
  isLoading = false,
}: RenameDiagramDialogProps) {
  const [value, setValue] = React.useState(currentName);
  const inputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (isOpen) {
      setValue(currentName);
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [isOpen, currentName]);

  React.useEffect(() => {
    if (!isOpen) return;
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isLoading) onClose();
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, isLoading, onClose]);

  React.useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = value.trim();
    if (trimmed && trimmed !== currentName) {
      onRename(trimmed);
    } else {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="rename-dialog-title"
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" aria-hidden="true" />
      <div
        className={cn(
          'relative z-50 w-full max-w-md',
          'bg-white/10 dark:bg-slate-900/40',
          'backdrop-blur-2xl border border-white/20 rounded-2xl',
          'p-6 shadow-xl'
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          disabled={isLoading}
          className="absolute top-4 right-4 text-zinc-400 hover:text-white disabled:opacity-50"
          aria-label="Close"
        >
          <X className="size-5" />
        </button>
        <h3 id="rename-dialog-title" className="text-lg font-semibold text-white mb-3">
          Rename Diagram
        </h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            ref={inputRef}
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="Diagram name"
            disabled={isLoading}
            className={cn(
              'w-full px-3 py-2 rounded-lg',
              'bg-white/5 border border-white/10 text-white',
              'placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500'
            )}
          />
          <div className="flex gap-2 justify-end">
            <Button type="button" variant="ghost" onClick={onClose} disabled={isLoading}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading || !value.trim() || value.trim() === currentName}
            >
              {isLoading ? <Loader2 className="size-4 animate-spin" /> : 'Save'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
