CREATE TABLE "lessons" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"course_id" uuid NOT NULL,
	"title" text NOT NULL,
	"content" text NOT NULL,
	"thumbnail_url" text,
	"thumbnail_public_id" text,
	"video_url" text,
	"video_public_id" text,
	"duration" text NOT NULL,
	"visibility" text NOT NULL,
	"status" text NOT NULL,
	"xp_reward" integer NOT NULL,
	"order_index" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
