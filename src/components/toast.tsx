/**
 * This file is part of the SchemaVis project.
 * Copyright (C) 2025 Akshat Kotpalliwar (IntegerAlex)
 * Licensed under the GNU Affero General Public License v3.0 or later.
 */
'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

interface Toast {
  id: string;
  message: string;
  type: 'info' | 'success' | 'error';
}

interface ToastContextValue {
  toasts: Toast[];
  showToast: (message: string, type?: 'info' | 'success' | 'error') => void;
}

const ToastContext = React.createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<Toast[]>([]);

  const showToast = React.useCallback(
    (message: string, type: 'info' | 'success' | 'error' = 'info') => {
      const id = Math.random().toString(36).slice(2);
      setToasts((prev) => [...prev, { id, message, type }]);

      // Auto-remove after 3 seconds
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 3000);
    },
    []
  );

  // Listen for user join/leave events
  React.useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleUserJoined = (event: Event) => {
      const customEvent = event as CustomEvent<{ userName: string; userId: string }>;
      const userName = customEvent.detail?.userName || 'Someone';
      showToast(`${userName} joined the diagram`, 'info');
    };

    const handleUserLeft = (event: Event) => {
      showToast('Someone left the diagram', 'info');
    };

    window.addEventListener('user-joined', handleUserJoined);
    window.addEventListener('user-left', handleUserLeft);

    return () => {
      window.removeEventListener('user-joined', handleUserJoined);
      window.removeEventListener('user-left', handleUserLeft);
    };
  }, [showToast]);

  return (
    <ToastContext.Provider value={{ toasts, showToast }}>
      {children}
      <ToastContainer toasts={toasts} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = React.useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
}

function ToastContainer({ toasts }: { toasts: Toast[] }) {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} />
      ))}
    </div>
  );
}

function ToastItem({ toast }: { toast: Toast }) {
  const [isVisible, setIsVisible] = React.useState(true);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  if (!isVisible) return null;

  const typeStyles = {
    info: 'bg-blue-600 border-blue-500',
    success: 'bg-green-600 border-green-500',
    error: 'bg-red-600 border-red-500',
  };

  return (
    <div
      className={cn(
        'px-4 py-3 rounded-lg border shadow-lg text-white text-sm font-medium pointer-events-auto',
        'transition-all duration-300 ease-in-out',
        typeStyles[toast.type]
      )}
      role="alert"
      style={{
        animation: 'slideIn 0.3s ease-out',
      }}
    >
      {toast.message}
    </div>
  );
}

