alter table "public"."messages" add column "created_at" timestamptz
 null default now();
