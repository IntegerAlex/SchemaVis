'use client';
/**
 * This file is part of the SchemaVis project.
 * Copyright (C) 2025 Akshat Kotpalliwar (IntegerAlex)
 * Licensed under the GNU Affero General Public License v3.0 or later.
 */

import * as React from 'react';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { Button } from './ui/button';
import { DatabaseSelector } from './ui/database-selector';
import { DatabaseType } from '@/lib/domain/database-type';
import { cn } from '@/lib/utils';

interface SqlInputSidebarProps {
  onBackClick: () => void;
  onSqlChange: (sql: string, databaseType: DatabaseType) => void;
  isLoading?: boolean;
  error?: string;
}

export function SqlInputSidebar({ onBackClick, onSqlChange, isLoading, error }: SqlInputSidebarProps) {
  const [sql, setSql] = React.useState('');
  const [databaseType, setDatabaseType] = React.useState<DatabaseType>(DatabaseType.GENERIC);

  const handleSqlChange = (value: string) => {
    setSql(value);
    if (value.trim()) {
      onSqlChange(value, databaseType);
    }
  };

  const handleDatabaseTypeChange = (value: DatabaseType) => {
    setDatabaseType(value);
    if (sql.trim()) {
      onSqlChange(sql, value);
    }
  };

  const handleClear = () => {
    setSql('');
  };

  return (
    <aside
      className={cn(
        'flex h-full flex-col',
        'transition-[width] duration-500 ease-out',
        'px-4 pt-4 pb-6',
        'w-80'
      )}
      style={{ 
        willChange: 'width',
        transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)'
      }}
    >
      <div className="flex flex-col h-full overflow-hidden rounded-2xl border border-white/10 bg-white/5 backdrop-blur-2xl shadow-[0_20px_70px_-30px_rgba(59,130,246,0.45)] rounded-tl-2xl rounded-tr-2xl">
        <div className="flex items-center justify-between gap-2 px-4 py-3 border-b border-white/10">
          <div className="flex items-center gap-2 flex-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={onBackClick}
              className="h-8 w-8 text-zinc-300 hover:text-white hover:bg-white/10 border border-transparent hover:border-white/10 transition-all duration-300 ease-out rounded-lg shrink-0"
            >
              <ArrowLeft className="size-4" />
            </Button>
            <h2 className="text-sm font-semibold text-white">
              Create New Diagram
            </h2>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto py-4 px-4">
          <div className="space-y-4">
            <DatabaseSelector
              value={databaseType}
              onChange={handleDatabaseTypeChange}
            />

            <div className="space-y-2">
              <label className="text-sm font-medium text-white">
                SQL Input
              </label>
              <textarea
                value={sql}
                onChange={(e) => handleSqlChange(e.target.value)}
                placeholder="Paste your SQL here..."
                className="w-full h-96 p-3 border border-white/10 rounded-lg bg-white/5 backdrop-blur-sm text-white text-sm font-mono resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-zinc-500"
              />
            </div>

            {isLoading && (
              <div className="flex items-center gap-2 text-sm text-zinc-300">
                <Loader2 className="size-4 animate-spin" />
                Parsing...
              </div>
            )}

            {error && (
              <div className="text-sm text-red-400">
                {error}
              </div>
            )}

            <div className="flex gap-2">
              <Button
                onClick={handleClear}
                variant="outline"
                size="sm"
                disabled={!sql.trim()}
                className="flex-1 border-white/10 text-white hover:bg-white/10"
              >
                Clear
              </Button>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
