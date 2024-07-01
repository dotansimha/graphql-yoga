CREATE TABLE IF NOT EXISTS "links" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"description" varchar NOT NULL,
	"url" varchar NOT NULL
);
