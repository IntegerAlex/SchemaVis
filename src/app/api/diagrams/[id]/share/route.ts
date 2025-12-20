/**
 * This file is part of the SchemaVis project.
 * Copyright (C) 2025 Akshat Kotpalliwar (IntegerAlex)
 * Licensed under the GNU Affero General Public License v3.0 or later.
 */
import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { nanoid } from 'nanoid';
import {
  getDiagramById,
  updateDiagram,
  regenerateShareToken,
  checkPermission,
  createDiagram,
} from '@/lib/repositories/diagrams';
import { ensureUser } from '@/lib/repositories/sql-files';

const updateShareSchema = z.object({
  isPublic: z.boolean().optional(),
  linkPermission: z.enum(['view', 'edit']).optional(),
  regenerateToken: z.boolean().optional(),
  // Optional diagram content - required if diagram doesn't exist and enabling sharing
  diagramContent: z.record(z.unknown()).optional(),
  diagramName: z.string().optional(),
  databaseType: z.string().optional(),
});

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id: diagramId } = await params;

  // Check if diagram exists in database
  const diagram = await getDiagramById(diagramId);

  // If diagram doesn't exist, return default share settings
  if (!diagram) {
    return NextResponse.json({
      isPublic: false,
      linkPermission: 'view',
      shareToken: null,
      shareUrl: null,
    });
  }

  // Only owner can see share settings
  const isOwner = await checkPermission(diagramId, userId, 'owner');
  if (!isOwner) {
    return NextResponse.json({ error: 'Only owner can view share settings' }, { status: 403 });
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const shareUrl = diagram.isPublic && diagram.shareToken
    ? `${baseUrl}/share/${diagram.shareToken}`
    : null;

  return NextResponse.json({
    isPublic: diagram.isPublic,
    linkPermission: diagram.linkPermission,
    shareToken: diagram.shareToken,
    shareUrl,
  });
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await auth();
  const { userId, sessionClaims } = authResult;
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id: diagramId } = await params;

  const body = await req.json().catch(() => ({}));
  const parsed = updateShareSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid request', details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  // Check if diagram exists in database
  let diagram = await getDiagramById(diagramId);

  // If diagram doesn't exist and we're enabling sharing, try to create it
  if (!diagram && parsed.data.isPublic === true) {
    // If diagram content is provided, create the diagram automatically
    if (parsed.data.diagramContent && parsed.data.diagramName && parsed.data.databaseType) {
      // Ensure user exists
      const email = (sessionClaims?.email as string | undefined) ?? undefined;
      const name =
        (sessionClaims?.name as string | undefined) ??
        ((sessionClaims?.first_name || sessionClaims?.last_name)
          ? `${sessionClaims?.first_name ?? ''} ${sessionClaims?.last_name ?? ''}`.trim()
          : undefined);
      await ensureUser({ id: userId, email, name });

      // Create diagram with the provided ID and content
      const created = await createDiagram({
        ownerId: userId,
        name: parsed.data.diagramName,
        databaseType: parsed.data.databaseType,
        content: parsed.data.diagramContent,
        id: diagramId, // Use the existing diagram ID from parsing
      });

      // Update sharing settings
      const shareToken = created.shareToken;
      const updates: { isPublic?: boolean; linkPermission?: 'view' | 'edit' } = {
        isPublic: true,
      };
      if (parsed.data.linkPermission !== undefined) {
        updates.linkPermission = parsed.data.linkPermission;
      }
      await updateDiagram(diagramId, updates);

      diagram = await getDiagramById(diagramId);
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
      const shareUrl = shareToken ? `${baseUrl}/share/${shareToken}` : null;

      return NextResponse.json({
        isPublic: true,
        linkPermission: parsed.data.linkPermission ?? 'view',
        shareToken,
        shareUrl,
      });
    } else {
      // No content provided, return settings but link won't work
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
      const shareToken = nanoid(32);
      const shareUrl = `${baseUrl}/share/${shareToken}`;
      
      return NextResponse.json({
        isPublic: true,
        linkPermission: parsed.data.linkPermission ?? 'view',
        shareToken,
        shareUrl,
      });
    }
  }

  // If diagram doesn't exist and not enabling sharing, return defaults
  if (!diagram) {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    return NextResponse.json({
      isPublic: parsed.data.isPublic ?? false,
      linkPermission: parsed.data.linkPermission ?? 'view',
      shareToken: null,
      shareUrl: null,
    });
  }

  // Only owner can modify share settings
  const isOwner = await checkPermission(diagramId, userId, 'owner');
  if (!isOwner) {
    return NextResponse.json({ error: 'Only owner can modify share settings' }, { status: 403 });
  }

  let shareToken: string | null = null;

  if (parsed.data.regenerateToken) {
    shareToken = await regenerateShareToken(diagramId);
  }

  const updates: { isPublic?: boolean; linkPermission?: 'view' | 'edit' } = {};
  if (parsed.data.isPublic !== undefined) {
    updates.isPublic = parsed.data.isPublic;
  }
  if (parsed.data.linkPermission !== undefined) {
    updates.linkPermission = parsed.data.linkPermission;
  }

  if (Object.keys(updates).length > 0) {
    await updateDiagram(diagramId, updates);
  }

  const updatedDiagram = await getDiagramById(diagramId);
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const shareUrl = updatedDiagram?.isPublic && updatedDiagram?.shareToken
    ? `${baseUrl}/share/${updatedDiagram.shareToken}`
    : null;

  return NextResponse.json({
    isPublic: updatedDiagram?.isPublic,
    linkPermission: updatedDiagram?.linkPermission,
    shareToken: shareToken || updatedDiagram?.shareToken,
    shareUrl,
  });
}

