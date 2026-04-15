'use client';

/**
 * This file is part of the SchemaVis project.
 * Copyright (C) 2025 Akshat Kotpalliwar (IntegerAlex)
 * Licensed under the GNU Affero General Public License v3.0 or later.
 */

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Button } from './ui/button';
import { Trash2, Loader2, ChevronLeft, ChevronRight, FolderOpen, RefreshCw, Pencil } from 'lucide-react';
import { useDiagramDelete } from '@/hooks/use-diagram-delete';
import { useUpdateDiagram } from '@/hooks/use-update-diagram';
import { DeleteConfirmDialog } from './delete-confirm-dialog';
import { RenameDiagramDialog } from './rename-diagram-dialog';
import { cn } from '@/lib/utils';

interface Diagram {
  id: string;
  name: string;
  databaseType?: string;
  createdAt: string;
  updatedAt: string;
}

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

interface DiagramsSidebarProps {
  onBackClick?: () => void;
  className?: string;
}

export function DiagramsSidebar({ onBackClick, className }: DiagramsSidebarProps) {
  const router = useRouter();
  const [collapsed, setCollapsed] = React.useState(false);
  const [deleteTarget, setDeleteTarget] = React.useState<{ id: string; name: string } | null>(null);
  const [renameTarget, setRenameTarget] = React.useState<{ id: string; name: string } | null>(null);

  const { data: diagramsData, isLoading, refetch } = useQuery({
    queryKey: ['diagrams'],
    queryFn: async () => {
      const response = await fetch('/api/diagrams');
      if (!response.ok) throw new Error('Failed to fetch diagrams');
      const data = await response.json();
      return data as { diagrams: Diagram[] };
    },
  });

  const { deleteDiagram, isDeleting } = useDiagramDelete();
  const updateDiagramMutation = useUpdateDiagram();

  const handleOpenClick = React.useCallback(
    (diagramId: string) => {
      router.push(`/app/diagrams/${diagramId}`);
    },
    [router]
  );

  const handleDeleteClick = React.useCallback((diagramId: string, diagramName: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeleteTarget({ id: diagramId, name: diagramName });
  }, []);

  const handleRenameClick = React.useCallback((diagramId: string, diagramName: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setRenameTarget({ id: diagramId, name: diagramName });
  }, []);

  const handleRenameConfirm = React.useCallback(
    (newName: string) => {
      if (!renameTarget) return;
      updateDiagramMutation.mutate(
        { diagramId: renameTarget.id, name: newName },
        { onSuccess: () => setRenameTarget(null) }
      );
    },
    [renameTarget, updateDiagramMutation]
  );

  const handleDeleteConfirm = React.useCallback(() => {
    if (!deleteTarget) return;
    deleteDiagram(deleteTarget.id);
    setDeleteTarget(null);
  }, [deleteTarget, deleteDiagram]);

  const diagrams = diagramsData?.diagrams ?? [];

  return (
    <aside
      className={cn(
        'flex h-full flex-col',
        'transition-[width] duration-500 ease-out',
        'px-4 pt-4 pb-6',
        collapsed ? 'w-16' : 'w-80',
        className
      )}
      aria-label="Diagrams sidebar"
      style={{
        willChange: 'width',
        transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)',
      }}
    >
      <div className="flex flex-col h-full overflow-hidden rounded-2xl border border-white/10 bg-white/5 backdrop-blur-2xl shadow-[0_20px_70px_-30px_rgba(59,130,246,0.45)]">
        <div
          className={cn(
            'flex items-center border-b border-white/10 transition-all duration-500 ease-out',
            collapsed ? 'justify-center px-2 py-3' : 'justify-between gap-2 px-4 py-3'
          )}
        >
          {!collapsed && (
            <div className="flex items-center gap-2 flex-1">
              {onBackClick && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onBackClick}
                  className="h-8 w-8 text-zinc-300 hover:text-white hover:bg-white/10 rounded-lg shrink-0"
                >
                  <ChevronLeft className="size-4" />
                </Button>
              )}
              <FolderOpen className="size-5 text-blue-400 shrink-0" />
              <div className="flex-1 overflow-hidden">
                <h2 className="text-sm font-semibold text-white">My Diagrams</h2>
                <p className="text-xs text-zinc-300">{diagrams.length} diagram{diagrams.length !== 1 ? 's' : ''}</p>
              </div>
            </div>
          )}
          {collapsed && <FolderOpen className="size-5 text-blue-400" />}
          <div className="flex items-center gap-1">
            {!collapsed && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => refetch()}
                disabled={isLoading}
                className="h-8 w-8 text-zinc-300 hover:text-white hover:bg-white/10 rounded-lg"
                aria-label="Refresh diagrams"
              >
                <RefreshCw className={cn('size-4', isLoading && 'animate-spin')} />
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setCollapsed(!collapsed)}
              className="h-8 w-8 shrink-0 text-zinc-300 hover:text-white hover:bg-white/10 rounded-lg"
              aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {collapsed ? <ChevronRight className="size-4" /> : <ChevronLeft className="size-4" />}
            </Button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto py-2">
          {isLoading && (
            <div className="flex justify-center py-8">
              <Loader2 className="size-5 animate-spin text-zinc-300" />
            </div>
          )}

          {!isLoading && diagrams.length === 0 && (
            <div className="px-4 py-8 text-center">
              <FolderOpen className="size-8 mx-auto mb-2 text-zinc-400" />
              <p className="text-sm text-zinc-300">No diagrams yet</p>
              <p className="text-xs text-zinc-400 mt-1">Parse SQL to create diagrams</p>
            </div>
          )}

          {!isLoading && diagrams.length > 0 && (
            <div className={cn('space-y-1', collapsed ? 'px-2' : 'px-2')}>
              {diagrams.map((diagram) => (
                <div
                  key={diagram.id}
                  className={cn(
                    'w-full flex items-center group overflow-hidden',
                    'bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20',
                    'transition-all duration-300 ease-out rounded-lg',
                    collapsed ? 'justify-center px-2 py-2' : 'px-3 py-2.5 gap-2'
                  )}
                >
                  <button
                    onClick={() => handleOpenClick(diagram.id)}
                    className={cn(
                      'flex items-center flex-1 min-w-0 text-left',
                      'active:scale-[0.98]',
                      collapsed ? 'justify-center' : 'items-start gap-2'
                    )}
                    aria-label={`Open diagram: ${diagram.name}`}
                  >
                    <FolderOpen className="shrink-0 text-blue-400 size-4 mt-0.5" />
                    {!collapsed && (
                      <div className="flex-1 min-w-0 overflow-hidden">
                        <p className="text-sm font-medium text-white truncate">{diagram.name}</p>
                        <p className="text-xs text-zinc-300 mt-0.5 truncate">{formatDate(diagram.createdAt)}</p>
                      </div>
                    )}
                  </button>
                  {!collapsed && (
                    <>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => handleRenameClick(diagram.id, diagram.name, e)}
                        disabled={updateDiagramMutation.isPending}
                        className="h-7 w-7 text-zinc-400 hover:text-blue-400 hover:bg-blue-500/20 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg shrink-0"
                        aria-label={`Rename diagram: ${diagram.name}`}
                      >
                        <Pencil className="size-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => handleDeleteClick(diagram.id, diagram.name, e)}
                      disabled={isDeleting}
                      className="h-7 w-7 text-zinc-400 hover:text-red-400 hover:bg-red-900/20 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg shrink-0"
                      aria-label={`Delete diagram: ${diagram.name}`}
                    >
                      {isDeleting && deleteTarget?.id === diagram.id ? (
                        <Loader2 className="size-3.5 animate-spin" />
                      ) : (
                        <Trash2 className="size-3.5" />
                      )}
                    </Button>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <DeleteConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteConfirm}
        type="diagram"
        itemName={deleteTarget?.name}
        isLoading={isDeleting}
      />

      <RenameDiagramDialog
        isOpen={!!renameTarget}
        onClose={() => setRenameTarget(null)}
        currentName={renameTarget?.name ?? ''}
        onRename={handleRenameConfirm}
        isLoading={updateDiagramMutation.isPending}
      />
    </aside>
  );
}
