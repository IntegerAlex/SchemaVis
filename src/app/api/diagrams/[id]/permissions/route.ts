/**
 * This file is part of the SchemaVis project.
 * Copyright (C) 2025 Akshat Kotpalliwar (IntegerAlex)
 * Licensed under the GNU Affero General Public License v3.0 or later.
 */
import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import {
  getDiagramById,
  addPermission,
  removePermission,
  listPermissions,
  checkPermission,
  findUserByEmail,
  findUserByUsername,
} from '@/lib/repositories/diagrams';

const addPermissionSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  role: z.enum(['editor', 'viewer']),
});

const updatePermissionSchema = z.object({
  userId: z.string(),
  role: z.enum(['editor', 'viewer']),
});

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id: diagramId } = await params;

  // Check if diagram exists in database
  const diagram = await getDiagramById(diagramId);

  // If diagram doesn't exist, return empty permissions
  if (!diagram) {
    return NextResponse.json({ permissions: [] });
  }

  // Only owner can see full permissions list
  const isOwner = await checkPermission(diagramId, userId, 'owner');
  if (!isOwner) {
    return NextResponse.json({ error: 'Only owner can view permissions' }, { status: 403 });
  }

  const permissions = await listPermissions(diagramId);
  return NextResponse.json({ permissions });
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id: diagramId } = await params;

  // Check if diagram exists in database
  const diagram = await getDiagramById(diagramId);

  // If diagram doesn't exist, return success but operation won't persist
  if (!diagram) {
    return NextResponse.json(
      { error: 'Diagram not found' },
      { status: 404 }
    );
  }

  // Only owner can add permissions
  const isOwner = await checkPermission(diagramId, userId, 'owner');
  if (!isOwner) {
    return NextResponse.json({ error: 'Only owner can add permissions' }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  const parsed = addPermissionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid request', details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  // Find user by username
  const targetUser = await findUserByUsername(parsed.data.username);
  if (!targetUser) {
    return NextResponse.json(
      { error: 'User not found. They need to sign up and set a username first.' },
      { status: 404 }
    );
  }

  // Check if trying to add self
  if (targetUser.id === userId) {
    return NextResponse.json(
      { error: 'Cannot change your own permissions' },
      { status: 400 }
    );
  }

  const permission = await addPermission(diagramId, targetUser.id, parsed.data.role);
  if (!permission) {
    return NextResponse.json({ error: 'Failed to add permission' }, { status: 500 });
  }

  return NextResponse.json({
    permission: {
      ...permission,
      userName: targetUser.name,
      userEmail: targetUser.email,
      userUsername: targetUser.username,
      userImageUrl: targetUser.imageUrl,
    },
  }, { status: 201 });
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id: diagramId } = await params;

  // Check if diagram exists in database
  const diagram = await getDiagramById(diagramId);

  // If diagram doesn't exist, return error
  if (!diagram) {
    return NextResponse.json(
      { error: 'Diagram not found' },
      { status: 404 }
    );
  }

  // Only owner can update permissions
  const isOwner = await checkPermission(diagramId, userId, 'owner');
  if (!isOwner) {
    return NextResponse.json({ error: 'Only owner can update permissions' }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  const parsed = updatePermissionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid request', details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  // Check if trying to change own permissions
  if (parsed.data.userId === userId) {
    return NextResponse.json(
      { error: 'Cannot change your own permissions' },
      { status: 400 }
    );
  }

  const permission = await addPermission(diagramId, parsed.data.userId, parsed.data.role);
  if (!permission) {
    return NextResponse.json({ error: 'Failed to update permission' }, { status: 500 });
  }

  return NextResponse.json({ permission });
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id: diagramId } = await params;

  // Check if diagram exists in database
  const diagram = await getDiagramById(diagramId);

  // If diagram doesn't exist, return error
  if (!diagram) {
    return NextResponse.json(
      { error: 'Diagram not found' },
      { status: 404 }
    );
  }

  // Only owner can remove permissions
  const isOwner = await checkPermission(diagramId, userId, 'owner');
  if (!isOwner) {
    return NextResponse.json({ error: 'Only owner can remove permissions' }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const targetUserId = searchParams.get('userId');
  if (!targetUserId) {
    return NextResponse.json({ error: 'userId is required' }, { status: 400 });
  }

  // Check if trying to remove own permissions
  if (targetUserId === userId) {
    return NextResponse.json(
      { error: 'Cannot remove your own permissions' },
      { status: 400 }
    );
  }

  const removed = await removePermission(diagramId, targetUserId);
  if (!removed) {
    return NextResponse.json({ error: 'Permission not found' }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}

