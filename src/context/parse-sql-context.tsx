'use client';

import * as React from 'react';
import { useParseSQL, type ParseSQLResponse, type ParseSQLError } from '@/hooks/use-parse-sql';
import type { UseMutationResult } from '@tanstack/react-query';
import { DatabaseType } from '@/lib/domain/database-type';

interface ParseSQLContextValue {
  parseMutation: UseMutationResult<ParseSQLResponse, ParseSQLError, { sql: string; databaseType?: DatabaseType }>;
}

const ParseSQLContext = React.createContext<ParseSQLContextValue | null>(null);

export function ParseSQLProvider({ children }: { children: React.ReactNode }) {
  const parseMutation = useParseSQL();

  return (
    <ParseSQLContext.Provider value={{ parseMutation }}>
      {children}
    </ParseSQLContext.Provider>
  );
}

export function useParseSQLContext() {
  const context = React.useContext(ParseSQLContext);
  if (!context) {
    throw new Error('useParseSQLContext must be used within ParseSQLProvider');
  }
  return context;
}

