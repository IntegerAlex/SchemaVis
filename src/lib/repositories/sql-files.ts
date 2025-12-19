/**
 * This file is part of the SchemaVis project.
 * Copyright (C) 2025 Akshat Kotpalliwar (IntegerAlex)
 * Licensed under the GNU Affero General Public License v3.0 or later.
 */
import { db } from '@/lib/db';
import { sqlFiles, users } from '@/lib/schema';
import { and, desc, eq, isNull } from 'drizzle-orm';

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
    .where(and(eq(sqlFiles.userId, userId), eq(sqlFiles.content, content), isNull(sqlFiles.deletedAt)))
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
    .where(and(eq(sqlFiles.userId, userId), isNull(sqlFiles.deletedAt)))
    .orderBy(desc(sqlFiles.createdAt));

  return rows;
}

export async function getSqlFileById(userId: string, fileId: number) {
  const [file] = await db
    .select({
      id: sqlFiles.id,
      title: sqlFiles.title,
      content: sqlFiles.content,
      createdAt: sqlFiles.createdAt,
      updatedAt: sqlFiles.updatedAt,
    })
    .from(sqlFiles)
    .where(and(eq(sqlFiles.id, fileId), eq(sqlFiles.userId, userId), isNull(sqlFiles.deletedAt)))
    .limit(1);

  return file ?? null;
}

export async function softDeleteSqlFile(userId: string, fileId: number) {
  const [updated] = await db
    .update(sqlFiles)
    .set({
      deletedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(and(eq(sqlFiles.id, fileId), eq(sqlFiles.userId, userId), isNull(sqlFiles.deletedAt)))
    .returning({ id: sqlFiles.id });

  return updated ?? null;
}

