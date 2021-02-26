ALTER TABLE "public"."messages" ADD COLUMN "created_at" timestamptz;
ALTER TABLE "public"."messages" ALTER COLUMN "created_at" DROP NOT NULL;
ALTER TABLE "public"."messages" ALTER COLUMN "created_at" SET DEFAULT now();
