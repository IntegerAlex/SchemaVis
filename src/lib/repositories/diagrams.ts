/**
 * This file is part of the SchemaVis project.
 * Copyright (C) 2025 Akshat Kotpalliwar (IntegerAlex)
 * Licensed under the GNU Affero General Public License v3.0 or later.
 */
import { db } from '@/lib/db';
import {
  diagrams,
  diagramPermissions,
  diagramComments,
  collaborationSessions,
  users,
  type PermissionRole,
  type LinkPermission,
} from '@/lib/schema';
import { and, desc, eq, isNull, or, sql, gt } from 'drizzle-orm';
import { nanoid } from 'nanoid';

// ==================== DIAGRAM CRUD ====================

export interface CreateDiagramParams {
  ownerId: string;
  name: string;
  databaseType: string;
  content: Record<string, unknown>;
  id?: string; // Optional: if provided, use this ID instead of generating one
}

export async function createDiagram(params: CreateDiagramParams) {
  const { ownerId, name, databaseType, content, id: providedId } = params;
  const id = providedId || nanoid(21);
  const shareToken = nanoid(32);

  const [created] = await db
    .insert(diagrams)
    .values({
      id,
      ownerId,
      name,
      databaseType,
      content,
      shareToken,
    })
    .returning();

  // Add owner permission
  await db.insert(diagramPermissions).values({
    diagramId: id,
    userId: ownerId,
    role: 'owner',
  });

  return created;
}

export async function getDiagramById(diagramId: string) {
  const [diagram] = await db
    .select()
    .from(diagrams)
    .where(and(eq(diagrams.id, diagramId), isNull(diagrams.deletedAt)))
    .limit(1);

  return diagram ?? null;
}

export async function getDiagramByShareToken(shareToken: string) {
  const [diagram] = await db
    .select()
    .from(diagrams)
    .where(and(eq(diagrams.shareToken, shareToken), isNull(diagrams.deletedAt)))
    .limit(1);

  return diagram ?? null;
}

export async function updateDiagram(
  diagramId: string,
  updates: Partial<{
    name: string;
    content: Record<string, unknown>;
    isPublic: boolean;
    linkPermission: LinkPermission;
    shareExpiresAt: Date | null;
    version: number;
  }>
) {
  const [updated] = await db
    .update(diagrams)
    .set({
      ...updates,
      updatedAt: new Date(),
    })
    .where(and(eq(diagrams.id, diagramId), isNull(diagrams.deletedAt)))
    .returning();

  return updated ?? null;
}

export async function updateDiagramContent(
  diagramId: string,
  content: Record<string, unknown>,
  expectedVersion: number
) {
  // Optimistic locking - only update if version matches
  const [updated] = await db
    .update(diagrams)
    .set({
      content,
      version: expectedVersion + 1,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(diagrams.id, diagramId),
        eq(diagrams.version, expectedVersion),
        isNull(diagrams.deletedAt)
      )
    )
    .returning();

  return updated ?? null;
}

export async function softDeleteDiagram(diagramId: string) {
  const [deleted] = await db
    .update(diagrams)
    .set({
      deletedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(and(eq(diagrams.id, diagramId), isNull(diagrams.deletedAt)))
    .returning({ id: diagrams.id });

  return deleted ?? null;
}

export async function listUserDiagrams(userId: string) {
  // Get diagrams where user is owner or has permissions
  const ownedDiagrams = await db
    .select({
      id: diagrams.id,
      name: diagrams.name,
      databaseType: diagrams.databaseType,
      isPublic: diagrams.isPublic,
      ownerId: diagrams.ownerId,
      ownerName: users.name,
      ownerEmail: users.email,
      ownerImageUrl: users.imageUrl,
      role: sql<PermissionRole>`'owner'`.as('role'),
      createdAt: diagrams.createdAt,
      updatedAt: diagrams.updatedAt,
    })
    .from(diagrams)
    .leftJoin(users, eq(diagrams.ownerId, users.id))
    .where(and(eq(diagrams.ownerId, userId), isNull(diagrams.deletedAt)))
    .orderBy(desc(diagrams.updatedAt));

  const sharedDiagrams = await db
    .select({
      id: diagrams.id,
      name: diagrams.name,
      databaseType: diagrams.databaseType,
      isPublic: diagrams.isPublic,
      ownerId: diagrams.ownerId,
      ownerName: users.name,
      ownerEmail: users.email,
      ownerImageUrl: users.imageUrl,
      role: diagramPermissions.role,
      createdAt: diagrams.createdAt,
      updatedAt: diagrams.updatedAt,
    })
    .from(diagramPermissions)
    .innerJoin(diagrams, eq(diagramPermissions.diagramId, diagrams.id))
    .leftJoin(users, eq(diagrams.ownerId, users.id))
    .where(
      and(
        eq(diagramPermissions.userId, userId),
        sql`${diagramPermissions.role} != 'owner'`,
        isNull(diagrams.deletedAt)
      )
    )
    .orderBy(desc(diagrams.updatedAt));

  return [...ownedDiagrams, ...sharedDiagrams];
}

export async function regenerateShareToken(diagramId: string) {
  const newToken = nanoid(32);
  const [updated] = await db
    .update(diagrams)
    .set({
      shareToken: newToken,
      updatedAt: new Date(),
    })
    .where(eq(diagrams.id, diagramId))
    .returning({ shareToken: diagrams.shareToken });

  return updated?.shareToken ?? null;
}

// ==================== PERMISSIONS ====================

export async function getUserRole(
  diagramId: string,
  userId: string
): Promise<PermissionRole | null> {
  // Check if user is owner
  const [diagram] = await db
    .select({ ownerId: diagrams.ownerId })
    .from(diagrams)
    .where(and(eq(diagrams.id, diagramId), isNull(diagrams.deletedAt)))
    .limit(1);

  if (!diagram) return null;
  if (diagram.ownerId === userId) return 'owner';

  // Check explicit permissions
  const [permission] = await db
    .select({ role: diagramPermissions.role })
    .from(diagramPermissions)
    .where(
      and(
        eq(diagramPermissions.diagramId, diagramId),
        eq(diagramPermissions.userId, userId)
      )
    )
    .limit(1);

  return permission?.role ?? null;
}

export async function checkPermission(
  diagramId: string,
  userId: string | null,
  requiredRole: 'viewer' | 'editor' | 'owner'
): Promise<boolean> {
  const [diagram] = await db
    .select({
      ownerId: diagrams.ownerId,
      isPublic: diagrams.isPublic,
      linkPermission: diagrams.linkPermission,
    })
    .from(diagrams)
    .where(and(eq(diagrams.id, diagramId), isNull(diagrams.deletedAt)))
    .limit(1);

  if (!diagram) return false;

  // Owner check
  if (userId && diagram.ownerId === userId) return true;

  // Public diagram with link permission
  if (diagram.isPublic) {
    if (requiredRole === 'viewer') return true;
    if (requiredRole === 'editor' && diagram.linkPermission === 'edit') return true;
  }

  // User-specific permissions
  if (userId) {
    const role = await getUserRole(diagramId, userId);
    if (!role) return false;

    const roleHierarchy: Record<PermissionRole, number> = {
      viewer: 1,
      editor: 2,
      owner: 3,
    };

    return roleHierarchy[role] >= roleHierarchy[requiredRole];
  }

  return false;
}

export async function addPermission(
  diagramId: string,
  userId: string,
  role: PermissionRole
) {
  // Don't add owner permission - that's handled via diagram ownership
  if (role === 'owner') return null;

  const [existing] = await db
    .select()
    .from(diagramPermissions)
    .where(
      and(
        eq(diagramPermissions.diagramId, diagramId),
        eq(diagramPermissions.userId, userId)
      )
    )
    .limit(1);

  if (existing) {
    // Update existing permission
    const [updated] = await db
      .update(diagramPermissions)
      .set({ role, updatedAt: new Date() })
      .where(eq(diagramPermissions.id, existing.id))
      .returning();
    return updated;
  }

  const [created] = await db
    .insert(diagramPermissions)
    .values({
      diagramId,
      userId,
      role,
    })
    .returning();

  return created;
}

export async function removePermission(diagramId: string, userId: string) {
  const [deleted] = await db
    .delete(diagramPermissions)
    .where(
      and(
        eq(diagramPermissions.diagramId, diagramId),
        eq(diagramPermissions.userId, userId),
        sql`${diagramPermissions.role} != 'owner'`
      )
    )
    .returning({ id: diagramPermissions.id });

  return deleted ?? null;
}

export async function listPermissions(diagramId: string) {
  const permissions = await db
    .select({
      id: diagramPermissions.id,
      userId: diagramPermissions.userId,
      userName: users.name,
      userEmail: users.email,
      userUsername: users.username,
      userImageUrl: users.imageUrl,
      role: diagramPermissions.role,
      createdAt: diagramPermissions.createdAt,
    })
    .from(diagramPermissions)
    .leftJoin(users, eq(diagramPermissions.userId, users.id))
    .where(eq(diagramPermissions.diagramId, diagramId))
    .orderBy(desc(diagramPermissions.createdAt));

  return permissions;
}

export async function findUserByEmail(email: string) {
  const [user] = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      username: users.username,
      imageUrl: users.imageUrl,
    })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  return user ?? null;
}

export async function findUserByUsername(username: string) {
  // Normalize username (remove @ prefix if present, lowercase)
  const normalized = username.startsWith('@') ? username.slice(1).toLowerCase() : username.toLowerCase();
  
  const [user] = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      username: users.username,
      imageUrl: users.imageUrl,
    })
    .from(users)
    .where(eq(users.username, normalized))
    .limit(1);

  return user ?? null;
}

// ==================== COMMENTS ====================

export interface CreateCommentParams {
  diagramId: string;
  userId: string;
  content: string;
  x: number;
  y: number;
  parentId?: number;
}

export async function createComment(params: CreateCommentParams) {
  const { diagramId, userId, content, x, y, parentId } = params;

  const [created] = await db
    .insert(diagramComments)
    .values({
      diagramId,
      userId,
      content,
      x,
      y,
      parentId: parentId ?? null,
    })
    .returning();

  return created;
}

export async function getCommentById(commentId: number) {
  const [comment] = await db
    .select()
    .from(diagramComments)
    .where(and(eq(diagramComments.id, commentId), isNull(diagramComments.deletedAt)))
    .limit(1);

  return comment ?? null;
}

export async function listComments(diagramId: string) {
  const comments = await db
    .select({
      id: diagramComments.id,
      diagramId: diagramComments.diagramId,
      userId: diagramComments.userId,
      userName: users.name,
      userEmail: users.email,
      userImageUrl: users.imageUrl,
      parentId: diagramComments.parentId,
      content: diagramComments.content,
      x: diagramComments.x,
      y: diagramComments.y,
      resolved: diagramComments.resolved,
      createdAt: diagramComments.createdAt,
      updatedAt: diagramComments.updatedAt,
    })
    .from(diagramComments)
    .leftJoin(users, eq(diagramComments.userId, users.id))
    .where(
      and(eq(diagramComments.diagramId, diagramId), isNull(diagramComments.deletedAt))
    )
    .orderBy(diagramComments.createdAt);

  // Debug logging in development
  if (process.env.NODE_ENV === 'development' && comments.length === 0) {
    // Check if there are any comments for this diagram (including deleted ones)
    const allComments = await db
      .select({ id: diagramComments.id, diagramId: diagramComments.diagramId, deletedAt: diagramComments.deletedAt })
      .from(diagramComments)
      .where(eq(diagramComments.diagramId, diagramId));
    console.log(`[listComments] Diagram ${diagramId}: Found ${allComments.length} total comments (${allComments.filter(c => !c.deletedAt).length} active, ${allComments.filter(c => c.deletedAt).length} deleted)`);
  }

  return comments;
}

export async function updateComment(
  commentId: number,
  updates: Partial<{ content: string; resolved: boolean }>
) {
  const [updated] = await db
    .update(diagramComments)
    .set({
      ...updates,
      updatedAt: new Date(),
    })
    .where(and(eq(diagramComments.id, commentId), isNull(diagramComments.deletedAt)))
    .returning();

  return updated ?? null;
}

export async function softDeleteComment(commentId: number) {
  const [deleted] = await db
    .update(diagramComments)
    .set({
      deletedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(and(eq(diagramComments.id, commentId), isNull(diagramComments.deletedAt)))
    .returning({ id: diagramComments.id });

  return deleted ?? null;
}

// ==================== COLLABORATION SESSIONS ====================

export async function upsertCollaborationSession(
  diagramId: string,
  userId: string,
  socketId: string
) {
  const [existing] = await db
    .select()
    .from(collaborationSessions)
    .where(
      and(
        eq(collaborationSessions.diagramId, diagramId),
        eq(collaborationSessions.userId, userId)
      )
    )
    .limit(1);

  if (existing) {
    const [updated] = await db
      .update(collaborationSessions)
      .set({
        socketId,
        lastSeen: new Date(),
      })
      .where(eq(collaborationSessions.id, existing.id))
      .returning();
    return updated;
  }

  const [created] = await db
    .insert(collaborationSessions)
    .values({
      diagramId,
      userId,
      socketId,
    })
    .returning();

  return created;
}

export async function updateCursorPosition(
  sessionId: number,
  cursorX: number,
  cursorY: number
) {
  const [updated] = await db
    .update(collaborationSessions)
    .set({
      cursorX,
      cursorY,
      lastSeen: new Date(),
    })
    .where(eq(collaborationSessions.id, sessionId))
    .returning();

  return updated ?? null;
}

export async function updateViewport(
  sessionId: number,
  viewportX: number,
  viewportY: number,
  viewportZoom: number
) {
  const [updated] = await db
    .update(collaborationSessions)
    .set({
      viewportX,
      viewportY,
      viewportZoom,
      lastSeen: new Date(),
    })
    .where(eq(collaborationSessions.id, sessionId))
    .returning();

  return updated ?? null;
}

export async function removeCollaborationSession(diagramId: string, userId: string) {
  const [deleted] = await db
    .delete(collaborationSessions)
    .where(
      and(
        eq(collaborationSessions.diagramId, diagramId),
        eq(collaborationSessions.userId, userId)
      )
    )
    .returning({ id: collaborationSessions.id });

  return deleted ?? null;
}

export async function removeCollaborationSessionBySocketId(socketId: string) {
  const [deleted] = await db
    .delete(collaborationSessions)
    .where(eq(collaborationSessions.socketId, socketId))
    .returning({
      id: collaborationSessions.id,
      diagramId: collaborationSessions.diagramId,
      userId: collaborationSessions.userId,
    });

  return deleted ?? null;
}

export async function getActiveSessions(diagramId: string) {
  // Get sessions active in the last 30 seconds
  const thirtySecondsAgo = new Date(Date.now() - 30000);

  const sessions = await db
    .select({
      id: collaborationSessions.id,
      diagramId: collaborationSessions.diagramId,
      userId: collaborationSessions.userId,
      userName: users.name,
      userEmail: users.email,
      userImageUrl: users.imageUrl,
      socketId: collaborationSessions.socketId,
      cursorX: collaborationSessions.cursorX,
      cursorY: collaborationSessions.cursorY,
      viewportX: collaborationSessions.viewportX,
      viewportY: collaborationSessions.viewportY,
      viewportZoom: collaborationSessions.viewportZoom,
      lastSeen: collaborationSessions.lastSeen,
    })
    .from(collaborationSessions)
    .leftJoin(users, eq(collaborationSessions.userId, users.id))
    .where(
      and(
        eq(collaborationSessions.diagramId, diagramId),
        gt(collaborationSessions.lastSeen, thirtySecondsAgo)
      )
    );

  return sessions;
}

export async function cleanupStaleSessions() {
  // Remove sessions older than 1 minute
  const oneMinuteAgo = new Date(Date.now() - 60000);

  await db
    .delete(collaborationSessions)
    .where(sql`${collaborationSessions.lastSeen} < ${oneMinuteAgo}`);
}

