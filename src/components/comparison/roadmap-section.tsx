/**
 * This file is part of the SchemaVis project.
 * Copyright (C) 2025 Akshat Kotpalliwar (IntegerAlex)
 * Licensed under the GNU Affero General Public License v3.0 or later.
 */

'use client';

import { Rocket } from 'lucide-react';

export function RoadmapSection() {
  return (
    <section className="space-y-6 rounded-lg border border-purple-500/30 bg-purple-500/10 p-6">
      <div className="flex items-center gap-2">
        <Rocket className="size-5 text-purple-400" />
        <h2 className="text-2xl font-semibold text-white">Our Roadmap</h2>
      </div>

      <div className="space-y-4">
        <div>
          <h3 className="mb-2 text-lg font-semibold text-purple-300">
            Coming Soon
          </h3>
          <ul className="ml-6 list-disc space-y-2 text-slate-300">
            <li>
              <strong>Real-time Collaboration:</strong> Work together with your
              team in real-time on database diagrams
            </li>
            <li>
              <strong>Visual Quality Improvements:</strong> Refined table node
              design, better relationship lines, and professional color schemes
            </li>
            <li>
              <strong>Performance Optimization:</strong> Faster rendering for
              large diagrams
            </li>
            <li>
              <strong>Enhanced Mobile Support:</strong> Better experience on
              mobile devices
            </li>
            <li>
              <strong>Advanced Layout Options:</strong> More control over
              diagram layout and styling
            </li>
          </ul>
        </div>

        <div className="rounded-lg border border-purple-500/30 bg-purple-500/5 p-4">
          <p className="text-sm text-purple-200">
            <strong className="text-purple-100">Your Feedback Matters:</strong>{' '}
            As an alpha user, your feedback directly shapes our development
            priorities. Help us build the visualization tool you need by sharing
            your thoughts and suggestions.
          </p>
        </div>
      </div>
    </section>
  );
}

