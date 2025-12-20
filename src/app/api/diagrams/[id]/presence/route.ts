/**
 * This file is part of the SchemaVis project.
 * Copyright (C) 2025 Akshat Kotpalliwar (IntegerAlex)
 * Licensed under the GNU Affero General Public License v3.0 or later.
 */
import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import {
  getActiveSessions,
  checkPermission,
  getUserRole,
  upsertCollaborationSession,
  updateCursorPosition,
  getDiagramById,
} from '@/lib/repositories/diagrams';
import { getUserColor } from '@/lib/collaboration/types';

// Polling-based presence updates
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();
  const { id: diagramId } = await params;

  // Check if diagram exists in database
  const diagram = await getDiagramById(diagramId);

  // If diagram doesn't exist (unsaved), allow editing for authenticated users
  if (!diagram) {
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    // For unsaved diagrams, allow editing by default
    return NextResponse.json({
      users: [],
      role: 'owner',
      canEdit: true,
      isOwner: true,
    });
  }

  // Check view permission for saved diagrams
  // Allow anonymous users (no userId) if diagram is public
  if (!userId) {
    if (!diagram.isPublic) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }
    // Anonymous user - return all sessions including their own if they have one
    const sessions = await getActiveSessions(diagramId);
    const users = sessions.map((s) => ({
      id: s.userId,
      name: s.userName,
      email: s.userEmail,
      imageUrl: s.userImageUrl,
      cursorX: s.cursorX,
      cursorY: s.cursorY,
      color: getUserColor(s.userId),
    }));
    
    return NextResponse.json({
      users,
      role: diagram.linkPermission === 'edit' ? 'editor' : 'viewer',
      canEdit: diagram.linkPermission === 'edit',
      isOwner: false,
    });
  }

  // Authenticated users
  const hasAccess = await checkPermission(diagramId, userId, 'viewer');
  if (!hasAccess) {
    return NextResponse.json({ error: 'Access denied' }, { status: 403 });
  }

  const sessions = await getActiveSessions(diagramId);
  
  // Map sessions to collaborator info with colors
  // Include ALL users' cursors (owner should see anonymous viewers' cursors)
  const users = sessions.map((s) => ({
    id: s.userId,
    name: s.userName,
    email: s.userEmail,
    imageUrl: s.userImageUrl,
    cursorX: s.cursorX,
    cursorY: s.cursorY,
    color: getUserColor(s.userId),
  }));

  // Get current user's role
  const role = await getUserRole(diagramId, userId);

  return NextResponse.json({
    users,
    role,
    canEdit: role === 'editor' || role === 'owner',
    isOwner: role === 'owner',
  });
}

// Heartbeat/ping endpoint for polling-based presence
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    
    const { id: diagramId } = await params;

    // Check if diagram exists in database
    const diagram = await getDiagramById(diagramId);

    // If diagram doesn't exist (unsaved), allow editing for authenticated users
    if (!diagram) {
      if (!userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      // For unsaved diagrams, don't create sessions but allow editing
      return NextResponse.json({
        success: true,
        role: 'owner',
        canEdit: true,
        isOwner: true,
      });
    }

    // For saved diagrams, check permissions
    // Allow anonymous users (no userId) if diagram is public
    if (!userId) {
      if (!diagram.isPublic) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      // Anonymous users viewing via share link
      // Get anonymous ID from request header (set by client)
      const anonymousId = req.headers.get('x-anonymous-id');
      if (!anonymousId || !anonymousId.startsWith('anon_')) {
        // No anonymous ID provided - return success but don't create session
        return NextResponse.json({
          success: true,
          role: diagram.linkPermission === 'edit' ? 'editor' : 'viewer',
          canEdit: diagram.linkPermission === 'edit',
          isOwner: false,
        });
      }
      
      // Create a temporary user record for anonymous users
      const { ensureUser } = await import('@/lib/repositories/sql-files');
      await ensureUser({ 
        id: anonymousId, 
        email: null, 
        name: 'Anonymous Viewer' 
      });
      
      const session = await upsertCollaborationSession(diagramId, anonymousId, `poll_${anonymousId}_${Date.now()}`);
      
      const body = await req.json().catch(() => ({}));
      const { cursorX, cursorY } = body;
      
      if (cursorX !== undefined && cursorY !== undefined && session?.id) {
        await updateCursorPosition(session.id, cursorX, cursorY);
      }
      
      return NextResponse.json({
        success: true,
        role: diagram.linkPermission === 'edit' ? 'editor' : 'viewer',
        canEdit: diagram.linkPermission === 'edit',
        isOwner: false,
      });
    }

    // Authenticated users
    const hasAccess = await checkPermission(diagramId, userId, 'viewer');
    if (!hasAccess) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const { cursorX, cursorY } = body;

    // Update or create session
    const session = await upsertCollaborationSession(diagramId, userId, `poll_${userId}_${Date.now()}`);

    // Update cursor position if provided
    if (cursorX !== undefined && cursorY !== undefined && session?.id) {
      await updateCursorPosition(session.id, cursorX, cursorY);
    }

    // Get user's role
    const role = await getUserRole(diagramId, userId);

    return NextResponse.json({
      success: true,
      role,
      canEdit: role === 'editor' || role === 'owner',
      isOwner: role === 'owner',
    });
  } catch (error) {
    console.error('[Presence] POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

