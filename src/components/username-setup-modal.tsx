/**
 * This file is part of the SchemaVis project.
 * Copyright (C) 2025 Akshat Kotpalliwar (IntegerAlex)
 * Licensed under the GNU Affero General Public License v3.0 or later.
 */
'use client';

import * as React from 'react';
import { X, Check, Loader2, AtSign } from 'lucide-react';
import { Button } from './ui/button';
import { cn } from '@/lib/utils';
import { useMutation } from '@tanstack/react-query';
import { validateUsername, normalizeUsername, formatUsername } from '@/lib/validation/username';

interface UsernameSetupModalProps {
  isOpen: boolean;
  onSuccess: () => void;
}

export function UsernameSetupModal({ isOpen, onSuccess }: UsernameSetupModalProps) {
  const [username, setUsername] = React.useState('');
  const [validationError, setValidationError] = React.useState<string | null>(null);
  const [availabilityStatus, setAvailabilityStatus] = React.useState<'idle' | 'checking' | 'available' | 'taken'>('idle');
  const debounceTimerRef = React.useRef<NodeJS.Timeout | null>(null);

  // Check username availability
  const checkAvailability = React.useCallback(async (value: string) => {
    if (!value || value.length < 3) {
      setAvailabilityStatus('idle');
      return;
    }

    const cleanUsername = value.startsWith('@') ? value.slice(1) : value;
    const validation = validateUsername(cleanUsername);
    
    if (!validation.valid) {
      setValidationError(validation.error || null);
      setAvailabilityStatus('idle');
      return;
    }

    setValidationError(null);
    setAvailabilityStatus('checking');

    try {
      const normalized = normalizeUsername(cleanUsername);
      const response = await fetch(`/api/user/username/check?username=${encodeURIComponent(normalized)}`);
      const data = await response.json();

      if (data.available) {
        setAvailabilityStatus('available');
      } else {
        setAvailabilityStatus('taken');
        setValidationError('Username is already taken');
      }
    } catch (error) {
      console.error('Error checking username availability:', error);
      setAvailabilityStatus('idle');
    }
  }, []);

  // Debounced username input handler
  const handleUsernameChange = React.useCallback((value: string) => {
    setUsername(value);
    setAvailabilityStatus('idle');
    setValidationError(null);

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    const cleanUsername = value.startsWith('@') ? value.slice(1) : value;
    if (cleanUsername.length >= 3) {
      debounceTimerRef.current = setTimeout(() => {
        checkAvailability(value);
      }, 500);
    }
  }, [checkAvailability]);

  // Set username mutation
  const setUsernameMutation = useMutation({
    mutationFn: async (usernameValue: string) => {
      const cleanUsername = usernameValue.startsWith('@') ? usernameValue.slice(1) : usernameValue;
      const normalized = normalizeUsername(cleanUsername);
      
      const response = await fetch('/api/user/username', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: normalized }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to set username');
      }

      return response.json();
    },
    onSuccess: () => {
      onSuccess();
    },
  });

  const handleSubmit = React.useCallback((e: React.FormEvent) => {
    e.preventDefault();
    
    const cleanUsername = username.startsWith('@') ? username.slice(1) : username;
    const validation = validateUsername(cleanUsername);
    
    if (!validation.valid) {
      setValidationError(validation.error || null);
      return;
    }

    if (availabilityStatus !== 'available') {
      setValidationError('Please wait for username availability check');
      return;
    }

    setUsernameMutation.mutate(username);
  }, [username, availabilityStatus, setUsernameMutation]);

  // Reset state when modal opens/closes
  React.useEffect(() => {
    if (!isOpen) {
      setUsername('');
      setValidationError(null);
      setAvailabilityStatus('idle');
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Input value should never include @ since it's shown visually as a prefix
  const inputValue = username || '';

  return (
    <div
      className="fixed inset-0 z-100 flex items-center justify-center"
      onClick={(e) => {
        // Prevent closing by clicking backdrop - username is required
        e.stopPropagation();
      }}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm animate-in fade-in duration-300" />
      
      {/* Dialog */}
      <div
        className={cn(
          'relative z-50 w-full max-w-md mx-4',
          'bg-white/5 backdrop-blur-2xl border border-white/10',
          'rounded-2xl shadow-[0_20px_70px_-30px_rgba(59,130,246,0.45)]',
          'p-6',
          'animate-in fade-in zoom-in-95 duration-200'
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Content */}
        <div className="space-y-6">
          {/* Header */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <AtSign className="size-5 text-blue-400" />
              <h2 className="text-xl font-semibold text-white">
                Choose Your Username
              </h2>
            </div>
            <p className="text-sm text-zinc-400">
              Pick a unique username to get started. You can't change it later.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Username Input */}
            <div className="space-y-2">
              <label htmlFor="username" className="text-sm font-medium text-zinc-300">
                Username
              </label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none">
                  @
                </div>
                <input
                  id="username"
                  type="text"
                  value={inputValue}
                  onChange={(e) => {
                    let value = e.target.value;
                    // Remove @ if user types it
                    if (value.startsWith('@')) {
                      value = value.slice(1);
                    }
                    handleUsernameChange(value);
                  }}
                  placeholder="username"
                  className={cn(
                    'w-full pl-8 pr-10 py-3',
                    'bg-white/5 border rounded-lg',
                    'text-white placeholder:text-zinc-500',
                    'focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50',
                    'transition-colors',
                    validationError || availabilityStatus === 'taken'
                      ? 'border-red-500/50'
                      : availabilityStatus === 'available'
                      ? 'border-green-500/50'
                      : 'border-white/10'
                  )}
                  autoFocus
                  disabled={setUsernameMutation.isPending}
                  aria-label="Username input"
                  aria-describedby="username-help username-error"
                />
                {availabilityStatus === 'checking' && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <Loader2 className="size-4 text-zinc-400 animate-spin" />
                  </div>
                )}
                {availabilityStatus === 'available' && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <Check className="size-4 text-green-500" />
                  </div>
                )}
              </div>

              {/* Help Text */}
              <p id="username-help" className="text-xs text-zinc-500">
                3-30 characters, letters, numbers, underscores, and hyphens only
              </p>

              {/* Error Message */}
              {validationError && (
                <p id="username-error" className="text-xs text-red-400" role="alert">
                  {validationError}
                </p>
              )}

              {/* Success Message */}
              {availabilityStatus === 'available' && !validationError && username && (
                <p className="text-xs text-green-400">
                  {formatUsername(normalizeUsername(username))} is available!
                </p>
              )}
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={
                setUsernameMutation.isPending ||
                availabilityStatus !== 'available' ||
                !username ||
                !!validationError
              }
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            >
              {setUsernameMutation.isPending ? (
                <>
                  <Loader2 className="size-4 mr-2 animate-spin" />
                  Setting up...
                </>
              ) : (
                'Continue'
              )}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}

