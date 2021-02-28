ALTER TABLE "public"."messages" ADD COLUMN "guest_id" text NOT NULL DEFAULT gen_random_uuid();
