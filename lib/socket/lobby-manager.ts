import type { Redis } from "@upstash/redis";
import { v4 as uuidv4 } from "uuid";
import type { Snippet } from "@/lib/db/schema";
import { getRaceSnippet } from "@/lib/actions/snippets";
import { getUpstashRedis } from "@/lib/redis/upstash";
import {
  LOBBY_CONSTANTS,
  type LobbyState,
  type LobbyStatus,
  type PlayerState,
} from "./events";

type StoredLobby = {
  id: string;
  status: LobbyStatus;
  countdownEndsAt: number | null;
  startedAt: number | null;
  snippet: Snippet | null;
};

class MemoryStore {
  private lobbies = new Map<string, StoredLobby>();
  private players = new Map<string, Map<string, PlayerState>>();
  private playerSessions = new Map<string, { lobbyId: string }>();
  private openLobbies = new Set<string>();
  private timers = new Map<string, NodeJS.Timeout>();

  async getLobby(id: string): Promise<StoredLobby | null> {
    return this.lobbies.get(id) ?? null;
  }

  async setLobby(lobby: StoredLobby) {
    this.lobbies.set(lobby.id, lobby);
  }

  async getPlayers(lobbyId: string): Promise<Map<string, PlayerState>> {
    if (!this.players.has(lobbyId)) this.players.set(lobbyId, new Map());
    return this.players.get(lobbyId)!;
  }

  async getOpenLobbies(): Promise<string[]> {
    return [...this.openLobbies];
  }

  async addOpenLobby(id: string) {
    this.openLobbies.add(id);
  }

  async removeOpenLobby(id: string) {
    this.openLobbies.delete(id);
  }

  async setPlayerSession(playerId: string, lobbyId: string) {
    this.playerSessions.set(playerId, { lobbyId });
  }

  async deletePlayerSession(playerId: string) {
    this.playerSessions.delete(playerId);
  }

  setTimer(lobbyId: string, timer: NodeJS.Timeout) {
    const existing = this.timers.get(lobbyId);
    if (existing) clearTimeout(existing);
    this.timers.set(lobbyId, timer);
  }

  clearTimer(lobbyId: string) {
    const t = this.timers.get(lobbyId);
    if (t) clearTimeout(t);
    this.timers.delete(lobbyId);
  }
}

export class LobbyManager {
  private memory = new MemoryStore();
  private redis: Redis | null = getUpstashRedis();
  private onBroadcast: (lobbyId: string, event: string, data: unknown) => void;
  private onStartRace: (lobbyId: string) => Promise<void>;

  constructor(
    onBroadcast: (lobbyId: string, event: string, data: unknown) => void,
    onStartRace: (lobbyId: string) => Promise<void>,
  ) {
    this.onBroadcast = onBroadcast;
    this.onStartRace = onStartRace;
  }

  private lobbyKey(id: string) {
    return `lobby:${id}`;
  }

  private playersKey(id: string) {
    return `lobby:${id}:players`;
  }

  private async getStoredLobby(id: string): Promise<StoredLobby | null> {
    if (this.redis) {
      const raw = await this.redis.get<string>(this.lobbyKey(id));
      return raw ? JSON.parse(raw) : null;
    }
    return this.memory.getLobby(id);
  }

  private async saveLobby(lobby: StoredLobby) {
    if (this.redis) {
      await this.redis.set(this.lobbyKey(lobby.id), JSON.stringify(lobby), {
        ex: LOBBY_CONSTANTS.LOBBY_TTL_SEC,
      });
    } else {
      await this.memory.setLobby(lobby);
    }
  }

  private async getPlayersMap(lobbyId: string): Promise<PlayerState[]> {
    if (this.redis) {
      const raw = await this.redis.hgetall<Record<string, string>>(this.playersKey(lobbyId));
      if (!raw) return [];
      return Object.values(raw).map((v) => JSON.parse(v));
    }
    const map = await this.memory.getPlayers(lobbyId);
    return [...map.values()];
  }

  private async setPlayer(lobbyId: string, player: PlayerState) {
    if (this.redis) {
      await this.redis.hset(this.playersKey(lobbyId), {
        [player.playerId]: JSON.stringify(player),
      });
      await this.redis.expire(this.playersKey(lobbyId), LOBBY_CONSTANTS.LOBBY_TTL_SEC);
    } else {
      const map = await this.memory.getPlayers(lobbyId);
      map.set(player.playerId, player);
    }
  }

  private async removePlayer(lobbyId: string, playerId: string) {
    if (this.redis) {
      await this.redis.hdel(this.playersKey(lobbyId), playerId);
    } else {
      const map = await this.memory.getPlayers(lobbyId);
      map.delete(playerId);
    }
  }

  async buildLobbyState(lobbyId: string): Promise<LobbyState | null> {
    const lobby = await this.getStoredLobby(lobbyId);
    if (!lobby) return null;
    const players = await this.getPlayersMap(lobbyId);
    return { ...lobby, players };
  }

  private async findOpenLobby(): Promise<string | null> {
    const openIds = this.redis
      ? ((await this.redis.smembers("lobbies:open")) ?? [])
      : await this.memory.getOpenLobbies();

    for (const id of openIds) {
      const lobby = await this.getStoredLobby(id);
      if (!lobby || lobby.status === "racing" || lobby.status === "finished") continue;
      const players = await this.getPlayersMap(id);
      if (players.length < LOBBY_CONSTANTS.MAX_PLAYERS) return id;
    }
    return null;
  }

  private async createLobby(): Promise<string> {
    const id = uuidv4();
    const lobby: StoredLobby = {
      id,
      status: "waiting",
      countdownEndsAt: null,
      startedAt: null,
      snippet: null,
    };
    await this.saveLobby(lobby);
    if (this.redis) {
      await this.redis.sadd("lobbies:open", id);
    } else {
      await this.memory.addOpenLobby(id);
    }
    return id;
  }

  private async broadcastState(lobbyId: string) {
    const state = await this.buildLobbyState(lobbyId);
    if (!state) return;
    this.onBroadcast(lobbyId, "lobby:state", {
      lobbyId,
      players: state.players,
      status: state.status,
      countdownEndsAt: state.countdownEndsAt,
    });
  }

  private scheduleCountdown(lobbyId: string) {
    const endsAt = Date.now() + LOBBY_CONSTANTS.LOBBY_TIMER_MS;
    const timer = setTimeout(() => void this.onCountdownEnd(lobbyId), LOBBY_CONSTANTS.LOBBY_TIMER_MS);

    if (!this.redis) this.memory.setTimer(lobbyId, timer);

    void (async () => {
      const lobby = await this.getStoredLobby(lobbyId);
      if (!lobby) return;
      lobby.status = "countdown";
      lobby.countdownEndsAt = endsAt;
      await this.saveLobby(lobby);
      this.onBroadcast(lobbyId, "lobby:countdown", { endsAt });
      await this.broadcastState(lobbyId);
    })();
  }

  private async onCountdownEnd(lobbyId: string) {
    const lobby = await this.getStoredLobby(lobbyId);
    if (!lobby || lobby.status !== "countdown") return;

    const players = await this.getPlayersMap(lobbyId);
    if (players.length >= LOBBY_CONSTANTS.MIN_PLAYERS) {
      await this.onStartRace(lobbyId);
    } else {
      lobby.status = "waiting";
      lobby.countdownEndsAt = null;
      await this.saveLobby(lobby);
      await this.broadcastState(lobbyId);
    }
  }

  async joinLobby(playerId: string, username: string): Promise<LobbyState> {
    let lobbyId = await this.findOpenLobby();
    if (!lobbyId) lobbyId = await this.createLobby();

    const players = await this.getPlayersMap(lobbyId);
    const existing = players.find((p) => p.playerId === playerId);
    if (!existing) {
      if (players.length >= LOBBY_CONSTANTS.MAX_PLAYERS) {
        lobbyId = await this.createLobby();
      }
      await this.setPlayer(lobbyId, {
        playerId,
        username,
        progress: 0,
        wpm: 0,
        finished: false,
      });
    }

    if (this.redis) {
      await this.redis.set(`player:${playerId}`, JSON.stringify({ lobbyId }), {
        ex: LOBBY_CONSTANTS.LOBBY_TTL_SEC,
      });
    } else {
      await this.memory.setPlayerSession(playerId, lobbyId);
    }

    const updatedPlayers = await this.getPlayersMap(lobbyId);
    const lobby = await this.getStoredLobby(lobbyId);

    if (lobby && lobby.status === "waiting" && updatedPlayers.length >= LOBBY_CONSTANTS.MIN_PLAYERS) {
      this.scheduleCountdown(lobbyId);
    }

    if (updatedPlayers.length >= LOBBY_CONSTANTS.MAX_PLAYERS && lobby?.status === "countdown") {
      if (!this.redis) this.memory.clearTimer(lobbyId);
      await this.onStartRace(lobbyId);
    }

    await this.broadcastState(lobbyId);
    const state = await this.buildLobbyState(lobbyId);
    if (!state) throw new Error("Failed to join lobby");
    return state;
  }

  async rejoinLobby(playerId: string, lobbyId: string): Promise<LobbyState | null> {
    const lobby = await this.getStoredLobby(lobbyId);
    if (!lobby || lobby.status === "finished") return null;

    const players = await this.getPlayersMap(lobbyId);
    if (!players.find((p) => p.playerId === playerId)) return null;

    await this.broadcastState(lobbyId);
    return this.buildLobbyState(lobbyId);
  }

  async startRace(lobbyId: string) {
    const lobby = await this.getStoredLobby(lobbyId);
    if (!lobby || lobby.status === "racing") return;

    const snippet = await getRaceSnippet();
    if (!snippet) return;

    lobby.status = "racing";
    lobby.startedAt = Date.now();
    lobby.countdownEndsAt = null;
    lobby.snippet = snippet;
    await this.saveLobby(lobby);

    if (this.redis) await this.redis.srem("lobbies:open", lobbyId);
    else await this.memory.removeOpenLobby(lobbyId);

    this.onBroadcast(lobbyId, "race:start", { snippet, startedAt: lobby.startedAt });
    await this.broadcastState(lobbyId);
  }

  async updateProgress(lobbyId: string, playerId: string, index: number, wpm: number) {
    const players = await this.getPlayersMap(lobbyId);
    const player = players.find((p) => p.playerId === playerId);
    if (!player) return;

    player.progress = index;
    player.wpm = wpm;

    const lobby = await this.getStoredLobby(lobbyId);
    const snippetLen = lobby?.snippet?.content.length ?? 0;
    if (snippetLen > 0 && index >= snippetLen) {
      player.finished = true;
    }

    await this.setPlayer(lobbyId, player);
    const updated = await this.getPlayersMap(lobbyId);
    this.onBroadcast(lobbyId, "race:update", { players: updated });

    if (lobby?.snippet && updated.every((p) => p.finished)) {
      await this.endRace(lobbyId);
    }
  }

  async endRace(lobbyId: string) {
    const lobby = await this.getStoredLobby(lobbyId);
    if (!lobby) return;

    lobby.status = "finished";
    await this.saveLobby(lobby);

    const standings = (await this.getPlayersMap(lobbyId)).sort(
      (a, b) => b.progress - a.progress || b.wpm - a.wpm,
    );
    this.onBroadcast(lobbyId, "race:end", { standings });

    setTimeout(() => void this.cleanupLobby(lobbyId), 60_000);
  }

  async cleanupLobby(lobbyId: string) {
    if (this.redis) {
      await this.redis.del(this.lobbyKey(lobbyId));
      await this.redis.del(this.playersKey(lobbyId));
      await this.redis.srem("lobbies:open", lobbyId);
    }
  }

  async leaveLobby(lobbyId: string, playerId: string) {
    await this.removePlayer(lobbyId, playerId);
    if (!this.redis) await this.memory.deletePlayerSession(playerId);
    else await this.redis.del(`player:${playerId}`);
    await this.broadcastState(lobbyId);
  }
}
