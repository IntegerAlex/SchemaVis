/**
 * This file is part of the SchemaVis project.
 * Copyright (C) 2025 Akshat Kotpalliwar (IntegerAlex)
 * Licensed under the GNU Affero General Public License v3.0 or later.
 */
import { useQuery } from '@tanstack/react-query';

export interface SqlFile {
  id: number;
  title: string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface SqlFileWithContent extends SqlFile {
  content: string;
}

export function useSqlFiles() {
  return useQuery<{ files: SqlFile[] }>({
    queryKey: ['sql-files'],
    queryFn: async () => {
      const response = await fetch('/api/sql-files');
      if (!response.ok) {
        throw new Error('Failed to fetch SQL files');
      }
      return response.json();
    },
  });
}

export function useSqlFile(id: number | null) {
  return useQuery<{ file: SqlFileWithContent }>({
    queryKey: ['sql-file', id],
    queryFn: async () => {
      if (!id) throw new Error('File ID is required');
      const response = await fetch(`/api/sql-files/${id}`);
      if (!response.ok) {
        throw new Error('Failed to fetch SQL file');
      }
      return response.json();
    },
    enabled: !!id,
  });
}

