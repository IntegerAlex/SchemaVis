'use client';
/**
 * This file is part of the SchemaVis project.
 * Copyright (C) 2025 Akshat Kotpalliwar (IntegerAlex)
 * Licensed under the GNU Affero General Public License v3.0 or later.
 */

import * as React from 'react';
import Image from 'next/image';
import { SignInButton, SignedIn, SignedOut, UserButton } from '@clerk/nextjs';
import { Github, Database, Shield, Zap } from 'lucide-react';
import { ReactFlowProvider } from '@xyflow/react';
import { ChartCanvas } from './chart-canvas';
import type { Diagram } from '@/lib/domain/diagram';
import { DatabaseType } from '@/lib/domain/database-type';

interface LandingPageProps {
  onGetStarted: () => void;
}

const previewDiagram: Diagram = {
  id: 'preview-diagram',
  name: 'Preview',
  databaseType: DatabaseType.POSTGRESQL,
  createdAt: new Date(),
  updatedAt: new Date(),
  tables: [
    {
      id: 'users',
      name: 'users',
      schema: 'public',
      x: 200,
      y: 80,
      fields: [
        {
          id: 'user_id',
          name: 'id',
          type: { id: 'uuid', name: 'uuid' },
          primaryKey: true,
          unique: true,
          nullable: false,
          createdAt: Date.now(),
          default: 'gen_random_uuid()',
        },
        {
          id: 'user_email',
          name: 'email',
          type: { id: 'text', name: 'text' },
          primaryKey: false,
          unique: true,
          nullable: false,
          createdAt: Date.now(),
        },
        {
          id: 'user_created_at',
          name: 'created_at',
          type: { id: 'timestamptz', name: 'timestamptz' },
          primaryKey: false,
          unique: false,
          nullable: false,
          createdAt: Date.now(),
          default: 'now()',
        },
      ],
      indexes: [],
      color: '#0f172a',
      isView: false,
      createdAt: Date.now(),
    },
    {
      id: 'orders',
      name: 'orders',
      schema: 'public',
      x: 520,
      y: 200,
      fields: [
        {
          id: 'order_id',
          name: 'id',
          type: { id: 'uuid', name: 'uuid' },
          primaryKey: true,
          unique: true,
          nullable: false,
          createdAt: Date.now(),
          default: 'gen_random_uuid()',
        },
        {
          id: 'order_user_id',
          name: 'user_id',
          type: { id: 'uuid', name: 'uuid' },
          primaryKey: false,
          unique: false,
          nullable: false,
          createdAt: Date.now(),
        },
        {
          id: 'order_product_id',
          name: 'product_id',
          type: { id: 'uuid', name: 'uuid' },
          primaryKey: false,
          unique: false,
          nullable: false,
          createdAt: Date.now(),
        },
        {
          id: 'order_total',
          name: 'total',
          type: { id: 'numeric', name: 'numeric' },
          primaryKey: false,
          unique: false,
          nullable: false,
          createdAt: Date.now(),
        },
      ],
      indexes: [],
      color: '#0f172a',
      isView: false,
      createdAt: Date.now(),
    },
    {
      id: 'products',
      name: 'products',
      schema: 'public',
      x: 120,
      y: 360,
      fields: [
        {
          id: 'product_id',
          name: 'id',
          type: { id: 'uuid', name: 'uuid' },
          primaryKey: true,
          unique: true,
          nullable: false,
          createdAt: Date.now(),
          default: 'gen_random_uuid()',
        },
        {
          id: 'product_name',
          name: 'name',
          type: { id: 'text', name: 'text' },
          primaryKey: false,
          unique: false,
          nullable: false,
          createdAt: Date.now(),
        },
        {
          id: 'product_price',
          name: 'price',
          type: { id: 'numeric', name: 'numeric' },
          primaryKey: false,
          unique: false,
          nullable: false,
          createdAt: Date.now(),
        },
      ],
      indexes: [],
      color: '#0f172a',
      isView: false,
      createdAt: Date.now(),
    },
  ],
  relationships: [
    {
      id: 'rel-users-orders',
      name: 'orders_user_id_fkey',
      sourceTableId: 'users',
      targetTableId: 'orders',
      sourceFieldId: 'user_id',
      targetFieldId: 'order_user_id',
      sourceCardinality: 'one',
      targetCardinality: 'many',
      createdAt: Date.now(),
    },
    {
      id: 'rel-products-orders',
      name: 'orders_product_id_fkey',
      sourceTableId: 'products',
      targetTableId: 'orders',
      sourceFieldId: 'product_id',
      targetFieldId: 'order_product_id',
      sourceCardinality: 'one',
      targetCardinality: 'many',
      createdAt: Date.now(),
    },
  ],
};

export function LandingPage({ onGetStarted }: LandingPageProps) {
  return (
    <div className="min-h-screen bg-slate-950 text-white relative overflow-hidden">
      {/* Background accents */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(59,130,246,0.12),transparent_45%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,rgba(147,51,234,0.12),transparent_45%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-size-[64px_64px]" />

      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Header */}
          <header className="px-6 py-5 flex items-center justify-between max-w-7xl mx-auto w-full">
            <Image
              src="/logo.png"
              alt="SchemaVis logo"
              width={240}
              height={240}
              className="h-24 w-24 object-contain scale-150"
              priority
            />

          <div className="flex items-center gap-4">
            <a
              href="https://github.com/IntegerAlex/SchemaVis"
              target="_blank"
              rel="noreferrer"
              className="hidden sm:flex items-center gap-2 text-sm text-slate-300 hover:text-white transition"
            >
              <Github className="h-4 w-4" />
              <span>GitHub</span>
            </a>
            <SignedIn>
              <UserButton afterSignOutUrl="/" />
            </SignedIn>
            <SignedOut>
              <SignInButton mode="modal">
                <button className="text-sm text-slate-300 hover:text-white transition">
                  Sign in
                </button>
              </SignInButton>
            </SignedOut>
          </div>
        </header>

        {/* Main */}
        <main className="flex-1 w-full px-6 pb-16">
          <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            {/* Hero copy */}
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/10 bg-white/5 text-xs text-slate-200 uppercase tracking-wide">
                supports PostgreSQL for now.
              </div>
              <h1 className="text-4xl sm:text-5xl font-bold leading-tight tracking-tight">
                Visualize your schema in seconds.
                <span className="block text-slate-300 text-xl font-normal mt-2">
                  Upload SQL, get an interactive ER view, and keep your scripts tied to your account.
                </span>
              </h1>
              <p className="text-slate-300 text-base sm:text-lg leading-relaxed">
                Built with the same clarity you expect from chartdb: readable nodes, clean handles,
                and a focused workspace.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
                <button
                  onClick={onGetStarted}
                  className="group px-7 py-3 rounded-xl bg-slate-900 border border-blue-400/40 text-white font-semibold transition-all shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 hover:-translate-y-0.5 relative overflow-hidden"
                >
                  <span className="absolute inset-0 bg-linear-to-r from-blue-500/20 via-cyan-400/10 to-blue-600/20 opacity-0 group-hover:opacity-100 transition" />
                  <span className="relative flex items-center justify-center gap-2">
                    <Database className="h-4 w-4 text-cyan-200" />
                    Enter SchemaVis
                  </span>
                </button>
                <SignedOut>
                  {/* <SignInButton mode="modal">
                    <button className="px-7 py-3 rounded-xl border border-white/15 bg-white/5 hover:bg-white/10 text-white font-semibold transition backdrop-blur-sm">
                      Sign in with Clerk
                    </button>
                  </SignInButton> */}
                </SignedOut>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm text-slate-200/90">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4 space-y-1">
                  <div className="flex items-center gap-2 text-white font-semibold">
                    <Zap className="h-4 w-4 text-blue-300" /> Fast import
                  </div>
                  <p className="leading-relaxed">DDL to ER-style view with field-aware handles.</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4 space-y-1">
                  <div className="flex items-center gap-2 text-white font-semibold">
                    <Database className="h-4 w-4 text-indigo-300" /> Saved scripts
                  </div>
                  <p className="leading-relaxed">Uploads stay linked to your account for reuse.</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4 space-y-1">
                  <div className="flex items-center gap-2 text-white font-semibold">
                    <Shield className="h-4 w-4 text-purple-300" /> Open source
                  </div>
                  <p className="leading-relaxed">AGPL v3. Inspect, self-host, or contribute.</p>
                </div>
              </div>
            </div>

            {/* Preview canvas */}
            <div className="w-full">
              <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-2xl p-4">
                <div className="aspect-square rounded-xl overflow-hidden border border-white/10 bg-slate-950/60">
                  <ReactFlowProvider>
                    <ChartCanvas
                      diagram={previewDiagram}
                      showControls={false}
                      showMiniMap={false}
                    />
                  </ReactFlowProvider>
                </div>
              </div>
            </div>
          </div>
        </main>

        <footer className="px-6 pb-10">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-slate-400">
            <div className="flex items-center gap-2">
              <span>SchemaVis · AGPL v3</span>
              <span className="text-slate-600">•</span>
              <a
                className="hover:text-white transition"
                href="https://github.com/IntegerAlex/SchemaVis"
                target="_blank"
                rel="noreferrer"
              >
                GitHub
              </a>
            </div>
            {/* <div className="flex items-center gap-2">
              <span>Auth by Clerk</span>
              <span className="text-slate-600">•</span>
              <span>PostgreSQL-first</span>
            </div> */}
          </div>
        </footer>
      </div>
    </div>
  );
}

