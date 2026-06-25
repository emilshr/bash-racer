"use server";

import { SESSION_COMMAND_COUNT } from "@/lib/constants/session";
import type { Snippet } from "@/lib/db/schema";
import { fetchRandomSessionCommands, fetchRaceSnippet } from "@/lib/db/snippets";

export async function getRandomSession(count = SESSION_COMMAND_COUNT): Promise<string[]> {
  return fetchRandomSessionCommands(count);
}

export async function getRaceSnippet(): Promise<Snippet | null> {
  return fetchRaceSnippet();
}
