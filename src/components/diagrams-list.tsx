/**
 * This file is part of the SchemaVis project.
 * Copyright (C) 2025 Akshat Kotpalliwar (IntegerAlex)
 * Licensed under the GNU Affero General Public License v3.0 or later.
 */
'use client';

import * as React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from './ui/button';
import { Trash2, Loader2 } from 'lucide-react';
import { useDiagramDelete } from '@/hooks/use-diagram-delete';

interface Diagram {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

export function DiagramsList() {
  const { data: diagrams, isLoading } = useQuery({
    queryKey: ['diagrams'],
    queryFn: async () => {
      const response = await fetch('/api/diagrams');
      if (!response.ok) throw new Error('Failed to fetch diagrams');
      const data = await response.json();
      return data as { diagrams: Diagram[] };
    },
  });

  const { deleteDiagram, isDeleting } = useDiagramDelete();

  const handleDelete = (diagramId: string, diagramName: string) => {
    if (confirm(`Are you sure you want to delete "${diagramName}"? This action cannot be undone.`)) {
      deleteDiagram(diagramId);
    }
  };

  if (isLoading) {
    return <div>Loading diagrams...</div>;
  }

  if (!diagrams?.diagrams?.length) {
    return <div>No diagrams found</div>;
  }

  return (
    <div className="space-y-2">
      {diagrams.diagrams.map((diagram) => (
        <div key={diagram.id} className="flex items-center justify-between p-3 border rounded-lg">
          <div>
            <h3 className="font-medium">{diagram.name}</h3>
            <p className="text-sm text-gray-500">
              Created: {new Date(diagram.createdAt).toLocaleDateString()}
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleDelete(diagram.id, diagram.name)}
            disabled={isDeleting}
            className="text-red-500 hover:text-red-700 hover:bg-red-50"
          >
            {isDeleting ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Trash2 className="size-4" />
            )}
          </Button>
        </div>
      ))}
    </div>
  );
}
