"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useAtom } from "jotai";
import { initialTypingState, typingStateAtom } from "@/lib/atoms/game";
import { calculateAccuracy, calculateWpm } from "@/lib/typing/metrics";

type TypingStats = { wpm: number; accuracy: number; elapsedMs: number };

type UseTypingOptions = {
  text: string;
  onProgress?: (index: number, wpm: number) => void;
  onStatsChange?: (stats: TypingStats) => void;
  disabled?: boolean;
};

export function useTyping({ text, onProgress, onStatsChange, disabled }: UseTypingOptions) {
  const [state, setState] = useAtom(typingStateAtom);
  const stateRef = useRef(state);
  stateRef.current = state;

  const [errorIndices, setErrorIndices] = useState<Set<number>>(new Set());
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const lastEmitRef = useRef(0);
  const onProgressRef = useRef(onProgress);
  onProgressRef.current = onProgress;
  const onStatsChangeRef = useRef(onStatsChange);
  onStatsChangeRef.current = onStatsChange;
  const lastStatsRef = useRef<TypingStats | null>(null);

  const [elapsedMs, setElapsedMs] = useState(0);

  const reset = useCallback(() => {
    setState(initialTypingState);
    setErrorIndices(new Set());
    setElapsedMs(0);
    lastStatsRef.current = null;
  }, [setState]);

  useEffect(() => {
    reset();
  }, [text, reset]);

  useEffect(() => {
    if (!state.startedAt) {
      setElapsedMs(0);
      return;
    }
    if (state.finishedAt) {
      setElapsedMs(state.finishedAt - state.startedAt);
      return;
    }
    const update = () => setElapsedMs(Date.now() - state.startedAt!);
    update();
    const id = setInterval(update, 250);
    return () => clearInterval(id);
  }, [state.startedAt, state.finishedAt]);

  const wpm = calculateWpm(state.correctKeystrokes, elapsedMs);
  const accuracy = calculateAccuracy(state.correctKeystrokes, state.totalKeystrokes);
  const isFinished = state.cursorIndex >= text.length && text.length > 0;

  const notifyStats = useCallback((stats: TypingStats) => {
    const prev = lastStatsRef.current;
    if (
      prev &&
      prev.wpm === stats.wpm &&
      prev.accuracy === stats.accuracy &&
      prev.elapsedMs === stats.elapsedMs
    ) {
      return;
    }
    lastStatsRef.current = stats;
    onStatsChangeRef.current?.(stats);
  }, []);

  useEffect(() => {
    notifyStats({ wpm, accuracy, elapsedMs });
  }, [wpm, accuracy, elapsedMs, notifyStats]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (disabled || !text || stateRef.current.finishedAt) return;

      if (e.key === "Backspace") {
        e.preventDefault();
        const current = stateRef.current;
        if (current.cursorIndex === 0) return;

        const removedIndex = current.cursorIndex - 1;
        const removedChar = current.typedChars[removedIndex];
        const wasCorrect = removedChar === text[removedIndex];

        setErrorIndices((errs) => {
          const next = new Set(errs);
          next.delete(removedIndex);
          return next;
        });
        setState((prev) => ({
          ...prev,
          cursorIndex: removedIndex,
          typedChars: prev.typedChars.slice(0, -1),
          totalKeystrokes: Math.max(0, prev.totalKeystrokes - 1),
          correctKeystrokes: Math.max(0, prev.correctKeystrokes - (wasCorrect ? 1 : 0)),
          finishedAt: null,
        }));
        return;
      }

      const isPrintable =
        e.key === "Enter" || (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey);
      if (!isPrintable) return;
      e.preventDefault();

      const char = e.key === "Enter" ? "\n" : e.key;
      const now = Date.now();
      const cursorIndex = stateRef.current.cursorIndex;
      const expected = text[cursorIndex];
      const isCorrect = char === expected;

      setState((prev) => {
        const startedAt = prev.startedAt ?? now;
        const newIndex = prev.cursorIndex + 1;
        const newCorrect = prev.correctKeystrokes + (isCorrect ? 1 : 0);
        const finished = newIndex >= text.length;
        const elapsed = now - startedAt;
        const currentWpm = calculateWpm(newCorrect, elapsed);

        if (onProgressRef.current && (finished || now - lastEmitRef.current > 100)) {
          lastEmitRef.current = now;
          queueMicrotask(() => onProgressRef.current?.(newIndex, currentWpm));
        }

        return {
          ...prev,
          startedAt,
          cursorIndex: newIndex,
          typedChars: [...prev.typedChars, char],
          totalKeystrokes: prev.totalKeystrokes + 1,
          correctKeystrokes: newCorrect,
          finishedAt: finished ? now : null,
        };
      });

      if (!isCorrect) {
        setErrorIndices((prev) => new Set(prev).add(cursorIndex));
      } else {
        setErrorIndices((prev) => {
          const next = new Set(prev);
          next.delete(cursorIndex);
          return next;
        });
      }
    },
    [disabled, text, setState],
  );

  const focus = useCallback(() => {
    inputRef.current?.focus();
  }, []);

  return {
    state,
    errorIndices,
    inputRef,
    handleKeyDown,
    wpm,
    accuracy,
    elapsedMs,
    isFinished,
    reset,
    focus,
  };
}
