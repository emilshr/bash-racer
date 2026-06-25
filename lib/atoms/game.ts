import { atom } from "jotai";
import { atomWithStorage, createJSONStorage } from "jotai/utils";

export type GameMode = "offline" | "online";

const noopStorage = {
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {},
};

const localStorage = createJSONStorage<GameMode>(() =>
  typeof window !== "undefined" ? window.localStorage : noopStorage,
);

export const gameModeAtom = atomWithStorage<GameMode>("bash-racer-mode", "offline", localStorage);

export type TypingState = {
  cursorIndex: number;
  typedChars: string[];
  startedAt: number | null;
  finishedAt: number | null;
  totalKeystrokes: number;
  correctKeystrokes: number;
};

export const initialTypingState: TypingState = {
  cursorIndex: 0,
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
export const raceStartedAtAtom = atom<number | null>(null);
