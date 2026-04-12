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

const competitor = getCompetitorById('schemaspy')!;

export const metadata: Metadata = {
  title: 'SchemaSpy vs SchemaVis: Honest Comparison for Database Visualization',
  description:
    'Compare SchemaSpy and SchemaVis (alpha) for database visualization. SchemaSpy is a command-line documentation tool, while SchemaVis is web-based and interactive.',
  openGraph: {
    title: 'SchemaSpy vs SchemaVis: Honest Comparison',
    description:
      'Compare SchemaSpy and SchemaVis for database visualization.',
    type: 'website',
    url: 'https://schemavis.gossorg.in/schemaspy-vs-schemavis',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'SchemaSpy vs SchemaVis: Honest Comparison',
    description: 'Compare SchemaSpy and SchemaVis for database visualization.',
  },
};

export default function SchemaSpyComparisonPage() {
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
                  SchemaSpy vs SchemaVis: Honest Comparison
                </h1>
                <p className="text-slate-400 mt-2">
                  Database Visualization Tools
                </p>
              </div>
            </div>
            <p className="text-lg text-slate-300">
              SchemaSpy is a command-line tool that generates HTML documentation
              from database schemas. SchemaVis is a web-based, interactive
              visualization tool. This comparison focuses exclusively on
              visualization capabilities.
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
              Command-Line vs Web-Based
            </h2>
            <div className="grid gap-6 md:grid-cols-2">
              <div className="rounded-lg border border-white/10 bg-white/5 p-6">
                <h3 className="mb-3 text-lg font-semibold text-white">
                  SchemaSpy
                </h3>
                <ul className="ml-4 list-disc space-y-2 text-slate-300">
                  <li>Command-line tool</li>
                  <li>Generates static HTML documentation</li>
                  <li>Comprehensive schema analysis</li>
                  <li>Basic visual quality</li>
                  <li>No interactive editing</li>
                  <li>Free and open source</li>
                </ul>
              </div>
              <div className="rounded-lg border border-white/10 bg-white/5 p-6">
                <h3 className="mb-3 text-lg font-semibold text-white">
                  SchemaVis
                </h3>
                <ul className="ml-4 list-disc space-y-2 text-slate-300">
                  <li>Web-based interactive tool</li>
                  <li>Real-time visualization</li>
                  <li>Planned collaboration features</li>
                  <li>Good visual quality (improving)</li>
                  <li>Interactive diagram editing</li>
                  <li>Open source with modern architecture</li>
                </ul>
              </div>
            </div>
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

          <ComparisonDisclaimer competitorName="SchemaSpy" />
        </div>
      </div>
    </div>
  );
}

