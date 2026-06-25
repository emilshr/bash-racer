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

export function TypingSurface({
  text,
  loading,
  disabled,
  onProgress,
  onFinish,
  onStatsChange,
}: TypingSurfaceProps) {
  const { state, errorIndices, inputRef, handleKeyDown, isFinished, focus, wpm, accuracy, elapsedMs } =
    useTyping({
      text,
      onProgress,
      disabled: disabled || loading,
    });

  useEffect(() => {
    onStatsChange?.({ wpm, accuracy, elapsedMs });
  }, [wpm, accuracy, elapsedMs, onStatsChange]);

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

  return (
    <div className="relative flex min-h-0 flex-1 flex-col" onClick={focus}>
      <ScrollArea className="flex-1 p-4">
        <pre className="whitespace-pre-wrap break-all leading-relaxed">
          {text.split("").map((char, i) => {
            const typed = i < state.cursorIndex;
            const isError = errorIndices.has(i);

            return (
              <span
                key={i}
                className={cn(
                  !typed && "text-terminal-muted",
                  typed && !isError && "text-terminal-fg",
                  typed && isError && "text-destructive",
                )}
              >
                {char}
              </span>
            );
          })}
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
