'use client';

import { useRef, useState } from 'react';
import type { UseMutationResult } from '@tanstack/react-query';
import type { ParseSQLResponse, ParseSQLError } from '@/hooks/use-parse-sql';

interface SQLInputProps {
  parseMutation: UseMutationResult<ParseSQLResponse, ParseSQLError, string>;
}

export function SQLInput({ parseMutation }: SQLInputProps) {
  const [sql, setSql] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      setSql(text);
    } catch (error) {
      console.error('Error reading file:', error);
    }
  };

  const handleSubmit = () => {
    if (!sql.trim()) {
      return;
    }

    parseMutation.mutate(sql);
  };

  return (
    <div className="flex flex-col gap-4 p-6 border rounded-lg bg-white dark:bg-zinc-900">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">PostgreSQL SQL Input</h2>
        <button
          onClick={() => fileInputRef.current?.click()}
          className="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Upload File
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".sql,.txt"
          onChange={handleFileChange}
          className="hidden"
        />
      </div>

      <textarea
        value={sql}
        onChange={(e) => setSql(e.target.value)}
        placeholder="Paste your PostgreSQL SQL here or upload a file..."
        className="w-full h-64 p-4 border rounded font-mono text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-zinc-800 dark:text-white"
      />

      {parseMutation.error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded text-red-700 dark:text-red-400">
          <strong>Error:</strong> {parseMutation.error.message || 'Failed to parse SQL'}
        </div>
      )}

      <button
        onClick={handleSubmit}
        disabled={!sql.trim() || parseMutation.isPending}
        className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {parseMutation.isPending ? 'Parsing...' : 'Parse SQL'}
      </button>
    </div>
  );
}

