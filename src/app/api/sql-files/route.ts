/**
 * This file is part of the SchemaVis project.
 * Copyright (C) 2025 Akshat Kotpalliwar (IntegerAlex)
 * Licensed under the GNU Affero General Public License v3.0 or later.
 */
import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { ensureUser, createSqlFile, listSqlFiles } from '@/lib/repositories/sql-files';

const createSchema = z.object({
  title: z.string().optional(),
  content: z.string().min(1, 'SQL content cannot be empty'),
});

export async function POST(req: Request) {
  const { userId, sessionClaims } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid request', details: parsed.error.flatten() }, { status: 400 });
  }

  const email = (sessionClaims?.email as string | undefined) ?? undefined;
  const name =
    (sessionClaims?.name as string | undefined) ??
    ((sessionClaims?.first_name || sessionClaims?.last_name) ? `${sessionClaims?.first_name ?? ''} ${sessionClaims?.last_name ?? ''}`.trim() : undefined);

  await ensureUser({ id: userId, email, name });
  const record = await createSqlFile({ userId, title: parsed.data.title ?? null, content: parsed.data.content });

  return NextResponse.json({ id: record.id, title: record.title, createdAt: record.createdAt }, { status: 201 });
}

export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const files = await listSqlFiles(userId);
  return NextResponse.json({ files }, { status: 200 });
}

