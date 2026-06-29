"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useAtom, useSetAtom, useStore } from "jotai";
import type { Socket } from "socket.io-client";
import {
  currentSnippetAtom,
  lobbyCountdownEndsAtAtom,
  lobbyStatusAtom,
  raceProgressAtom,
  raceStartedAtAtom,
  type LobbyStatus,
} from "@/lib/atoms/game";
import { playerSessionAtom } from "@/lib/atoms/session";
import { ensurePlayerSession } from "@/lib/atoms/session-init";
import type { ClientToServerEvents, ServerToClientEvents } from "@/lib/socket/events";

type AppSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

export function useSocket(enabled: boolean) {
  const store = useStore();
  const socketRef = useRef<AppSocket | null>(null);
  const [playerSession, setPlayerSession] = useAtom(playerSessionAtom);
  const playerSessionRef = useRef(playerSession);
  playerSessionRef.current = playerSession;

  const setRaceProgress = useSetAtom(raceProgressAtom);
  const setLobbyStatus = useSetAtom(lobbyStatusAtom);
  const setCountdownEndsAt = useSetAtom(lobbyCountdownEndsAtAtom);
  const setCurrentSnippet = useSetAtom(currentSnippetAtom);
  const setRaceStartedAt = useSetAtom(raceStartedAtAtom);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!enabled) return;

    let cancelled = false;

    void (async () => {
      const { playerId, username } = await ensurePlayerSession(store);
      if (cancelled) return;

      const { io } = await import("socket.io-client");
      if (cancelled) return;

      const socket: AppSocket = io({
        transports: ["websocket", "polling"],
        autoConnect: true,
        reconnection: true,
        reconnectionAttempts: 10,
        reconnectionDelay: 1000,
      });

      socketRef.current = socket;

      socket.on("connect", () => {
        setConnected(true);
        const session = playerSessionRef.current;
        if (session?.lobbyId) {
          socket.emit("lobby:rejoin", {
            playerId: session.playerId,
            lobbyId: session.lobbyId,
          });
        } else {
          socket.emit("lobby:join", { playerId, username });
        }
      });

      socket.on("lobby:state", (data) => {
        setPlayerSession((prev) => {
          if (prev?.lobbyId === data.lobbyId && prev?.playerId === playerId) return prev;
          return { playerId, lobbyId: data.lobbyId };
        });
        setRaceProgress(data.players);
        setLobbyStatus(data.status as LobbyStatus);
        setCountdownEndsAt(data.countdownEndsAt);
      });

      socket.on("lobby:countdown", (data) => {
        setLobbyStatus("countdown");
        setCountdownEndsAt(data.endsAt);
      });

      socket.on("race:start", (data) => {
        setLobbyStatus("racing");
        setCurrentSnippet(data.snippet.content);
        setRaceStartedAt(data.startedAt);
        setCountdownEndsAt(null);
      });

      socket.on("race:update", (data) => {
        setRaceProgress(data.players);
      });

      socket.on("race:end", (data) => {
        setLobbyStatus("finished");
        setRaceProgress(data.standings);
      });

      socket.on("error", () => {
        setPlayerSession(null);
      });

      socket.on("disconnect", () => {
        setConnected(false);
      });
    })();

    return () => {
      cancelled = true;
      socketRef.current?.disconnect();
      socketRef.current = null;
    };
  }, [
    enabled,
    store,
    setPlayerSession,
    setRaceProgress,
    setLobbyStatus,
    setCountdownEndsAt,
    setCurrentSnippet,
    setRaceStartedAt,
  ]);

  const emitProgress = useCallback((index: number, wpm: number) => {
    const socket = socketRef.current;
    if (socket?.connected) {
      socket.emit("race:progress", { index, wpm });
    }
  }, []);

  return { connected, emitProgress };
}
