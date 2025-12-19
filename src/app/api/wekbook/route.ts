/**
 * This file is part of the SchemaVis project.
 * Copyright (C) 2025 Akshat Kotpalliwar (IntegerAlex)
 * Licensed under the GNU Affero General Public License v3.0 or later.
 */
import type { WebhookEvent } from '@clerk/nextjs/server';
import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import { Webhook } from 'svix';
import { ensureUser } from '@/lib/repositories/sql-files';

const webhookSecret = process.env.CLERK_WEBHOOK_SECRET;

export async function POST(req: Request) {
  if (!webhookSecret) {
    return NextResponse.json({ error: 'Missing CLERK_WEBHOOK_SECRET' }, { status: 500 });
  }

  const payload = await req.text();
  const headerList = await headers();
  const svixId = headerList.get('svix-id');
  const svixTimestamp = headerList.get('svix-timestamp');
  const svixSignature = headerList.get('svix-signature');

  if (!svixId || !svixTimestamp || !svixSignature) {
    return NextResponse.json({ error: 'Missing Svix headers' }, { status: 400 });
  }

  const wh = new Webhook(webhookSecret);
  let event: WebhookEvent;

  try {
    event = wh.verify(payload, {
      'svix-id': svixId,
      'svix-timestamp': svixTimestamp,
      'svix-signature': svixSignature,
    }) as WebhookEvent;
  } catch (error) {
    console.error('[clerk-webhook] verification failed', error);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  const { type, data } = event;

  if (type === 'user.created' || type === 'user.updated') {
    const primaryEmail =
      data.email_addresses?.find((email) => email.id === data.primary_email_address_id)
        ?.email_address ?? data.email_addresses?.[0]?.email_address ?? null;

    const fullName =
      (data.username && data.username.trim()) ||
      [data.first_name, data.last_name].filter(Boolean).join(' ').trim() ||
      (data as { full_name?: string }).full_name ||
      null;

    await ensureUser({
      id: data.id,
      email: primaryEmail,
      name: fullName,
      imageUrl: data.image_url ?? null,
      publicMetadata: (data as { public_metadata?: Record<string, unknown> }).public_metadata ?? null,
      privateMetadata: (data as { private_metadata?: Record<string, unknown> }).private_metadata ?? null,
      unsafeMetadata: (data as { unsafe_metadata?: Record<string, unknown> }).unsafe_metadata ?? null,
    });
  }

  return NextResponse.json({ received: type }, { status: 200 });
}

