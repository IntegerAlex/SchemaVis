'use client';

import * as React from 'react';
import { FileText, Upload } from 'lucide-react';
import { FileUploader } from './ui/file-uploader';
import { Button } from './ui/button';
import { Separator } from './ui/separator';
import { useParseSQLContext } from '@/context/parse-sql-context';
import { cn } from '@/lib/utils';

interface SidePanelProps {
  className?: string;
}

export function SidePanel({ className }: SidePanelProps) {
  const [sql, setSql] = React.useState('');
  const [uploadedFiles, setUploadedFiles] = React.useState<File[]>([]);
  const { parseMutation } = useParseSQLContext();
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  const handleFilesChange = React.useCallback(async (files: File[]) => {
    setUploadedFiles(files);
    if (files.length > 0) {
      try {
        const text = await files[0].text();
        setSql(text);
        if (textareaRef.current) {
          textareaRef.current.value = text;
        }
      } catch (error) {
        console.error('Error reading file:', error);
      }
    }
  }, []);

  const handleSubmit = React.useCallback(() => {
    if (!sql.trim()) {
      return;
    }
    parseMutation.mutate(sql);
  }, [sql, parseMutation]);

  const handleSqlChange = React.useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setSql(e.target.value);
    },
    []
  );

  return (
    <aside
      className={cn(
        'flex h-full flex-col overflow-hidden bg-white dark:bg-zinc-900 border-r border-zinc-200 dark:border-zinc-800',
        className
      )}
    >
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="px-4 py-4 border-b border-zinc-200 dark:border-zinc-800">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
            <FileText className="size-5" />
            SQL Input
          </h2>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
            Upload SQL file or paste SQL code
          </p>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* File Uploader */}
          <div>
            <h3 className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2 flex items-center gap-2">
              <Upload className="size-4" />
              Upload SQL File
            </h3>
            <FileUploader
              onFilesChange={handleFilesChange}
              supportedExtensions={['.sql', '.txt']}
            />
          </div>

          <Separator />

          {/* SQL Textarea */}
          <div className="flex flex-col gap-2">
            <h3 className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Or Paste SQL Code
            </h3>
            <textarea
              ref={textareaRef}
              value={sql}
              onChange={handleSqlChange}
              placeholder="Paste your PostgreSQL SQL here..."
              className="w-full h-64 p-4 border rounded-lg font-mono text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-zinc-800 dark:text-white dark:border-zinc-700"
            />
          </div>

          {/* Error Display */}
          {parseMutation.error && (
            <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400">
              <strong>Error:</strong>{' '}
              {parseMutation.error.message || 'Failed to parse SQL'}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-4 border-t border-zinc-200 dark:border-zinc-800">
          <Button
            onClick={handleSubmit}
            disabled={!sql.trim() || parseMutation.isPending}
            className="w-full"
            size="lg"
          >
            {parseMutation.isPending ? 'Parsing...' : 'Parse SQL'}
          </Button>
        </div>
      </div>
    </aside>
  );
}

