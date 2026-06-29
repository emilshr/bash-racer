CREATE TABLE "snippets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"content" text NOT NULL,
	"category" text NOT NULL,
	"difficulty" text NOT NULL,
	"char_count" integer NOT NULL,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "snippets_title_unique" UNIQUE("title")
);
