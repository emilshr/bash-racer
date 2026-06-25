"use client";

import { useEffect } from "react";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { useTyping } from "@/lib/hooks/useTyping";

type TypingSurfaceProps = {
  text: string;
  loading?: boolean;
  disabled?: boolean;
  onProgress?: (index: number, wpm: number) => void;
  onFinish?: () => void;
  onStatsChange?: (stats: { wpm: number; accuracy: number; elapsedMs: number }) => void;
};

function renderTypedSegments(text: string, cursorIndex: number, errorIndices: Set<number>) {
  const segments: { key: string; text: string; className: string }[] = [];
  let i = 0;

  while (i < cursorIndex) {
    const isError = errorIndices.has(i);
    const className = isError ? "text-destructive" : "text-terminal-fg";
    let j = i + 1;
    while (j < cursorIndex && errorIndices.has(j) === isError) j++;
    segments.push({ key: `typed-${i}`, text: text.slice(i, j), className });
    i = j;
  }

  if (cursorIndex < text.length) {
    segments.push({
      key: "remaining",
      text: text.slice(cursorIndex),
      className: "text-terminal-muted",
    });
  }

  return segments;
}

export function TypingSurface({
  text,
  loading,
  disabled,
  onProgress,
  onFinish,
  onStatsChange,
}: TypingSurfaceProps) {
  const { state, errorIndices, inputRef, handleKeyDown, isFinished, focus } = useTyping({
    text,
    onProgress,
    onStatsChange,
    disabled: disabled || loading,
  });

  useEffect(() => {
    if (!loading && text) focus();
  }, [loading, text, focus]);

  useEffect(() => {
    if (isFinished) onFinish?.();
  }, [isFinished, onFinish]);

  if (loading) {
    return (
      <div className="flex flex-1 flex-col gap-2 p-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-4 w-full bg-muted/30" />
        ))}
      </div>
    );
  }

  const segments = renderTypedSegments(text, state.cursorIndex, errorIndices);

  return (
    <div className="relative flex min-h-0 flex-1 flex-col" onClick={focus}>
      <ScrollArea className="flex-1 p-4">
        <pre className="whitespace-pre-wrap break-all leading-relaxed">
          {segments.map((segment) => (
            <span key={segment.key} className={cn(segment.className)}>
              {segment.text}
            </span>
          ))}
        </pre>
      </ScrollArea>
      <textarea
        ref={inputRef}
        className="absolute inset-0 cursor-text resize-none opacity-0"
        value=""
        onKeyDown={handleKeyDown}
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
        spellCheck={false}
        aria-label="Typing input"
      />
    </div>
  );
}
