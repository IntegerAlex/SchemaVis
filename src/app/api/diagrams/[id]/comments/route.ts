/**
 * This file is part of the SchemaVis project.
 * Copyright (C) 2025 Akshat Kotpalliwar (IntegerAlex)
 * Licensed under the GNU Affero General Public License v3.0 or later.
 */
import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import {
  createComment,
  listComments,
  updateComment,
  softDeleteComment,
  getCommentById,
  checkPermission,
  getDiagramById,
} from '@/lib/repositories/diagrams';

const createCommentSchema = z.object({
  content: z.string().min(1, 'Comment cannot be empty'),
  x: z.number(),
  y: z.number(),
  parentId: z.number().optional(),
});

const updateCommentSchema = z.object({
  commentId: z.number(),
  content: z.string().min(1).optional(),
  resolved: z.boolean().optional(),
});

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();
  const { id: diagramId } = await params;

  // Check if diagram exists in database
  const diagram = await getDiagramById(diagramId);

  // If diagram doesn't exist, return empty comments
  if (!diagram) {
    return NextResponse.json({ comments: [] });
  }

  // Check view permission
  const hasAccess = await checkPermission(diagramId, userId, 'viewer');
  if (!hasAccess) {
    return NextResponse.json({ error: 'Access denied' }, { status: 403 });
  }

  const comments = await listComments(diagramId);
  return NextResponse.json({ comments });
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

  // If diagram doesn't exist, return error
  if (!diagram) {
    return NextResponse.json(
      { error: 'Diagram not found' },
      { status: 404 }
    );
  }

  // Check view permission (anyone who can view can comment)
  const hasAccess = await checkPermission(diagramId, userId, 'viewer');
  if (!hasAccess) {
    return NextResponse.json({ error: 'Access denied' }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  const parsed = createCommentSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid request', details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const comment = await createComment({
    diagramId,
    userId,
    content: parsed.data.content,
    x: parsed.data.x,
    y: parsed.data.y,
    parentId: parsed.data.parentId,
  });

  return NextResponse.json({ comment }, { status: 201 });
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

  // Check view permission
  const hasAccess = await checkPermission(diagramId, userId, 'viewer');
  if (!hasAccess) {
    return NextResponse.json({ error: 'Access denied' }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  const parsed = updateCommentSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid request', details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  // Get the comment to check ownership
  const existingComment = await getCommentById(parsed.data.commentId);
  if (!existingComment) {
    return NextResponse.json({ error: 'Comment not found' }, { status: 404 });
  }

  // Only comment author or diagram owner can edit content
  if (parsed.data.content !== undefined) {
    const isOwner = await checkPermission(diagramId, userId, 'owner');
    if (existingComment.userId !== userId && !isOwner) {
      return NextResponse.json(
        { error: 'Only comment author or diagram owner can edit content' },
        { status: 403 }
      );
    }
  }

  const updates: { content?: string; resolved?: boolean } = {};
  if (parsed.data.content !== undefined) {
    updates.content = parsed.data.content;
  }
  if (parsed.data.resolved !== undefined) {
    updates.resolved = parsed.data.resolved;
  }

  const updated = await updateComment(parsed.data.commentId, updates);
  if (!updated) {
    return NextResponse.json({ error: 'Failed to update comment' }, { status: 500 });
  }

  return NextResponse.json({ comment: updated });
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

  const { searchParams } = new URL(req.url);
  const commentIdStr = searchParams.get('commentId');
  if (!commentIdStr) {
    return NextResponse.json({ error: 'commentId is required' }, { status: 400 });
  }

  const commentId = parseInt(commentIdStr, 10);
  if (isNaN(commentId)) {
    return NextResponse.json({ error: 'Invalid commentId' }, { status: 400 });
  }

  // Get the comment to check ownership
  const comment = await getCommentById(commentId);
  if (!comment) {
    return NextResponse.json({ error: 'Comment not found' }, { status: 404 });
  }

  // Only comment author or diagram owner can delete
  const isOwner = await checkPermission(diagramId, userId, 'owner');
  if (comment.userId !== userId && !isOwner) {
    return NextResponse.json(
      { error: 'Only comment author or diagram owner can delete' },
      { status: 403 }
    );
  }

  const deleted = await softDeleteComment(commentId);
  if (!deleted) {
    return NextResponse.json({ error: 'Failed to delete comment' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

