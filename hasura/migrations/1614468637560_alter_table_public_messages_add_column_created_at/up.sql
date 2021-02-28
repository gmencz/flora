ALTER TABLE "public"."messages" ADD COLUMN "created_at" timestamptz NULL DEFAULT now();
