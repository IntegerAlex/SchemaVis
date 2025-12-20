/**
 * This file is part of the SchemaVis project.
 * Copyright (C) 2025 Akshat Kotpalliwar (IntegerAlex)
 * Licensed under the GNU Affero General Public License v3.0 or later.
 */
import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { isUsernameAvailable } from '@/lib/repositories/sql-files';
import { normalizeUsername, validateUsername } from '@/lib/validation/username';

export async function GET(req: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const username = searchParams.get('username');

  if (!username) {
    return NextResponse.json({ error: 'Username is required' }, { status: 400 });
  }

  // Remove @ prefix if present
  const cleanUsername = username.startsWith('@') ? username.slice(1) : username;

  // Validate username format
  const validation = validateUsername(cleanUsername);
  if (!validation.valid) {
    return NextResponse.json({ available: false, error: validation.error }, { status: 400 });
  }

  // Normalize username
  const normalized = normalizeUsername(cleanUsername);

  // Check availability
  const available = await isUsernameAvailable(normalized);

  return NextResponse.json({ available, username: normalized });
}

