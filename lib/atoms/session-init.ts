import type { createStore } from "jotai/vanilla";
import { getDefaultStore } from "jotai";
import { generateUsername, playerIdAtom, usernameAtom } from "@/lib/atoms/session";

type AppStore = ReturnType<typeof createStore>;

export async function ensurePlayerSession(
  store: AppStore = getDefaultStore(),
): Promise<{ playerId: string; username: string }> {
  let playerId = store.get(playerIdAtom);
  if (!playerId) {
    playerId = crypto.randomUUID();
    store.set(playerIdAtom, playerId);
  }

  let username = store.get(usernameAtom);
  if (!username) {
    username = await generateUsername();
    store.set(usernameAtom, username);
  }

  return { playerId, username };
}
