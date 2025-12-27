/**
 * This file is part of the SchemaVis project.
 * Copyright (C) 2025 Akshat Kotpalliwar (IntegerAlex)
 * Licensed under the GNU Affero General Public License v3.0 or later.
 */

'use client';

import { AlertTriangle } from 'lucide-react';

export function AlphaBanner() {
  return (
    <div className="mb-8 rounded-lg border border-amber-500/30 bg-amber-500/10 p-4">
      <div className="flex items-start gap-3">
        <AlertTriangle className="mt-0.5 size-5 shrink-0 text-amber-400" />
        <div className="flex-1">
          <h3 className="mb-1 text-sm font-semibold text-amber-300">
            Alpha Software Notice
          </h3>
          <p className="text-sm text-amber-200/80">
            SchemaVis is currently in alpha stage and not yet production-ready
            for mission-critical work. We're building something different and
            would love your feedback as we grow.
          </p>
        </div>
      </div>
    </div>
  );
}

