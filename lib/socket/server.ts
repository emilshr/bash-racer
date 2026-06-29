import type { Server as HttpServer } from "node:http";
import { Redis } from "ioredis";
import { createAdapter } from "@socket.io/redis-adapter";
import { Server } from "socket.io";
import { env } from "@/lib/env";
import { LobbyManager } from "./lobby-manager";
import type { ClientToServerEvents, ServerToClientEvents, SocketData } from "./events";

let io: Server<
  ClientToServerEvents,
  ServerToClientEvents,
  Record<string, never>,
  SocketData
> | null = null;
let lobbyManager: LobbyManager | null = null;

export function getIO() {
  return io;
}

export function initSocketServer(httpServer: HttpServer) {
  if (io) return io;

  io = new Server<ClientToServerEvents, ServerToClientEvents, Record<string, never>, SocketData>(
    httpServer,
    {
      cors: { origin: "*" },
      transports: ["websocket", "polling"],
    },
  );

  if (env.REDIS_URL) {
    const pubClient = new Redis(env.REDIS_URL, { maxRetriesPerRequest: null });
    const subClient = pubClient.duplicate();
    io.adapter(createAdapter(pubClient, subClient));
    console.log("> Socket.IO Redis adapter enabled");
  } else if (env.NODE_ENV === "production" && env.KV_REST_API_URL && env.KV_REST_API_TOKEN) {
    console.warn(
      "> KV_REST_API_* is set but REDIS_URL is missing — lobby state is shared but Socket.IO broadcasts are single-instance only",
    );
  }

  lobbyManager = new LobbyManager(
    (lobbyId, event, data) => {
      io?.to(lobbyId).emit(event as keyof ServerToClientEvents, data as never);
    },
    async (lobbyId) => {
      await lobbyManager?.startRace(lobbyId);
    },
  );

  io.on("connection", (socket) => {
    socket.on("lobby:join", async ({ playerId, username }) => {
      try {
        const state = await lobbyManager!.joinLobby(playerId, username);
        socket.data.playerId = playerId;
        socket.data.lobbyId = state.id;
        await socket.join(state.id);
        socket.emit("lobby:state", {
          lobbyId: state.id,
          players: state.players,
          status: state.status,
          countdownEndsAt: state.countdownEndsAt,
        });
      } catch {
        socket.emit("error", { message: "Failed to join lobby" });
      }
    });

    socket.on("lobby:rejoin", async ({ playerId, lobbyId }) => {
      try {
        const state = await lobbyManager!.rejoinLobby(playerId, lobbyId);
        if (!state) {
          socket.emit("error", { message: "Lobby no longer available" });
          return;
        }
        socket.data.playerId = playerId;
        socket.data.lobbyId = lobbyId;
        await socket.join(lobbyId);
        socket.emit("lobby:state", {
          lobbyId,
          players: state.players,
          status: state.status,
          countdownEndsAt: state.countdownEndsAt,
        });
        if (state.status === "racing" && state.snippet && state.startedAt) {
          socket.emit("race:start", { snippet: state.snippet, startedAt: state.startedAt });
        }
      } catch {
        socket.emit("error", { message: "Failed to rejoin lobby" });
      }
    });

    socket.on("race:progress", async ({ index, wpm }) => {
      const lobbyId = socket.data.lobbyId;
      const playerId = socket.data.playerId;
      if (!lobbyId || !playerId) return;
      await lobbyManager!.updateProgress(lobbyId, playerId, index, wpm);
    });

    socket.on("disconnect", async () => {
      const { playerId, lobbyId } = socket.data;
      if (!playerId || !lobbyId) return;

      const state = await lobbyManager!.buildLobbyState(lobbyId);
      if (!state || state.status === "racing" || state.status === "finished") return;

      await lobbyManager!.leaveLobby(lobbyId, playerId);
    });
  });

  return io;
}

export function getLobbyManager() {
  return lobbyManager;
}
