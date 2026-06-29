import { and, inArray, lte, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { snippets, type Snippet } from "@/lib/db/schema";
import { SESSION_COMMAND_COUNT } from "@/lib/constants/session";
import { LOBBY_CONSTANTS } from "@/lib/socket/events";

const PRACTICE_CATEGORIES = ["command", "pipeline"] as const;
const RACE_CATEGORIES = ["pipeline"] as const;

export async function queryRandomCommands(
  count: number = SESSION_COMMAND_COUNT,
): Promise<string[]> {
  const safeCount = Math.max(1, Math.min(count, SESSION_COMMAND_COUNT));

  const rows = await db
    .select({ content: snippets.content })
    .from(snippets)
    .where(inArray(snippets.category, [...PRACTICE_CATEGORIES]))
    .orderBy(sql`random()`)
    .limit(safeCount);

  return rows.map((row) => row.content);
}

export async function queryRandomSnippet(maxChars?: number): Promise<Snippet | null> {
  const rows = await db
    .select()
    .from(snippets)
    .where(maxChars ? lte(snippets.charCount, maxChars) : undefined)
    .orderBy(sql`random()`)
    .limit(1);
  return rows[0] ?? null;
}

export async function queryRaceSnippet(): Promise<Snippet | null> {
  const pipelineRows = await db
    .select()
    .from(snippets)
    .where(
      and(
        inArray(snippets.category, [...RACE_CATEGORIES]),
        lte(snippets.charCount, LOBBY_CONSTANTS.RACE_SNIPPET_MAX_CHARS),
      ),
    )
    .orderBy(sql`random()`)
    .limit(1);

  if (pipelineRows[0]) return pipelineRows[0];

  return queryRandomSnippet(LOBBY_CONSTANTS.RACE_SNIPPET_MAX_CHARS);
}
