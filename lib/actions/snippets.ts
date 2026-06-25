"use server";

import { fetchRandomSessionCommands, fetchRandomSnippet, fetchRaceSnippet } from "@/lib/db/snippets";

export async function getRandomSnippet() {
  return fetchRandomSnippet();
}

export async function getRandomSession() {
  return fetchRandomSessionCommands();
}

export async function getRaceSnippet() {
  return fetchRaceSnippet();
}
