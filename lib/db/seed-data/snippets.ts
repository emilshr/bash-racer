import { commandSnippets } from "./commands";

export type SeedSnippet = {
  title: string;
  content: string;
  category: "command" | "pipeline" | "script" | "loop" | "function";
  difficulty: "easy" | "medium" | "hard";
};

export const seedSnippets: SeedSnippet[] = [...commandSnippets];
