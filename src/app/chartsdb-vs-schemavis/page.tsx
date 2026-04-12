/**
 * This file is part of the SchemaVis project.
 * Copyright (C) 2025 Akshat Kotpalliwar (IntegerAlex)
 * Licensed under the GNU Affero General Public License v3.0 or later.
 */

import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getCompetitorById, schemavisCompetitor } from '@/lib/comparison/competitors';
import { AlphaBanner } from '@/components/comparison/alpha-banner';
import { ComparisonTable } from '@/components/comparison/comparison-table';
import { HonestAssessment } from '@/components/comparison/honest-assessment';
import { WhenToChoose } from '@/components/comparison/when-to-choose';
import { RoadmapSection } from '@/components/comparison/roadmap-section';
import { CompetitorLogo } from '@/components/comparison/competitor-logo';
import { ComparisonDisclaimer } from '@/components/comparison/comparison-disclaimer';

const competitor = getCompetitorById('chartsdb')!;

export const metadata: Metadata = {
  title: 'ChartDB vs SchemaVis: Honest Comparison for Database Visualization',
  description:
    'Compare ChartDB and SchemaVis (alpha) - both open source database visualization tools with excellent visuals. ChartDB is PostgreSQL-focused, while SchemaVis supports multiple databases.',
  openGraph: {
    title: 'ChartDB vs SchemaVis: Honest Comparison',
    description:
      'Compare ChartDB and SchemaVis - both open source with excellent visuals.',
    type: 'website',
    url: 'https://schemavis.gossorg.in/chartsdb-vs-schemavis',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ChartDB vs SchemaVis: Honest Comparison',
    description: 'Compare ChartDB and SchemaVis - both open source with excellent visuals.',
  },
};

export default function ChartsDBComparisonPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="max-w-4xl mx-auto px-6 py-12">
        <Button
          asChild
          variant="ghost"
          className="mb-8 text-slate-400 hover:text-white"
        >
          <Link href="/alternatives">
            <ArrowLeft className="size-4 mr-2" />
            Back to Alternatives
          </Link>
        </Button>

        <div className="space-y-12">
          <AlphaBanner />

          <header className="space-y-4">
            <div className="flex items-center gap-4">
              <CompetitorLogo
                name={competitor.name}
                website={competitor.website}
                logoUrl={competitor.logoUrl}
                size="lg"
              />
              <div>
                <h1 className="text-4xl font-bold">
                  ChartDB vs SchemaVis: Honest Comparison
                </h1>
                <p className="text-slate-400 mt-2">
                  Open Source Database Visualization Tools
                </p>
              </div>
            </div>
            <p className="text-lg text-slate-300">
              We acknowledge ChartDB's superior visualization quality. Both
              ChartDB and SchemaVis are open source tools with excellent visual
              output. ChartDB is PostgreSQL-focused, while SchemaVis supports
              multiple databases and is building toward planned collaboration
              features. This comparison focuses exclusively on visualization
              capabilities.
            </p>
          </header>

          <section className="space-y-6">
            <h2 className="text-2xl font-semibold text-white">
              Visual Comparison
            </h2>
            <div className="overflow-x-auto rounded-lg border border-white/10 bg-white/5 p-6">
              <ComparisonTable
                schemavis={schemavisCompetitor}
                competitor={competitor}
              />
            </div>
          </section>

          <section className="space-y-6">
            <h2 className="text-2xl font-semibold text-white">
              Key Differences
            </h2>
            <div className="grid gap-6 md:grid-cols-2">
              <div className="rounded-lg border border-white/10 bg-white/5 p-6">
                <h3 className="mb-3 text-lg font-semibold text-white">
                  ChartDB
                </h3>
                <ul className="ml-4 list-disc space-y-2 text-slate-300">
                  <li>Excellent visual quality</li>
                  <li>PostgreSQL-focused (limited multi-database)</li>
                  <li>Open source (AGPL)</li>
                  <li>Modern architecture</li>
                  <li>No real-time collaboration</li>
                  <li>More mature than SchemaVis</li>
                </ul>
              </div>
              <div className="rounded-lg border border-white/10 bg-white/5 p-6">
                <h3 className="mb-3 text-lg font-semibold text-white">
                  SchemaVis
                </h3>
                <ul className="ml-4 list-disc space-y-2 text-slate-300">
                  <li>Good visual quality (improving)</li>
                  <li>Multi-database support</li>
                  <li>Open source (AGPL)</li>
                  <li>Modern React architecture</li>
                  <li>Planned real-time collaboration</li>
                  <li>Alpha stage - user feedback shapes development</li>
                </ul>
              </div>
            </div>
          </section>

          <section className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-6">
            <h3 className="mb-2 text-lg font-semibold text-amber-300">
              Honest Acknowledgment
            </h3>
            <p className="text-sm text-amber-200">
              ChartDB has excellent visualization quality that we respect and
              learn from. SchemaVis is building toward similar visual excellence
              while adding planned collaboration features and multi-database
              support. If you need production-ready visuals today, ChartDB is
              an excellent choice. If you want to help shape the future of
              collaborative visualization, we'd love to have you as an early
              SchemaVis user.
            </p>
          </section>

          <WhenToChoose competitor={competitor} />

          <HonestAssessment competitor={competitor} />

          <RoadmapSection />

          <section className="space-y-6">
            <h2 className="text-2xl font-semibold text-white">
              Try Both Tools
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <Button asChild size="lg" variant="outline" className="w-full">
                <a
                  href={competitor.website}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Try {competitor.name}
                  <ExternalLink className="ml-2 size-4" />
                </a>
              </Button>
              <Button asChild size="lg" className="w-full">
                <Link href="/app">Try SchemaVis Free</Link>
              </Button>
            </div>
          </section>

          <section className="rounded-lg border border-blue-500/30 bg-blue-500/10 p-6">
            <h3 className="mb-2 text-lg font-semibold text-blue-300">
              We'd Love Your Feedback
            </h3>
            <p className="text-sm text-blue-200">
              Help us build the visualization tool you need by sharing your
              thoughts and suggestions.
            </p>
            <Button asChild variant="outline" className="mt-4" size="sm">
              <Link href="/contact">Share Feedback</Link>
            </Button>
          </section>

          <ComparisonDisclaimer competitorName="ChartDB" />
        </div>
      </div>
    </div>
  );
}

