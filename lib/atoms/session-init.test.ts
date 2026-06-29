import assert from "node:assert/strict";
import { createStore } from "jotai/vanilla";
import { ensurePlayerSession } from "@/lib/atoms/session-init";
import { playerIdAtom, usernameAtom } from "@/lib/atoms/session";

function test(name: string, fn: () => void | Promise<void>) {
  return Promise.resolve(fn())
    .then(() => console.log(`ok ${name}`))
    .catch((err) => {
      console.error(`fail ${name}`);
      throw err;
    });
}

void (async () => {
  await test("ensurePlayerSession sets atoms on the provided store", async () => {
    const store = createStore();
    assert.equal(store.get(usernameAtom), "");
    assert.equal(store.get(playerIdAtom), "");

    const { playerId, username } = await ensurePlayerSession(store);

    assert.ok(playerId.length > 0);
    assert.ok(username.length > 0);
    assert.equal(store.get(playerIdAtom), playerId);
    assert.equal(store.get(usernameAtom), username);
  });

  await test("ensurePlayerSession does not leak across stores", async () => {
    const providerStore = createStore();
    const otherStore = createStore();

    const session = await ensurePlayerSession(providerStore);

    assert.equal(providerStore.get(usernameAtom), session.username);
    assert.equal(otherStore.get(usernameAtom), "");
  });

  console.log("All session-init tests passed");
})();
