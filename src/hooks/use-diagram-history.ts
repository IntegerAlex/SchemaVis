import { useCallback, useRef, useState } from "react";
import type { Diagram } from "@/lib/domain/diagram";

const MAX_HISTORY = 50;

export interface DiagramHistoryState {
  past: Diagram[];
  present: Diagram | null;
  future: Diagram[];
}

export function useDiagramHistory(initialDiagram: Diagram | null = null) {
  const [state, setState] = useState<DiagramHistoryState>({
    past: [],
    present: initialDiagram,
    future: [],
  });
  const stateRef = useRef(state);
  stateRef.current = state;

  const pushSnapshot = useCallback((diagram: Diagram) => {
    setState((prev) => {
      const past =
        prev.present !== null
          ? [...prev.past, prev.present].slice(-MAX_HISTORY)
          : prev.past;
      return { past, present: diagram, future: [] };
    });
  }, []);

  const undo = useCallback(() => {
    setState((prev) => {
      if (prev.past.length === 0) return prev;
      const newPast = [...prev.past];
      const previous = newPast[newPast.length - 1];
      if (!previous) return prev;
      newPast.pop();
      return {
        past: newPast,
        present: previous,
        future: prev.present ? [prev.present, ...prev.future] : prev.future,
      };
    });
  }, []);

  const redo = useCallback(() => {
    setState((prev) => {
      if (prev.future.length === 0) return prev;
      const newFuture = [...prev.future];
      const next = newFuture[0];
      if (!next) return prev;
      newFuture.shift();
      return {
        past: prev.present ? [...prev.past, prev.present] : prev.past,
        present: next,
        future: newFuture,
      };
    });
  }, []);

  const reset = useCallback((diagram: Diagram | null = null) => {
    setState({ past: [], present: diagram, future: [] });
  }, []);

  const canUndo = state.past.length > 0;
  const canRedo = state.future.length > 0;
  const diagram = state.present;

  return { diagram, pushSnapshot, undo, redo, reset, canUndo, canRedo };
}
