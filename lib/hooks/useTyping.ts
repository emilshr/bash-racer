"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { initialTypingState, type TypingState } from "@/lib/atoms/game";
import {
  clampCursorToLine,
  findPrevWordStart,
  getLineBounds,
  shiftErrorIndices,
} from "@/lib/typing/cursor";
import {
  applyNewlineKeystroke,
  applyPrintableKeystroke,
  canCompleteLine,
  canTypeAtCursor,
  deleteRange,
} from "@/lib/typing/keystroke";
import { calculateAccuracy, calculateWpm } from "@/lib/typing/metrics";

type TypingStats = { wpm: number; accuracy: number; elapsedMs: number };

type UseTypingOptions = {
  text: string;
  onProgress?: (index: number, wpm: number) => void;
  onStatsChange?: (stats: TypingStats) => void;
  onLineComplete?: (snapshot: { typedChars: string[]; errorIndices: number[] }) => void;
  disabled?: boolean;
};

export function useTyping({
  text,
  onProgress,
  onStatsChange,
  onLineComplete,
  disabled,
}: UseTypingOptions) {
  const [state, setState] = useState<TypingState>(initialTypingState);
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
  const sessionMode = Boolean(onLineComplete);

  const reset = useCallback(() => {
    setState(initialTypingState);
    setErrorIndices(new Set());
    setElapsedMs(0);
    lastStatsRef.current = null;
  }, []);

  useLayoutEffect(() => {
    reset();
  }, [text, reset]);

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

  const pushStats = useCallback(
    (nextState: TypingState, elapsed: number) => {
      notifyStats({
        wpm: calculateWpm(nextState.correctKeystrokes, elapsed),
        accuracy: calculateAccuracy(nextState.correctKeystrokes, nextState.totalKeystrokes),
        elapsedMs: elapsed,
      });
    },
    [notifyStats],
  );

  useEffect(() => {
    if (!state.startedAt) {
      setElapsedMs(0);
      return;
    }
    if (state.finishedAt) {
      const elapsed = state.finishedAt - state.startedAt;
      setElapsedMs(elapsed);
      pushStats(stateRef.current, elapsed);
      return;
    }
    const update = () => {
      const elapsed = Date.now() - state.startedAt!;
      setElapsedMs(elapsed);
      pushStats(stateRef.current, elapsed);
    };
    update();
    const id = setInterval(update, 250);
    return () => clearInterval(id);
  }, [state.startedAt, state.finishedAt, pushStats]);

  const wpm = calculateWpm(state.correctKeystrokes, elapsedMs);
  const accuracy = calculateAccuracy(state.correctKeystrokes, state.totalKeystrokes);
  const isLineComplete = state.typedChars.length >= text.length && text.length > 0;
  const isFinished = isLineComplete && !onLineComplete;

  const emitProgress = useCallback(
    (furthestIndex: number, correctKeystrokes: number, startedAt: number) => {
      const now = Date.now();
      const currentWpm = calculateWpm(correctKeystrokes, now - startedAt);
      if (
        onProgressRef.current &&
        (furthestIndex >= text.length || now - lastEmitRef.current > 100)
      ) {
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
      const nextState: TypingState = {
        ...current,
        cursorIndex: clampCursorToLine(boundedFrom, text, current.lineLockIndex, nextTyped.length),
        furthestIndex: Math.min(current.furthestIndex, nextTyped.length),
        typedChars: nextTyped,
        totalKeystrokes: Math.max(0, current.totalKeystrokes - removedCount),
        correctKeystrokes: Math.max(0, current.correctKeystrokes - correctRemoved),
        finishedAt: null,
      };
      setState(nextState);
      const elapsed = nextState.startedAt ? Date.now() - nextState.startedAt : 0;
      pushStats(nextState, elapsed);
    },
    [text, pushStats],
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
          if (!canCompleteLine(current.typedChars.length, text.length)) return;

          const now = Date.now();
          const typed = [...current.typedChars];
          const errors = [...errorIndicesRef.current];
          const startedAt = current.startedAt ?? now;
          const nextState = { ...current, startedAt };
          setState(nextState);
          onLineCompleteRef.current({ typedChars: typed, errorIndices: errors });
        } else {
          const char = "\n";
          const now = Date.now();
          const cursorIndex = current.cursorIndex;
          const isCorrect = char === text[cursorIndex];
          const nextState = applyNewlineKeystroke(current, text, cursorIndex, char, now);
          setState(nextState);
          emitProgress(nextState.furthestIndex, nextState.correctKeystrokes, nextState.startedAt!);
          const elapsed = nextState.startedAt ? Date.now() - nextState.startedAt : 0;
          pushStats(nextState, elapsed);

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

      const cursorIndex = current.cursorIndex;
      if (!canTypeAtCursor(cursorIndex, text.length, sessionMode)) return;

      const char = e.key;
      const now = Date.now();
      const isCorrect = char === text[cursorIndex];
      const nextState = applyPrintableKeystroke(current, text, cursorIndex, char, now, sessionMode);
      setState(nextState);
      emitProgress(nextState.furthestIndex, nextState.correctKeystrokes, nextState.startedAt!);
      const elapsed = nextState.startedAt ? Date.now() - nextState.startedAt : 0;
      pushStats(nextState, elapsed);

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
    [disabled, text, sessionMode, applyDeletion, emitProgress, pushStats],
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
