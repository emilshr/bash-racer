import { atom } from "jotai";
import { atomWithStorage, createJSONStorage } from "jotai/utils";

export type GameMode = "offline" | "online";

const STORAGE_VERSION = "v1";

const noopStorage = {
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {},
};

const localStorage = createJSONStorage<GameMode>(() =>
  typeof window !== "undefined" ? window.localStorage : noopStorage,
);

export const gameModeAtom = atomWithStorage<GameMode>(
  `bash-racer-mode:${STORAGE_VERSION}`,
  "offline",
  localStorage,
);

export type TypingState = {
  cursorIndex: number;
  furthestIndex: number;
  lineLockIndex: number;
  typedChars: string[];
  startedAt: number | null;
  finishedAt: number | null;
  totalKeystrokes: number;
  correctKeystrokes: number;
};

export const initialTypingState: TypingState = {
  cursorIndex: 0,
  furthestIndex: 0,
  lineLockIndex: 0,
  typedChars: [],
  startedAt: null,
  finishedAt: null,
  totalKeystrokes: 0,
  correctKeystrokes: 0,
};

export const typingStateAtom = atom<TypingState>(initialTypingState);

export type PlayerProgress = {
  playerId: string;
  username: string;
  progress: number;
  wpm: number;
  finished: boolean;
};

export const raceProgressAtom = atom<PlayerProgress[]>([]);

export type LobbyStatus = "waiting" | "countdown" | "racing" | "finished";

export const lobbyStatusAtom = atom<LobbyStatus>("waiting");
export const lobbyCountdownEndsAtAtom = atom<number | null>(null);
export const currentSnippetAtom = atom<string>("");
export const SESSION_COMMAND_COUNT = 8;

export type CommandSession = {
  commands: string[];
  activeIndex: number;
  completedTyped: string[][];
  completedErrors: number[][];
};

export const commandSessionAtom = atom<CommandSession | null>(null);
export const raceStartedAtAtom = atom<number | null>(null);

export function createCommandSession(commands: string[]): CommandSession {
  return {
    commands,
    activeIndex: 0,
    completedTyped: [],
    completedErrors: [],
  };
}

export function sessionTotalChars(session: CommandSession): number {
  return session.commands.reduce((sum, cmd) => sum + cmd.length, 0);
}

export function sessionProgressChars(session: CommandSession, activeTypedLength = 0): number {
  let progress = 0;
  for (let i = 0; i < session.activeIndex; i++) {
    progress += session.commands[i]?.length ?? 0;
  }
  return progress + activeTypedLength;
}
