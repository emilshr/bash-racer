import { cache } from "react";
import type { Snippet } from "@/lib/db/schema";
import { SESSION_COMMAND_COUNT } from "@/lib/constants/session";
import {
  queryRandomCommands,
  queryRandomSnippet,
  queryRaceSnippet,
} from "@/lib/db/queries/snippets";

export const fetchRandomSnippet = cache(async (): Promise<Snippet | null> => {
  return queryRandomSnippet();
});

export const fetchRandomSessionCommands = cache(
  async (count = SESSION_COMMAND_COUNT): Promise<string[]> => {
    const commands = await queryRandomCommands(count);
    if (commands.length === 0) {
      throw new Error("No practice commands found in database. Run pnpm db:seed.");
    }
    return commands;
  },
);

export const fetchRaceSnippet = cache(async (): Promise<Snippet | null> => {
  return queryRaceSnippet();
});
