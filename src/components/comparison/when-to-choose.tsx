/**
 * This file is part of the SchemaVis project.
 * Copyright (C) 2025 Akshat Kotpalliwar (IntegerAlex)
 * Licensed under the GNU Affero General Public License v3.0 or later.
 */

'use client';

import { Check } from 'lucide-react';
import type { Competitor } from '@/lib/comparison/types';

interface WhenToChooseProps {
  competitor: Competitor;
}

export function WhenToChoose({ competitor }: WhenToChooseProps) {
  return (
    <section className="space-y-6">
      <h2 className="text-2xl font-semibold text-white">When to Choose Each</h2>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-lg border border-green-500/30 bg-green-500/10 p-6">
          <h3 className="mb-4 text-lg font-semibold text-green-300">
            Choose {competitor.name} if:
          </h3>
          <ul className="space-y-2">
            {competitor.bestFor.map((reason, idx) => (
              <li key={idx} className="flex items-start gap-2 text-slate-300">
                <Check className="mt-0.5 size-4 shrink-0 text-green-400" />
                <span>{reason}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-lg border border-blue-500/30 bg-blue-500/10 p-6">
          <h3 className="mb-4 text-lg font-semibold text-blue-300">
            Choose SchemaVis if:
          </h3>
          <ul className="space-y-2">
            {[
              'You value open source software (AGPL licensed)',
              'You want to influence development direction',
              'Real-time team collaboration is important to your workflow',
              "You're comfortable with alpha software and providing feedback",
              'You want to help shape the future of database visualization',
            ].map((reason, idx) => (
              <li key={idx} className="flex items-start gap-2 text-slate-300">
                <Check className="mt-0.5 size-4 shrink-0 text-blue-400" />
                <span>{reason}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

