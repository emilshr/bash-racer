import { atomWithStorage, createJSONStorage } from "jotai/utils";
import {
  adjectives,
  animals,
  uniqueNamesGenerator,
} from "unique-names-generator";

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
  "bash-racer-player-id",
  "",
  sessionStorage(),
);

export const usernameAtom = atomWithStorage<string>(
  "bash-racer-username",
  "",
  sessionStorage(),
);

export const playerSessionAtom = atomWithStorage<{ playerId: string; lobbyId: string } | null>(
  "bash-racer-session",
  null,
  sessionStorage(),
);

export function generateUsername() {
  return uniqueNamesGenerator({
    dictionaries: [adjectives, animals],
    separator: "-",
    length: 2,
    style: "lowerCase",
  });
}
