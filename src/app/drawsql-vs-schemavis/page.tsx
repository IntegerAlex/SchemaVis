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

const competitor = getCompetitorById('drawsql')!;

export const metadata: Metadata = {
  title: 'DrawSQL vs SchemaVis: Honest Comparison for Database Visualization',
  description:
    'Honest comparison of DrawSQL and SchemaVis (alpha) for database visualization. DrawSQL is the market leader with excellent visuals. SchemaVis is building something different with open source collaboration.',
  openGraph: {
    title: 'DrawSQL vs SchemaVis: Honest Comparison',
    description:
      'Compare DrawSQL and SchemaVis for database visualization. See where each tool excels and which is right for you.',
    type: 'website',
    url: 'https://schemavis.gossorg.in/drawsql-vs-schemavis',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'DrawSQL vs SchemaVis: Honest Comparison',
    description:
      'Compare DrawSQL and SchemaVis for database visualization.',
  },
};

export default function DrawSQLComparisonPage() {
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
                  DrawSQL vs SchemaVis: Honest Comparison
                </h1>
                <p className="text-slate-400 mt-2">
                  Database Visualization Tools
                </p>
              </div>
            </div>
            <p className="text-lg text-slate-300">
              We respect DrawSQL as the market leader in database visualization.
              DrawSQL offers real-time collaboration in its Pro version and has
              a free tier (limited to public diagrams). SchemaVis is an
              alpha-stage newcomer focused on a different vision - open source
              collaboration and modern architecture. This comparison focuses
              exclusively on visualization capabilities.
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
              Detailed Feature Breakdown
            </h2>
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-4 rounded-lg border border-white/10 bg-white/5 p-6">
                <div className="flex items-center gap-3 mb-4">
                  <CompetitorLogo
                    name={competitor.name}
                    website={competitor.website}
                    logoUrl={competitor.logoUrl}
                    size="md"
                  />
                  <h3 className="text-xl font-semibold text-white">
                    {competitor.name}
                  </h3>
                </div>
                <div>
                  <h4 className="mb-2 font-semibold text-slate-200">
                    Visual Quality: ★★★★★
                  </h4>
                  <ul className="ml-4 list-disc space-y-1 text-sm text-slate-300">
                    <li>Polished, consistent table node design</li>
                    <li>Clean, readable relationship lines</li>
                    <li>Professional color schemes</li>
                  </ul>
                </div>
                <div>
                  <h4 className="mb-2 font-semibold text-slate-200">
                    User Experience: ★★★★★
                  </h4>
                  <ul className="ml-4 list-disc space-y-1 text-sm text-slate-300">
                    <li>Gentle learning curve</li>
                    <li>Fast, optimized performance</li>
                    <li>Excellent mobile support</li>
                  </ul>
                </div>
                <div>
                  <h4 className="mb-2 font-semibold text-slate-200">
                    Unique Strengths
                  </h4>
                  <ul className="ml-4 list-disc space-y-1 text-sm text-slate-300">
                    {competitor.uniqueStrengths.map((strength, idx) => (
                      <li key={idx}>{strength}</li>
                    ))}
                    <li>Real-time collaboration (Pro version)</li>
                    <li>Free tier available (public diagrams)</li>
                  </ul>
                </div>
              </div>

              <div className="space-y-4 rounded-lg border border-white/10 bg-white/5 p-6">
                <div className="flex items-center gap-3 mb-4">
                  <CompetitorLogo
                    name={schemavisCompetitor.name}
                    website={schemavisCompetitor.website}
                    size="md"
                  />
                  <h3 className="text-xl font-semibold text-white">
                    SchemaVis (Alpha)
                  </h3>
                </div>
                <div>
                  <h4 className="mb-2 font-semibold text-slate-200">
                    Visual Quality: ★★★☆☆
                  </h4>
                  <ul className="ml-4 list-disc space-y-1 text-sm text-slate-300">
                    <li>Good but needs refinement</li>
                    <li>Functional but basic relationship lines</li>
                    <li>Works but not optimized color scheme</li>
                  </ul>
                </div>
                <div>
                  <h4 className="mb-2 font-semibold text-slate-200">
                    User Experience: ★★☆☆☆
                  </h4>
                  <ul className="ml-4 list-disc space-y-1 text-sm text-slate-300">
                    <li>Steeper learning curve (alpha roughness)</li>
                    <li>Can be slow with large diagrams</li>
                    <li>Basic mobile support</li>
                  </ul>
                </div>
                <div>
                  <h4 className="mb-2 font-semibold text-slate-200">
                    Unique Strengths
                  </h4>
                  <ul className="ml-4 list-disc space-y-1 text-sm text-slate-300">
                    <li>Open source (AGPL licensed)</li>
                    <li>Real-time collaboration (planned)</li>
                    <li>Modern React architecture</li>
                    <li>User feedback shapes development</li>
                  </ul>
                </div>
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
              As an early user, your feedback directly shapes our development
              priorities. Help us build the visualization tool you need by
              sharing your thoughts and suggestions.
            </p>
            <Button asChild variant="outline" className="mt-4" size="sm">
              <Link href="/contact">Share Feedback</Link>
            </Button>
          </section>

          <ComparisonDisclaimer competitorName="DrawSQL" />
        </div>
      </div>
    </div>
  );
}

