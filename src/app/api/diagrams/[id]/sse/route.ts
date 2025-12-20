/**
 * This file is part of the SchemaVis project.
 * Copyright (C) 2025 Akshat Kotpalliwar (IntegerAlex)
 * Licensed under the GNU Affero General Public License v3.0 or later.
 */
import { auth } from '@clerk/nextjs/server';
import {
  getActiveSessions,
  checkPermission,
  getUserRole,
  getDiagramById,
} from '@/lib/repositories/diagrams';
import { getUserColor } from '@/lib/collaboration/types';

// Vercel Hobby plan has 10-second timeout, so we close at 8 seconds for safety
export const maxDuration = 8;

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  let diagramId: string;
  let userId: string | null = null;
  let diagram: Awaited<ReturnType<typeof getDiagramById>>;

  try {
    const authResult = await auth();
    userId = authResult.userId;
    const paramsResult = await params;
    diagramId = paramsResult.id;

    // Check if diagram exists in database
    diagram = await getDiagramById(diagramId);

    // If diagram doesn't exist (unsaved), allow editing for authenticated users
    if (!diagram) {
      if (!userId) {
        return new Response('Unauthorized', { status: 401 });
      }
      // For unsaved diagrams, return empty presence but allow connection
      // We'll send initial empty data
    } else {
      // Check view permission for saved diagrams
      // Allow anonymous users (no userId) if diagram is public
      if (!userId) {
        if (!diagram.isPublic) {
          return new Response('Access denied', { status: 403 });
        }
        // Anonymous user - allow connection
      } else {
        // Authenticated user - check permissions
        const hasAccess = await checkPermission(diagramId, userId, 'viewer');
        if (!hasAccess) {
          return new Response('Access denied', { status: 403 });
        }
      }
    }
  } catch (error) {
    console.error('[SSE] Auth/permission error:', error);
    return new Response('Internal server error', { status: 500 });
  }

  // Set up SSE headers
  const headers = new Headers({
    'Content-Type': 'text/event-stream',
    'Connection': 'keep-alive',
    'Cache-Control': 'no-cache, no-transform',
    'X-Accel-Buffering': 'no', // Disable buffering for Vercel
  });

  // Create stream controller
  const encoder = new TextEncoder();
  let isClosed = false;
  let heartbeatInterval: NodeJS.Timeout | null = null;
  let updateTimer: NodeJS.Timeout | null = null;
  let timeoutId: NodeJS.Timeout | null = null;

  const stream = new ReadableStream({
    async start(controller) {
      // Helper function to safely enqueue data
      const safeEnqueue = (data: string) => {
        if (isClosed) {
          return false;
        }
        try {
          controller.enqueue(encoder.encode(data));
          return true;
        } catch (error) {
          // Controller is closed or in invalid state
          isClosed = true;
          return false;
        }
      };

      // Helper function to cleanup intervals
      const cleanup = () => {
        if (heartbeatInterval) {
          clearInterval(heartbeatInterval);
          heartbeatInterval = null;
        }
        if (updateTimer) {
          clearInterval(updateTimer);
          updateTimer = null;
        }
        if (timeoutId) {
          clearTimeout(timeoutId);
          timeoutId = null;
        }
      };

      // Send initial presence data
      try {
        const sessions = diagram
          ? await getActiveSessions(diagramId)
          : [];

        const users = sessions.map((s) => ({
          id: s.userId,
          name: s.userName,
          email: s.userEmail,
          imageUrl: s.userImageUrl,
          cursorX: s.cursorX,
          cursorY: s.cursorY,
          color: getUserColor(s.userId),
        }));

        const role = diagram && userId
          ? await getUserRole(diagramId, userId)
          : (userId ? 'owner' : null);

        const initialData = {
          type: 'presence',
          users,
          role,
          canEdit: role === 'editor' || role === 'owner',
          isOwner: role === 'owner',
          timestamp: Date.now(),
        };

        if (!safeEnqueue(`data: ${JSON.stringify(initialData)}\n\n`)) {
          return;
        }
      } catch (error) {
        console.error('[SSE] Error sending initial presence:', error);
        try {
          controller.close();
        } catch (e) {
          // Ignore
        }
        return;
      }

      // Heartbeat to keep connection alive (every 5 seconds)
      heartbeatInterval = setInterval(() => {
        if (isClosed) {
          cleanup();
          return;
        }
        if (!safeEnqueue(': heartbeat\n\n')) {
          cleanup();
        }
      }, 5000);

      // Real-time presence updates (every 500ms)
      updateTimer = setInterval(async () => {
        if (isClosed) {
          cleanup();
          return;
        }

        try {
          const sessions = diagram
            ? await getActiveSessions(diagramId)
            : [];

          const users = sessions.map((s) => ({
            id: s.userId,
            name: s.userName,
            email: s.userEmail,
            imageUrl: s.userImageUrl,
            cursorX: s.cursorX,
            cursorY: s.cursorY,
            color: getUserColor(s.userId),
          }));

          const role = diagram && userId
            ? await getUserRole(diagramId, userId)
            : (userId ? 'owner' : null);

          const updateData = {
            type: 'presence_update',
            users,
            role,
            canEdit: role === 'editor' || role === 'owner',
            isOwner: role === 'owner',
            timestamp: Date.now(),
          };

          if (!safeEnqueue(`data: ${JSON.stringify(updateData)}\n\n`)) {
            cleanup();
          }
        } catch (error) {
          console.error('[SSE] Error sending presence update:', error);
          cleanup();
        }
      }, 500);

      // Graceful shutdown at 7.5 seconds (before 8s timeout)
      timeoutId = setTimeout(() => {
        if (!isClosed) {
          isClosed = true;
          cleanup();
          try {
            safeEnqueue('event: close\ndata: {"reason": "timeout"}\n\n');
          } catch (error) {
            // Ignore errors during close
          }
          try {
            controller.close();
          } catch (error) {
            // Controller already closed, ignore
          }
        }
      }, 7500); // 7.5 seconds for safety

      // Handle client disconnection
      if (req.signal) {
        req.signal.addEventListener('abort', () => {
          if (!isClosed) {
            isClosed = true;
            cleanup();
            try {
              controller.close();
            } catch (error) {
              // Controller already closed, ignore
            }
          }
        });
      }
    },
  });

  return new Response(stream, { headers });
}
