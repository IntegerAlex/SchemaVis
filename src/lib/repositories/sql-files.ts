/**
 * This file is part of the SchemaVis project.
 * Copyright (C) 2025 Akshat Kotpalliwar (IntegerAlex)
 * Licensed under the GNU Affero General Public License v3.0 or later.
 */
import { db } from '@/lib/db';
import { sqlFiles, users } from '@/lib/schema';
import { and, desc, eq } from 'drizzle-orm';

type UserUpsertParams = {
  id: string;
  email?: string | null;
  name?: string | null;
  imageUrl?: string | null;
  publicMetadata?: Record<string, unknown> | null;
  privateMetadata?: Record<string, unknown> | null;
  unsafeMetadata?: Record<string, unknown> | null;
};

export async function ensureUser(params: UserUpsertParams) {
  const { id, email, name, imageUrl, publicMetadata, privateMetadata, unsafeMetadata } = params;
  await db
    .insert(users)
    .values({
      id,
      email: email ?? null,
      name: name ?? null,
      imageUrl: imageUrl ?? null,
      publicMetadata: publicMetadata ?? null,
      privateMetadata: privateMetadata ?? null,
      unsafeMetadata: unsafeMetadata ?? null,
    })
    .onConflictDoUpdate({
      target: users.id,
      set: {
        email: email ?? null,
        name: name ?? null,
        imageUrl: imageUrl ?? null,
        publicMetadata: publicMetadata ?? null,
        privateMetadata: privateMetadata ?? null,
        unsafeMetadata: unsafeMetadata ?? null,
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

export async function findSqlFileByContent(userId: string, content: string) {
  const [existing] = await db
    .select({ id: sqlFiles.id })
    .from(sqlFiles)
    .where(and(eq(sqlFiles.userId, userId), eq(sqlFiles.content, content)))
    .limit(1);

  return existing ?? null;
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

