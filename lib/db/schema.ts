import { integer, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const snippets = pgTable("snippets", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: text("title").notNull().unique(),
  content: text("content").notNull(),
  category: text("category").notNull(),
  difficulty: text("difficulty").notNull(),
  charCount: integer("char_count").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export type Snippet = typeof snippets.$inferSelect;
export type NewSnippet = typeof snippets.$inferInsert;
