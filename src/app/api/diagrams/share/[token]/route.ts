/**
 * This file is part of the SchemaVis project.
 * Copyright (C) 2025 Akshat Kotpalliwar (IntegerAlex)
 * Licensed under the GNU Affero General Public License v3.0 or later.
 */
import { NextResponse } from 'next/server';
import { getDiagramByShareToken } from '@/lib/repositories/diagrams';
import { isNull } from 'drizzle-orm';

// Get diagram by share token (for public shared links)
export async function GET(
  req: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

  // Cache control headers to prevent caching
  const noCacheHeaders = {
    'Cache-Control': 'no-cache, no-store, must-revalidate, max-age=0',
    'Pragma': 'no-cache',
    'Expires': '0',
  };

  // First check if diagram exists (including deleted ones) to provide better error messages
  const { db } = await import('@/lib/db');
  const { diagrams } = await import('@/lib/schema');
  const { eq, and } = await import('drizzle-orm');
  
  const [diagramWithDeleted] = await db
    .select()
    .from(diagrams)
    .where(eq(diagrams.shareToken, token))
    .limit(1);

  // If diagram doesn't exist at all
  if (!diagramWithDeleted) {
    return NextResponse.json(
      { error: 'Diagram not found', reason: 'not_found' },
      { status: 404, headers: noCacheHeaders }
    );
  }

  // If diagram is deleted
  // deletedAt is a timestamp (Date) when set, or null/undefined when not deleted
  const deletedAt = diagramWithDeleted.deletedAt;
  const isDeleted = deletedAt != null;
  
  if (isDeleted) {
    return NextResponse.json(
      { error: 'This diagram has been deleted by the owner', reason: 'deleted' },
      { status: 410, headers: noCacheHeaders } // 410 Gone - resource no longer available
    );
  }

  // Check if link has expired
  if (diagramWithDeleted.shareExpiresAt && new Date(diagramWithDeleted.shareExpiresAt) < new Date()) {
    return NextResponse.json(
      { error: 'This share link has expired', reason: 'expired' },
      { status: 410, headers: noCacheHeaders } // 410 Gone - resource no longer available
    );
  }

  // Check if diagram is public
  if (!diagramWithDeleted.isPublic) {
    return NextResponse.json(
      { error: 'This diagram is no longer shared', reason: 'not_public' },
      { status: 403, headers: noCacheHeaders }
    );
  }

  // Check if the diagram owner still has any active SQL files
  // If not, the source SQL file might have been deleted
  const { sqlFiles } = await import('@/lib/schema');
  const activeSqlFiles = await db
    .select({ id: sqlFiles.id })
    .from(sqlFiles)
    .where(and(eq(sqlFiles.userId, diagramWithDeleted.ownerId), isNull(sqlFiles.deletedAt)))
    .limit(1);

  // If owner has no active SQL files, the source file was likely deleted
  if (activeSqlFiles.length === 0) {
    return NextResponse.json(
      { 
        error: 'The file might be deleted or owner has changed the access', 
        reason: 'source_deleted' 
      },
      { status: 410, headers: noCacheHeaders } // 410 Gone - resource no longer available
    );
  }

  // Return the diagram data with cache control headers
  return NextResponse.json(
    {
      diagram: {
        id: diagramWithDeleted.id,
        name: diagramWithDeleted.name,
        databaseType: diagramWithDeleted.databaseType,
        content: diagramWithDeleted.content,
        version: diagramWithDeleted.version,
      },
      canEdit: diagramWithDeleted.linkPermission === 'edit',
      isOwner: false,
    },
    {
      headers: noCacheHeaders,
    }
  );
}

