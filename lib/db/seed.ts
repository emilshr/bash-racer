import { sql } from "drizzle-orm";
import { env } from "@/lib/env";
import { db } from "./index";
import { snippets } from "./schema";
import { seedSnippets } from "./seed-data/snippets";

async function seed() {
  if (!env.DATABASE_URL) {
    console.error("DATABASE_URL is required. Set it in .env.local or pass SKIP_ENV_VALIDATION only for schema tooling.");
    process.exit(1);
  }

  console.log(`Seeding ${seedSnippets.length} snippets...`);

  for (const snippet of seedSnippets) {
    await db
      .insert(snippets)
      .values({
        title: snippet.title,
        content: snippet.content,
        category: snippet.category,
        difficulty: snippet.difficulty,
        charCount: snippet.content.length,
      })
      .onConflictDoUpdate({
        target: snippets.title,
        set: {
          content: snippet.content,
          category: snippet.category,
          difficulty: snippet.difficulty,
          charCount: snippet.content.length,
        },
      });
  }

  const result = await db.select({ count: sql<number>`count(*)::int` }).from(snippets);
  console.log(`Done. Total snippets in DB: ${result[0]?.count ?? 0}`);
  process.exit(0);
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
