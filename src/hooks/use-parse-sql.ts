import { useMutation } from '@tanstack/react-query';
import type { Diagram } from '@/lib/domain/diagram';
import { DatabaseType } from '@/lib/domain/database-type';

export interface ParseSQLResponse {
  diagram: Diagram;
}

export interface ParseSQLError {
  error: string;
  details?: unknown;
}

export function useParseSQL() {
  return useMutation<ParseSQLResponse, ParseSQLError, { sql: string; databaseType?: DatabaseType }>({
    mutationFn: async ({ sql, databaseType }) => {
      const response = await fetch('/api/parse-sql', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ sql, databaseType }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to parse SQL');
      }

      return response.json();
    },
  });
}


