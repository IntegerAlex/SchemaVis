/**
 * This file is part of the SchemaVis project.
 * Copyright (C) 2025 Akshat Kotpalliwar (IntegerAlex)
 * Licensed under the GNU Affero General Public License v3.0 or later.
 */
'use client';

import * as React from 'react';

interface DiagramEventsContextValue {
  // Event listeners
  onDiagramDeleted: (callback: (diagramId: string) => void) => () => void;
  emitDiagramDeleted: (diagramId: string) => void;
}

const DiagramEventsContext = React.createContext<DiagramEventsContextValue | null>(null);

interface DiagramEventsProviderProps {
  children: React.ReactNode;
}

export function DiagramEventsProvider({ children }: DiagramEventsProviderProps) {
  const listenersRef = React.useRef<Set<(diagramId: string) => void>>(new Set());

  const onDiagramDeleted = React.useCallback(
    (callback: (diagramId: string) => void) => {
      listenersRef.current.add(callback);
      return () => {
        listenersRef.current.delete(callback);
      };
    },
    []
  );

  const emitDiagramDeleted = React.useCallback((diagramId: string) => {
    listenersRef.current.forEach((callback) => {
      try {
        callback(diagramId);
      } catch (error) {
        console.error('Error in diagram deletion callback:', error);
      }
    });
  }, []);

  const value = React.useMemo(
    () => ({
      onDiagramDeleted,
      emitDiagramDeleted,
    }),
    [onDiagramDeleted, emitDiagramDeleted]
  );

  return (
    <DiagramEventsContext.Provider value={value}>
      {children}
    </DiagramEventsContext.Provider>
  );
}

export function useDiagramEvents() {
  const context = React.useContext(DiagramEventsContext);
  if (!context) {
    throw new Error('useDiagramEvents must be used within DiagramEventsProvider');
  }
  return context;
}

