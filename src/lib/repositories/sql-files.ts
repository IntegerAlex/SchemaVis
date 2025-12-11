/**
 * This file is part of the SchemaVis project.
 * Copyright (C) 2025 Akshat Kotpalliwar (IntegerAlex)
 * Licensed under the GNU Affero General Public License v3.0 or later.
 */
import { db } from '@/lib/db';
import { sqlFiles, users } from '@/lib/schema';
import { eq, desc } from 'drizzle-orm';

export async function ensureUser(params: {
  id: string;
  email?: string | null;
  name?: string | null;
}) {
  const { id, email, name } = params;
  await db
    .insert(users)
    .values({
      id,
      email: email ?? null,
      name: name ?? null,
    })
    .onConflictDoUpdate({
      target: users.id,
      set: {
        email: email ?? null,
        name: name ?? null,
        updatedAt: new Date(),
      },
    });
}

export async function createSqlFile(params: {
  userId: string;
  title?: string | null;
  content: string;
}) {
  const { userId, title, content } = params;

  const [created] = await db
    .insert(sqlFiles)
    .values({
      userId,
      title: title ?? null,
      content,
    })
    .returning();

  return created;
}

export async function listSqlFiles(userId: string) {
  const rows = await db
    .select({
      id: sqlFiles.id,
      title: sqlFiles.title,
      createdAt: sqlFiles.createdAt,
      updatedAt: sqlFiles.updatedAt,
    })
    .from(sqlFiles)
    .where(eq(sqlFiles.userId, userId))
    .orderBy(desc(sqlFiles.createdAt));

  return rows;
}

