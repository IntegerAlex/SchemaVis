/**
 * This file is part of the SchemaVis project.
 * Copyright (C) 2025 Akshat Kotpalliwar (IntegerAlex)
 * Licensed under the GNU Affero General Public License v3.0 or later.
 */
import { NextResponse } from 'next/server';
import { getDiagramByShareToken } from '@/lib/repositories/diagrams';

// Get diagram by share token (for public shared links)
export async function GET(
  req: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

  const diagram = await getDiagramByShareToken(token);
  if (!diagram) {
    return NextResponse.json({ error: 'Diagram not found or link expired' }, { status: 404 });
  }

  if (!diagram.isPublic) {
    return NextResponse.json({ error: 'This diagram is no longer shared' }, { status: 403 });
  }

  return NextResponse.json({
    diagram: {
      id: diagram.id,
      name: diagram.name,
      databaseType: diagram.databaseType,
      content: diagram.content,
      version: diagram.version,
    },
    canEdit: diagram.linkPermission === 'edit',
    isOwner: false,
  });
}

