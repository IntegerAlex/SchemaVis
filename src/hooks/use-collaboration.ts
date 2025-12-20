/**
 * This file is part of the SchemaVis project.
 * Copyright (C) 2025 Akshat Kotpalliwar (IntegerAlex)
 * Licensed under the GNU Affero General Public License v3.0 or later.
 */
'use client';

import { useCallback, useEffect, useRef, useState, useMemo } from 'react';
import { usePathname } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useUser } from '@clerk/nextjs';
import type {
  CollaboratorInfo,
  CursorPosition,
  ConnectionState,
  CommentData,
  Viewport,
} from '@/lib/collaboration/types';
import { getUserColor } from '@/lib/collaboration/types';
import type { PermissionRole } from '@/lib/schema';
import { useSSEPresence } from './use-sse-presence';

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
const CURSOR_THROTTLE_MS = 100; // Throttle cursor updates (reduced for smoother tracking)

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

  // SSE and presence tracking completely disabled for shared diagrams
  // Check immediately before any hooks are called to prevent any initialization
  const pathname = usePathname();
  const isSharedRouteCheck = typeof window !== 'undefined' 
    ? window.location.pathname.startsWith('/share/')
    : pathname?.startsWith('/share/') ?? false;

  // Early return for shared routes - return stub implementation to prevent any collaboration features
  if (isSharedRouteCheck) {
    console.log('[useCollaboration] Shared route detected - returning stub implementation, all collaboration features disabled');
    return {
      connectionState: 'disconnected',
      currentUser: null,
      activeUsers: [],
      cursors: new Map(),
      canEdit: false,
      isOwner: false,
      sendCursorMove: () => {},
      sendViewportChange: () => {},
      sendNodeDrag: () => {},
      sendNodeDragEnd: () => {},
      sendDiagramUpdate: () => {},
      sendCommentCreate: () => {},
      sendCommentResolve: () => {},
      sendCommentDelete: () => {},
    };
  }

  // Disable all collaboration features for shared diagram routes
  // Use both usePathname and window.location as fallback for reliability
  // Check immediately on mount to prevent any requests from starting
  const [isSharedRoute, setIsSharedRoute] = useState(() => {
    if (typeof window !== 'undefined') {
      const isShared = window.location.pathname.startsWith('/share/');
      if (isShared) {
        console.log('[useCollaboration] Initial check: Shared route detected on mount');
      }
      return isShared;
    }
    return pathname?.startsWith('/share/') ?? false;
  });

  // Update shared route check when pathname changes
  useEffect(() => {
    const checkSharedRoute = () => {
      const currentPath = pathname || (typeof window !== 'undefined' ? window.location.pathname : '');
      const isShared = currentPath.startsWith('/share/');
      setIsSharedRoute(isShared);
      if (isShared) {
        console.log('[useCollaboration] Shared route detected, disabling all collaboration features');
      }
    };
    checkSharedRoute();
  }, [pathname]);

  const collaborationEnabled = enabled && !isSharedRoute;

  const [connectionState, setConnectionState] = useState<ConnectionState>('disconnected');
  const [currentUser, setCurrentUser] = useState<CollaboratorInfo | null>(null);
  const [activeUsers, setActiveUsers] = useState<CollaboratorInfo[]>([]);
  const [cursors, setCursors] = useState<Map<string, CursorPosition>>(new Map());
  const [canEdit, setCanEdit] = useState(false);
  const [isOwner, setIsOwner] = useState(false);
  const queryClient = useQueryClient();
  const { user: clerkUser, isLoaded: clerkLoaded } = useUser();

  // Generate stable anonymous ID for users viewing via share link (no Clerk auth)
  const anonymousUserIdRef = useRef<string | null>(null);
  useEffect(() => {
    if (!clerkUser && clerkLoaded && typeof window !== 'undefined') {
      // User is not authenticated - generate or retrieve anonymous ID
      const storageKey = `schema-vis:anon-id:${diagramId}`;
      let anonId = localStorage.getItem(storageKey);
      if (!anonId) {
        anonId = `anon_${diagramId}_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
        localStorage.setItem(storageKey, anonId);
      }
      anonymousUserIdRef.current = anonId;
    } else {
      anonymousUserIdRef.current = null;
    }
  }, [clerkUser, clerkLoaded, diagramId]);

  const lastCursorSend = useRef(0);
  const lastCursorPosition = useRef<{ x: number; y: number } | null>(null);
  const heartbeatIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const pendingCursorTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Check if SSE is enabled via feature flag
  const useSSE =
    typeof window !== 'undefined' &&
    window.EventSource &&
    process.env.NEXT_PUBLIC_USE_SSE === 'true' &&
    localStorage.getItem('schema-vis:sse-disabled') !== 'true';

  // SSE and presence tracking completely disabled for shared diagrams - commented out
  // SSE-based presence updates - disabled for shared routes
  // const ssePresence = useSSEPresence({
  //   diagramId: isSharedRoute ? null : diagramId, // Force null diagramId on shared routes
  //   enabled: collaborationEnabled && useSSE && !isSharedRoute, // Explicitly disable for shared routes
  // });
  // Stub implementation to prevent any SSE connections
  const ssePresence = {
    connected: false,
    error: null,
    reconnect: () => {},
    presenceData: null,
  };

  // Polling-based presence updates (fallback or when SSE is disabled) - disabled for shared routes
  // SSE and presence tracking completely disabled for shared diagrams - commented out
  // const { data: pollingPresenceData } = useQuery({
  //   queryKey: ['diagram-presence', diagramId],
  //   queryFn: async () => {
  //     // Double-check: don't make request if on shared route
  //     if (isSharedRoute || !diagramId) return null;
  //     const response = await fetch(`/api/diagrams/${diagramId}/presence`);
  //     if (!response.ok) throw new Error('Failed to fetch presence');
  //     return response.json();
  //   },
  //   enabled: collaborationEnabled && !!diagramId && !useSSE && !isSharedRoute, // Explicitly disable for shared routes
  //   refetchInterval: (collaborationEnabled && !isSharedRoute && !!diagramId && !useSSE) ? POLL_INTERVAL : false,
  // });
  // Stub to prevent any polling requests - properly typed to match PresenceData structure
  const pollingPresenceData: {
    users: Array<{
      id: string;
      name: string | null;
      email: string | null;
      imageUrl: string | null;
      cursorX: number | null;
      cursorY: number | null;
      color?: string;
    }>;
    role: PermissionRole | null;
    canEdit: boolean;
    isOwner: boolean;
  } | null = null;

  // Disable refetch interval for shared routes and clear all intervals
  useEffect(() => {
    if (isSharedRoute) {
      // Cancel any active queries
      queryClient.cancelQueries({ queryKey: ['diagram-presence', diagramId] });
      // Clear heartbeat interval immediately
      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current);
        heartbeatIntervalRef.current = null;
      }
      // Clear pending cursor timeout
      if (pendingCursorTimeoutRef.current) {
        clearTimeout(pendingCursorTimeoutRef.current);
        pendingCursorTimeoutRef.current = null;
      }
      console.log('[useCollaboration] Shared route detected - cleared all intervals and cancelled queries');
    }
  }, [isSharedRoute, diagramId, queryClient]);

  // Use SSE presence data if available, otherwise fall back to polling
  // Memoize to prevent object recreation on every render
  // SSE and presence tracking completely disabled for shared diagrams
  const presenceData = useMemo(() => {
    // SSE and presence disabled - return null
    if (isSharedRoute) {
      return null;
    }
    // Type guard to ensure presenceData exists before accessing properties
    // Note: For non-shared routes, the real useSSEPresence hook should be used (currently commented out per plan)
    // PresenceData has users with cursorX, cursorY, color fields that need to be mapped to CollaboratorInfo
    if (useSSE && ssePresence.presenceData) {
      const presence = ssePresence.presenceData as {
        users: Array<{
          id: string;
          name: string | null;
          email: string | null;
          imageUrl: string | null;
          cursorX: number | null;
          cursorY: number | null;
          color?: string;
        }>;
        role: string | null;
        canEdit: boolean;
        isOwner: boolean;
      };
      return {
        users: presence.users,
        role: presence.role as PermissionRole | null,
        canEdit: presence.canEdit,
        isOwner: presence.isOwner,
      };
    }
    return pollingPresenceData;
  }, [
    useSSE,
    ssePresence.presenceData,
    isSharedRoute,
    pollingPresenceData,
  ]);

  // Update active users and cursors from presence data
  // Use refs to prevent unnecessary state updates and track user join/leave
  const prevUsersHashRef = useRef<string>('');
  const prevCursorsHashRef = useRef<string>('');
  const prevCurrentUserIdRef = useRef<string | null>(null);
  const prevActiveUserIdsRef = useRef<Set<string>>(new Set());
  const prevPresenceDataRef = useRef<string>('');

  // Create stable representation of presence data for comparison and dependency
  const presenceDataKey = useMemo(() => {
    return presenceData
      ? [
          presenceData.users?.map((u: { id: string }) => u.id).sort().join(',') || '',
          presenceData.role || '',
          presenceData.canEdit ? '1' : '0',
          presenceData.isOwner ? '1' : '0',
        ].join('||')
      : '';
  }, [
    presenceData?.users?.map((u: { id: string }) => u.id).sort().join(',') || '',
    presenceData?.role,
    presenceData?.canEdit,
    presenceData?.isOwner,
  ]);

  useEffect(() => {
    // Only process if presence data actually changed
    if (presenceDataKey === prevPresenceDataRef.current) {
      return;
    }
    prevPresenceDataRef.current = presenceDataKey;

    if (!presenceData?.users) {
      if (prevUsersHashRef.current !== '') {
        setActiveUsers([]);
        setCursors(new Map());
        prevUsersHashRef.current = '';
        prevCursorsHashRef.current = '';
        prevActiveUserIdsRef.current = new Set();
      }
      return;
    }

    // Create users array - map from presence data structure (with cursor fields) to CollaboratorInfo
    const users: CollaboratorInfo[] = presenceData.users.map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      imageUrl: u.imageUrl,
      role: 'viewer' as const, // Will be updated from API
    }));

    // Create hash for users (excluding cursor positions which change frequently)
    const usersHash = users.map((u) => `${u.id}:${u.name}:${u.email}`).join('|');
    
    // Track user join/leave events
    const currentUserIds = new Set(users.map((u) => u.id));
    const prevUserIds = prevActiveUserIdsRef.current;
    
    // Detect new users (joined)
    const joinedUsers = users.filter((u) => !prevUserIds.has(u.id));
    // Detect left users (only if we had previous users)
    const leftUsers = Array.from(prevUserIds).filter((id) => !currentUserIds.has(id));
    
    // Only update activeUsers if user list changed (not cursor positions)
    if (usersHash !== prevUsersHashRef.current) {
      setActiveUsers(users);
      prevUsersHashRef.current = usersHash;
      prevActiveUserIdsRef.current = currentUserIds;
      
      // Show toast notifications for user join/leave (only if we had previous state)
      // Don't show toast for current user joining (they just opened the page)
      if (prevUserIds.size > 0) {
        joinedUsers.forEach((user) => {
          // Don't show toast for current user
          if (user.id === clerkUser?.id) return;
          
          const userName = user.name || user.email || 'Anonymous';
          // Dispatch custom event for toast notification
          if (typeof window !== 'undefined') {
            window.dispatchEvent(
              new CustomEvent('user-joined', { detail: { userName, userId: user.id } })
            );
          }
        });
        
        leftUsers.forEach((userId) => {
          // Don't show toast for current user leaving
          if (userId === clerkUser?.id) return;
          
          // Dispatch custom event for toast notification
          if (typeof window !== 'undefined') {
            window.dispatchEvent(
              new CustomEvent('user-left', { detail: { userId } })
            );
          }
        });
      }
    }

    // Identify and set current user
    const currentUserId = clerkUser?.id ?? null;
    if (currentUserId !== prevCurrentUserIdRef.current) {
      if (currentUserId) {
        const currentUserData = users.find((u) => u.id === currentUserId);
        if (currentUserData) {
          setCurrentUser(currentUserData);
        } else {
          // Current user not in active users list, create from Clerk data
          setCurrentUser({
            id: currentUserId,
            name: clerkUser?.fullName || clerkUser?.firstName || null,
            email: clerkUser?.primaryEmailAddress?.emailAddress || null,
            imageUrl: clerkUser?.imageUrl || null,
            role: (presenceData.role || 'viewer') as PermissionRole,
          });
        }
      } else {
        setCurrentUser(null);
      }
      prevCurrentUserIdRef.current = currentUserId;
    }

    // Update cursors - exclude current user's cursor
    const nextCursors = new Map<string, CursorPosition>();
    for (const user of presenceData.users) {
      // Skip current user's cursor
      if (currentUserId && user.id === currentUserId) {
        continue;
      }
      
      // Include all other users' cursors
      if (user.cursorX !== null && user.cursorY !== null) {
        nextCursors.set(user.id, {
          userId: user.id,
          x: user.cursorX,
          y: user.cursorY,
          color: user.color || getUserColor(user.id),
        });
      }
    }

    // Create hash for cursors (only position data)
    const cursorsHash = Array.from(nextCursors.entries())
      .map(([id, cursor]) => `${id}:${cursor.x.toFixed(1)}:${cursor.y.toFixed(1)}`)
      .join('|');

    // Only update if cursors actually changed
    if (cursorsHash !== prevCursorsHashRef.current) {
      setCursors(nextCursors);
      prevCursorsHashRef.current = cursorsHash;
    }

    // Update permissions if available
    if (presenceData.role !== undefined) {
      const newCanEdit = presenceData.canEdit || false;
      const newIsOwner = presenceData.isOwner || false;
      setCanEdit((prev) => (prev !== newCanEdit ? newCanEdit : prev));
      setIsOwner((prev) => (prev !== newIsOwner ? newIsOwner : prev));
    }
  }, [
    // Use stable key instead of object reference
    presenceDataKey,
    clerkUser?.id,
  ]);

  // Update connection state based on SSE or polling
  useEffect(() => {
    if (useSSE) {
      setConnectionState(ssePresence.connected ? 'connected' : 'disconnected');
    } else {
      setConnectionState('connected'); // Polling is always "connected" when enabled
    }
  }, [useSSE, ssePresence.connected]);

  // SSE and presence tracking completely disabled for shared diagrams
  // Send heartbeat with cursor position (works for both SSE and polling)
  // This ensures the owner's session is created even if they haven't moved their mouse
  // HEARTBEAT COMPLETELY COMMENTED OUT FOR SHARED ROUTES
  // useEffect(() => {
  //   // Explicitly disable for shared routes
  //   if (isSharedRoute || !collaborationEnabled || !diagramId) {
  //     if (heartbeatIntervalRef.current) {
  //       clearInterval(heartbeatIntervalRef.current);
  //       heartbeatIntervalRef.current = null;
  //     }
  //     return;
  //   }

  //   // Double-check one more time before starting heartbeat
  //   const heartbeatPathCheck = typeof window !== 'undefined' ? window.location.pathname : '';
  //   if (heartbeatPathCheck.startsWith('/share/') || isSharedRoute) {
  //     return; // Don't start heartbeat at all
  //   }

  //   // Send initial heartbeat immediately to create session
  //   const sendHeartbeat = () => {
  //     // Double-check: don't send heartbeat if on shared route
  //     const heartbeatCurrentPath = typeof window !== 'undefined' ? window.location.pathname : '';
  //     if (heartbeatCurrentPath.startsWith('/share/') || isSharedRoute) {
  //       if (heartbeatIntervalRef.current) {
  //         clearInterval(heartbeatIntervalRef.current);
  //         heartbeatIntervalRef.current = null;
  //       }
  //       return;
  //     }

  //     const headers: HeadersInit = { 'Content-Type': 'application/json' };
  //     // Include anonymous ID if user is not authenticated
  //     if (!clerkUser && anonymousUserIdRef.current) {
  //       headers['x-anonymous-id'] = anonymousUserIdRef.current;
  //     }
      
  //     fetch(`/api/diagrams/${diagramId}/presence`, {
  //       method: 'POST',
  //       headers,
  //       body: JSON.stringify(
  //         lastCursorPosition.current
  //           ? {
  //               cursorX: lastCursorPosition.current.x,
  //               cursorY: lastCursorPosition.current.y,
  //             }
  //           : {}
  //       ),
  //     }).catch((error) => {
  //       // Silently handle 401 errors (might be auth timing issues)
  //       if (error instanceof Error && !error.message.includes('401')) {
  //         console.error('[Collaboration] Heartbeat error:', error);
  //       }
  //     });
  //   };

  //   sendHeartbeat();

  //   // Send heartbeat every 1 second
  //   heartbeatIntervalRef.current = setInterval(sendHeartbeat, 1000);

  //   return () => {
  //     if (heartbeatIntervalRef.current) {
  //       clearInterval(heartbeatIntervalRef.current);
  //       heartbeatIntervalRef.current = null;
  //     }
  //     if (pendingCursorTimeoutRef.current) {
  //       clearTimeout(pendingCursorTimeoutRef.current);
  //       pendingCursorTimeoutRef.current = null;
  //     }
  //   };
  // }, [isSharedRoute, collaborationEnabled, diagramId, clerkUser]);
  
  // Heartbeat disabled - no interval will be set
  useEffect(() => {
    // Ensure any existing intervals are cleared
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current);
      heartbeatIntervalRef.current = null;
    }
    if (pendingCursorTimeoutRef.current) {
      clearTimeout(pendingCursorTimeoutRef.current);
      pendingCursorTimeoutRef.current = null;
    }
  }, []);

  // Throttled cursor movement with pending position flush
  // SSE and presence tracking disabled for shared diagrams
  const sendCursorMove = useCallback(
    (x: number, y: number) => {
      // Don't send cursor updates on shared routes
      if (isSharedRoute) return;
      if (!diagramId) return;
      
      // Double-check: don't send if on shared route
      const cursorPathCheck = typeof window !== 'undefined' ? window.location.pathname : '';
      if (cursorPathCheck.startsWith('/share/')) return;

      const now = Date.now();
      lastCursorPosition.current = { x, y };

      // Clear any pending timeout
      if (pendingCursorTimeoutRef.current) {
        clearTimeout(pendingCursorTimeoutRef.current);
        pendingCursorTimeoutRef.current = null;
      }

      if (now - lastCursorSend.current < CURSOR_THROTTLE_MS) {
        // Schedule sending the latest position after throttle period
        pendingCursorTimeoutRef.current = setTimeout(() => {
          // Double-check: don't send if on shared route
          const timeoutPathCheck = typeof window !== 'undefined' ? window.location.pathname : '';
          if (timeoutPathCheck.startsWith('/share/') || isSharedRoute) {
            pendingCursorTimeoutRef.current = null;
            return;
          }
          
          if (lastCursorPosition.current) {
            const { x: pendingX, y: pendingY } = lastCursorPosition.current;
            lastCursorSend.current = Date.now();
            
            // SSE and presence tracking completely disabled for shared diagrams
            // FETCH CALL COMMENTED OUT - no presence requests for shared routes
            // const headers: HeadersInit = { 'Content-Type': 'application/json' };
            // // Include anonymous ID if user is not authenticated
            // if (!clerkUser && anonymousUserIdRef.current) {
            //   headers['x-anonymous-id'] = anonymousUserIdRef.current;
            // }
            
            // fetch(`/api/diagrams/${diagramId}/presence`, {
            //   method: 'POST',
            //   headers,
            //   body: JSON.stringify({ cursorX: pendingX, cursorY: pendingY }),
            // }).catch((error) => {
            //   // Silently handle 401 errors (might be auth timing issues)
            //   if (error instanceof Error && !error.message.includes('401')) {
            //     console.error('[Collaboration] Cursor update error:', error);
            //   }
            // });
          }
          pendingCursorTimeoutRef.current = null;
        }, CURSOR_THROTTLE_MS - (now - lastCursorSend.current));
        return;
      }

      // Send immediately if throttle period has passed
      // Double-check: don't send if on shared route
      const immediatePathCheck = typeof window !== 'undefined' ? window.location.pathname : '';
      if (immediatePathCheck.startsWith('/share/') || isSharedRoute) return;
      
      // SSE and presence tracking completely disabled for shared diagrams
      // FETCH CALL COMMENTED OUT - no presence requests for shared routes
      // lastCursorSend.current = now;
      // const headers: HeadersInit = { 'Content-Type': 'application/json' };
      // // Include anonymous ID if user is not authenticated
      // if (!clerkUser && anonymousUserIdRef.current) {
      //   headers['x-anonymous-id'] = anonymousUserIdRef.current;
      // }
      
      // fetch(`/api/diagrams/${diagramId}/presence`, {
      //   method: 'POST',
      //   headers,
      //   body: JSON.stringify({ cursorX: x, cursorY: y }),
      // }).catch((error) => {
      //   // Silently handle 401 errors (might be auth timing issues)
      //   if (error instanceof Error && !error.message.includes('401')) {
      //     console.error('[Collaboration] Cursor update error:', error);
      //   }
      // });
    },
    [diagramId, isSharedRoute, clerkUser]
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
    async (content: string, x: number, y: number, parentId?: number, diagramContent?: Record<string, unknown>, diagramName?: string, databaseType?: string) => {
      if (!diagramId) return;

      try {
        const requestBody: {
          content: string;
          x: number;
          y: number;
          parentId?: number;
          diagramContent?: Record<string, unknown>;
          diagramName?: string;
          databaseType?: string;
        } = { content, x, y };
        
        if (parentId !== undefined) {
          requestBody.parentId = parentId;
        }
        
        // Include diagram content if provided (for auto-creating diagram if it doesn't exist)
        if (diagramContent) {
          requestBody.diagramContent = diagramContent;
          if (diagramName) requestBody.diagramName = diagramName;
          if (databaseType) requestBody.databaseType = databaseType;
        }

        const response = await fetch(`/api/diagrams/${diagramId}/comments`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestBody),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || 'Failed to create comment');
        }

        const { comment } = await response.json();
        onCommentCreated?.(comment);
        queryClient.invalidateQueries({ queryKey: ['diagram-comments', diagramId] });
      } catch (error) {
        console.error('[Collaboration] Failed to create comment:', error);
        throw error; // Re-throw so caller can handle it
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

  // Memoize return value to prevent unnecessary re-renders
  return useMemo(
    () => ({
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
    }),
    [
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
    ]
  );
}
