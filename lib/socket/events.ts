import type { Snippet } from "@/lib/db/schema";

export const LOBBY_CONSTANTS = {
  MAX_PLAYERS: 5,
  MIN_PLAYERS: 2,
  LOBBY_TIMER_MS: 30_000,
  LOBBY_TTL_SEC: 600,
  RACE_SNIPPET_MAX_CHARS: 500,
} as const;

export type LobbyStatus = "waiting" | "countdown" | "racing" | "finished";

export type PlayerState = {
  playerId: string;
  username: string;
  progress: number;
  wpm: number;
  finished: boolean;
};

export type LobbyState = {
  id: string;
  status: LobbyStatus;
  countdownEndsAt: number | null;
  startedAt: number | null;
  snippet: Snippet | null;
  players: PlayerState[];
};

export type ClientToServerEvents = {
  "lobby:join": (data: { playerId: string; username: string }) => void;
  "lobby:rejoin": (data: { playerId: string; lobbyId: string }) => void;
  "race:progress": (data: { playerId: string; index: number; wpm: number }) => void;
};

export type ServerToClientEvents = {
  "lobby:state": (data: {
    lobbyId: string;
    players: PlayerState[];
    status: LobbyStatus;
    countdownEndsAt: number | null;
  }) => void;
  "lobby:countdown": (data: { endsAt: number }) => void;
  "race:start": (data: { snippet: Snippet; startedAt: number }) => void;
  "race:update": (data: { players: PlayerState[] }) => void;
  "race:end": (data: { standings: PlayerState[] }) => void;
  error: (data: { message: string }) => void;
};

export type SocketData = {
  playerId: string;
  lobbyId: string;
};
