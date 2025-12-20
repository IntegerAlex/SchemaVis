/**
 * This file is part of the SchemaVis project.
 * Copyright (C) 2025 Akshat Kotpalliwar (IntegerAlex)
 * Licensed under the GNU Affero General Public License v3.0 or later.
 */
'use client';

import * as React from 'react';
import {
  X,
  Copy,
  Check,
  Link2,
  UserPlus,
  Globe,
  Lock,
  Trash2,
  RefreshCw,
  Loader2,
} from 'lucide-react';
import { Button } from './ui/button';
import { cn } from '@/lib/utils';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

interface ShareDialogProps {
  isOpen: boolean;
  onClose: () => void;
  diagramId: string;
  diagramName: string;
  diagramContent?: Record<string, unknown>;
  databaseType?: string;
}

interface ShareSettings {
  isPublic: boolean;
  linkPermission: 'view' | 'edit';
  shareToken: string | null;
  shareUrl: string | null;
}

interface Permission {
  id: number;
  userId: string;
  userName: string | null;
  userEmail: string | null;
  userImageUrl: string | null;
  role: 'owner' | 'editor' | 'viewer';
  createdAt: string;
}

export function ShareDialog({ isOpen, onClose, diagramId, diagramName, diagramContent, databaseType }: ShareDialogProps) {
  const [copied, setCopied] = React.useState(false);
  const [inviteEmail, setInviteEmail] = React.useState('');
  const [inviteRole, setInviteRole] = React.useState<'editor' | 'viewer'>('viewer');
  const [inviteError, setInviteError] = React.useState<string | null>(null);
  const queryClient = useQueryClient();

  // Fetch share settings
  const { data: shareSettings, isLoading: isLoadingShare } = useQuery({
    queryKey: ['diagram-share', diagramId],
    queryFn: async (): Promise<ShareSettings> => {
      const response = await fetch(`/api/diagrams/${diagramId}/share`);
      if (!response.ok) throw new Error('Failed to fetch share settings');
      return response.json();
    },
    enabled: isOpen && !!diagramId,
  });

  // Fetch permissions
  const { data: permissionsData, isLoading: isLoadingPermissions } = useQuery({
    queryKey: ['diagram-permissions', diagramId],
    queryFn: async () => {
      const response = await fetch(`/api/diagrams/${diagramId}/permissions`);
      if (!response.ok) throw new Error('Failed to fetch permissions');
      return response.json();
    },
    enabled: isOpen && !!diagramId,
  });

  // Update share settings mutation
  const updateShareMutation = useMutation({
    mutationFn: async (updates: Partial<ShareSettings & { regenerateToken?: boolean }>) => {
      // If enabling sharing and we have diagram content, include it to auto-save the diagram
      const body: Record<string, unknown> = { ...updates };
      if (updates.isPublic === true && diagramContent && databaseType) {
        body.diagramContent = diagramContent;
        body.diagramName = diagramName;
        body.databaseType = databaseType;
      }
      
      const response = await fetch(`/api/diagrams/${diagramId}/share`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!response.ok) throw new Error('Failed to update share settings');
      return response.json();
    },
    onSuccess: (data) => {
      // Optimistically update the cache with the response data
      queryClient.setQueryData(['diagram-share', diagramId], data);
    },
  });

  // Add permission mutation
  const addPermissionMutation = useMutation({
    mutationFn: async ({ email, role }: { email: string; role: 'editor' | 'viewer' }) => {
      const response = await fetch(`/api/diagrams/${diagramId}/permissions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, role }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to add permission');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['diagram-permissions', diagramId] });
      setInviteEmail('');
      setInviteError(null);
    },
    onError: (error: Error) => {
      setInviteError(error.message);
    },
  });

  // Remove permission mutation
  const removePermissionMutation = useMutation({
    mutationFn: async (userId: string) => {
      const response = await fetch(
        `/api/diagrams/${diagramId}/permissions?userId=${userId}`,
        { method: 'DELETE' }
      );
      if (!response.ok) throw new Error('Failed to remove permission');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['diagram-permissions', diagramId] });
    },
  });

  // Update permission role mutation
  const updatePermissionMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: 'editor' | 'viewer' }) => {
      const response = await fetch(`/api/diagrams/${diagramId}/permissions`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, role }),
      });
      if (!response.ok) throw new Error('Failed to update permission');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['diagram-permissions', diagramId] });
    },
  });

  const handleCopyLink = React.useCallback(async () => {
    if (shareSettings?.shareUrl) {
      await navigator.clipboard.writeText(shareSettings.shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [shareSettings?.shareUrl]);

  const handleInvite = React.useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (!inviteEmail.trim()) return;
      setInviteError(null);
      addPermissionMutation.mutate({ email: inviteEmail.trim(), role: inviteRole });
    },
    [inviteEmail, inviteRole, addPermissionMutation]
  );

  const permissions = permissionsData?.permissions ?? [];

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
          'relative z-50 w-full max-w-lg mx-4',
          'bg-slate-900/95 backdrop-blur-2xl border border-white/10',
          'rounded-2xl shadow-[0_20px_70px_-30px_rgba(59,130,246,0.45)]',
          'max-h-[90vh] overflow-hidden flex flex-col'
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <div>
            <h2 className="text-lg font-semibold text-white">Share "{diagramName}"</h2>
            <p className="text-sm text-zinc-400 mt-0.5">
              Invite collaborators or generate a shareable link
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-white transition-colors"
            aria-label="Close"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {isLoadingShare ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="size-6 animate-spin text-zinc-400" />
            </div>
          ) : (
            <>
              {/* Link sharing section */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Link2 className="size-4 text-zinc-400" />
                    <span className="text-sm font-medium text-white">Link sharing</span>
                  </div>
                  <button
                    onClick={() => updateShareMutation.mutate({ isPublic: !shareSettings?.isPublic })}
                    disabled={updateShareMutation.isPending}
                    className={cn(
                      'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
                      shareSettings?.isPublic ? 'bg-blue-600' : 'bg-zinc-700'
                    )}
                    aria-label={shareSettings?.isPublic ? 'Disable link sharing' : 'Enable link sharing'}
                  >
                    <span
                      className={cn(
                        'inline-block h-4 w-4 rounded-full bg-white transition-transform',
                        shareSettings?.isPublic ? 'translate-x-6' : 'translate-x-1'
                      )}
                    />
                  </button>
                </div>

                {shareSettings?.isPublic && (
                  <div className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
                    {/* Link permission */}
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-zinc-400">Anyone with the link can</span>
                      <select
                        value={shareSettings.linkPermission}
                        onChange={(e) =>
                          updateShareMutation.mutate({
                            linkPermission: e.target.value as 'view' | 'edit',
                          })
                        }
                        className="bg-slate-800 border border-white/10 rounded-lg px-2 py-1 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="view">View</option>
                        <option value="edit">Edit</option>
                      </select>
                    </div>

                    {/* Share URL */}
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-slate-800 border border-white/10 rounded-lg px-3 py-2 text-sm text-zinc-300 truncate">
                        {shareSettings.shareUrl || 'No link generated'}
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={handleCopyLink}
                        disabled={!shareSettings.shareUrl}
                        className="shrink-0 h-9 w-9 text-zinc-400 hover:text-white hover:bg-white/10"
                        aria-label="Copy link"
                      >
                        {copied ? <Check className="size-4 text-green-500" /> : <Copy className="size-4" />}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => updateShareMutation.mutate({ regenerateToken: true })}
                        disabled={updateShareMutation.isPending}
                        className="shrink-0 h-9 w-9 text-zinc-400 hover:text-white hover:bg-white/10"
                        aria-label="Generate new link"
                      >
                        <RefreshCw className={cn('size-4', updateShareMutation.isPending && 'animate-spin')} />
                      </Button>
                    </div>

                    <p className="text-xs text-zinc-500">
                      {shareSettings.linkPermission === 'edit' ? (
                        <>
                          <Globe className="inline size-3 mr-1" />
                          Anyone with the link can edit this diagram
                        </>
                      ) : (
                        <>
                          <Lock className="inline size-3 mr-1" />
                          Anyone with the link can view this diagram
                        </>
                      )}
                    </p>
                  </div>
                )}
              </div>

              <div className="border-t border-white/10" />

              {/* Invite people section */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <UserPlus className="size-4 text-zinc-400" />
                  <span className="text-sm font-medium text-white">Invite people</span>
                </div>

                <form onSubmit={handleInvite} className="flex items-center gap-2">
                  <input
                    type="email"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="Enter email address"
                    className="flex-1 bg-slate-800 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <select
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value as 'editor' | 'viewer')}
                    className="bg-slate-800 border border-white/10 rounded-lg px-2 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="viewer">Viewer</option>
                    <option value="editor">Editor</option>
                  </select>
                  <Button
                    type="submit"
                    disabled={!inviteEmail.trim() || addPermissionMutation.isPending}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4"
                  >
                    {addPermissionMutation.isPending ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      'Invite'
                    )}
                  </Button>
                </form>

                {inviteError && (
                  <p className="text-sm text-red-400">{inviteError}</p>
                )}

                {/* Permissions list */}
                {isLoadingPermissions ? (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="size-5 animate-spin text-zinc-400" />
                  </div>
                ) : permissions.length > 0 ? (
                  <div className="space-y-2">
                    <p className="text-xs text-zinc-500 uppercase tracking-wide">
                      People with access
                    </p>
                    <div className="space-y-1">
                      {permissions.map((permission: Permission) => (
                        <div
                          key={permission.id}
                          className="flex items-center justify-between p-2 rounded-lg hover:bg-white/5 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            {permission.userImageUrl ? (
                              <img
                                src={permission.userImageUrl}
                                alt={permission.userName || permission.userEmail || ''}
                                className="size-8 rounded-full"
                              />
                            ) : (
                              <div className="size-8 rounded-full bg-zinc-700 flex items-center justify-center text-xs font-medium text-white">
                                {(permission.userName || permission.userEmail || '??').slice(0, 2).toUpperCase()}
                              </div>
                            )}
                            <div>
                              <p className="text-sm font-medium text-white">
                                {permission.userName || 'Unknown'}
                              </p>
                              <p className="text-xs text-zinc-400">
                                {permission.userEmail}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {permission.role === 'owner' ? (
                              <span className="text-xs text-zinc-400 px-2 py-1">Owner</span>
                            ) : (
                              <>
                                <select
                                  value={permission.role}
                                  onChange={(e) =>
                                    updatePermissionMutation.mutate({
                                      userId: permission.userId,
                                      role: e.target.value as 'editor' | 'viewer',
                                    })
                                  }
                                  className="bg-slate-800 border border-white/10 rounded px-2 py-1 text-xs text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                  <option value="viewer">Viewer</option>
                                  <option value="editor">Editor</option>
                                </select>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => removePermissionMutation.mutate(permission.userId)}
                                  disabled={removePermissionMutation.isPending}
                                  className="h-7 w-7 text-zinc-400 hover:text-red-400 hover:bg-red-900/20"
                                  aria-label={`Remove ${permission.userName || permission.userEmail}`}
                                >
                                  <Trash2 className="size-3.5" />
                                </Button>
                              </>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-zinc-500 text-center py-4">
                    No one else has access yet
                  </p>
                )}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-white/10">
          <Button
            variant="ghost"
            onClick={onClose}
            className="text-zinc-300 hover:text-white hover:bg-white/10"
          >
            Done
          </Button>
        </div>
      </div>
    </div>
  );
}

