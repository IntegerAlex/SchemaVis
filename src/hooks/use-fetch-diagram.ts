/**
 * This file is part of the SchemaVis project.
 * Copyright (C) 2025 Akshat Kotpalliwar (IntegerAlex)
 * Licensed under the GNU Affero General Public License v3.0 or later.
 */
'use client';

import { useQuery } from '@tanstack/react-query';
import type { Diagram } from '@/lib/domain/diagram';
import { dbDiagramToDomain } from '@/lib/domain/diagram-mapper';

export interface FetchDiagramResponse {
  diagram: {
    id: string;
    ownerId: string;
    name: string;
    databaseType: string;
    content: Record<string, unknown>;
    version: number;
    createdAt: string;
    updatedAt: string;
  };
  role?: string;
  canEdit?: boolean;
  isOwner?: boolean;
}

export function useFetchDiagram(diagramId: string | null) {
  return useQuery({
    queryKey: ['diagram', diagramId],
    queryFn: async (): Promise<{ diagram: Diagram; version: number }> => {
      if (!diagramId) throw new Error('No diagram ID');
      const response = await fetch(`/api/diagrams/${diagramId}`);
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Failed to fetch diagram');
      }
      const data: FetchDiagramResponse = await response.json();
      const domainDiagram = dbDiagramToDomain(data.diagram as Parameters<typeof dbDiagramToDomain>[0]);
      return { diagram: domainDiagram, version: data.diagram.version };
    },
    enabled: !!diagramId,
  });
}
