import type { Redis } from "@upstash/redis";
import { v4 as uuidv4 } from "uuid";
import type { Snippet } from "@/lib/db/schema";
import { queryRaceSnippet } from "@/lib/db/queries/snippets";
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

function parseStoredJson<T>(raw: unknown): T | null {
  if (raw == null) return null;
  if (typeof raw === "string") return JSON.parse(raw) as T;
  return raw as T;
}

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

  async deleteLobby(id: string) {
    this.lobbies.delete(id);
    this.players.delete(id);
    this.openLobbies.delete(id);
    this.clearTimer(id);
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

  private countdownLockKey(id: string) {
    return `lock:countdown:${id}`;
  }

  private lobbyLockKey(id: string) {
    return `lock:lobby:${id}`;
  }

  private async withLobbyLock<T>(lobbyId: string, fn: () => Promise<T>): Promise<T> {
    if (!this.redis) return fn();

    const lockKey = this.lobbyLockKey(lobbyId);
    for (let attempt = 0; attempt < 20; attempt++) {
      const acquired = await this.redis.set(lockKey, "1", { nx: true, ex: 5 });
      if (acquired) {
        try {
          return await fn();
        } finally {
          await this.redis.del(lockKey);
        }
      }
      await new Promise((resolve) => setTimeout(resolve, 25 * (attempt + 1)));
    }

    throw new Error("Could not acquire lobby lock");
  }

  private async getStoredLobby(id: string): Promise<StoredLobby | null> {
    if (this.redis) {
      const raw = await this.redis.get(this.lobbyKey(id));
      return parseStoredJson<StoredLobby>(raw);
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
      return Object.values(raw).map((v) => parseStoredJson<PlayerState>(v)!);
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
    const [lobby, players] = await Promise.all([
      this.getStoredLobby(lobbyId),
      this.getPlayersMap(lobbyId),
    ]);
    if (!lobby) return null;
    return { ...lobby, players };
  }

  private async findOpenLobby(): Promise<string | null> {
    const openIds = this.redis
      ? ((await this.redis.smembers("lobbies:open")) ?? [])
      : await this.memory.getOpenLobbies();

    for (const id of openIds) {
      const [lobby, players] = await Promise.all([
        this.getStoredLobby(id),
        this.getPlayersMap(id),
      ]);
      if (!lobby || lobby.status === "racing" || lobby.status === "finished") continue;
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

  private async broadcastState(lobbyId: string): Promise<LobbyState | null> {
    await this.maybeCompleteCountdown(lobbyId);
    const state = await this.buildLobbyState(lobbyId);
    if (!state) return null;
    this.onBroadcast(lobbyId, "lobby:state", {
      lobbyId,
      players: state.players,
      status: state.status,
      countdownEndsAt: state.countdownEndsAt,
    });
    return state;
  }

  private async maybeCompleteCountdown(lobbyId: string) {
    const lobby = await this.getStoredLobby(lobbyId);
    if (!lobby || lobby.status !== "countdown" || !lobby.countdownEndsAt) return;
    if (Date.now() < lobby.countdownEndsAt) return;
    await this.onCountdownEnd(lobbyId);
  }

  private scheduleCountdown(lobbyId: string) {
    const endsAt = Date.now() + LOBBY_CONSTANTS.LOBBY_TIMER_MS;
    const timer = setTimeout(() => void this.onCountdownEnd(lobbyId), LOBBY_CONSTANTS.LOBBY_TIMER_MS);
    this.memory.setTimer(lobbyId, timer);

    void (async () => {
      const lobby = await this.getStoredLobby(lobbyId);
      if (!lobby || lobby.status !== "waiting") return;

      lobby.status = "countdown";
      lobby.countdownEndsAt = endsAt;
      await this.saveLobby(lobby);
      this.onBroadcast(lobbyId, "lobby:countdown", { endsAt });
      await this.broadcastState(lobbyId);
    })();
  }

  private async onCountdownEnd(lobbyId: string) {
    if (this.redis) {
      const acquired = await this.redis.set(this.countdownLockKey(lobbyId), "1", {
        nx: true,
        ex: 60,
      });
      if (!acquired) return;
    } else {
      this.memory.clearTimer(lobbyId);
    }

    const lobby = await this.getStoredLobby(lobbyId);
    if (!lobby || lobby.status !== "countdown") return;
    if (lobby.countdownEndsAt && Date.now() < lobby.countdownEndsAt - 50) return;

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

    return this.withLobbyLock(lobbyId, async () => {
      let targetLobbyId = lobbyId;
      const players = await this.getPlayersMap(targetLobbyId);
      const existing = players.find((p) => p.playerId === playerId);

      if (!existing) {
        if (players.length >= LOBBY_CONSTANTS.MAX_PLAYERS) {
          targetLobbyId = await this.createLobby();
        }
        await this.setPlayer(targetLobbyId, {
          playerId,
          username,
          progress: 0,
          wpm: 0,
          finished: false,
        });
      }

      if (this.redis) {
        await this.redis.set(`player:${playerId}`, JSON.stringify({ lobbyId: targetLobbyId }), {
          ex: LOBBY_CONSTANTS.LOBBY_TTL_SEC,
        });
      } else {
        await this.memory.setPlayerSession(playerId, targetLobbyId);
      }

      const [updatedPlayers, lobby] = await Promise.all([
        this.getPlayersMap(targetLobbyId),
        this.getStoredLobby(targetLobbyId),
      ]);

      if (
        lobby &&
        lobby.status === "waiting" &&
        updatedPlayers.length >= LOBBY_CONSTANTS.MIN_PLAYERS
      ) {
        this.scheduleCountdown(targetLobbyId);
      }

      if (updatedPlayers.length >= LOBBY_CONSTANTS.MAX_PLAYERS && lobby?.status === "countdown") {
        this.memory.clearTimer(targetLobbyId);
        await this.onStartRace(targetLobbyId);
      }

      const state = await this.broadcastState(targetLobbyId);
      if (!state) throw new Error("Failed to join lobby");
      return state;
    });
  }

  async rejoinLobby(playerId: string, lobbyId: string): Promise<LobbyState | null> {
    const lobby = await this.getStoredLobby(lobbyId);
    if (!lobby || lobby.status === "finished") return null;

    const players = await this.getPlayersMap(lobbyId);
    if (!players.find((p) => p.playerId === playerId)) return null;

    await this.maybeCompleteCountdown(lobbyId);
    return this.broadcastState(lobbyId);
  }

  async startRace(lobbyId: string) {
    if (this.redis) {
      const acquired = await this.redis.set(`lock:start:${lobbyId}`, "1", { nx: true, ex: 60 });
      if (!acquired) return;
    }

    const lobby = await this.getStoredLobby(lobbyId);
    if (!lobby || lobby.status === "racing" || lobby.status === "finished") return;

    const snippet = await queryRaceSnippet();
    if (!snippet) return;

    lobby.status = "racing";
    lobby.startedAt = Date.now();
    lobby.countdownEndsAt = null;
    lobby.snippet = snippet;
    await this.saveLobby(lobby);

    this.memory.clearTimer(lobbyId);

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
    if (!lobby || lobby.status === "finished") return;

    lobby.status = "finished";
    await this.saveLobby(lobby);

    const standings = (await this.getPlayersMap(lobbyId)).sort(
      (a, b) => b.progress - a.progress || b.wpm - a.wpm,
    );
    this.onBroadcast(lobbyId, "race:end", { standings });

    setTimeout(() => void this.cleanupLobby(lobbyId), 60_000);
  }

  async cleanupLobby(lobbyId: string) {
    const players = await this.getPlayersMap(lobbyId);

    if (this.redis) {
      await Promise.all([
        this.redis.del(this.lobbyKey(lobbyId)),
        this.redis.del(this.playersKey(lobbyId)),
        this.redis.srem("lobbies:open", lobbyId),
        this.redis.del(this.countdownLockKey(lobbyId)),
        this.redis.del(`lock:start:${lobbyId}`),
        ...players.map((p) => this.redis!.del(`player:${p.playerId}`)),
      ]);
    } else {
      for (const player of players) {
        await this.memory.deletePlayerSession(player.playerId);
      }
      await this.memory.deleteLobby(lobbyId);
    }
  }

  async leaveLobby(lobbyId: string, playerId: string) {
    await this.withLobbyLock(lobbyId, async () => {
      await this.removePlayer(lobbyId, playerId);

      if (!this.redis) await this.memory.deletePlayerSession(playerId);
      else await this.redis.del(`player:${playerId}`);

      const lobby = await this.getStoredLobby(lobbyId);
      const players = await this.getPlayersMap(lobbyId);

      if (players.length === 0) {
        await this.cleanupLobby(lobbyId);
        return;
      }

      if (lobby?.status === "countdown" && players.length < LOBBY_CONSTANTS.MIN_PLAYERS) {
        lobby.status = "waiting";
        lobby.countdownEndsAt = null;
        await this.saveLobby(lobby);
        this.memory.clearTimer(lobbyId);
      }

      await this.broadcastState(lobbyId);
    });
  }
}
