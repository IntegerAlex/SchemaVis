/**
 * This file is part of the SchemaVis project.
 * Copyright (C) 2025 Akshat Kotpalliwar (IntegerAlex)
 * Licensed under the GNU Affero General Public License v3.0 or later.
 */
'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { domainToDbContent } from '@/lib/domain/diagram-mapper';
import type { Diagram } from '@/lib/domain/diagram';

export interface UpdateDiagramParams {
  diagramId: string;
  content?: Record<string, unknown>;
  version?: number;
  name?: string;
}

export interface UpdateDiagramError {
  message: string;
}

export function useUpdateDiagram() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: UpdateDiagramParams) => {
      const { diagramId, content, version, name } = params;

      const body: Record<string, unknown> = {};
      if (name !== undefined) body.name = name;
      if (content !== undefined) {
        body.content = content;
        if (version !== undefined) body.version = version;
      }

      const response = await fetch(`/api/diagrams/${diagramId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Failed to update diagram');
      }

      return response.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['diagram', variables.diagramId] });
      queryClient.invalidateQueries({ queryKey: ['diagrams'] });
    },
  });
}

/**
 * Helper to convert domain Diagram to update params
 */
export function diagramToUpdateParams(
  diagram: Diagram,
  diagramId: string,
  version: number
): UpdateDiagramParams {
  return {
    diagramId,
    content: domainToDbContent(diagram),
    version,
  };
}
