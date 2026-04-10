/**
 * This file is part of the SchemaVis project.
 * Copyright (C) 2025 Akshat Kotpalliwar (IntegerAlex)
 * Licensed under the GNU Affero General Public License v3.0 or later.
 */

import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { competitors } from '@/lib/comparison/competitors';
import { CompetitorLogo } from '@/components/comparison/competitor-logo';

export const metadata: Metadata = {
  title: 'SchemaVis vs Top Database Visualization Tools (2026)',
  description:
    "Honest comparison of SchemaVis (alpha) against established tools like DrawSQL, dbdiagram.io, and others. We're building something new - see where we stand today and our vision for tomorrow.",
  openGraph: {
    title: 'SchemaVis vs Top Database Visualization Tools (2026)',
    description:
      "Honest comparison of SchemaVis (alpha) against established tools. We're building something new - see where we stand today.",
    type: 'website',
    url: 'https://schemavis.gossorg.in/alternatives',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'SchemaVis vs Top Database Visualization Tools (2026)',
    description:
      "Honest comparison of SchemaVis (alpha) against established tools. We're building something new.",
  },
};

export default function AlternativesPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="max-w-6xl mx-auto px-6 py-12">
        <Button
          asChild
          variant="ghost"
          className="mb-8 text-slate-400 hover:text-white"
        >
          <Link href="/">
            <ArrowLeft className="size-4 mr-2" />
            Back to Home
          </Link>
        </Button>

        <div className="space-y-12">
          <header className="space-y-4">
            <h1 className="text-4xl font-bold">
              SchemaVis vs Top Database Visualization Tools (2026)
            </h1>
            <p className="text-lg text-slate-300 max-w-3xl">
              Honest comparison of SchemaVis (alpha) against established tools
              like DrawSQL, dbdiagram.io, and others. We're building something
              new - see where we stand today and our vision for tomorrow. This
              comparison focuses exclusively on visualization capabilities, not
              SQL editing features.
            </p>
          </header>

          <section className="space-y-6 rounded-lg border border-white/10 bg-white/5 p-6">
            <h2 className="text-2xl font-semibold text-white">
              Honest Assessment
            </h2>
            <p className="text-slate-300">
              We're transparent: SchemaVis is in alpha and not yet
              production-ready for mission-critical work. But we're building
              something different - focused on modern visualization with
              planned collaboration features. We'd love your feedback as we
              grow.
            </p>
            <p className="text-slate-300">
              Each tool has its strengths. DrawSQL and ChartDB excel at visual
              quality. dbdiagram.io offers a unique DSL approach. Azimutt
              provides open source collaboration. We respect all of these tools
              and their contributions to the database visualization space.
            </p>
          </section>

          <section className="space-y-6">
            <h2 className="text-2xl font-semibold text-white">
              Detailed Comparisons
            </h2>
            <p className="text-slate-300">
              Want to dive deeper? Check out our detailed comparisons with each
              tool:
            </p>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {competitors.map((competitor) => (
                <Link
                  key={competitor.id}
                  href={`/${competitor.id}-vs-schemavis`}
                  className="group rounded-lg border border-white/10 bg-white/5 p-6 transition-all hover:border-white/20 hover:bg-white/10"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <CompetitorLogo
                      name={competitor.name}
                      website={competitor.website}
                      logoUrl={competitor.logoUrl}
                      size="md"
                    />
                    <h3 className="text-lg font-semibold text-white group-hover:text-blue-400 transition-colors">
                      {competitor.name} vs SchemaVis
                    </h3>
                  </div>
                  <p className="text-sm text-slate-400 mb-3">
                    {competitor.description}
                  </p>
                  <div className="flex items-center gap-2 text-sm text-blue-400">
                    <span>Read comparison</span>
                    <ExternalLink className="size-4" />
                  </div>
                </Link>
              ))}
            </div>
          </section>

          <section className="flex flex-col sm:flex-row gap-4">
            <Button asChild size="lg" className="flex-1">
              <Link href="/app">Try SchemaVis Free</Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="flex-1">
              <Link href="/contact">Share Your Feedback</Link>
            </Button>
          </section>

          <section className="rounded-lg border border-white/10 bg-white/5 p-6">
            <h3 className="mb-2 text-sm font-semibold text-slate-400">
              Disclaimer
            </h3>
            <p className="text-xs text-slate-500">
              All product names, logos, and trademarks mentioned on this page
              are the property of their respective owners. SchemaVis is not
              affiliated with, endorsed by, or sponsored by any of the
              companies or projects listed here. The information presented is
              based on publicly available data at the time of writing and may
              not reflect the latest features or pricing of these tools. We
              encourage you to visit each tool's official website for the most
              current and accurate information. If you believe any information
              on this page is inaccurate, please{' '}
              <Link href="/contact" className="text-blue-400 hover:text-blue-300 underline">
                contact us
              </Link>{' '}
              so we can correct it.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}

