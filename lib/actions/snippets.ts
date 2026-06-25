"use server";

import { fetchRandomSnippet, fetchRaceSnippet } from "@/lib/db/snippets";

export async function getRandomSnippet() {
  return fetchRandomSnippet();
}

export async function getRaceSnippet() {
  return fetchRaceSnippet();
}
