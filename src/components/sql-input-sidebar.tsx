'use client';
/**
 * This file is part of the SchemaVis project.
 * Copyright (C) 2025 Akshat Kotpalliwar (IntegerAlex)
 * Licensed under the GNU Affero General Public License v3.0 or later.
 */

import * as React from 'react';
import { ArrowLeft, Loader2, Save, Check, Upload } from 'lucide-react';
import { Button } from './ui/button';
import { DatabaseSelector } from './ui/database-selector';
import { DatabaseType } from '@/lib/domain/database-type';
import { cn } from '@/lib/utils';
import { useQueryClient } from '@tanstack/react-query';

interface SqlInputSidebarProps {
  onBackClick: () => void;
  onSqlChange: (sql: string, databaseType: DatabaseType) => void;
  onFileLoad?: (sql: string, fileName: string) => void;
  isLoading?: boolean;
  error?: string;
}

export function SqlInputSidebar({ onBackClick, onSqlChange, onFileLoad, isLoading, error }: SqlInputSidebarProps) {
  const [sql, setSql] = React.useState('');
  const [fileName, setFileName] = React.useState('');
  const [databaseType, setDatabaseType] = React.useState<DatabaseType>(DatabaseType.GENERIC);
  const [isSaving, setIsSaving] = React.useState(false);
  const [saveSuccess, setSaveSuccess] = React.useState(false);
  const [saveError, setSaveError] = React.useState<string | null>(null);
  const saveSuccessTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const fileUploadRef = React.useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  // Clean up the save-success timer on unmount
  React.useEffect(() => {
    return () => {
      if (saveSuccessTimerRef.current) {
        clearTimeout(saveSuccessTimerRef.current);
      }
    };
  }, []);

  const handleSqlChange = (value: string) => {
    setSql(value);
    if (value.trim()) {
      onSqlChange(value, databaseType);
    }
  };

  const handleDatabaseTypeChange = (value: DatabaseType) => {
    setDatabaseType(value);
    // Always trigger change to update parent state (e.g. active file badge dialect)
    onSqlChange(sql, value);
  };

  const handleClear = () => {
    setSql('');
    setFileName('');
    setSaveError(null);
    setSaveSuccess(false);
  };

  const handleFileUpload = React.useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      try {
        const text = await file.text();
        setSql(text);
        setFileName(file.name);
        if (onFileLoad) {
          // Parent handles DB-type detection and parsing
          onFileLoad(text, file.name);
        } else {
          onSqlChange(text, databaseType);
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        setSaveError(`Unable to read file contents: ${message}`);
      } finally {
        if (fileUploadRef.current) fileUploadRef.current.value = '';
      }
    },
    [databaseType, onSqlChange, onFileLoad]
  );

  const SAVE_SUCCESS_DISPLAY_MS = 2000;

  const handleSave = React.useCallback(async () => {
    if (!sql.trim()) return;

    setIsSaving(true);
    setSaveError(null);
    setSaveSuccess(false);

    // Clear any pending success timer
    if (saveSuccessTimerRef.current) {
      clearTimeout(saveSuccessTimerRef.current);
      saveSuccessTimerRef.current = null;
    }

    try {
      const response = await fetch('/api/sql-files', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: fileName.trim() || 'Untitled SQL',
          content: sql,
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to save SQL file');
      }

      // Invalidate the files list so the sidebar refreshes
      await queryClient.invalidateQueries({ queryKey: ['sql-files'] });

      setSaveSuccess(true);
      saveSuccessTimerRef.current = setTimeout(() => {
        setSaveSuccess(false);
        saveSuccessTimerRef.current = null;
      }, SAVE_SUCCESS_DISPLAY_MS);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Failed to save file');
    } finally {
      setIsSaving(false);
    }
  }, [sql, fileName, queryClient]);

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
              aria-label="Back to files list"
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
            {/* File name input */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-white" htmlFor="sql-file-name">
                File Name
              </label>
              <input
                id="sql-file-name"
                type="text"
                value={fileName}
                onChange={(e) => setFileName(e.target.value)}
                placeholder="e.g. my-schema.sql"
                className="w-full p-2.5 border border-white/10 rounded-lg bg-white/5 backdrop-blur-sm text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-zinc-500"
              />
            </div>

            <DatabaseSelector
              value={databaseType}
              onChange={handleDatabaseTypeChange}
            />

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-white" htmlFor="sql-input-area">
                  SQL Input
                </label>
                <button
                  type="button"
                  onClick={() => fileUploadRef.current?.click()}
                  className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-semibold text-blue-400 bg-blue-500/10 hover:bg-blue-500/20 rounded-md transition-all border border-blue-500/20 hover:border-blue-500/40"
                >
                  <Upload className="size-4" />
                  Upload .sql
                </button>
                <input
                  ref={fileUploadRef}
                  type="file"
                  accept=".sql"
                  onChange={handleFileUpload}
                  className="hidden"
                  aria-label="Upload SQL file"
                />
              </div>
              <textarea
                id="sql-input-area"
                value={sql}
                onChange={(e) => handleSqlChange(e.target.value)}
                placeholder="Paste your SQL here..."
                className="w-full h-72 p-3 border border-white/10 rounded-lg bg-white/5 backdrop-blur-sm text-white text-sm font-mono resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-zinc-500"
              />
            </div>

            {isLoading && (
              <div className="flex items-center gap-2 text-sm text-zinc-300">
                <Loader2 className="size-4 animate-spin" />
                Parsing...
              </div>
            )}

            {error && (
              <div className="text-sm text-red-400 px-2 py-1.5 bg-red-900/20 border border-red-800/50 rounded-lg">
                {error}
              </div>
            )}

            {saveError && (
              <div className="text-sm text-red-400 px-2 py-1.5 bg-red-900/20 border border-red-800/50 rounded-lg">
                {saveError}
              </div>
            )}

            <div className="flex gap-2">
              <Button
                onClick={handleSave}
                size="sm"
                disabled={!sql.trim() || isSaving}
                className={cn(
                  "flex-1 transition-all duration-200",
                  saveSuccess
                    ? "bg-green-600 hover:bg-green-700 text-white"
                    : "bg-blue-600 hover:bg-blue-700 text-white"
                )}
              >
                {isSaving ? (
                  <>
                    <Loader2 className="size-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : saveSuccess ? (
                  <>
                    <Check className="size-4 mr-2" />
                    Saved
                  </>
                ) : (
                  <>
                    <Save className="size-4 mr-2" />
                    Save SQL
                  </>
                )}
              </Button>
              <Button
                onClick={handleClear}
                variant="outline"
                size="sm"
                disabled={!sql.trim() && !fileName.trim()}
                className="border-white/10 text-white hover:bg-white/10"
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
