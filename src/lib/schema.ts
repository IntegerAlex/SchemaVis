/**
 * This file is part of the SchemaVis project.
 * Copyright (C) 2025 Akshat Kotpalliwar (IntegerAlex)
 * Licensed under the GNU Affero General Public License v3.0 or later.
 */
import {
  boolean,
  doublePrecision,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  serial,
  text,
  timestamp,
  varchar,
} from 'drizzle-orm/pg-core';

// Enums
export const permissionRoleEnum = pgEnum('permission_role', ['owner', 'editor', 'viewer']);
export const linkPermissionEnum = pgEnum('link_permission', ['view', 'edit']);

export const users = pgTable('users', {
  id: varchar('id', { length: 128 }).primaryKey(),
  email: text('email'),
  name: text('name'),
  imageUrl: text('image_url'),
  publicMetadata: jsonb('public_metadata').$type<Record<string, unknown> | null>(),
  privateMetadata: jsonb('private_metadata').$type<Record<string, unknown> | null>(),
  unsafeMetadata: jsonb('unsafe_metadata').$type<Record<string, unknown> | null>(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const sqlFiles = pgTable('sql_files', {
  id: serial('id').primaryKey(),
  userId: varchar('user_id', { length: 128 })
    .notNull()
    .references(() => users.id),
  title: text('title'),
  content: text('content').notNull(),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// Diagrams table - stores collaborative diagrams
export const diagrams = pgTable('diagrams', {
  id: varchar('id', { length: 36 }).primaryKey(), // UUID
  ownerId: varchar('owner_id', { length: 128 })
    .notNull()
    .references(() => users.id),
  name: text('name').notNull(),
  databaseType: varchar('database_type', { length: 50 }).notNull(),
  content: jsonb('content').$type<Record<string, unknown>>().notNull(), // Full diagram JSON
  isPublic: boolean('is_public').default(false).notNull(),
  shareToken: varchar('share_token', { length: 64 }).unique(),
  linkPermission: linkPermissionEnum('link_permission').default('view'),
  version: integer('version').default(1).notNull(),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// Diagram permissions - user-specific access control
export const diagramPermissions = pgTable('diagram_permissions', {
  id: serial('id').primaryKey(),
  diagramId: varchar('diagram_id', { length: 36 })
    .notNull()
    .references(() => diagrams.id, { onDelete: 'cascade' }),
  userId: varchar('user_id', { length: 128 })
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  role: permissionRoleEnum('role').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// Diagram comments - collaborative comments on canvas
export const diagramComments = pgTable('diagram_comments', {
  id: serial('id').primaryKey(),
  diagramId: varchar('diagram_id', { length: 36 })
    .notNull()
    .references(() => diagrams.id, { onDelete: 'cascade' }),
  userId: varchar('user_id', { length: 128 })
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  parentId: integer('parent_id'), // For replies
  content: text('content').notNull(),
  x: doublePrecision('x').notNull(),
  y: doublePrecision('y').notNull(),
  resolved: boolean('resolved').default(false).notNull(),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// Collaboration sessions - track active users
export const collaborationSessions = pgTable('collaboration_sessions', {
  id: serial('id').primaryKey(),
  diagramId: varchar('diagram_id', { length: 36 })
    .notNull()
    .references(() => diagrams.id, { onDelete: 'cascade' }),
  userId: varchar('user_id', { length: 128 })
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  socketId: varchar('socket_id', { length: 128 }),
  cursorX: doublePrecision('cursor_x'),
  cursorY: doublePrecision('cursor_y'),
  viewportX: doublePrecision('viewport_x'),
  viewportY: doublePrecision('viewport_y'),
  viewportZoom: doublePrecision('viewport_zoom'),
  lastSeen: timestamp('last_seen', { withTimezone: true }).defaultNow().notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// Type exports for TypeScript
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type SqlFile = typeof sqlFiles.$inferSelect;
export type NewSqlFile = typeof sqlFiles.$inferInsert;
export type Diagram = typeof diagrams.$inferSelect;
export type NewDiagram = typeof diagrams.$inferInsert;
export type DiagramPermission = typeof diagramPermissions.$inferSelect;
export type NewDiagramPermission = typeof diagramPermissions.$inferInsert;
export type DiagramComment = typeof diagramComments.$inferSelect;
export type NewDiagramComment = typeof diagramComments.$inferInsert;
export type CollaborationSession = typeof collaborationSessions.$inferSelect;
export type NewCollaborationSession = typeof collaborationSessions.$inferInsert;

export type PermissionRole = 'owner' | 'editor' | 'viewer';
export type LinkPermission = 'view' | 'edit';

