CREATE TYPE "public"."image_kind_enum" AS ENUM('photo', 'family_fallback', 'manual');--> statement-breakpoint
CREATE TABLE "component_images" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"component_id" uuid NOT NULL,
	"url" text NOT NULL,
	"thumb_url" text,
	"source_page_url" text,
	"author" varchar(240),
	"license" varchar(80),
	"kind" "image_kind_enum" NOT NULL,
	"width" integer,
	"height" integer,
	CONSTRAINT "component_images_component_id_unique" UNIQUE("component_id")
);
--> statement-breakpoint
ALTER TABLE "component_images" ADD CONSTRAINT "component_images_component_id_components_id_fk" FOREIGN KEY ("component_id") REFERENCES "public"."components"("id") ON DELETE cascade ON UPDATE no action;