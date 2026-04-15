/**
 * This file is part of the SchemaVis project.
 * Copyright (C) 2025 Akshat Kotpalliwar (IntegerAlex)
 * Licensed under the GNU Affero General Public License v3.0 or later.
 */
import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { getSqlFileById, softDeleteSqlFile, listSqlFiles, updateSqlFile } from '@/lib/repositories/sql-files';
import { softDeleteDiagram } from '@/lib/repositories/diagrams';
import { db } from '@/lib/db';
import { diagrams } from '@/lib/schema';
import { and, eq, isNull } from 'drizzle-orm';
import { z } from 'zod';

const updateSchema = z.object({
  title: z.string().trim().min(1, 'Title cannot be empty').optional(),
  content: z.string().min(1, 'SQL content cannot be empty').optional(),
}).refine((data) => data.title !== undefined || data.content !== undefined, {
  message: 'At least one of title or content must be provided',
});

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const fileId = parseInt(id, 10);

  if (isNaN(fileId)) {
    return NextResponse.json({ error: 'Invalid file ID' }, { status: 400 });
  }

  const file = await getSqlFileById(userId, fileId);

  if (!file) {
    return NextResponse.json({ error: 'File not found' }, { status: 404 });
  }

  return NextResponse.json({ file }, { status: 200 });
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const fileId = parseInt(id, 10);

  if (isNaN(fileId)) {
    return NextResponse.json({ error: 'Invalid file ID' }, { status: 400 });
  }

  const body = await req.json().catch(() => ({}));
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid request', details: parsed.error.flatten() }, { status: 400 });
  }

  const updated = await updateSqlFile(userId, fileId, parsed.data);

  if (!updated) {
    return NextResponse.json({ error: 'File not found' }, { status: 404 });
  }

  return NextResponse.json({ file: updated }, { status: 200 });
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const fileId = parseInt(id, 10);

  if (isNaN(fileId)) {
    return NextResponse.json({ error: 'Invalid file ID' }, { status: 400 });
  }

  const deleted = await softDeleteSqlFile(userId, fileId);

  if (!deleted) {
    return NextResponse.json({ error: 'File not found' }, { status: 404 });
  }

  // Check if user has any remaining active SQL files
  const remainingFiles = await listSqlFiles(userId);

  // If no active SQL files remain, soft-delete all diagrams owned by this user
  // This ensures shared links become invalid when the source SQL file is deleted
  if (remainingFiles.length === 0) {
    const userDiagrams = await db
      .select({ id: diagrams.id })
      .from(diagrams)
      .where(and(eq(diagrams.ownerId, userId), isNull(diagrams.deletedAt)));

    // Soft-delete all diagrams for this user
    for (const diagram of userDiagrams) {
      await softDeleteDiagram(diagram.id);
    }
  }

  return NextResponse.json({ success: true }, { status: 200 });
}
