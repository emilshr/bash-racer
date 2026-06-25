import { atomWithStorage, createJSONStorage } from "jotai/utils";

const STORAGE_VERSION = "v1";

const noopStorage = {
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {},
};

const sessionStorage = <T>() =>
  createJSONStorage<T>(() =>
    typeof window !== "undefined" ? window.sessionStorage : noopStorage,
  );

export const playerIdAtom = atomWithStorage<string>(
  `bash-racer-player-id:${STORAGE_VERSION}`,
  "",
  sessionStorage(),
);

export const usernameAtom = atomWithStorage<string>(
  `bash-racer-username:${STORAGE_VERSION}`,
  "",
  sessionStorage(),
);

export const playerSessionAtom = atomWithStorage<{ playerId: string; lobbyId: string } | null>(
  `bash-racer-session:${STORAGE_VERSION}`,
  null,
  sessionStorage(),
);

export async function generateUsername() {
  const { uniqueNamesGenerator, adjectives, animals } = await import("unique-names-generator");
  return uniqueNamesGenerator({
    dictionaries: [adjectives, animals],
    separator: "-",
    length: 2,
    style: "lowerCase",
  });
}
