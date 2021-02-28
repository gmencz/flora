ALTER TABLE "public"."messages" ADD COLUMN "nonce" text NOT NULL UNIQUE DEFAULT gen_random_uuid();
