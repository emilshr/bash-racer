"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useAtom } from "jotai";
import { initialTypingState, typingStateAtom } from "@/lib/atoms/game";
import {
  clampCursorToLine,
  findPrevWordStart,
  getLineBounds,
  shiftErrorIndices,
} from "@/lib/typing/cursor";
import { calculateAccuracy, calculateWpm } from "@/lib/typing/metrics";

type TypingStats = { wpm: number; accuracy: number; elapsedMs: number };

type UseTypingOptions = {
  text: string;
  onProgress?: (index: number, wpm: number) => void;
  onStatsChange?: (stats: TypingStats) => void;
  onLineComplete?: (snapshot: { typedChars: string[]; errorIndices: number[] }) => void;
  disabled?: boolean;
};

function countCorrectChars(typedChars: string[], text: string): number {
  let count = 0;
  for (let i = 0; i < typedChars.length; i++) {
    if (typedChars[i] === text[i]) count++;
  }
  return count;
}

function deleteRange(typedChars: string[], from: number, to: number): string[] {
  return [...typedChars.slice(0, from), ...typedChars.slice(to)];
}

export function useTyping({
  text,
  onProgress,
  onStatsChange,
  onLineComplete,
  disabled,
}: UseTypingOptions) {
  const [state, setState] = useAtom(typingStateAtom);
  const stateRef = useRef(state);
  stateRef.current = state;

  const [errorIndices, setErrorIndices] = useState<Set<number>>(new Set());
  const errorIndicesRef = useRef(errorIndices);
  errorIndicesRef.current = errorIndices;
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const lastEmitRef = useRef(0);
  const onProgressRef = useRef(onProgress);
  onProgressRef.current = onProgress;
  const onStatsChangeRef = useRef(onStatsChange);
  onStatsChangeRef.current = onStatsChange;
  const onLineCompleteRef = useRef(onLineComplete);
  onLineCompleteRef.current = onLineComplete;
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
  const isLineComplete = state.typedChars.length >= text.length && text.length > 0;
  const isFinished = isLineComplete && !onLineComplete;

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

  const emitProgress = useCallback(
    (furthestIndex: number, correctKeystrokes: number, startedAt: number) => {
      const now = Date.now();
      const currentWpm = calculateWpm(correctKeystrokes, now - startedAt);
      if (onProgressRef.current && (furthestIndex >= text.length || now - lastEmitRef.current > 100)) {
        lastEmitRef.current = now;
        queueMicrotask(() => onProgressRef.current?.(furthestIndex, currentWpm));
      }
    },
    [text.length],
  );

  const applyDeletion = useCallback(
    (from: number, to: number) => {
      if (from >= to) return;

      const current = stateRef.current;
      const boundedFrom = Math.max(from, current.lineLockIndex);
      if (boundedFrom >= to) return;

      const nextTyped = deleteRange(current.typedChars, boundedFrom, to);
      const removedCount = to - boundedFrom;
      let correctRemoved = 0;
      for (let i = boundedFrom; i < to; i++) {
        if (current.typedChars[i] === text[i]) correctRemoved++;
      }

      setErrorIndices((errs) => shiftErrorIndices(errs, boundedFrom, removedCount));
      setState((prev) => {
        const newCursor = clampCursorToLine(
          boundedFrom,
          text,
          prev.lineLockIndex,
          nextTyped.length,
        );
        return {
          ...prev,
          cursorIndex: newCursor,
          furthestIndex: Math.min(prev.furthestIndex, nextTyped.length),
          typedChars: nextTyped,
          totalKeystrokes: Math.max(0, prev.totalKeystrokes - removedCount),
          correctKeystrokes: Math.max(0, prev.correctKeystrokes - correctRemoved),
          finishedAt: null,
        };
      });
    },
    [text, setState],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (disabled || !text || stateRef.current.finishedAt) return;

      const current = stateRef.current;
      const typedLength = current.typedChars.length;

      if (e.key === "ArrowUp" || e.key === "ArrowDown") {
        e.preventDefault();
        return;
      }

      if (e.key === "ArrowLeft") {
        e.preventDefault();
        setState((prev) => ({
          ...prev,
          cursorIndex: clampCursorToLine(
            prev.cursorIndex - 1,
            text,
            prev.lineLockIndex,
            prev.typedChars.length,
          ),
        }));
        return;
      }

      if (e.key === "ArrowRight") {
        e.preventDefault();
        setState((prev) => ({
          ...prev,
          cursorIndex: clampCursorToLine(
            prev.cursorIndex + 1,
            text,
            prev.lineLockIndex,
            prev.typedChars.length,
          ),
        }));
        return;
      }

      if (e.key === "Backspace") {
        e.preventDefault();
        if (current.cursorIndex <= current.lineLockIndex) return;

        if (e.metaKey) {
          const { lineStart, lineEnd } = getLineBounds(text, current.cursorIndex);
          const deleteStart = Math.max(lineStart, current.lineLockIndex);
          const deleteEnd = Math.min(lineEnd, typedLength);
          if (deleteStart < deleteEnd) applyDeletion(deleteStart, deleteEnd);
          return;
        }

        if (e.ctrlKey || e.altKey) {
          const wordStart = Math.max(
            findPrevWordStart(text, current.cursorIndex),
            current.lineLockIndex,
          );
          if (wordStart < current.cursorIndex) applyDeletion(wordStart, current.cursorIndex);
          return;
        }

        applyDeletion(current.cursorIndex - 1, current.cursorIndex);
        return;
      }

      if (e.key === "Enter") {
        e.preventDefault();
        if (onLineCompleteRef.current) {
          const now = Date.now();
          const typed = [...current.typedChars];
          const errors = [...errorIndicesRef.current];
          setState((prev) => {
            const startedAt = prev.startedAt ?? now;
            return { ...prev, startedAt };
          });
          onLineCompleteRef.current({ typedChars: typed, errorIndices: errors });
        } else {
          const char = "\n";
          const now = Date.now();
          const cursorIndex = current.cursorIndex;
          const expected = text[cursorIndex];
          const isCorrect = char === expected;
          setState((prev) => {
            const startedAt = prev.startedAt ?? now;
            const nextTyped = [...prev.typedChars];
            if (cursorIndex < nextTyped.length) {
              nextTyped[cursorIndex] = char;
            } else {
              nextTyped.push(char);
            }
            const newIndex = cursorIndex + 1;
            const newFurthest = Math.max(prev.furthestIndex, newIndex);
            const newCorrect = countCorrectChars(nextTyped, text);
            const finished = nextTyped.length >= text.length;
            emitProgress(newFurthest, newCorrect, startedAt);
            return {
              ...prev,
              startedAt,
              cursorIndex: newIndex,
              furthestIndex: newFurthest,
              typedChars: nextTyped,
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
        }
        return;
      }

      const isPrintable = e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey;
      if (!isPrintable) return;
      e.preventDefault();

      const char = e.key;
      const now = Date.now();
      const cursorIndex = current.cursorIndex;
      const expected = text[cursorIndex];
      const isCorrect = char === expected;

      setState((prev) => {
        const startedAt = prev.startedAt ?? now;
        const nextTyped = [...prev.typedChars];
        if (cursorIndex < nextTyped.length) {
          nextTyped[cursorIndex] = char;
        } else {
          nextTyped.push(char);
        }
        const newIndex = cursorIndex + 1;
        const newFurthest = Math.max(prev.furthestIndex, newIndex);
        const newCorrect = countCorrectChars(nextTyped, text);
        const finished = !onLineCompleteRef.current && nextTyped.length >= text.length;

        emitProgress(newFurthest, newCorrect, startedAt);

        return {
          ...prev,
          startedAt,
          cursorIndex: newIndex,
          furthestIndex: newFurthest,
          typedChars: nextTyped,
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
    [disabled, text, setState, applyDeletion, emitProgress],
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
