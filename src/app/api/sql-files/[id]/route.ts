/**
 * This file is part of the SchemaVis project.
 * Copyright (C) 2025 Akshat Kotpalliwar (IntegerAlex)
 * Licensed under the GNU Affero General Public License v3.0 or later.
 */
import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { getSqlFileById, softDeleteSqlFile } from '@/lib/repositories/sql-files';

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

  return NextResponse.json({ success: true }, { status: 200 });
}

