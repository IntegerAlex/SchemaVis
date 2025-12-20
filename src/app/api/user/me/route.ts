/**
 * This file is part of the SchemaVis project.
 * Copyright (C) 2025 Akshat Kotpalliwar (IntegerAlex)
 * Licensed under the GNU Affero General Public License v3.0 or later.
 */
import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { getUserById, ensureUser } from '@/lib/repositories/sql-files';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const { userId, sessionClaims } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Ensure user exists in database (create if doesn't exist)
  const email = (sessionClaims?.email as string | undefined) ?? undefined;
  const name =
    (sessionClaims?.name as string | undefined) ??
    ((sessionClaims?.first_name || sessionClaims?.last_name)
      ? `${sessionClaims?.first_name ?? ''} ${sessionClaims?.last_name ?? ''}`.trim()
      : undefined);
  const imageUrl = (sessionClaims?.image_url as string | undefined) ?? undefined;

  await ensureUser({ id: userId, email, name, imageUrl });

  // Get user data
  const user = await getUserById(userId);
  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  return NextResponse.json({
    id: user.id,
    email: user.email,
    name: user.name,
    username: user.username,
    imageUrl: user.imageUrl,
    hasUsername: !!user.username,
  });
}

