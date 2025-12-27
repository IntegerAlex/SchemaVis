/**
 * This file is part of the SchemaVis project.
 * Copyright (C) 2025 Akshat Kotpalliwar (IntegerAlex)
 * Licensed under the GNU Affero General Public License v3.0 or later.
 */

'use client';

import Image from 'next/image';
import { useState } from 'react';

interface CompetitorLogoProps {
  name: string;
  logoUrl?: string;
  website: string;
  size?: 'sm' | 'md' | 'lg';
}

export function CompetitorLogo({
  name,
  logoUrl,
  website,
  size = 'md',
}: CompetitorLogoProps) {
  const [imageError, setImageError] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);

  const sizeClasses = {
    sm: 'h-6 w-6',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
  };

  if (!logoUrl || imageError) {
    return (
      <div
        className={`${sizeClasses[size]} flex items-center justify-center rounded bg-slate-700 text-xs font-semibold text-white`}
        title={name}
      >
        {name.charAt(0).toUpperCase()}
      </div>
    );
  }

  return (
    <div className={`${sizeClasses[size]} relative shrink-0`}>
      {imageLoading && (
        <div className="absolute inset-0 animate-pulse rounded bg-slate-700" />
      )}
      <Image
        src={logoUrl}
        alt={`${name} logo`}
        fill
        className="object-contain"
        onError={() => {
          setImageError(true);
          setImageLoading(false);
        }}
        onLoad={() => setImageLoading(false)}
        unoptimized
      />
    </div>
  );
}

