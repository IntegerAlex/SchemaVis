/**
 * This file is part of the SchemaVis project.
 * Copyright (C) 2025 Akshat Kotpalliwar (IntegerAlex)
 * Licensed under the GNU Affero General Public License v3.0 or later.
 */

'use client';

import { Check, X } from 'lucide-react';
import type { Competitor } from '@/lib/comparison/types';
import { CompetitorLogo } from './competitor-logo';

interface ComparisonTableProps {
  schemavis: Competitor;
  competitor: Competitor;
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <span
          key={star}
          className={`text-sm ${
            star <= rating ? 'text-yellow-400' : 'text-slate-600'
          }`}
        >
          ★
        </span>
      ))}
      <span className="ml-1 text-xs text-slate-400">({rating}/5)</span>
    </div>
  );
}

function FeatureCell({
  schemavis,
  competitor,
}: {
  schemavis: string | number | boolean;
  competitor: string | number | boolean;
}) {
  const renderValue = (value: string | number | boolean) => {
    if (typeof value === 'boolean') {
      return value ? (
        <Check className="size-5 text-green-400" />
      ) : (
        <X className="size-5 text-red-400" />
      );
    }
    if (typeof value === 'number') {
      return <StarRating rating={value} />;
    }
    return <span className="text-slate-300">{value}</span>;
  };

  return (
    <>
      <td className="border-b border-white/10 px-4 py-3 text-center">
        {renderValue(schemavis)}
      </td>
      <td className="border-b border-white/10 px-4 py-3 text-center">
        {renderValue(competitor)}
      </td>
    </>
  );
}

export function ComparisonTable({
  schemavis,
  competitor,
}: ComparisonTableProps) {
  const features = [
    {
      name: 'Real-time Collaboration',
      schemavis: true, // Planned
      competitor: competitor.collaboration,
      tooltip: 'Work together in real-time on diagrams',
    },
    {
      name: 'Visual Quality',
      schemavis: schemavis.visualQuality,
      competitor: competitor.visualQuality,
      tooltip: 'Overall visual polish and design quality',
    },
    {
      name: 'Relationship Display',
      schemavis: schemavis.relationshipDisplay,
      competitor: competitor.relationshipDisplay,
      tooltip: 'Quality of relationship line rendering',
    },
    {
      name: 'Modern UI/UX',
      schemavis: schemavis.modernUI,
      competitor: competitor.modernUI,
      tooltip: 'Contemporary, intuitive user interface',
    },
    {
      name: 'Free Tier',
      schemavis: schemavis.freeTier,
      competitor: competitor.freeTier,
      tooltip: 'Free version available',
    },
    {
      name: 'Open Source',
      schemavis: schemavis.openSource,
      competitor: competitor.openSource,
      tooltip: 'Source code available under open source license',
    },
    {
      name: 'Pricing',
      schemavis: schemavis.pricing,
      competitor: competitor.pricing,
      tooltip: 'Cost structure',
    },
  ];

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b border-white/20">
            <th className="px-4 py-3 text-left text-sm font-semibold text-white">
              Feature
            </th>
            <th className="px-4 py-3 text-center text-sm font-semibold text-white">
              <div className="flex items-center justify-center gap-2">
                <CompetitorLogo
                  name={schemavis.name}
                  website={schemavis.website}
                  size="sm"
                />
                <span>SchemaVis (Alpha)</span>
              </div>
            </th>
            <th className="px-4 py-3 text-center text-sm font-semibold text-white">
              <div className="flex items-center justify-center gap-2">
                <CompetitorLogo
                  name={competitor.name}
                  website={competitor.website}
                  logoUrl={competitor.logoUrl}
                  size="sm"
                />
                <span>{competitor.name}</span>
              </div>
            </th>
          </tr>
        </thead>
        <tbody>
          {features.map((feature, idx) => (
            <tr
              key={idx}
              className="hover:bg-white/5 transition-colors"
              title={feature.tooltip}
            >
              <td className="border-b border-white/10 px-4 py-3 text-sm font-medium text-slate-300">
                {feature.name}
              </td>
              <FeatureCell
                schemavis={feature.schemavis}
                competitor={feature.competitor}
              />
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

