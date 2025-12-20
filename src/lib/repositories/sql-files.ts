/**
 * This file is part of the SchemaVis project.
 * Copyright (C) 2025 Akshat Kotpalliwar (IntegerAlex)
 * Licensed under the GNU Affero General Public License v3.0 or later.
 */
import { db } from '@/lib/db';
import { sqlFiles, users } from '@/lib/schema';
import { and, desc, eq, isNull, ilike, sql } from 'drizzle-orm';

type UserUpsertParams = {
  id: string;
  email?: string | null;
  name?: string | null;
  username?: string | null;
  imageUrl?: string | null;
  publicMetadata?: Record<string, unknown> | null;
  privateMetadata?: Record<string, unknown> | null;
  unsafeMetadata?: Record<string, unknown> | null;
};

export async function ensureUser(params: UserUpsertParams) {
  const { id, email, name, username, imageUrl, publicMetadata, privateMetadata, unsafeMetadata } = params;
  await db
    .insert(users)
    .values({
      id,
      email: email ?? null,
      name: name ?? null,
      username: username ?? null,
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
        // Only update username if provided (don't overwrite existing username with null)
        ...(username !== undefined && { username: username ?? null }),
        imageUrl: imageUrl ?? null,
        publicMetadata: publicMetadata ?? null,
        privateMetadata: privateMetadata ?? null,
        unsafeMetadata: unsafeMetadata ?? null,
        updatedAt: new Date(),
      },
    });
}

/**
 * Get user by ID
 */
export async function getUserById(userId: string) {
  const [user] = await db
    .select({
      id: users.id,
      email: users.email,
      name: users.name,
      username: users.username,
      imageUrl: users.imageUrl,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  return user ?? null;
}

/**
 * Check if username is available
 */
export async function isUsernameAvailable(username: string): Promise<boolean> {
  const [existing] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.username, username))
    .limit(1);

  return !existing;
}

/**
 * Update user username
 */
export async function updateUsername(userId: string, username: string) {
  const [updated] = await db
    .update(users)
    .set({
      username,
      updatedAt: new Date(),
    })
    .where(eq(users.id, userId))
    .returning({
      id: users.id,
      username: users.username,
    });

  return updated ?? null;
}

/**
 * Search users by username (case-insensitive, partial match)
 */
export async function searchUsersByUsername(query: string, limit: number = 10) {
  const searchPattern = `%${query.toLowerCase()}%`;
  
  const results = await db
    .select({
      id: users.id,
      name: users.name,
      username: users.username,
      imageUrl: users.imageUrl,
    })
    .from(users)
    .where(
      and(
        ilike(users.username, searchPattern),
        sql`${users.username} IS NOT NULL`
      )
    )
    .limit(limit);

  return results;
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

