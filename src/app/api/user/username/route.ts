/**
 * This file is part of the SchemaVis project.
 * Copyright (C) 2025 Akshat Kotpalliwar (IntegerAlex)
 * Licensed under the GNU Affero General Public License v3.0 or later.
 */
import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { isUsernameAvailable, updateUsername, getUserById } from '@/lib/repositories/sql-files';
import { normalizeUsername, validateUsername } from '@/lib/validation/username';

const setUsernameSchema = z.object({
  username: z.string().min(1, 'Username is required'),
});

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Check if user already has a username
  const currentUser = await getUserById(userId);
  if (currentUser?.username) {
    return NextResponse.json(
      { error: 'Username already set. Contact support to change it.' },
      { status: 400 }
    );
  }

  const body = await req.json().catch(() => ({}));
  const parsed = setUsernameSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid request', details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  // Remove @ prefix if present
  const cleanUsername = parsed.data.username.startsWith('@')
    ? parsed.data.username.slice(1)
    : parsed.data.username;

  // Validate username format
  const validation = validateUsername(cleanUsername);
  if (!validation.valid) {
    return NextResponse.json({ error: validation.error }, { status: 400 });
  }

  // Normalize username
  const normalized = normalizeUsername(cleanUsername);

  // Check availability
  const available = await isUsernameAvailable(normalized);
  if (!available) {
    return NextResponse.json({ error: 'Username is already taken' }, { status: 409 });
  }

  // Update username
  try {
    const updated = await updateUsername(userId, normalized);
    if (!updated) {
      return NextResponse.json({ error: 'Failed to update username' }, { status: 500 });
    }

    return NextResponse.json({ username: updated.username }, { status: 200 });
  } catch (error: any) {
    // Handle unique constraint violation
    if (error?.code === '23505' || error?.message?.includes('unique')) {
      return NextResponse.json({ error: 'Username is already taken' }, { status: 409 });
    }

    console.error('Error updating username:', error);
    return NextResponse.json({ error: 'Failed to update username' }, { status: 500 });
  }
}

