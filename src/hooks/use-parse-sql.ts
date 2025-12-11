import { useMutation } from '@tanstack/react-query';
import type { Diagram } from '@/lib/domain/diagram';

export interface ParseSQLResponse {
  diagram: Diagram;
}

export interface ParseSQLError {
  error: string;
  details?: unknown;
}

export function useParseSQL() {
  return useMutation<ParseSQLResponse, ParseSQLError, string>({
    mutationFn: async (sql: string) => {
      const response = await fetch('/api/parse-sql', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ sql }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to parse SQL');
      }

      return response.json();
    },
  });
}


