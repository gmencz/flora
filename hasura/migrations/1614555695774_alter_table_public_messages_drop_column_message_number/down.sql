ALTER TABLE "public"."messages" ADD COLUMN "message_number" int4;
ALTER TABLE "public"."messages" ALTER COLUMN "message_number" DROP NOT NULL;
ALTER TABLE "public"."messages" ALTER COLUMN "message_number" SET DEFAULT nextval('messages_message_number_seq'::regclass);
