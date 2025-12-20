/**
 * This file is part of the SchemaVis project.
 * Copyright (C) 2025 Akshat Kotpalliwar (IntegerAlex)
 * Licensed under the GNU Affero General Public License v3.0 or later.
 */
'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import type { CollaboratorInfo } from '@/lib/collaboration/types';

interface PresenceData {
  type: 'presence' | 'presence_update';
  users: Array<{
    id: string;
    name: string | null;
    email: string | null;
    imageUrl: string | null;
    cursorX: number | null;
    cursorY: number | null;
    color?: string;
  }>;
  role: 'owner' | 'editor' | 'viewer' | null;
  canEdit: boolean;
  isOwner: boolean;
  timestamp: number;
}

interface UseSSEPresenceOptions {
  diagramId: string | null;
  enabled?: boolean;
}

interface UseSSEPresenceReturn {
  connected: boolean;
  error: string | null;
  reconnect: () => void;
  presenceData: PresenceData | null;
}

const MAX_RECONNECT_DELAY = 30000; // 30 seconds max
const INITIAL_RECONNECT_DELAY = 3000; // Start with 3 seconds
const MAX_FAILURES = 3; // Switch to polling after 3 failures

export function useSSEPresence(
  options: UseSSEPresenceOptions
): UseSSEPresenceReturn {
  const { diagramId, enabled = true } = options;
  
  // SSE and presence tracking completely disabled for shared diagrams
  // Check immediately before any hooks are called to prevent any initialization
  const pathname = usePathname();
  const isSharedRouteCheck = typeof window !== 'undefined' 
    ? window.location.pathname.startsWith('/share/')
    : pathname?.startsWith('/share/') ?? false;

  // Early return for shared routes - return stub implementation to prevent any SSE connections
  if (isSharedRouteCheck) {
    console.log('[useSSEPresence] Shared route detected - returning stub implementation, SSE disabled');
    return {
      connected: false,
      error: null,
      reconnect: () => {},
      presenceData: null,
    };
  }

  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [presenceData, setPresenceData] = useState<PresenceData | null>(null);
  const queryClient = useQueryClient();
  const prevPresenceDataHashRef = useRef<string>('');

  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectDelayRef = useRef(INITIAL_RECONNECT_DELAY);
  const failureCountRef = useRef(0);
  const isMountedRef = useRef(true);
  const connectionStartTimeRef = useRef<number | null>(null);
  const instanceIdRef = useRef<string>(`instance_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`);
  const previousReadyStateRef = useRef<number | null>(null);

  const connect = useCallback(() => {
    // SSE and presence tracking completely disabled for shared diagrams
    // Early return - no SSE connections for shared routes
    return;
    
    // All code below is commented out - no EventSource creation for shared routes
    // if (!diagramId || !enabled) {
    //   return;
    // }

    // // Check if SSE is disabled in localStorage (fallback mode)
    // const sseDisabled = localStorage.getItem('schema-vis:sse-disabled');
    // if (sseDisabled === 'true') {
    //   setError('SSE disabled - using polling fallback');
    //   return;
    // }

    // // Close existing connection
    // if (eventSourceRef.current) {
    //   eventSourceRef.current.close();
    //   eventSourceRef.current = null;
    // }

    // // Clear any pending reconnection
    // if (reconnectTimeoutRef.current) {
    //   clearTimeout(reconnectTimeoutRef.current);
    //   reconnectTimeoutRef.current = null;
    // }

    // SSE and presence tracking completely disabled for shared diagrams
    // EVENTSOURCE CREATION AND ALL HANDLERS COMMENTED OUT - no SSE connections for shared routes
    // try {
    //   // Create new EventSource
    //   const eventSource = new EventSource(
    //     `/api/diagrams/${diagramId}/sse`
    //   );

    //   eventSourceRef.current = eventSource;
    //   connectionStartTimeRef.current = Date.now();
    //   previousReadyStateRef.current = eventSource.readyState;
    //   setConnected(true);
    //   setError(null);
    //   failureCountRef.current = 0; // Reset failure count on successful connection
    //   reconnectDelayRef.current = INITIAL_RECONNECT_DELAY; // Reset delay

    //   // Message handlers
    //   eventSource.onmessage = (event) => {
    //     try {
    //       // Handle heartbeat comments (empty data)
    //       if (event.data.trim() === '' || event.data === 'heartbeat') {
    //         return;
    //       }

    //       const data: PresenceData = JSON.parse(event.data);

    //       if (data.type === 'presence' || data.type === 'presence_update') {
    //         // Create hash for comparison (only meaningful data, not full object)
    //         const dataHash = [
    //           data.users?.map((u) => `${u.id}:${u.cursorX?.toFixed(1) ?? 'null'}:${u.cursorY?.toFixed(1) ?? 'null'}`).join('|') ?? '',
    //           data.role ?? '',
    //           data.canEdit ? '1' : '0',
    //           data.isOwner ? '1' : '0',
    //         ].join('||');

    //         // Only update if data actually changed
    //         if (dataHash !== prevPresenceDataHashRef.current) {
    //           setPresenceData(data);
    //           prevPresenceDataHashRef.current = dataHash;

    //           // Update React Query cache for compatibility
    //           queryClient.setQueryData(['diagram-presence', diagramId], {
    //             users: data.users,
    //             role: data.role,
    //             canEdit: data.canEdit,
    //             isOwner: data.isOwner,
    //           });
    //         }
    //       }
    //     } catch (err) {
    //       console.error('[SSE] Message parsing error:', err);
    //     }
    //   };

    //   // Note: EventSource doesn't have a standard 'close' event
    //   // Connection closure is handled via the 'error' event when readyState is CLOSED

    //   // Handle 'open' event - connection established
    //   eventSource.onopen = () => {
    //     connectionStartTimeRef.current = Date.now();
    //     previousReadyStateRef.current = eventSource.readyState;
    //     setConnected(true);
    //     setError(null);
    //     failureCountRef.current = 0; // Reset failure count on successful connection
    //     reconnectDelayRef.current = INITIAL_RECONNECT_DELAY; // Reset delay
    //   };

    //   // Handle 'close' event if available (some browsers)
    //   eventSource.addEventListener('close', () => {
    //     if (isMountedRef.current) {
    //       setConnected(false);
    //       // Trigger reconnection
    //       if (reconnectTimeoutRef.current === null) {
    //         reconnectTimeoutRef.current = setTimeout(() => {
    //           if (isMountedRef.current) {
    //             connect();
    //           }
    //         }, INITIAL_RECONNECT_DELAY);
    //       }
    //     }
    //   });

    //   // Error handling with automatic reconnection
    //   // Note: Browser/Next.js dev tools will log EventSource errors to console
    //   // This is expected behavior for SSE connections that timeout (Vercel Hobby 8s limit)
    //   // We handle these gracefully with automatic reconnection
    //   eventSource.onerror = (event) => {
    //     const readyState = eventSource.readyState;
    //     const connectionDuration = connectionStartTimeRef.current 
    //       ? Date.now() - connectionStartTimeRef.current 
    //       : 0;
    //     const isExpectedTimeout = connectionDuration >= 7000 && connectionDuration <= 9000;
    //     const wasOpen = previousReadyStateRef.current === EventSource.OPEN;
        
    //     // CRITICAL FIX: When server closes connection (timeout), EventSource may already be
    //     // in CONNECTING state (0) due to automatic reconnection, not CLOSED (2).
    //     // We detect this by checking: was OPEN before, now CONNECTING, and duration matches timeout.
    //     const isTimeoutTransition = wasOpen && readyState === EventSource.CONNECTING && isExpectedTimeout;
    //     const isClosed = readyState === EventSource.CLOSED;
        
    //     if (isClosed || isTimeoutTransition) {
    //       // Connection closed (either CLOSED state or timeout transition to CONNECTING)
    //       setConnected(false);
        
    //       // Don't count expected timeout closes as failures
    //       if (!isExpectedTimeout) {
    //         failureCountRef.current += 1;

    //         // Switch to polling after MAX_FAILURES consecutive failures
    //         if (failureCountRef.current >= MAX_FAILURES) {
    //           console.log(
    //             `[SSE] Failed ${MAX_FAILURES} times, switching to polling fallback`
    //           );
    //           localStorage.setItem('schema-vis:sse-disabled', 'true');
    //           setError('Switched to polling mode due to connection issues');
    //           if (eventSourceRef.current) {
    //             eventSourceRef.current.close();
    //             eventSourceRef.current = null;
    //           }
    //           return;
    //         }
    //       } else {
    //         // Expected timeout - reset failure count and silently reconnect
    //         failureCountRef.current = 0;
    //         reconnectDelayRef.current = INITIAL_RECONNECT_DELAY;
    //       }

    //       // Reconnect logic
    //       if (isMountedRef.current && reconnectTimeoutRef.current === null) {
    //         const reconnectDelay = isExpectedTimeout 
    //           ? 100 // Very short delay for expected timeouts
    //           : reconnectDelayRef.current; // Exponential backoff for real errors
        
    //         reconnectTimeoutRef.current = setTimeout(() => {
    //           reconnectTimeoutRef.current = null;
    //           if (isMountedRef.current) {
    //             connect(); // Reconnect automatically
    //           }
    //         }, reconnectDelay);

    //         // Increase delay for next reconnection (only for non-timeout closes)
    //         if (!isExpectedTimeout) {
    //           reconnectDelayRef.current = Math.min(
    //             reconnectDelayRef.current * 2,
    //             MAX_RECONNECT_DELAY
    //           );
    //         }
    //       }
    //     } else if (readyState === EventSource.CONNECTING) {
    //       // Still connecting (not a timeout transition) - don't treat as error yet
    //       setConnected(false);
    //     } else if (readyState === EventSource.OPEN) {
    //       // Connection is open - reset failure count
    //       failureCountRef.current = 0;
    //       reconnectDelayRef.current = INITIAL_RECONNECT_DELAY;
    //     }
    //     previousReadyStateRef.current = readyState;
    //   };
    // } catch (err) {
    //   console.error('[SSE] Failed to create EventSource:', err);
    //   setConnected(false);
    //   setError('Failed to establish SSE connection');
    //   failureCountRef.current += 1;

    //   if (failureCountRef.current >= MAX_FAILURES) {
    //     localStorage.setItem('schema-vis:sse-disabled', 'true');
    //     setError('Switched to polling mode due to connection issues');
    //   }
    // }
  }, [diagramId, enabled, queryClient]);

  const reconnect = useCallback(() => {
    reconnectDelayRef.current = INITIAL_RECONNECT_DELAY; // Reset delay
    failureCountRef.current = 0; // Reset failure count
    connect();
  }, [connect]);

  // Initial connection and cleanup
  useEffect(() => {
    isMountedRef.current = true;

    if (enabled && diagramId) {
      connect();
    }

    return () => {
      isMountedRef.current = false;

      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }

      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
    };
  }, [enabled, diagramId, connect]);

  return {
    connected,
    error,
    reconnect,
    presenceData,
  };
}

