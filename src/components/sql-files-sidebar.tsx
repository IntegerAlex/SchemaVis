/**
 * This file is part of the SchemaVis project.
 * Copyright (C) 2025 Akshat Kotpalliwar (IntegerAlex)
 * Licensed under the GNU Affero General Public License v3.0 or later.
 */
'use client';

import * as React from 'react';
import { FileText, ChevronLeft, ChevronRight, Loader2, RefreshCw } from 'lucide-react';
import { Button } from './ui/button';
import { cn } from '@/lib/utils';
import { useSqlFiles } from '@/hooks/use-sql-files';
import { useParseSQLContext } from '@/context/parse-sql-context';
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
}

export function SqlFilesSidebar({ className }: SqlFilesSidebarProps) {
  const [collapsed, setCollapsed] = React.useState(false);
  const { data, isLoading, error, refetch } = useSqlFiles();
  const { parseMutation } = useParseSQLContext();

  const handleFileClick = React.useCallback(
    async (fileId: number) => {
      try {
        const response = await fetch(`/api/sql-files/${fileId}`);
        if (!response.ok) throw new Error('Failed to fetch file');
        const { file } = await response.json();
        if (file?.content) {
          parseMutation.mutate(file.content);
        }
      } catch (error) {
        console.error('Error loading SQL file:', error);
      }
    },
    [parseMutation]
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
            <div className={cn("space-y-1", collapsed ? "px-2" : "px-2")} role="list" aria-label={`List of ${files.length} SQL ${files.length === 1 ? 'file' : 'files'}`}>
              {files.map((file) => (
                <button
                  key={file.id}
                  onClick={() => handleFileClick(file.id)}
                  disabled={parseMutation.isPending}
                  className={cn(
                    'w-full flex items-center',
                    'bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20',
                    'active:scale-[0.98] transition-all duration-300 ease-out',
                    parseMutation.isPending && 'opacity-50 cursor-not-allowed',
                    collapsed 
                      ? 'justify-center px-2 py-2 rounded-lg' 
                      : 'items-start gap-3 px-3 py-2.5 rounded-lg text-left'
                  )}
                  title={collapsed ? file.title || `File ${file.id}` : undefined}
                  aria-label={collapsed 
                    ? `Load SQL file: ${file.title || `Untitled ${file.id}`}`
                    : `Load SQL file: ${file.title || `Untitled ${file.id}`}, created ${formatDate(file.createdAt)}`
                  }
                  aria-describedby={collapsed ? undefined : `file-${file.id}-date`}
                  role="listitem"
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
                      <p className="text-sm font-medium text-white truncate">
                        {file.title || `Untitled ${file.id}`}
                      </p>
                      <p className="text-xs text-zinc-300 mt-0.5" id={`file-${file.id}-date`}>
                        {formatDate(file.createdAt)}
                      </p>
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}

