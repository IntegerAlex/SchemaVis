'use client';
/**
 * This file is part of the SchemaVis project.
 * Copyright (C) 2025 Akshat Kotpalliwar (IntegerAlex)
 * Licensed under the GNU Affero General Public License v3.0 or later.
 */

import * as React from 'react';
import { Upload, FileIcon, AlertCircle, Trash2 } from 'lucide-react';
import { Button } from './button';
import { cn } from '@/lib/utils';

interface FileWithPreview extends File {
  preview?: string;
}

export interface FileUploaderProps {
  onFilesChange?: (files: File[]) => void;
  multiple?: boolean;
  supportedExtensions?: string[];
  className?: string;
}

export const FileUploader: React.FC<FileUploaderProps> = ({
  onFilesChange,
  multiple,
  supportedExtensions = ['.sql', '.txt'],
  className,
}) => {
  const [files, setFiles] = React.useState<FileWithPreview[]>([]);
  const [isDragging, setIsDragging] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const isFileSupported = React.useCallback(
    (file: File) => {
      if (!supportedExtensions) return true;
      const fileExtension = file.name.split('.').pop()?.toLowerCase();
      return fileExtension
        ? supportedExtensions.includes(`.${fileExtension}`)
        : false;
    },
    [supportedExtensions]
  );

  const handleFiles = React.useCallback(
    (selectedFiles: FileList) => {
      const newFiles = Array.from(selectedFiles)
        .filter((file) => {
          if (!isFileSupported(file)) {
            setError(
              `File type not supported. Supported types: ${supportedExtensions?.join(', ')}`
            );
            return false;
          }
          return true;
        })
        .map((file) =>
          Object.assign(file, { preview: URL.createObjectURL(file) })
        );

      if (newFiles.length === 0) return;

      setError(null);
      setFiles((prevFiles) => {
        if (multiple) {
          return [...prevFiles, ...newFiles];
        } else {
          return newFiles.slice(0, 1);
        }
      });
    },
    [multiple, supportedExtensions, isFileSupported]
  );

  const onDragOver = React.useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const onDragLeave = React.useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const onDrop = React.useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragging(false);
      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        handleFiles(e.dataTransfer.files);
      }
    },
    [handleFiles]
  );

  React.useEffect(() => {
    if (onFilesChange) {
      onFilesChange(files.length > 0 ? files : []);
    }
  }, [files, onFilesChange]);

  const removeFile = React.useCallback((fileToRemove: File) => {
    setFiles((prevFiles) =>
      prevFiles.filter((file) => file !== fileToRemove)
    );
  }, []);

  return (
    <div className={cn('mx-auto w-full', className)}>
      <div
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        className={cn(
          'cursor-pointer rounded-lg border-2 border-dashed p-8 text-center transition-colors',
          isDragging
            ? 'border-blue-500 bg-blue-50 dark:bg-blue-950'
            : 'border-gray-300 hover:border-blue-500 dark:border-gray-600 dark:hover:border-blue-500'
        )}
      >
        <input
          type="file"
          multiple={multiple}
          onChange={(e) =>
            e.target.files && handleFiles(e.target.files)
          }
          className="hidden"
          id="fileInput"
          accept={supportedExtensions?.join(',')}
        />
        <label htmlFor="fileInput" className="cursor-pointer">
          <Upload className="mx-auto size-12 text-gray-400 dark:text-gray-500" />
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            {multiple
              ? 'Drag and drop files here or click to select'
              : 'Drag and drop a file here or click to select'}
          </p>
          {supportedExtensions ? (
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Supported types: {supportedExtensions.join(', ')}
            </p>
          ) : null}
        </label>
      </div>

      {error ? (
        <div className="mt-4 flex items-center rounded-lg bg-red-100 p-3 text-red-700 dark:bg-red-900 dark:text-red-200">
          <AlertCircle className="mr-2 size-5" />
          <span className="text-sm">{error}</span>
        </div>
      ) : null}

      {files.length > 0 ? (
        <ul className="mt-4 space-y-2">
          {files.map((file) => (
            <li
              key={file.name}
              className="flex items-center justify-between rounded-lg bg-gray-100 p-3 dark:bg-gray-800"
            >
              <div className="flex min-w-0 flex-1 items-center space-x-2">
                <FileIcon className="size-5 text-blue-600" />
                <span className="truncate text-sm font-medium text-gray-700 dark:text-gray-300">
                  {file.name}
                </span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => removeFile(file)}
              >
                <Trash2 className="size-4 text-red-600" />
              </Button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
};

