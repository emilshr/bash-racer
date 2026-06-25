"use client";

import { useCallback } from "react";
import { useAtom } from "jotai";
import {
  commandSessionAtom,
  createCommandSession,
  sessionProgressChars,
  sessionTotalChars,
} from "@/lib/atoms/game";
import { useTyping } from "@/lib/hooks/useTyping";

type UseCommandSessionOptions = {
  onStatsChange?: (stats: { wpm: number; accuracy: number; elapsedMs: number }) => void;
  disabled?: boolean;
};

export function useCommandSession({ onStatsChange, disabled }: UseCommandSessionOptions) {
  const [session, setSession] = useAtom(commandSessionAtom);

  const activeCommand = session?.commands[session.activeIndex] ?? "";
  const isSessionFinished =
    session !== null && session.activeIndex >= session.commands.length;

  const handleLineComplete = useCallback(
    (snapshot: { typedChars: string[]; errorIndices: number[] }) => {
      setSession((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          activeIndex: prev.activeIndex + 1,
          completedTyped: [...prev.completedTyped, snapshot.typedChars],
          completedErrors: [...prev.completedErrors, snapshot.errorIndices],
        };
      });
    },
    [setSession],
  );

  const typing = useTyping({
    text: activeCommand,
    disabled: disabled || isSessionFinished || !activeCommand,
    onLineComplete: handleLineComplete,
    onStatsChange,
  });

  const totalChars = session ? sessionTotalChars(session) : 0;
  const progressChars = session
    ? sessionProgressChars(session, typing.state.typedChars.length)
    : 0;

  const loadSession = useCallback(
    (commands: string[]) => {
      setSession(createCommandSession(commands));
    },
    [setSession],
  );

  return {
    session,
    typing,
    isSessionFinished,
    totalChars,
    progressChars,
    loadSession,
  };
}
