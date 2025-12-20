/**
 * This file is part of the SchemaVis project.
 * Copyright (C) 2025 Akshat Kotpalliwar (IntegerAlex)
 * Licensed under the GNU Affero General Public License v3.0 or later.
 */
import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import {
  getDiagramById,
  updateDiagram,
  softDeleteDiagram,
  checkPermission,
  getUserRole,
} from '@/lib/repositories/diagrams';

const updateDiagramSchema = z.object({
  name: z.string().min(1).optional(),
  content: z.record(z.unknown()).optional(),
  isPublic: z.boolean().optional(),
  linkPermission: z.enum(['view', 'edit']).optional(),
});

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();
  const { id: diagramId } = await params;

  const diagram = await getDiagramById(diagramId);
  if (!diagram) {
    return NextResponse.json({ error: 'Diagram not found' }, { status: 404 });
  }

  // Check access
  const hasAccess = await checkPermission(diagramId, userId, 'viewer');
  if (!hasAccess) {
    return NextResponse.json({ error: 'Access denied' }, { status: 403 });
  }

  // Get user's role
  const role = userId ? await getUserRole(diagramId, userId) : null;
  const effectiveRole = role || (diagram.isPublic ? (diagram.linkPermission === 'edit' ? 'editor' : 'viewer') : null);

  return NextResponse.json({
    diagram,
    role: effectiveRole,
    canEdit: effectiveRole === 'editor' || effectiveRole === 'owner',
    isOwner: effectiveRole === 'owner',
  });
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id: diagramId } = await params;

  // Check edit permission
  const canEdit = await checkPermission(diagramId, userId, 'editor');
  if (!canEdit) {
    return NextResponse.json({ error: 'Permission denied' }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  const parsed = updateDiagramSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid request', details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  // Only owner can change sharing settings
  if (parsed.data.isPublic !== undefined || parsed.data.linkPermission !== undefined) {
    const isOwner = await checkPermission(diagramId, userId, 'owner');
    if (!isOwner) {
      return NextResponse.json(
        { error: 'Only owner can change sharing settings' },
        { status: 403 }
      );
    }
  }

  const updated = await updateDiagram(diagramId, parsed.data);
  if (!updated) {
    return NextResponse.json({ error: 'Diagram not found' }, { status: 404 });
  }

  return NextResponse.json({ diagram: updated });
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id: diagramId } = await params;

  // Only owner can delete
  const isOwner = await checkPermission(diagramId, userId, 'owner');
  if (!isOwner) {
    return NextResponse.json({ error: 'Only owner can delete diagram' }, { status: 403 });
  }

  const deleted = await softDeleteDiagram(diagramId);
  if (!deleted) {
    return NextResponse.json({ error: 'Diagram not found' }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}

