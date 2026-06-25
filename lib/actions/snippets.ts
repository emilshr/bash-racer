"use server";

import { sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { snippets, type Snippet } from "@/lib/db/schema";
import { LOBBY_CONSTANTS } from "@/lib/socket/events";

async function fetchRandomSnippetFromDb(maxChars?: number): Promise<Snippet | null> {
  const rows = await db
    .select()
    .from(snippets)
    .where(maxChars ? sql`${snippets.charCount} <= ${maxChars}` : undefined)
    .orderBy(sql`random()`)
    .limit(1);
  return rows[0] ?? null;
}

export async function getRandomSnippet(): Promise<Snippet | null> {
  return fetchRandomSnippetFromDb();
}

export async function getRaceSnippet(): Promise<Snippet | null> {
  return fetchRandomSnippetFromDb(LOBBY_CONSTANTS.RACE_SNIPPET_MAX_CHARS);
}
