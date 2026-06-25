"use client";

import { useEffect, useRef, useState } from "react";
import { useAtom, useSetAtom } from "jotai";
import { io, type Socket } from "socket.io-client";
import {
  currentSnippetAtom,
  lobbyCountdownEndsAtAtom,
  lobbyStatusAtom,
  raceProgressAtom,
  raceStartedAtAtom,
  type LobbyStatus,
} from "@/lib/atoms/game";
import { playerIdAtom, playerSessionAtom, usernameAtom, generateUsername } from "@/lib/atoms/session";
import type { ClientToServerEvents, ServerToClientEvents } from "@/lib/socket/events";

type AppSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

export function useSocket(enabled: boolean) {
  const socketRef = useRef<AppSocket | null>(null);
  const [playerId, setPlayerId] = useAtom(playerIdAtom);
  const [username, setUsername] = useAtom(usernameAtom);
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

    let id = playerId;
    if (!id) {
      id = crypto.randomUUID();
      setPlayerId(id);
    }
    let name = username;
    if (!name) {
      name = generateUsername();
      setUsername(name);
    }

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
        socket.emit("lobby:join", { playerId: id, username: name });
      }
    });

    socket.on("lobby:state", (data) => {
      setPlayerSession((prev) => {
        if (prev?.lobbyId === data.lobbyId && prev?.playerId === id) return prev;
        return { playerId: id, lobbyId: data.lobbyId };
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

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [
    enabled,
    playerId,
    username,
    setPlayerId,
    setUsername,
    setPlayerSession,
    setRaceProgress,
    setLobbyStatus,
    setCountdownEndsAt,
    setCurrentSnippet,
    setRaceStartedAt,
  ]);

  const emitProgress = (index: number, wpm: number) => {
    const socket = socketRef.current;
    if (socket?.connected) {
      socket.emit("race:progress", { index, wpm });
    }
  };

  return { connected, emitProgress };
}
