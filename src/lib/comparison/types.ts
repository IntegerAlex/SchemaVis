/**
 * This file is part of the SchemaVis project.
 * Copyright (C) 2025 Akshat Kotpalliwar (IntegerAlex)
 * Licensed under the GNU Affero General Public License v3.0 or later.
 */

export interface Competitor {
  id: string;
  name: string;
  website: string;
  logoUrl?: string;
  description: string;
  strengths: string[];
  weaknesses: string[];
  pricing: string;
  openSource: boolean;
  collaboration: boolean;
  visualQuality: number; // 1-5
  relationshipDisplay: 'Basic' | 'Fair' | 'Good' | 'Very Good' | 'Excellent';
  modernUI: boolean;
  freeTier: boolean;
  databaseSupport: string[];
  uniqueStrengths: string[];
  bestFor: string[];
}

export interface ComparisonFeature {
  name: string;
  schemavis: string | number | boolean;
  competitor: string | number | boolean;
  tooltip?: string;
}

export interface WhenToChoose {
  schemavis: string[];
  competitor: string[];
}

export interface HonestAssessment {
  limitations: string[];
  competitorStrengths: string[];
  vision: string;
}

