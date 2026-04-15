import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { Diagram } from '@/lib/domain/diagram';

export interface CreateDiagramParams {
  name: string;
  databaseType: string;
  content: Record<string, unknown>;
}

export interface CreateDiagramResponse {
  diagram: {
    id: string;
    name: string;
    databaseType: string;
    content: Record<string, unknown>;
    ownerId: string;
    isPublic: boolean;
    shareToken: string;
    linkPermission: string;
    shareExpiresAt: Date | null;
    version: number;
    deletedAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
  };
}

export interface CreateDiagramError {
  error: string;
  details?: unknown;
}

export function useCreateDiagram() {
  const queryClient = useQueryClient();

  return useMutation<CreateDiagramResponse, CreateDiagramError, CreateDiagramParams>({
    mutationFn: async (params) => {
      const response = await fetch('/api/diagrams', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(params),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create diagram');
      }

      return response.json();
    },
    onSuccess: () => {
      // Invalidate diagrams list to refresh sidebar
      queryClient.invalidateQueries({ queryKey: ['diagrams'] });
    },
  });
}
