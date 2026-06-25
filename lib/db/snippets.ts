import { cache } from "react";
import type { Snippet } from "@/lib/db/schema";
import { queryRandomSnippet, queryRaceSnippet } from "@/lib/db/queries/snippets";

export const fetchRandomSnippet = cache(async (): Promise<Snippet | null> => {
  return queryRandomSnippet();
});

export const fetchRaceSnippet = cache(async (): Promise<Snippet | null> => {
  return queryRaceSnippet();
});
