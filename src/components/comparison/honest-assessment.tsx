/**
 * This file is part of the SchemaVis project.
 * Copyright (C) 2025 Akshat Kotpalliwar (IntegerAlex)
 * Licensed under the GNU Affero General Public License v3.0 or later.
 */

'use client';

import type { Competitor } from '@/lib/comparison/types';

interface HonestAssessmentProps {
  competitor: Competitor;
}

export function HonestAssessment({ competitor }: HonestAssessmentProps) {
  return (
    <section className="space-y-6 rounded-lg border border-white/10 bg-white/5 p-6">
      <h2 className="text-2xl font-semibold text-white">
        Honest Assessment
      </h2>

      <div className="space-y-4">
        <div>
          <h3 className="mb-2 text-lg font-semibold text-white">
            SchemaVis Limitations
          </h3>
          <ul className="ml-6 list-disc space-y-2 text-slate-300">
            <li>
              SchemaVis is in alpha and not yet production-ready for
              mission-critical work
            </li>
            <li>
              Visual quality needs refinement compared to established tools
            </li>
            <li>
              Performance can be slow with large diagrams (we're working on
              this)
            </li>
            <li>Mobile support is basic and needs improvement</li>
            <li>
              Learning curve is steeper due to alpha-stage roughness
            </li>
          </ul>
        </div>

        <div>
          <h3 className="mb-2 text-lg font-semibold text-white">
            {competitor.name} Strengths
          </h3>
          <ul className="ml-6 list-disc space-y-2 text-slate-300">
            {competitor.strengths.map((strength, idx) => (
              <li key={idx}>{strength}</li>
            ))}
          </ul>
        </div>

        <div className="rounded-lg border border-blue-500/30 bg-blue-500/10 p-4">
          <p className="text-sm text-blue-200">
            <strong className="text-blue-100">Our Vision:</strong> We're not
            trying to compete directly with {competitor.name} today. Instead,
            we're building toward something different - a truly collaborative,
            open source visualization tool that puts user feedback at the
            center. If you're patient and want to help shape the future, we'd
            love to have you as an early user.
          </p>
        </div>
      </div>
    </section>
  );
}

