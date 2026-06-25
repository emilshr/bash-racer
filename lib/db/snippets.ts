import { cache } from "react";
import type { Snippet } from "@/lib/db/schema";
import {
  queryRandomCommands,
  queryRandomSnippet,
  queryRaceSnippet,
} from "@/lib/db/queries/snippets";

const DEFAULT_SESSION_SIZE = 8;

export const fetchRandomSnippet = cache(async (): Promise<Snippet | null> => {
  return queryRandomSnippet();
});

export const fetchRandomSessionCommands = cache(
  async (count = DEFAULT_SESSION_SIZE): Promise<string[]> => {
    return queryRandomCommands(count);
  },
);

export const fetchRaceSnippet = cache(async (): Promise<Snippet | null> => {
  return queryRaceSnippet();
});
