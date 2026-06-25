"use client";

import { useEffect, useRef } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import type { CommandSession } from "@/lib/atoms/game";
import { useCommandSession } from "@/lib/hooks/useCommandSession";
import { useTyping } from "@/lib/hooks/useTyping";
import { ShellPrompt } from "@/components/terminal/ShellPrompt";

type TypingSurfaceProps = {
  username?: string;
  branch?: string;
  loading?: boolean;
  disabled?: boolean;
  text?: string;
  onProgress?: (index: number, wpm: number) => void;
  onFinish?: () => void;
  onStatsChange?: (stats: { wpm: number; accuracy: number; elapsedMs: number }) => void;
};

function segmentClass(errorIndices: Set<number> | number[], index: number): string {
  const hasError =
    errorIndices instanceof Set ? errorIndices.has(index) : errorIndices.includes(index);
  return hasError ? "text-destructive" : "text-terminal-fg";
}

function CursorCell({
  showCursor,
  children,
}: {
  showCursor: boolean;
  children?: string;
}) {
  return (
    <span className="relative inline-block min-w-[1ch] leading-none text-terminal-muted">
      {showCursor && (
        <span
          aria-hidden
          className="pointer-events-none absolute inset-x-0 -top-px -bottom-0.5 bg-terminal-fg animate-terminal-cursor-blink"
        />
      )}
      <span className="relative">{children ?? "\u00A0"}</span>
    </span>
  );
}

function renderChar(
  text: string,
  index: number,
  errorIndices: Set<number> | number[],
  showCursor: boolean,
) {
  const char = text[index] ?? "";
  if (showCursor) {
    return <CursorCell showCursor>{char}</CursorCell>;
  }
  return <span className={segmentClass(errorIndices, index)}>{char}</span>;
}

function renderCommandLine(
  command: string,
  typedChars: string[],
  cursorIndex: number,
  errorIndices: Set<number> | number[],
  showCursor: boolean,
  muted: boolean,
) {
  if (muted) {
    return <span className="text-terminal-muted">{command}</span>;
  }

  const nodes: React.ReactNode[] = [];
  const typedEnd = Math.min(typedChars.length, command.length);

  for (let i = 0; i < typedEnd; i++) {
    if (showCursor && i === cursorIndex) {
      nodes.push(<span key={`cursor-${i}`}>{renderChar(command, i, errorIndices, true)}</span>);
    } else {
      nodes.push(
        <span key={`typed-${i}`} className={segmentClass(errorIndices, i)}>
          {command[i]}
        </span>,
      );
    }
  }

  const cursorOnNextChar = showCursor && cursorIndex === typedEnd;
  if (cursorOnNextChar) {
    nodes.push(<span key="cursor-end">{renderChar(command, typedEnd, errorIndices, true)}</span>);
  }

  const remainingStart = cursorOnNextChar ? typedEnd + 1 : typedEnd;
  if (remainingStart < command.length) {
    nodes.push(
      <span key="remaining" className="text-terminal-muted">
        {command.slice(remainingStart)}
      </span>,
    );
  }

  return nodes;
}

function SessionLines({
  session,
  username,
  branch,
  typing,
  showCursor,
}: {
  session: CommandSession;
  username: string;
  branch: string;
  typing: ReturnType<typeof useTyping>;
  showCursor: boolean;
}) {
  const activeLineRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    activeLineRef.current?.scrollIntoView({ block: "nearest" });
  }, [session.activeIndex]);

  return (
    <>
      {session.commands.map((command, index) => {
        const isCompleted = index < session.activeIndex;
        const isActive = index === session.activeIndex;
        const isFuture = index > session.activeIndex;

        return (
          <div key={`${index}-${command}`} ref={isActive ? activeLineRef : undefined} className="leading-relaxed">
            <ShellPrompt username={username} branch={branch} />
            {isCompleted &&
              renderCommandLine(
                command,
                session.completedTyped[index] ?? [],
                command.length,
                session.completedErrors[index] ?? [],
                false,
                false,
              )}
            {isActive &&
              renderCommandLine(
                command,
                typing.state.typedChars,
                typing.state.cursorIndex,
                typing.errorIndices,
                showCursor,
                false,
              )}
            {isFuture && renderCommandLine(command, [], 0, [], false, true)}
          </div>
        );
      })}
    </>
  );
}

function SingleLineSurface({
  text,
  username,
  branch,
  loading,
  disabled,
  onProgress,
  onFinish,
  onStatsChange,
}: {
  text: string;
  username: string;
  branch: string;
  loading?: boolean;
  disabled?: boolean;
  onProgress?: (index: number, wpm: number) => void;
  onFinish?: () => void;
  onStatsChange?: (stats: { wpm: number; accuracy: number; elapsedMs: number }) => void;
}) {
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

  const showCursor = !disabled && !isFinished && !loading;

  return (
    <div className="relative flex min-h-0 flex-1 flex-col" onClick={focus}>
      <ScrollArea className="flex-1 p-4">
        <pre className="whitespace-pre-wrap break-all leading-relaxed font-mono text-sm">
          <ShellPrompt username={username} branch={branch} />
          {renderCommandLine(
            text,
            state.typedChars,
            state.cursorIndex,
            errorIndices,
            showCursor,
            false,
          )}
        </pre>
      </ScrollArea>
      <textarea
        ref={inputRef}
        className="absolute inset-0 cursor-text resize-none opacity-0"
        value=""
        readOnly
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

function SessionSurface({
  username,
  branch,
  loading,
  disabled,
  onStatsChange,
}: {
  username: string;
  branch: string;
  loading?: boolean;
  disabled?: boolean;
  onStatsChange?: (stats: { wpm: number; accuracy: number; elapsedMs: number }) => void;
}) {
  const { session, typing, isSessionFinished } = useCommandSession({
    onStatsChange,
    disabled: disabled || loading,
  });

  useEffect(() => {
    if (!loading && session) typing.focus();
  }, [loading, session, session?.activeIndex, typing]);

  if (!session) return null;

  const showCursor = !disabled && !isSessionFinished && !loading;

  return (
    <div className="relative flex min-h-0 flex-1 flex-col" onClick={typing.focus}>
      <ScrollArea className="flex-1 p-4">
        <div className="whitespace-pre-wrap break-all font-mono text-sm">
          <SessionLines
            session={session}
            username={username}
            branch={branch}
            typing={typing}
            showCursor={showCursor}
          />
        </div>
      </ScrollArea>
      <textarea
        ref={typing.inputRef}
        className="absolute inset-0 cursor-text resize-none opacity-0"
        value=""
        readOnly
        onKeyDown={typing.handleKeyDown}
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
        spellCheck={false}
        aria-label="Typing input"
      />
    </div>
  );
}

export function TypingSurface({
  username = "",
  branch = "practice",
  loading,
  disabled,
  text,
  onProgress,
  onFinish,
  onStatsChange,
}: TypingSurfaceProps) {
  if (loading) {
    return (
      <div className="flex flex-1 flex-col gap-2 p-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-4 w-full bg-muted/30" />
        ))}
      </div>
    );
  }

  if (text) {
    return (
      <SingleLineSurface
        text={text}
        username={username}
        branch={branch}
        loading={loading}
        disabled={disabled}
        onProgress={onProgress}
        onFinish={onFinish}
        onStatsChange={onStatsChange}
      />
    );
  }

  return (
    <SessionSurface
      username={username}
      branch={branch}
      loading={loading}
      disabled={disabled}
      onStatsChange={onStatsChange}
    />
  );
}
