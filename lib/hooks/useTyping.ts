"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useAtom } from "jotai";
import { initialTypingState, typingStateAtom } from "@/lib/atoms/game";
import { calculateAccuracy, calculateWpm } from "@/lib/typing/metrics";

type UseTypingOptions = {
  text: string;
  onProgress?: (index: number, wpm: number) => void;
  disabled?: boolean;
};

export function useTyping({ text, onProgress, disabled }: UseTypingOptions) {
  const [state, setState] = useAtom(typingStateAtom);
  const [errorIndices, setErrorIndices] = useState<Set<number>>(new Set());
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const lastEmitRef = useRef(0);

  const reset = useCallback(() => {
    setState(initialTypingState);
    setErrorIndices(new Set());
  }, [setState]);

  useEffect(() => {
    reset();
  }, [text, reset]);

  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (!state.startedAt || state.finishedAt) return;
    const id = setInterval(() => setTick((t) => t + 1), 250);
    return () => clearInterval(id);
  }, [state.startedAt, state.finishedAt]);

  const elapsedMs =
    state.startedAt && !state.finishedAt
      ? Date.now() - state.startedAt
      : state.finishedAt && state.startedAt
        ? state.finishedAt - state.startedAt
        : 0;

  void tick;

  const wpm = calculateWpm(state.correctKeystrokes, elapsedMs);
  const accuracy = calculateAccuracy(state.correctKeystrokes, state.totalKeystrokes);
  const isFinished = state.cursorIndex >= text.length && text.length > 0;

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (disabled || !text || state.finishedAt) return;

      if (e.key === "Backspace") {
        e.preventDefault();
        if (state.cursorIndex === 0) return;

        const newIndex = state.cursorIndex - 1;
        const newTyped = state.typedChars.slice(0, -1);
        const newErrors = new Set(errorIndices);
        newErrors.delete(newIndex);

        setErrorIndices(newErrors);
        setState((prev) => ({
          ...prev,
          cursorIndex: newIndex,
          typedChars: newTyped,
        }));
        return;
      }

      if (e.key.length !== 1 || e.ctrlKey || e.metaKey || e.altKey) return;
      e.preventDefault();

      const char = e.key;
      const expected = text[state.cursorIndex];
      const isCorrect = char === expected;
      const now = Date.now();

      setState((prev) => {
        const startedAt = prev.startedAt ?? now;
        const newIndex = prev.cursorIndex + 1;
        const finished = newIndex >= text.length;

        return {
          ...prev,
          startedAt,
          cursorIndex: newIndex,
          typedChars: [...prev.typedChars, char],
          totalKeystrokes: prev.totalKeystrokes + 1,
          correctKeystrokes: prev.correctKeystrokes + (isCorrect ? 1 : 0),
          finishedAt: finished ? now : null,
        };
      });

      if (!isCorrect) {
        setErrorIndices((prev) => new Set(prev).add(state.cursorIndex));
      } else {
        setErrorIndices((prev) => {
          const next = new Set(prev);
          next.delete(state.cursorIndex);
          return next;
        });
      }

      const newIndex = state.cursorIndex + 1;
      const newCorrect = state.correctKeystrokes + (isCorrect ? 1 : 0);
      const started = state.startedAt ?? now;
      const elapsed = now - started;
      const currentWpm = calculateWpm(newCorrect, elapsed);

      if (onProgress && now - lastEmitRef.current > 100) {
        lastEmitRef.current = now;
        onProgress(newIndex, currentWpm);
      }
    },
    [disabled, text, state, errorIndices, onProgress, setState],
  );

  const focus = () => inputRef.current?.focus();

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
