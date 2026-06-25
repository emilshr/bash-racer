import { sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { snippets, type Snippet } from "@/lib/db/schema";
import { LOBBY_CONSTANTS } from "@/lib/socket/events";

export async function queryRandomCommands(count: number): Promise<string[]> {
  const rows = await db
    .select()
    .from(snippets)
    .orderBy(sql`random()`)
    .limit(count);
  return rows.map((row) => row.content);
}

export async function queryRandomSnippet(maxChars?: number): Promise<Snippet | null> {
  const rows = await db
    .select()
    .from(snippets)
    .where(maxChars ? sql`${snippets.charCount} <= ${maxChars}` : undefined)
    .orderBy(sql`random()`)
    .limit(1);
  return rows[0] ?? null;
}

export function queryRaceSnippet(): Promise<Snippet | null> {
  return queryRandomSnippet(LOBBY_CONSTANTS.RACE_SNIPPET_MAX_CHARS);
}
