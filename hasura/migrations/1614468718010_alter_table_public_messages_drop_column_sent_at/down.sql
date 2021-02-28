ALTER TABLE "public"."messages" ADD COLUMN "sent_at" timestamptz;
ALTER TABLE "public"."messages" ALTER COLUMN "sent_at" DROP NOT NULL;
ALTER TABLE "public"."messages" ALTER COLUMN "sent_at" SET DEFAULT now();
