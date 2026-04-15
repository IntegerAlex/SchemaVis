/**
 * This file is part of the SchemaVis project.
 * Copyright (C) 2025 Akshat Kotpalliwar (IntegerAlex)
 * Licensed under the GNU Affero General Public License v3.0 or later.
 */
'use client';

import * as React from 'react';
import { FileText, ChevronLeft, ChevronRight, Loader2, RefreshCw, Trash2, Pencil, Check, X } from 'lucide-react';
import { Button } from './ui/button';
import { cn } from '@/lib/utils';
import { useSqlFiles } from '@/hooks/use-sql-files';
import { useParseSQLContext } from '@/context/parse-sql-context';
import { useQueryClient } from '@tanstack/react-query';
import { DeleteConfirmDialog } from './delete-confirm-dialog';
function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  return d.toLocaleDateString();
}

interface SqlFilesSidebarProps {
  className?: string;
  onFileLoad?: (sqlContent: string, fileName: string) => void;
  activeFileName?: string | null;
}

export function SqlFilesSidebar({ className, onFileLoad, activeFileName }: SqlFilesSidebarProps) {
  const [collapsed, setCollapsed] = React.useState(false);
  const [deletingId, setDeletingId] = React.useState<number | null>(null);
  const [confirmDelete, setConfirmDelete] = React.useState<{ fileId: number; fileName: string } | null>(null);
  const [renamingId, setRenamingId] = React.useState<number | null>(null);
  const [renameValue, setRenameValue] = React.useState('');
  const [isRenaming, setIsRenaming] = React.useState(false);
  const isRenamingRef = React.useRef(false);
  const blurTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const renameInputRef = React.useRef<HTMLInputElement>(null);
  const { data, isLoading, error, refetch } = useSqlFiles();
  const { parseMutation } = useParseSQLContext();
  const queryClient = useQueryClient();

  // Keep ref in sync with state
  React.useEffect(() => {
    isRenamingRef.current = isRenaming;
  }, [isRenaming]);

  // Clean up blur timeout on unmount
  React.useEffect(() => {
    return () => {
      if (blurTimeoutRef.current) {
        clearTimeout(blurTimeoutRef.current);
      }
    };
  }, []);

  const handleFileClick = React.useCallback(
    async (fileId: number) => {
      try {
        const response = await fetch(`/api/sql-files/${fileId}`);
        if (!response.ok) throw new Error('Failed to fetch file');
        const { file } = await response.json();
        if (file?.content) {
          const fileName = file.title || `File ${file.id}`;
          
          // Use the onFileLoad callback if provided, otherwise fall back to direct mutation
          if (onFileLoad) {
            onFileLoad(file.content, fileName);
          } else {
            parseMutation.mutate({ sql: file.content });
          }
        }
      } catch (error) {
        console.error('Error loading SQL file:', error);
      }
    },
    [parseMutation, onFileLoad]
  );

  const handleDeleteClick = React.useCallback(
    (fileId: number, fileName: string, e: React.MouseEvent) => {
      e.stopPropagation();
      setConfirmDelete({ fileId, fileName });
    },
    []
  );

  const handleDeleteConfirm = React.useCallback(
    async () => {
      if (!confirmDelete) return;

      const { fileId } = confirmDelete;
      setDeletingId(fileId);
      setConfirmDelete(null);

      try {
        const response = await fetch(`/api/sql-files/${fileId}`, {
          method: 'DELETE',
        });
        
        if (!response.ok) {
          throw new Error('Failed to delete file');
        }

        // Invalidate the files list; active queries will refetch automatically
        await queryClient.invalidateQueries({ queryKey: ['sql-files'] });
      } catch (error) {
        console.error('Error deleting SQL file:', error);
        // Show error toast or notification here if you have one
      } finally {
        setDeletingId(null);
      }
    },
    [confirmDelete, queryClient]
  );

  const handleDeleteCancel = React.useCallback(() => {
    setConfirmDelete(null);
  }, []);

  const handleRenameStart = React.useCallback(
    (fileId: number, currentName: string, e: React.MouseEvent) => {
      e.stopPropagation();
      setRenamingId(fileId);
      setRenameValue(currentName);
      // Focus the input after render
      setTimeout(() => renameInputRef.current?.focus(), 0);
    },
    []
  );

  const handleRenameConfirm = React.useCallback(
    async () => {
      // Cancel any pending blur timeout to prevent duplicate calls
      if (blurTimeoutRef.current) {
        clearTimeout(blurTimeoutRef.current);
        blurTimeoutRef.current = null;
      }

      // Guard against concurrent execution (synchronous check + set)
      if (isRenamingRef.current) return;
      isRenamingRef.current = true;

      if (!renamingId || !renameValue.trim()) {
        isRenamingRef.current = false;
        setRenamingId(null);
        return;
      }

      setIsRenaming(true);
      try {
        const response = await fetch(`/api/sql-files/${renamingId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title: renameValue.trim() }),
        });

        if (!response.ok) {
          throw new Error('Failed to rename file');
        }

        await queryClient.invalidateQueries({ queryKey: ['sql-files'] });
      } catch (err) {
        console.error('Error renaming SQL file:', err);
      } finally {
        isRenamingRef.current = false;
        setIsRenaming(false);
        setRenamingId(null);
      }
    },
    [renamingId, renameValue, queryClient]
  );

  const handleRenameCancel = React.useCallback(() => {
    // Cancel any pending blur timeout
    if (blurTimeoutRef.current) {
      clearTimeout(blurTimeoutRef.current);
      blurTimeoutRef.current = null;
    }
    setRenamingId(null);
    setRenameValue('');
  }, []);

  const RENAME_BLUR_DEBOUNCE_MS = 150;

  const handleRenameBlur = React.useCallback(() => {
    // Cancel any pending blur timeout
    if (blurTimeoutRef.current) {
      clearTimeout(blurTimeoutRef.current);
    }
    // Small delay to allow button clicks to register before blur confirms the rename
    blurTimeoutRef.current = setTimeout(() => {
      blurTimeoutRef.current = null;
      // Use ref to check latest isRenaming state
      if (!isRenamingRef.current) {
        handleRenameConfirm();
      }
    }, RENAME_BLUR_DEBOUNCE_MS);
  }, [handleRenameConfirm]);

  const handleRenameKeyDown = React.useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleRenameConfirm();
      } else if (e.key === 'Escape') {
        handleRenameCancel();
      }
    },
    [handleRenameConfirm, handleRenameCancel]
  );

  const files = data?.files ?? [];

  return (
    <aside
      className={cn(
        'flex h-full flex-col',
        'transition-[width] duration-500 ease-out',
        'px-4 pt-4 pb-6',
        collapsed ? 'w-16' : 'w-80',
        className
      )}
      aria-label="SQL files sidebar"
      style={{ 
        willChange: 'width',
        transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)'
      }}
    >
      <div className="flex flex-col h-full overflow-hidden rounded-2xl border border-white/10 bg-white/5 backdrop-blur-2xl shadow-[0_20px_70px_-30px_rgba(59,130,246,0.45)] rounded-tl-2xl rounded-tr-2xl">
        {/* Header */}
        <div 
          className={cn(
            "flex items-center border-b border-white/10 relative transition-all duration-500 ease-out",
            collapsed ? "justify-center px-2 py-3" : "justify-between gap-2 px-4 py-3"
          )} 
          aria-label="Sidebar header"
          style={{ transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)' }}
        >
          {!collapsed && (
            <div 
              className="flex items-center gap-2 flex-1 transition-opacity duration-500 ease-out" 
              style={{ 
                opacity: collapsed ? 0 : 1,
                transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)'
              }}
            >
              <FileText className="size-5 text-blue-400 transition-transform duration-500 ease-out" aria-hidden="true" style={{ transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)' }} />
              <div className="flex-1 overflow-hidden">
                <h2 className="text-sm font-semibold text-white transition-opacity duration-500 ease-out" style={{ transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)' }}>
                  SQL Files
                </h2>
                <p className="text-xs text-zinc-300 transition-opacity duration-500 ease-out" aria-live="polite" aria-atomic="true" style={{ transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)' }}>
                  {files.length} {files.length === 1 ? 'file' : 'files'}
                </p>
              </div>
            </div>
          )}
          {collapsed && (
            <div 
              className="flex justify-center flex-1 transition-opacity duration-500 ease-out" 
              aria-label="SQL Files"
              style={{ 
                opacity: collapsed ? 1 : 0,
                transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)'
              }}
            >
              <FileText className="size-5 text-blue-400 transition-transform duration-500 ease-out" aria-hidden="true" style={{ transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)' }} />
            </div>
          )}
          <div 
            className={cn(
              "flex items-center gap-1 transition-all duration-500 ease-out",
              collapsed && "absolute right-2"
            )}
            style={{ transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)' }}
          >
            {!collapsed && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => refetch()}
                disabled={isLoading}
                className="h-8 w-8 text-zinc-300 hover:text-white hover:bg-white/10 border border-transparent hover:border-white/10 transition-all duration-300 ease-out rounded-lg"
                aria-label="Refresh files"
                style={{ 
                  opacity: collapsed ? 0 : 1, 
                  pointerEvents: collapsed ? 'none' : 'auto',
                  transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)'
                }}
              >
                <RefreshCw
                  className={cn('size-4 transition-transform duration-500 ease-out', isLoading && 'animate-spin')}
                  style={{ transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)' }}
                />
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setCollapsed(!collapsed)}
              className="h-8 w-8 shrink-0 text-zinc-300 hover:text-white hover:bg-white/10 border border-transparent hover:border-white/10 transition-all duration-300 ease-out rounded-lg"
              aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              style={{ transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)' }}
            >
              {collapsed ? (
                <ChevronRight className="size-4 transition-transform duration-500 ease-out" style={{ transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)' }} />
              ) : (
                <ChevronLeft className="size-4 transition-transform duration-500 ease-out" style={{ transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)' }} />
              )}
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto py-2" role="region" aria-label="SQL files list">
          {isLoading && (
            <div className="flex items-center justify-center py-8" aria-live="polite" aria-label="Loading SQL files">
              <Loader2 className="size-5 animate-spin text-zinc-300" aria-hidden="true" />
              <span className="sr-only">Loading SQL files</span>
            </div>
          )}

          {error && (
            <div className="px-4 py-3 mx-2 my-2 rounded-lg bg-red-900/20 border border-red-800/50" role="alert" aria-live="assertive">
              <p className="text-sm text-red-400">
                Failed to load files
              </p>
            </div>
          )}

          {!isLoading && !error && files.length === 0 && (
            <div className="px-4 py-8 text-center" aria-label="No SQL files">
              <FileText className="size-8 mx-auto mb-2 text-zinc-400" aria-hidden="true" />
              <p className="text-sm text-zinc-300">
                No SQL files yet
              </p>
              <p className="text-xs text-zinc-400 mt-1">
                Upload files to see them here
              </p>
            </div>
          )}

          {!isLoading && !error && files.length > 0 && (
            <div className={cn("space-y-1 overflow-x-hidden", collapsed ? "px-2" : "px-2")} role="list" aria-label={`List of ${files.length} SQL ${files.length === 1 ? 'file' : 'files'}`}>
              {files.map((file) => {
                const isActive = activeFileName && (activeFileName === file.title || (!file.title && activeFileName === `File ${file.id}`));
                return (
                  <div
                    key={file.id}
                    className={cn(
                      'w-full flex items-center group overflow-hidden',
                      isActive ? 'bg-white/10 border-white/20' : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20',
                      'border transition-all duration-300 ease-out rounded-lg',
                      collapsed ? 'justify-center px-2 py-2' : 'px-3 py-2.5 gap-2'
                    )}
                    role="listitem"
                  >                  {/* Inline rename mode */}
                  {renamingId === file.id && !collapsed ? (
                    <div className="flex items-center gap-1.5 flex-1 min-w-0">
                      <FileText className="shrink-0 text-blue-400 size-4 mt-0.5" aria-hidden="true" />
                      <input
                        ref={renameInputRef}
                        type="text"
                        value={renameValue}
                        onChange={(e) => setRenameValue(e.target.value)}
                        onKeyDown={handleRenameKeyDown}
                        onBlur={handleRenameBlur}
                        disabled={isRenaming}
                        className="flex-1 min-w-0 px-1.5 py-0.5 text-sm font-medium text-white bg-white/10 border border-blue-500/50 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                        aria-label="Rename file"
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={handleRenameConfirm}
                        disabled={isRenaming}
                        className="h-6 w-6 text-green-400 hover:text-green-300 hover:bg-green-900/20 rounded shrink-0"
                        aria-label="Confirm rename"
                      >
                        {isRenaming ? <Loader2 className="size-3 animate-spin" /> : <Check className="size-3" />}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={handleRenameCancel}
                        disabled={isRenaming}
                        className="h-6 w-6 text-zinc-400 hover:text-white hover:bg-white/10 rounded shrink-0"
                        aria-label="Cancel rename"
                      >
                        <X className="size-3" />
                      </Button>
                    </div>
                  ) : (
                    <>
                      <button
                        onClick={() => handleFileClick(file.id)}
                        disabled={parseMutation.isPending || deletingId === file.id}
                        className={cn(
                          'flex items-center flex-1 min-w-0',
                          'active:scale-[0.98]',
                          parseMutation.isPending && 'opacity-50 cursor-not-allowed',
                          deletingId === file.id && 'opacity-50 cursor-not-allowed',
                          collapsed 
                            ? 'justify-center' 
                            : 'items-start gap-2 text-left'
                        )}
                        title={collapsed ? file.title || `File ${file.id}` : file.title || `Untitled ${file.id}`}
                        aria-label={collapsed 
                          ? `Load SQL file: ${file.title || `Untitled ${file.id}`}`
                          : `Load SQL file: ${file.title || `Untitled ${file.id}`}, created ${formatDate(file.createdAt)}`
                        }
                        aria-describedby={collapsed ? undefined : `file-${file.id}-date`}
                        style={{ transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)' }}
                      >
                        <FileText 
                          className={cn(
                            "shrink-0 text-blue-400 transition-all duration-500 ease-out",
                            collapsed ? "size-5" : "size-4 mt-0.5"
                          )} 
                          aria-hidden="true"
                          style={{ transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)' }}
                        />
                        {!collapsed && (
                          <div 
                            className="flex-1 min-w-0 overflow-hidden transition-opacity duration-500 ease-out" 
                            style={{ 
                              opacity: collapsed ? 0 : 1,
                              transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)'
                            }}
                          >
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-medium text-white truncate">
                                {file.title || `Untitled ${file.id}`}
                              </p>
                              {isActive && (
                                <span 
                                  className="size-2 rounded-full bg-green-500 shrink-0 shadow-[0_0_8px_rgba(34,197,94,0.6)]" 
                                  aria-label="Active file" 
                                />
                              )}
                            </div>
                            <p className="text-xs text-zinc-300 mt-0.5 truncate" id={`file-${file.id}-date`}>                              {formatDate(file.createdAt)}
                            </p>
                          </div>
                        )}
                      </button>
                      {!collapsed && (
                        <div className="flex items-center gap-0.5 shrink-0">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => handleRenameStart(file.id, file.title || `Untitled ${file.id}`, e)}
                            disabled={deletingId === file.id}
                            className="h-7 w-7 text-zinc-400 hover:text-blue-400 hover:bg-blue-900/20 opacity-0 group-hover:opacity-100 transition-opacity duration-200 rounded-lg"
                            aria-label={`Rename SQL file: ${file.title || `Untitled ${file.id}`}`}
                          >
                            <Pencil className="size-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => handleDeleteClick(file.id, file.title || `Untitled ${file.id}`, e)}
                            disabled={deletingId === file.id}
                            className="h-7 w-7 text-zinc-400 hover:text-red-400 hover:bg-red-900/20 opacity-0 group-hover:opacity-100 transition-opacity duration-200 rounded-lg"
                            aria-label={`Delete SQL file: ${file.title || `Untitled ${file.id}`}`}
                          >
                            {deletingId === file.id ? (
                              <Loader2 className="size-3.5 animate-spin" />
                            ) : (
                              <Trash2 className="size-3.5" />
                            )}
                          </Button>
                        </div>
                      )}
                    </>
                  )}
                </div>
                );
                })}
                </div>          )}
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmDialog
        isOpen={!!confirmDelete}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        type="file"
        itemName={confirmDelete?.fileName}
        isLoading={deletingId === confirmDelete?.fileId}
      />
    </aside>
  );
}

