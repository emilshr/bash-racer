const LEGACY_TO_VERSIONED = [
  { storage: "session", legacy: "bash-racer-player-id", versioned: "bash-racer-player-id:v1" },
  { storage: "session", legacy: "bash-racer-username", versioned: "bash-racer-username:v1" },
  { storage: "session", legacy: "bash-racer-session", versioned: "bash-racer-session:v1" },
  { storage: "local", legacy: "bash-racer-mode", versioned: "bash-racer-mode:v1" },
] as const;

function migrateKey(
  storage: Storage,
  legacyKey: string,
  versionedKey: string,
) {
  const legacy = storage.getItem(legacyKey);
  if (legacy && !storage.getItem(versionedKey)) {
    storage.setItem(versionedKey, legacy);
    storage.removeItem(legacyKey);
  }
}

export function migrateLegacyStorage() {
  if (typeof window === "undefined") return;

  for (const entry of LEGACY_TO_VERSIONED) {
    const storage = entry.storage === "session" ? window.sessionStorage : window.localStorage;
    migrateKey(storage, entry.legacy, entry.versioned);
  }
}
