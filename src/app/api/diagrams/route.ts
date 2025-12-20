/**
 * This file is part of the SchemaVis project.
 * Copyright (C) 2025 Akshat Kotpalliwar (IntegerAlex)
 * Licensed under the GNU Affero General Public License v3.0 or later.
 */
import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createDiagram, listUserDiagrams } from '@/lib/repositories/diagrams';
import { ensureUser } from '@/lib/repositories/sql-files';

const createDiagramSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  databaseType: z.string().min(1, 'Database type is required'),
  content: z.record(z.unknown()),
});

export async function POST(req: Request) {
  const { userId, sessionClaims } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const parsed = createDiagramSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid request', details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  // Ensure user exists
  const email = (sessionClaims?.email as string | undefined) ?? undefined;
  const name =
    (sessionClaims?.name as string | undefined) ??
    ((sessionClaims?.first_name || sessionClaims?.last_name)
      ? `${sessionClaims?.first_name ?? ''} ${sessionClaims?.last_name ?? ''}`.trim()
      : undefined);
  await ensureUser({ id: userId, email, name });

  const diagram = await createDiagram({
    ownerId: userId,
    name: parsed.data.name,
    databaseType: parsed.data.databaseType,
    content: parsed.data.content,
  });

  return NextResponse.json({ diagram }, { status: 201 });
}

export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const diagrams = await listUserDiagrams(userId);
  return NextResponse.json({ diagrams }, { status: 200 });
}

