/**
 * This file is part of the SchemaVis project.
 * Copyright (C) 2025 Akshat Kotpalliwar (IntegerAlex)
 * Licensed under the GNU Affero General Public License v3.0 or later.
 */

'use client';

import Link from 'next/link';

interface ComparisonDisclaimerProps {
  competitorName: string;
}

export function ComparisonDisclaimer({ competitorName }: ComparisonDisclaimerProps) {
  return (
    <section className="rounded-lg border border-white/10 bg-white/5 p-6">
      <h3 className="mb-2 text-sm font-semibold text-slate-400">
        Disclaimer
      </h3>
      <p className="text-xs text-slate-500">
        {competitorName} is a trademark of its respective owner. SchemaVis is
        not affiliated with, endorsed by, or sponsored by {competitorName} or
        its parent company. The information presented is based on publicly
        available data at the time of writing and may not reflect the latest
        features or pricing. We encourage you to visit each tool's official
        website for the most current information. If you believe any
        information on this page is inaccurate, please{' '}
        <Link href="/contact" className="text-blue-400 hover:text-blue-300 underline">
          contact us
        </Link>{' '}
        so we can correct it.
      </p>
    </section>
  );
}
