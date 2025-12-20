/**
 * This file is part of the SchemaVis project.
 * Copyright (C) 2025 Akshat Kotpalliwar (IntegerAlex)
 * Licensed under the GNU Affero General Public License v3.0 or later.
 */
'use client';

import * as React from 'react';
import { useOptionalCollaboration } from '@/context/collaboration-context';
import type { CursorPosition } from '@/lib/collaboration/types';

interface RemoteCursorsProps {
  containerRef: React.RefObject<HTMLElement | null>;
}

export function RemoteCursors({ containerRef }: RemoteCursorsProps) {
  const collaboration = useOptionalCollaboration();

  if (!collaboration) {
    return null;
  }

  const { cursors, activeUsers, currentUser } = collaboration;

  // Create a map of user info for quick lookup
  const userMap = React.useMemo(() => {
    const map = new Map<string, { name: string | null; color: string }>();
    for (const user of activeUsers) {
      if (user.id !== currentUser?.id) {
        map.set(user.id, { name: user.name, color: '' });
      }
    }
    return map;
  }, [activeUsers, currentUser]);

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden z-50">
      {Array.from(cursors.entries()).map(([userId, cursor]) => {
        if (userId === currentUser?.id) return null;
        const user = userMap.get(userId);
        if (!user) return null;

        return (
          <RemoteCursor
            key={userId}
            cursor={cursor}
            userName={user.name}
          />
        );
      })}
    </div>
  );
}

interface RemoteCursorProps {
  cursor: CursorPosition;
  userName: string | null;
}

function RemoteCursor({ cursor, userName }: RemoteCursorProps) {
  const { x, y, color } = cursor;
  const displayName = userName || 'Anonymous';

  return (
    <div
      className="absolute transition-all duration-75 ease-out"
      style={{
        left: x,
        top: y,
        transform: 'translate(-2px, -2px)',
      }}
    >
      {/* Cursor icon */}
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.3))' }}
      >
        <path
          d="M5.65376 3.4873C5.48914 3.31396 5.19411 3.38785 5.13108 3.62695L2.01935 15.4934C1.96154 15.7133 2.18723 15.8968 2.38867 15.7949L7.93034 13.0186C8.01281 12.977 8.08044 12.9107 8.12337 12.8285L11.5377 6.29289C11.6508 6.07602 11.6077 5.81198 11.4314 5.63999L5.65376 3.4873Z"
          fill={color}
          stroke="white"
          strokeWidth="1.5"
        />
      </svg>

      {/* Name label */}
      <div
        className="absolute left-4 top-4 px-2 py-0.5 rounded text-xs font-medium text-white whitespace-nowrap"
        style={{
          backgroundColor: color,
          boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
        }}
      >
        {displayName}
      </div>
    </div>
  );
}

// Hook for tracking and emitting cursor position
export function useCursorTracking(
  containerRef: React.RefObject<HTMLElement | null>,
  enabled: boolean = true
) {
  const collaboration = useOptionalCollaboration();

  React.useEffect(() => {
    if (!collaboration || !enabled) return;

    const container = containerRef.current;
    if (!container) return;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      collaboration.sendCursorMove(x, y);
    };

    container.addEventListener('mousemove', handleMouseMove);

    return () => {
      container.removeEventListener('mousemove', handleMouseMove);
    };
  }, [collaboration, containerRef, enabled]);
}

// Cursor with ReactFlow viewport transformation
interface ReactFlowCursorsProps {
  viewport: { x: number; y: number; zoom: number };
}

export function ReactFlowCursors({ viewport }: ReactFlowCursorsProps) {
  const collaboration = useOptionalCollaboration();

  if (!collaboration) {
    return null;
  }

  const { cursors, activeUsers, currentUser } = collaboration;

  // Create a map of user info for quick lookup
  const userMap = React.useMemo(() => {
    const map = new Map<string, { name: string | null }>();
    for (const user of activeUsers) {
      if (user.id !== currentUser?.id) {
        map.set(user.id, { name: user.name });
      }
    }
    return map;
  }, [activeUsers, currentUser]);

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden z-50">
      {Array.from(cursors.entries()).map(([userId, cursor]) => {
        if (userId === currentUser?.id) return null;
        const user = userMap.get(userId);
        if (!user) return null;

        // Transform cursor position based on viewport
        const transformedX = cursor.x * viewport.zoom + viewport.x;
        const transformedY = cursor.y * viewport.zoom + viewport.y;

        return (
          <RemoteCursor
            key={userId}
            cursor={{ ...cursor, x: transformedX, y: transformedY }}
            userName={user.name}
          />
        );
      })}
    </div>
  );
}

