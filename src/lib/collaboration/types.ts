/**
 * This file is part of the SchemaVis project.
 * Copyright (C) 2025 Akshat Kotpalliwar (IntegerAlex)
 * Licensed under the GNU Affero General Public License v3.0 or later.
 */

import type { PermissionRole } from '@/lib/schema';

// ==================== USER TYPES ====================

export interface CollaboratorInfo {
  id: string;
  name: string | null;
  email: string | null;
  imageUrl: string | null;
  role: PermissionRole;
}

export interface CursorPosition {
  userId: string;
  x: number;
  y: number;
  color: string;
}

export interface Viewport {
  x: number;
  y: number;
  zoom: number;
}

// ==================== WEBSOCKET MESSAGE TYPES ====================

// Client -> Server messages
export type ClientMessage =
  | { type: 'JOIN_ROOM'; diagramId: string }
  | { type: 'LEAVE_ROOM'; diagramId: string }
  | { type: 'CURSOR_MOVE'; diagramId: string; x: number; y: number }
  | { type: 'VIEWPORT_CHANGE'; diagramId: string; viewport: Viewport }
  | { type: 'NODE_DRAG'; diagramId: string; nodeId: string; x: number; y: number }
  | { type: 'NODE_DRAG_END'; diagramId: string; nodeId: string; x: number; y: number }
  | { type: 'DIAGRAM_UPDATE'; diagramId: string; content: Record<string, unknown>; version: number }
  | { type: 'COMMENT_CREATE'; diagramId: string; content: string; x: number; y: number; parentId?: number }
  | { type: 'COMMENT_RESOLVE'; diagramId: string; commentId: number }
  | { type: 'COMMENT_DELETE'; diagramId: string; commentId: number }
  | { type: 'PING' };

// Server -> Client messages
export type ServerMessage =
  | { type: 'ROOM_JOINED'; diagramId: string; users: CollaboratorInfo[]; currentUser: CollaboratorInfo }
  | { type: 'USER_JOINED'; diagramId: string; user: CollaboratorInfo }
  | { type: 'USER_LEFT'; diagramId: string; userId: string }
  | { type: 'CURSOR_UPDATE'; diagramId: string; userId: string; x: number; y: number; color: string }
  | { type: 'VIEWPORT_UPDATE'; diagramId: string; userId: string; viewport: Viewport }
  | { type: 'NODE_DRAGGING'; diagramId: string; userId: string; nodeId: string; x: number; y: number }
  | { type: 'NODE_DRAG_ENDED'; diagramId: string; userId: string; nodeId: string; x: number; y: number }
  | { type: 'DIAGRAM_UPDATED'; diagramId: string; userId: string; content: Record<string, unknown>; version: number }
  | { type: 'COMMENT_CREATED'; diagramId: string; comment: CommentData }
  | { type: 'COMMENT_RESOLVED'; diagramId: string; commentId: number; resolved: boolean }
  | { type: 'COMMENT_DELETED'; diagramId: string; commentId: number }
  | { type: 'PRESENCE_UPDATE'; diagramId: string; users: CollaboratorInfo[] }
  | { type: 'ERROR'; message: string; code?: string }
  | { type: 'PONG' };

// ==================== COMMENT TYPES ====================

export interface CommentData {
  id: number;
  diagramId: string;
  userId: string;
  userName: string | null;
  userEmail: string | null;
  userImageUrl: string | null;
  parentId: number | null;
  content: string;
  x: number;
  y: number;
  resolved: boolean;
  createdAt: string;
  updatedAt: string;
}

// ==================== CONNECTION STATES ====================

export type ConnectionState = 'connecting' | 'connected' | 'disconnected' | 'reconnecting' | 'error';

// ==================== COLLABORATION STATE ====================

export interface CollaborationState {
  connectionState: ConnectionState;
  diagramId: string | null;
  currentUser: CollaboratorInfo | null;
  activeUsers: CollaboratorInfo[];
  cursors: Map<string, CursorPosition>;
  comments: CommentData[];
  canEdit: boolean;
  isOwner: boolean;
}

// ==================== USER COLORS ====================

export const USER_COLORS = [
  '#ef4444', // red
  '#f97316', // orange
  '#f59e0b', // amber
  '#84cc16', // lime
  '#22c55e', // green
  '#14b8a6', // teal
  '#06b6d4', // cyan
  '#3b82f6', // blue
  '#6366f1', // indigo
  '#8b5cf6', // violet
  '#a855f7', // purple
  '#d946ef', // fuchsia
  '#ec4899', // pink
  '#f43f5e', // rose
];

export function getUserColor(userId: string): string {
  // Generate consistent color based on userId
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = userId.charCodeAt(i) + ((hash << 5) - hash);
  }
  return USER_COLORS[Math.abs(hash) % USER_COLORS.length];
}

