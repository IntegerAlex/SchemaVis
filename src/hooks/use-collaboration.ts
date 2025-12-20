/**
 * This file is part of the SchemaVis project.
 * Copyright (C) 2025 Akshat Kotpalliwar (IntegerAlex)
 * Licensed under the GNU Affero General Public License v3.0 or later.
 */
'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  CollaboratorInfo,
  CursorPosition,
  ConnectionState,
  CommentData,
  Viewport,
} from '@/lib/collaboration/types';
import { getUserColor } from '@/lib/collaboration/types';

interface UseCollaborationOptions {
  diagramId: string | null;
  enabled?: boolean;
  onDiagramUpdate?: (content: Record<string, unknown>, version: number, userId: string) => void;
  onNodeDrag?: (nodeId: string, x: number, y: number, userId: string) => void;
  onNodeDragEnd?: (nodeId: string, x: number, y: number, userId: string) => void;
  onCommentCreated?: (comment: CommentData) => void;
  onCommentResolved?: (commentId: number, resolved: boolean) => void;
  onCommentDeleted?: (commentId: number) => void;
}

interface UseCollaborationReturn {
  connectionState: ConnectionState;
  currentUser: CollaboratorInfo | null;
  activeUsers: CollaboratorInfo[];
  cursors: Map<string, CursorPosition>;
  canEdit: boolean;
  isOwner: boolean;
  sendCursorMove: (x: number, y: number) => void;
  sendViewportChange: (viewport: Viewport) => void;
  sendNodeDrag: (nodeId: string, x: number, y: number) => void;
  sendNodeDragEnd: (nodeId: string, x: number, y: number) => void;
  sendDiagramUpdate: (content: Record<string, unknown>, version: number) => void;
  sendCommentCreate: (content: string, x: number, y: number, parentId?: number) => void;
  sendCommentResolve: (commentId: number) => void;
  sendCommentDelete: (commentId: number) => void;
}

const POLL_INTERVAL = 2000; // Poll every 2 seconds
const CURSOR_THROTTLE_MS = 200; // Throttle cursor updates

export function useCollaboration(options: UseCollaborationOptions): UseCollaborationReturn {
  const {
    diagramId,
    enabled = true,
    onDiagramUpdate,
    onNodeDrag,
    onNodeDragEnd,
    onCommentCreated,
    onCommentResolved,
    onCommentDeleted,
  } = options;

  const [connectionState, setConnectionState] = useState<ConnectionState>('disconnected');
  const [currentUser, setCurrentUser] = useState<CollaboratorInfo | null>(null);
  const [activeUsers, setActiveUsers] = useState<CollaboratorInfo[]>([]);
  const [cursors, setCursors] = useState<Map<string, CursorPosition>>(new Map());
  const [canEdit, setCanEdit] = useState(false);
  const [isOwner, setIsOwner] = useState(false);
  const queryClient = useQueryClient();

  const lastCursorSend = useRef(0);
  const lastCursorPosition = useRef<{ x: number; y: number } | null>(null);
  const heartbeatIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Poll for presence updates
  const { data: presenceData } = useQuery({
    queryKey: ['diagram-presence', diagramId],
    queryFn: async () => {
      if (!diagramId) return null;
      const response = await fetch(`/api/diagrams/${diagramId}/presence`);
      if (!response.ok) throw new Error('Failed to fetch presence');
      return response.json();
    },
    enabled: enabled && !!diagramId,
    refetchInterval: POLL_INTERVAL,
  });

  // Update active users and cursors from presence data
  useEffect(() => {
    if (!presenceData?.users) return;

    const users: CollaboratorInfo[] = presenceData.users.map((u: {
      id: string;
      name: string | null;
      email: string | null;
      imageUrl: string | null;
      cursorX: number | null;
      cursorY: number | null;
      color?: string;
    }) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      imageUrl: u.imageUrl,
      role: 'viewer' as const, // Will be updated from API
    }));

    setActiveUsers(users);

    // Update cursors
    setCursors((prev) => {
      const next = new Map(prev);
      for (const user of presenceData.users) {
        if (user.cursorX !== null && user.cursorY !== null) {
          next.set(user.id, {
            userId: user.id,
            x: user.cursorX,
            y: user.cursorY,
            color: user.color || getUserColor(user.id),
          });
        } else {
          next.delete(user.id);
        }
      }
      return next;
    });

    // Update permissions if available
    if (presenceData.role) {
      setCanEdit(presenceData.canEdit || false);
      setIsOwner(presenceData.isOwner || false);
    }
  }, [presenceData]);

  // Send heartbeat with cursor position
  useEffect(() => {
    if (!enabled || !diagramId) {
      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current);
        heartbeatIntervalRef.current = null;
      }
      return;
    }

    setConnectionState('connected');

    // Send heartbeat every 1 second
    heartbeatIntervalRef.current = setInterval(() => {
      if (lastCursorPosition.current) {
        fetch(`/api/diagrams/${diagramId}/presence`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            cursorX: lastCursorPosition.current.x,
            cursorY: lastCursorPosition.current.y,
          }),
        }).catch(console.error);
      }
    }, 1000);

    return () => {
      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current);
        heartbeatIntervalRef.current = null;
      }
    };
  }, [enabled, diagramId]);

  // Throttled cursor movement
  const sendCursorMove = useCallback(
    (x: number, y: number) => {
      if (!diagramId) return;

      const now = Date.now();
      if (now - lastCursorSend.current < CURSOR_THROTTLE_MS) {
        lastCursorPosition.current = { x, y };
        return;
      }

      lastCursorSend.current = now;
      lastCursorPosition.current = { x, y };

      // Send via API
      fetch(`/api/diagrams/${diagramId}/presence`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cursorX: x, cursorY: y }),
      }).catch(console.error);
    },
    [diagramId]
  );

  const sendViewportChange = useCallback(
    (_viewport: Viewport) => {
      // Viewport changes are less critical, can be ignored for polling-based approach
    },
    []
  );

  const sendNodeDrag = useCallback(
    async (nodeId: string, x: number, y: number) => {
      if (!diagramId || !canEdit) return;
      // Node drags are handled via diagram updates
    },
    [diagramId, canEdit]
  );

  const sendNodeDragEnd = useCallback(
    async (nodeId: string, x: number, y: number) => {
      if (!diagramId || !canEdit) return;
      // Node drags are handled via diagram updates
    },
    [diagramId, canEdit]
  );

  const sendDiagramUpdate = useCallback(
    async (content: Record<string, unknown>, version: number) => {
      if (!diagramId || !canEdit) return;

      try {
        const response = await fetch(`/api/diagrams/${diagramId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content, version }),
        });

        if (!response.ok) {
          throw new Error('Failed to update diagram');
        }

        // Invalidate queries to refresh
        queryClient.invalidateQueries({ queryKey: ['diagram', diagramId] });
      } catch (error) {
        console.error('[Collaboration] Failed to update diagram:', error);
      }
    },
    [diagramId, canEdit, queryClient]
  );

  const sendCommentCreate = useCallback(
    async (content: string, x: number, y: number, parentId?: number) => {
      if (!diagramId) return;

      try {
        const response = await fetch(`/api/diagrams/${diagramId}/comments`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content, x, y, parentId }),
        });

        if (!response.ok) throw new Error('Failed to create comment');

        const { comment } = await response.json();
        onCommentCreated?.(comment);
        queryClient.invalidateQueries({ queryKey: ['diagram-comments', diagramId] });
      } catch (error) {
        console.error('[Collaboration] Failed to create comment:', error);
      }
    },
    [diagramId, onCommentCreated, queryClient]
  );

  const sendCommentResolve = useCallback(
    async (commentId: number) => {
      if (!diagramId) return;

      try {
        const response = await fetch(`/api/diagrams/${diagramId}/comments`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ commentId, resolved: true }),
        });

        if (!response.ok) throw new Error('Failed to resolve comment');

        onCommentResolved?.(commentId, true);
        queryClient.invalidateQueries({ queryKey: ['diagram-comments', diagramId] });
      } catch (error) {
        console.error('[Collaboration] Failed to resolve comment:', error);
      }
    },
    [diagramId, onCommentResolved, queryClient]
  );

  const sendCommentDelete = useCallback(
    async (commentId: number) => {
      if (!diagramId) return;

      try {
        const response = await fetch(
          `/api/diagrams/${diagramId}/comments?commentId=${commentId}`,
          { method: 'DELETE' }
        );

        if (!response.ok) throw new Error('Failed to delete comment');

        onCommentDeleted?.(commentId);
        queryClient.invalidateQueries({ queryKey: ['diagram-comments', diagramId] });
      } catch (error) {
        console.error('[Collaboration] Failed to delete comment:', error);
      }
    },
    [diagramId, onCommentDeleted, queryClient]
  );

  return {
    connectionState,
    currentUser,
    activeUsers,
    cursors,
    canEdit,
    isOwner,
    sendCursorMove,
    sendViewportChange,
    sendNodeDrag,
    sendNodeDragEnd,
    sendDiagramUpdate,
    sendCommentCreate,
    sendCommentResolve,
    sendCommentDelete,
  };
}
