/**
 * This file is part of the SchemaVis project.
 * Copyright (C) 2025 Akshat Kotpalliwar (IntegerAlex)
 * Licensed under the GNU Affero General Public License v3.0 or later.
 */
'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useDiagramEvents } from '@/context/diagram-events-context';

export function useDiagramDelete() {
  const queryClient = useQueryClient();
  const { emitDiagramDeleted } = useDiagramEvents();

  const deleteMutation = useMutation({
    mutationFn: async (diagramId: string) => {
      const response = await fetch(`/api/diagrams/${diagramId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete diagram');
      }

      return response.json();
    },
    onSuccess: (_, diagramId) => {
      // Immediately emit deletion event
      emitDiagramDeleted(diagramId);

      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ['diagrams'] });
      queryClient.removeQueries({ queryKey: ['shared-diagram'] });
      queryClient.removeQueries({ queryKey: ['diagram-presence', diagramId] });
      queryClient.removeQueries({ queryKey: ['diagram-comments', diagramId] });
      queryClient.removeQueries({ queryKey: ['diagram-share', diagramId] });
      queryClient.removeQueries({ queryKey: ['diagram-permissions', diagramId] });
    },
    onError: (error) => {
      console.error('Failed to delete diagram:', error);
    },
  });

  return {
    deleteDiagram: deleteMutation.mutate,
    isDeleting: deleteMutation.isPending,
    error: deleteMutation.error,
  };
}

