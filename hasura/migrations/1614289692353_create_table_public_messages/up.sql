CREATE TABLE "public"."messages"("id" text NOT NULL DEFAULT gen_random_uuid(), "guest_name" text NOT NULL, "sent_at" timestamptz NOT NULL DEFAULT now(), "content" text NOT NULL, PRIMARY KEY ("id") );
