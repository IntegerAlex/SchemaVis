/**
 * This file is part of the SchemaVis project.
 * Copyright (C) 2025 Akshat Kotpalliwar (IntegerAlex)
 * Licensed under the GNU Affero General Public License v3.0 or later.
 */
import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { searchUsersByUsername } from '@/lib/repositories/sql-files';

export async function GET(req: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const query = searchParams.get('q');

  if (!query || query.trim().length < 2) {
    return NextResponse.json({ users: [] });
  }

  // Remove @ prefix if present
  const cleanQuery = query.startsWith('@') ? query.slice(1) : query;
  
  // Search for users
  const users = await searchUsersByUsername(cleanQuery.trim(), 10);

  return NextResponse.json({ users });
}

